"""
AI product enhancement using Google Gemini 2.5 Flash.
Rewrites titles, descriptions, generates tags and SEO fields.
"""

import json
from google import genai
from google.genai import types

from config import GEMINI_API_KEY, AI_MODEL, AI_BATCH_SIZE

_client = None

def _get_client() -> genai.Client:
    global _client
    if _client is None:
        if not GEMINI_API_KEY:
            raise ValueError("GEMINI_API_KEY not set in .env")
        _client = genai.Client(api_key=GEMINI_API_KEY)
    return _client


_SYSTEM_PROMPT = """\
You are an expert e-commerce copywriter specializing in Pakistani products.
Given raw product data scraped from a supplier website, return ONLY a valid JSON array
where each element corresponds to one input product in the same order.

Each element must have exactly these keys:
- "title"             : SEO-optimized product title, 50–80 chars, proper title case
- "description"       : HTML product description (2–3 paragraphs + bullet list <ul><li>), 200–350 words
- "short_description" : 1–2 sentence compelling teaser, under 150 chars
- "tags"              : array of 5–8 relevant keyword strings
- "seo_title"         : meta title, 50–60 chars
- "seo_description"   : meta description, 120–160 chars

Rules:
- Write in clear, fluent English.
- Do not invent specs you cannot confirm from the input.
- Return ONLY the JSON array — no markdown fences, no explanation text."""


def _build_prompt(products: list[dict]) -> str:
    slim = [
        {
            "name":        p.get("name", ""),
            "description": p.get("description", ""),
            "brand":       p.get("brand", ""),
            "category":    p.get("markaz_category") or p.get("category", ""),
            "price":       p.get("price", ""),
            "currency":    p.get("currency", "PKR"),
        }
        for p in products
    ]
    return f"{_SYSTEM_PROMPT}\n\nProducts to enhance:\n{json.dumps(slim, ensure_ascii=False)}"


def _apply(products: list[dict], enhancements: list[dict]):
    for product, enh in zip(products, enhancements):
        product["ai_title"]       = enh.get("title",             product["name"])
        product["ai_description"] = enh.get("description",       product.get("description", ""))
        product["ai_short_desc"]  = enh.get("short_description", "")
        product["ai_tags"]        = enh.get("tags",              [])
        product["ai_seo_title"]   = enh.get("seo_title",         "")
        product["ai_seo_desc"]    = enh.get("seo_description",   "")


def enhance_products(products: list[dict]) -> list[dict]:
    """Enhances all products with Gemini AI in batches. Returns products (modified in-place)."""
    if not products:
        return products

    client = _get_client()
    total  = len(products)
    print(f"[ai] Enhancing {total} products with {AI_MODEL}, batch size {AI_BATCH_SIZE}...")

    for start in range(0, total, AI_BATCH_SIZE):
        batch = products[start : start + AI_BATCH_SIZE]
        print(f"  Batch {start // AI_BATCH_SIZE + 1}: products {start + 1}–{start + len(batch)}")

        try:
            resp = client.models.generate_content(
                model=AI_MODEL,
                contents=_build_prompt(batch),
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    temperature=0.7,
                ),
            )
            raw = resp.text.strip()

            # Strip markdown fences if model adds them
            if raw.startswith("```"):
                raw = raw.split("\n", 1)[1].rsplit("```", 1)[0]

            enhancements = json.loads(raw)
            if isinstance(enhancements, list) and len(enhancements) == len(batch):
                _apply(batch, enhancements)
                print(f"    OK — {len(batch)} products enhanced")
            else:
                print(f"    !! Length mismatch ({len(enhancements)} vs {len(batch)}), skipping")

        except json.JSONDecodeError as e:
            print(f"    !! JSON parse error: {e}")
        except Exception as e:
            print(f"    !! Gemini error: {e}")

    print("[ai] Enhancement complete.")
    return products
