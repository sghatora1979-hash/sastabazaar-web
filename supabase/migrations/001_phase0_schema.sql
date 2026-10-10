-- ============================================================================
-- SastaBazaar Phase 0 — core schema
-- Run this in Supabase Dashboard → SQL Editor → New query → paste → Run.
-- Safe to re-run: uses IF NOT EXISTS guards throughout.
-- ============================================================================

-- --------------------------------------------------------------------------
-- 1. Categories (slug is the natural key; matches the app's category slugs)
-- --------------------------------------------------------------------------
create table if not exists public.categories (
  slug text primary key,
  name text not null,
  name_hi text,
  emoji text,
  subcategories text[] not null default '{}'
);

-- --------------------------------------------------------------------------
-- 2. Profiles (one row per auth user; id matches auth.users.id)
-- --------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'customer' check (role in ('customer','seller','admin')),
  name text,
  phone text unique,
  created_at timestamptz not null default now()
);

-- --------------------------------------------------------------------------
-- 3. Sellers
-- --------------------------------------------------------------------------
create table if not exists public.sellers (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  business_name text not null,
  business_name_hi text,
  phone text not null,
  category text,
  city text,
  area text,
  pin text,
  state text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  kyc_status text not null default 'pending' check (kyc_status in ('pending','submitted','verified','rejected')),
  created_at timestamptz not null default now()
);
create index if not exists sellers_profile_idx on public.sellers(profile_id);
create index if not exists sellers_status_idx on public.sellers(status);

-- --------------------------------------------------------------------------
-- 4. Shops (public storefronts)
-- --------------------------------------------------------------------------
create table if not exists public.shops (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.sellers(id) on delete cascade,
  name text not null,
  name_hi text,
  photo_url text,
  phone text,
  whatsapp text,
  category text,
  city text,
  area text,
  pin text,
  delivery_modes text[] not null default '{pickup}',
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  rating numeric not null default 5.0,
  created_at timestamptz not null default now()
);
create index if not exists shops_seller_idx on public.shops(seller_id);
create index if not exists shops_status_idx on public.shops(status);

-- --------------------------------------------------------------------------
-- 5. Products (catalog — seeded from the demo catalog on day one)
-- --------------------------------------------------------------------------
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  title_hi text,
  description text,
  highlights text[] not null default '{}',
  section text not null default 'naya' check (section in ('naya','purana','clearance','local')),
  category_slug text references public.categories(slug),
  subcategory text,
  price numeric not null check (price >= 0),
  mrp numeric not null check (mrp >= 0),
  discount_percent int not null default 0,
  image text,
  images text[] not null default '{}',
  rating numeric not null default 4.0,
  seller_name text,
  seller_rating numeric not null default 4.5,
  seller_id uuid references public.sellers(id) on delete set null,
  shop_id uuid references public.shops(id) on delete set null,
  city text,
  condition text,
  stock int not null default 0 check (stock >= 0),
  deal_score int not null default 0,
  status text not null default 'active' check (status in ('active','paused','removed')),
  created_at timestamptz not null default now()
);
create index if not exists products_slug_idx on public.products(slug);
create index if not exists products_section_idx on public.products(section);
create index if not exists products_category_idx on public.products(category_slug);
create index if not exists products_status_idx on public.products(status);
create index if not exists products_seller_idx on public.products(seller_id);

-- --------------------------------------------------------------------------
-- 6. Stock movements (audit trail for inventory changes)
-- --------------------------------------------------------------------------
create table if not exists public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  change int not null,
  reason text,
  created_at timestamptz not null default now()
);

-- --------------------------------------------------------------------------
-- 7. Carts, addresses, orders, order items
-- --------------------------------------------------------------------------
create table if not exists public.cart_items (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  qty int not null check (qty > 0),
  primary key (profile_id, product_id)
);

create table if not exists public.addresses (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  label text,
  line1 text,
  city text,
  pin text,
  phone text
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  address_id uuid references public.addresses(id) on delete set null,
  status text not null default 'placed'
    check (status in ('placed','confirmed','packed','shipped','delivered','cancelled','refunded')),
  subtotal numeric not null,
  commission numeric not null,
  total numeric not null,
  payment_status text not null default 'pending'
    check (payment_status in ('pending','paid','failed','refunded')),
  created_at timestamptz not null default now()
);
create index if not exists orders_profile_idx on public.orders(profile_id);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id),
  seller_id uuid references public.sellers(id) on delete set null,
  qty int not null check (qty > 0),
  price numeric not null,
  commission numeric not null
);
create index if not exists order_items_order_idx on public.order_items(order_id);
create index if not exists order_items_seller_idx on public.order_items(seller_id);

-- --------------------------------------------------------------------------
-- 8. Reviews, feedback, referrals, lucky draw
-- --------------------------------------------------------------------------
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  rating int check (rating between 1 and 5),
  text text,
  created_at timestamptz not null default now()
);

create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete set null,
  kind text,
  topic text,
  message text,
  rating int,
  created_at timestamptz not null default now()
);

create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid references public.profiles(id) on delete set null,
  referee_phone text,
  reward_status text not null default 'pending',
  created_at timestamptz not null default now()
);

