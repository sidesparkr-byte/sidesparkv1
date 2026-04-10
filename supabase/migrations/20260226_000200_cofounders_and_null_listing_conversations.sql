-- Allow co-founder chats to reuse conversations without a listing
alter table public.conversations
  alter column listing_id drop not null;

-- Relax insert policy so conversations may be listing-based OR co-founder direct chats.
drop policy if exists "conversations_insert_participants" on public.conversations;
create policy "conversations_insert_participants"
on public.conversations
for insert
to authenticated
with check (
  (buyer_id = auth.uid() or seller_id = auth.uid())
  and buyer_id <> seller_id
  and (
    (
      listing_id is not null
      and exists (
        select 1
        from public.listings l
        where l.id = conversations.listing_id
          and l.seller_id = conversations.seller_id
      )
    )
    or (
      listing_id is null
      and exists (select 1 from public.profiles p1 where p1.id = conversations.buyer_id)
      and exists (select 1 from public.profiles p2 where p2.id = conversations.seller_id)
    )
  )
);

-- Co-founder profiles and matches: enable RLS + policies
alter table public.cofounder_profiles enable row level security;
alter table public.cofounder_matches enable row level security;

drop policy if exists "cofounder_profiles_select_authenticated" on public.cofounder_profiles;
create policy "cofounder_profiles_select_authenticated"
on public.cofounder_profiles
for select
to authenticated
using (true);

drop policy if exists "cofounder_profiles_insert_owner" on public.cofounder_profiles;
create policy "cofounder_profiles_insert_owner"
on public.cofounder_profiles
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "cofounder_profiles_update_owner" on public.cofounder_profiles;
create policy "cofounder_profiles_update_owner"
on public.cofounder_profiles
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "cofounder_profiles_delete_owner" on public.cofounder_profiles;
create policy "cofounder_profiles_delete_owner"
on public.cofounder_profiles
for delete
to authenticated
using (user_id = auth.uid());

drop policy if exists "cofounder_matches_select_participants" on public.cofounder_matches;
create policy "cofounder_matches_select_participants"
on public.cofounder_matches
for select
to authenticated
using (from_user_id = auth.uid() or to_user_id = auth.uid());

drop policy if exists "cofounder_matches_insert_from_user" on public.cofounder_matches;
create policy "cofounder_matches_insert_from_user"
on public.cofounder_matches
for insert
to authenticated
with check (
  from_user_id = auth.uid()
  and from_user_id <> to_user_id
);

drop policy if exists "cofounder_matches_update_from_user" on public.cofounder_matches;
create policy "cofounder_matches_update_from_user"
on public.cofounder_matches
for update
to authenticated
using (from_user_id = auth.uid())
with check (from_user_id = auth.uid());

drop policy if exists "cofounder_matches_delete_from_user" on public.cofounder_matches;
create policy "cofounder_matches_delete_from_user"
on public.cofounder_matches
for delete
to authenticated
using (from_user_id = auth.uid());
