# Kudos board was "delivered" but silently broken — NaN offset, auth labyrinth, seed traps

**Date**: 2026-09-11 14:29
**Severity**: critical
**Component**: sun-kudos board, Supabase auth, migration seed, RLS
**Status**: resolved

## What Happened

Started this session with `plans/260908-1654-sun-kudos-board/` marked `status: delivered`. 
Opened the board in the browser. Feed was empty — no error, no server log, just "Hiện tại chưa có Kudos nào."
All 27 jest suites passed throughout. Next.js build succeeded. Deploy and rollback looked clean.

Yet a visitor saw nothing.

**Thread 1: The silent feed failure.** Traced it:
- Server Component (`page.tsx`) imported `PAGE_SIZE` and `mapKudosRow` from `sun-kudos-client.tsx`, which carries `"use client"`.
- Next replaces such imports with client-reference proxies — functions become stubs that break server-side.
- `offset + PAGE_SIZE` on the server evaluated to `NaN` (adding number + stub).
- PostgREST received `limit=NaN` and answered `200 []`.
- `list-kudos.ts` fail-softs empty results to the empty state — so no error ever surfaced.
- Jest has no RSC client-boundary transform, so no test could catch this.

Fixed: extracted `PAGE_SIZE` and `mapKudosRow` to `src/app/sun-kudos/kudos-view-model.ts` (a plain module, no `"use client"`). Server Component imports from it cleanly now.

**Thread 2: Authenticated E2E — four dead ends before the fix.** The existing 6 Playwright tests were all `test.fixme`. Why?
- First attempt: `page.route()` to stub `/auth/v1/user` — can't work. Auth runs in a Server Component; `page.route` only sees browser fetch, not server-side calls.
- Second attempt: Self-signed JWT with the local JWT secret — `GET /auth/v1/user` returns **500**. Dead. (PostgREST accepts it directly; the two services have differing trust models.)
- Third attempt: `signInWithPassword` — blocked by `[auth.email] enable_signup = false` in `supabase/config.toml`. Flipped that flag locally (dev only; production stays OAuth).
- Fourth attempt (the one that worked): A Playwright `setup` project builds `createServerClient` over an in-memory stub cookie jar, calls `signInWithPassword`, lets `@supabase/ssr`'s `setAll` fill the jar. Cookie name, chunking, domain, httpOnly — all handled by the library, never hand-written. Creates `playwright/.auth/an.json` (storageState) and `playwright/.auth/an-token.json` (raw access token for RLS proofs).

**Thread 3: Seed data was a minefield.** Code reading found:
- `supabase/seeds/dev/001_kudos_dev_seed.sql` inserts auth.users rows with `encrypted_password = ''` — these users can never authenticate through gotrue.
- No `auth.identities` row is created. Gotrue requires both.
- The `on conflict (id) do nothing` means if this SQL runs before the admin-API script (`scripts/seed-auth-users.ts`), the script's later insert silently no-ops and login stays broken.
- The seeding order comment was present but the actual workflow (npm run db:reset:dev) was running things in the right order — developers just have to remember not to skip the script or run SQL directly.

Also in the seed: one pre-existing like by Chi on a kudos from Binh would have made the like-toggle test's first click an UN-like, asserting a count increase against a decrease.

**Thread 4: Docker and storage corruption.** Supabase Docker layer became corrupt (`failed to register layer: rename … file exists` on the storage-api). `supabase start` failed. Worse, `supabase db reset` drops the database BEFORE it reaches that failure — it wiped the local DB and `supabase_migrations.schema_migrations` entirely. Nothing is tracked as applied locally now; `supabase migration up` against the current DB fails with "relation already exists". The hosted project stays unaffected (independent tracking).

Workaround: `supabase/config.toml` line `[storage] enabled = false`, start, then restore immediately after. Used this all session.

**Thread 5: RLS hole in self-likes.** The app-layer check in `src/lib/kudos/toggle-like.ts:42` prevented self-likes — but a user holding their own access token can POST directly to PostgREST, bypassing the server action. Closed with a forward-only migration:

```sql
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
```

Proved with four direct PostgREST assertions using a real user token. Note: `23505` (duplicate key) is not RLS denial; real denials are `42501` (PostgreSQL) or 403 (Supabase).

**Thread 6: Scope deferred.** Phases 04 (composer testids) and 05 (rewrite the 6 tests) were deferred — the incoming `plans/260911-1143-viet-kudo-screen/` will restructure the composer and delete free-typed hashtags. Doing those phases now meant writing tests twice. **Consequence stated plainly:** kudos write and like have NO executable browser coverage yet; what exists is proof the auth harness reaches them.

Final state: tsc exit 0; jest 27 suites / 180 tests; eslint 0 errors (4 `no-img-element` warnings pre-existing); `next build` exit 0; playwright 34 passed / 22 skipped / 0 failed.

## The Brutal Truth

The "delivered" label on 260908's plan was a lie — or more precisely, it was a truth that nobody had tested in the browser. All the unit tests passed. The build succeeded. But a visitor opened the board and saw nothing because of a boundary that jest can't see.

