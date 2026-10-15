-- Update 22: SastaBazaar Wallet — cash balance + reward points ledger.
-- Run this in Supabase SQL Editor (once).
create table if not exists public.wallets (
  user_id uuid primary key references auth.users(id) on delete cascade,
  cash_balance numeric(12,2) not null default 0,
  reward_points numeric(12,2) not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.wallet_txns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.wallets(user_id) on delete cascade,
  kind text not null check (kind in ('cash','reward')),
  amount numeric(12,2) not null,
  reason text not null,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.wallets enable row level security;
alter table public.wallet_txns enable row level security;

drop policy if exists "own wallet read" on public.wallets;
create policy "own wallet read" on public.wallets for select using (auth.uid() = user_id);
drop policy if exists "own wallet update" on public.wallets;
create policy "own wallet update" on public.wallets for update using (auth.uid() = user_id);
drop policy if exists "own txns read" on public.wallet_txns;
create policy "own txns read" on public.wallet_txns for select using (auth.uid() = user_id);
drop policy if exists "own txns insert" on public.wallet_txns;
create policy "own txns insert" on public.wallet_txns for insert with check (auth.uid() = user_id);

-- Auto-create a wallet the moment a user registers.
create or replace function public.handle_new_user_wallet()
returns trigger language plpgsql security definer as $$
begin
  insert into public.wallets (user_id) values (new.id) on conflict (user_id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created_wallet on auth.users;
create trigger on_auth_user_created_wallet after insert on auth.users
for each row execute function public.handle_new_user_wallet();
