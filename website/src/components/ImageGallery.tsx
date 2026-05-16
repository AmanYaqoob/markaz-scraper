"use client";
import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ZoomIn, X, ChevronLeft, ChevronRight } from "lucide-react";

export default function ImageGallery({ images, name }: { images: string[]; name: string }) {
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [lb, setLb] = useState(0);

  if (!images.length) return null;

  const openLightbox = (i: number) => { setLb(i); setLightbox(true); };
  const prev = () => setLb(v => (v - 1 + images.length) % images.length);
  const next = () => setLb(v => (v + 1) % images.length);

  return (
    <>
      <div className="flex flex-col gap-3">
        {/* Main image */}
        <div
          className="relative aspect-square bg-[#141414] overflow-hidden cursor-zoom-in group"
          onClick={() => openLightbox(active)}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="absolute inset-0"
            >
              <Image
                src={images[active]}
                alt={`${name} - image ${active + 1}`}
                fill
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-contain"
              />
            </motion.div>
          </AnimatePresence>
          <div className="absolute top-3 right-3 bg-black/50 p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <ZoomIn size={16} className="text-white" />
          </div>
          <div className="absolute bottom-3 right-3 bg-black/50 px-2 py-1 text-[10px] text-white/70">
            {active + 1} / {images.length}
          </div>
        </div>

        {/* Thumbnails */}
        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {images.map((img, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                className={`flex-none w-16 h-16 relative overflow-hidden border-2 transition-colors ${
                  i === active ? "border-white" : "border-[#222] hover:border-white/40"
                }`}
              >
                <Image src={img} alt="" fill sizes="64px" className="object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
          >
            <button
              onClick={() => setLightbox(false)}
              className="absolute top-4 right-4 p-2 text-white/60 hover:text-white"
            >
              <X size={24} />
            </button>
            <button onClick={prev} className="absolute left-4 p-2 text-white/60 hover:text-white">
              <ChevronLeft size={28} />
            </button>
            <button onClick={next} className="absolute right-4 p-2 text-white/60 hover:text-white">
              <ChevronRight size={28} />
            </button>
            <div className="relative w-full max-w-3xl aspect-square px-4 sm:px-16">
              <Image src={images[lb]} alt={name} fill className="object-contain" />
            </div>
            <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-xs text-white/40">
              {lb + 1} / {images.length}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