This stings because it reveals a structural gap: every test could pass and the feature could still fail silently at the integration layer. The RSC/client-boundary problem is not even rare — it's a known Next.js gotcha, and it should have been caught in initial spot-checks or by the reviewer. Instead, it made it past `delivered`.

The auth maze was infuriating. Four different directions, each hitting a genuine wall — the server-route-stubbing limitation, the service-trust mismatch, the enable_signup toggle, and finally the library doing the hard work of cookie serialization for us. But the hard part here was that there was NO ERROR MESSAGE guiding us. `signInWithPassword` silently fails when signup is disabled. The setup project throwing hard on misconfig was good discipline; it forces the next reader to understand what broke, not to guess.

The seed data minefield is the most galling. An experienced dev would have caught that immediately (empty password = no auth). But it was hiding in SQL, and the comment about ordering was present but the code could still be run wrong. The right place to catch this was a pre-test schema audit, not by luck.

The Docker storage issue cost an hour of thrashing — `db reset` wiping migrations is a footgun. We worked around it locally by disabling storage; anyone deploying to a fresh Supabase instance would need to know to do this or to re-apply pending migrations.

## Technical Details

**Server Component boundary break:**
- `src/app/sun-kudos/page.tsx:3` was importing from `./sun-kudos-client.tsx` (which carries `"use client"`)
- Next's bundler replaced `mapKudosRow` and `PAGE_SIZE` with client-reference stubs
- `offset + PAGE_SIZE` → `NaN` (adding number to undefined/stub)
- PostgREST received `limit=NaN`, returned `200 []`
- `list-kudos.ts:85` fail-softed empty to empty state; no error logged

**Fix:** Created `src/app/sun-kudos/kudos-view-model.ts` (plain module, no client marker). Page and client both now import from it.

**Auth setup pathway:**
- `e2e/auth.setup.ts` creates `createServerClient` with in-memory Map as cookie jar
- Calls `signInWithPassword(an.nguyen@sun-asterisk.dev, <password>)`
- Reads cookies via `jar.entries()` and adds them to Playwright context (httpOnly, Lax)
- Saves storageState to `playwright/.auth/an.json`
- Writes raw access token to `playwright/.auth/an-token.json` for RLS tests
- Gate check at lines 33-40 throws early if dev server has PRELAUNCH_GATE_ENABLED on

