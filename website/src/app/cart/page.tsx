"use client";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Trash2, Plus, Minus, ShoppingBag, ArrowLeft } from "lucide-react";
import { useCart } from "@/components/CartProvider";

export default function CartPage() {
  const { items, remove, count } = useCart();

  const total = items.reduce((sum, i) => sum + Number(i.product.price) * i.qty, 0);

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <ShoppingBag size={64} className="mx-auto text-white/10 mb-6" />
          <h1 className="text-2xl font-black uppercase tracking-wider text-white mb-3">
            Your cart is empty
          </h1>
          <p className="text-white/40 text-sm mb-8">
            Looks like you haven&apos;t added anything yet.
          </p>
          <Link href="/categories" className="btn-primary">
            Start Shopping
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="mb-10 flex items-center justify-between border-b border-[#1a1a1a] pb-6">
        <div>
          <p className="section-subtitle mb-1">Your</p>
          <h1 className="section-title">Cart ({count} items)</h1>
        </div>
        <Link href="/categories" className="flex items-center gap-2 text-xs text-white/40 hover:text-white transition-colors uppercase tracking-widest">
          <ArrowLeft size={14} />
          Continue Shopping
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-10">
        {/* Items */}
        <div className="lg:col-span-2 space-y-4">
          <AnimatePresence>
            {items.map(({ product, qty }) => {
              const img   = product.images?.[0] ?? "";
              const title = product.ai_title || product.name;
              return (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 16, height: 0 }}
                  transition={{ duration: 0.25 }}
                  className="flex gap-4 p-4 card-dark"
                >
                  {/* Image */}
                  <Link href={`/product/${product.id}`} className="flex-none w-20 h-20 bg-[#1a1a1a] relative overflow-hidden">
                    {img && <Image src={img} alt={title} fill sizes="80px" className="object-cover" />}
                  </Link>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <Link href={`/product/${product.id}`} className="text-sm font-medium text-white hover:text-white/70 transition-colors line-clamp-2">
                      {title}
                    </Link>
                    {product.brand && (
                      <p className="text-[11px] text-white/30 mt-0.5">{product.brand}</p>
                    )}
                    <p className="text-sm font-bold text-white mt-2">
                      PKR {(Number(product.price) * qty).toLocaleString()}
                    </p>
                  </div>

                  {/* Qty + Remove */}
                  <div className="flex flex-col items-end justify-between">
                    <button
                      onClick={() => remove(product.id)}
                      className="p-1.5 text-white/20 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                    <div className="flex items-center gap-2 border border-[#2a2a2a] px-2 py-1">
                      <span className="text-sm font-semibold text-white w-4 text-center">{qty}</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Order summary */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="card-dark p-6 h-fit"
        >
          <h2 className="text-sm font-black uppercase tracking-widest text-white mb-6">
            Order Summary
          </h2>

          <div className="space-y-3 text-sm mb-6">
            <div className="flex justify-between text-white/50">
              <span>Subtotal ({count} items)</span>
              <span>PKR {total.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-white/50">
              <span>Shipping</span>
              <span className="text-green-400">Free</span>
            </div>
            <div className="border-t border-[#222] pt-3 flex justify-between font-bold text-white text-base">
              <span>Total</span>
              <span>PKR {total.toLocaleString()}</span>
            </div>
          </div>

          <Link href="/checkout" className="btn-primary w-full justify-center">
            Proceed to Checkout
          </Link>

          <div className="mt-4 flex justify-center gap-3 text-[10px] text-white/20 uppercase tracking-wider">
            <span>🔒 Secure</span>
            <span>🚚 Fast Delivery</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
