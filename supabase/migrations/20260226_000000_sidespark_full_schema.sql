-- SideSpark full schema (Supabase / Postgres)
-- Includes core marketplace, messaging, transactions, cofounders, and moderation tables.
-- RLS policies are included for the tables requested in the product spec.

create extension if not exists pgcrypto;

-- -----------------------------------------------------------------------------
-- Helper functions
-- -----------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select
    coalesce(auth.role() = 'service_role', false)
    or coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false)
    or coalesce((auth.jwt() -> 'app_metadata' -> 'roles') ? 'admin', false);
$$;

-- -----------------------------------------------------------------------------
-- Tables
-- -----------------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  first_name text,
  last_initial text,
  graduation_year integer,
  photo_url text,
  bio text,
  major text,
  stripe_account_id text,
  stripe_onboarding_complete boolean not null default false,
  dispute_strikes integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint profiles_last_initial_len_chk
    check (last_initial is null or char_length(last_initial) = 1),
  constraint profiles_graduation_year_chk
    check (graduation_year is null or graduation_year between 2025 and 2029),
  constraint profiles_dispute_strikes_chk
    check (dispute_strikes >= 0)
);

-- Compatibility upgrade for projects that already created a minimal profiles table
alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists first_name text;
alter table public.profiles add column if not exists last_initial text;
alter table public.profiles add column if not exists graduation_year integer;
alter table public.profiles add column if not exists photo_url text;
alter table public.profiles add column if not exists bio text;
alter table public.profiles add column if not exists major text;
alter table public.profiles add column if not exists stripe_account_id text;
alter table public.profiles add column if not exists stripe_onboarding_complete boolean not null default false;
alter table public.profiles add column if not exists dispute_strikes integer not null default 0;
alter table public.profiles add column if not exists created_at timestamptz not null default timezone('utc', now());
alter table public.profiles add column if not exists updated_at timestamptz not null default timezone('utc', now());

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'avatar_url'
  ) then
    execute $sql$
      update public.profiles
      set photo_url = coalesce(photo_url, avatar_url)
      where avatar_url is not null
    $sql$;
  end if;
end
$$;

create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.profiles(id),
  type text not null,
  title text not null,
  description text not null,
  price numeric(10,2) not null,
  category text not null,
  condition text,
  photos text[] not null default '{}'::text[],
  availability jsonb,
  subjects text[],
  status text not null default 'active',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint listings_type_chk
    check (type in ('item', 'service', 'tutoring', 'housing_sublet')),
  constraint listings_status_chk
    check (status in ('active', 'sold', 'cancelled', 'expired')),
  constraint listings_condition_chk
    check (condition is null or condition in ('like_new', 'good', 'fair')),
  constraint listings_price_nonnegative_chk
    check (price >= 0)
);

create table if not exists public.looking_for_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id),
  description text not null,
  category text not null,
  price_min numeric(10,2),
  price_max numeric(10,2),
  needed_by date,
  status text not null default 'open',
  admin_tags text[] not null default '{}'::text[],
  created_at timestamptz not null default timezone('utc', now()),
  constraint looking_for_requests_description_len_chk
    check (char_length(description) <= 300),
  constraint looking_for_requests_category_chk
    check (category in ('items', 'services', 'tutoring', 'housing', 'other')),
  constraint looking_for_requests_status_chk
    check (status in ('open', 'archived')),
  constraint looking_for_requests_price_range_chk
    check (
      (price_min is null or price_min >= 0)
      and (price_max is null or price_max >= 0)
      and (price_min is null or price_max is null or price_max >= price_min)
    )
);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id),
  buyer_id uuid not null references public.profiles(id),
  seller_id uuid not null references public.profiles(id),
  created_at timestamptz not null default timezone('utc', now()),
  constraint conversations_listing_buyer_unique unique (listing_id, buyer_id),
  constraint conversations_buyer_seller_distinct_chk check (buyer_id <> seller_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id),
  content text not null,
  created_at timestamptz not null default timezone('utc', now()),
  constraint messages_content_not_blank_chk check (char_length(trim(content)) > 0)
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id),
  buyer_id uuid not null references public.profiles(id),
  seller_id uuid not null references public.profiles(id),
  item_price numeric(10,2) not null,
  seller_fee_rate numeric(8,6) not null,
  seller_fee_amount numeric(10,2) not null,
  buyer_fee_rate numeric(8,6) not null,
  buyer_fee_amount numeric(10,2) not null,
  buyer_fee_minimum numeric(10,2) not null,
  total_charge numeric(10,2) not null,
  stripe_payment_intent_id text,
  stripe_fee_estimated numeric(10,2),
  platform_revenue numeric(10,2),
  net_margin numeric(10,2),
  status text not null default 'pending',
  handshake_at timestamptz,
  handshake_buyer_confirmed boolean not null default false,
  dispute_window_ends timestamptz,
  payout_eligible_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint transactions_status_chk
    check (status in ('pending', 'paid', 'handshake_complete', 'refunded', 'disputed', 'cancelled')),
  constraint transactions_buyer_seller_distinct_chk
    check (buyer_id <> seller_id),
  constraint transactions_amounts_nonnegative_chk
    check (
      item_price >= 0
      and seller_fee_amount >= 0
      and buyer_fee_amount >= 0
      and buyer_fee_minimum >= 0
      and total_charge >= 0
      and (stripe_fee_estimated is null or stripe_fee_estimated >= 0)
      and (platform_revenue is null or platform_revenue >= 0)
    )
);

