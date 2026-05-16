"""
Markaz.app scraper — categories + all images + 100 products per category
"""

import asyncio
import re
import ssl
import certifi
import aiohttp
import aiofiles
from pathlib import Path
from playwright.async_api import async_playwright, Page

from config import (
    BASE_URL, CATEGORIES_URL, PRODUCTS_PER_CATEGORY,
    PAGE_DELAY_SEC, PRODUCT_DELAY_SEC, REQUEST_TIMEOUT_MS,
    USER_AGENT, IMAGES_DIR,
)

# ── Browser ───────────────────────────────────────────────────────────────────

async def new_context(playwright):
    browser = await playwright.chromium.launch(
        headless=True,
        args=["--no-sandbox", "--disable-blink-features=AutomationControlled"],
    )
    ctx = await browser.new_context(
        user_agent=USER_AGENT,
        viewport={"width": 1440, "height": 900},
        locale="en-US",
        extra_http_headers={
            "Accept-Language": "en-US,en;q=0.9",
            "Accept": "text/html,application/xhtml+xml,*/*;q=0.8",
        },
    )
    await ctx.add_init_script(
        "Object.defineProperty(navigator, 'webdriver', {get: () => undefined})"
    )
    return browser, ctx


# ── Category discovery ────────────────────────────────────────────────────────

async def discover_categories(page: Page) -> list[dict]:
    """Returns [{name, url}, ...] for every category on markaz.app."""
    print("[scraper] Discovering categories...")
    try:
        await page.goto(CATEGORIES_URL, wait_until="networkidle", timeout=REQUEST_TIMEOUT_MS)
    except Exception as e:
        print(f"  !! categories page error: {e}")

    # Extract top-level /shop/home-page/{Category} links (no subcategory slash)
    cats = await page.evaluate("""
        () => {
            const results = []; const seen = new Set();
            document.querySelectorAll('a[href*="/shop/home-page/"]').forEach(a => {
                const decoded = decodeURIComponent(a.href);
                const after   = decoded.split('/shop/home-page/')[1] || '';
                if (!after.includes('/') && after && !seen.has(after)) {
                    seen.add(after);
                    results.push({ name: after, url: a.href });
                }
            });
            return results;
        }
    """)

    print(f"  Found {len(cats)} categories")
    return cats


# ── Product URL collection ────────────────────────────────────────────────────

async def collect_urls_for_category(page: Page, category: dict, limit: int) -> list[str]:
    """Scrapes listing pages for one category until `limit` unique URLs collected."""
    urls: set[str] = set()
    page_num = 1
    base = category["url"]
    sep  = "&" if "?" in base else "?"

    while len(urls) < limit:
        paginated = f"{base}{sep}page={page_num}" if page_num > 1 else base
        try:
            await page.goto(paginated, wait_until="networkidle", timeout=REQUEST_TIMEOUT_MS)
        except Exception as e:
            print(f"  !! listing page error: {e}")
            break

        links: list[str] = await page.evaluate("""
            () => {
                const anchors = document.querySelectorAll('a[href*="/shop/product/"]');
                return [...new Set([...anchors].map(a => a.href))];
            }
        """)

        if not links:
            break

        before = len(urls)
        urls.update(links)
        if len(urls) == before:   # no new links → end of pagination
            break

        page_num += 1
        await asyncio.sleep(PAGE_DELAY_SEC)

    result = list(urls)[:limit]
    print(f"  [{category['name']}] {len(result)} product URLs collected")
    return result


# ── Per-product scraping ──────────────────────────────────────────────────────

_EXTRACT_JS = """
() => {
    // ── JSON-LD product schema ──────────────────────────────────────────────
    let jsonLd = null;
    for (const s of document.querySelectorAll('script[type="application/ld+json"]')) {
        try {
            const d = JSON.parse(s.textContent);
            if (d['@type'] === 'Product') { jsonLd = d; break; }
        } catch {}
    }

    // Product ID is the last segment of the URL path (e.g. /shop/product/slug/667277)
    const pathParts = window.location.pathname.split('/').filter(Boolean);
    const productId = pathParts[pathParts.length - 1];

    // ── All images from __NEXT_DATA__ (primary — only this product's media) ─
    let images = [];
    try {
        const nd  = window.__NEXT_DATA__;
        const pp  = nd?.props?.pageProps;

        // Search all top-level pageProps keys for a media/images array
        const findMedia = (obj, depth) => {
            if (depth > 5 || !obj || typeof obj !== 'object') return null;
            if (Array.isArray(obj) && obj.length > 0 && (obj[0]?.link || obj[0]?.url)) return obj;
            for (const val of Object.values(obj)) {
                const r = findMedia(val, depth + 1);
                if (r) return r;
            }
            return null;
        };

        const media = pp?.product?.media || pp?.data?.media || findMedia(pp, 0) || [];
        if (media.length > 0) {
            images = media
                .filter(m => m.type !== 'video' && (m.link || m.url) && !(m.link || m.url || '').endsWith('.mp4'))
                .map(m => m.link || m.url);
        }
    } catch {}

    // ── DOM fallback — only images belonging to THIS product (by productId) ─
    if (images.length === 0) {
        const seen = new Set();
        const addSrc = src => {
            if (src && src.includes('static.markaz.app') && src.includes('/products/') && src.includes(productId))
                seen.add(src);
        };
        document.querySelectorAll('img').forEach(img => {
            addSrc(img.src);
            addSrc(img.dataset.src);
            (img.srcset || '').split(',').forEach(p => addSrc(p.trim().split(' ')[0]));
        });
        images = [...seen];
    }

    // ── Category breadcrumbs ────────────────────────────────────────────────
    const crumbs = [...document.querySelectorAll('nav ol li a, [class*="breadcrumb"] a')]
        .map(a => a.textContent.trim()).filter(Boolean);

    return { jsonLd, images, breadcrumbs: crumbs };
}
"""


