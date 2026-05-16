import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function generateOrderCode(): string {
  const prefix  = "DS";
  const digits  = Math.floor(Math.random() * 1_000_000_000).toString().padStart(9, "0");
  const letters = Array.from({ length: 4 }, () =>
    "ABCDEFGHJKLMNPQRSTUVWXYZ"[Math.floor(Math.random() * 24)]
  ).join("");
  return `${prefix}${digits}${letters}`;
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, phone, address, city, notes, items, total } = body;

  if (!name || !phone || !address || !city || !items?.length) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const order_code = generateOrderCode();

  const { data, error } = await adminSupabase
    .from("orders")
    .insert({ name, phone, address, city, notes, items, total, status: "pending", order_code })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Enrich items with SKU from products table (in case cart had empty/missing SKUs)
  const productIds = (data.items ?? []).map((i: { id: string }) => i.id).filter(Boolean);
  let skuMap: Record<string, string | null> = {};
  if (productIds.length) {
    const { data: products } = await adminSupabase
      .from("products")
      .select("id,sku,markaz_url")
      .in("id", productIds);
    (products ?? []).forEach((p: { id: string; sku: string | null; markaz_url: string | null }) => {
      skuMap[p.id] = p.sku || null;
    });
  }

  const enrichedOrder = {
    ...data,
    items: (data.items ?? []).map((i: { id: string; sku?: string | null }) => ({
      ...i,
      sku: i.sku || skuMap[i.id] || null,
    })),
  };

  return NextResponse.json({ order: enrichedOrder });
}