create table if not exists public.disputes (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.transactions(id),
  filed_by uuid not null references public.profiles(id),
  reason text not null,
  evidence_photos text[] not null default '{}'::text[],
  status text not null default 'open',
  resolution_notes text,
  stripe_fee_absorbed_by text,
  resolved_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  constraint disputes_status_chk
    check (
      status in ('open', 'reviewing', 'resolved_buyer', 'resolved_seller', 'resolved_split', 'dismissed')
    ),
  constraint disputes_stripe_fee_absorbed_by_chk
    check (stripe_fee_absorbed_by is null or stripe_fee_absorbed_by in ('platform', 'seller', 'buyer'))
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null unique references public.transactions(id),
  reviewer_id uuid not null references public.profiles(id),
  reviewee_id uuid not null references public.profiles(id),
  rating integer not null,
  comment text,
  created_at timestamptz not null default timezone('utc', now()),
  constraint reviews_rating_chk check (rating between 1 and 5),
  constraint reviews_reviewer_reviewee_distinct_chk check (reviewer_id <> reviewee_id)
);

create table if not exists public.housing_listings (
  id uuid primary key default gen_random_uuid(),
  landlord_email text not null,
  landlord_name text not null,
  address text not null,
  rent numeric(10,2) not null,
  term_start date not null,
  term_end date not null,
  room_type text not null,
  roommates integer not null,
  description text not null,
  photos text[] not null default '{}'::text[],
  subscription_tier text,
  stripe_subscription_id text,
  status text not null default 'active',
  created_at timestamptz not null default timezone('utc', now()),
  constraint housing_listings_rent_nonnegative_chk check (rent >= 0),
  constraint housing_listings_roommates_nonnegative_chk check (roommates >= 0),
  constraint housing_listings_term_dates_chk check (term_end >= term_start)
);

create table if not exists public.cofounder_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id),
  role text not null,
  skills text[] not null default '{}'::text[],
  interests text,
  stage text not null,
  availability_hours integer not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint cofounder_profiles_stage_chk
    check (stage in ('idea', 'prototype', 'revenue', 'scaling')),
  constraint cofounder_profiles_availability_hours_chk
    check (availability_hours >= 0)
);

create table if not exists public.cofounder_matches (
  id uuid primary key default gen_random_uuid(),
  from_user_id uuid not null references public.profiles(id),
  to_user_id uuid not null references public.profiles(id),
  status text not null,
  created_at timestamptz not null default timezone('utc', now()),
  constraint cofounder_matches_unique unique (from_user_id, to_user_id),
  constraint cofounder_matches_status_chk
    check (status in ('interested', 'passed')),
  constraint cofounder_matches_distinct_chk
    check (from_user_id <> to_user_id)
);

