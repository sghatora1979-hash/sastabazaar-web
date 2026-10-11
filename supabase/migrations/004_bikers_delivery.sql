-- ============================================================================
-- SastaBazaar Update 21 — Bikers & Home Delivery module
-- ADDITIVE ONLY: no existing table, policy, or function is altered except by
-- CREATE OR REPLACE of new objects. All tables are new. RLS enabled on all.
--
-- New tables:
--   biker_profiles, biker_documents, vehicles, service_zones,
--   delivery_jobs, job_offers, delivery_events, otp_verifications,
--   delivery_messages, notifications, biker_earnings, delivery_disputes
-- New function: biker_public_profile (approved bikers, public fields only)
-- New bucket: biker-docs (PRIVATE — KYC documents)
-- New RPCs: claim_delivery_job, create_delivery_job_from_order,
--           request_delivery_otp, verify_delivery_otp, expire_stale_offers
-- ============================================================================

create extension if not exists pgcrypto;

-- --------------------------------------------------------------------------
-- 0. Admin helper (additive; existing code uses inline role checks)
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
-- 1. Biker profiles
-- --------------------------------------------------------------------------
create table if not exists public.biker_profiles (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles(id) on delete cascade,
  full_name text not null,
  phone text not null,
  email text,
  dob date,
  photo_url text,
  status text not null default 'draft'
    check (status in ('draft','pending_verification','approved','rejected','suspended','deactivated')),
  service_state text,
  service_city text,
  service_district text,
  service_pins text[] not null default '{}',
  delivery_radius_km int not null default 10 check (delivery_radius_km between 1 and 200),
  online boolean not null default false,
  emergency_name text,
  emergency_phone text,
  payout_note text, -- masked payout reference only (never raw account numbers)
  terms_accepted boolean not null default false,
  terms_accepted_at timestamptz,
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists biker_profiles_profile_idx on public.biker_profiles(profile_id);
create index if not exists biker_profiles_status_idx on public.biker_profiles(status);
create index if not exists biker_profiles_online_idx on public.biker_profiles(online) where status = 'approved';

-- --------------------------------------------------------------------------
-- 2. Biker KYC documents (metadata only — files live in the PRIVATE bucket)
--    Raw ID numbers are NEVER stored; only masked display values.
-- --------------------------------------------------------------------------
create table if not exists public.biker_documents (
  id uuid primary key default gen_random_uuid(),
  biker_id uuid not null references public.biker_profiles(id) on delete cascade,
  doc_type text not null
    check (doc_type in ('profile_photo','driving_licence','vehicle_rc','insurance','puc','aadhaar','pan')),
  file_path text not null,
  masked_value text,
  status text not null default 'pending'
    check (status in ('pending','verified','rejected')),
  reviewer_note text,
  created_at timestamptz not null default now(),
  unique (biker_id, doc_type)
);
create index if not exists biker_documents_biker_idx on public.biker_documents(biker_id);

-- --------------------------------------------------------------------------
-- 3. Vehicles
-- --------------------------------------------------------------------------
create table if not exists public.vehicles (
  id uuid primary key default gen_random_uuid(),
  biker_id uuid not null references public.biker_profiles(id) on delete cascade,
  vehicle_type text not null check (vehicle_type in ('bike','scooter','ev_bike')),
  registration_number text not null,
  make_model text,
  created_at timestamptz not null default now(),
  unique (biker_id)
);

-- --------------------------------------------------------------------------
-- 4. Service zones — Country → State → City → District → PIN → Zone
-- --------------------------------------------------------------------------
create table if not exists public.service_zones (
  id uuid primary key default gen_random_uuid(),
  country text not null default 'India',
  state text not null,
  city text not null,
  district text,
  pin text,
  zone_name text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists service_zones_pin_idx on public.service_zones(pin);
create index if not exists service_zones_city_idx on public.service_zones(city);

-- Seed demo zones (clearly marked; admins manage the real list).
insert into public.service_zones (state, city, district, pin, zone_name, active) values
  ('Karnataka','Bengaluru','Bengaluru Urban','560001','MG Road Zone', true),
  ('Karnataka','Bengaluru','Bengaluru Urban','560034','Koramangala Zone', true),
  ('Maharashtra','Mumbai','Mumbai Suburban','400001','Fort Zone', true),
  ('Delhi','New Delhi','New Delhi','110001','Connaught Place Zone', true),
  ('Uttarakhand','Dehradun','Dehradun','248001','Rajpur Road Zone', true)
on conflict do nothing;

-- --------------------------------------------------------------------------
-- 5. Delivery jobs
-- --------------------------------------------------------------------------
create table if not exists public.delivery_jobs (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete set null,
  shop_id uuid references public.shops(id) on delete set null,
  customer_profile_id uuid not null references public.profiles(id) on delete cascade,
  biker_profile_id uuid references public.biker_profiles(id) on delete set null,
  pickup_label text,
  pickup_address text,
  delivery_address_id uuid references public.addresses(id) on delete set null,
  status text not null default 'created'
    check (status in ('created','offered','assigned','picked_up','in_transit','delivered','cancelled','disputed')),
  delivery_fee numeric not null default 0 check (delivery_fee >= 0),
  distance_km numeric,
  eta_minutes int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists delivery_jobs_customer_idx on public.delivery_jobs(customer_profile_id);
create index if not exists delivery_jobs_biker_idx on public.delivery_jobs(biker_profile_id);
create index if not exists delivery_jobs_status_idx on public.delivery_jobs(status);
create index if not exists delivery_jobs_order_idx on public.delivery_jobs(order_id);

-- --------------------------------------------------------------------------
-- 6. Job offers (one active offer row per biker per job)
-- --------------------------------------------------------------------------
create table if not exists public.job_offers (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.delivery_jobs(id) on delete cascade,
  biker_profile_id uuid not null references public.biker_profiles(id) on delete cascade,
  status text not null default 'offered'
    check (status in ('offered','accepted','rejected','expired')),
  offered_at timestamptz not null default now(),
  expires_at timestamptz not null,
  responded_at timestamptz,
  unique (job_id, biker_profile_id)
);
create index if not exists job_offers_biker_idx on public.job_offers(biker_profile_id);
create index if not exists job_offers_job_idx on public.job_offers(job_id);

-- --------------------------------------------------------------------------
-- 7. Delivery events (audit trail)
-- --------------------------------------------------------------------------
create table if not exists public.delivery_events (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.delivery_jobs(id) on delete cascade,
  event_type text not null,
  actor_profile_id uuid references public.profiles(id) on delete set null,
  meta jsonb,
  created_at timestamptz not null default now()
);
create index if not exists delivery_events_job_idx on public.delivery_events(job_id);

-- --------------------------------------------------------------------------
-- 8. OTP verifications — codes stored as SHA-256 hashes, never plaintext
-- --------------------------------------------------------------------------
create table if not exists public.otp_verifications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.delivery_jobs(id) on delete cascade,
  purpose text not null check (purpose in ('pickup','delivery','phone_verify')),
  code_hash text not null,
  attempts int not null default 0,
  max_attempts int not null default 5,
  expires_at timestamptz not null,
  verified_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists otp_job_purpose_idx on public.otp_verifications(job_id, purpose);

-- --------------------------------------------------------------------------
-- 9. Order-specific customer ↔ biker chat
-- --------------------------------------------------------------------------
create table if not exists public.delivery_messages (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.delivery_jobs(id) on delete cascade,
  sender_profile_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz not null default now()
);
create index if not exists delivery_messages_job_idx on public.delivery_messages(job_id);

-- --------------------------------------------------------------------------
-- 10. Notifications
-- --------------------------------------------------------------------------
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  body text,
  kind text not null default 'info',
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists notifications_profile_idx on public.notifications(profile_id);

-- --------------------------------------------------------------------------
-- 11. Biker earnings & payouts
-- --------------------------------------------------------------------------
create table if not exists public.biker_earnings (
  id uuid primary key default gen_random_uuid(),
  biker_profile_id uuid not null references public.biker_profiles(id) on delete cascade,
  job_id uuid references public.delivery_jobs(id) on delete set null,
  amount numeric not null,
  kind text not null default 'delivery_fee'
    check (kind in ('delivery_fee','tip','adjustment','payout')),
  payout_status text not null default 'pending'
    check (payout_status in ('pending','paid')),
  payout_ref text,
  created_at timestamptz not null default now()
);
create index if not exists biker_earnings_biker_idx on public.biker_earnings(biker_profile_id);

-- --------------------------------------------------------------------------
-- 12. Delivery disputes
-- --------------------------------------------------------------------------
create table if not exists public.delivery_disputes (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.delivery_jobs(id) on delete cascade,
  raised_by uuid not null references public.profiles(id) on delete cascade,
  reason text not null,
  status text not null default 'open'
    check (status in ('open','in_review','resolved','rejected')),
  resolution text,
  created_at timestamptz not null default now()
);
create index if not exists delivery_disputes_job_idx on public.delivery_disputes(job_id);

-- --------------------------------------------------------------------------
-- 13. Public biker lookup — SECURITY DEFINER function returning ONLY public
--    fields of approved bikers (a plain view would inherit RLS and return
--    nothing to customers). Never exposes phone, email, DOB, or documents.
-- --------------------------------------------------------------------------
create or replace function public.biker_public_profile(p_biker_id uuid)
returns table (
  id uuid,
  full_name text,
  photo_url text,
  service_city text,
  online boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select b.id, b.full_name, b.photo_url, b.service_city, b.online
  from public.biker_profiles b
  where b.id = p_biker_id and b.status = 'approved';
$$;
grant execute on function public.biker_public_profile(uuid) to anon, authenticated;
revoke all on function public.biker_public_profile(uuid) from public;

-- --------------------------------------------------------------------------
-- 14. updated_at trigger
-- --------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
drop trigger if exists biker_profiles_touch on public.biker_profiles;
create trigger biker_profiles_touch before update on public.biker_profiles
  for each row execute function public.touch_updated_at();
drop trigger if exists delivery_jobs_touch on public.delivery_jobs;
create trigger delivery_jobs_touch before update on public.delivery_jobs
  for each row execute function public.touch_updated_at();

-- ============================================================================
-- 15. ROW LEVEL SECURITY
-- ============================================================================
alter table public.biker_profiles enable row level security;
alter table public.biker_documents enable row level security;
alter table public.vehicles enable row level security;
alter table public.service_zones enable row level security;
alter table public.delivery_jobs enable row level security;
alter table public.job_offers enable row level security;
alter table public.delivery_events enable row level security;
alter table public.otp_verifications enable row level security;
alter table public.delivery_messages enable row level security;
alter table public.notifications enable row level security;
alter table public.biker_earnings enable row level security;
alter table public.delivery_disputes enable row level security;

-- Helper: is the caller a participant in this job? (customer, assigned biker, admin)
create or replace function public.is_job_participant(p_job_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_admin()
    or exists (
      select 1 from public.delivery_jobs j
      left join public.biker_profiles b on b.id = j.biker_profile_id
      where j.id = p_job_id
        and (j.customer_profile_id = auth.uid() or b.profile_id = auth.uid())
    );
$$;
grant execute on function public.is_job_participant(uuid) to authenticated;

-- Helper: biker profile id of the caller (null when not a biker)
create or replace function public.my_biker_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.biker_profiles where profile_id = auth.uid() limit 1;
$$;
grant execute on function public.my_biker_id() to authenticated;

-- ---- biker_profiles ----
drop policy if exists "biker_profiles owner all" on public.biker_profiles;
create policy "biker_profiles owner all" on public.biker_profiles
  for all using (profile_id = auth.uid()) with check (profile_id = auth.uid());
drop policy if exists "biker_profiles admin all" on public.biker_profiles;
create policy "biker_profiles admin all" on public.biker_profiles
  for all using (public.is_admin()) with check (public.is_admin());
-- NOTE: owners cannot change their own status (guarded below); only admins can.

-- Owners may not self-approve / self-edit status or rejection fields.
create or replace function public.guard_biker_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then return new; end if; -- service_role tooling
  if public.is_admin() then return new; end if;
  if new.status is distinct from old.status
     or new.rejection_reason is distinct from old.rejection_reason then
    raise exception 'biker status changes require an administrator';
  end if;
  return new;
end;
$$;
drop trigger if exists guard_biker_status_trg on public.biker_profiles;
create trigger guard_biker_status_trg before update on public.biker_profiles
  for each row execute function public.guard_biker_status();

-- ---- biker_documents: owner + admin only, NEVER public ----
drop policy if exists "biker_documents owner read" on public.biker_documents;
create policy "biker_documents owner read" on public.biker_documents
  for select using (
    biker_id in (select id from public.biker_profiles where profile_id = auth.uid())
  );
drop policy if exists "biker_documents owner insert" on public.biker_documents;
create policy "biker_documents owner insert" on public.biker_documents
  for insert with check (
    biker_id in (select id from public.biker_profiles where profile_id = auth.uid())
  );
drop policy if exists "biker_documents admin all" on public.biker_documents;
create policy "biker_documents admin all" on public.biker_documents
  for all using (public.is_admin()) with check (public.is_admin());

-- ---- vehicles ----
drop policy if exists "vehicles owner all" on public.vehicles;
create policy "vehicles owner all" on public.vehicles
  for all using (
    biker_id in (select id from public.biker_profiles where profile_id = auth.uid())
  ) with check (
    biker_id in (select id from public.biker_profiles where profile_id = auth.uid())
  );
drop policy if exists "vehicles admin read" on public.vehicles;
create policy "vehicles admin read" on public.vehicles
  for select using (public.is_admin());

-- ---- service_zones: readable by everyone, writable by admins ----
drop policy if exists "service_zones public read" on public.service_zones;
create policy "service_zones public read" on public.service_zones
  for select using (true);
drop policy if exists "service_zones admin write" on public.service_zones;
create policy "service_zones admin write" on public.service_zones
  for all using (public.is_admin()) with check (public.is_admin());

-- ---- delivery_jobs ----
-- Reads: customer, assigned biker, involved shop sellers, admins.
drop policy if exists "delivery_jobs participant read" on public.delivery_jobs;
create policy "delivery_jobs participant read" on public.delivery_jobs
  for select using (
    public.is_job_participant(delivery_jobs.id)
    or exists (
      select 1 from public.order_items oi
      where oi.order_id = delivery_jobs.order_id
        and oi.seller_id in (select public.my_seller_ids())
    )
  );
-- No direct insert/update/delete for app users: all writes go through RPCs.
drop policy if exists "delivery_jobs admin all" on public.delivery_jobs;
create policy "delivery_jobs admin all" on public.delivery_jobs
  for all using (public.is_admin()) with check (public.is_admin());

-- ---- job_offers: bikers read/respond to their own offers ----
drop policy if exists "job_offers biker read" on public.job_offers;
create policy "job_offers biker read" on public.job_offers
  for select using (biker_profile_id = public.my_biker_id());
drop policy if exists "job_offers biker respond" on public.job_offers;
create policy "job_offers biker respond" on public.job_offers
  for update using (biker_profile_id = public.my_biker_id())
  with check (biker_profile_id = public.my_biker_id());
drop policy if exists "job_offers admin all" on public.job_offers;
create policy "job_offers admin all" on public.job_offers
  for all using (public.is_admin()) with check (public.is_admin());

-- ---- delivery_events: participants + admin read ----
drop policy if exists "delivery_events participant read" on public.delivery_events;
create policy "delivery_events participant read" on public.delivery_events
  for select using (public.is_job_participant(delivery_events.job_id));
drop policy if exists "delivery_events admin all" on public.delivery_events;
create policy "delivery_events admin all" on public.delivery_events
  for all using (public.is_admin()) with check (public.is_admin());

-- ---- otp_verifications: participants read (hashes only), writes via RPC ----
drop policy if exists "otp participant read" on public.otp_verifications;
create policy "otp participant read" on public.otp_verifications
  for select using (public.is_job_participant(otp_verifications.job_id));
drop policy if exists "otp admin all" on public.otp_verifications;
create policy "otp admin all" on public.otp_verifications
  for all using (public.is_admin()) with check (public.is_admin());

-- ---- delivery_messages: participants read; participants send ----
drop policy if exists "delivery_messages participant read" on public.delivery_messages;
create policy "delivery_messages participant read" on public.delivery_messages
  for select using (public.is_job_participant(delivery_messages.job_id));
drop policy if exists "delivery_messages participant send" on public.delivery_messages;
create policy "delivery_messages participant send" on public.delivery_messages
  for insert with check (
    sender_profile_id = auth.uid()
    and public.is_job_participant(delivery_messages.job_id)
  );

-- ---- notifications: owner read/update ----
drop policy if exists "notifications owner read" on public.notifications;
create policy "notifications owner read" on public.notifications
  for select using (profile_id = auth.uid());
drop policy if exists "notifications owner update" on public.notifications;
create policy "notifications owner update" on public.notifications
  for update using (profile_id = auth.uid()) with check (profile_id = auth.uid());

-- ---- biker_earnings: owner + admin ----
drop policy if exists "biker_earnings owner read" on public.biker_earnings;
create policy "biker_earnings owner read" on public.biker_earnings
  for select using (biker_profile_id = public.my_biker_id());
drop policy if exists "biker_earnings admin all" on public.biker_earnings;
create policy "biker_earnings admin all" on public.biker_earnings
  for all using (public.is_admin()) with check (public.is_admin());

-- ---- delivery_disputes ----
drop policy if exists "delivery_disputes raiser read" on public.delivery_disputes;
create policy "delivery_disputes raiser read" on public.delivery_disputes
  for select using (raised_by = auth.uid() or public.is_admin());
drop policy if exists "delivery_disputes participant raise" on public.delivery_disputes;
create policy "delivery_disputes participant raise" on public.delivery_disputes
  for insert with check (
    raised_by = auth.uid()
    and public.is_job_participant(delivery_disputes.job_id)
  );
drop policy if exists "delivery_disputes admin update" on public.delivery_disputes;
create policy "delivery_disputes admin update" on public.delivery_disputes
  for update using (public.is_admin()) with check (public.is_admin());

-- ============================================================================
-- 16. STORAGE — private 'biker-docs' bucket (KYC documents)
-- ============================================================================
insert into storage.buckets (id, name, public)
values ('biker-docs', 'biker-docs', false)
on conflict (id) do nothing;

drop policy if exists "biker-docs owner upload" on storage.objects;
create policy "biker-docs owner upload" on storage.objects
  for insert with check (
    bucket_id = 'biker-docs'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
drop policy if exists "biker-docs owner read" on storage.objects;
create policy "biker-docs owner read" on storage.objects
  for select using (
    bucket_id = 'biker-docs'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
drop policy if exists "biker-docs owner delete" on storage.objects;
create policy "biker-docs owner delete" on storage.objects
  for delete using (
    bucket_id = 'biker-docs'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
drop policy if exists "biker-docs admin read" on storage.objects;
create policy "biker-docs admin read" on storage.objects
  for select using (
    bucket_id = 'biker-docs' and public.is_admin()
  );

-- ============================================================================
-- 17. RPCs — atomic, server-side delivery operations
-- ============================================================================

-- Expire stale offers; reset jobs whose offers all lapsed back to 'created'.
create or replace function public.expire_stale_offers()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.job_offers
  set status = 'expired'
  where status = 'offered' and expires_at < now();

  update public.delivery_jobs j
  set status = 'created'
  where j.status = 'offered'
    and not exists (
      select 1 from public.job_offers o
      where o.job_id = j.id and o.status = 'offered' and o.expires_at >= now()
    );
end;
$$;
grant execute on function public.expire_stale_offers() to authenticated;

-- Create a delivery job from a real shop order. Caller must be an admin or a
-- seller involved in the order. Offers go to approved + online bikers serving
-- the delivery PIN / city. One order → one active job (idempotent).
create or replace function public.create_delivery_job_from_order(p_order_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order record;
  v_addr record;
  v_shop uuid;
  v_shop_name text;
  v_shop_city text;
  v_job_id uuid;
  v_biker record;
  v_fee numeric := 40;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;

  select * into v_order from public.orders where id = p_order_id;
  if not found then raise exception 'order not found'; end if;

  -- Authorization: admin, or a seller with items in this order.
  if not public.is_admin() then
    if not exists (
      select 1 from public.order_items oi
      where oi.order_id = p_order_id
        and oi.seller_id in (select public.my_seller_ids())
    ) then
      raise exception 'not authorized for this order';
    end if;
  end if;

  -- Idempotency: an active job already exists for this order.
  select id into v_job_id from public.delivery_jobs
  where order_id = p_order_id and status not in ('delivered','cancelled');
  if v_job_id is not null then return v_job_id; end if;

  select * into v_addr from public.addresses where id = v_order.address_id;

  -- Shop comes via the ordered products (order_items has seller_id only).
  select p.shop_id, s.name, s.city into v_shop, v_shop_name, v_shop_city
  from public.order_items oi
  join public.products p on p.id = oi.product_id
  left join public.shops s on s.id = p.shop_id
  where oi.order_id = p_order_id and p.shop_id is not null
  limit 1;

  -- Simple demo fee: Rs 40 base. (Real fee engine: distance × zone rate.)
  insert into public.delivery_jobs
    (order_id, shop_id, customer_profile_id, delivery_address_id,
     pickup_label, pickup_address, delivery_fee, status)
  values
    (p_order_id, v_shop, v_order.profile_id, v_order.address_id,
     coalesce(v_shop_name, 'Shop pickup'),
     coalesce(v_shop_city, 'Shop address on file'),
     v_fee, 'created')
  returning id into v_job_id;

  -- Offer to eligible bikers: approved, online, serving the PIN or city.
  for v_biker in
    select bp.id, bp.profile_id
    from public.biker_profiles bp
    where bp.status = 'approved' and bp.online = true
      and (
        (v_addr.pin is not null and v_addr.pin = any (bp.service_pins))
        or (v_addr.city is not null and bp.service_city ilike v_addr.city)
      )
  loop
    insert into public.job_offers (job_id, biker_profile_id, expires_at)
    values (v_job_id, v_biker.id, now() + interval '10 minutes')
    on conflict (job_id, biker_profile_id) do nothing;

    insert into public.notifications (profile_id, title, body, kind)
    values (v_biker.profile_id, '🚴 New delivery job',
            'A delivery job is available near you. Open the biker app to accept.',
            'job_offer');
  end loop;

  if exists (select 1 from public.job_offers where job_id = v_job_id and status = 'offered') then
    update public.delivery_jobs set status = 'offered' where id = v_job_id;
  end if;

  insert into public.delivery_events (job_id, event_type, actor_profile_id, meta)
  values (v_job_id, 'job_created', auth.uid(), jsonb_build_object('order_id', p_order_id));

  insert into public.notifications (profile_id, title, body, kind)
  values (v_order.profile_id, '📦 Home delivery arranged',
          'Your order will be delivered by a SastaBazaar biker. Track it live.',
          'job_update');

  return v_job_id;
end;
$$;
grant execute on function public.create_delivery_job_from_order(uuid) to authenticated;
revoke all on function public.create_delivery_job_from_order(uuid) from public, anon;

-- Atomic claim: exactly ONE biker can take a job. Row lock serializes racers.
create or replace function public.claim_delivery_job(p_job_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_biker_id uuid;
  v_job record;
  v_offer record;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  perform public.expire_stale_offers();

  select id into v_biker_id
  from public.biker_profiles
  where profile_id = auth.uid() and status = 'approved' and online = true;
  if v_biker_id is null then
    raise exception 'only approved, online bikers can accept jobs';
  end if;

  -- Lock the job row: concurrent claims serialize here; only one wins.
  select * into v_job from public.delivery_jobs where id = p_job_id for update;
  if not found then raise exception 'job not found'; end if;
  if v_job.status not in ('created','offered') then
    raise exception 'job is no longer available';
  end if;

  -- Caller must hold a live offer (or the job was never offered yet).
  select * into v_offer from public.job_offers
  where job_id = p_job_id and biker_profile_id = v_biker_id
    and status = 'offered' and expires_at >= now();
  if not found and v_job.status = 'offered' then
    raise exception 'this offer is not available to you';
  end if;

  update public.delivery_jobs
  set biker_profile_id = v_biker_id, status = 'assigned'
  where id = p_job_id;

  update public.job_offers
  set status = 'accepted', responded_at = now()
  where job_id = p_job_id and biker_profile_id = v_biker_id;

  -- Everyone else's offer closes: one order, one biker.
  update public.job_offers
  set status = 'expired'
  where job_id = p_job_id and biker_profile_id <> v_biker_id and status = 'offered';

  insert into public.delivery_events (job_id, event_type, actor_profile_id)
  values (p_job_id, 'assigned', auth.uid());

  insert into public.notifications (profile_id, title, body, kind)
  select j.customer_profile_id, '🚴 Biker assigned',
         'Your delivery partner is on the way. Track your order live.',
         'job_update'
  from public.delivery_jobs j where j.id = p_job_id;

  return p_job_id;
end;
$$;
grant execute on function public.claim_delivery_job(uuid) to authenticated;
revoke all on function public.claim_delivery_job(uuid) from public, anon;

-- Biker rejects an offer → notify next eligible bikers is handled by re-dispatch.
create or replace function public.reject_job_offer(p_offer_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  update public.job_offers o
  set status = 'rejected', responded_at = now()
  from public.biker_profiles b
  where o.id = p_offer_id
    and o.biker_profile_id = b.id
    and b.profile_id = auth.uid()
    and o.status = 'offered';
end;
$$;
grant execute on function public.reject_job_offer(uuid) to authenticated;
revoke all on function public.reject_job_offer(uuid) from public, anon;

-- Issue a 6-digit OTP (SHA-256 stored). DEMO: the code is returned to the
-- caller and shown in the UI because no SMS provider is configured.
-- With a real SMS provider, this RPC would send the SMS and return no code.
create or replace function public.request_delivery_otp(p_job_id uuid, p_purpose text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  if p_purpose not in ('pickup','delivery','phone_verify') then
    raise exception 'invalid otp purpose';
  end if;
  if not public.is_job_participant(p_job_id) then
    raise exception 'not authorized for this job';
  end if;

  -- Invalidate older unverified codes for the same purpose.
  update public.otp_verifications
  set expires_at = now()
  where job_id = p_job_id and purpose = p_purpose and verified_at is null;

  v_code := lpad((floor(random() * 1000000))::int::text, 6, '0');
  insert into public.otp_verifications (job_id, purpose, code_hash, expires_at)
  values (p_job_id, p_purpose,
          encode(digest(v_code, 'sha256'), 'hex'),
          now() + interval '10 minutes');

  insert into public.delivery_events (job_id, event_type, actor_profile_id,
          meta)
  values (p_job_id, 'otp_issued', auth.uid(),
          jsonb_build_object('purpose', p_purpose));

  return v_code; -- DEMO ONLY: remove when a real SMS provider is wired.
end;
$$;
grant execute on function public.request_delivery_otp(uuid, text) to authenticated;
revoke all on function public.request_delivery_otp(uuid, text) from public, anon;

-- Verify an OTP. Rate-limited (5 attempts), 10-minute expiry. On success
-- advances the job: pickup OTP → picked_up; delivery OTP → delivered +
-- biker earnings row. Returns true on success, raises otherwise.
create or replace function public.verify_delivery_otp(
  p_job_id uuid, p_purpose text, p_code text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_otp record;
  v_job record;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  if p_purpose not in ('pickup','delivery','phone_verify') then
    raise exception 'invalid otp purpose';
  end if;
  if not public.is_job_participant(p_job_id) then
    raise exception 'not authorized for this job';
  end if;

  select * into v_otp
  from public.otp_verifications
  where job_id = p_job_id and purpose = p_purpose
    and verified_at is null
  order by created_at desc limit 1
  for update;
  if not found then raise exception 'no active code for this step'; end if;
  if v_otp.expires_at < now() then raise exception 'code expired — request a new one'; end if;
  if v_otp.attempts >= v_otp.max_attempts then
    raise exception 'too many attempts — request a new code';
  end if;

  if v_otp.code_hash <> encode(digest(p_code, 'sha256'), 'hex') then
    update public.otp_verifications set attempts = attempts + 1 where id = v_otp.id;
    raise exception 'wrong code';
  end if;

  update public.otp_verifications set verified_at = now() where id = v_otp.id;
  select * into v_job from public.delivery_jobs where id = p_job_id for update;

  if p_purpose = 'pickup' then
    if v_job.status <> 'assigned' then raise exception 'job is not ready for pickup'; end if;
    update public.delivery_jobs set status = 'picked_up' where id = p_job_id;
    insert into public.delivery_events (job_id, event_type, actor_profile_id)
    values (p_job_id, 'picked_up', auth.uid());
  elsif p_purpose = 'delivery' then
    if v_job.status not in ('picked_up','in_transit') then
      raise exception 'job is not out for delivery';
    end if;
    update public.delivery_jobs set status = 'delivered' where id = p_job_id;
    insert into public.delivery_events (job_id, event_type, actor_profile_id)
    values (p_job_id, 'delivered', auth.uid());
    -- Pay the biker (demo ledger — real payouts need a payout provider).
    insert into public.biker_earnings (biker_profile_id, job_id, amount, kind)
    values (v_job.biker_profile_id, p_job_id, v_job.delivery_fee, 'delivery_fee');
    insert into public.notifications (profile_id, title, body, kind)
    values (v_job.customer_profile_id, '✅ Delivered',
            'Your order was delivered. Rate your experience!',
            'job_update');
  end if;

  return true;
end;
$$;
grant execute on function public.verify_delivery_otp(uuid, text, text) to authenticated;
revoke all on function public.verify_delivery_otp(uuid, text, text) from public, anon;

-- Biker marks "in transit" after pickup (customer sees live status).
create or replace function public.mark_in_transit(p_job_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_biker uuid := public.my_biker_id();
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  update public.delivery_jobs
  set status = 'in_transit'
  where id = p_job_id and biker_profile_id = v_biker and status = 'picked_up';
  if not found then raise exception 'cannot mark in transit'; end if;
  insert into public.delivery_events (job_id, event_type, actor_profile_id)
  values (p_job_id, 'in_transit', auth.uid());
end;
$$;
grant execute on function public.mark_in_transit(uuid) to authenticated;
revoke all on function public.mark_in_transit(uuid) from public, anon;
