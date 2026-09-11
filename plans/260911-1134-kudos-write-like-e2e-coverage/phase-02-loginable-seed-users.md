# Phase 02 — Make seed users loginable

## Context Links

- `supabase/seeds/dev/001_kudos_dev_seed.sql`
- `supabase/migrations/20260908165400_kudos_schema.sql` (`handle_new_user` trigger)
- Research report §3
- Depends on: phase 01 GO

## Overview

- **Priority:** P1
- **Status:** completed (2026-09-11)
- **Goal:** the three seed identities (An `1111…`, Binh `2222…`, Chi `3333…`) can sign in with a
  password, keeping their existing UUIDs so no FK re-keying happens.

## Key Insights

- The SQL seed inserts `auth.users` rows with `encrypted_password = ''` and **no `auth.identities`
  row** — gotrue will never authenticate those. This is the real reason the seed users cannot log in.
- `admin.createUser` with a caller-supplied `id` is accepted here (verified), and the trigger creates
  the matching `public.profiles` row. So the script must run **before** the SQL seed, or the SQL seed's
  `on conflict (id) do nothing` will simply no-op it.
- `db.seed.sql_paths = ["./seeds/common/*.sql", …]` — the dev seed is **not** auto-applied by
  `supabase db reset`. Ordering is ours to control.
- `admin.deleteUser` is NOT a safe reset: `kudos.sender_id` → `profiles(id)` has no `on delete cascade`,
  so deletion is blocked once kudos exist. Reset means `supabase db reset`, not per-user deletion.

## Requirements

Functional:
- One idempotent script creates/repairs the three users with a known dev password.
- One npm script rebuilds the whole local test fixture deterministically.
- Re-running against an already-seeded DB succeeds (updates the password rather than exploding).

Non-functional:
- No secret committed. Service key read from `process.env`, documented blank in `.env.local.example`.
- Script under 200 lines (it will be well under; single-purpose).

## Architecture

```
supabase db reset          → schema only (dev seed not in sql_paths)
node scripts/seed-auth-users.ts  → 3 users w/ fixed UUIDs + passwords
                                    → trigger writes public.profiles
psql -f supabase/seeds/dev/001_kudos_dev_seed.sql
                                    → auth.users block no-ops (on conflict)
                                    → 3 kudos + 2 likes land
```

Fixture identities after seeding — this is the contract phase 05 asserts against:

| User | UUID | Authors | Receives |
|---|---|---|---|
| An (test user) | `1111…` | kudos `aaaa…` → **own-kudos disabled case (test 6)** | `cccc…` |
| Binh | `2222…` | kudos `bbbb…` → **likeable-by-An case (test 5)** | `aaaa…` |
| Chi | `3333…` | kudos `cccc…` | `bbbb…` |

An already likes `bbbb…` in the seed. **Remove that like row** (`bbbb…`/`1111…`) so test 5 starts from
a clean un-liked state, otherwise the first click un-likes and the count goes down. Keep the
`aaaa…`/`3333…` like so the card still renders a non-zero count elsewhere.

## Related Code Files

- Create: `scripts/seed-auth-users.ts`
- Modify: `package.json` (scripts `db:seed:users`, `db:reset:dev`)
- Modify: `supabase/seeds/dev/001_kudos_dev_seed.sql` (drop the An→`bbbb…` like; add
  `on conflict do nothing` where missing; a comment stating the script runs first)
- Modify: `.env.local.example` (add blank `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_DEV_USER_PASSWORD`)

**Owned exclusively by this phase.** No other phase touches `package.json` or the seed SQL.

## Implementation Steps

1. `scripts/seed-auth-users.ts` — plain TS run by Node 24's native type stripping
   (`node scripts/seed-auth-users.ts`; no `tsx` dependency — YAGNI).
2. Export a `const DEV_USERS` array (id, email, password from env with a dev default, full_name,
   avatar_url) matching the seed SQL metadata exactly.
3. Per user: `admin.createUser({ id, email, password, email_confirm: true, user_metadata })`.
   On a duplicate error, fall back to `admin.updateUserById(id, { password, email_confirm: true })`.
   If the update path also cannot produce a login (no identity row), delete-and-recreate is not
   available — print "run `npm run db:reset:dev`" and exit non-zero rather than half-fixing.
4. Verify inside the script: `signInWithPassword` for each user with the publishable key; exit
   non-zero on the first failure with the gotrue message printed.
5. `package.json`:
   - `"db:seed:users": "node scripts/seed-auth-users.ts"`
   - `"db:reset:dev": "supabase db reset && npm run db:seed:users && psql \"$SUPABASE_DB_URL\" -f supabase/seeds/dev/001_kudos_dev_seed.sql"`
6. Edit the seed SQL per the fixture contract above.
7. `.env.local` (local, untracked) gets `SUPABASE_SERVICE_ROLE_KEY` + `SUPABASE_DB_URL`;
   `.env.local.example` gets the same keys with empty values and a one-line comment.

## Todo List

- [ ] `scripts/seed-auth-users.ts` written, < 200 lines
- [ ] idempotent: second run exits 0
- [ ] all three sign-ins verified inside the script
- [ ] seed SQL: An's like on `bbbb…` removed
- [ ] npm scripts added
- [ ] `.env.local.example` updated, no secret committed

## Success Criteria

- `npm run db:reset:dev` → exit `0`.
- `npm run db:seed:users` run twice in a row → exit `0` both times.
- `psql "$SUPABASE_DB_URL" -c "select count(*) from auth.identities"` → `3`.
- `psql … -c "select count(*) from public.kudos_likes"` → `1`.

## Risk Assessment

| Risk | L | I | Countermove |
|---|---|---|---|
| Pre-existing raw-SQL users block `createUser` and `updateUserById` cannot add an identity | Med | High | Script exits non-zero telling the operator to `db:reset:dev`; the reset path is the supported one |
| Trigger `handle_new_user` conflicts when a `profiles` row already exists → createUser 500 | Med | Med | Same: full reset is the supported path; duplicate branch only handles a clean re-run |
| Dev password leaks into the repo | Low | High | Env var with a clearly-fake default; example file only |
| Node type stripping rejects the file | Low | Low | Keep it plain TS — no enums, no decorators, no `namespace` |

## Rollback

Delete `scripts/seed-auth-users.ts`, revert the two npm scripts and the seed SQL hunk,
`npm run db:reset:dev` off the reverted tree. Nothing in `src/` moved.

## Security Considerations

- Service key never leaves `.env.local`; the script must fail loudly if it is absent rather than
  silently falling back to the publishable key.
- Dev password is for the local stack only and must not appear in `.env.local.example` as a real value.

## Next Steps

Phase 03 consumes `DEV_USERS` — export it so `auth.setup.ts` imports the credentials instead of
re-declaring them (DRY).

## Result — 2026-09-11 (completed)

Committed as `3ec654c`. Script runs, users created with deterministic UUIDs, seed SQL no-ops via
`on conflict`, `npm run db:seed:users` idempotent.

**Uncommitted follow-up fixes** (to be staged before final commit):
1. Shared identity list extracted to `scripts/dev-seed-user-list.ts` so importing it has no side
   effects (originally inlined in `seed-auth-users.ts`).
2. `db:seed:users` npm script wraps the node call with `--env-file-if-exists=.env.local` because
   the script never loaded `.env.local` on its own; as committed, the npm script would fail
   "Missing required env vars". Fixed script now loads env correctly.

Verify these are staged before final merge.
