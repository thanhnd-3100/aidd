-- Kudos board core schema: profiles, kudos, kudos_likes
-- - profiles is synced from auth.users via a trigger (standard Supabase pattern)
-- - RLS: public read on all three tables, authenticated-only writes scoped to the caller
-- See plans/260908-1654-sun-kudos-board/phase-b0-db-schema-and-rls.md for the full spec.

-- 1. profiles -----------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_all"
  on public.profiles
  for select
  to anon, authenticated
  using (true);

-- 2. kudos ----------------------------------------------------------------

create table public.kudos (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles (id),
  receiver_id uuid not null references public.profiles (id),
  content text not null check (char_length(trim(content)) > 0),
  hashtags text[] not null check (array_length(hashtags, 1) between 1 and 5),
  created_at timestamptz not null default now()
);

alter table public.kudos enable row level security;

create policy "kudos_select_all"
  on public.kudos
  for select
  to anon, authenticated
  using (true);

create policy "kudos_insert_own"
  on public.kudos
  for insert
  to authenticated
  with check (auth.uid() = sender_id);

create index kudos_created_at_desc_idx on public.kudos (created_at desc);

-- 3. kudos_likes ------------------------------------------------------------

create table public.kudos_likes (
  kudos_id uuid not null references public.kudos (id) on delete cascade,
  user_id uuid not null references public.profiles (id),
  created_at timestamptz not null default now(),
  primary key (kudos_id, user_id)
);

alter table public.kudos_likes enable row level security;

create policy "kudos_likes_select_all"
  on public.kudos_likes
  for select
  to anon, authenticated
  using (true);

create policy "kudos_likes_insert_own"
  on public.kudos_likes
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "kudos_likes_delete_own"
  on public.kudos_likes
  for delete
  to authenticated
  using (auth.uid() = user_id);

create index kudos_likes_kudos_id_idx on public.kudos_likes (kudos_id);

-- 4. auth.users -> profiles sync trigger -------------------------------

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
