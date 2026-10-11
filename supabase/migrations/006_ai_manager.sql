-- ============================================================================
-- SastaBazaar Update 24 — AI Marketplace Manager
-- ADDITIVE ONLY: all tables/policies/functions are new. No existing object
-- is altered. The AI READS data, DRAFTS emails/campaigns, SUGGESTS discounts.
-- It NEVER auto-changes a seller's price and NEVER publishes unapproved
-- discounts. Sellers approve every recommendation before anything goes live.
--
-- New tables:
--   ai_product_profile  — per-product AI data (costs PRIVATE: owner+admin only)
--   ai_campaigns        — festival/season/clearance/new_arrival campaigns
--   ai_recommendations  — AI picks per product (pending/approved/rejected)
--   ai_campaign_prices  — seller-APPROVED override prices (storefront reads)
--   ai_seller_emails    — email queue/log (queued/sent/demo_logged/error)
--   ai_audit_log        — EVERY AI action is logged here
--   ai_settings         — key/value knobs (margins, caps, schedule)
--   ai_run_history      — each analyzer run (status, counts, errors)
-- ============================================================================

create extension if not exists pgcrypto;

-- --------------------------------------------------------------------------
-- 1. Per-product AI profile (costs are PRIVATE — owner + admin only)
-- --------------------------------------------------------------------------
create table if not exists public.ai_product_profile (
  product_id uuid primary key references public.products(id) on delete cascade,
  seller_id uuid references public.sellers(id) on delete set null,
  manufacturing_date date,
  expiry_date date,
  purchase_cost numeric check (purchase_cost is null or purchase_cost >= 0), -- PRIVATE
  min_selling_price numeric check (min_selling_price is null or min_selling_price >= 0), -- PRIVATE floor
  supplier_location text,
  season_tags text[] not null default '{}',   -- e.g. {summer,winter,monsoon}
  festival_tags text[] not null default '{}', -- e.g. {diwali,holi,christmas}
  notes text,
  updated_at timestamptz not null default now()
);
create index if not exists ai_product_profile_seller_idx on public.ai_product_profile(seller_id);

-- --------------------------------------------------------------------------
-- 2. Campaigns
-- --------------------------------------------------------------------------
create table if not exists public.ai_campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null default 'festival'
    check (type in ('festival','season','clearance','new_arrival')),
  festival_id text, -- lib/festivals.ts id, e.g. 'diwali' (nullable for clearance)
  status text not null default 'draft'
    check (status in ('draft','active','completed','cancelled')),
  budget_cap numeric check (budget_cap is null or budget_cap >= 0),
  created_by text not null default 'ai' check (created_by in ('ai','admin')),
  starts_at timestamptz,
  ends_at timestamptz,
  notes text,
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists ai_campaigns_status_idx on public.ai_campaigns(status);

-- --------------------------------------------------------------------------
-- 3. Recommendations (AI picks — pending until seller/admin decides)
-- --------------------------------------------------------------------------
create table if not exists public.ai_recommendations (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  seller_id uuid not null references public.sellers(id) on delete cascade,
  campaign_id uuid references public.ai_campaigns(id) on delete set null,
  recommended_discount_pct numeric not null check (recommended_discount_pct >= 0 and recommended_discount_pct <= 90),
  recommended_price numeric not null check (recommended_price >= 0),
  reason jsonb not null default '{}',
  source text not null default 'rule_based' check (source in ('ai_llm','rule_based')),
  status text not null default 'pending'
    check (status in ('pending','approved','rejected')),
  decided_at timestamptz,
  decided_by text check (decided_by is null or decided_by in ('seller','admin')),
  created_at timestamptz not null default now(),
  unique (product_id, campaign_id)
);
create index if not exists ai_recommendations_seller_idx on public.ai_recommendations(seller_id);
create index if not exists ai_recommendations_status_idx on public.ai_recommendations(status);

-- --------------------------------------------------------------------------
-- 4. Campaign prices — seller-APPROVED overrides ONLY.
-- The base products.price is NEVER overwritten. The storefront shows the
-- override only while the campaign is active and within its date window.
-- --------------------------------------------------------------------------
create table if not exists public.ai_campaign_prices (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  -- nullable: bulk-negotiation overrides are not tied to a festival campaign
  campaign_id uuid references public.ai_campaigns(id) on delete cascade,
  override_price numeric not null check (override_price >= 0),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  approved_by text, -- 'seller' | 'admin'
  created_at timestamptz not null default now(),
  unique (product_id, campaign_id),
  check (ends_at > starts_at)
);
create index if not exists ai_campaign_prices_product_idx on public.ai_campaign_prices(product_id);

