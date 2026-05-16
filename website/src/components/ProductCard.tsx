"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ShoppingBag, Eye } from "lucide-react";
import { useCart } from "./CartProvider";
import type { Product } from "@/lib/supabase";

export default function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const { add } = useCart();
  const router = useRouter();
  const [hovered, setHovered] = useState(false);
  const [added, setAdded] = useState(false);

  const title  = product.ai_title || product.name;
  const img    = product.images?.[0] ?? "";
  const img2   = product.images?.[1] ?? img;

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    add(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: (index % 6) * 0.07 }}
    >
      <Link href={`/product/${product.id}`} className="group block">
        <div
          className="relative overflow-hidden bg-[#141414] aspect-square mb-3"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          {/* Product image */}
          {img ? (
            <>
              <Image
                src={img}
                alt={title}
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                className={`object-cover transition-all duration-500 ${hovered && img2 !== img ? "opacity-0" : "opacity-100"}`}
              />
              {img2 !== img && (
                <Image
                  src={img2}
                  alt={title}
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className={`object-cover transition-all duration-500 absolute inset-0 ${hovered ? "opacity-100" : "opacity-0"}`}
                />
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-[#1a1a1a]">
              <ShoppingBag size={32} className="text-white/20" />
            </div>
          )}

          {/* Featured badge */}
          {product.is_featured && (
            <div className="absolute top-2 left-2 bg-white text-black text-[9px] font-black tracking-widest uppercase px-2 py-0.5">
              Featured
            </div>
          )}

          {/* Overlay — always visible on touch, hover on desktop */}
          <motion.div
            initial={false}
            animate={{ opacity: hovered ? 1 : 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/40 items-end p-3 gap-2 hidden md:flex"
          >
            <button
              onClick={handleAdd}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold tracking-wider uppercase transition-colors ${
                added ? "bg-green-500 text-white" : "bg-white text-black hover:bg-neutral-200"
              }`}
            >
              <ShoppingBag size={14} />
              {added ? "Added!" : "Add to Cart"}
            </button>
            <button
              onClick={e => { e.preventDefault(); e.stopPropagation(); router.push(`/product/${product.id}`); }}
              className="p-2 bg-white/10 border border-white/20 text-white hover:bg-white hover:text-black transition-colors"
            >
              <Eye size={14} />
            </button>
          </motion.div>

          {/* Mobile add to cart button — always visible */}
          <button
            onClick={handleAdd}
            className={`absolute bottom-0 left-0 right-0 md:hidden flex items-center justify-center gap-1.5 py-2 text-[10px] font-semibold tracking-wider uppercase transition-colors ${
              added ? "bg-green-500 text-white" : "bg-black/70 text-white"
            }`}
          >
            <ShoppingBag size={12} />
            {added ? "Added!" : "Add to Cart"}
          </button>
        </div>

        {/* Info */}
        <div>
          <p className="text-[10px] text-white/30 uppercase tracking-widest mb-1 truncate">
            {product.brand || product.category_name || ""}
          </p>
          <h3 className="text-sm font-medium text-white/90 group-hover:text-white transition-colors line-clamp-2 leading-snug mb-2">
            {title}
          </h3>
          <p className="text-sm font-bold text-white">
            PKR {Number(product.price).toLocaleString()}
          </p>
        </div>
      </Link>
    </motion.div>
  );
}
