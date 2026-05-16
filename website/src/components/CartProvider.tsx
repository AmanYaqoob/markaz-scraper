"use client";
import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { Product } from "@/lib/supabase";

type CartItem = { product: Product; qty: number };
type CartCtx  = {
  items: CartItem[];
  count: number;
  add: (p: Product) => void;
  remove: (id: string) => void;
  clear: () => void;
};

const Ctx = createContext<CartCtx | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("ds_cart");
    if (saved) setItems(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem("ds_cart", JSON.stringify(items));
  }, [items]);

  const add = (p: Product) =>
    setItems(prev => {
      const existing = prev.find(i => i.product.id === p.id);
      if (existing) return prev.map(i => i.product.id === p.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { product: p, qty: 1 }];
    });

  const remove = (id: string) => setItems(prev => prev.filter(i => i.product.id !== id));
  const clear  = () => setItems([]);
  const count  = items.reduce((s, i) => s + i.qty, 0);

  return <Ctx.Provider value={{ items, count, add, remove, clear }}>{children}</Ctx.Provider>;
}

export const useCart = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCart outside CartProvider");
  return ctx;
};
