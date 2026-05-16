import type { Metadata } from "next";
import Link from "next/link";
import { getCategories } from "@/lib/db";

export const metadata: Metadata = { title: "All Categories" };
export const revalidate = 3600;

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
            className="group border border-[#1a1a1a] bg-[#0d0d0d] hover:border-white/20 hover:bg-[#111] transition-all duration-200 p-6"
          >
            <div className="w-8 h-px bg-white/20 group-hover:bg-white/60 transition-colors mb-4" />
            <p className="text-sm font-bold text-white/70 group-hover:text-white transition-colors uppercase tracking-wider">
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
