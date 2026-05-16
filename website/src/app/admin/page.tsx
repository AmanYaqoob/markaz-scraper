"use client";
import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  Star, StarOff, Save, Search, RefreshCw, Tag,
  ChevronLeft, ChevronRight, Check, ToggleLeft, ToggleRight,
  ShoppingBag, Package, Clock, Truck, CheckCircle, XCircle,
  Plus, X, ImagePlus, Trash2, Pencil, Copy, ClipboardCheck,
} from "lucide-react";
import { useAdminPassword } from "./layout";

// ── Types ────────────────────────────────────────────────────────────────────
type Product = {
  id: string; name: string; ai_title: string | null;
  price: number; brand: string | null; category_name: string | null;
  images: string[]; is_featured: boolean; availability: string; sku: string | null;
};

type OrderItem = { id: string; name: string; sku?: string | null; markaz_url?: string | null; price: number; qty: number; image: string };
type Order = {
  id: string; created_at: string; name: string; phone: string;
  address: string; city: string; notes: string | null;
  status: string; items: OrderItem[]; total: number; order_code: string | null;
};

type Edits = Record<string, { price?: string; is_featured?: boolean; availability?: string; saved?: boolean }>;

const PER_PAGE   = 50;
const ORDERS_PER = 20;

// ── Inline copy button (for SKU etc) ─────────────────────────────────────────
function CopyInline({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };
  return (
    <button onClick={copy} className={`transition-colors ${copied ? "text-green-400" : "text-white/20 hover:text-white/60"}`}>
      {copied ? <ClipboardCheck size={10} /> : <Copy size={10} />}
    </button>
  );
}

// ── Copy Row ─────────────────────────────────────────────────────────────────
function CopyRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };
  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2.5 bg-[#111] border border-[#1a1a1a] group">
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-[10px] text-white/30 uppercase tracking-widest w-20 flex-shrink-0">{label}</span>
        <span className={`text-sm truncate ${highlight ? "font-black tracking-widest text-white font-mono" : "text-white/80"}`}>
          {value}
        </span>
      </div>
      <button
        onClick={copy}
        className={`flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1 text-[10px] uppercase tracking-widest font-semibold border transition-all ${
          copied
            ? "border-green-500/40 text-green-400 bg-green-400/10"
            : "border-[#2a2a2a] text-white/20 hover:text-white hover:border-white/30 group-hover:text-white/50"
        }`}
      >
        {copied ? <><ClipboardCheck size={11} /> Copied</> : <><Copy size={11} /> Copy</>}
      </button>
    </div>
  );
}

const STATUS_COLORS: Record<string, string> = {
  pending:   "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  confirmed: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  shipped:   "text-purple-400 bg-purple-400/10 border-purple-400/20",
  delivered: "text-green-400 bg-green-400/10 border-green-400/20",
  cancelled: "text-red-400 bg-red-400/10 border-red-400/20",
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  pending:   <Clock size={12} />,
  confirmed: <CheckCircle size={12} />,
  shipped:   <Truck size={12} />,
  delivered: <CheckCircle size={12} />,
  cancelled: <XCircle size={12} />,
};