create table if not exists public.platform_loss_ledger (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid references public.transactions(id),
  dispute_id uuid references public.disputes(id),
  loss_type text not null,
  amount numeric(10,2) not null,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  constraint platform_loss_ledger_loss_type_chk
    check (loss_type in ('buyer_cancel_stripe_fee', 'inconclusive_dispute', 'chargeback', 'chargeback_fee')),
  constraint platform_loss_ledger_amount_nonnegative_chk
    check (amount >= 0)
);

-- -----------------------------------------------------------------------------
-- Triggers (updated_at + new auth user -> profile)
-- -----------------------------------------------------------------------------

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists listings_set_updated_at on public.listings;
create trigger listings_set_updated_at
before update on public.listings
for each row execute function public.set_updated_at();

drop trigger if exists transactions_set_updated_at on public.transactions;
create trigger transactions_set_updated_at
before update on public.transactions
for each row execute function public.set_updated_at();

drop trigger if exists cofounder_profiles_set_updated_at on public.cofounder_profiles;
create trigger cofounder_profiles_set_updated_at
before update on public.cofounder_profiles
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- -----------------------------------------------------------------------------
-- Indexes (requested)
-- -----------------------------------------------------------------------------

create index if not exists listings_type_status_idx
  on public.listings (type, status);

create index if not exists listings_seller_id_idx
  on public.listings (seller_id);

create index if not exists transactions_buyer_id_idx
  on public.transactions (buyer_id);

create index if not exists transactions_seller_id_idx
  on public.transactions (seller_id);

create index if not exists messages_conversation_id_created_at_idx
  on public.messages (conversation_id, created_at);

create index if not exists reviews_reviewee_id_idx
  on public.reviews (reviewee_id);

-- -----------------------------------------------------------------------------
-- Row Level Security (requested)
-- -----------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.listings enable row level security;
alter table public.looking_for_requests enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.transactions enable row level security;
alter table public.reviews enable row level security;
alter table public.platform_loss_ledger enable row level security;

-- profiles: readable by all authenticated, writable by owner
drop policy if exists "profiles_select_authenticated" on public.profiles;
create policy "profiles_select_authenticated"
on public.profiles
for select
to authenticated
using (true);

drop policy if exists "profiles_insert_owner" on public.profiles;
create policy "profiles_insert_owner"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "profiles_update_owner" on public.profiles;
create policy "profiles_update_owner"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "profiles_delete_owner" on public.profiles;
create policy "profiles_delete_owner"
on public.profiles
for delete
to authenticated
using (auth.uid() = id);

-- listings: readable if active (plus seller can read own), writable by seller
drop policy if exists "listings_select_active_or_owner" on public.listings;
create policy "listings_select_active_or_owner"
on public.listings
for select
to authenticated
using (status = 'active' or seller_id = auth.uid());

drop policy if exists "listings_insert_seller" on public.listings;
create policy "listings_insert_seller"
on public.listings
for insert
to authenticated
with check (seller_id = auth.uid());

drop policy if exists "listings_update_seller" on public.listings;
create policy "listings_update_seller"
on public.listings
for update
to authenticated
using (seller_id = auth.uid())
with check (seller_id = auth.uid());

drop policy if exists "listings_delete_seller" on public.listings;
create policy "listings_delete_seller"
on public.listings
for delete
to authenticated
using (seller_id = auth.uid());

-- looking_for_requests: owner + admin
drop policy if exists "looking_for_requests_select_owner_or_admin" on public.looking_for_requests;
create policy "looking_for_requests_select_owner_or_admin"
on public.looking_for_requests
for select
to authenticated
using (user_id = auth.uid() or public.is_admin());

drop policy if exists "looking_for_requests_insert_owner_or_admin" on public.looking_for_requests;
create policy "looking_for_requests_insert_owner_or_admin"
on public.looking_for_requests
for insert
to authenticated
with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "looking_for_requests_update_owner_or_admin" on public.looking_for_requests;
create policy "looking_for_requests_update_owner_or_admin"
on public.looking_for_requests
for update
to authenticated
using (user_id = auth.uid() or public.is_admin())
with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "looking_for_requests_delete_owner_or_admin" on public.looking_for_requests;
create policy "looking_for_requests_delete_owner_or_admin"
on public.looking_for_requests
for delete
to authenticated
using (user_id = auth.uid() or public.is_admin());

