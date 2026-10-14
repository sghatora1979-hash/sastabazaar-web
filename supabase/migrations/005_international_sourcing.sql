-- ============================================================================
-- SastaBazaar Update 22 — International Sellers & Sourcing module
-- ADDITIVE ONLY: no existing table, policy, or function is altered.
-- All tables are new. RLS enabled on all.
--
-- COUNTRY-AGNOSTIC by design: ANY origin country can list, ANY destination
-- country can be served. China -> India is seeded as the flagship example
-- corridor (per Sandeep's steer); Canada (CAD) is the secondary destination.
--
-- Privacy: wholesale costs (supplier_products) are NEVER publicly readable.
-- Retail customers only ever see retail_listings (public, retail-safe fields).
-- The intl_supplier_public() SECURITY DEFINER function exposes only
-- company_name / country / city for approved suppliers.
--
-- New tables:
--   intl_suppliers, supplier_products (PRIVATE wholesale), hs_code_duties,
--   shipping_lanes, quotations, exchange_rate_cache, retail_listings (PUBLIC),
--   intl_order_charges, ddp_coverage, supplier_payouts, intl_audit_log
-- New function: intl_supplier_public (approved suppliers, public fields only)
-- ============================================================================

create extension if not exists pgcrypto;

-- --------------------------------------------------------------------------
-- 0. Admin helper (idempotent; also defined in 004 — safe to re-declare)
-- --------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;
grant execute on function public.is_admin() to authenticated;

-- --------------------------------------------------------------------------
-- 1. International suppliers — ANY origin country (country is free text)
--    business_license_no is PRIVATE: no public SELECT policy on this table;
--    public display goes through intl_supplier_public() only.
-- --------------------------------------------------------------------------
create table if not exists public.intl_suppliers (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete set null,
  company_name text not null,
  country text not null,
  city text,
  contact_name text not null,
  contact_email text not null,
  contact_phone text,
  website text,
  years_in_business int check (years_in_business is null or years_in_business >= 0),
  business_license_no text,
  product_categories text,
  status text not null default 'pending'
    check (status in ('pending','approved','rejected','suspended')),
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_name, country)
);
create index if not exists intl_suppliers_profile_idx on public.intl_suppliers(profile_id);
create index if not exists intl_suppliers_status_idx on public.intl_suppliers(status);
create index if not exists intl_suppliers_country_idx on public.intl_suppliers(country);

