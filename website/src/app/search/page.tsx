import type { Metadata } from "next";
import ProductCard from "@/components/ProductCard";
import { searchProducts } from "@/lib/db";

type Props = { searchParams: { q?: string } };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  return { title: `Search: ${searchParams.q ?? ""}` };
}

export default async function SearchPage({ searchParams }: Props) {
  const q        = searchParams.q ?? "";
  const products = q ? await searchProducts(q) : [];

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="mb-10 border-b border-[#1a1a1a] pb-8">
        <p className="section-subtitle mb-2">Results for</p>
        <h1 className="section-title">&ldquo;{q}&rdquo;</h1>
        <p className="text-white/30 text-sm mt-2">{products.length} products found</p>
      </div>

      {products.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
          {products.map((product, i) => <ProductCard key={product.id} product={product} index={i} />)}
        </div>
      ) : (
        <div className="text-center py-24">
          <p className="text-6xl mb-6">🔍</p>
          <p className="text-white/40 text-lg">No products found for &ldquo;{q}&rdquo;</p>
          <p className="text-white/20 text-sm mt-2">Try a different keyword or browse our categories.</p>
        </div>
      )}
    </div>
  );
}
