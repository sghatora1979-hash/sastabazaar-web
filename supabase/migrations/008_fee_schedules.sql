-- SastaBazaar PRICING ENGINE v2 — admin-editable fee schedules (2026-10-12).
-- sb_fee_schedules: per-category platform fee, editable by platform admin.
-- Rates are COMMERCIAL (agreed with sellers), NOT government-fixed.
-- The pricing engine reads DB first, falls back to lib/commission.ts defaults.
--
-- Run AFTER 007 in Supabase SQL Editor.

create table if not exists public.sb_fee_schedules (
  category text primary key,
  rate_bps integer not null default 800,   -- basis points: 800 = 8%
  cap_paise integer not null default 10000, -- ₹100 max on the % portion
  updated_at timestamptz not null default now()
);

-- Seed from the code defaults (CATEGORY_RATES in lib/commission.ts).
insert into public.sb_fee_schedules (category, rate_bps, cap_paise) values
  ('grocery', 300, 10000),
  ('fmcg', 300, 10000),
  ('medicines', 400, 10000),
  ('electronics', 600, 10000),
  ('home', 800, 10000),
  ('beauty', 800, 10000),
  ('toys', 800, 10000),
  ('sports', 800, 10000),
  ('books', 500, 10000),
  ('fashion', 1200, 10000),
  ('default', 800, 10000)
on conflict (category) do nothing;

alter table public.sb_fee_schedules enable row level security;

-- Everyone (sellers included) can READ the fee schedule — transparency rule:
-- the seller must see all fees BEFORE listing or accepting an order.
drop policy if exists "fee_schedules read all" on public.sb_fee_schedules;
create policy "fee_schedules read all"
  on public.sb_fee_schedules for select
  using (true);

-- Only platform admin can change rates.
drop policy if exists "fee_schedules admin write" on public.sb_fee_schedules;
create policy "fee_schedules admin write"
  on public.sb_fee_schedules for all
  using (public.is_platform_admin())
  with check (public.is_platform_admin());
