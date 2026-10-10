-- ============================================================================
-- SastaBazaar Phase 0B — auth hardening, roles, atomic orders
-- Run this in Supabase Dashboard → SQL Editor AFTER 001_phase0_schema.sql.
-- Safe to re-run: uses IF NOT EXISTS / DROP IF EXISTS guards throughout.
-- ============================================================================

-- --------------------------------------------------------------------------
-- 1. Auto-create a profile row for every new auth user (role = customer)
-- --------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role, name)
  values (
    new.id,
    'customer',
    nullif(new.raw_user_meta_data ->> 'name', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- --------------------------------------------------------------------------
-- 2. Nobody can escalate their own role (only admins or service role can)
-- --------------------------------------------------------------------------
create or replace function public.guard_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_role text;
begin
  if new.role is distinct from old.role then
    -- service_role (auth.uid() is null) bypasses: used by admin tooling
    if auth.uid() is null then
      return new;
    end if;
    select role into actor_role from public.profiles where id = auth.uid();
    if actor_role is null or actor_role <> 'admin' then
      raise exception 'role changes require an administrator';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists guard_profile_role_trg on public.profiles;
create trigger guard_profile_role_trg
  before update on public.profiles
  for each row execute function public.guard_profile_role();

-- --------------------------------------------------------------------------
-- 3b. INSERT-time guards: privileged columns are forced to safe defaults.
--      (Without these, a user could insert their own row with status='approved'
--      or role='admin'. Admins and service_role are exempt.)
-- --------------------------------------------------------------------------
create or replace function public.guard_profile_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_role text;
begin
  if auth.uid() is null then
    return new; -- service_role / admin tooling
  end if;
  if auth.uid() = new.id then
    new.role := 'customer'; -- brand-new users always start as customers
    return new;
  end if;
  select role into actor_role from public.profiles where id = auth.uid();
  if actor_role = 'admin' then
    return new;
  end if;
  raise exception 'not authorized to create this profile';
end;
$$;

drop trigger if exists guard_profile_insert_trg on public.profiles;
create trigger guard_profile_insert_trg
  before insert on public.profiles
  for each row execute function public.guard_profile_insert();

create or replace function public.guard_seller_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_role text;
begin
  if auth.uid() is null then
    return new;
  end if;
  select role into actor_role from public.profiles where id = auth.uid();
  if actor_role = 'admin' then
    return new;
  end if;
  new.status := 'pending';
  new.kyc_status := 'pending';
  return new;
end;
$$;

drop trigger if exists guard_seller_insert_trg on public.sellers;
create trigger guard_seller_insert_trg
  before insert on public.sellers
  for each row execute function public.guard_seller_insert();

create or replace function public.guard_shop_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_role text;
begin
  if auth.uid() is null then
    return new;
  end if;
  select role into actor_role from public.profiles where id = auth.uid();
  if actor_role = 'admin' then
    return new;
  end if;
  new.status := 'pending';
  return new;
end;
$$;

drop trigger if exists guard_shop_insert_trg on public.shops;
create trigger guard_shop_insert_trg
  before insert on public.shops
  for each row execute function public.guard_shop_insert();

-- --------------------------------------------------------------------------
-- 3. Sellers cannot approve themselves on UPDATE (status/kyc_status are admin-only)
-- --------------------------------------------------------------------------
create or replace function public.guard_seller_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_role text;
begin
  if new.status is distinct from old.status
     or new.kyc_status is distinct from old.kyc_status then
    if auth.uid() is null then
      return new; -- service_role / admin tooling
    end if;
    select role into actor_role from public.profiles where id = auth.uid();
    if actor_role is null or actor_role <> 'admin' then
      raise exception 'only an administrator can change seller status';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists guard_seller_status_trg on public.sellers;
create trigger guard_seller_status_trg
  before update on public.sellers
  for each row execute function public.guard_seller_status();

-- --------------------------------------------------------------------------
-- 4. order_items: customers may insert items only into their OWN orders
--    (needed for checkout; prices are re-validated server-side in place_order)
-- --------------------------------------------------------------------------
drop policy if exists "order_items owner insert" on public.order_items;
create policy "order_items owner insert" on public.order_items
  for insert
  with check (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id
        and o.profile_id = auth.uid()
    )
  );

-- --------------------------------------------------------------------------
-- 5. Idempotency key on orders (prevents duplicate orders on retry)
-- --------------------------------------------------------------------------
alter table public.orders
  add column if not exists idempotency_key text unique;

-- --------------------------------------------------------------------------
-- 6. place_order(): atomic, server-side order placement
--    - caller must be authenticated (uses auth.uid(), RLS-bypassing but scoped)
--    - prices ALWAYS read from the products table, never from the client
--    - rows locked (FOR UPDATE) so concurrent checkouts cannot oversell
--    - two-tier commission: new-section 10% capped at Rs 100/order,
--      everything else flat Rs 1/piece (matches the seller agreement)
--    - idempotent: same idempotency key returns the existing order id
--    - clears the caller's cart on success
--    - payment_status stays 'pending' — NEVER mark paid from a browser action
-- --------------------------------------------------------------------------
create or replace function public.place_order(
  p_items jsonb,
  p_address_id uuid,
  p_idempotency_key text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile uuid := auth.uid();
  v_order_id uuid;
  v_item jsonb;
  v_product_id uuid;
  v_qty int;
  v_prod record;
  v_subtotal numeric := 0;
  v_new_subtotal numeric := 0;
  v_commission numeric := 0;
  v_item_comm numeric;
begin
  if v_profile is null then
    raise exception 'not authenticated';
  end if;

  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'cart is empty';
  end if;

  -- Idempotency: a retry with the same key returns the original order.
  if p_idempotency_key is not null and p_idempotency_key <> '' then
    select id into v_order_id
    from public.orders
    where idempotency_key = p_idempotency_key and profile_id = v_profile;
    if v_order_id is not null then
      return v_order_id;
    end if;
  end if;

  insert into public.orders (profile_id, address_id, subtotal, commission, total, idempotency_key, payment_status)
  values (v_profile, p_address_id, 0, 0, 0, nullif(p_idempotency_key, ''), 'pending')
  returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_product_id := nullif(v_item ->> 'product_id', '')::uuid;
    v_qty := nullif(v_item ->> 'qty', '')::int;
    if v_product_id is null or v_qty is null or v_qty <= 0 or v_qty > 100 then
      raise exception 'invalid item in cart';
    end if;

    -- Lock the product row: concurrent checkouts serialize here.
    select * into v_prod
    from public.products
    where id = v_product_id and status = 'active'
    for update;

    if not found then
      raise exception 'a product in your cart is no longer available';
    end if;
    if v_prod.stock < v_qty then
      raise exception 'only % left of "%"', v_prod.stock, v_prod.title;
    end if;

    -- Commission per the two-tier seller agreement.
    if v_prod.section = 'naya' then
      v_item_comm := round(v_prod.price * v_qty * 0.10);
      v_new_subtotal := v_new_subtotal + v_prod.price * v_qty;
    else
      v_item_comm := v_qty * 1; -- flat Rs 1/piece on old / refurbished / clearance
    end if;
    v_commission := v_commission + v_item_comm;

    insert into public.order_items (order_id, product_id, seller_id, qty, price, commission)
    values (v_order_id, v_prod.id, v_prod.seller_id, v_qty, v_prod.price, v_item_comm);

    update public.products set stock = stock - v_qty where id = v_prod.id;

    insert into public.stock_movements (product_id, change, reason)
    values (v_prod.id, -v_qty, 'order ' || v_order_id::text);

    v_subtotal := v_subtotal + v_prod.price * v_qty;
  end loop;

  -- Cap the 10% new-items commission at Rs 100 per order (seller agreement).
  if v_new_subtotal * 0.10 > 100 then
    v_commission := v_commission - (v_new_subtotal * 0.10 - 100);
  end if;

  update public.orders
  set subtotal = v_subtotal,
      commission = greatest(round(v_commission), 0),
      total = v_subtotal
  where id = v_order_id;

  -- Clear the buyer's cart.
  delete from public.cart_items where profile_id = v_profile;

  return v_order_id;
end;
$$;

-- Only authenticated users may call place_order (it checks auth.uid() itself).
revoke all on function public.place_order(jsonb, uuid, text) from public, anon;
grant execute on function public.place_order(jsonb, uuid, text) to authenticated;

-- --------------------------------------------------------------------------
-- 7. Order updates: owners and involved sellers may change STATUS only.
--    Amounts, payment_status and ownership are immutable from the app.
-- --------------------------------------------------------------------------
drop policy if exists "orders owner update" on public.orders;
create policy "orders owner update" on public.orders
  for update
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

drop policy if exists "orders seller update" on public.orders;
create policy "orders seller update" on public.orders
  for update
  using (
    exists (
      select 1 from public.order_items oi
      where oi.order_id = orders.id
        and oi.seller_id in (select public.my_seller_ids())
    )
  )
  with check (
    exists (
      select 1 from public.order_items oi
      where oi.order_id = orders.id
        and oi.seller_id in (select public.my_seller_ids())
    )
  );

create or replace function public.guard_order_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_role text;
  involved boolean;
begin
  if auth.uid() is null then
    return new; -- service_role / admin tooling
  end if;
  select role into actor_role from public.profiles where id = auth.uid();
  if actor_role = 'admin' then
    return new;
  end if;
  involved := (old.profile_id = auth.uid())
    or exists (
      select 1 from public.order_items oi
      where oi.order_id = old.id
        and oi.seller_id in (select public.my_seller_ids())
    );
  if not involved then
    raise exception 'not authorized to change this order';
  end if;
  if new.profile_id is distinct from old.profile_id
     or new.subtotal is distinct from old.subtotal
     or new.commission is distinct from old.commission
     or new.total is distinct from old.total
     or new.payment_status is distinct from old.payment_status
     or new.address_id is distinct from old.address_id
     or new.idempotency_key is distinct from old.idempotency_key then
    raise exception 'only the order status can be changed';
  end if;
  return new;
end;
$$;

drop trigger if exists guard_order_update_trg on public.orders;
create trigger guard_order_update_trg
  before update on public.orders
  for each row execute function public.guard_order_update();

-- ============================================================================
-- Manual admin setup (run once in SQL Editor as the project owner):
--
--   -- 1) Find your user id after you log in on the site:
--   select id, email from auth.users;
--
--   -- 2) Make yourself admin (service role bypasses RLS; the trigger allows
--   --    role changes only for admins/service_role, so this works):
--   update public.profiles set role = 'admin' where id = '<YOUR_USER_ID>';
--
--   -- 3) Approve a seller (sets role + status together):
--   update public.profiles set role = 'seller'
--     where id = '<SELLER_USER_ID>';
--   update public.sellers set status = 'approved', kyc_status = 'verified'
--     where profile_id = '<SELLER_USER_ID>';
-- ============================================================================
