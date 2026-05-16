"use client";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ShoppingBag, ArrowRight } from "lucide-react";

const BADGES = [
  { icon: "🛍️", label: "Trending Products" },
  { icon: "✅", label: "Premium Quality" },
  { icon: "🚚", label: "Fast Delivery" },
  { icon: "🔒", label: "Secure Payment" },
];

export default function HeroBanner() {
  return (
    <section className="relative min-h-[70vw] md:min-h-0 md:h-[50vw] max-h-[800px] flex flex-col overflow-hidden">
      {/* Banner image as background */}
      <div className="absolute inset-0">
        <Image
          src="/upscale_it_2K_202605160327.jpeg"
          alt="DROPSHOP Banner"
          fill
          priority
          className="object-cover object-center"
        />
        {/* Overlay — darken sides where products are, keep center readable */}
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
      </div>

      {/* Content — centered over the empty middle of the banner */}
      <div className="relative flex-1 max-w-7xl mx-auto px-6 flex flex-col items-center justify-center pt-12 pb-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-2xl"
        >
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-xs font-semibold tracking-[0.3em] uppercase text-white/50 mb-4"
          >
            Pakistan's Premium Store
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-6xl sm:text-7xl md:text-8xl font-black uppercase leading-none tracking-tight text-white mb-2"
          >
            <span className="block">Style.</span>
            <span className="block text-white/40">Quality.</span>
            <span className="block">You.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="text-white/60 text-sm md:text-base mt-6 mb-10 leading-relaxed"
          >
            Discover thousands of trending products across 33+ categories — curated daily from top suppliers.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="flex flex-wrap gap-3 justify-center"
          >
            <Link href="/categories" className="btn-primary">
              <ShoppingBag size={16} />
              Shop Now
            </Link>
            <Link href="/categories" className="btn-outline">
              Browse Categories
              <ArrowRight size={16} />
            </Link>
          </motion.div>
        </motion.div>
      </div>

      {/* Trust badges */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.6 }}
        className="relative border-t border-white/10 bg-black/70 backdrop-blur-sm"
      >
        <div className="max-w-7xl mx-auto px-6 py-5 grid grid-cols-2 md:grid-cols-4 gap-4">
          {BADGES.map((b, i) => (
            <motion.div
              key={b.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 + i * 0.1, duration: 0.5 }}
              className="flex items-center gap-3"
            >
              <span className="text-xl">{b.icon}</span>
              <span className="text-xs font-semibold tracking-widest uppercase text-white/70">{b.label}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