-- --------------------------------------------------------------------------
-- 2. Supplier products — PRIVATE wholesale catalogue (CNY or charge_currency)
--    Never readable by retail customers. Owner + admin only.
-- --------------------------------------------------------------------------
create table if not exists public.supplier_products (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid not null references public.intl_suppliers(id) on delete cascade,
  title text not null,
  description text,
  specs jsonb not null default '{}',
  images text[] not null default '{}',
  wholesale_price numeric not null check (wholesale_price >= 0),
  wholesale_currency text not null default 'CNY',
  moq int not null default 1 check (moq >= 1),
  price_breaks jsonb not null default '[]',
  stock_qty int not null default 0 check (stock_qty >= 0),
  lead_time_days int not null default 7 check (lead_time_days >= 0),
  packing_charge numeric not null default 0,
  crate_charge numeric not null default 0,
  consolidation_fee numeric not null default 0,
  inspection_fee numeric not null default 0,
  charge_currency text not null default 'CNY',
  incoterms text not null default 'EXW'
    check (incoterms in ('EXW','FOB','CIF','DDP')),
  hs_code text,
  country_of_origin text not null,
  customs_docs text,
  status text not null default 'draft'
    check (status in ('draft','pending_approval','approved','rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (supplier_id, title)
);
create index if not exists supplier_products_supplier_idx on public.supplier_products(supplier_id);
create index if not exists supplier_products_status_idx on public.supplier_products(status);

-- --------------------------------------------------------------------------
-- 3. HS-code duty table — one row per (hs_code, dest_country). Country-agnostic:
--    adding a new destination = adding rows, never a schema change.
--    estimate=true means "indicative — confirm with a customs broker".
-- --------------------------------------------------------------------------
create table if not exists public.hs_code_duties (
  id uuid primary key default gen_random_uuid(),
  hs_code text not null,
  category_name text not null,
  dest_country text not null,
  duty_rate numeric not null default 0 check (duty_rate >= 0),
  tax_rate numeric not null default 0 check (tax_rate >= 0),
  tax_name text not null default 'GST',
  estimate boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  unique (hs_code, dest_country)
);
create index if not exists hs_code_duties_lookup_idx on public.hs_code_duties(hs_code, dest_country);

-- --------------------------------------------------------------------------
-- 4. Shipping lanes — origin_country -> dest_country, country-agnostic.
--    Freight quoted in freight_currency per kg (min charge per order).
-- --------------------------------------------------------------------------
create table if not exists public.shipping_lanes (
  id uuid primary key default gen_random_uuid(),
  origin_country text not null,
  origin_city text,
  dest_country text not null,
  dest_city text,
  carrier text not null,
  transit_days_min int not null check (transit_days_min >= 0),
  transit_days_max int not null check (transit_days_max >= transit_days_min),
  base_freight numeric not null check (base_freight >= 0),
  freight_currency text not null default 'CNY',
  min_charge numeric not null default 0 check (min_charge >= 0),
  min_charge_currency text not null default 'CNY',
  restrictions text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (origin_country, dest_country, carrier, origin_city, dest_city)
);
create index if not exists shipping_lanes_route_idx
  on public.shipping_lanes(origin_country, dest_country) where active;

-- --------------------------------------------------------------------------
-- 5. Supplier quotations (per destination, with expiry)
-- --------------------------------------------------------------------------
create table if not exists public.quotations (
  id uuid primary key default gen_random_uuid(),
  supplier_product_id uuid not null references public.supplier_products(id) on delete cascade,
  dest_country text not null,
  dest_pin text,
  freight_quote numeric not null check (freight_quote >= 0),
  freight_currency text not null default 'CNY',
  incoterm text not null default 'FOB' check (incoterm in ('EXW','FOB','CIF','DDP')),
  valid_until date not null,
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists quotations_product_idx on public.quotations(supplier_product_id);

-- --------------------------------------------------------------------------
-- 6. Exchange-rate cache (populated by /api/rates from a no-key provider)
-- --------------------------------------------------------------------------
create table if not exists public.exchange_rate_cache (
  id uuid primary key default gen_random_uuid(),
  base_currency text not null,
  target_currency text not null,
  rate numeric not null check (rate > 0),
  fetched_at timestamptz not null default now(),
  provider text not null default 'open.er-api.com',
  unique (base_currency, target_currency)
);

-- --------------------------------------------------------------------------
-- 7. Retail listings — the ONLY international table retail customers read.
--    Retail-safe fields only: no wholesale cost, no quotations, no margins
--    beyond the admin-chosen disclosed_margin_inr.
-- --------------------------------------------------------------------------
create table if not exists public.retail_listings (
  id uuid primary key default gen_random_uuid(),
  supplier_product_id uuid references public.supplier_products(id) on delete set null,
  supplier_id uuid references public.intl_suppliers(id) on delete set null,
  supplier_display_name text not null default '',
  supplier_country text not null default '',
  title text not null,
  description text,
  images text[] not null default '{}',
  specs jsonb not null default '{}',
  country_of_origin text not null default '',
  hs_code text,
  weight_kg numeric not null default 0.5 check (weight_kg > 0),
  retail_price_inr numeric not null check (retail_price_inr >= 0),
  disclosed_margin_inr numeric not null default 0 check (disclosed_margin_inr >= 0),
  availability text not null default 'In stock',
  processing_days int not null default 3 check (processing_days >= 0),
  warranty_text text,
  returns_text text,
  restrictions_text text,
  ddp_available boolean not null default false,
  ddp_note text,
  status text not null default 'active'
    check (status in ('active','paused','removed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (supplier_product_id)
);
create index if not exists retail_listings_status_idx
  on public.retail_listings(status) where status = 'active';
create index if not exists retail_listings_origin_idx on public.retail_listings(country_of_origin);

-- --------------------------------------------------------------------------
-- 8. Itemized landed-cost snapshots per order (audit trail of what the
--    customer was shown before payment)
-- --------------------------------------------------------------------------
create table if not exists public.intl_order_charges (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete set null,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  listing_id uuid references public.retail_listings(id) on delete set null,
  qty int not null default 1 check (qty > 0),
  currency text not null default 'INR',
  charges jsonb not null default '[]',
  fx_rate numeric,
  fx_timestamp timestamptz,
  fx_provider text,
  total numeric not null,
  estimate_flags jsonb not null default '{}',
  ddp_confirmed boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists intl_order_charges_profile_idx on public.intl_order_charges(profile_id);
create index if not exists intl_order_charges_order_idx on public.intl_order_charges(order_id);

-- --------------------------------------------------------------------------
-- 9. DDP coverage confirmations (only rows a supplier/logistics provider
--    has actually confirmed may drive "DDP included" messaging)
-- --------------------------------------------------------------------------
create table if not exists public.ddp_coverage (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.retail_listings(id) on delete cascade,
  dest_country text not null,
  provider text not null,
  included_charges text not null,
  verified boolean not null default false,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  unique (listing_id, dest_country, provider)
);

-- --------------------------------------------------------------------------
-- 10. Supplier payouts (masked references only)
-- --------------------------------------------------------------------------
create table if not exists public.supplier_payouts (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid not null references public.intl_suppliers(id) on delete cascade,
  period text not null,
  amount numeric not null,
  currency text not null default 'CNY',
  status text not null default 'pending'
    check (status in ('pending','processing','paid','failed')),
  payout_ref_masked text,
  note text,
  created_at timestamptz not null default now()
);
create index if not exists supplier_payouts_supplier_idx on public.supplier_payouts(supplier_id);

-- --------------------------------------------------------------------------
-- 11. Audit log for sourcing operations
-- --------------------------------------------------------------------------
create table if not exists public.intl_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity text not null,
  entity_id uuid,
  details jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index if not exists intl_audit_log_entity_idx on public.intl_audit_log(entity, entity_id);

-- --------------------------------------------------------------------------
-- 12. Public-safe supplier display (SECURITY DEFINER — approved only,
--     safe columns only; business_license_no can never leak through this)
-- --------------------------------------------------------------------------
create or replace function public.intl_supplier_public(p_supplier_id uuid)
returns table (company_name text, country text, city text, status text)
language sql
stable
security definer
set search_path = public
as $$
  select s.company_name, s.country, s.city, s.status
  from public.intl_suppliers s
  where s.id = p_supplier_id and s.status = 'approved';
$$;
grant execute on function public.intl_supplier_public(uuid) to anon, authenticated;

-- ============================================================================
-- RLS
-- ============================================================================
alter table public.intl_suppliers enable row level security;
alter table public.supplier_products enable row level security;
alter table public.hs_code_duties enable row level security;
alter table public.shipping_lanes enable row level security;
alter table public.quotations enable row level security;
alter table public.exchange_rate_cache enable row level security;
alter table public.retail_listings enable row level security;
alter table public.intl_order_charges enable row level security;
alter table public.ddp_coverage enable row level security;
alter table public.supplier_payouts enable row level security;
alter table public.intl_audit_log enable row level security;

-- ---- intl_suppliers: owner + admin only (NO public select — use the function)
drop policy if exists "intl_suppliers owner select" on public.intl_suppliers;
create policy "intl_suppliers owner select" on public.intl_suppliers
  for select to authenticated using (profile_id = auth.uid());
drop policy if exists "intl_suppliers owner insert" on public.intl_suppliers;
create policy "intl_suppliers owner insert" on public.intl_suppliers
  for insert to authenticated with check (profile_id = auth.uid());
drop policy if exists "intl_suppliers owner update" on public.intl_suppliers;
create policy "intl_suppliers owner update" on public.intl_suppliers
  for update to authenticated using (profile_id = auth.uid());
drop policy if exists "intl_suppliers admin all" on public.intl_suppliers;
create policy "intl_suppliers admin all" on public.intl_suppliers
  for all to authenticated using (public.is_admin());

-- ---- supplier_products: owner (via supplier) + admin only. NEVER public.
drop policy if exists "supplier_products owner all" on public.supplier_products;
create policy "supplier_products owner all" on public.supplier_products
  for all to authenticated using (
    exists (select 1 from public.intl_suppliers s
            where s.id = supplier_products.supplier_id and s.profile_id = auth.uid())
  );
drop policy if exists "supplier_products admin all" on public.supplier_products;
create policy "supplier_products admin all" on public.supplier_products
  for all to authenticated using (public.is_admin());

-- ---- retail_listings: public read of ACTIVE only; admin writes.
drop policy if exists "retail_listings public read" on public.retail_listings;
create policy "retail_listings public read" on public.retail_listings
  for select to anon, authenticated using (status = 'active');
drop policy if exists "retail_listings admin all" on public.retail_listings;
create policy "retail_listings admin all" on public.retail_listings
  for all to authenticated using (public.is_admin());

-- ---- reference tables: public read; admin writes.
drop policy if exists "hs_code_duties public read" on public.hs_code_duties;
create policy "hs_code_duties public read" on public.hs_code_duties
  for select to anon, authenticated using (true);
drop policy if exists "hs_code_duties admin write" on public.hs_code_duties;
create policy "hs_code_duties admin write" on public.hs_code_duties
  for all to authenticated using (public.is_admin());

drop policy if exists "shipping_lanes public read" on public.shipping_lanes;
create policy "shipping_lanes public read" on public.shipping_lanes
  for select to anon, authenticated using (true);
drop policy if exists "shipping_lanes admin write" on public.shipping_lanes;
create policy "shipping_lanes admin write" on public.shipping_lanes
  for all to authenticated using (public.is_admin());

drop policy if exists "ddp_coverage public read" on public.ddp_coverage;
create policy "ddp_coverage public read" on public.ddp_coverage
  for select to anon, authenticated using (true);
drop policy if exists "ddp_coverage admin write" on public.ddp_coverage;
create policy "ddp_coverage admin write" on public.ddp_coverage
  for all to authenticated using (public.is_admin());

drop policy if exists "exchange_rate_cache public read" on public.exchange_rate_cache;
create policy "exchange_rate_cache public read" on public.exchange_rate_cache
  for select to anon, authenticated using (true);
drop policy if exists "exchange_rate_cache admin write" on public.exchange_rate_cache;
create policy "exchange_rate_cache admin write" on public.exchange_rate_cache
  for all to authenticated using (public.is_admin());

-- ---- quotations: owner + admin.
drop policy if exists "quotations owner all" on public.quotations;
create policy "quotations owner all" on public.quotations
  for all to authenticated using (
    exists (select 1 from public.supplier_products sp
            join public.intl_suppliers s on s.id = sp.supplier_id
            where sp.id = quotations.supplier_product_id and s.profile_id = auth.uid())
  );
drop policy if exists "quotations admin all" on public.quotations;
create policy "quotations admin all" on public.quotations
  for all to authenticated using (public.is_admin());

-- ---- intl_order_charges: customer owns own rows; admin reads all.
drop policy if exists "intl_order_charges owner select" on public.intl_order_charges;
create policy "intl_order_charges owner select" on public.intl_order_charges
  for select to authenticated using (profile_id = auth.uid());
drop policy if exists "intl_order_charges owner insert" on public.intl_order_charges;
create policy "intl_order_charges owner insert" on public.intl_order_charges
  for insert to authenticated with check (profile_id = auth.uid());
drop policy if exists "intl_order_charges admin all" on public.intl_order_charges;
create policy "intl_order_charges admin all" on public.intl_order_charges
  for all to authenticated using (public.is_admin());

-- ---- supplier_payouts: owner + admin.
drop policy if exists "supplier_payouts owner select" on public.supplier_payouts;
create policy "supplier_payouts owner select" on public.supplier_payouts
  for select to authenticated using (
    exists (select 1 from public.intl_suppliers s
            where s.id = supplier_payouts.supplier_id and s.profile_id = auth.uid())
  );
drop policy if exists "supplier_payouts admin all" on public.supplier_payouts;
create policy "supplier_payouts admin all" on public.supplier_payouts
  for all to authenticated using (public.is_admin());

-- ---- intl_audit_log: admin reads; authenticated may append.
drop policy if exists "intl_audit_log admin select" on public.intl_audit_log;
create policy "intl_audit_log admin select" on public.intl_audit_log
  for select to authenticated using (public.is_admin());
drop policy if exists "intl_audit_log append" on public.intl_audit_log;
create policy "intl_audit_log append" on public.intl_audit_log
  for insert to authenticated with check (true);

-- ============================================================================
-- SEED DATA — flagship corridor FIRST: China -> India, then China -> Canada.
-- All duty figures are INDICATIVE estimates (estimate=true): confirm with a
-- customs broker before treating them as final.
-- ============================================================================

-- HS-code duties: India rows first, then Canada rows.
insert into public.hs_code_duties
  (hs_code, category_name, dest_country, duty_rate, tax_rate, tax_name, estimate, notes)
values
  ('8517.12','Mobile phones','IN',0.15,0.18,'GST',true,'Indicative BCD+GST — confirm with customs broker'),
  ('8517.62','Bluetooth / network accessories','IN',0.10,0.18,'GST',true,'Indicative BCD+GST — confirm with customs broker'),
  ('8543.70','Electronic gadgets n.e.s.','IN',0.10,0.18,'GST',true,'Indicative BCD+GST — confirm with customs broker'),
  ('9405.40','LED lamps & lighting','IN',0.10,0.12,'GST',true,'Indicative BCD+GST — confirm with customs broker'),
  ('9503.00','Toys & games','IN',0.60,0.12,'GST',true,'Indicative BCD+GST — toys carry high duty, confirm with broker'),
  ('7323.93','Stainless-steel kitchenware','IN',0.10,0.18,'GST',true,'Indicative BCD+GST — confirm with customs broker'),
  ('6403.99','Footwear','IN',0.35,0.18,'GST',true,'Indicative BCD+GST — confirm with customs broker'),
  ('4202.12','Bags & luggage','IN',0.10,0.18,'GST',true,'Indicative BCD+GST — confirm with customs broker'),
  ('8517.12','Mobile phones','CA',0.00,0.05,'GST',true,'MFN 0% indicative; 5% federal GST shown — HST/PST varies by province'),
  ('8517.62','Bluetooth / network accessories','CA',0.00,0.05,'GST',true,'MFN 0% indicative; 5% federal GST shown — HST/PST varies by province'),
  ('8543.70','Electronic gadgets n.e.s.','CA',0.00,0.05,'GST',true,'MFN 0% indicative; 5% federal GST shown — HST/PST varies by province'),
  ('9405.40','LED lamps & lighting','CA',0.06,0.05,'GST',true,'MFN indicative; 5% federal GST shown — HST/PST varies by province'),
  ('9503.00','Toys & games','CA',0.05,0.05,'GST',true,'MFN indicative; 5% federal GST shown — HST/PST varies by province'),
  ('7323.93','Stainless-steel kitchenware','CA',0.07,0.05,'GST',true,'MFN indicative; 5% federal GST shown — HST/PST varies by province'),
  ('6403.99','Footwear','CA',0.11,0.05,'GST',true,'MFN indicative; 5% federal GST shown — HST/PST varies by province'),
  ('4202.12','Bags & luggage','CA',0.08,0.05,'GST',true,'MFN indicative; 5% federal GST shown — HST/PST varies by province')
on conflict (hs_code, dest_country) do nothing;

-- Shipping lanes: China -> India FIRST (flagship), then China -> Canada.
insert into public.shipping_lanes
  (origin_country, origin_city, dest_country, dest_city, carrier,
   transit_days_min, transit_days_max, base_freight, freight_currency,
   min_charge, min_charge_currency, restrictions, active)
values
  ('China','Guangzhou','India','Mumbai','Sea consolidated',18,25,22,'CNY',180,'CNY','No liquids, batteries by DG approval only',true),
  ('China','Shenzhen','India','Delhi','Air express',7,10,68,'CNY',340,'CNY','Max 30 kg per parcel; batteries by DG approval only',true),
  ('China','Yiwu','India','Mumbai','Sea consolidated',20,28,20,'CNY',160,'CNY','No liquids, batteries by DG approval only',true),
  ('China','Guangzhou','Canada','Vancouver','Sea consolidated',25,32,24,'CNY',200,'CNY','Wooden packaging ISPM-15 required where applicable',true),
  ('China','Shenzhen','Canada','Toronto','Air express',7,12,72,'CNY',360,'CNY','Max 30 kg per parcel; batteries by DG approval only',true)
on conflict (origin_country, dest_country, carrier, origin_city, dest_city) do nothing;

-- Demo supplier (flagship corridor example). Real suppliers register via /supplier/register.
insert into public.intl_suppliers
  (company_name, country, city, contact_name, contact_email, contact_phone,
   website, years_in_business, product_categories, status)
values
  ('Shenzhen BrightStar Electronics Co., Ltd.','China','Shenzhen','Li Wei',
   'sales@brightstar-demo.example','+86-755-00000000','https://brightstar-demo.example',
   8,'Consumer electronics, LED lighting, kitchenware','approved')
on conflict (company_name, country) do nothing;

-- Demo supplier products (wholesale CNY — PRIVATE, never shown to retail).
insert into public.supplier_products
  (supplier_id, title, description, specs, images, wholesale_price, wholesale_currency,
   moq, price_breaks, stock_qty, lead_time_days, packing_charge, crate_charge,
   consolidation_fee, inspection_fee, charge_currency, incoterms, hs_code,
   country_of_origin, customs_docs, status)
values
  ((select id from public.intl_suppliers where company_name='Shenzhen BrightStar Electronics Co., Ltd.' and country='China'),
   'TWS Bluetooth Earbuds Pro','True wireless earbuds, BT 5.3, 36h case battery.',
   '{"bluetooth":"5.3","battery":"36h with case","warranty":"6 months"}',
   '{}',38,'CNY',50,'[{"qty":500,"price_cny":34},{"qty":2000,"price_cny":30}]',
   5000,5,2,0,8,5,'CNY','FOB','8517.62','China','Commercial invoice, packing list','approved'),
  ((select id from public.intl_suppliers where company_name='Shenzhen BrightStar Electronics Co., Ltd.' and country='China'),
   'LED Strip Light 5m RGB','5m RGB LED strip, USB powered, remote control.',
   '{"length":"5m","power":"USB 5V","colors":"RGB 16M"}',
   '{}',22,'CNY',100,'[{"qty":1000,"price_cny":19}]',
   12000,4,1,0,6,4,'CNY','FOB','9405.40','China','Commercial invoice, packing list','approved'),
  ((select id from public.intl_suppliers where company_name='Shenzhen BrightStar Electronics Co., Ltd.' and country='China'),
   'Stainless Steel Lunch Box 1.2L','Food-grade 304 stainless lunch box, leak-proof.',
   '{"capacity":"1.2L","material":"SS304","leak_proof":true}',
   '{}',15,'CNY',200,'[{"qty":2000,"price_cny":13}]',
   20000,6,1,0,5,3,'CNY','EXW','7323.93','China','Commercial invoice, packing list','approved')
on conflict (supplier_id, title) do nothing;

-- Public retail listings (INR) for the demo catalogue.
insert into public.retail_listings
  (supplier_product_id, supplier_id, supplier_display_name, supplier_country,
   title, description, specs, country_of_origin, hs_code, weight_kg,
   retail_price_inr, disclosed_margin_inr, availability, processing_days,
   warranty_text, returns_text, restrictions_text, ddp_available, ddp_note, status)
values
  ((select sp.id from public.supplier_products sp
     join public.intl_suppliers s on s.id = sp.supplier_id
     where sp.title='TWS Bluetooth Earbuds Pro' and s.company_name='Shenzhen BrightStar Electronics Co., Ltd.'),
   (select id from public.intl_suppliers where company_name='Shenzhen BrightStar Electronics Co., Ltd.' and country='China'),
   'Shenzhen BrightStar Electronics Co., Ltd.','China',
   'TWS Bluetooth Earbuds Pro','True wireless earbuds with 36-hour case battery, Bluetooth 5.3.',
   '{"bluetooth":"5.3","battery":"36h with case","warranty":"6 months"}',
   'China','8517.62',0.4,1299,180,'In stock',3,
   '6-month replacement warranty against manufacturing defects.',
   '7-day replacement for damaged/defective items. No returns on opened hygiene-sealed packs unless defective.',
   'Batteries ship under DG rules; delivery timeline may extend by 2-3 days.',
   false,'DDP not confirmed for this product — duties & taxes below are estimates.', 'active'),
  ((select sp.id from public.supplier_products sp
     join public.intl_suppliers s on s.id = sp.supplier_id
     where sp.title='LED Strip Light 5m RGB' and s.company_name='Shenzhen BrightStar Electronics Co., Ltd.'),
   (select id from public.intl_suppliers where company_name='Shenzhen BrightStar Electronics Co., Ltd.' and country='China'),
   'Shenzhen BrightStar Electronics Co., Ltd.','China',
   'LED Strip Light 5m RGB','5-metre RGB LED strip, USB powered with remote.',
   '{"length":"5m","power":"USB 5V","colors":"RGB 16M"}',
   'China','9405.40',0.3,799,120,'In stock',3,
   '6-month replacement warranty against manufacturing defects.',
   '7-day replacement for damaged/defective items.',
   'None.',
   false,'DDP not confirmed for this product — duties & taxes below are estimates.','active'),
  ((select sp.id from public.supplier_products sp
     join public.intl_suppliers s on s.id = sp.supplier_id
     where sp.title='Stainless Steel Lunch Box 1.2L' and s.company_name='Shenzhen BrightStar Electronics Co., Ltd.'),
   (select id from public.intl_suppliers where company_name='Shenzhen BrightStar Electronics Co., Ltd.' and country='China'),
   'Shenzhen BrightStar Electronics Co., Ltd.','China',
   'Stainless Steel Lunch Box 1.2L','Food-grade 304 stainless-steel lunch box, leak-proof.',
   '{"capacity":"1.2L","material":"SS304","leak_proof":true}',
   'China','7323.93',0.6,649,95,'In stock',4,
   '6-month replacement warranty against manufacturing defects.',
   '7-day replacement for damaged/defective items.',
   'None.',
   false,'DDP not confirmed for this product — duties & taxes below are estimates.','active')
on conflict (supplier_product_id) do nothing;

-- DDP coverage example (verified=false: shows the honest "not confirmed" state).
insert into public.ddp_coverage
  (listing_id, dest_country, provider, included_charges, verified)
values
  ((select rl.id from public.retail_listings rl where rl.title='TWS Bluetooth Earbuds Pro'),
   'IN','BrightStar Logistics Partner','duties, GST, clearance, last-mile',false)
on conflict (listing_id, dest_country, provider) do nothing;
