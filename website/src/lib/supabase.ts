import { createClient } from "@supabase/supabase-js";

const url  = process.env.NEXT_PUBLIC_SUPABASE_URL  ?? "https://placeholder.supabase.co";
const key  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "placeholder";

export const supabase = createClient(url, key);

export type Category = {
  id: string;
  name: string;
  slug: string;
  markaz_url: string | null;
  image_url: string | null;
  product_count: number;
};

export type Product = {
  id: string;
  name: string;
  ai_title: string | null;
  sku: string | null;
  description: string | null;
  ai_description: string | null;
  short_description: string | null;
  ai_short_desc: string | null;
  price: number;
  currency: string;
  availability: string;
  brand: string | null;
  category_id: string | null;
  category_name: string | null;
  markaz_url: string | null;
  images: string[];
  tags: string[];
  ai_seo_title: string | null;
  ai_seo_desc: string | null;
  is_featured: boolean;
  created_at: string;
};
