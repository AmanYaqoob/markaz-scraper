"""
Sync scraped product JSON files into Supabase.
Run after scraper: python sync_supabase.py

Reads: output/products_*.json
Writes: Supabase categories + products tables
"""

import json
import os
import re
import glob
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv(dotenv_path="website/.env.local")

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "")

# For write access you need the service role key:
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", SUPABASE_KEY)


def slugify(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")


def load_latest_products() -> list[dict]:
    files = sorted(glob.glob("output/products_*.json"), reverse=True)
    if not files:
        # Fall back to progress file
        progress = Path("output/progress.json")
        if progress.exists():
            data = json.loads(progress.read_text())
            return data.get("products", [])
        raise FileNotFoundError("No product JSON files found in output/")

    print(f"Loading products from {files[0]}")
    return json.loads(Path(files[0]).read_text(encoding="utf-8"))


def upsert_categories(sb: Client, products: list[dict]) -> dict[str, str]:
    """Upsert all categories. Returns {name: id} map."""
    names = list({p.get("markaz_category") or p.get("category", "").split(">")[0].strip()
                  for p in products if p.get("markaz_category") or p.get("category")})
    names = [n for n in names if n]

    cat_map: dict[str, str] = {}
    for name in names:
        row = {"name": name, "slug": slugify(name)}
        result = sb.table("categories").upsert(row, on_conflict="slug").execute()
        if result.data:
            cat_map[name] = result.data[0]["id"]

    print(f"Upserted {len(cat_map)} categories.")
    return cat_map


def upsert_products(sb: Client, products: list[dict], cat_map: dict[str, str], batch: int = 50):
    """Upsert all products into Supabase in batches."""
    rows = []
    for p in products:
        cat_name = p.get("markaz_category") or p.get("category", "").split(">")[0].strip() or ""

        row = {
            "name":              p.get("name", ""),
            "ai_title":          p.get("ai_title") or None,
            "sku":               p.get("sku") or None,
            "description":       p.get("description") or None,
            "ai_description":    p.get("ai_description") or None,
            "short_description": p.get("description", "")[:250] if not p.get("ai_short_desc") else None,
            "ai_short_desc":     p.get("ai_short_desc") or None,
            "price":             float(p.get("price", 0) or 0),
            "currency":          p.get("currency", "PKR"),
            "availability":      p.get("availability", "instock"),
            "brand":             p.get("brand") or None,
            "category_id":       cat_map.get(cat_name),
            "category_name":     cat_name or None,
            "markaz_url":        p.get("url") or None,
            "images":            p.get("images", []),
            "tags":              p.get("ai_tags", []),
            "ai_seo_title":      p.get("ai_seo_title") or None,
            "ai_seo_desc":       p.get("ai_seo_desc") or None,
            "is_featured":       False,
        }
        rows.append(row)

    # Upload in batches
    success = fail = 0
    for i in range(0, len(rows), batch):
        chunk = rows[i : i + batch]
        try:
            sb.table("products").upsert(chunk, on_conflict="markaz_url").execute()
            success += len(chunk)
            print(f"  Batch {i//batch + 1}: {len(chunk)} products upserted")
        except Exception as e:
            fail += len(chunk)
            print(f"  Batch {i//batch + 1} FAILED: {e}")

    print(f"Products: {success} upserted, {fail} failed.")


def mark_featured(sb: Client, count: int = 50):
    """Mark the first `count` products from each category as featured."""
    result = sb.table("categories").select("name").execute()
    cats   = [r["name"] for r in (result.data or [])]

    for cat in cats:
        res = sb.table("products").select("id") \
                .eq("category_name", cat) \
                .eq("availability", "instock") \
                .order("created_at", desc=True) \
                .limit(3).execute()
        ids = [r["id"] for r in (res.data or [])]
        if ids:
            sb.table("products").update({"is_featured": True}).in_("id", ids).execute()

    print(f"Featured products marked across {len(cats)} categories.")


def main_sync(products: list[dict] | None = None):
    """Called by main.py after scraping, or standalone with products=None to load from file."""
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        raise ValueError("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set in .env")

    sb = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    print("[sync] Connected to Supabase.")

    if products is None:
        products = load_latest_products()
        print(f"[sync] Loaded {len(products)} products from file.")

    cat_map = upsert_categories(sb, products)
    upsert_products(sb, products, cat_map)
    mark_featured(sb)
    print("[sync] Sync complete!")


def main():
    main_sync()


if __name__ == "__main__":
    main()