def _parse_offer(offers):
    if isinstance(offers, list):
        offers = offers[0] if offers else {}
    return offers or {}


async def scrape_product(page: Page, url: str) -> dict | None:
    try:
        await page.goto(url, wait_until="networkidle", timeout=REQUEST_TIMEOUT_MS)
    except Exception as e:
        print(f"  !! load error {url}: {e}")
        return None

    # Scroll to trigger lazy-loaded images
    await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
    await asyncio.sleep(1.2)
    await page.evaluate("window.scrollTo(0, 0)")
    await asyncio.sleep(0.4)

    try:
        data = await page.evaluate(_EXTRACT_JS)
    except Exception as e:
        print(f"  !! eval error {url}: {e}")
        return None

    jl = data.get("jsonLd")
    if not jl:
        return None

    offer = _parse_offer(jl.get("offers", {}))
    brand = jl.get("brand", {})
    brand = brand.get("name", "") if isinstance(brand, dict) else str(brand)

    # Merge JSON-LD single image with gallery images, deduplicated
    jl_img   = jl.get("image", "")
    all_imgs = data.get("images", [])
    if jl_img and jl_img not in all_imgs:
        all_imgs.insert(0, jl_img)
    seen = set(); unique = []
    for img in all_imgs:
        if img and img not in seen:
            seen.add(img); unique.append(img)

    return {
        "name":         jl.get("name", "").strip(),
        "sku":          jl.get("sku", ""),
        "description":  jl.get("description", "").strip(),
        "price":        offer.get("price", ""),
        "currency":     offer.get("priceCurrency", "PKR"),
        "availability": "instock" if "InStock" in offer.get("availability", "") else "outofstock",
        "brand":        brand,
        "category":     " > ".join(data.get("breadcrumbs", [])),
        "url":          url,
        "images":       unique,
        "local_images": [],   # filled by download_images()
        # AI-enhanced fields (filled by ai_enhancer.py)
        "ai_title":       "",
        "ai_description": "",
        "ai_short_desc":  "",
        "ai_tags":        [],
        "ai_seo_title":   "",
        "ai_seo_desc":    "",
    }


# ── Image downloader ──────────────────────────────────────────────────────────

def _slugify(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")


async def _download_one(session: aiohttp.ClientSession, url: str, dest: Path) -> bool:
    if dest.exists():
        return True
    try:
        async with session.get(url, timeout=aiohttp.ClientTimeout(total=20)) as r:
            if r.status == 200:
                async with aiofiles.open(dest, "wb") as f:
                    await f.write(await r.read())
                return True
    except Exception:
        pass
    return False


async def download_images(products: list[dict]):
    """Downloads all images for all products into IMAGES_DIR."""
    IMAGES_DIR.mkdir(parents=True, exist_ok=True)
    headers     = {"User-Agent": USER_AGENT, "Referer": BASE_URL}
    ssl_ctx     = ssl.create_default_context(cafile=certifi.where())
    connector   = aiohttp.TCPConnector(ssl=ssl_ctx)
    async with aiohttp.ClientSession(headers=headers, connector=connector) as session:
        for product in products:
            local = []
            slug  = _slugify(product["name"])[:50]
            for i, img_url in enumerate(product.get("images", [])):
                if not img_url:
                    continue
                ext  = img_url.split(".")[-1].split("?")[0]
                dest = IMAGES_DIR / f"{slug}-{i}.{ext}"
                ok   = await _download_one(session, img_url, dest)
                if ok:
                    local.append(str(dest))
            product["local_images"] = local


# ── Full category scrape (entry point used by main.py) ────────────────────────

async def scrape_categories(
    categories: list[dict] | None = None,
    on_category_done=None,
) -> list[dict]:
    """
    Scrapes up to PRODUCTS_PER_CATEGORY products for every category.
    Calls on_category_done(products_so_far) after each category if provided.
    Returns flat list of all product dicts.
    """
    all_products: list[dict] = []

    async with async_playwright() as pw:
        browser, ctx = await new_context(pw)
        page = await ctx.new_page()

        if categories is None:
            categories = await discover_categories(page)

        for cat_idx, cat in enumerate(categories, 1):
            print(f"\n── Category {cat_idx}/{len(categories)}: {cat['name']} ──")
            urls = await collect_urls_for_category(page, cat, PRODUCTS_PER_CATEGORY)

            cat_products = []
            for i, url in enumerate(urls, 1):
                print(f"  [{i}/{len(urls)}] ", end="", flush=True)
                product = await scrape_product(page, url)
                if product:
                    product["markaz_category"] = cat["name"]
                    cat_products.append(product)
                    print(product["name"][:55])
                else:
                    print(f"skipped: {url}")
                await asyncio.sleep(PRODUCT_DELAY_SEC)

            all_products.extend(cat_products)
            print(f"  Category done: {len(cat_products)} products")

            # Sync this category immediately so products appear on the website
            if on_category_done and cat_products:
                try:
                    on_category_done(cat_products)
                except Exception as e:
                    print(f"  [sync warning] {e}")

        await browser.close()

    print(f"\n[scraper] Downloading images for {len(all_products)} products...")
    await download_images(all_products)
    print("[scraper] Image download complete.")

    return all_products
