-- Ratings support
-- Adds aggregate rating fields to profiles, creates ratings table,
-- backfills profile stats, and keeps them updated via trigger.

create extension if not exists pgcrypto;

-- -----------------------------------------------------------------------------
-- profiles: add rating/trade summary columns
-- -----------------------------------------------------------------------------

alter table public.profiles
  add column if not exists total_trades integer not null default 0,
  add column if not exists average_rating numeric(3,2),
  add column if not exists total_ratings integer not null default 0;

alter table public.profiles
  drop constraint if exists profiles_total_trades_nonnegative_chk;

alter table public.profiles
  drop constraint if exists profiles_total_ratings_nonnegative_chk;

alter table public.profiles
  add constraint profiles_total_trades_nonnegative_chk
    check (total_trades >= 0);

alter table public.profiles
  add constraint profiles_total_ratings_nonnegative_chk
    check (total_ratings >= 0);

-- -----------------------------------------------------------------------------
-- ratings table
-- -----------------------------------------------------------------------------

create table if not exists public.ratings (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.transactions(id) on delete cascade,
  rater_id uuid not null references public.profiles(id) on delete cascade,
  rated_id uuid not null references public.profiles(id) on delete cascade,
  stars integer not null,
  created_at timestamptz not null default timezone('utc', now()),
  constraint ratings_transaction_rater_unique unique (transaction_id, rater_id),
  constraint ratings_stars_chk check (stars >= 1 and stars <= 5),
  constraint ratings_rater_rated_distinct_chk check (rater_id <> rated_id)
);

create index if not exists ratings_rated_id_idx
  on public.ratings (rated_id);

create index if not exists ratings_transaction_id_idx
  on public.ratings (transaction_id);

-- -----------------------------------------------------------------------------
-- Helper to refresh one profile's aggregate stats
-- -----------------------------------------------------------------------------

create or replace function public.refresh_profile_rating_stats(target_profile_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total_ratings integer;
  v_average_rating numeric(3,2);
  v_total_trades integer;
begin
  select
    count(*)::integer,
    round(avg(stars)::numeric, 2)
  into
    v_total_ratings,
    v_average_rating
  from public.ratings
  where rated_id = target_profile_id;

  select count(*)::integer
  into v_total_trades
  from public.transactions t
  where t.status = 'completed'
    and (t.buyer_id = target_profile_id or t.seller_id = target_profile_id);

  update public.profiles
  set
    total_ratings = coalesce(v_total_ratings, 0),
    average_rating = v_average_rating,
    total_trades = coalesce(v_total_trades, 0),
    updated_at = timezone('utc', now())
  where id = target_profile_id;
end;
$$;

-- -----------------------------------------------------------------------------
-- Trigger to update profile aggregates after rating insert
-- -----------------------------------------------------------------------------

create or replace function public.handle_rating_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.refresh_profile_rating_stats(new.rated_id);
  perform public.refresh_profile_rating_stats(new.rater_id);
  return new;
end;
$$;

drop trigger if exists on_rating_insert_refresh_profile_stats on public.ratings;

create trigger on_rating_insert_refresh_profile_stats
after insert on public.ratings
for each row
execute function public.handle_rating_insert();

-- -----------------------------------------------------------------------------
-- Backfill existing profile stats
-- -----------------------------------------------------------------------------

update public.profiles p
set
  total_trades = stats.total_trades,
  total_ratings = stats.total_ratings,
  average_rating = stats.average_rating,
  updated_at = timezone('utc', now())
from (
  select
    pr.id as profile_id,
    coalesce(trades.total_trades, 0) as total_trades,
    coalesce(ratings.total_ratings, 0) as total_ratings,
    ratings.average_rating
  from public.profiles pr
  left join (
    select
      profile_id,
      count(*)::integer as total_trades
    from (
      select seller_id as profile_id
      from public.transactions
      where status = 'completed'
      union all
      select buyer_id as profile_id
      from public.transactions
      where status = 'completed'
    ) completed_trades
    group by profile_id
  ) trades on trades.profile_id = pr.id
  left join (
    select
      rated_id as profile_id,
      count(*)::integer as total_ratings,
      round(avg(stars)::numeric, 2) as average_rating
    from public.ratings
    group by rated_id
  ) ratings on ratings.profile_id = pr.id
) stats
where p.id = stats.profile_id;

-- -----------------------------------------------------------------------------
-- RLS
-- -----------------------------------------------------------------------------

alter table public.ratings enable row level security;

drop policy if exists "ratings_select_all" on public.ratings;
create policy "ratings_select_all"
on public.ratings
for select
to public
using (true);

drop policy if exists "ratings_insert_own" on public.ratings;
create policy "ratings_insert_own"
on public.ratings
for insert
to authenticated
with check (
  rater_id = auth.uid()
  and exists (
    select 1
    from public.transactions t
    where t.id = transaction_id
      and t.status = 'completed'
      and (
        (t.buyer_id = auth.uid() and t.seller_id = rated_id)
        or
        (t.seller_id = auth.uid() and t.buyer_id = rated_id)
      )
  )
);

-- No client-side update/delete policies on ratings.
