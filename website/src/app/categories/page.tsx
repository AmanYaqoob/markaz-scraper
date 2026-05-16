import type { Metadata } from "next";
import Link from "next/link";
import { getCategories } from "@/lib/db";

export const metadata: Metadata = { title: "All Categories" };
export const revalidate = 3600;

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

export default async function CategoriesPage() {
  const categories = await getCategories();

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="mb-12">
        <p className="section-subtitle mb-2">Explore</p>
        <h1 className="section-title">All Categories</h1>
        <p className="text-white/40 text-sm mt-3">{categories.length} categories available</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {categories.map(cat => (
          <Link
            key={cat.id}
            href={`/category/${encodeURIComponent(cat.name)}`}
            className="group card-dark p-6 text-center transition-all duration-300 hover:scale-105"
          >
            <div className="text-4xl mb-4 transition-transform duration-300 group-hover:scale-110">
              {CATEGORY_EMOJIS[cat.name] ?? "🛍️"}
            </div>
            <p className="text-sm font-semibold text-white/80 group-hover:text-white transition-colors">
              {cat.name}
            </p>
            {cat.product_count > 0 && (
              <p className="text-[11px] text-white/25 mt-2">{cat.product_count} products</p>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
