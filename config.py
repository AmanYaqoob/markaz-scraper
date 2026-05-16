import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

# ── Markaz scraping ───────────────────────────────────────────────────────────
BASE_URL             = "https://www.markaz.app"
SHOP_URL             = f"{BASE_URL}/shop"
CATEGORIES_URL       = f"{BASE_URL}/shop/categories"
PRODUCTS_PER_CATEGORY = 100
PAGE_DELAY_SEC       = 2.5
PRODUCT_DELAY_SEC    = 2.0
REQUEST_TIMEOUT_MS   = 35_000
SCRAPE_HOUR          = "02:00"   # daily run time (24h format)

USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/124.0.0.0 Safari/537.36"
)

# ── AI enhancement (Gemini) ───────────────────────────────────────────────────
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
AI_MODEL       = "gemini-2.5-flash"   # fast + cheap for bulk
AI_BATCH_SIZE  = 8                    # products per API call

# ── Supabase ──────────────────────────────────────────────────────────────────
SUPABASE_URL          = os.getenv("NEXT_PUBLIC_SUPABASE_URL", "")
SUPABASE_ANON_KEY     = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "")
SUPABASE_SERVICE_KEY  = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

# ── Local paths ───────────────────────────────────────────────────────────────
OUTPUT_DIR    = Path("output")
IMAGES_DIR    = OUTPUT_DIR / "images"
LOGS_DIR      = Path("logs")
UPLOADED_FILE = OUTPUT_DIR / "uploaded_ids.json"  # tracks uploaded products
PROGRESS_FILE = OUTPUT_DIR / "progress.json"