create table if not exists public.lucky_draw_entries (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete set null,
  phone text,
  draw_date date,
  claim_code text,
  created_at timestamptz not null default now()
);

-- --------------------------------------------------------------------------
-- 9. Audit log (who changed what — written by server-side code)
-- --------------------------------------------------------------------------
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity text,
  entity_id text,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- 10. Row-Level Security — the database enforces permissions, not just the app
-- ============================================================================
alter table public.categories   enable row level security;
alter table public.profiles     enable row level security;
alter table public.sellers      enable row level security;
alter table public.shops        enable row level security;
alter table public.products     enable row level security;
alter table public.stock_movements enable row level security;
alter table public.cart_items   enable row level security;
alter table public.addresses    enable row level security;
alter table public.orders       enable row level security;
alter table public.order_items  enable row level security;
alter table public.reviews      enable row level security;
alter table public.feedback     enable row level security;
alter table public.referrals    enable row level security;
alter table public.lucky_draw_entries enable row level security;
alter table public.audit_logs   enable row level security;

-- Helper: seller ids owned by the current user
create or replace function public.my_seller_ids()
returns setof uuid
language sql security definer stable
as $$ select id from public.sellers where profile_id = auth.uid() $$;

-- Categories: public read; writes via service role only
drop policy if exists "categories public read" on public.categories;
create policy "categories public read" on public.categories
  for select using (true);

-- Profiles: users see and edit only their own row
drop policy if exists "profiles owner read" on public.profiles;
create policy "profiles owner read" on public.profiles
  for select using (auth.uid() = id);
drop policy if exists "profiles owner insert" on public.profiles;
create policy "profiles owner insert" on public.profiles
  for insert with check (auth.uid() = id);
drop policy if exists "profiles owner update" on public.profiles;
create policy "profiles owner update" on public.profiles
  for update using (auth.uid() = id);

-- Sellers: public can read APPROVED sellers; owners manage their own application
drop policy if exists "sellers public read approved" on public.sellers;
create policy "sellers public read approved" on public.sellers
  for select using (status = 'approved' or profile_id = auth.uid());
drop policy if exists "sellers owner insert" on public.sellers;
create policy "sellers owner insert" on public.sellers
  for insert with check (profile_id = auth.uid());
drop policy if exists "sellers owner update" on public.sellers;
create policy "sellers owner update" on public.sellers
  for update using (profile_id = auth.uid());

-- Shops: public read approved; owning seller manages
drop policy if exists "shops public read approved" on public.shops;
create policy "shops public read approved" on public.shops
  for select using (status = 'approved' or seller_id in (select public.my_seller_ids()));
drop policy if exists "shops owner write" on public.shops;
create policy "shops owner write" on public.shops
  for all using (seller_id in (select public.my_seller_ids()))
  with check (seller_id in (select public.my_seller_ids()));

-- Products: anyone reads ACTIVE; sellers manage their own rows
drop policy if exists "products public read active" on public.products;
create policy "products public read active" on public.products
  for select using (status = 'active' or seller_id in (select public.my_seller_ids()));
drop policy if exists "products seller write" on public.products;
create policy "products seller write" on public.products
  for all using (seller_id in (select public.my_seller_ids()))
  with check (seller_id in (select public.my_seller_ids()));

-- Carts & addresses: owner only
drop policy if exists "cart owner all" on public.cart_items;
create policy "cart owner all" on public.cart_items
  for all using (profile_id = auth.uid()) with check (profile_id = auth.uid());
drop policy if exists "addresses owner all" on public.addresses;
create policy "addresses owner all" on public.addresses
  for all using (profile_id = auth.uid()) with check (profile_id = auth.uid());

-- Orders: customers see their own; sellers see orders containing their items
drop policy if exists "orders customer read" on public.orders;
create policy "orders customer read" on public.orders
  for select using (
    profile_id = auth.uid()
    or exists (
      select 1 from public.order_items oi
      where oi.order_id = orders.id and oi.seller_id in (select public.my_seller_ids())
    )
  );
drop policy if exists "orders customer insert" on public.orders;
create policy "orders customer insert" on public.orders
  for insert with check (profile_id = auth.uid());

drop policy if exists "order_items read" on public.order_items;
create policy "order_items read" on public.order_items
  for select using (
    seller_id in (select public.my_seller_ids())
    or exists (select 1 from public.orders o where o.id = order_items.order_id and o.profile_id = auth.uid())
  );

-- Reviews: public read; authors write their own
drop policy if exists "reviews public read" on public.reviews;
create policy "reviews public read" on public.reviews
  for select using (true);
drop policy if exists "reviews author write" on public.reviews;
create policy "reviews author write" on public.reviews
  for all using (profile_id = auth.uid()) with check (profile_id = auth.uid());

-- Feedback / referrals / draw entries: owner-scoped (anon feedback allowed)
drop policy if exists "feedback insert any" on public.feedback;
create policy "feedback insert any" on public.feedback for insert with check (true);
drop policy if exists "feedback owner read" on public.feedback;
create policy "feedback owner read" on public.feedback
  for select using (profile_id is null or profile_id = auth.uid());

