-- Listing reservation/completion workflow + transaction QR support
-- NOTE:
-- 1) public.transactions already exists in the current schema, so this migration
--    alters it instead of creating a second table with the same name.
-- 2) RLS cannot restrict updates to only the "status" column. The listings update
--    policy below limits row updates to the seller; enforce status-only writes in
--    the API layer or with a trigger if required.

create extension if not exists pgcrypto;

-- -----------------------------------------------------------------------------
-- Enum types
-- -----------------------------------------------------------------------------

do $$
begin
  create type public.listing_status_v2 as enum ('active', 'reserved', 'completed');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.transaction_status_v2 as enum ('pending', 'completed');
exception
  when duplicate_object then null;
end
$$;

-- -----------------------------------------------------------------------------
-- listings: add reservation/completion columns
-- -----------------------------------------------------------------------------

-- Drop dependent listings policies before changing status type.
drop policy if exists "listings_select_active_or_owner" on public.listings;
drop policy if exists "listings_select_active_owner_or_reserved" on public.listings;
drop policy if exists "listings_update_seller" on public.listings;

alter table public.listings
  add column if not exists reserved_by uuid references public.profiles(id),
  add column if not exists reserved_at timestamptz,
  add column if not exists completed_at timestamptz;

-- Convert listings.status from old text/check model to the new enum.
-- Safe mappings:
--   active -> active
--   sold -> completed
--   reserved -> reserved
--   completed -> completed
--
-- This migration intentionally fails if cancelled/expired rows exist because
-- there is no safe automatic mapping into the requested 3-state model.

do $$
declare
  invalid_count integer;
  current_udt text;
begin
  select c.udt_name
  into current_udt
  from information_schema.columns c
  where c.table_schema = 'public'
    and c.table_name = 'listings'
    and c.column_name = 'status';

  if current_udt is distinct from 'listing_status_v2' then
    select count(*)
    into invalid_count
    from public.listings
    where status not in ('active', 'sold', 'reserved', 'completed');

    if invalid_count > 0 then
      raise exception
        'Cannot migrate public.listings.status automatically. Resolve rows with statuses outside (active, sold, reserved, completed) first.';
    end if;

    update public.listings
    set status = 'completed'
    where status = 'sold';

    update public.listings
    set completed_at = coalesce(completed_at, updated_at, created_at)
    where status = 'completed'
      and completed_at is null;

    alter table public.listings
      drop constraint if exists listings_status_chk;

    alter table public.listings
      alter column status drop default;

    alter table public.listings
      alter column status type public.listing_status_v2
      using status::public.listing_status_v2;

    alter table public.listings
      alter column status set default 'active'::public.listing_status_v2;
  end if;
end
$$;

-- -----------------------------------------------------------------------------
-- transactions: add requested columns and convert status
-- -----------------------------------------------------------------------------

alter table public.transactions
  add column if not exists completed_at timestamptz,
  add column if not exists qr_token text;

create unique index if not exists transactions_qr_token_key
  on public.transactions (qr_token)
  where qr_token is not null;

-- Convert transactions.status from the old text/check model to the new enum.
-- Safe mappings:
--   pending -> pending
--   paid -> completed
--   handshake_complete -> completed
--   completed -> completed
--
-- This migration intentionally fails if refunded/disputed/cancelled rows exist
-- because there is no safe automatic mapping into the requested 2-state model.

do $$
declare
  invalid_count integer;
  current_udt text;
begin
  select c.udt_name
  into current_udt
  from information_schema.columns c
  where c.table_schema = 'public'
    and c.table_name = 'transactions'
    and c.column_name = 'status';

  if current_udt is distinct from 'transaction_status_v2' then
    select count(*)
    into invalid_count
    from public.transactions
    where status not in ('pending', 'paid', 'handshake_complete', 'completed');

    if invalid_count > 0 then
      raise exception
        'Cannot migrate public.transactions.status automatically. Resolve rows with statuses outside (pending, paid, handshake_complete, completed) first.';
    end if;

    update public.transactions
    set status = 'completed'
    where status in ('paid', 'handshake_complete');

    update public.transactions
    set completed_at = coalesce(completed_at, handshake_at, updated_at, created_at)
    where status = 'completed'
      and completed_at is null;

    alter table public.transactions
      drop constraint if exists transactions_status_chk;

    alter table public.transactions
      alter column status drop default;

    alter table public.transactions
      alter column status type public.transaction_status_v2
      using status::public.transaction_status_v2;

    alter table public.transactions
      alter column status set default 'pending'::public.transaction_status_v2;
  end if;
end
$$;

-- -----------------------------------------------------------------------------
-- RLS updates
-- -----------------------------------------------------------------------------

alter table public.listings enable row level security;
alter table public.transactions enable row level security;

-- listings: readable by seller, active listings remain readable, and reserved_by may read
create policy "listings_select_active_owner_or_reserved"
on public.listings
for select
to authenticated
using (
  status = 'active'::public.listing_status_v2
  or seller_id = auth.uid()
  or reserved_by = auth.uid()
);

-- listings: seller may update their rows
-- NOTE: RLS cannot limit this to only the status column.
create policy "listings_update_seller"
on public.listings
for update
to authenticated
using (seller_id = auth.uid())
with check (seller_id = auth.uid());

-- transactions: buyer/seller can read their own rows
drop policy if exists "transactions_select_participants" on public.transactions;

create policy "transactions_select_participants"
on public.transactions
for select
to authenticated
using (buyer_id = auth.uid() or seller_id = auth.uid());

-- transactions: remove client-side insert/update ability
-- service_role can still insert via API because it bypasses RLS
drop policy if exists "transactions_insert_participants" on public.transactions;
drop policy if exists "transactions_update_participants" on public.transactions;