-- conversations: participants only
drop policy if exists "conversations_select_participants" on public.conversations;
create policy "conversations_select_participants"
on public.conversations
for select
to authenticated
using (buyer_id = auth.uid() or seller_id = auth.uid());

drop policy if exists "conversations_insert_participants" on public.conversations;
create policy "conversations_insert_participants"
on public.conversations
for insert
to authenticated
with check (
  (buyer_id = auth.uid() or seller_id = auth.uid())
  and exists (
    select 1
    from public.listings l
    where l.id = listing_id
      and l.seller_id = conversations.seller_id
  )
);

drop policy if exists "conversations_update_participants" on public.conversations;
create policy "conversations_update_participants"
on public.conversations
for update
to authenticated
using (buyer_id = auth.uid() or seller_id = auth.uid())
with check (buyer_id = auth.uid() or seller_id = auth.uid());

drop policy if exists "conversations_delete_participants" on public.conversations;
create policy "conversations_delete_participants"
on public.conversations
for delete
to authenticated
using (buyer_id = auth.uid() or seller_id = auth.uid());

-- messages: participants only (writes restricted to sender for mutation)
drop policy if exists "messages_select_participants" on public.messages;
create policy "messages_select_participants"
on public.messages
for select
to authenticated
using (
  exists (
    select 1
    from public.conversations c
    where c.id = messages.conversation_id
      and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())
  )
);

drop policy if exists "messages_insert_sender_participant" on public.messages;
create policy "messages_insert_sender_participant"
on public.messages
for insert
to authenticated
with check (
  sender_id = auth.uid()
  and exists (
    select 1
    from public.conversations c
    where c.id = messages.conversation_id
      and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())
  )
);

drop policy if exists "messages_update_sender_participant" on public.messages;
create policy "messages_update_sender_participant"
on public.messages
for update
to authenticated
using (
  sender_id = auth.uid()
  and exists (
    select 1
    from public.conversations c
    where c.id = messages.conversation_id
      and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())
  )
)
with check (sender_id = auth.uid());

drop policy if exists "messages_delete_sender_participant" on public.messages;
create policy "messages_delete_sender_participant"
on public.messages
for delete
to authenticated
using (
  sender_id = auth.uid()
  and exists (
    select 1
    from public.conversations c
    where c.id = messages.conversation_id
      and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())
  )
);

-- transactions: buyer/seller only
drop policy if exists "transactions_select_participants" on public.transactions;
create policy "transactions_select_participants"
on public.transactions
for select
to authenticated
using (buyer_id = auth.uid() or seller_id = auth.uid());

drop policy if exists "transactions_insert_participants" on public.transactions;
create policy "transactions_insert_participants"
on public.transactions
for insert
to authenticated
with check (buyer_id = auth.uid() or seller_id = auth.uid());

drop policy if exists "transactions_update_participants" on public.transactions;
create policy "transactions_update_participants"
on public.transactions
for update
to authenticated
using (buyer_id = auth.uid() or seller_id = auth.uid())
with check (buyer_id = auth.uid() or seller_id = auth.uid());

-- reviews: readable by all, insertable by reviewer
drop policy if exists "reviews_select_all" on public.reviews;
create policy "reviews_select_all"
on public.reviews
for select
to public
using (true);

drop policy if exists "reviews_insert_reviewer" on public.reviews;
create policy "reviews_insert_reviewer"
on public.reviews
for insert
to authenticated
with check (reviewer_id = auth.uid());

-- platform_loss_ledger: admin only
drop policy if exists "platform_loss_ledger_select_admin" on public.platform_loss_ledger;
create policy "platform_loss_ledger_select_admin"
on public.platform_loss_ledger
for select
to authenticated
using (public.is_admin());

drop policy if exists "platform_loss_ledger_insert_admin" on public.platform_loss_ledger;
create policy "platform_loss_ledger_insert_admin"
on public.platform_loss_ledger
for insert
to authenticated
with check (public.is_admin());

drop policy if exists "platform_loss_ledger_update_admin" on public.platform_loss_ledger;
create policy "platform_loss_ledger_update_admin"
on public.platform_loss_ledger
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "platform_loss_ledger_delete_admin" on public.platform_loss_ledger;
create policy "platform_loss_ledger_delete_admin"
on public.platform_loss_ledger
for delete
to authenticated
using (public.is_admin());
