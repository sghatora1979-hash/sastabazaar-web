-- ============================================================================
-- 007_promotions_ledger.sql — Marketplace automation: promotion switches +
-- commission/payout ledgers (Option A: marketplace collects, deducts, pays).
--
-- Tables:
--   sb_promo_switches    platform master ON/OFF per promotion feature
--   sb_seller_promos     seller-level toggles + campaign budget/rules
--   sb_commission_ledger per-order-line commission records (status pending→paid)
--   sb_payout_ledger     periodic seller payout summaries
--
-- REAL MONEY NOTE: these tables only RECORD what is owed. Actual money
-- movement needs Stripe/Razorpay connected + CA/tax sign-off. Do NOT mark
-- payouts 'paid' until a real gateway payout id exists (gateway_ref).
-- ============================================================================

-- --------------------------------------------------------------------------
-- 1. Platform master switches (one row per feature)
-- --------------------------------------------------------------------------
create table if not exists public.sb_promo_switches (
  feature text primary key
    check (feature in ('discount','rewards','lucky_draw','spin_win')),
  enabled boolean not null default false,
  note text,
  updated_at timestamptz not null default now()
);

insert into public.sb_promo_switches (feature, enabled, note) values
  ('discount',   true,  'Seller discounts & sale prices'),
  ('rewards',    false, 'Rewards & Refer-and-Earn budgets'),
  ('lucky_draw', false, 'Lucky draw campaigns — NEEDS LEGAL REVIEW before enabling'),
  ('spin_win',   false, 'Spin & Win campaigns — NEEDS LEGAL REVIEW before enabling')
on conflict (feature) do nothing;

-- --------------------------------------------------------------------------
-- 2. Seller-level promotion controls + campaign settings
-- --------------------------------------------------------------------------
create table if not exists public.sb_seller_promos (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.sellers(id) on delete cascade,
  feature text not null
    check (feature in ('discount','rewards','lucky_draw','spin_win')),
  enabled boolean not null default false,
  budget_paise int not null default 0 check (budget_paise >= 0),
  spend_paise int not null default 0 check (spend_paise >= 0),
  prize_text text,
  starts_at timestamptz,
  ends_at timestamptz,
  eligibility_rules text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (seller_id, feature)
);
create index if not exists sb_seller_promos_seller_idx
  on public.sb_seller_promos(seller_id);

-- --------------------------------------------------------------------------
-- 3. Commission ledger — one row per (order, seller, item-type) group.
--    Written by the app right after place_order succeeds (status 'pending').
-- --------------------------------------------------------------------------
create table if not exists public.sb_commission_ledger (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null,
  seller_id uuid references public.sellers(id) on delete set null,
  item_type text not null
    check (item_type in ('new','old','refurbished','clearance')),
  item_total_paise int not null check (item_total_paise >= 0),
  commission_paise int not null check (commission_paise >= 0),
  seller_payout_paise int not null check (seller_payout_paise >= 0),
  status text not null default 'pending'
    check (status in ('pending','held','paid')),
  created_at timestamptz not null default now()
);
create index if not exists sb_commission_ledger_order_idx
  on public.sb_commission_ledger(order_id);
create index if not exists sb_commission_ledger_seller_idx
  on public.sb_commission_ledger(seller_id);

-- --------------------------------------------------------------------------
-- 4. Payout ledger — periodic summaries per seller (e.g. period '2026-10').
--    'paid' only with a real gateway_ref. Until gateways are connected,
--    rows stay 'pending' — honest by design.
-- --------------------------------------------------------------------------
create table if not exists public.sb_payout_ledger (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.sellers(id) on delete cascade,
  period text not null,
  gross_paise int not null default 0 check (gross_paise >= 0),
  commission_paise int not null default 0 check (commission_paise >= 0),
  net_paise int not null default 0 check (net_paise >= 0),
  status text not null default 'pending'
    check (status in ('pending','processing','paid','failed')),
  gateway_ref text,
  created_at timestamptz not null default now(),
  unique (seller_id, period)
);
create index if not exists sb_payout_ledger_seller_idx
  on public.sb_payout_ledger(seller_id);

-- --------------------------------------------------------------------------
-- 5. Row-Level Security
--    - sb_promo_switches: readable by everyone (sellers must see master
--      state); writes = admin/service_role only.
--    - sb_seller_promos: sellers read/write ONLY their own rows.
--    - sb_commission_ledger: sellers read own; inserts allowed for the
--      buyer who just placed the order (app writes right after place_order).
--    - sb_payout_ledger: sellers read own; writes = admin/service_role.
-- --------------------------------------------------------------------------
alter table public.sb_promo_switches enable row level security;
alter table public.sb_seller_promos enable row level security;
alter table public.sb_commission_ledger enable row level security;
alter table public.sb_payout_ledger enable row level security;

-- helper: is the current user a platform admin?
create or replace function public.is_platform_admin()
returns boolean language sql stable as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  );
$$;

-- sb_promo_switches: public read
drop policy if exists "promo_switches read" on public.sb_promo_switches;
create policy "promo_switches read" on public.sb_promo_switches
  for select using (true);
-- sb_promo_switches: admin write
drop policy if exists "promo_switches admin write" on public.sb_promo_switches;
create policy "promo_switches admin write" on public.sb_promo_switches
  for all using (public.is_platform_admin())
  with check (public.is_platform_admin());

-- sb_seller_promos: seller owns rows
drop policy if exists "seller_promos owner all" on public.sb_seller_promos;
create policy "seller_promos owner all" on public.sb_seller_promos
  for all using (seller_id in (select public.my_seller_ids()))
  with check (seller_id in (select public.my_seller_ids()));
-- sb_seller_promos: admin all
drop policy if exists "seller_promos admin all" on public.sb_seller_promos;
create policy "seller_promos admin all" on public.sb_seller_promos
  for all using (public.is_platform_admin())
  with check (public.is_platform_admin());

-- sb_commission_ledger: seller reads own
drop policy if exists "commission_ledger seller read" on public.sb_commission_ledger;
create policy "commission_ledger seller read" on public.sb_commission_ledger
  for select using (seller_id in (select public.my_seller_ids()));
-- sb_commission_ledger: buyer who placed the order may insert (app hook)
drop policy if exists "commission_ledger buyer insert" on public.sb_commission_ledger;
create policy "commission_ledger buyer insert" on public.sb_commission_ledger
  for insert with check (
    exists (
      select 1 from public.orders o
      where o.id = sb_commission_ledger.order_id
        and o.profile_id = auth.uid()
    )
  );
-- sb_commission_ledger: admin all
drop policy if exists "commission_ledger admin all" on public.sb_commission_ledger;
create policy "commission_ledger admin all" on public.sb_commission_ledger
  for all using (public.is_platform_admin())
  with check (public.is_platform_admin());

-- sb_payout_ledger: seller reads own
drop policy if exists "payout_ledger seller read" on public.sb_payout_ledger;
create policy "payout_ledger seller read" on public.sb_payout_ledger
  for select using (seller_id in (select public.my_seller_ids()));
-- sb_payout_ledger: admin all
drop policy if exists "payout_ledger admin all" on public.sb_payout_ledger;
create policy "payout_ledger admin all" on public.sb_payout_ledger
  for all using (public.is_platform_admin())
  with check (public.is_platform_admin());

-- --------------------------------------------------------------------------
-- 6. Realtime: sellers see their promo toggles update live
-- --------------------------------------------------------------------------
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.sb_seller_promos;
  end if;
exception when duplicate_object then
  null;
end $$;
