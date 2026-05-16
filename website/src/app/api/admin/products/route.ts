import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function checkAuth(req: NextRequest) {
  const auth = req.headers.get("x-admin-password");
  return auth === process.env.ADMIN_PASSWORD;
}

// GET /api/admin/products?page=1&search=&category=&featured=
// GET /api/admin/products?ids=uuid1,uuid2,...  — fetch specific products by ID
export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);

  // Fetch by IDs (used by orders tab to get sku/markaz_url)
  const ids = searchParams.get("ids");
  if (ids) {
    const idList = ids.split(",").filter(Boolean);
    const { data, error } = await adminSupabase
      .from("products")
      .select("id,sku,markaz_url,name,ai_title")
      .in("id", idList);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ products: data ?? [] });
  }

  // Fetch all categories + global stats
  if (searchParams.get("meta") === "true") {
    const [catRes, featRes, stockRes] = await Promise.all([
      adminSupabase.from("products").select("category_name").not("category_name", "is", null),
      adminSupabase.from("products").select("id", { count: "exact", head: true }).eq("is_featured", true),
      adminSupabase.from("products").select("id", { count: "exact", head: true }).eq("availability", "instock"),
    ]);
    const categories = Array.from(new Set<string>((catRes.data ?? []).map((r: { category_name: string }) => r.category_name).filter(Boolean))).sort();
    return NextResponse.json({
      categories,
      featuredCount: featRes.count ?? 0,
      instockCount:  stockRes.count ?? 0,
    });
  }

  const page     = Number(searchParams.get("page") ?? 1);
  const search   = searchParams.get("search") ?? "";
  const category = searchParams.get("category") ?? "";
  const featured = searchParams.get("featured") ?? "";
  const perPage  = 50;
  const from     = (page - 1) * perPage;
  const to       = from + perPage - 1;

  let query = adminSupabase.from("products").select("*", { count: "exact" });

  if (search)   query = query.or(`name.ilike.%${search}%,ai_title.ilike.%${search}%`);
  if (category) query = query.eq("category_name", category);
  if (featured === "true")  query = query.eq("is_featured", true);
  if (featured === "false") query = query.eq("is_featured", false);

  const { data, count, error } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ products: data, total: count });
}

// POST /api/admin/products — create a new product manually
export async function POST(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, price, category_name, brand, description, images, is_featured, availability } = body;
  if (!name || price === undefined) return NextResponse.json({ error: "name and price required" }, { status: 400 });

  const row = {
    name,
    price:         Number(price),
    category_name: category_name || null,
    brand:         brand || null,
    description:   description || null,
    images:        Array.isArray(images) ? images.filter(Boolean) : [],
    is_featured:   Boolean(is_featured),
    availability:  availability || "instock",
    currency:      "PKR",
    tags:          [],
  };

  const { data, error } = await adminSupabase
    .from("products")
    .insert(row)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ product: data });
}

// PATCH /api/admin/products — update one or more fields on a product
export async function PATCH(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { id, ...fields } = body;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const allowed = ["price", "is_featured", "availability", "name", "ai_title", "brand", "category_name", "images", "description"];
  const update: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in fields) update[key] = fields[key];
  }

  const { data, error } = await adminSupabase
    .from("products")
    .update(update)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ product: data });
}