drop policy if exists "referrals owner" on public.referrals;
create policy "referrals owner" on public.referrals
  for all using (referrer_id = auth.uid()) with check (referrer_id = auth.uid());

drop policy if exists "draw entries insert" on public.lucky_draw_entries;
create policy "draw entries insert" on public.lucky_draw_entries for insert with check (true);
drop policy if exists "draw entries owner read" on public.lucky_draw_entries;
create policy "draw entries owner read" on public.lucky_draw_entries
  for select using (profile_id is null or profile_id = auth.uid());

-- Stock movements & audit logs: written by server code (service role bypasses RLS);
-- authenticated users get read on their own products' movements via seller check
drop policy if exists "stock seller read" on public.stock_movements;
create policy "stock seller read" on public.stock_movements
  for select using (
    exists (
      select 1 from public.products p
      where p.id = stock_movements.product_id and p.seller_id in (select public.my_seller_ids())
    )
  );

-- ============================================================================
-- 11. Storage buckets — shop photos & product images public; KYC private
-- ============================================================================
insert into storage.buckets (id, name, public)
values ('shop-photos','shop-photos', true),
       ('product-images','product-images', true),
       ('kyc-docs','kyc-docs', false)
on conflict (id) do nothing;

-- Public read on the two public buckets
drop policy if exists "public read shop-photos" on storage.objects;
create policy "public read shop-photos" on storage.objects
  for select using (bucket_id = 'shop-photos');
drop policy if exists "public read product-images" on storage.objects;
create policy "public read product-images" on storage.objects
  for select using (bucket_id = 'product-images');

-- Signed-in users can upload to the public buckets (path namespaced by uid)
drop policy if exists "auth upload shop-photos" on storage.objects;
create policy "auth upload shop-photos" on storage.objects
  for insert with check (
    bucket_id = 'shop-photos' and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
drop policy if exists "auth upload product-images" on storage.objects;
create policy "auth upload product-images" on storage.objects
  for insert with check (
    bucket_id = 'product-images' and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- KYC docs: only the owning user (and service role / admins) can read their folder
drop policy if exists "kyc owner read" on storage.objects;
create policy "kyc owner read" on storage.objects
  for select using (
    bucket_id = 'kyc-docs' and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
drop policy if exists "kyc owner upload" on storage.objects;
create policy "kyc owner upload" on storage.objects
  for insert with check (
    bucket_id = 'kyc-docs' and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================================================
-- 12. Seed categories (matches the app's 20 categories)
-- ============================================================================
insert into public.categories (slug, name, name_hi, emoji, subcategories) values
('mobiles','Mobiles & Tablets','मोबाइल','📱',array['Smartphones','Feature Phones','Tablets','Accessories','Chargers']),
('electronics','Electronics','इलेक्ट्रॉनिक्स','💻',array['Laptops','TVs','Cameras','Audio','Gaming']),
('fashion-women','Women''s Fashion','महिला फैशन','👗',array['Sarees','Kurtis','Lehengas','Tops','Jeans']),
('fashion-men','Men''s Fashion','पुरुष फैशन','👔',array['Shirts','T-Shirts','Jeans','Kurta','Suits']),
('footwear','Footwear','जूते','👟',array['Sneakers','Formal','Slippers','Sandals','Sports']),
('beauty','Beauty & Health','सौंदर्य','💄',array['Makeup','Skincare','Hair','Fragrance','Ayurveda']),
('home','Home & Kitchen','घर','🏠',array['Cookware','Storage','Decor','Bedding','Lighting']),
('furniture','Furniture','फर्नीचर','🛋️',array['Sofas','Beds','Tables','Chairs','Wardrobes']),
('appliances','Appliances','उपकरण','🔌',array['Fridges','Washing Machines','ACs','Microwaves','Fans']),
('books','Books','किताबें','📚',array['Academic','Fiction','Comics','Competitive','Kids']),
('toys','Toys & Baby','खिलौने','🧸',array['Toys','Diapers','Clothing','Feeding','Strollers']),
('sports','Sports & Fitness','खेल','⚽',array['Cricket','Football','Gym','Yoga','Cycling']),
('grocery','Grocery','किराना','🛒',array['Staples','Snacks','Beverages','Spices','Organic']),
('jewellery','Jewellery','गहने','💍',array['Gold','Silver','Imitation','Watches','Accessories']),
('bags','Bags & Luggage','बैग','👜',array['Backpacks','Handbags','Trolleys','Wallets','School Bags']),
('automotive','Automotive','गाड़ी','🚗',array['Car Accessories','Bike Parts','Helmets','Tools','Care']),
('office','Office Supplies','ऑफिस','📎',array['Stationery','Printers','Chairs','Storage','Paper']),
('musical','Musical Instruments','संगीत','🎸',array['Guitars','Keyboards','Drums','Wind','Accessories']),
('pet','Pet Supplies','पालतू','🐾',array['Food','Toys','Grooming','Beds','Accessories']),
('handicraft','Handicraft & Art','हस्तशिल्प','🎨',array['Paintings','Pottery','Textiles','Wood','Metal'])
on conflict (slug) do nothing;
