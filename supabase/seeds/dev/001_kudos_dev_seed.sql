-- Dev seed data for manual testing of the Kudos board.
-- NOT applied automatically by this phase (write-only migration, no live apply available here).
-- Run manually against a local/dev Supabase instance after `supabase db reset`, e.g.:
--   psql "$DATABASE_URL" -f supabase/seeds/dev/001_kudos_dev_seed.sql
--
-- Ordering contract: `node scripts/seed-auth-users.ts` MUST run before this file (see
-- `npm run db:reset:dev`). That script creates the same three users through the Supabase
-- admin API, which also writes the `auth.identities` row gotrue needs to authenticate them --
-- something a raw `auth.users` insert cannot do. The `auth.users` insert below is a fallback
-- for the `handle_new_user` trigger to mirror into `profiles`; `on conflict (id) do nothing`
-- means it is a no-op once the script has already created these rows.
--
-- Caveat: `profiles.id` is a foreign key into `auth.users(id)`, so these fake profile rows
-- require matching placeholder rows in `auth.users` first (the trigger normally does this sync
-- automatically on real signup). The inserts below create minimal `auth.users` rows for the
-- fake accounts, which the `handle_new_user` trigger then mirrors into `profiles` -- so no
-- manual `profiles` insert is needed for these three seed users.

insert into auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_user_meta_data,
  created_at,
  updated_at
) values
  (
    '11111111-1111-1111-1111-111111111111',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'an.nguyen@sun-asterisk.dev',
    '',
    now(),
    '{"full_name": "An Nguyen", "avatar_url": "https://i.pravatar.cc/150?u=an-nguyen"}',
    now(),
    now()
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'binh.tran@sun-asterisk.dev',
    '',
    now(),
    '{"full_name": "Binh Tran", "avatar_url": "https://i.pravatar.cc/150?u=binh-tran"}',
    now(),
    now()
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'chi.le@sun-asterisk.dev',
    '',
    now(),
    '{"full_name": "Chi Le", "avatar_url": "https://i.pravatar.cc/150?u=chi-le"}',
    now(),
    now()
  )
on conflict (id) do nothing;

-- Fake kudos exchanged between the seed users above.
insert into public.kudos (id, sender_id, receiver_id, content, hashtags, created_at) values
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    'Cam on Binh da support fix bug production rat nhanh, xu ly rat chuyen nghiep!',
    array['teamwork', 'reliable'],
    now() - interval '2 days'
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    '22222222-2222-2222-2222-222222222222',
    '33333333-3333-3333-3333-333333333333',
    'Chi lam demo cho khach hang cuc ky an tuong, ca team tu hao!',
    array['great-job'],
    now() - interval '1 day'
  ),
  (
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    '33333333-3333-3333-3333-333333333333',
    '11111111-1111-1111-1111-111111111111',
    'An luon san sang giup do dong nghiep moi, cam on ban rat nhieu!',
    array['mentorship', 'teamwork'],
    now()
  )
on conflict (id) do nothing;

-- A like so the like-count UI has something to render. Deliberately NOT liking
-- kudos `bbbbbbbb…` (Binh's) as An `11111111…` here: that pair is the E2E fixture for the
-- like/unlike toggle test, which asserts the count goes UP on first click. If An already
-- liked it, the first click would unlike it and the count would go DOWN instead.
insert into public.kudos_likes (kudos_id, user_id) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '33333333-3333-3333-3333-333333333333')
on conflict do nothing;
