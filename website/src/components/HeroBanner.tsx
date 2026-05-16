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
      <div className="absolute inset-0">
        <Image
          src="/upscale_it_2K_202605160327.jpeg"
          alt="DROPSHOP Banner"
          fill
          priority
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
      </div>

      <div className="relative flex-1 max-w-7xl mx-auto px-6 flex flex-col items-center justify-center pt-12 pb-24 text-center">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold tracking-[0.3em] uppercase text-white/50 mb-4 animate-fade-in">
            Pakistan's Premium Store
          </p>
          <h1 className="text-6xl sm:text-7xl md:text-8xl font-black uppercase leading-none tracking-tight text-white mb-2">
            <span className="block animate-fade-up stagger-1">Style.</span>
            <span className="block text-white/40 animate-fade-up stagger-2">Quality.</span>
            <span className="block animate-fade-up stagger-3">You.</span>
          </h1>
          <p className="text-white/60 text-sm md:text-base mt-6 mb-10 leading-relaxed animate-fade-up stagger-4">
            Discover thousands of trending products across 33+ categories — curated daily from top suppliers.
          </p>
          <div className="flex flex-wrap gap-3 justify-center animate-fade-up stagger-5">
            <Link href="/categories" className="btn-primary">
              <ShoppingBag size={16} />
              Shop Now
            </Link>
            <Link href="/categories" className="btn-outline">
              Browse Categories
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>

      <div className="relative border-t border-white/10 bg-black/70 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-5 grid grid-cols-2 md:grid-cols-4 gap-4">
          {BADGES.map((b) => (
            <div key={b.label} className="flex items-center gap-3">
              <span className="text-xl">{b.icon}</span>
              <span className="text-xs font-semibold tracking-widest uppercase text-white/70">{b.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
