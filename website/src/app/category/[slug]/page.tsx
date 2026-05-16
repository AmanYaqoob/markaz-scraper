import type { Metadata } from "next";
import ProductCard from "@/components/ProductCard";
import { getProductsByCategory } from "@/lib/db";
import Link from "next/link";

export const revalidate = 3600;

type Props = { params: { slug: string }; searchParams: { page?: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const name = decodeURIComponent(params.slug);
  return { title: name, description: `Shop ${name} products at DROPSHOP.` };
}

const PER_PAGE = 24;

export default async function CategoryPage({ params, searchParams }: Props) {
  const name    = decodeURIComponent(params.slug);
  const page    = Number(searchParams.page ?? 1);
  const { products, total } = await getProductsByCategory(name, page, PER_PAGE);

  const totalPages = Math.ceil(total / PER_PAGE);

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="mb-10 border-b border-[#1a1a1a] pb-8">
        <Link href="/categories" className="text-xs text-white/30 hover:text-white/60 transition-colors tracking-widest uppercase mb-4 inline-block">
          ← All Categories
        </Link>
        <h1 className="section-title mt-2">{name}</h1>
        <p className="text-white/30 text-sm mt-2">{total} products</p>
      </div>

      {/* Empty state */}
      {products.length === 0 && (
        <div className="py-24 text-center">
          <p className="text-4xl mb-6">🛍️</p>
          <h2 className="text-xl font-black uppercase tracking-wider text-white mb-3">
            Stocking Up
          </h2>
          <p className="text-white/40 text-sm max-w-sm mx-auto leading-relaxed">
            Products for <span className="text-white/70">{name}</span> are being loaded right now. Check back in a little while.
          </p>
          <Link href="/categories" className="inline-block mt-8 text-xs text-white/40 hover:text-white transition-colors tracking-widest uppercase">
            ← Back to Categories
          </Link>
        </div>
      )}

      {/* Product grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
        {products.map((product, i) => (
          <ProductCard key={product.id} product={product} index={i} />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-16 flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <Link
              key={p}
              href={`/category/${params.slug}?page=${p}`}
              className={`w-10 h-10 flex items-center justify-center text-sm border transition-colors ${
                p === page
                  ? "bg-white text-black border-white font-bold"
                  : "border-[#222] text-white/50 hover:border-white/30 hover:text-white"
              }`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
