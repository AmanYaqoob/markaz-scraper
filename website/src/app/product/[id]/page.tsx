import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ShoppingBag, Star, Package } from "lucide-react";
import ImageGallery from "@/components/ImageGallery";
import ProductCard from "@/components/ProductCard";
import AddToCartButton from "@/components/AddToCartButton";
import { getProductById, getRelatedProducts } from "@/lib/db";

export const revalidate = 3600;

type Props = { params: { id: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getProductById(params.id);
  if (!product) return {};
  return {
    title: product.ai_title || product.name,
    description: product.short_description || product.ai_seo_desc || product.description?.slice(0, 160),
  };
}

export default async function ProductPage({ params }: Props) {
  const product = await getProductById(params.id);
  if (!product) notFound();

  const related = await getRelatedProducts(product.category_name ?? "", product.id, 6);
  const title   = product.ai_title || product.name;
  const desc    = product.ai_description || product.description || "";

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {/* Breadcrumb */}
      <nav className="mb-8 text-xs text-white/30 flex items-center gap-2">
        <Link href="/" className="hover:text-white transition-colors">Home</Link>
        <span>/</span>
        {product.category_name && (
          <>
            <Link href={`/category/${encodeURIComponent(product.category_name)}`} className="hover:text-white transition-colors">
              {product.category_name}
            </Link>
            <span>/</span>
          </>
        )}
        <span className="text-white/60 truncate max-w-[200px]">{title}</span>
      </nav>

      {/* Product layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20">
        {/* Gallery */}
        <ImageGallery images={product.images} name={title} />

        {/* Info */}
        <div className="flex flex-col">
          {product.brand && (
            <p className="text-xs font-semibold tracking-widest uppercase text-white/30 mb-2">{product.brand}</p>
          )}
          <h1 className="text-2xl md:text-3xl font-bold text-white leading-tight mb-4">{title}</h1>

          <div className="flex items-center gap-4 mb-6">
            <span className="text-3xl font-black text-white">PKR {Number(product.price).toLocaleString()}</span>
            {product.availability === "instock" ? (
              <span className="flex items-center gap-1.5 text-green-400 text-xs font-semibold uppercase tracking-wider">
                <Package size={12} /> In Stock
              </span>
            ) : (
              <span className="text-red-400 text-xs font-semibold uppercase tracking-wider">Out of Stock</span>
            )}
          </div>

          {product.short_description && (
            <p className="text-white/60 text-sm leading-relaxed mb-6 border-b border-[#1a1a1a] pb-6">
              {product.ai_short_desc || product.short_description}
            </p>
          )}

          {product.sku && (
            <p className="text-xs text-white/25 mb-6">SKU: {product.sku}</p>
          )}

          {/* Tags */}
          {product.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-8">
              {product.tags.slice(0, 8).map(tag => (
                <span key={tag} className="text-[10px] uppercase tracking-wider px-2.5 py-1 border border-[#222] text-white/30">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Cart button */}
          <AddToCartButton product={product} />

          {/* View on Markaz */}
          {product.markaz_url && (
            <a
              href={product.markaz_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 text-xs text-white/20 hover:text-white/50 transition-colors text-center"
            >
              View source ↗
            </a>
          )}

          {/* Trust badges */}
          <div className="mt-8 pt-6 border-t border-[#1a1a1a] grid grid-cols-3 gap-4 text-center">
            {[["🚚", "Fast Delivery"], ["🔒", "Secure Payment"], ["✅", "Quality Assured"]].map(([icon, label]) => (
              <div key={label}>
                <div className="text-2xl mb-1">{icon}</div>
                <p className="text-[10px] text-white/30 uppercase tracking-wider">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Description */}
      {desc && (
        <div className="mb-20 border-t border-[#1a1a1a] pt-12">
          <h2 className="section-title mb-6">Product Details</h2>
          <div
            className="prose prose-invert prose-sm max-w-none text-white/60 leading-relaxed [&_ul]:pl-5 [&_li]:mb-1"
            dangerouslySetInnerHTML={{ __html: desc }}
          />
        </div>
      )}

      {/* Related */}
      {related.length > 0 && (
        <div className="border-t border-[#1a1a1a] pt-12">
          <h2 className="section-title mb-8">You May Also Like</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {related.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
          </div>
        </div>
      )}
    </div>
  );
}