-- --------------------------------------------------------------------------
-- 5. Seller email queue / log
-- --------------------------------------------------------------------------
create table if not exists public.ai_seller_emails (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid references public.sellers(id) on delete set null,
  to_email text, -- nullable: sellers table has no email column (demo-safe)
  subject text not null,
  body text not null,
  related_campaign_id uuid references public.ai_campaigns(id) on delete set null,
  status text not null default 'queued'
    check (status in ('queued','sent','demo_logged','error')),
  provider text not null default 'demo',
  provider_msg_id text,
  error_text text,
  created_at timestamptz not null default now()
);
create index if not exists ai_seller_emails_seller_idx on public.ai_seller_emails(seller_id);
create index if not exists ai_seller_emails_status_idx on public.ai_seller_emails(status);

-- --------------------------------------------------------------------------
-- 6. Audit log — EVERY AI/system action lands here
-- --------------------------------------------------------------------------
create table if not exists public.ai_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor text not null check (actor in ('ai_system','admin','seller','cron')),
  action text not null,
  entity text not null,
  entity_id text,
  detail jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index if not exists ai_audit_log_created_idx on public.ai_audit_log(created_at desc);
create index if not exists ai_audit_log_entity_idx on public.ai_audit_log(entity, entity_id);

-- --------------------------------------------------------------------------
-- 7. Settings (key/value)
-- --------------------------------------------------------------------------
create table if not exists public.ai_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

-- --------------------------------------------------------------------------
-- 8. Run history
-- --------------------------------------------------------------------------
create table if not exists public.ai_run_history (
  id uuid primary key default gen_random_uuid(),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null default 'running'
    check (status in ('running','completed','failed','demo')),
  mode text not null default 'rule_based' check (mode in ('ai_llm','rule_based')),
  products_analyzed int not null default 0,
  recommendations_created int not null default 0,
  emails_queued int not null default 0,
  emails_sent int not null default 0,
  error text
);

-- ============================================================================
-- RLS — sellers see only their own rows; admins full; retail customers nothing
-- (except the public active-campaign price lookup used by the storefront).
-- ============================================================================
alter table public.ai_product_profile enable row level security;
alter table public.ai_campaigns enable row level security;
alter table public.ai_recommendations enable row level security;
alter table public.ai_campaign_prices enable row level security;
alter table public.ai_seller_emails enable row level security;
alter table public.ai_audit_log enable row level security;
alter table public.ai_settings enable row level security;
alter table public.ai_run_history enable row level security;

-- helper: seller owns this product (via products.seller_id -> sellers.profile_id)
create or replace function public.ai_owns_product(p_product_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1
    from public.products p
    join public.sellers s on s.id = p.seller_id
    where p.id = p_product_id and s.profile_id = auth.uid()
  );
$$;

-- helper: this row belongs to the caller's seller record
create or replace function public.ai_is_own_seller(p_seller_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.sellers
    where id = p_seller_id and profile_id = auth.uid()
  );
$$;

-- ---- ai_product_profile: owner + admin ----
drop policy if exists ai_pp_owner on public.ai_product_profile;
create policy ai_pp_owner on public.ai_product_profile for all to authenticated
  using (public.is_admin() or public.ai_owns_product(product_id))
  with check (public.is_admin() or public.ai_owns_product(product_id));

-- ---- ai_campaigns: admin write; sellers + authenticated read ----
drop policy if exists ai_camp_admin on public.ai_campaigns;
create policy ai_camp_admin on public.ai_campaigns for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
drop policy if exists ai_camp_read on public.ai_campaigns;
create policy ai_camp_read on public.ai_campaigns for select to authenticated
  using (true);

-- ---- ai_recommendations: admin all; sellers read+decide own ----
drop policy if exists ai_rec_admin on public.ai_recommendations;
create policy ai_rec_admin on public.ai_recommendations for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
drop policy if exists ai_rec_seller_read on public.ai_recommendations;
create policy ai_rec_seller_read on public.ai_recommendations for select to authenticated
  using (public.ai_is_own_seller(seller_id));
drop policy if exists ai_rec_seller_decide on public.ai_recommendations;
create policy ai_rec_seller_decide on public.ai_recommendations for update to authenticated
  using (public.ai_is_own_seller(seller_id) and status = 'pending')
  with check (public.ai_is_own_seller(seller_id) and status in ('approved','rejected'));

