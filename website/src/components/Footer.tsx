import Link from "next/link";
import Image from "next/image";
import { Facebook, Instagram } from "lucide-react";

const LINKS = {
  Shop: [
    { label: "All Categories", href: "/categories" },
    { label: "Featured Products", href: "/?section=featured" },
    { label: "New Arrivals", href: "/?section=new" },
  ],
  Help: [
    { label: "Contact Us", href: "/contact" },
    { label: "FAQs", href: "/faq" },
    { label: "Shipping Policy", href: "/shipping" },
    { label: "Returns", href: "/returns" },
  ],
};

export default function Footer() {
  return (
    <footer className="border-t border-[#1a1a1a] bg-[#080808]">
      <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-4 gap-12">
        {/* Brand */}
        <div className="md:col-span-2">
          <Image src="/nr2prwpftxrmr0cy5patyca2d0_preview_0-ezremove.png" alt="DROPSHOP" width={260} height={80} className="h-16 w-auto mb-6 object-contain" />
          <p className="text-sm text-white/40 leading-relaxed max-w-sm">
            Pakistan's premium dropshipping store. Trending products delivered fast — style, quality, and value in every order.
          </p>
          <div className="flex gap-4 mt-6">
            <a href="https://www.facebook.com/share/1JXdczjfCw/" target="_blank" rel="noopener" className="p-2 border border-[#222] text-white/40 hover:text-white hover:border-white/30 transition-colors">
              <Facebook size={16} />
            </a>
            <a href="https://www.instagram.com/dropshop._.pk?igsh=MTM2MHdlaTJ3ZnVvbQ==" target="_blank" rel="noopener" className="p-2 border border-[#222] text-white/40 hover:text-white hover:border-white/30 transition-colors">
              <Instagram size={16} />
            </a>
          </div>
        </div>

        {Object.entries(LINKS).map(([title, links]) => (
          <div key={title}>
            <p className="text-[10px] font-semibold tracking-widest uppercase text-white/30 mb-4">{title}</p>
            <ul className="space-y-3">
              {links.map(l => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-white/50 hover:text-white transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-[#111] max-w-7xl mx-auto px-6 py-6 flex flex-col sm:flex-row justify-between items-center gap-4">
        <p className="text-[11px] text-white/20">© 2025 DROPSHOP._.PK — All rights reserved.</p>
        <p className="text-[11px] text-white/20">Style. Quality. You.</p>
      </div>
    </footer>
  );
}
