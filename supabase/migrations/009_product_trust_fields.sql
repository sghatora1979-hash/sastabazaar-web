-- 009_product_trust_fields.sql
-- Seller-declared TRUST fields: stock age + seller guarantee.
-- The seller declares these; customers see them on the product page.
-- The SELLER is responsible for the claims (marketplace model).
--
-- NOTE on `condition`: the column already exists and is load-bearing for the
-- commission engine (values 'new' / 'refurbished' / 'clearance' drive the
-- two-tier fee). It is intentionally kept as-is — the seller's "Product type"
-- choice IS their condition declaration, shown to customers with Hindi trust
-- labels in the UI. The IF NOT EXISTS below is a safe documented no-op.

alter table public.products
  add column if not exists stock_age text;

alter table public.products
  add column if not exists seller_guarantee text
  check (char_length(seller_guarantee) <= 200);

alter table public.products
  add column if not exists condition text;

comment on column public.products.stock_age is
  'Seller-declared: how old the inventory is, e.g. "20+ saal purana". Shown to customers; seller is responsible for the claim.';

comment on column public.products.seller_guarantee is
  'Seller-declared promise shown to customers (max 200 chars), e.g. "20 saal aur chalega, meri guarantee!". Seller is responsible for the claim.';

-- RLS: the existing policies already cover the new columns —
--   "products public read active"  → public reads trust fields on active products
--   "products seller write"        → sellers manage their own rows incl. trust fields
-- No new policies needed.
