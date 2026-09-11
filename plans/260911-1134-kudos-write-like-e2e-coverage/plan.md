---
title: "Executable E2E proof for kudos write + like"
description: "Real server-side auth in Playwright so the 6 fixme composer/like tests become executable proof, plus the self-like RLS hole closed."
status: pending
priority: P1
effort: 7h
branch: feature/new/noID/implement-kudos-screen
tags: [e2e, playwright, supabase, auth, rls, kudos]
created: 2026-09-11
---

# Kudos write + like — executable E2E proof

Today 6 Playwright tests covering composer/submit/like are `test.fixme` — zero executable
evidence that "write a kudos" or "like a kudos" works in a browser. Cause: auth is checked
server-side (`page.tsx` → `supabase.auth.getUser()`), so `page.route()` stubbing can never
reach it. Fix: a real logged-in session delivered as cookies via a Playwright `setup` project.

## Phases

| # | Phase | Status | Depends on | Effort |
|---|-------|--------|-----------|--------|
| 01 | [Enable + verify local password login (GO/NO-GO GATE)](phase-01-enable-and-verify-password-login.md) | completed | — | 1h |
| 02 | [Make seed users loginable](phase-02-loginable-seed-users.md) | completed | 01 | 1h |
| 03 | [Playwright auth setup project + storageState](phase-03-playwright-auth-setup.md) | completed | 02 | 1.5h |
| 04 | [Composer test hooks + hashtag-bound DRY](phase-04-composer-testids.md) | deferred | — | 0.75h |
| 05 | [Un-fixme and repair the 6 tests](phase-05-repair-six-tests.md) | deferred | 03, 04 | 1.5h |
| 06 | [Self-like RLS migration + proof test](phase-06-self-like-rls-migration.md) | completed | 03 | 0.75h |
| 07 | [Full verification + docs](phase-07-verification-and-docs.md) | completed | 05, 06 | 0.5h |

Phases 04 and 06 hold disjoint files from everything running beside them; 04 can start any time.

## Key decisions (already approved — do not reopen)

- `[auth.email] enable_signup = true` in `supabase/config.toml` — local dev only. Production
  stays Google-OAuth-only; no change to `src/lib/auth/login-actions.ts`.
- Cookie mechanic: `createServerClient` + in-memory stub cookie jar → `signInWithPassword` →
  let `@supabase/ssr`'s own `setAll` fill the jar → `context.addCookies` + `storageState`.
  **Never hand-serialize a cookie name or chunk index.**
- Seed users made loginable through `admin.createUser({ id: <existing uuid> })` — verified
  accepted by this gotrue, so seed UUIDs `1111…/2222…/3333…` stay and no FK re-keying happens.
- Tests are fixed to match real behavior; **no product features added to satisfy a test**.
  Test 5 becomes a like→unlike toggle assertion. Test 6 targets a kudos authored by the test user.
- Composer gets explicit `data-testid`s (chosen over role queries: `/Gửi/i` also matches
  "Đang gửi..." and the `h2` title, and suggestions have no `role="option"`).
- `PRELAUNCH_GATE_ENABLED=false` pinned via `playwright.config.ts` `webServer.env`, with a
  setup-project assertion that the running server is actually ungated.

## Test matrix

| Layer | Owns |
|-------|------|
| jest (unit, jsdom) | composer `canSubmit` logic, testid presence, shared hashtag bounds. No DB. |
| playwright `chromium-public` | unauthenticated board render, `Ghi nhận`/like → `/login` redirect |
| playwright `chromium-auth` | composer open, submit gating, cancel, real submit→feed, like/unlike toggle, own-kudos disabled |
| playwright `chromium-auth` (API) | RLS: forged sender, forged like user, self-like via direct PostgREST |

## Rollback of the whole plan

Every phase is additive or test-only except two: `supabase/config.toml` (revert one line) and the
new likes migration (revert with a follow-up migration; never edit the applied one). No production
code path changes behavior — phase 04 is the only `src/` edit and it is testids plus a constant move.

## Unresolved questions

1. **Does `enable_signup = true` actually enable password login?** **ANSWERED YES** (phase 01, 2026-09-11).
   Flag set to `true` in config.toml. Probe: `admin.createUser` + `signInWithPassword` succeeded,
   session non-null, exit 0. Docker workaround (storage disabled) was needed; service still up (auth/gotrue running).

2. **Corrupt docker layer blocks a clean `supabase start`** (`failed to register layer: rename … file exists`,
   prepulling storage-api). **ELEVATED SEVERITY.** This session it destroyed the local DB once and wiped
   `supabase_migrations.schema_migrations` table, leaving no record of applied migrations. Workaround still works
   (temp `[storage] enabled = false`) but the table loss is now a failure mode to document. Out of scope to fix.

3. **Should `supabase/seeds/dev/001_kudos_dev_seed.sql` drop its raw `auth.users` inserts** and delegate
   wholesale to `admin.createUser`? Still open. This plan keeps both (SQL becomes no-op via `on conflict`)
   and the admin path has run repeatedly without issue. Recommend: accept as-is or revisit post-merge.
