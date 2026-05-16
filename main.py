"""
Daily orchestrator — scrape → AI enhance → sync to Supabase → log.
Run once:   python main.py --now
Run daemon: python main.py          (waits for SCRAPE_HOUR daily)
"""

import argparse
import asyncio
import json
import time
from datetime import datetime

import schedule

from config import SCRAPE_HOUR, OUTPUT_DIR, LOGS_DIR, PRODUCTS_PER_CATEGORY, GEMINI_API_KEY
from scraper      import scrape_categories
from ai_enhancer  import enhance_products


def _save_run_log(products: list[dict], synced: int, elapsed: float):
    LOGS_DIR.mkdir(exist_ok=True)
    today    = datetime.now().strftime("%Y-%m-%d")
    log_file = LOGS_DIR / f"{today}.json"
    log = {
        "date":            today,
        "elapsed_minutes": round(elapsed / 60, 1),
        "total_scraped":   len(products),
        "synced_supabase": synced,
        "categories":      list({p.get("markaz_category", "") for p in products}),
        "products": [
            {
                "name":   p.get("ai_title") or p.get("name"),
                "sku":    p.get("sku"),
                "price":  p.get("price"),
                "images": len(p.get("images", [])),
                "url":    p.get("url"),
            }
            for p in products
        ],
    }
    with open(log_file, "w", encoding="utf-8") as f:
        json.dump(log, f, ensure_ascii=False, indent=2)
    print(f"[main] Log saved → {log_file}")


def _save_products_json(products: list[dict]):
    OUTPUT_DIR.mkdir(exist_ok=True)
    today = datetime.now().strftime("%Y-%m-%d")
    out   = OUTPUT_DIR / f"products_{today}.json"
    with open(out, "w", encoding="utf-8") as f:
        json.dump(products, f, ensure_ascii=False, indent=2)
    print(f"[main] Products saved → {out}")


def _sync_supabase(products: list[dict]) -> int:
    try:
        import sync_supabase
        sync_supabase.main_sync(products)
        return len(products)
    except Exception as e:
        print(f"[main] Supabase sync error: {e}")
        return 0


def run_daily_job():
    start = time.time()
    now   = datetime.now().strftime("%Y-%m-%d %H:%M")
    print(f"\n{'='*60}")
    print(f"  DROPSHOP DAILY SCRAPE  —  {now}")
    print(f"{'='*60}")

    # ── 1. Scrape ──────────────────────────────────────────────
    print("\n[1/3] Scraping products from markaz.app...")

    def sync_category(cat_products: list[dict]):
        """Called after each category — pushes products to Supabase immediately."""
        try:
            import sync_supabase
            sb = sync_supabase.create_client(
                sync_supabase.SUPABASE_URL,
                sync_supabase.SUPABASE_SERVICE_KEY,
            )
            cat_map = sync_supabase.upsert_categories(sb, cat_products)
            sync_supabase.upsert_products(sb, cat_products, cat_map)
            print(f"  [live sync] {len(cat_products)} products pushed to Supabase")
        except Exception as e:
            print(f"  [live sync error] {e}")

    try:
        products = asyncio.run(scrape_categories(on_category_done=sync_category))
    except Exception as e:
        print(f"[main] SCRAPE FAILED: {e}")
        return

    if not products:
        print("[main] No products scraped. Exiting.")
        return

    print(f"[main] Scraped {len(products)} products total.")
    _save_products_json(products)

    # ── 2. AI enhancement ──────────────────────────────────────
    if GEMINI_API_KEY:
        print("\n[2/3] AI-enhancing product content with Gemini...")
        try:
            enhance_products(products)
        except Exception as e:
            print(f"[main] AI error (continuing without): {e}")
    else:
        print("\n[2/3] Skipping AI — GEMINI_API_KEY not set.")

    # ── 3. Sync to Supabase ────────────────────────────────────
    print("\n[3/3] Syncing to Supabase...")
    synced = _sync_supabase(products)

    elapsed = time.time() - start
    _save_run_log(products, synced, elapsed)

    print(f"\n{'='*60}")
    print(f"  DONE in {elapsed/60:.1f} min")
    print(f"  Scraped: {len(products)}  |  Synced to Supabase: {synced}")
    print(f"{'='*60}\n")


def main():
    parser = argparse.ArgumentParser(description="DROPSHOP daily scraper")
    parser.add_argument("--now", action="store_true", help="Run immediately")
    args = parser.parse_args()

    if args.now:
        print("Running immediately (--now flag)...")
        run_daily_job()
        return

    print(f"Daemon started. Daily job at {SCRAPE_HOUR}.")
    print(f"AI: {'on' if GEMINI_API_KEY else 'off'} | Products/category: {PRODUCTS_PER_CATEGORY}")
    print("Press Ctrl+C to stop.\n")

    schedule.every().day.at(SCRAPE_HOUR).do(run_daily_job)
    while True:
        schedule.run_pending()
        time.sleep(30)


if __name__ == "__main__":
    main()
