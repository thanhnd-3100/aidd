# Research: Playwright E2E Auth vs Next.js 16 App Router + @supabase/ssr (local stack)

Date 2026-09-11. Sources: Playwright official auth docs, Supabase SSR docs, supabase/ssr & supabase-js GitHub issues, Michele Ong's Next15+Playwright+Supabase blog, supabase-community seed discussions. `node_modules` read was BLOCKED by `.claude/.skignore` sandbox — cookie-name/chunking claims below are cross-referenced from 2+ GitHub issues + Supabase docs, not verified against installed source. Flag this as the one unresolved verification gap.

## RANKED RECOMMENDATION

1. **(BEST FIT)** Playwright `setup` project that calls `supabase-js` `signInWithPassword()` against local gotrue (http://127.0.0.1:54321), reads back the resulting session, writes it as `sb-<project-ref>-auth-token` cookie(s) via `context.addCookies()`, then `page.context().storageState({path})`. Seed users must first be made loginable via `auth.admin.createUser()` (not raw SQL).
2. Same setup project, but instead of `signInWithPassword`, mint the session with `service_role` + `admin.generateLink({type:'magiclink'})` or a hand-signed JWT, then inject cookies directly — skip real login. Use only if gotrue login itself is broken/flaky; adds a parallel "trust the service key" path that's easier to break silently (JWT shape drifts across gotrue versions).
3. Supabase's own docs do not publish a first-party Playwright recipe — no official pattern exists to defer to; community blog (Michele Ong) mocks JWTs manually and explicitly documents that mocked sessions **cannot** perform Supabase operations — unsuitable here since real DB/API operations matter for kudos e2e flows.

**Do not**: keep `page.route()` cookie/localStorage stubbing — it's already proven wrong per your fixme note, since `getUser()` runs server-side and `page.route()` only intercepts browser fetch.

## 1. What cookies does @supabase/ssr write, and are cookies alone enough for server-side getUser()?

- Cookie name: `sb-<project_ref>-auth-token` (Supabase docs, "Creating a Supabase client for SSR"). For local stack, project-ref segment is typically derived from the host/port config, seen as `sb-127-auth-token` in the wild (GitHub issue #300, #36) — **verify actual name by running a real login once locally and inspecting `document.cookie` / Playwright's `context.cookies()`**, since the exact ref token isn't in docs and couldn't be confirmed from source (node_modules blocked).
- Chunking: when the serialized session (access_token + refresh_token + user obj) exceeds ~4096 bytes, `@supabase/ssr` splits it into `sb-<ref>-auth-token.0`, `sb-<ref>-auth-token.1`, etc. (confirmed independently: supabase-js issue #963 "Large Auth Cookie Split Into 2", supabase/ssr issue #36). No universal `.2+` cap documented — assume N chunks, code must not assume exactly 2.
- `-code-verifier` cookie: PKCE-flow only (`sb-<ref>-auth-token-code-verifier`), written during `exchangeCodeForSession` (OAuth/magic-link redirect flow). **Not relevant to password-login test setup** — skip it, since `signInWithPassword` never touches PKCE.
- Cookies-only sufficiency: YES for server-side `getUser()` / `getClaims()` as implemented in `src/lib/supabase/server.ts` — `createServerClient` is built exactly to read the session out of the `getAll()` cookie jar; it never touches `localStorage` (that's a browser-only API, unavailable server-side anyway). This is *why* the storageState-cookie approach works and the previous `page.route()` approach didn't: `page.route` never reaches the Server Component's own network call, but cookies *are* transport, sent automatically with the page navigation request Playwright issues.
- Supabase docs push `getClaims()` (JWT signature verification) over `getUser()` (network round-trip to gotrue) for server checks — irrelevant to auth setup mechanics but note it: if the codebase's `page.tsx` migrates to `getClaims()`, gotrue itself doesn't need to be reachable at request time, only a locally-verifiable JWT with the right `aud`/`exp`/`sub` — makes JWT-minting (Option 2 below) fully viable and even preferable for speed.

## 2. Compare the three approaches

| | (a) signInWithPassword + storageState | (b) service_role mint + addCookies | (c) official Supabase pattern |
|---|---|---|---|
| Realism | High — exercises actual gotrue login, refresh, cookie shape | Medium — bypasses login UI/API entirely | N/A, doesn't exist |
| Speed | One extra HTTP round-trip per setup run (cached across workers via storageState file) | Fastest — no gotrue login call, pure crypto/JWT | N/A |
| Fragility to gotrue internal changes | Low — you're calling the public method, cookie shape whatever @supabase/ssr writes | Medium-high — if you hand-sign JWT, must match gotrue's exact claims/kid; if you use `admin.generateLink`, more robust (still official API) | N/A |
| Setup complexity | Low: seed user + password + `signInWithPassword` + write cookie via a real `createServerClient`-shaped writer | Medium: need `service_role` key wired into test env, need to build the exact cookie JSON Supabase expects (session object serialization must match what `@supabase/ssr` would have written, including chunking if oversized) | N/A |
| Covers "login flow itself" test cases | Yes, if you also keep a separate UI-login test | No (must pair with a UI-login test elsewhere) | N/A |
| Risk if `sb-ssr` changes cookie serialization format | Low — you're not hand-building the cookie value if you drive it through supabase-js's actual `createServerClient(...).auth.setSession()` (recommended concrete mechanism below) | Higher if hand-building JSON structure | N/A |

**Concrete recommended mechanic for (a):** don't hand-serialize cookies yourself. Inside `auth.setup.ts` (Node context, no browser), instantiate a `createServerClient` with a **stub cookie jar** you control (an in-memory array), call `signInWithPassword`, then let `setAll` populate your stub jar with whatever names/chunking `@supabase/ssr` decides — this guarantees byte-for-byte parity with what the real app would write, with zero guessing about the exact cookie name/chunk count. Then feed that stub jar into `context.addCookies()` and save `storageState`.

## 3. Making the seed users loginable

**Recommended: `auth.admin.createUser()` via a one-off Node/TS script run against the local gotrue admin API, not raw SQL.** Reasons (cross-referenced GitHub discussions #9251, #35391, supabase-community/seed#208):
- Raw SQL `INSERT INTO auth.users (encrypted_password, ...)` requires you to correctly reproduce bcrypt cost + gotrue's exact required companion rows (`auth.identities` with provider_id, `email_confirmed_at`, `raw_app_meta_data`, `instance_id`) — any drift between GoTrue versions silently breaks login with no compile-time signal.
- `auth.admin.createUser({ email, password, email_confirm: true, user_metadata })` goes through gotrue's own hashing path — guaranteed compatible with whatever bcrypt cost/format the running gotrue version uses.
- If IDs must stay fixed (111.../222.../333...), pass `id` explicitly in the `createUser` call (gotrue admin API accepts a fixed UUID) instead of letting it generate one — preserves existing FK relationships in the seed SQL.

**If SQL must stay** (e.g., other seed data already FKs against those fixed UUIDs and you don't want a script dependency in seeding), the fallback is:
```sql
update auth.users set encrypted_password = crypt('devpassword123', gen_salt('bf'))
where id in ('11111111-1111-1111-1111-111111111111', ...);
```
This needs `pgcrypto` enabled (`create extension if not exists pgcrypto;` — Supabase local stack has it by default) and confirms `email_confirmed_at is not null` already set. Weaker than admin API because it assumes gotrue reads `encrypted_password` in bcrypt format forever (currently true, undocumented as a stable contract).

**Concrete recommended call** (run once against local stack, e.g. a `supabase/seeds/dev/seed-users.ts` invoked from an npm script, using `service_role` key):
```ts
const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
await admin.auth.admin.createUser({
  id: '11111111-1111-1111-1111-111111111111', // if supported by your gotrue version; else drop id and re-map FKs
  email: 'an.nguyen@sun-asterisk.dev',
  password: 'dev-password-123!',
  email_confirm: true,
});
```
Verify `id` override works on your local gotrue image version before committing to it — some gotrue releases reject a client-supplied `id`; test once, and if rejected, generate then re-key downstream seed rows to the returned id.

## 4. Playwright config shape (@playwright/test 1.63, single existing chromium project + webServer)

```ts
// playwright.config.ts
export default defineConfig({
  webServer: { command: `npm run dev -- --port ${port}`, url: baseURL, reuseExistingServer: !process.env.CI },
  projects: [
    { name: 'setup', testMatch: /auth\.setup\.ts/ },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], storageState: 'playwright/.auth/user.json' },
      dependencies: ['setup'],
    },
  ],
});
```
- `dependencies: ['setup']` makes Playwright run the setup project's matched test(s) first, exactly once, before any test in `chromium` starts — works fine alongside the existing single `webServer` block since `webServer` starts before *any* project (including setup) runs.
- `testMatch` on the setup project must NOT overlap `chromium`'s picked-up test files, or the normal spec files re-run under the setup project too. Since your only project was `chromium` with no explicit `testMatch`, it defaults to picking up everything under `testDir` including `auth.setup.ts` unless you either move it into a `playwright/` dir outside `testDir`, or give `chromium` a `testIgnore: /\.setup\.ts$/`.
- `auth.setup.ts` itself:
```ts
import { test as setup } from '@playwright/test';
import { createServerClient } from '@supabase/ssr';

const authFile = 'playwright/.auth/user.json';

setup('authenticate', async ({ page, context }) => {
  const cookies: { name: string; value: string }[] = [];
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { cookies: {
        getAll: () => cookies,
        setAll: (list) => list.forEach(({ name, value }) => {
          const i = cookies.findIndex(c => c.name === name);
          if (i >= 0) cookies[i].value = value; else cookies.push({ name, value });
        }),
    }}
  );
  const { error } = await supabase.auth.signInWithPassword({
    email: 'an.nguyen@sun-asterisk.dev', password: 'dev-password-123!',
  });
  if (error) throw error;

  await context.addCookies(cookies.map(c => ({
    ...c, domain: 'localhost', path: '/', httpOnly: true, secure: false, sameSite: 'Lax',
  })));
  await context.storageState({ path: authFile });
});
```

## 5. Pitfalls

- **Cookie domain/sameSite on localhost**: use `domain: 'localhost'` (not `127.0.0.1`) matching whatever `baseURL` your `chromium` project actually navigates to — a mismatch between cookie domain and the page's origin means the cookie is silently never sent. `secure: false` required since local dev is plain HTTP; Supabase/gotrue cookies from `@supabase/ssr` default `sameSite: 'lax'`, which is fine for same-origin nav-driven tests.
- **Session expiry mid-run**: local gotrue default JWT `exp` is short (~1h) unless configured longer in `supabase/config.toml` (`[auth] jwt_expiry`). A long Playwright suite run risks the access_token expiring; either bump `jwt_expiry` in local `config.toml` for the test stack, or rely on middleware-driven refresh (see below) actually firing and rewriting storageState is NOT automatic — storageState is a point-in-time snapshot, stale after refresh unless you regenerate it.
- **Parallel workers sharing one storageState file**: safe for READ-mostly, shared-account tests (all workers share one authenticated session) but breaks the moment any test mutates account-scoped state that other parallel tests assert against (e.g., kudos-balance changes). Given 3 seed users exist, safer default: dedicate one seed user per worker or per test-file group via `test.use({ storageState: 'playwright/.auth/user-<n>.json' })`, generated from 3 parallel setup tests (`setup('auth an', ...)`, `setup('auth binh', ...)`, etc.) — matches the officially-documented per-worker-account pattern for state-mutating tests.
- **Server-side session refresh via middleware invalidates saved cookies**: if `middleware.ts` (per Next.js App Router auth pattern) calls `supabase.auth.getUser()` and that triggers a token refresh, gotrue rotates the refresh_token; the OLD refresh_token embedded in your saved `storageState` becomes invalid after first use ("refresh token reuse detected" family of errors). Practical mitigation: regenerate `storageState` fresh per full test run (setup project always re-runs, not cached across runs) rather than committing a long-lived static fixture file, and keep `jwt_expiry` generous enough locally that a refresh is unlikely to fire mid-suite.

## Unresolved

- Actual `sb-<ref>-auth-token` cookie name for THIS local stack unverified — `node_modules/@supabase/ssr` read blocked by `.claude/.skignore` sandbox (`node_modules` pattern). Run one real password login locally, inspect `context.cookies()`, confirm exact name/chunk count before hardcoding anything — though the recommended mechanic in §2/§4 sidesteps needing to know the name up front by round-tripping through `createServerClient`'s own `setAll`.
- Whether local gotrue accepts a caller-supplied `id` in `admin.createUser` — must be smoke-tested once against the running container; if rejected, seed FK remap is needed.
- Whether `page.tsx` will migrate to `getClaims()` — not confirmed; if it does, JWT-mint approach (Option 2) becomes strictly cheaper (no gotrue round trip needed at all, including for setup).
