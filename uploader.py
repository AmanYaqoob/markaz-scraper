"""
Upload scraped products to your website.
Supported platforms: WooCommerce, Shopify.
Configure WEBSITE_PLATFORM in .env
"""

import json
import mimetypes
from pathlib import Path

import requests
from requests.auth import HTTPBasicAuth

from config import (
    WEBSITE_PLATFORM,
    WC_URL, WC_CONSUMER_KEY, WC_CONSUMER_SECRET,
    SHOPIFY_STORE, SHOPIFY_TOKEN,
    UPLOADED_FILE,
)


# ── Uploaded-ID tracker ───────────────────────────────────────────────────────

def load_uploaded_ids() -> set[str]:
    if UPLOADED_FILE.exists():
        with open(UPLOADED_FILE) as f:
            return set(json.load(f))
    return set()


def save_uploaded_ids(ids: set[str]):
    UPLOADED_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(UPLOADED_FILE, "w") as f:
        json.dump(list(ids), f)


# ── WooCommerce ───────────────────────────────────────────────────────────────

class WooCommerceUploader:
    def __init__(self):
        if not WC_URL or not WC_CONSUMER_KEY:
            raise ValueError("WC_URL / WC_CONSUMER_KEY / WC_CONSUMER_SECRET not set in .env")
        self.base    = f"{WC_URL}/wp-json/wc/v3"
        self.wp_base = f"{WC_URL}/wp-json/wp/v2"
        self.auth    = HTTPBasicAuth(WC_CONSUMER_KEY, WC_CONSUMER_SECRET)
        self._cat_cache: dict[str, int] = {}

    def _get_or_create_category(self, name: str) -> int:
        if name in self._cat_cache:
            return self._cat_cache[name]
        r = requests.get(
            f"{self.base}/products/categories",
            params={"search": name, "per_page": 5},
            auth=self.auth, timeout=15,
        )
        for cat in r.json():
            if cat["name"].lower() == name.lower():
                self._cat_cache[name] = cat["id"]
                return cat["id"]
        # Create it
        r = requests.post(
            f"{self.base}/products/categories",
            json={"name": name},
            auth=self.auth, timeout=15,
        )
        cid = r.json()["id"]
        self._cat_cache[name] = cid
        return cid

    def _upload_image(self, local_path: str) -> dict | None:
        path = Path(local_path)
        if not path.exists():
            return None
        mime = mimetypes.guess_type(str(path))[0] or "image/webp"
        with open(path, "rb") as f:
            r = requests.post(
                f"{self.wp_base}/media",
                headers={
                    "Content-Disposition": f'attachment; filename="{path.name}"',
                    "Content-Type": mime,
                },
                data=f.read(),
                auth=self.auth, timeout=30,
            )
        if r.status_code in (200, 201):
            return {"src": r.json()["source_url"]}
        return None

    def upload_product(self, product: dict) -> bool:
        # Build category list
        cat_ids = []
        raw_cat = product.get("markaz_category") or product.get("category", "")
        for part in raw_cat.split(">"):
            name = part.strip()
            if name:
                try:
                    cat_ids.append({"id": self._get_or_create_category(name)})
                except Exception:
                    pass

        # Upload images
        wc_images = []
        for local_path in product.get("local_images", []):
            img = self._upload_image(local_path)
            if img:
                wc_images.append(img)
        # Fallback: use remote URLs directly
        if not wc_images:
            wc_images = [{"src": u} for u in product.get("images", [])[:10]]

        name = product.get("ai_title") or product.get("name", "")
        desc = product.get("ai_description") or product.get("description", "")
        short = product.get("ai_short_desc", "")

        payload = {
            "name":              name,
            "type":              "simple",
            "status":            "publish",
            "description":       desc,
            "short_description": short,
            "sku":               product.get("sku", ""),
            "regular_price":     str(product.get("price", "")),
            "stock_status":      product.get("availability", "instock"),
            "images":            wc_images,
            "categories":        cat_ids,
            "tags":              [{"name": t} for t in product.get("ai_tags", [])],
            "meta_data": [
                {"key": "_yoast_wpseo_title",    "value": product.get("ai_seo_title", "")},
                {"key": "_yoast_wpseo_metadesc", "value": product.get("ai_seo_desc", "")},
                {"key": "markaz_url",            "value": product.get("url", "")},
            ],
        }
        if product.get("brand"):
            payload["meta_data"].append({"key": "brand", "value": product["brand"]})

        r = requests.post(f"{self.base}/products", json=payload, auth=self.auth, timeout=30)
        return r.status_code in (200, 201)


# ── Shopify ───────────────────────────────────────────────────────────────────

class ShopifyUploader:
    def __init__(self):
        if not SHOPIFY_STORE or not SHOPIFY_TOKEN:
            raise ValueError("SHOPIFY_STORE / SHOPIFY_ACCESS_TOKEN not set in .env")
        self.base    = f"https://{SHOPIFY_STORE}/admin/api/2024-01"
        self.headers = {
            "X-Shopify-Access-Token": SHOPIFY_TOKEN,
            "Content-Type": "application/json",
        }

    def upload_product(self, product: dict) -> bool:
        name  = product.get("ai_title") or product.get("name", "")
        desc  = product.get("ai_description") or product.get("description", "")
        price = str(product.get("price", "0"))
        images = [{"src": u} for u in product.get("images", [])[:10]]

        payload = {
            "product": {
                "title":        name,
                "body_html":    desc,
                "vendor":       product.get("brand", ""),
                "product_type": product.get("markaz_category", ""),
                "tags":         ", ".join(product.get("ai_tags", [])),
                "images":       images,
                "variants": [{
                    "price":        price,
                    "sku":          product.get("sku", ""),
                    "inventory_management": "shopify",
                    "inventory_quantity": 100,
                }],
            }
        }
        r = requests.post(
            f"{self.base}/products.json", json=payload,
            headers=self.headers, timeout=30,
        )
        return r.status_code in (200, 201)


# ── Public API ────────────────────────────────────────────────────────────────

def get_uploader():
    if WEBSITE_PLATFORM == "shopify":
        return ShopifyUploader()
    return WooCommerceUploader()   # default


def upload_products(products: list[dict]) -> tuple[int, int]:
    """
    Uploads products that haven't been uploaded yet (tracked by markaz URL).
    Returns (success_count, skip_count).
    """
    if not products:
        return 0, 0

    uploader     = get_uploader()
    uploaded_ids = load_uploaded_ids()

    success = skip = fail = 0
    for product in products:
        uid = product.get("url", "")
        if uid in uploaded_ids:
            skip += 1
            continue
        try:
            ok = uploader.upload_product(product)
            if ok:
                uploaded_ids.add(uid)
                success += 1
                print(f"  uploaded: {product.get('ai_title') or product.get('name', '')[:50]}")
            else:
                fail += 1
                print(f"  failed:   {product.get('name', '')[:50]}")
        except Exception as e:
            fail += 1
            print(f"  error:    {product.get('name', '')[:50]} — {e}")

    save_uploaded_ids(uploaded_ids)
    print(f"[uploader] done — {success} uploaded, {skip} skipped, {fail} failed")
    return success, skip
