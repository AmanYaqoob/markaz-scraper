import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function checkAuth(req: NextRequest) {
  return req.headers.get("x-admin-password") === process.env.ADMIN_PASSWORD;
}

// GET /api/admin/orders?page=1&status=
export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page   = Number(searchParams.get("page") ?? 1);
  const status = searchParams.get("status") ?? "";
  const perPage = 20;
  const from = (page - 1) * perPage;
  const to   = from + perPage - 1;

  let query = adminSupabase.from("orders").select("*", { count: "exact" });
  if (status) query = query.eq("status", status);

  const { data, count, error } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Enrich order items with SKU + markaz_url from products table
  const orders = data ?? [];
  const productIds = Array.from(new Set(orders.flatMap((o: { items: { id: string }[] }) => o.items.map((i: { id: string }) => i.id).filter(Boolean))));

  let skuMap: Record<string, { sku: string | null; markaz_url: string | null }> = {};
  if (productIds.length) {
    const { data: products } = await adminSupabase
      .from("products")
      .select("id,sku,markaz_url")
      .in("id", productIds);
    (products ?? []).forEach((p: { id: string; sku: string | null; markaz_url: string | null }) => {
      skuMap[p.id] = { sku: p.sku, markaz_url: p.markaz_url };
    });
  }

  // Extract last URL segment as fallback product code (e.g. MZ... from markaz.app/shop/product/MZ...)
  function codeFromUrl(url: string | null): string | null {
    if (!url) return null;
    const seg = url.split("/").filter(Boolean).pop() ?? null;
    return seg || null;
  }

  const enriched = orders.map((o: { items: { id: string; sku?: string | null; markaz_url?: string | null }[] }) => ({
    ...o,
    items: o.items.map((item: { id: string; sku?: string | null; markaz_url?: string | null }) => {
      const markazUrl = item.markaz_url || skuMap[item.id]?.markaz_url || null;
      const sku       = item.sku || skuMap[item.id]?.sku || codeFromUrl(markazUrl) || null;
      return { ...item, sku, markaz_url: markazUrl };
    }),
  }));

  return NextResponse.json({ orders: enriched, total: count });
}

// PATCH /api/admin/orders — update order status
export async function PATCH(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, status } = await req.json();
  if (!id || !status) return NextResponse.json({ error: "id and status required" }, { status: 400 });

  const { data, error } = await adminSupabase
    .from("orders")
    .update({ status })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ order: data });
}
