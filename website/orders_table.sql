-- Run this in Supabase SQL editor

create table if not exists orders (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz default now(),
  name        text not null,
  phone       text not null,
  address     text not null,
  city        text not null,
  notes       text,
  status      text not null default 'pending',   -- pending, confirmed, shipped, delivered, cancelled
  items       jsonb not null default '[]',        -- [{id, name, price, qty, image}]
  total       numeric not null default 0,
  currency    text not null default 'PKR'
);

alter table orders enable row level security;

-- Allow anyone to insert (place order from website)
create policy "Anyone can place order" on orders
  for insert with check (true);

-- Only service role can read/update orders
create policy "Service role reads orders" on orders
  for select using (auth.role() = 'service_role');

create policy "Service role updates orders" on orders
  for update using (auth.role() = 'service_role');
