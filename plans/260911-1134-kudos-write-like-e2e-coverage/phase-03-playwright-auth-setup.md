# Phase 03 — Playwright auth setup project + storageState

## Context Links

- Research report §2 (concrete mechanic), §4 (config shape), §5 (pitfalls)
- `playwright.config.ts`
- `src/middleware.ts` + `src/lib/prelaunch/gate.ts`
- `src/lib/supabase/middleware.ts` (`updateSession` — rotates refresh tokens)
- Depends on: phase 02

## Overview

- **Priority:** P1
- **Status:** completed (2026-09-11)
- **Goal:** a `setup` project that produces a real authenticated `storageState` for An (`1111…`),
  an ungated dev server, and two browser projects (public / authenticated).

## Key Insights

- **Never hand-serialize the cookie.** Build a `createServerClient` over an in-memory jar, call
  `signInWithPassword`, let `@supabase/ssr`'s own `setAll` decide the names and chunking. The exact
  cookie name is unverified and must not appear as a literal anywhere.
- Cookie `domain` must match `baseURL`'s host — `localhost`, not `127.0.0.1`. A mismatch means the
  cookie is silently never sent and the failure looks like "auth just doesn't work".
- **Both** `/sun-kudos` and `/login` are gated by the prelaunch middleware, and `/login` additionally
  runs `redirectIfAuthenticated("/todo")` — an authenticated context cannot visit `/login`. That is
  why public and authenticated tests must live in separate projects, not one file.
- `reuseExistingServer: !CI` means `webServer.env` can be silently bypassed by a dev server someone
  already has on :3000 with the gate on. Assert, don't assume.
- `updateSession` in middleware refreshes tokens, rotating the refresh token and staling the saved
  `storageState`. Mitigation: the setup project regenerates the state on every run and the state file
  is gitignored — never a committed fixture.

## Requirements

Functional:
- `playwright/.auth/an.json` produced fresh each run, carrying a session the Server Component accepts.
- Setup fails loudly (non-zero, clear message) when the gate is on or sign-in fails.
- Public tests keep running unauthenticated; authenticated tests run with the state.

Non-functional:
- Each spec file stays under 200 lines — the split below is partly why.

## Architecture

```
webServer (env: PRELAUNCH_GATE_ENABLED=false)
        │
  project "setup"  (testMatch /auth\.setup\.ts/)
        │  stub jar + signInWithPassword → context.addCookies → storageState
        ├──────────────┬──────────────────────────────
  "chromium-public"   "chromium-auth"  (dependencies: [setup], storageState)
   no storageState     authenticated as An
```

File split:

| File | Project | Holds |
|---|---|---|
| `e2e/auth.setup.ts` | setup | gate assertion + login + storageState |
| `e2e/sun-kudos-public.spec.ts` | chromium-public | the 5 currently-passing unauth tests + the homepage regression |
| `e2e/sun-kudos-authenticated.spec.ts` | chromium-auth | the 6 ex-fixme tests (moved verbatim here; phase 05 rewrites their bodies) |

`e2e/sun-kudos.spec.ts` disappears in this split (`git mv` the public half, move the rest).
`chromium-public` and `chromium-auth` both need `testIgnore: /\.setup\.ts$/`.

## Related Code Files

- Create: `e2e/auth.setup.ts`
- Create: `e2e/sun-kudos-public.spec.ts`, `e2e/sun-kudos-authenticated.spec.ts` (mechanical split only)
- Delete: `e2e/sun-kudos.spec.ts`
- Modify: `playwright.config.ts`, `.gitignore` (`/playwright/.auth/`)

**Ownership handoff:** this phase does the mechanical split and then hands
`e2e/sun-kudos-authenticated.spec.ts` to phase 05. It must not change any assertion.

## Implementation Steps

1. `.gitignore`: add `/playwright/.auth/`.
2. `playwright.config.ts`: add `webServer.env: { PRELAUNCH_GATE_ENABLED: "false" }`; replace the single
   `chromium` project with `setup` / `chromium-public` / `chromium-auth` per the diagram.
