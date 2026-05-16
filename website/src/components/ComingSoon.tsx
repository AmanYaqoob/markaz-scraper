"use client";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

export default function ComingSoon() {
  return (
    <section className="py-32 px-4 text-center">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
          className="inline-block mb-8"
        >
          <Loader2 size={40} className="text-white/20" />
        </motion.div>
        <h2 className="text-3xl font-black uppercase tracking-wider text-white mb-4">
          Stocking Up
        </h2>
        <p className="text-white/40 text-sm max-w-md mx-auto leading-relaxed">
          We&apos;re scraping and loading thousands of products right now.
          Check back in a few hours — your store will be fully stocked.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row justify-center gap-6 sm:gap-8 text-center">
          {[["33", "Categories"], ["3,300+", "Products"], ["AI", "Enhanced"]].map(([num, label]) => (
            <div key={label}>
              <p className="text-2xl font-black text-white">{num}</p>
              <p className="text-[11px] text-white/30 uppercase tracking-widest mt-1">{label}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
