# Phase B0 — Setup: DB schema, sync trigger, RLS policies

**Track:** B (generic `implementer`) · **Depends on:** none · **Blocks:** T-RED, B1

## MoMorph refs
- Live board: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/MaZUn5xHXZ
- Composer modal: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/ihQ26W78P2
- Clarifications: plans/260908-1654-sun-kudos-board/clarifications.md
- testPolicy: e2e-red-first

## Goal
First DB schema in this project (`supabase/migrations` is empty today). Add `profiles`, `kudos`,
`kudos_likes` plus the `auth.users` sync trigger and RLS policies, via one migration file under
`supabase/migrations/`.

## Owned files
`supabase/migrations/<timestamp>_kudos_schema.sql`, `supabase/seeds/dev/*` (dev seed rows for
manual testing — a handful of fake profiles + kudos)

## Data flow
`auth.users` insert (Google OAuth signup) → trigger copies `id`, `raw_user_meta_data->>'full_name'`,
`raw_user_meta_data->>'avatar_url'` into `profiles` → client reads `profiles` for recipient search
and to render sender/receiver name+avatar on each kudos card, never touching `auth.users` directly.

## Schema
1. `profiles`: `id uuid primary key references auth.users(id) on delete cascade`, `full_name text`,
   `avatar_url text`, `created_at timestamptz default now()`.
2. `kudos`: `id uuid default gen_random_uuid() primary key`, `sender_id uuid not null references
   profiles(id)`, `receiver_id uuid not null references profiles(id)`, `content text not null check
   (char_length(trim(content)) > 0)`, `hashtags text[] not null check (array_length(hashtags,1)
   between 1 and 5)`, `created_at timestamptz default now()`.
3. `kudos_likes`: `kudos_id uuid not null references kudos(id) on delete cascade`, `user_id uuid not
   null references profiles(id)`, `created_at timestamptz default now()`, `primary key (kudos_id,
   user_id)` (PK itself enforces one like per user per kudos).
4. Trigger `handle_new_user()` (SECURITY DEFINER) on `auth.users` AFTER INSERT → inserts into
   `profiles`. Standard Supabase pattern — do not invent a variant.
5. Indexes: `kudos(created_at desc)` for feed pagination; `kudos_likes(kudos_id)` for like counts.

## RLS
- `profiles`: RLS enabled; `SELECT` policy `USING (true)` for `anon` + `authenticated` (name+avatar
  only columns exist — no email/PII leak risk).
- `kudos`: RLS enabled; `SELECT` policy `USING (true)` for `anon` + `authenticated` (public feed);
  `INSERT` policy for `authenticated` `WITH CHECK (auth.uid() = sender_id)`.
- `kudos_likes`: RLS enabled; `SELECT` `USING (true)`; `INSERT` for `authenticated` `WITH CHECK
  (auth.uid() = user_id)`; `DELETE` for `authenticated` `USING (auth.uid() = user_id)`.
- "Can't like own kudos" is **app-layer**, not a DB constraint (clarifications.md) — B1 enforces it
  in the server action before insert.

## Out of scope
Department/star-tier columns, hashtag catalog table, gift/Secret Box tables — none exist yet, none
requested (clarifications.md).

## Success criteria
- `supabase db reset` (or equivalent local apply) runs the migration clean, no errors.
- Trigger fires on a test `auth.users` insert and creates a matching `profiles` row.
- RLS verified manually: anon `select` on all three tables succeeds; anon `insert` on `kudos`/
  `kudos_likes` is rejected; an authenticated user can only insert rows with their own
  `sender_id`/`user_id`.
- `npx tsc --noEmit` still passes (no code changes yet, sanity check only).