3. `e2e/auth.setup.ts`:
   - import `DEV_USERS` from `scripts/seed-auth-users.ts` (single source of credentials).
   - **Gate assertion first:** `request.get('/sun-kudos', { maxRedirects: 0 })` — a 307 to `/countdown`
     means a stale ungated-server reuse; throw with "prelaunch gate is ON; stop the stale dev server
     or set PRELAUNCH_GATE_ENABLED=false".
   - stub-jar `createServerClient` → `signInWithPassword(An)` → throw on error.
   - `context.addCookies(jar.map(… domain: 'localhost', path: '/', httpOnly: true, secure: false, sameSite: 'Lax'))`.
   - `context.storageState({ path: 'playwright/.auth/an.json' })`.
   - Also persist the raw `access_token` to `playwright/.auth/an-token.json` — phase 06 needs it for
     direct PostgREST calls.
4. Add a throwaway smoke test under `chromium-auth` that visits `/sun-kudos` and asserts the
   "Ghi nhận" click opens a `role="dialog"` instead of navigating to `/login`. That single assertion
   is the proof the whole auth mechanic works; keep it as the first test in the authenticated spec.

## Todo List

- [ ] `.gitignore` entry
- [ ] three projects wired, `testIgnore` set so specs do not re-run under `setup`
- [ ] `webServer.env` pins the gate off
- [ ] gate assertion in setup
- [ ] stub-jar login, no hardcoded cookie name
- [ ] storageState + access token written
- [ ] spec split done with zero assertion changes

## Success Criteria

- `npx playwright test --project=setup` → exit `0`, `playwright/.auth/an.json` exists and is non-empty.
- `npx playwright test --project=chromium-public` → exit `0`, same test count as today's passing 6.
- The smoke test: authenticated click on "Ghi nhận" opens the dialog (URL stays `/sun-kudos`).
- `git status` shows no `playwright/.auth/*` file staged.

## Risk Assessment

| Risk | L | I | Countermove |
|---|---|---|---|
| Cookie domain mismatch → silent unauthenticated run | Med | High | `domain: 'localhost'`; the smoke test catches it immediately |
| Stale dev server on :3000 with gate on | High | High | Explicit gate assertion in setup; or run with `PLAYWRIGHT_PORT=3100` |
| Token refresh mid-suite invalidates the saved refresh token | Low | Med | State regenerated per run; suite is minutes, `jwt_expiry` is 3600s. Do NOT edit `jwt_expiry` — config.toml must stay one-line-changed |
| Parallel workers share one account and race on like state | Med | Med | Phase 05 gives each mutating test its own target kudos; escalate to per-worker users (Binh/Chi states) only if flake appears |
| Setup file picked up by the browser projects | Med | Low | `testIgnore: /\.setup\.ts$/` |

## Rollback

`git checkout playwright.config.ts .gitignore`, restore `e2e/sun-kudos.spec.ts` from HEAD, delete
`e2e/auth.setup.ts` and the two split files. Baseline (6 passed / 6 skipped) returns untouched.

## Security Considerations

- `playwright/.auth/` gitignored — it holds real access and refresh tokens.
- The access-token dump for phase 06 lives in the same gitignored directory; never log it.
- Setup uses the publishable key for sign-in. The service key stays out of the browser projects entirely.

## Next Steps

Phase 05 (rewrite the 6) and phase 06 (RLS test) both consume the artifacts this phase produces.

## Result — 2026-09-11 (completed)

Auth setup fully wired. Mechanical split of `e2e/sun-kudos.spec.ts` into public + authenticated specs.
- `e2e/auth.setup.ts` written: gate assertion, stub-jar login via `signInWithPassword`, `storageState` saved
- `e2e/sun-kudos-public.spec.ts` created (public/unauthenticated tests)
- `e2e/sun-kudos-authenticated.spec.ts` created (6 ex-fixme tests + 1 smoke test, bodies untouched)
- `playwright.config.ts` updated: `setup` project, two browser projects (`chromium-public`, `chromium-auth`),
  `webServer.env.PRELAUNCH_GATE_ENABLED=false`, access token persisted to `playwright/.auth/an-token.json`
- `.gitignore` entry: `/playwright/.auth/`

Verified: `npx playwright test --project=setup` → exit 0, storageState created. Smoke test passes:
authenticated click on "Ghi nhận" opens modal (URL stays `/sun-kudos`).
