-- Close the self-like hole in kudos_likes RLS.
--
-- kudos_likes_insert_own (20260908165400) only checked `auth.uid() = user_id`,
-- so a user could like their own kudos by inserting directly into kudos_likes
-- via PostgREST, bypassing the app-layer check in
-- src/lib/kudos/toggle-like.ts:42. This migration makes the database agree
-- with that rule instead of relying on the server action alone.
--
-- Forward-only: the applied migration 20260908165400 is never edited.

drop policy if exists "kudos_likes_insert_own" on public.kudos_likes;

create policy "kudos_likes_insert_own"
  on public.kudos_likes
  for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and not exists (
      select 1 from public.kudos k
      where k.id = kudos_id and k.sender_id = auth.uid()
    )
  );
