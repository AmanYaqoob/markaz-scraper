-- ============================================================
-- DROPSHOP — Supabase Schema
-- Run each section separately in SQL Editor if needed
-- ============================================================


-- ── SECTION 1: Extensions ─────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ── SECTION 2: Categories table ───────────────────────────────
CREATE TABLE categories (
  id            UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name          TEXT NOT NULL,
  slug          TEXT UNIQUE NOT NULL,
  markaz_url    TEXT,
  image_url     TEXT,
  product_count INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);


-- ── SECTION 3: Products table ─────────────────────────────────
CREATE TABLE products (
  id                 UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name               TEXT NOT NULL,
  ai_title           TEXT,
  sku                TEXT,
  description        TEXT,
  ai_description     TEXT,
  short_description  TEXT,
  ai_short_desc      TEXT,
  price              NUMERIC(12, 2) DEFAULT 0,
  currency           TEXT DEFAULT 'PKR',
  availability       TEXT DEFAULT 'instock',
  brand              TEXT,
  category_id        UUID REFERENCES categories(id) ON DELETE SET NULL,
  category_name      TEXT,
  markaz_url         TEXT UNIQUE,
  images             TEXT[]  DEFAULT '{}',
  tags               TEXT[]  DEFAULT '{}',
  ai_seo_title       TEXT,
  ai_seo_desc        TEXT,
  is_featured        BOOLEAN DEFAULT FALSE,
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  updated_at         TIMESTAMPTZ DEFAULT NOW()
);


-- ── SECTION 4: Indexes ────────────────────────────────────────
CREATE INDEX idx_products_category_name ON products(category_name);
CREATE INDEX idx_products_featured       ON products(is_featured);
CREATE INDEX idx_products_availability   ON products(availability);
CREATE INDEX idx_products_created        ON products(created_at DESC);


-- ── SECTION 5: Row Level Security (public can read) ───────────
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products    ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Public read products"   ON products    FOR SELECT USING (true);


-- ── SECTION 6: Auto-update updated_at on products ─────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
