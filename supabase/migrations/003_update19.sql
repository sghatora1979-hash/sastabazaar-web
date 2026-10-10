-- ============================================================================
-- SastaBazaar Update 19
--   1. sellers.address — full street address on seller applications
--   2. orders.shipping — server-computed shipping stored on the order
--   3. products.promote_in — seller promo placements live in the DB
--      (cross-device), not browser localStorage
--   4. place_order(): shipping is computed SERVER-SIDE with the same rule
--      the storefront shows (Rs 49 below Rs 499, FREE at/above Rs 499).
--      total = subtotal + shipping. The browser never decides the total.
--   5. Sellers involved in an order may read its delivery address.
-- ============================================================================

-- 1. Street address on seller applications / seller records.
alter table public.sellers
  add column if not exists address text;

-- 2. Shipping stored per order.
alter table public.orders
  add column if not exists shipping numeric not null default 0;

-- 3. Promo placements on the product row.
alter table public.products
  add column if not exists promote_in text[] not null default '{}';

-- 4. place_order(): same atomic logic as 002, plus server-side shipping.
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
  v_shipping numeric := 0;
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

  insert into public.orders (profile_id, address_id, subtotal, commission, shipping, total, idempotency_key, payment_status)
  values (v_profile, p_address_id, 0, 0, 0, 0, nullif(p_idempotency_key, ''), 'pending')
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

  -- Server-side shipping, same rule the storefront displays:
  -- Rs 49 below Rs 499, FREE at Rs 499 and above.
  if v_subtotal >= 499 then
    v_shipping := 0;
  else
    v_shipping := 49;
  end if;

  update public.orders
  set subtotal = v_subtotal,
      commission = greatest(round(v_commission), 0),
      shipping = v_shipping,
      total = v_subtotal + v_shipping
  where id = v_order_id;

  -- Clear the buyer's cart.
  delete from public.cart_items where profile_id = v_profile;

  return v_order_id;
end;
$$;

-- Keep the execute grant (create or replace preserves it, but be explicit).
revoke all on function public.place_order(jsonb, uuid, text) from public, anon;
grant execute on function public.place_order(jsonb, uuid, text) to authenticated;

-- 5. Sellers involved in an order may read its delivery address.
--    (The existing "addresses owner all" policy stays for owners.)
drop policy if exists "addresses seller read" on public.addresses;
create policy "addresses seller read" on public.addresses
  for select using (
    exists (
      select 1
      from public.orders o
      join public.order_items oi on oi.order_id = o.id
      where o.address_id = addresses.id
        and oi.seller_id in (select public.my_seller_ids())
    )
  );

-- The order-update trigger in 002 whitelists which columns app users may
-- change; shipping is server-set, so forbid app-level changes to it.
-- (The trigger compares old/new values; add shipping to the guarded list.)
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
     or new.shipping is distinct from old.shipping
     or new.total is distinct from old.total
     or new.payment_status is distinct from old.payment_status
     or new.address_id is distinct from old.address_id
     or new.idempotency_key is distinct from old.idempotency_key then
    raise exception 'order amounts, shipping and payment are server-controlled';
  end if;
  return new;
end;
$$;
