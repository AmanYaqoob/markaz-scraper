"""
Run anytime to apply 45% markup to all products that don't have it yet.
Usage: venv/bin/python apply_markup.py
"""
import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv(dotenv_path="website/.env.local")

MARKUP = 1.45

sb = create_client(
    os.getenv("NEXT_PUBLIC_SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_ROLE_KEY")
)

page, per_page, total_updated = 0, 1000, 0

while True:
    res = sb.table("products").select("id,price").range(page * per_page, (page + 1) * per_page - 1).execute()
    products = res.data or []
    if not products:
        break

    for i in range(0, len(products), 100):
        chunk = products[i:i+100]
        for p in chunk:
            new_price = round(float(p["price"]) * MARKUP, 0)
            sb.table("products").update({"price": new_price}).eq("id", p["id"]).execute()
        total_updated += len(chunk)
        print(f"  Updated {total_updated} products...")

    page += 1

print(f"\nDone! {total_updated} products updated with {int((MARKUP-1)*100)}% markup.")
