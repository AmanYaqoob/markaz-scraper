"use client";
import { useState } from "react";
import { useCart } from "@/components/CartProvider";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ShoppingBag, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function CheckoutPage() {
  const { items, clear } = useCart();
  const router = useRouter();
  const [form, setForm] = useState({ name: "", phone: "", address: "", city: "", notes: "" });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [orderId, setOrderId]       = useState("");
  const [orderCode, setOrderCode]   = useState("");
  const [orderItems, setOrderItems] = useState<{ name: string; sku: string | null }[]>([]);
  const [error, setError] = useState("");

  const total = items.reduce((s, i) => s + Number(i.product.price) * i.qty, 0);

  if (items.length === 0 && !done) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center">
        <ShoppingBag size={48} className="mx-auto text-white/10 mb-6" />
        <h1 className="text-xl font-black uppercase tracking-wider text-white mb-3">Your cart is empty</h1>
        <Link href="/categories" className="btn-primary mt-4 inline-flex">Shop Now</Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
          <CheckCircle size={64} className="mx-auto text-green-400 mb-6" />
          <h1 className="text-2xl font-black uppercase tracking-wider text-white mb-4">Order Placed!</h1>

          {/* Order code — big and prominent */}
          <div className="inline-block border border-white/20 bg-white/5 px-6 py-4 mb-4">
            <p className="text-[11px] text-white/40 uppercase tracking-widest mb-2">Your Order Code</p>
            <p className="text-2xl font-black tracking-widest text-white font-mono">{orderCode}</p>
            <p className="text-[10px] text-white/30 mt-2">Save this code to track your order</p>
          </div>

          {/* Product SKU codes */}
          {orderItems.some(i => i.sku) && (
            <div className="border border-white/10 bg-white/5 px-5 py-4 mb-6 text-left w-full max-w-sm mx-auto">
              <p className="text-[10px] text-white/40 uppercase tracking-widest mb-3">Product Codes</p>
              <div className="space-y-2">
                {orderItems.filter(i => i.sku).map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-4">
                    <p className="text-[11px] text-white/60 truncate flex-1">{item.name}</p>
                    <p className="text-[11px] font-mono font-bold text-white/90 whitespace-nowrap">{item.sku}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <p className="text-white/40 text-sm mb-8">
            We&apos;ll contact you on <span className="text-white/70">{form.phone}</span> to confirm delivery.
          </p>
          <Link href="/" className="btn-primary inline-flex">Continue Shopping</Link>
        </motion.div>
      </div>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const cartSnapshot = items.map(({ product, qty }) => ({
      id:         product.id,
      name:       product.ai_title || product.name,
      sku:        product.sku || null,
      markaz_url: product.markaz_url || null,
      price:      Number(product.price),
      qty,
      image:      product.images?.[0] ?? "",
    }));

    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, items: cartSnapshot, total }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) { setError(data.error ?? "Something went wrong."); return; }
    setOrderId(data.order.id);
    setOrderCode(data.order.order_code ?? "");
    // use server-returned items (have enriched SKUs), fall back to cart snapshot
    const returnedItems: { name: string; sku: string | null }[] =
      (data.order.items ?? cartSnapshot).map((i: { name: string; sku?: string | null }) => ({
        name: i.name,
        sku:  i.sku || null,
      }));
    setOrderItems(returnedItems);
    clear();
    setDone(true);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="mb-10 border-b border-[#1a1a1a] pb-6">
        <p className="section-subtitle mb-1">Almost there</p>
        <h1 className="section-title">Checkout</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Form */}
        <form onSubmit={submit} className="space-y-4">
          <h2 className="text-xs font-black uppercase tracking-widest text-white/50 mb-4">Delivery Details</h2>

          {[
            { key: "name",    label: "Full Name",       type: "text",  required: true },
            { key: "phone",   label: "Phone Number",    type: "tel",   required: true },
            { key: "city",    label: "City",            type: "text",  required: true },
            { key: "address", label: "Full Address",    type: "text",  required: true },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-[11px] text-white/40 uppercase tracking-widest mb-1.5">{f.label}</label>
              <input
                type={f.type}
                required={f.required}
                value={form[f.key as keyof typeof form]}
                onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                className="w-full bg-[#141414] border border-[#222] text-white placeholder-white/20 px-4 py-3 text-sm focus:outline-none focus:border-white/30"
              />
            </div>
          ))}

          <div>
            <label className="block text-[11px] text-white/40 uppercase tracking-widest mb-1.5">Order Notes (optional)</label>
            <textarea
              value={form.notes}
              onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
              rows={3}
              className="w-full bg-[#141414] border border-[#222] text-white placeholder-white/20 px-4 py-3 text-sm focus:outline-none focus:border-white/30 resize-none"
            />
          </div>

          {error && <p className="text-red-400 text-xs">{error}</p>}

          <button type="submit" disabled={loading} className="btn-primary w-full justify-center mt-2">
            {loading ? "Placing Order..." : `Place Order — PKR ${total.toLocaleString()}`}
          </button>

          <p className="text-[11px] text-white/25 text-center">Cash on Delivery · Free Shipping</p>
        </form>

        {/* Order summary */}
        <div>
          <h2 className="text-xs font-black uppercase tracking-widest text-white/50 mb-4">Your Order ({items.length} items)</h2>
          <div className="space-y-3 mb-6">
            {items.map(({ product, qty }) => {
              const title = product.ai_title || product.name;
              const img   = product.images?.[0] ?? "";
              return (
                <div key={product.id} className="flex gap-3 p-3 card-dark">
                  <div className="w-14 h-14 relative bg-[#1a1a1a] flex-none overflow-hidden">
                    {img && <Image src={img} alt={title} fill sizes="56px" className="object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-white line-clamp-2">{title}</p>
                    <p className="text-[11px] text-white/40 mt-1">Qty: {qty}</p>
                  </div>
                  <p className="text-xs font-bold text-white whitespace-nowrap">
                    PKR {(Number(product.price) * qty).toLocaleString()}
                  </p>
                </div>
              );
            })}
          </div>
          <div className="border-t border-[#1a1a1a] pt-4 flex justify-between text-sm font-bold text-white">
            <span>Total</span>
            <span>PKR {total.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
