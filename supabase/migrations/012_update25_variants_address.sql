-- Update 25: product variants (size/color/weight/dimensions) + full Indian address fields.
-- Run in Supabase Dashboard -> SQL Editor. Safe to re-run (IF NOT EXISTS / idempotent guards).

-- ---------------------------------------------------------------------------
-- 1. Product variant columns
-- ---------------------------------------------------------------------------
alter table public.products add column if not exists sizes text[] not null default '{}';
alter table public.products add column if not exists colors text[] not null default '{}';
alter table public.products add column if not exists weight_kg numeric;
alter table public.products add column if not exists dimensions_cm text;
alter table public.products add column if not exists size_template text;

-- ---------------------------------------------------------------------------
-- 2. Full Indian address columns (gali/mohalla, landmark, district, state)
-- ---------------------------------------------------------------------------
alter table public.addresses add column if not exists line2 text;
alter table public.addresses add column if not exists landmark text;
alter table public.addresses add column if not exists district text;
alter table public.addresses add column if not exists state text;
