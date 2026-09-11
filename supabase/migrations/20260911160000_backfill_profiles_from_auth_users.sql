-- Backfill profiles for auth.users rows that predate the handle_new_user trigger.
--
-- `on_auth_user_created` (20260908165400) fires only on INSERT into auth.users. Any
-- account that already existed when that migration was applied therefore never got a
-- public.profiles row, and signing in again does not help — a new sign-in creates a
-- session, not a new user row.
--
-- Visible symptom this fixes: the kudos composer's recipient search returned nothing,
-- so a recipient could never be selected and the "Gửi" button stayed disabled forever.
--
-- Forward-only and idempotent: re-running inserts nothing new, and on a fresh project
-- where the trigger has always been present this is a no-op.

insert into public.profiles (id, full_name, avatar_url)
select
  u.id,
  u.raw_user_meta_data ->> 'full_name',
  u.raw_user_meta_data ->> 'avatar_url'
from auth.users u
on conflict (id) do nothing;
