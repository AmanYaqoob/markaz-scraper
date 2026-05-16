"use client";
import Link from "next/link";
import type { Category } from "@/lib/supabase";

const CATEGORY_EMOJIS: Record<string, string> = {
  "Cosmetics": "💄", "Women's Unstitched": "👗", "Women's Stitched": "👘",
  "Men's Unstitched": "👔", "Men's Stitched": "🥻", "Kids Clothing": "👶",
  "Women's Handbags": "👜", "Shoes": "👟", "Bags": "🎒",
  "Jewellery": "💍", "Electronics": "📱", "Electronic Accessories": "🎧",
  "Fashion Accessories": "🕶️", "Home Essentials": "🏠", "Home Decor": "🪴",
  "Kitchenware": "🍳", "Bedding": "🛏️", "Perfumes": "🌹",
  "Fitness": "💪", "Kids Accessories": "🧸", "Islamic Accessories": "☪️",
  "Mother & Baby": "🍼", "Brands": "⭐", "Books & Stationery": "📚",
  "Auto & Bike Accessories": "🚗", "Men's Shawls": "🧣", "Women's Shawls": "🧤",
  "Home Linen": "🛋️", "Unisex Clothing": "🧥", "Festive Collection": "🎉",
  "Other": "🛍️",
};

export default function CategoryGrid({ categories }: { categories: Category[] }) {
  return (
    <section className="py-20 px-4 max-w-7xl mx-auto">
      <div className="mb-12 flex items-end justify-between">
        <div>
          <p className="section-subtitle mb-2">Browse</p>
          <h2 className="section-title">Shop By Category</h2>
        </div>
        <Link href="/categories" className="text-xs font-semibold tracking-widest uppercase text-white/40 hover:text-white transition-colors">
          View All →
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/category/${encodeURIComponent(cat.name)}`}
            className="group block card-dark p-4 text-center hover:bg-white/5 transition-colors duration-200"
          >
            <div className="text-3xl mb-3">
              {CATEGORY_EMOJIS[cat.name] ?? "🛍️"}
            </div>
            <p className="text-xs font-semibold text-white/70 group-hover:text-white transition-colors leading-tight">
              {cat.name}
            </p>
            {cat.product_count > 0 && (
              <p className="text-[10px] text-white/25 mt-1">{cat.product_count} items</p>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}