-- ---- ai_campaign_prices ----
-- Public (anon) read ONLY for currently-active campaign windows — this is what
-- the storefront uses. A row exists only after seller/admin approval.
drop policy if exists ai_cp_public_active on public.ai_campaign_prices;
create policy ai_cp_public_active on public.ai_campaign_prices for select to anon, authenticated
  using (
    exists (
      select 1 from public.ai_campaigns c
      where c.id = campaign_id and c.status = 'active'
        and now() >= starts_at and now() <= ends_at
    )
  );
drop policy if exists ai_cp_admin on public.ai_campaign_prices;
create policy ai_cp_admin on public.ai_campaign_prices for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
drop policy if exists ai_cp_seller_insert on public.ai_campaign_prices;
create policy ai_cp_seller_insert on public.ai_campaign_prices for insert to authenticated
  with check (
    public.is_admin() or public.ai_owns_product(product_id)
  );

-- ---- ai_seller_emails: admin all; sellers read own ----
drop policy if exists ai_mail_admin on public.ai_seller_emails;
create policy ai_mail_admin on public.ai_seller_emails for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
drop policy if exists ai_mail_seller_read on public.ai_seller_emails;
create policy ai_mail_seller_read on public.ai_seller_emails for select to authenticated
  using (seller_id is null or public.ai_is_own_seller(seller_id));

-- ---- ai_audit_log: admin all; sellers read rows about their products ----
drop policy if exists ai_audit_admin on public.ai_audit_log;
create policy ai_audit_admin on public.ai_audit_log for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ---- ai_settings / ai_run_history: admin only ----
drop policy if exists ai_settings_admin on public.ai_settings;
create policy ai_settings_admin on public.ai_settings for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
drop policy if exists ai_run_admin on public.ai_run_history;
create policy ai_run_admin on public.ai_run_history for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ============================================================================
-- Audit helper: authenticated users may log their own actor-appropriate rows.
-- (Sellers approve/reject recommendations from the UI; the UI writes the
-- audit trail through this function instead of direct table inserts.)
-- ============================================================================
create or replace function public.ai_log(
  p_actor text, p_action text, p_entity text, p_entity_id text, p_detail jsonb
)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if p_actor not in ('seller','admin','ai_system') then
    raise exception 'invalid actor';
  end if;
  -- sellers may only log their own actions
  if p_actor = 'seller' and not exists (
    select 1 from public.sellers where profile_id = auth.uid()
  ) then
    raise exception 'not a seller';
  end if;
  insert into public.ai_audit_log (actor, action, entity, entity_id, detail)
  values (p_actor, p_action, p_entity, p_entity_id, coalesce(p_detail, '{}'::jsonb));
end;
$$;
grant execute on function public.ai_log(text, text, text, text, jsonb) to authenticated;

-- ============================================================================
-- Seeds — settings + 2 DEMO campaigns (clearly labeled, draft status)
-- ============================================================================
insert into public.ai_settings (key, value) values
  ('margin_floor_pct', '15'),
  ('max_discount_pct', '40'),
  ('analysis_lookback_days', '90'),
  ('email_from_name', 'SastaBazaar AI Manager'),
  ('festival_window_days', '45'),
  ('demo_mode_note', 'AI key not configured — engine runs rule-based drafts until AI_API_KEY is set.')
on conflict (key) do nothing;

insert into public.ai_campaigns (name, type, festival_id, status, created_by, is_demo, notes) values
  ('Diwali Dhamaka — AI picks (demo)', 'festival', 'diwali', 'draft', 'ai', true,
   'Demo campaign seeded by migration 006. Activate only after reviewing AI recommendations.'),
  ('Winter Clearance — AI picks (demo)', 'season', null, 'draft', 'ai', true,
   'Demo campaign seeded by migration 006 for slow-moving / ageing stock.')
on conflict do nothing;

-- ============================================================================
-- Update 24b — Customer-side AI: demand capture, matching, negotiation,
-- consent-first outreach, regional personalization (ALL ADDITIVE)
-- ============================================================================

