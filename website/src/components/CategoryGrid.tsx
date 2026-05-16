import Link from "next/link";
import type { Category } from "@/lib/supabase";

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
            className="group block border border-[#1a1a1a] bg-[#0d0d0d] hover:border-white/20 hover:bg-[#111] transition-all duration-200 p-5"
          >
            <div className="w-6 h-px bg-white/20 group-hover:bg-white/60 transition-colors mb-4" />
            <p className="text-xs font-bold text-white/70 group-hover:text-white transition-colors leading-tight uppercase tracking-wider">
              {cat.name}
            </p>
            {cat.product_count > 0 && (
              <p className="text-[10px] text-white/20 mt-2">{cat.product_count} items</p>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}