**Seed traps discovered:**
- `001_kudos_dev_seed.sql:37,49,61` sets `encrypted_password = ''` — users cannot authenticate
- No `auth.identities` row created (gotrue needs both auth.users and identities)
- `on conflict (id) do nothing` silently no-ops if script ran first
- Like fixture (Chi on Binh's kudos) was deliberately NOT pre-created; An-on-Binh's is the toggle test pair

**RLS self-like block:**
- Migration `20260911140000_kudos_likes_block_self_like.sql` replaces the insert policy
- Checks both `auth.uid() = user_id` AND a NOT EXISTS that blocks sender_id = auth.uid()
- Proved with direct PostgREST calls using a real user token (never service key)

**Docker issue:**
- `supabase start` failed on a corrupt storage-api layer
- `supabase db reset` dropped the database BEFORE the failure — migrations table was wiped
- Workaround: `[storage] enabled = false` in config, start, then restore
- Hosted project unaffected (separate tracking)

## What We Tried

**Feed broken:**
- Opened browser, saw empty board — no error anywhere
- Checked server logs — PostgREST requests with `limit=NaN`
- Traced import chain: page.tsx → sun-kudos-client.tsx → stubbed import
- Extracted to kudos-view-model.ts, verified tsc/jest/build all pass, feed now shows 3 kudos

**Auth harness:**
1. Tried stubbing `/auth/v1/user` via `page.route` — doesn't reach Server Component calls ✗
2. Tried hand-signing JWT with local secret — PostgREST accepts, but gotrue returns 500 ✗
3. Tried `signInWithPassword` — blocked by enable_signup=false ✗
4. Flipped enable_signup (local dev only), ran again — 401/200 cycle confirmed working ✓
5. Built setup project with in-memory jar + `createServerClient` — full auth flow works ✓
6. Proved with 34 passing E2E tests across public / authenticated / RLS flows

**Seed validation:**
- Read SQL manually, found empty passwords
- Checked admin-API script (`seed-auth-users.ts`) — it creates identities
- Added comment about ordering and like-fixture intent
- Updated dev-seed-user-list.ts to be side-effect-free

**RLS proof:**
- Created `kudos-rls.spec.ts` with three RLS assertions:
  - An (sender of kudos A) cannot like their own kudos A (22505 / 403 expected) ✓
  - Chi (non-sender) CAN like Chi's kudos C (201 expected) ✓
  - Self-like attempt before migration: previously 201 (hole open), after migration: 403 (closed)

**Docker:**
- `supabase db reset` failed with storage error
- Migrations table was wiped; re-apply fails with "relation exists"
- Set `[storage] enabled = false`, restarted, continued session
- Will need restore or full re-init after storage-api fix

## Root Cause Analysis

**Silent feed failure:** A boundary that jest cannot see. The RSC/client-boundary in Next is a real gotcha — imports from `"use client"` modules are replaced with stubs, and arithmetic on undefined/stubs coerces to NaN silently. No test framework without the Next bundler will catch this. The code logic was sound; the contract between the layers was broken.

**Auth maze:** Four different root causes blocked in sequence:
1. `page.route()` cannot intercept Server Component network calls — architectural limitation, not a bug
2. GTotrue and PostgREST have differing token-trust models — documented, but not obvious when reading code
3. `enable_signup = false` is a silent failure mode for `signInWithPassword` — gotrue should return 403, not silently reject
4. Cookie serialization is complex (chunking, domain, httpOnly, SameSite) — libraries solve it; hand-writing is risky

The fourth solution worked because it let the library handle the hard part.

**Seed trap:** A SQL file that looks correct at a glance but has two show-stoppers:
- Empty password means no gotrue auth (only works if admin-API script runs first)
- No auth.identities row (gotrue requires it; SQL alone can't create it)

The comment about ordering was there, but the code could still fail if run in isolation. This is a "read the comments carefully" failure, not a code failure.

**Docker corruption:** An infrastructure issue outside the app logic. The tool (supabase) compounded the problem by wiping migrations before failing, rather than failing first and letting reset be idempotent.

**RLS hole:** The security rule lived only in app logic. Database RLS exists precisely to prevent this — the fix was straightforward, but it should have been there from the start. A security review that checks "is this enforced at the data layer?" would have caught it immediately.

**Scope deferral:** A wise call. Phases 04/05 (rewriting tests) would be wasted work if the composer is being restructured. The consequence is low coverage for the write/like paths, but the auth harness exists and can be extended later.

## Lessons Learned

1. **RSC boundaries are invisible to jest.** A test suite can show 180 passing tests while the deployed feature is silently broken at the integration layer. The fix is discipline: spot-check the UI in a browser before calling it shipped. This isn't automation-failure; it's a gap that automated tests can't reach.

2. **Auth integration testing has multiple failure modes.** Each layer (Server Component, client fetch, gotrue, PostgREST) has its own trust model and semantics. A chart of "which layer can talk to which" would have saved four dead ends. And `enable_signup = false` being a silent failure is a gotcha worth documenting.

3. **Seed data in SQL is a trap.** Empty passwords, missing foreign-key rows, and ordering dependencies are all in the same file but not enforced together. Code reading caught this one, but a pre-deploy schema audit or a migration validator would have caught it earlier. The comment about ordering was there; it just wasn't enforced.

4. **Migrations can be partially wiped by tool failures.** `supabase db reset` dropping the database BEFORE it reaches the storage error created a broken state where migrations are untracked but tables exist. The workaround (disable storage temporarily) is fragile. A safer pattern is "reset migration tracking AFTER successful schema reset," or fail-early rather than fail-mid.

5. **Security rules live in multiple places if you let them.** The self-like check was only in `toggle-like.ts`. RLS is the authoritative layer; if the rule can be bypassed by a direct PostgREST call, the RLS is incomplete. Every table mutation should have a comprehensive RLS policy that reflects the app's intent, not rely on upstream checks.

6. **Deferred phases create blind spots.** E2E tests for write and like exist to prove the auth harness works, but they don't exercise the actual composer UI or like button. That coverage gap is acceptable if documented, but it needs to be called out in the next session's scope or the gap grows.

## Next Steps

1. **Integration testing discipline:** Before marking a feature "delivered," open the UI in a browser, spot-check the happy path, and verify the error paths with dev tools. Don't rely on unit tests alone. **Owner:** developer + reviewer.

2. **Chart auth layer semantics:** Document which layers can auth to which, what tokens they accept, and what silent-failure modes exist. Add to `docs/authentication.md` with a decision tree: "I need to authenticate from a Server Component? Go here. From a client fetch? Go here. From Playwright? Go here." **Owner:** doc-writer.

3. **Pre-deploy schema audit:** Before a migration ships, audit the seed data for:
   - Missing foreign-key values or incomplete identity rows
   - Silent-failure modes (empty passwords, missing triggers, etc.)
   - Ordering dependencies and their documentation
   - Add a lint script in `scripts/` if this becomes a pattern.
   **Owner:** developer + reviewer.

4. **Docker storage fix:** Once supabase fixes the storage-api layer, verify that a fresh `supabase start` and `db reset` work without the `[storage] enabled = false` workaround. Restore the config and test a full flow. **Owner:** devops.

5. **Phases 04/05 ownership:** Once `plans/260911-1143-viet-kudo-screen/` clarifies the composer restructure, revisit the testid and test-repair phases. If the composer changes, defer these; if it stays stable, they land immediately after. **Owner:** orchestrator / next session.

6. **Verify hosted Supabase:** The storage issue was local-only. Confirm that the hosted project still has intact migrations and can accept PostgREST requests without `[storage] enabled = false`. **Owner:** devops / deployment.