-- --------------------------------------------------------------------------
-- 9. Customer demands ("What are you looking for?")
-- --------------------------------------------------------------------------
create table if not exists public.ai_customer_demands (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.profiles(id) on delete set null, -- null = demo seed
  category text not null,
  description text not null,
  budget_min numeric check (budget_min is null or budget_min >= 0),
  budget_max numeric check (budget_max is null or budget_max >= 0),
  region text,   -- Indian state code, e.g. 'PB','TN','AS','MZ'
  language text, -- e.g. 'hi','en','pa','ta','as'
  status text not null default 'open' check (status in ('open','matched','closed')),
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists ai_demands_status_idx on public.ai_customer_demands(status);
create index if not exists ai_demands_cat_region_idx on public.ai_customer_demands(category, region);

-- --------------------------------------------------------------------------
-- 10. Demand <-> product matches
-- --------------------------------------------------------------------------
create table if not exists public.ai_matches (
  id uuid primary key default gen_random_uuid(),
  demand_id uuid not null references public.ai_customer_demands(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  seller_id uuid not null references public.sellers(id) on delete cascade,
  match_score int not null check (match_score between 0 and 100),
  reason text,
  created_at timestamptz not null default now(),
  unique (demand_id, product_id)
);
create index if not exists ai_matches_demand_idx on public.ai_matches(demand_id);
create index if not exists ai_matches_seller_idx on public.ai_matches(seller_id);

-- --------------------------------------------------------------------------
-- 11. Customer in-app notifications
-- --------------------------------------------------------------------------
create table if not exists public.ai_customer_notifications (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in ('match','festival','survey','info')),
  title text not null,
  body text not null,
  link text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists ai_cust_notif_customer_idx on public.ai_customer_notifications(customer_id);

-- --------------------------------------------------------------------------
-- 12. Customer prefs (region + language — customer-provided only, no tracking)
-- --------------------------------------------------------------------------
create table if not exists public.ai_customer_prefs (
  customer_id uuid primary key references public.profiles(id) on delete cascade,
  region text,
  language text,
  updated_at timestamptz not null default now()
);

-- --------------------------------------------------------------------------
-- 13. Outreach consents (consent-first — nothing sent without opt-in)
-- --------------------------------------------------------------------------
create table if not exists public.ai_outreach_consents (
  customer_id uuid not null references public.profiles(id) on delete cascade,
  channel text not null check (channel in ('email','telegram','facebook','instagram')),
  opted_in boolean not null default false,
  unsubscribed_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (customer_id, channel)
);

-- --------------------------------------------------------------------------
-- 14. Outreach log (every greeting/survey attempt recorded honestly)
-- --------------------------------------------------------------------------
create table if not exists public.ai_outreach_log (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.profiles(id) on delete set null,
  channel text not null,
  kind text not null check (kind in ('festival_greeting','survey')),
  festival_id text,
  status text not null check (status in ('sent','demo_logged','not_connected','skipped_unsubscribed','error')),
  detail text,
  created_at timestamptz not null default now()
);
create index if not exists ai_outreach_log_created_idx on public.ai_outreach_log(created_at desc);

-- --------------------------------------------------------------------------
-- 15. Negotiation proposals (demand clusters -> bulk offers to sellers)
-- --------------------------------------------------------------------------
create table if not exists public.ai_negotiations (
  id uuid primary key default gen_random_uuid(),
  cluster_key text not null,
  category text not null,
  region text,
  demand_count int not null,
  total_qty int not null,
  product_id uuid not null references public.products(id) on delete cascade,
  seller_id uuid not null references public.sellers(id) on delete cascade,
  proposed_price numeric not null check (proposed_price >= 0),
  counter_price numeric check (counter_price is null or counter_price >= 0),
  currency text not null default 'INR',
  econ jsonb not null default '{}', -- transparent math + labeled assumptions
  status text not null default 'pending' check (status in ('pending','accepted','modified','rejected')),
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  unique (cluster_key, product_id)
);
create index if not exists ai_negotiations_seller_idx on public.ai_negotiations(seller_id);

-- ============================================================================
-- RLS for customer-side tables
-- ============================================================================
alter table public.ai_customer_demands enable row level security;
alter table public.ai_matches enable row level security;
alter table public.ai_customer_notifications enable row level security;
alter table public.ai_customer_prefs enable row level security;
alter table public.ai_outreach_consents enable row level security;
alter table public.ai_outreach_log enable row level security;
alter table public.ai_negotiations enable row level security;

-- demands: customers CRUD own; sellers read OPEN demands (voluntary public posts);
-- admin all
drop policy if exists ai_dem_owner on public.ai_customer_demands;
create policy ai_dem_owner on public.ai_customer_demands for all to authenticated
  using (public.is_admin() or customer_id = auth.uid())
  with check (public.is_admin() or customer_id = auth.uid());
drop policy if exists ai_dem_seller_open on public.ai_customer_demands;
create policy ai_dem_seller_open on public.ai_customer_demands for select to authenticated
  using (status = 'open' and is_demo = false);

-- matches: customers see own demands' matches; sellers see own; admin all
drop policy if exists ai_match_admin on public.ai_matches;
create policy ai_match_admin on public.ai_matches for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
drop policy if exists ai_match_customer on public.ai_matches;
create policy ai_match_customer on public.ai_matches for select to authenticated
  using (exists (
    select 1 from public.ai_customer_demands d
    where d.id = demand_id and d.customer_id = auth.uid()
  ));
drop policy if exists ai_match_seller on public.ai_matches;
create policy ai_match_seller on public.ai_matches for select to authenticated
  using (public.ai_is_own_seller(seller_id));

-- notifications: owner read/update(read flag); admin all
drop policy if exists ai_notif_admin on public.ai_customer_notifications;
create policy ai_notif_admin on public.ai_customer_notifications for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
drop policy if exists ai_notif_owner on public.ai_customer_notifications;
create policy ai_notif_owner on public.ai_customer_notifications for select to authenticated
  using (customer_id = auth.uid());
drop policy if exists ai_notif_owner_upd on public.ai_customer_notifications;
create policy ai_notif_owner_upd on public.ai_customer_notifications for update to authenticated
  using (customer_id = auth.uid()) with check (customer_id = auth.uid());

-- prefs: owner all; admin all
drop policy if exists ai_prefs_owner on public.ai_customer_prefs;
create policy ai_prefs_owner on public.ai_customer_prefs for all to authenticated
  using (public.is_admin() or customer_id = auth.uid())
  with check (public.is_admin() or customer_id = auth.uid());

-- consents: owner all; admin all
drop policy if exists ai_consent_owner on public.ai_outreach_consents;
create policy ai_consent_owner on public.ai_outreach_consents for all to authenticated
  using (public.is_admin() or customer_id = auth.uid())
  with check (public.is_admin() or customer_id = auth.uid());

-- outreach log: admin all; customers read own
drop policy if exists ai_olog_admin on public.ai_outreach_log;
create policy ai_olog_admin on public.ai_outreach_log for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
drop policy if exists ai_olog_owner on public.ai_outreach_log;
create policy ai_olog_owner on public.ai_outreach_log for select to authenticated
  using (customer_id = auth.uid());

-- negotiations: admin all; sellers read + decide own
drop policy if exists ai_neg_admin on public.ai_negotiations;
create policy ai_neg_admin on public.ai_negotiations for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
drop policy if exists ai_neg_seller_read on public.ai_negotiations;
create policy ai_neg_seller_read on public.ai_negotiations for select to authenticated
  using (public.ai_is_own_seller(seller_id));
drop policy if exists ai_neg_seller_decide on public.ai_negotiations;
create policy ai_neg_seller_decide on public.ai_negotiations for update to authenticated
  using (public.ai_is_own_seller(seller_id) and status = 'pending')
  with check (public.ai_is_own_seller(seller_id) and status in ('accepted','modified','rejected'));

-- --------------------------------------------------------------------------
-- Privacy-safe demand trends (SECURITY DEFINER): category counts per region
-- for open, non-demo demands. No customer identifiers leak.
-- --------------------------------------------------------------------------
create or replace function public.ai_demand_trends(p_region text)
returns table (category text, demand_count bigint)
language sql stable security definer set search_path = public
as $$
  select d.category, count(*)::bigint
  from public.ai_customer_demands d
  where d.status = 'open' and d.is_demo = false
    and (p_region is null or d.region = p_region)
  group by d.category
  order by count(*) desc
  limit 12;
$$;
grant execute on function public.ai_demand_trends(text) to anon, authenticated;

-- --------------------------------------------------------------------------
-- Seeds: demo demands (Punjab, Tamil Nadu, Assam, Mizoram) — clearly labeled
-- --------------------------------------------------------------------------
insert into public.ai_customer_demands
  (customer_id, category, description, budget_min, budget_max, region, language, status, is_demo)
values
  (null, 'fashion-women', 'Festive kurtas for Diwali family function — cotton, bright colours', 500, 800, 'PB', 'pa', 'open', true),
  (null, 'home', 'Pongal decoration items — banana leaf plates, kolam stickers, diyas', 300, 1000, 'TN', 'ta', 'open', true),
  (null, 'handicraft', 'Authentic Assamese gamosa handloom — gift set of 4', 200, 600, 'AS', 'as', 'open', true),
  (null, 'handicraft', 'Bamboo home decor — lamps and wall hangings, natural finish', 400, 1200, 'MZ', 'en', 'open', true)
on conflict do nothing;

insert into public.ai_settings (key, value) values
  ('negotiation_cluster_min', '5'),
  ('outreach_festival_window_days', '14')
on conflict (key) do nothing;