// ── Edit Product Modal ───────────────────────────────────────────────────────
function EditProductModal({ product, password, onSaved, onClose }: {
  product: Product;
  password: string;
  onSaved: (updated: Product) => void;
  onClose: () => void;
}) {
  const title = product.ai_title || product.name;
  const [name, setName]           = useState(title);
  const [brand, setBrand]         = useState(product.brand ?? "");
  const [description, setDesc]    = useState("");
  const [images, setImages]       = useState<string[]>(product.images?.length ? product.images : [""]);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState("");

  const setImage    = (i: number, v: string) => setImages(p => { const a = [...p]; a[i] = v; return a; });
  const addImage    = () => setImages(p => [...p, ""]);
  const removeImage = (i: number) => setImages(p => p.filter((_, idx) => idx !== i));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError("Name is required."); return; }
    setSaving(true); setError("");
    const res = await fetch("/api/admin/products", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-admin-password": password },
      body: JSON.stringify({
        id: product.id,
        name: name.trim(),
        ai_title: name.trim(),
        brand: brand.trim() || null,
        description: description.trim() || null,
        images: images.filter(Boolean),
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setError(data.error ?? "Failed to save."); return; }
    onSaved({ ...product, ...data.product });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-xl bg-[#0d0d0d] border border-[#222] overflow-y-auto max-h-[90vh]"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1a1a1a]">
          <h2 className="text-sm font-black uppercase tracking-widest">Edit Product</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors"><X size={18} /></button>
        </div>

        <form onSubmit={submit} className="px-6 py-5 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-[11px] text-white/40 uppercase tracking-widest mb-1.5">Product Name *</label>
            <input value={name} onChange={e => setName(e.target.value)} required
              className="w-full bg-[#141414] border border-[#222] text-white px-3 py-2.5 text-sm focus:outline-none focus:border-white/30" />
          </div>

          {/* Brand */}
          <div>
            <label className="block text-[11px] text-white/40 uppercase tracking-widest mb-1.5">Brand</label>
            <input value={brand} onChange={e => setBrand(e.target.value)} placeholder="e.g. Nike"
              className="w-full bg-[#141414] border border-[#222] text-white placeholder-white/20 px-3 py-2.5 text-sm focus:outline-none focus:border-white/30" />
          </div>

          {/* Description */}
          <div>
            <label className="block text-[11px] text-white/40 uppercase tracking-widest mb-1.5">Description</label>
            <textarea value={description} onChange={e => setDesc(e.target.value)} rows={3}
              placeholder="Product details..."
              className="w-full bg-[#141414] border border-[#222] text-white placeholder-white/20 px-3 py-2.5 text-sm focus:outline-none focus:border-white/30 resize-none" />
          </div>

          {/* Image URLs */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] text-white/40 uppercase tracking-widest">Image URLs</label>
              <button type="button" onClick={addImage}
                className="flex items-center gap-1 text-[10px] text-white/40 hover:text-white transition-colors uppercase tracking-widest">
                <ImagePlus size={12} /> Add Image
              </button>
            </div>
            {/* Previews */}
            {images.filter(Boolean).length > 0 && (
              <div className="flex gap-2 mb-2 flex-wrap">
                {images.filter(Boolean).map((img, i) => (
                  <div key={i} className="w-14 h-14 relative bg-[#1a1a1a] overflow-hidden border border-[#222]">
                    <Image src={img} alt="" fill sizes="56px" className="object-cover" />
                  </div>
                ))}
              </div>
            )}
            <div className="space-y-2">
              {images.map((img, i) => (
                <div key={i} className="flex gap-2">
                  <input value={img} onChange={e => setImage(i, e.target.value)}
                    placeholder={`https://example.com/image-${i + 1}.jpg`}
                    className="flex-1 bg-[#141414] border border-[#222] text-white placeholder-white/20 px-3 py-2 text-xs focus:outline-none focus:border-white/30" />
                  {images.length > 1 && (
                    <button type="button" onClick={() => removeImage(i)}
                      className="p-2 text-white/20 hover:text-red-400 transition-colors">
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {error && <p className="text-red-400 text-xs">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-[#222] text-white/40 hover:text-white text-xs uppercase tracking-widest transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="flex-1 btn-primary justify-center text-xs">
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Add Product Modal ────────────────────────────────────────────────────────
const KNOWN_CATEGORIES = [
  "Cosmetics","Women's Unstitched","Women's Stitched","Men's Unstitched","Men's Stitched",
  "Kids Clothing","Shoes","Bags","Women's Handbags","Jewellery","Electronics",
  "Electronic Accessories","Fashion Accessories","Home Essentials","Home Decor",
  "Kitchenware","Bedding","Perfumes","Fitness","Kids Accessories","Islamic Accessories",
  "Mother & Baby","Brands","Books & Stationery","Auto & Bike Accessories",
  "Men's Shawls","Women's Shawls","Home Linen","Unisex Clothing","Other",
];

const EMPTY_FORM = {
  name: "", price: "", brand: "", category_name: "", description: "",
  is_featured: false, availability: "instock", images: [""],
};

function AddProductModal({ password, onAdded, onClose }: {
  password: string;
  onAdded: () => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const setField = (k: string, v: unknown) => setForm(p => ({ ...p, [k]: v }));
  const setImage = (i: number, v: string) =>
    setForm(p => { const imgs = [...p.images]; imgs[i] = v; return { ...p, images: imgs }; });
  const addImageRow = () => setForm(p => ({ ...p, images: [...p.images, ""] }));
  const removeImage = (i: number) =>
    setForm(p => ({ ...p, images: p.images.filter((_, idx) => idx !== i) }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.name.trim()) { setError("Product name is required."); return; }
    if (!form.price || isNaN(Number(form.price))) { setError("Valid price is required."); return; }

    setSaving(true);
    const res = await fetch("/api/admin/products", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-password": password },
      body: JSON.stringify({ ...form, price: Number(form.price), images: form.images.filter(Boolean) }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setError(data.error ?? "Failed to save."); return; }
    onAdded();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-xl bg-[#0d0d0d] border border-[#222] overflow-y-auto max-h-[90vh]"
        onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1a1a1a]">
          <h2 className="text-sm font-black uppercase tracking-widest">Add New Product</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors"><X size={18} /></button>
        </div>

        <form onSubmit={submit} className="px-6 py-5 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-[11px] text-white/40 uppercase tracking-widest mb-1.5">Product Name *</label>
            <input value={form.name} onChange={e => setField("name", e.target.value)} required
              placeholder="e.g. Black Leather Bag"
              className="w-full bg-[#141414] border border-[#222] text-white placeholder-white/20 px-3 py-2.5 text-sm focus:outline-none focus:border-white/30" />
          </div>

          {/* Price + Brand */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-white/40 uppercase tracking-widest mb-1.5">Price (PKR) *</label>
              <input type="number" value={form.price} onChange={e => setField("price", e.target.value)} required
                placeholder="e.g. 2500"
                className="w-full bg-[#141414] border border-[#222] text-white placeholder-white/20 px-3 py-2.5 text-sm focus:outline-none focus:border-white/30 [appearance:textfield]" />
            </div>
            <div>
              <label className="block text-[11px] text-white/40 uppercase tracking-widest mb-1.5">Brand</label>
              <input value={form.brand} onChange={e => setField("brand", e.target.value)}
                placeholder="e.g. Nike"
                className="w-full bg-[#141414] border border-[#222] text-white placeholder-white/20 px-3 py-2.5 text-sm focus:outline-none focus:border-white/30" />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-[11px] text-white/40 uppercase tracking-widest mb-1.5">Category</label>
            <select value={form.category_name} onChange={e => setField("category_name", e.target.value)}
              className="w-full bg-[#141414] border border-[#222] text-white px-3 py-2.5 text-sm focus:outline-none focus:border-white/30">
              <option value="">— Select Category —</option>
              {KNOWN_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-[11px] text-white/40 uppercase tracking-widest mb-1.5">Description</label>
            <textarea value={form.description} onChange={e => setField("description", e.target.value)} rows={3}
              placeholder="Product details..."
              className="w-full bg-[#141414] border border-[#222] text-white placeholder-white/20 px-3 py-2.5 text-sm focus:outline-none focus:border-white/30 resize-none" />
          </div>

          {/* Image URLs */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] text-white/40 uppercase tracking-widest">Image URLs</label>
              <button type="button" onClick={addImageRow}
                className="flex items-center gap-1 text-[10px] text-white/40 hover:text-white transition-colors uppercase tracking-widest">
                <ImagePlus size={12} /> Add Image
              </button>
            </div>
            <div className="space-y-2">
              {form.images.map((img, i) => (
                <div key={i} className="flex gap-2">
                  <input value={img} onChange={e => setImage(i, e.target.value)}
                    placeholder={`https://example.com/image-${i + 1}.jpg`}
                    className="flex-1 bg-[#141414] border border-[#222] text-white placeholder-white/20 px-3 py-2 text-xs focus:outline-none focus:border-white/30" />
                  {form.images.length > 1 && (
                    <button type="button" onClick={() => removeImage(i)}
                      className="p-2 text-white/20 hover:text-red-400 transition-colors">
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Toggles */}
          <div className="flex gap-6">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input type="checkbox" checked={form.is_featured} onChange={e => setField("is_featured", e.target.checked)}
                className="w-4 h-4 accent-white" />
              <span className="text-[11px] text-white/60 uppercase tracking-widest">Featured</span>
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input type="checkbox" checked={form.availability === "instock"}
                onChange={e => setField("availability", e.target.checked ? "instock" : "outofstock")}
                className="w-4 h-4 accent-white" defaultChecked />
              <span className="text-[11px] text-white/60 uppercase tracking-widest">In Stock</span>
            </label>
          </div>

          {error && <p className="text-red-400 text-xs">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-[#222] text-white/40 hover:text-white text-xs uppercase tracking-widest transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 btn-primary justify-center text-xs">
              {saving ? "Saving..." : "Add Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Products Tab ─────────────────────────────────────────────────────────────
function ProductsTab({ password }: { password: string }) {
  const [products, setProducts]       = useState<Product[]>([]);
  const [total, setTotal]             = useState(0);
  const [page, setPage]               = useState(1);
  const [search, setSearch]           = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [category, setCategory]       = useState("");
  const [featured, setFeatured]       = useState("");
  const [categories, setCategories]   = useState<string[]>([]);
  const [featuredCount, setFeaturedCount] = useState(0);
  const [instockCount, setInstockCount]   = useState(0);
  const [loading, setLoading]         = useState(false);
  const [edits, setEdits]             = useState<Edits>({});
  const [saving, setSaving]           = useState<Record<string, boolean>>({});
  const [showAdd, setShowAdd]         = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);

  const h = { "x-admin-password": password };

  // Load all categories + global stats once on mount
  useEffect(() => {
    fetch("/api/admin/products?meta=true", { headers: h })
      .then(r => r.json())
      .then(d => {
        if (d.categories) setCategories(d.categories);
        if (d.featuredCount !== undefined) setFeaturedCount(d.featuredCount);
        if (d.instockCount  !== undefined) setInstockCount(d.instockCount);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const p = new URLSearchParams({ page: String(page), search, category, featured });
    const res = await fetch(`/api/admin/products?${p}`, { headers: h });
    const data = await res.json();
    setProducts(data.products ?? []);
    setTotal(data.total ?? 0);
    setLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, category, featured]);

  useEffect(() => { load(); }, [load]);

  const edit = (id: string, field: string, value: unknown) =>
    setEdits(prev => ({ ...prev, [id]: { ...prev[id], [field]: value, saved: false } }));

  const save = async (product: Product) => {
    const e = edits[product.id] ?? {};
    setSaving(prev => ({ ...prev, [product.id]: true }));
    const payload: Record<string, unknown> = { id: product.id };
    if (e.price !== undefined)        payload.price        = Number(e.price);
    if (e.is_featured !== undefined)  payload.is_featured  = e.is_featured;
    if (e.availability !== undefined) payload.availability = e.availability;
    await fetch("/api/admin/products", {
      method: "PATCH",
      headers: { ...h, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(prev => ({ ...prev, [product.id]: false }));
    setEdits(prev => ({ ...prev, [product.id]: { ...prev[product.id], saved: true } }));
    setProducts(prev => prev.map(p => p.id === product.id ? {
      ...p,
      price:        payload.price        !== undefined ? Number(payload.price) : p.price,
      is_featured:  payload.is_featured  !== undefined ? Boolean(payload.is_featured) : p.is_featured,
      availability: payload.availability !== undefined ? String(payload.availability) : p.availability,
    } : p));
  };

  const isDirty  = (id: string) => { const e = edits[id]; return e && !e.saved && (e.price !== undefined || e.is_featured !== undefined || e.availability !== undefined); };
  const totalPages = Math.ceil(total / PER_PAGE);

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Total Products", value: total },
          { label: "Featured",       value: featuredCount },
          { label: "In Stock",       value: instockCount },
        ].map(s => (
          <div key={s.label} className="bg-[#111] border border-[#1a1a1a] p-4">
            <p className="text-2xl font-black text-white">{s.value.toLocaleString()}</p>
            <p className="text-[11px] text-white/30 uppercase tracking-widest mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters + Add button */}
      <div className="flex flex-wrap gap-3 mb-5">
        <form onSubmit={e => { e.preventDefault(); setSearch(searchInput); setPage(1); }} className="flex gap-2 flex-1 min-w-[200px]">
          <input
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="Search products..."
            className="flex-1 bg-[#141414] border border-[#222] text-white placeholder-white/20 px-4 py-2 text-sm focus:outline-none focus:border-white/30"
          />
          <button type="submit" className="p-2 bg-white text-black hover:bg-white/90 transition-colors">
            <Search size={16} />
          </button>
        </form>
        <select value={category} onChange={e => { setCategory(e.target.value); setPage(1); }}
          className="bg-[#141414] border border-[#222] text-white/70 px-3 py-2 text-sm focus:outline-none">
          <option value="">All Categories</option>
          {categories.sort().map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={featured} onChange={e => { setFeatured(e.target.value); setPage(1); }}
          className="bg-[#141414] border border-[#222] text-white/70 px-3 py-2 text-sm focus:outline-none">
          <option value="">All Products</option>
          <option value="true">Featured Only</option>
          <option value="false">Not Featured</option>
        </select>
        <button onClick={load} className="p-2 border border-[#222] text-white/40 hover:text-white transition-colors">
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
        </button>
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2 bg-white text-black text-xs font-bold uppercase tracking-widest hover:bg-white/90 transition-colors">
          <Plus size={14} /> Add Product
        </button>
      </div>

      {showAdd && (
        <AddProductModal
          password={password}
          onAdded={() => { load(); }}
          onClose={() => setShowAdd(false)}
        />
      )}

      {editProduct && (
        <EditProductModal
          product={editProduct}
          password={password}
          onSaved={updated => setProducts(prev => prev.map(p => p.id === updated.id ? updated : p))}
          onClose={() => setEditProduct(null)}
        />
      )}

      {/* Table */}
      <div className="border border-[#1a1a1a] overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#1a1a1a] bg-[#111]">
              {["IMG","Product","Category","Price (PKR)","Featured","In Stock","Edit","Save"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold tracking-widest uppercase text-white/40 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={7} className="px-4 py-16 text-center text-white/30 text-xs tracking-widest uppercase">Loading...</td></tr>}
            {!loading && products.length === 0 && <tr><td colSpan={7} className="px-4 py-16 text-center text-white/30 text-xs tracking-widest uppercase">No products found</td></tr>}
            {!loading && products.map(product => {
              const e          = edits[product.id] ?? {};
              const isFeatured = e.is_featured  ?? product.is_featured;
              const inStock    = (e.availability ?? product.availability) === "instock";
              const priceVal   = e.price         ?? String(product.price);
              const dirty      = isDirty(product.id);
              const img        = product.images?.[0] ?? "";
              const title      = product.ai_title || product.name;

              return (
                <tr key={product.id} className={`border-b border-[#141414] transition-colors ${dirty ? "bg-white/[0.02]" : "hover:bg-white/[0.01]"}`}>
                  <td className="px-4 py-3">
                    <div className="w-12 h-12 relative bg-[#1a1a1a] overflow-hidden flex-none">
                      {img && <Image src={img} alt={title} fill sizes="48px" className="object-cover" />}
                    </div>
                  </td>
                  <td className="px-4 py-3 max-w-[220px]">
                    <p className="font-medium text-white/90 line-clamp-2 text-xs">{title}</p>
                    {product.brand && <p className="text-[10px] text-white/30 mt-0.5">{product.brand}</p>}
                    {product.sku   && <p className="text-[10px] text-white/20 mt-0.5 font-mono">{product.sku}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1 text-[10px] text-white/40 whitespace-nowrap">
                      <Tag size={10} />{product.category_name ?? "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-white/30">PKR</span>
                      <input type="number" value={priceVal}
                        onChange={e => edit(product.id, "price", e.target.value)}
                        className="w-24 bg-[#141414] border border-[#222] text-white px-2 py-1 text-xs focus:outline-none focus:border-white/40 [appearance:textfield]"
                      />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => edit(product.id, "is_featured", !isFeatured)}
                      className={`transition-colors ${isFeatured ? "text-yellow-400 hover:text-yellow-300" : "text-white/20 hover:text-white/50"}`}>
                      {isFeatured ? <Star size={18} fill="currentColor" /> : <StarOff size={18} />}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => edit(product.id, "availability", inStock ? "outofstock" : "instock")}
                      className={`transition-colors ${inStock ? "text-green-400 hover:text-green-300" : "text-white/20 hover:text-white/50"}`}>
                      {inStock ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                    </button>
                  </td>
                  {/* Edit */}
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => setEditProduct(product)}
                      className="p-1.5 text-white/30 hover:text-white transition-colors" title="Edit name & images">
                      <Pencil size={14} />
                    </button>
                  </td>

                  {/* Save */}
                  <td className="px-4 py-3 text-center">
                    {e.saved && !dirty ? (
                      <span className="text-green-400"><Check size={16} /></span>
                    ) : (
                      <button onClick={() => save(product)} disabled={!dirty || saving[product.id]}
                        className={`p-1.5 transition-colors ${dirty ? "text-white bg-white/10 hover:bg-white/20" : "text-white/15 cursor-not-allowed"}`}>
                        {saving[product.id] ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-5 flex items-center justify-between text-xs text-white/40">
          <span>Showing {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, total)} of {total}</span>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="p-1.5 border border-[#222] hover:border-white/30 hover:text-white transition-colors disabled:opacity-30">
              <ChevronLeft size={14} />
            </button>
            <span className="px-3 py-1 border border-[#333] text-white/60">{page} / {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="p-1.5 border border-[#222] hover:border-white/30 hover:text-white transition-colors disabled:opacity-30">
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Orders Tab ───────────────────────────────────────────────────────────────
function OrdersTab({ password }: { password: string }) {
  const [orders, setOrders]     = useState<Order[]>([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [status, setStatus]     = useState("");
  const [loading, setLoading]   = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [updating, setUpdating] = useState<Record<string, boolean>>({});
  const [copied, setCopied]     = useState<string | null>(null);
  const [productSkus, setProductSkus] = useState<Record<string, { sku: string | null; markaz_url: string | null }>>({});

  const copyOrder = (order: Order) => {
    const lines = [
      `📦 ORDER: ${order.order_code ?? order.id.slice(0, 8)}`,
      `━━━━━━━━━━━━━━━━━━━━`,
      `👤 Name:    ${order.name}`,
      `📞 Phone:   ${order.phone}`,
      `🏙️  City:    ${order.city}`,
      `📍 Address: ${order.address}`,
      order.notes ? `📝 Notes:   ${order.notes}` : "",
      `━━━━━━━━━━━━━━━━━━━━`,
      `🛍️  ITEMS:`,
      ...order.items.map(i => `  • ${i.name} × ${i.qty}  —  PKR ${(i.price * i.qty).toLocaleString()}`),
      `━━━━━━━━━━━━━━━━━━━━`,
      `💰 Total:   PKR ${order.total.toLocaleString()}`,
      `📅 Date:    ${new Date(order.created_at).toLocaleString()}`,
      `🔖 Status:  ${order.status.toUpperCase()}`,
    ].filter(Boolean).join("\n");

    navigator.clipboard.writeText(lines).then(() => {
      setCopied(order.id);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const h = { "x-admin-password": password };
  const totalPages = Math.ceil(total / ORDERS_PER);

  const load = useCallback(async () => {
    setLoading(true);
    const p = new URLSearchParams({ page: String(page), status });
    const res = await fetch(`/api/admin/orders?${p}`, { headers: h });
    const data = await res.json();
    setOrders(data.orders ?? []);
    setTotal(data.total ?? 0);
    setLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, status]);

  useEffect(() => { load(); }, [load]);

  const fetchProductSkus = async (order: Order) => {
    const ids = order.items.map(i => i.id).filter(Boolean);
    if (!ids.length) return;
    const missing = ids.filter(id => !(id in productSkus));
    if (!missing.length) return;
    const res = await fetch(`/api/admin/products?ids=${missing.join(",")}`, { headers: h });
    const data = await res.json();
    const map: Record<string, { sku: string | null; markaz_url: string | null }> = {};
    (data.products ?? []).forEach((p: { id: string; sku: string | null; markaz_url: string | null }) => {
      map[p.id] = { sku: p.sku || null, markaz_url: p.markaz_url || null };
    });
    setProductSkus(prev => ({ ...prev, ...map }));
  };

  const updateStatus = async (id: string, newStatus: string) => {
    setUpdating(prev => ({ ...prev, [id]: true }));
    await fetch("/api/admin/orders", {
      method: "PATCH",
      headers: { ...h, "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: newStatus }),
    });
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o));
    setUpdating(prev => ({ ...prev, [id]: false }));
  };

  const STATUSES = ["pending", "confirmed", "shipped", "delivered", "cancelled"];

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-5 gap-3 mb-6">
        {STATUSES.map(s => {
          const count = orders.filter(o => o.status === s).length;
          return (
            <button key={s} onClick={() => { setStatus(status === s ? "" : s); setPage(1); }}
              className={`p-4 border text-left transition-colors ${status === s ? "border-white/30 bg-white/5" : "border-[#1a1a1a] bg-[#111] hover:border-white/10"}`}>
              <p className="text-lg font-black text-white">{count}</p>
              <p className={`text-[10px] uppercase tracking-widest mt-1 capitalize flex items-center gap-1 ${STATUS_COLORS[s].split(" ")[0]}`}>
                {STATUS_ICONS[s]}{s}
              </p>
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-white/40">{total} orders total</p>
        <div className="flex items-center gap-2">
          {status && <button onClick={() => setStatus("")} className="text-xs text-white/40 hover:text-white transition-colors">Clear filter ×</button>}
          <button onClick={load} className="p-2 border border-[#222] text-white/40 hover:text-white transition-colors">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Orders list */}
      <div className="space-y-3">
        {loading && <p className="text-center text-white/30 text-xs tracking-widest uppercase py-16">Loading...</p>}
        {!loading && orders.length === 0 && (
          <p className="text-center text-white/30 text-xs tracking-widest uppercase py-16">No orders found</p>
        )}
        {!loading && orders.map(order => {
          const isExpanded = expanded === order.id;
          const sc = STATUS_COLORS[order.status] ?? "text-white/40";
          return (
            <div key={order.id} className="border border-[#1a1a1a] bg-[#0d0d0d]">
              {/* Row */}
              <button
                onClick={() => { const next = isExpanded ? null : order.id; setExpanded(next); if (next) fetchProductSkus(order); }}
                className="w-full px-5 py-4 flex items-center gap-4 text-left hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-xs font-bold text-white">{order.name}</span>
                    <span className="text-[10px] text-white/40">{order.phone}</span>
                    <span className="text-[10px] text-white/30">{order.city}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    {order.order_code && (
                      <span className="text-[10px] font-mono font-bold text-white/60 bg-white/5 px-1.5 py-0.5 border border-white/10">
                        {order.order_code}
                      </span>
                    )}
                    <span className="text-[10px] text-white/30">{new Date(order.created_at).toLocaleString()}</span>
                    <span className="text-[10px] text-white/40">{order.items.length} items</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0">
                  <span className="text-sm font-bold text-white">PKR {order.total.toLocaleString()}</span>
                  <span className={`flex items-center gap-1 text-[10px] uppercase tracking-widest px-2 py-1 border rounded-sm font-semibold ${sc}`}>
                    {STATUS_ICONS[order.status]}{order.status}
                  </span>
                </div>
              </button>

              {/* Expanded details */}
              {isExpanded && (
                <div className="border-t border-[#1a1a1a] px-5 py-5 space-y-5">
                  {/* Customer info with per-field copy */}
                  <div className="space-y-2">
                    {[
                      { label: "Order Code", value: order.order_code ?? "—", highlight: true },
                      { label: "Name",       value: order.name },
                      { label: "Phone",      value: order.phone },
                      { label: "City",       value: order.city },
                      { label: "Address",    value: order.address },
                      ...(order.notes ? [{ label: "Notes", value: order.notes }] : []),
                    ].map(f => (
                      <CopyRow key={f.label} label={f.label} value={f.value} highlight={f.highlight} />
                    ))}
                  </div>

                  {/* Items */}
                  <div>
                    <p className="text-[10px] text-white/30 uppercase tracking-widest mb-3">Items</p>
                    <div className="space-y-2">
                      {order.items.map((item, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 bg-[#111] border border-[#1a1a1a]">
                          <div className="w-10 h-10 relative bg-[#1a1a1a] flex-none overflow-hidden">
                            {item.image && <Image src={item.image} alt={item.name} fill sizes="40px" className="object-cover" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-white/80 line-clamp-1">{item.name}</p>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              {(() => {
                                const prod = productSkus[item.id];
                                const sku = item.sku || prod?.sku || null;
                                const url = item.markaz_url || prod?.markaz_url || null;
                                const code = sku || (url ? url.split("/").filter(Boolean).pop() : null);
                                return code ? (
                                  <span className="flex items-center gap-1">
                                    <span className="text-[10px] text-white/50 font-mono font-bold">{code}</span>
                                    <CopyInline value={code} />
                                  </span>
                                ) : null;
                              })()}
                              {(() => {
                                const url = item.markaz_url || productSkus[item.id]?.markaz_url || null;
                                return url ? (
                                  <a href={url} target="_blank" rel="noreferrer"
                                    className="text-[10px] text-white/20 hover:text-white/50 transition-colors underline">
                                    markaz link
                                  </a>
                                ) : null;
                              })()}
                            </div>
                          </div>
                          <span className="text-[11px] text-white/40 flex-shrink-0">× {item.qty}</span>
                          <span className="text-xs font-bold text-white flex-shrink-0">PKR {(item.price * item.qty).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-end mt-3 text-sm font-bold text-white border-t border-[#1a1a1a] pt-3">
                      Total: PKR {order.total.toLocaleString()}
                    </div>
                  </div>

                  {/* Copy credentials */}
                  <div className="flex justify-end">
                    <button
                      onClick={() => copyOrder(order)}
                      className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold uppercase tracking-widest border transition-colors ${
                        copied === order.id
                          ? "border-green-500/40 text-green-400 bg-green-400/10"
                          : "border-[#222] text-white/50 hover:border-white/30 hover:text-white"
                      }`}
                    >
                      {copied === order.id
                        ? <><ClipboardCheck size={13} /> Copied!</>
                        : <><Copy size={13} /> Copy Order Details</>
                      }
                    </button>
                  </div>

                  {/* Status update */}
                  <div>
                    <p className="text-[10px] text-white/30 uppercase tracking-widest mb-3">Update Status</p>
                    <div className="flex flex-wrap gap-2">
                      {STATUSES.map(s => (
                        <button
                          key={s}
                          onClick={() => updateStatus(order.id, s)}
                          disabled={order.status === s || updating[order.id]}
                          className={`px-3 py-1.5 text-[10px] uppercase tracking-widest font-semibold border transition-colors capitalize flex items-center gap-1.5 ${
                            order.status === s
                              ? `${STATUS_COLORS[s]} cursor-default`
                              : "border-[#222] text-white/40 hover:border-white/30 hover:text-white"
                          }`}
                        >
                          {STATUS_ICONS[s]}{s}
                          {order.status === s && " ✓"}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-5 flex items-center justify-end gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="p-1.5 border border-[#222] hover:border-white/30 hover:text-white transition-colors disabled:opacity-30">
            <ChevronLeft size={14} />
          </button>
          <span className="px-3 py-1 border border-[#333] text-white/60 text-xs">{page} / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className="p-1.5 border border-[#222] hover:border-white/30 hover:text-white transition-colors disabled:opacity-30">
            <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main Admin Page ──────────────────────────────────────────────────────────
export default function AdminPage() {
  const password = useAdminPassword();
  const [tab, setTab] = useState<"products" | "orders">("products");

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Top bar */}
      <div className="border-b border-[#1a1a1a] bg-[#0d0d0d] sticky top-0 z-10">
        <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center gap-6">
          <div>
            <h1 className="text-lg font-black uppercase tracking-widest">Admin Panel</h1>
            <p className="text-[11px] text-white/30 tracking-widest uppercase">DROPSHOP</p>
          </div>
          <div className="flex gap-1 ml-6">
            <button
              onClick={() => setTab("products")}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold uppercase tracking-widest transition-colors ${
                tab === "products" ? "bg-white text-black" : "text-white/40 hover:text-white"
              }`}
            >
              <ShoppingBag size={13} /> Products
            </button>
            <button
              onClick={() => setTab("orders")}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold uppercase tracking-widest transition-colors ${
                tab === "orders" ? "bg-white text-black" : "text-white/40 hover:text-white"
              }`}
            >
              <Package size={13} /> Orders
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 py-8">
        {tab === "products" ? <ProductsTab password={password} /> : <OrdersTab password={password} />}
      </div>
    </div>
  );
}
