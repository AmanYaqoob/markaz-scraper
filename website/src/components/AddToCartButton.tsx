"use client";
import { useState } from "react";
import { ShoppingBag, Check } from "lucide-react";
import { useCart } from "./CartProvider";
import type { Product } from "@/lib/supabase";

export default function AddToCartButton({ product }: { product: Product }) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    if (product.availability !== "instock") return;
    add(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <button
      onClick={handleAdd}
      disabled={product.availability !== "instock"}
      className={`w-full flex items-center justify-center gap-3 py-4 font-semibold uppercase tracking-widest text-sm transition-all duration-200 active:scale-95 ${
        added
          ? "bg-green-500 text-white"
          : product.availability !== "instock"
          ? "bg-[#1a1a1a] text-white/30 cursor-not-allowed"
          : "bg-white text-black hover:bg-neutral-200"
      }`}
    >
      {added ? <Check size={18} /> : <ShoppingBag size={18} />}
      {added ? "Added to Cart!" : product.availability !== "instock" ? "Out of Stock" : "Add to Cart"}
    </button>
  );
}
