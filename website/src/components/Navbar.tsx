"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, ShoppingBag, Menu, X, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "./CartProvider";

const CATEGORIES = [
  "Cosmetics", "Women's Unstitched", "Women's Stitched", "Men's Unstitched",
  "Men's Stitched", "Kids Clothing", "Shoes", "Bags", "Women's Handbags",
  "Jewellery", "Electronics", "Electronic Accessories", "Fashion Accessories",
  "Home Essentials", "Home Decor", "Kitchenware", "Bedding", "Perfumes",
  "Fitness", "Kids Accessories", "Islamic Accessories", "Mother & Baby",
  "Brands", "Books & Stationery", "Perfumes", "Auto & Bike Accessories",
  "Men's Shawls", "Women's Shawls", "Home Linen", "Unisex Clothing", "Other",
];

export default function Navbar() {
  const { count } = useCart();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [catOpen, setCatOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? "bg-black/95 backdrop-blur-md border-b border-white/5" : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-20 md:h-24">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <Image src="/nr2prwpftxrmr0cy5patyca2d0_preview_0-ezremove.png" alt="DROPSHOP" width={400} height={104} className="h-32 w-[420px] sm:h-40 sm:w-[520px] md:h-48 md:w-[620px] object-contain object-left" />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-8">
            <Link href="/" className="text-xs font-medium tracking-widest uppercase text-white/70 hover:text-white transition-colors">
              Home
            </Link>
            <div
              className="relative"
              onMouseEnter={() => setCatOpen(true)}
              onMouseLeave={() => setCatOpen(false)}
            >
              <button className="flex items-center gap-1 text-xs font-medium tracking-widest uppercase text-white/70 hover:text-white transition-colors">
                Categories <ChevronDown size={12} className={`transition-transform ${catOpen ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence>
                {catOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[640px] bg-[#111] border border-[#222] p-6 grid grid-cols-3 gap-2"
                  >
                    {CATEGORIES.map(cat => (
                      <Link
                        key={cat}
                        href={`/category/${encodeURIComponent(cat)}`}
                        className="text-xs text-white/60 hover:text-white transition-colors py-1 px-2 hover:bg-white/5 rounded"
                        onClick={() => setCatOpen(false)}
                      >
                        {cat}
                      </Link>
                    ))}
                    <Link
                      href="/categories"
                      className="col-span-3 text-center text-xs font-semibold tracking-widest uppercase text-white border-t border-[#222] pt-3 mt-2 hover:text-white/70 transition-colors"
                      onClick={() => setCatOpen(false)}
                    >
                      View All Categories →
                    </Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <Link href="/categories" className="text-xs font-medium tracking-widest uppercase text-white/70 hover:text-white transition-colors">
              All Categories
            </Link>
          </nav>

          {/* Right icons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSearchOpen(v => !v)}
              className="p-2 text-white/60 hover:text-white transition-colors"
              aria-label="Search"
            >
              <Search size={18} />
            </button>
            <Link href="/cart" className="p-2 text-white/60 hover:text-white transition-colors relative">
              <ShoppingBag size={18} />
              {count > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-white text-black text-[9px] font-bold rounded-full flex items-center justify-center">
                  {count}
                </span>
              )}
            </Link>
            <button
              className="lg:hidden p-2 text-white/60 hover:text-white transition-colors"
              onClick={() => setMenuOpen(v => !v)}
            >
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Search bar */}
        <AnimatePresence>
          {searchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden border-t border-white/5 bg-black/95"
            >
              <form
                className="max-w-2xl mx-auto px-4 py-4 flex gap-3"
                onSubmit={e => { e.preventDefault(); if (query) window.location.href = `/search?q=${encodeURIComponent(query)}`; }}
              >
                <input
                  autoFocus
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search products, brands, categories..."
                  className="flex-1 bg-[#141414] border border-[#222] text-white placeholder-white/30 px-4 py-2.5 text-sm focus:outline-none focus:border-white/30"
                />
                <button type="submit" className="btn-primary py-2.5 px-5">Search</button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.3 }}
            className="fixed inset-0 z-40 bg-[#0a0a0a] pt-16 overflow-y-auto"
          >
            <div className="px-6 py-8 space-y-2">
              <p className="text-xs tracking-widest uppercase text-white/30 mb-4">Categories</p>
              {CATEGORIES.map(cat => (
                <Link
                  key={cat}
                  href={`/category/${encodeURIComponent(cat)}`}
                  className="block py-3 border-b border-[#1a1a1a] text-sm text-white/70 hover:text-white transition-colors"
                  onClick={() => setMenuOpen(false)}
                >
                  {cat}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Spacer so page content doesn't go under navbar */}
      <div className="h-20 md:h-24" />
    </>
  );
}
