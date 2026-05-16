import { supabase, type Category, type Product } from "./supabase";

export async function getCategories(): Promise<Category[]> {
  const { data } = await supabase
    .from("categories")
    .select("*")
    .order("name");
  return data ?? [];
}

export async function getFeaturedProducts(limit = 12): Promise<Product[]> {
  const { data } = await supabase
    .from("products")
    .select("*")
    .eq("is_featured", true)
    .eq("availability", "instock")
    .order("created_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}

export async function getNewArrivals(limit = 8): Promise<Product[]> {
  const { data } = await supabase
    .from("products")
    .select("*")
    .eq("availability", "instock")
    .order("created_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}

export async function getProductsByCategory(
  categorySlug: string,
  page = 1,
  perPage = 24
): Promise<{ products: Product[]; total: number }> {
  const from = (page - 1) * perPage;
  const to   = from + perPage - 1;

  const { data, count } = await supabase
    .from("products")
    .select("*", { count: "exact" })
    .eq("category_name", decodeURIComponent(categorySlug))
    .eq("availability", "instock")
    .order("is_featured", { ascending: false })
    .order("created_at", { ascending: false })
    .range(from, to);

  return { products: data ?? [], total: count ?? 0 };
}

export async function getProductById(id: string): Promise<Product | null> {
  const { data } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single();
  return data;
}

export async function searchProducts(query: string, limit = 24): Promise<Product[]> {
  const { data } = await supabase
    .from("products")
    .select("*")
    .or(`name.ilike.%${query}%,ai_title.ilike.%${query}%,brand.ilike.%${query}%`)
    .eq("availability", "instock")
    .limit(limit);
  return data ?? [];
}

export async function getRelatedProducts(categoryName: string, excludeId: string, limit = 6): Promise<Product[]> {
  const { data } = await supabase
    .from("products")
    .select("*")
    .eq("category_name", categoryName)
    .neq("id", excludeId)
    .limit(limit);
  return data ?? [];
}
