-- RLS audit summary
--
-- Table status:
-- - public.profiles: RLS enabled
-- - public.listings: RLS enabled
-- - public.conversations: RLS enabled
-- - public.messages: RLS enabled
-- - public.transactions: RLS enabled
-- - public.ratings: RLS enabled
--
-- Missing or incorrect policies found:
-- - public.profiles:
--   - incorrect: profiles_insert_owner (direct user inserts should not be allowed)
--   - incorrect: profiles_delete_owner (profile deletes should not be allowed)
-- - public.listings:
--   - incorrect/legacy: listings_select_active_or_owner (does not allow reserved_by visibility)
--   - incorrect: listings_delete_seller (should only allow delete when status = 'active')
--   - note: listings_update_seller can only enforce row ownership at the RLS layer; RLS cannot
--           restrict updates to specific columns. This migration keeps seller-owned row updates
--           and relies on service_role/API for reserved/status workflows.
-- - public.conversations:
--   - incorrect: conversations_insert_participants (allows seller-authored inserts and null-listing chats)
--   - incorrect: conversations_update_participants (updates should not be allowed)
--   - incorrect: conversations_delete_participants (deletes should not be allowed)
-- - public.messages:
--   - incorrect: messages_update_sender_participant (updates should not be allowed)
--   - incorrect: messages_delete_sender_participant (deletes should not be allowed)
-- - public.transactions:
--   - already correct after 20260324_000300_listing_reservations_and_transactions_qr.sql
-- - public.ratings:
--   - incorrect: ratings_select_all (should be authenticated-only, not public)
--   - incomplete: ratings_insert_own (relied on unique constraint, but policy now also rejects duplicate inserts)
--
-- Tables already correct and needing no functional change:
-- - public.transactions

begin;

alter table public.profiles enable row level security;
alter table public.listings enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.transactions enable row level security;
alter table public.ratings enable row level security;

-- -----------------------------------------------------------------------------
-- profiles
-- -----------------------------------------------------------------------------

drop policy if exists "profiles_select_authenticated" on public.profiles;
drop policy if exists "profiles_insert_owner" on public.profiles;
drop policy if exists "profiles_update_owner" on public.profiles;
drop policy if exists "profiles_delete_owner" on public.profiles;

create policy "profiles_select_authenticated"
on public.profiles
for select
to authenticated
using (true);

create policy "profiles_update_owner"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

-- No insert/delete policies: profile creation stays trigger-driven only.

-- -----------------------------------------------------------------------------
-- listings
-- -----------------------------------------------------------------------------

drop policy if exists "listings_select_active_or_owner" on public.listings;
drop policy if exists "listings_select_active_owner_or_reserved" on public.listings;
drop policy if exists "listings_insert_seller" on public.listings;
drop policy if exists "listings_update_seller" on public.listings;
drop policy if exists "listings_delete_seller" on public.listings;

create policy "listings_select_active_owner_or_reserved"
on public.listings
for select
to authenticated
using (
  status::text = 'active'
  or seller_id = auth.uid()
  or reserved_by = auth.uid()
);

create policy "listings_insert_seller"
on public.listings
for insert
to authenticated
with check (seller_id = auth.uid());

create policy "listings_update_seller"
on public.listings
for update
to authenticated
using (seller_id = auth.uid())
with check (seller_id = auth.uid());

create policy "listings_delete_seller"
on public.listings
for delete
to authenticated
using (
  seller_id = auth.uid()
  and status::text = 'active'
);

-- -----------------------------------------------------------------------------
-- conversations
-- -----------------------------------------------------------------------------

drop policy if exists "conversations_select_participants" on public.conversations;
drop policy if exists "conversations_insert_participants" on public.conversations;
drop policy if exists "conversations_update_participants" on public.conversations;
drop policy if exists "conversations_delete_participants" on public.conversations;

create policy "conversations_select_participants"
on public.conversations
for select
to authenticated
using (auth.uid() = buyer_id or auth.uid() = seller_id);

create policy "conversations_insert_buyer"
on public.conversations
for insert
to authenticated
with check (
  auth.uid() = buyer_id
  and buyer_id <> seller_id
  and listing_id is not null
  and exists (
    select 1
    from public.listings l
    where l.id = conversations.listing_id
      and l.seller_id = conversations.seller_id
  )
);

-- No update/delete policies.

-- -----------------------------------------------------------------------------
-- messages
-- -----------------------------------------------------------------------------

drop policy if exists "messages_select_participants" on public.messages;
drop policy if exists "messages_insert_sender_participant" on public.messages;
drop policy if exists "messages_update_sender_participant" on public.messages;
drop policy if exists "messages_delete_sender_participant" on public.messages;

create policy "messages_select_participants"
on public.messages
for select
to authenticated
using (
  exists (
    select 1
    from public.conversations c
    where c.id = messages.conversation_id
      and (auth.uid() = c.buyer_id or auth.uid() = c.seller_id)
  )
);

create policy "messages_insert_sender_participant"
on public.messages
for insert
to authenticated
with check (
  auth.uid() = sender_id
  and exists (
    select 1
    from public.conversations c
    where c.id = messages.conversation_id
      and (auth.uid() = c.buyer_id or auth.uid() = c.seller_id)
  )
);

-- No update/delete policies.

-- -----------------------------------------------------------------------------
-- transactions
-- -----------------------------------------------------------------------------

drop policy if exists "transactions_select_participants" on public.transactions;
drop policy if exists "transactions_insert_participants" on public.transactions;
drop policy if exists "transactions_update_participants" on public.transactions;

create policy "transactions_select_participants"
on public.transactions
for select
to authenticated
using (auth.uid() = buyer_id or auth.uid() = seller_id);

-- No insert/update/delete policies: service_role bypasses RLS for API-driven writes.

-- -----------------------------------------------------------------------------
-- ratings
-- -----------------------------------------------------------------------------

drop policy if exists "ratings_select_all" on public.ratings;
drop policy if exists "ratings_select_authenticated" on public.ratings;
drop policy if exists "ratings_insert_own" on public.ratings;

create policy "ratings_select_authenticated"
on public.ratings
for select
to authenticated
using (true);

create policy "ratings_insert_own"
on public.ratings
for insert
to authenticated
with check (
  rater_id = auth.uid()
  and stars between 1 and 5
  and not exists (
    select 1
    from public.ratings existing_rating
    where existing_rating.transaction_id = ratings.transaction_id
      and existing_rating.rater_id = auth.uid()
  )
  and exists (
    select 1
    from public.transactions t
    where t.id = ratings.transaction_id
      and t.status::text = 'completed'
      and (
        (auth.uid() = t.buyer_id and rated_id = t.seller_id)
        or
        (auth.uid() = t.seller_id and rated_id = t.buyer_id)
      )
  )
);

-- No update/delete policies.

commit;
