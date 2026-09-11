# Authentication & Authorization

Google OAuth via Supabase Auth, cookie-based sessions, no `[locale]` URL segment for i18n.
First auth integration in this codebase — this note exists so the next person doesn't have to
reverse-engineer why there are three Supabase client constructors. It also covers the role-based
authorization added alongside the home screen (see [Roles and authorization](#roles-and-authorization)).

## Flow

1. `/login` (`src/app/login/page.tsx`) — server component. Calls
   `redirectIfAuthenticated()` (`src/lib/auth/session-guard.ts`) before rendering, so a signed-in
   visitor never sees the guest page. Reads `?error=` from the callback route and maps it to a
   message via `src/lib/auth/oauth-messages.ts`.
2. User clicks "Login with Google" → `signInWithGoogle()` (`src/lib/auth/login-actions.ts`) calls
   `supabase.auth.signInWithOAuth({ provider: "google", redirectTo: "<origin>/auth/callback" })`
   using the browser client (`src/lib/supabase/client.ts`).
3. Google redirects to `/auth/callback` (`src/app/auth/callback/route.ts`), which exchanges the
   `code` query param for a session via `supabase.auth.exchangeCodeForSession(code)` using the
   server client (`src/lib/supabase/server.ts`). Success → redirect to `/todo`. Missing code or
   exchange error → redirect to `/login?error=oauth_failed`.
4. `/todo` (`src/app/todo/page.tsx`) is a stub landing page — it only calls
   `redirectIfUnauthenticated()` and renders a placeholder. The real feature isn't built yet.
5. `/awards-information` (`src/app/awards-information/page.tsx`) guards the route the same way
   `/todo` does — `await redirectIfUnauthenticated("/login")` before rendering — but renders real
   content, the static `AwardInformationScreen` composition. It was previously a public stub; it is
   now auth-gated. See [Known test gaps](#known-test-gaps) for how its E2E coverage is compensated.
6. `/sun-kudos` (`src/app/sun-kudos/page.tsx`) stays **public** — no `redirectIfUnauthenticated()`
   call — but gates its two write actions ("Ghi nhận" and the like button) client-side. See
   [Action-level gating](#action-level-gating-client-side-redirect) below for how this differs from
   the page-level pattern above.

## Three Supabase clients — why each exists

| File | Used from | Why it's separate |
|---|---|---|
| `src/lib/supabase/client.ts` | Client Components (`createBrowserClient`) | Runs in the browser; used to kick off `signInWithOAuth`. |
| `src/lib/supabase/server.ts` | Server Components, Server Actions, Route Handlers (`createServerClient`) | Reads/writes cookies via `next/headers`. Cookie writes are wrapped in try/catch because `cookies().set()` throws when called during a Server Component render (not a Server Action/Route Handler) — middleware refreshing the session makes that a safe no-op. |
| `src/lib/supabase/middleware.ts` | `src/middleware.ts` (`updateSession`) | Rotates the access/refresh token pair when the access token has expired, and relays rotated cookies onto both the incoming request and the outgoing response. Without this, expired access tokens silently log users out because nothing else in the app refreshes the session. |

### `middleware.ts` location and matcher

`middleware.ts` lives at **`src/middleware.ts`** (colocated with `src/app/`), not the repo root.
Its `config.matcher` is a catch-all — `/((?!_next/static|_next/image|favicon.ico|api).*)` — so it
runs on every route except Next.js internals and API routes. This replaced an earlier explicit
per-route array; the catch-all removes the recurring chore of remembering to add each new route to
the list, and (see below) is what makes the site-wide prelaunch gate actually cover every route,
including ones added later.

**Historical note:** for this project's `src/app/` layout, Next.js only picks up middleware from
`src/middleware.ts` (or root `middleware.ts` when there is no `src/` directory) — never from a root
`middleware.ts` sitting alongside a `src/` tree. The file was at the repo root from the very first
commit, so Next.js silently never loaded it, in any environment, until it was moved. Confirmed via
`npm run build`: the "ƒ Proxy (Middleware)" build-output line only appears once the file is under
`src/`. Practically, this means `updateSession()`'s session-refresh logic never actually ran before
this fix — if session-refresh behavior looks "new," it isn't; the code predates this fix, only its
execution doesn't.

### Fail-open on `updateSession` failure

Because the matcher above runs on nearly every route, `src/middleware.ts` wraps the
`updateSession()` call in a try/catch: if it throws (e.g. missing/misconfigured Supabase env
vars), the middleware logs the error via `console.error` and returns `NextResponse.next()`
instead of letting the exception 500 the entire site. This only skips the token-refresh step for
that one request — it does not bypass authorization. `redirectIfAuthenticated()` /
`redirectIfUnauthenticated()` (see [Session guard](#session-guard)) call
`supabase.auth.getUser()` independently downstream, so a route still enforces its own guard; the
practical effect of a fail-open request is that an expired access token isn't rotated in time,
which reads as "logged out" rather than "logged in with no check."

### Prelaunch gate

`src/middleware.ts` also runs `checkPrelaunchGate()` (`src/lib/prelaunch/gate.ts`) before
`updateSession()`. When active, every route redirects to `/countdown`
(`src/app/countdown/page.tsx`, rendering the presentational `CountdownScreen` from
`src/components/countdown/countdown-screen.tsx`) except `/countdown` itself and Next.js internals
(`_next/*`, `favicon.ico`, `/api/*`).

`PRELAUNCH_GATE_ENABLED` is **tri-state**, resolved by `parseGateOverride()`:

| Value | Behavior |
|---|---|
| `"true"` | Gate forced **on** for every request, regardless of date. |
| `"false"` | Gate forced **off** for every request, regardless of date. This is the current `.env.local` value and the safe default. |
| unset / anything else | **Date-driven**: gate is on while `now < (EVENT_DATETIME - 1h)`, and turns off starting 1 hour before the event — the app opens to guests one hour early. |

In the date-driven case, a missing or invalid `EVENT_DATETIME` (`isBeforeLaunchWindow()` fails to
parse it) safely resolves to gate-**off**, never gate-on — bad config never locks guests out.

This tri-state design replaced an earlier pure on/off toggle that never read `EVENT_DATETIME` at
all; the date-driven branch now needs middleware (Edge Runtime) to read `EVENT_DATETIME` directly,
which is why it must be wired as a Docker build arg the same way as the Supabase vars (see the
[Docker section in the README](../README.md#docker)) — the same class of "env var frozen into the
Edge Runtime build" issue applies to it now too. The gate also applies uniformly — no admin bypass.
Full reasoning: see `plans/260908-1417-countdown-prelaunch-screen/clarifications.md`.

The gate is public — no auth check — since a guest can't be asked to log in to an app that isn't
open yet. Its routing decision is a pure function, `shouldGate(pathname, gateOverride,
isBeforeLaunchWindow)`, unit-tested directly rather than through E2E (flipping real env vars
mid-suite would need a second Playwright server per case).

## Session guard

`src/lib/auth/session-guard.ts` exposes `redirectIfAuthenticated()` and
`redirectIfUnauthenticated()`. Both call `supabase.auth.getUser()` server-side and treat any error
as "not logged in" — callers never distinguish "no session" from "check failed".

### Action-level gating (client-side redirect)

`/sun-kudos` introduces a second gating shape, distinct from the page-level `session-guard.ts`
pattern above: the **page** stays public, and only specific **actions** on it require a session.

`src/app/sun-kudos/page.tsx` reads the current user id server-side (via
`supabase.auth.getUser()`) without redirecting — any lookup failure (missing env vars, network
error, no session) resolves to `null`, i.e. "unauthenticated," never a thrown error, since the page
must render either way. That id is passed down as a plain prop to the client component
`src/app/sun-kudos/sun-kudos-client.tsx`, which wraps its two write actions ("Ghi nhận" and the
heart/like button) in a local `requireAuth(action)` helper: `null` user id →
`router.push("/login")` via `next/navigation`; otherwise the action runs. No middleware or
server-side redirect is involved — the gate is a client-side conditional on a value already
resolved server-side.

Use `session-guard.ts` when the whole route requires a session (`/todo`, `/awards-information`).
Use this pattern when the route itself must stay browsable by anyone and only specific
interactions are privileged (`/sun-kudos`'s board is public; only writing or liking is not).

## Roles and authorization

`src/lib/auth/get-user-role.ts` exports `UserRole = "user" | "admin"` and `getUserRole(user)`,
which reads `role` off the Supabase user's **`app_metadata`** and defaults to `"user"` when the
field is absent or holds an unrecognized value. There is no dedicated roles table yet —
`auth.users.app_metadata` is sufficient for this stage.

**Read `app_metadata`, never `user_metadata`.** This was a deliberate security fix in the home
screen delivery, not a style choice — `user_metadata` can be rewritten by the signed-in user
themselves from the browser via `supabase.auth.updateUser()`, so sourcing a role from it would let
any user grant themselves `"admin"`. `app_metadata` can only be written through the privileged
service-role/Admin API, which is what actually prevents client-side self-promotion. **If you ever
see a change that moves `role` back onto `user_metadata`, that is a privilege-escalation
regression — reject it.**

`getUserRole()` takes a nullable user (or `null` for "no session") and always returns a value —
callers never see `undefined`. `getHomepageViewData()`
(`src/lib/home/get-homepage-view-data.ts`) uses this to expose `role` to the homepage header,
defaulting unauthenticated visitors to `"user"`, the least-privileged value.

### Admin gate

`/admin-dashboard` (`src/app/admin-dashboard/page.tsx`) is the one route that currently enforces
the role: it loads the Supabase user server-side, computes `getUserRole(user)`, and
`redirect("/")` when the result isn't `"admin"` — unauthenticated visitors and non-admin users are
both bounced the same way. There is no dedicated "forbidden" page; the redirect target is the
homepage.

### Stub routes

One route still exists as a placeholder reached from the homepage, with no real content yet (see
`plans/260907-1545-home-screen/clarifications.md` for scope decisions). `/awards-information` and
`/sun-kudos` were also stubs in that original set but have since been built out with real content —
see [Flow](#flow) steps 5–6 and [Known test gaps](#known-test-gaps).

| Route | File | Notes |
|---|---|---|
| `/admin-dashboard` | `src/app/admin-dashboard/page.tsx` | "Coming soon" placeholder behind the admin gate described above. |

`middleware.ts`'s catch-all matcher (see [middleware location and matcher](#middlewarets-location-and-matcher))
covers `/`, `/awards-information`, `/sun-kudos`, and `/admin-dashboard` along with every other
route, so session refresh runs on all of them.

## Environment variables

See the README's [Environment Variables](../README.md#environment-variables) section —
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `GOOGLE_CLIENT_ID`,
`GOOGLE_CLIENT_SECRET`, `EVENT_DATETIME`, `PRELAUNCH_GATE_ENABLED`. The Google client ID/secret are
configured on the Supabase project's `auth.external.google` provider, not read directly by this
app. `EVENT_DATETIME` is unrelated to auth — it's the homepage countdown target, read in
`src/lib/home/get-homepage-view-data.ts`. `PRELAUNCH_GATE_ENABLED` is also unrelated to auth — see
[Prelaunch gate](#prelaunch-gate) above.

## i18n note

Locale is cookie-only (`NEXT_LOCALE`), resolved in `src/i18n/request.ts` — there is no
`/[locale]/...` URL segment. Supported locales: `vi` (default), `en`. Messages live in
`src/messages/{vi,en}.json`.

The home screen splits its messages into section partials —
`src/messages/home/{chrome,hero,content,promo}.json`, each shaped `{ vi: {...}, en: {...} }` —
so independent sections can own disjoint files. `src/i18n/merge-messages.ts` deep-merges these
partials plus the base `{locale}.json` file at request time (`src/i18n/request.ts`), nesting all
four under one `home` key. A leaf-key collision between two sources logs a `console.warn` instead
of throwing, since the partials are currently disjoint by design; a future partial that
accidentally reuses a sibling's key will surface as a warning, not a build failure.

## Known test gaps

`e2e/login.spec.ts` has three `test.fixme` cases (loading state, OAuth navigation, authenticated
redirect) that Playwright cannot exercise without faking Supabase's exact session-cookie format
or triggering a real top-level navigation that would kill the test page. The underlying logic
(`session-guard.ts`, `login-actions.ts`) is covered by Jest unit tests instead
(`src/lib/auth/*.test.ts`).

`e2e/awards-information.spec.ts` has the same root cause but a larger blast radius: because the
*entire* route sits behind `redirectIfUnauthenticated()`, 9 of its 10 tests are `test.fixme`
(only the unauthenticated-redirect case runs for real) — Playwright's `page.route()` stubs the
browser fetch layer, not the server-side `supabase.auth.getUser()` call Next.js makes during SSR,
so an authenticated-visitor scenario can't be faked at all, not even partially. The compensating
coverage is RTL unit tests against the presentational component itself,
`src/components/awards-information/award-information-screen.test.tsx`, which render
`AwardInformationScreen` directly and assert the same content/interaction behavior (hero copy,
6-category nav order, award card text, active-state switching) without going through the auth
redirect. This is the same fixme-plus-unit-test shape as `/login`, just with the ratio flipped
because the auth gate covers 100% of the page instead of a few interactive cases — a pattern worth
reusing verbatim for any future screen that puts real content fully behind
`redirectIfUnauthenticated()`.

`e2e/sun-kudos.spec.ts` was split into `e2e/sun-kudos-public.spec.ts` (unauthenticated) and
`e2e/sun-kudos-authenticated.spec.ts`, because `/login` calls `redirectIfAuthenticated("/todo")`
— an authenticated Playwright context can never load `/login`, so the two states need separate
specs entirely, not just separate `test.describe` blocks in one file.

`sun-kudos-public.spec.ts` runs its 6 cases for real, including the two unauthenticated-redirect
assertions ("Ghi nhận" and heart click → `/login`), since that path never calls `getUser()`
client-side. `sun-kudos-authenticated.spec.ts` now has a real authenticated `storageState`
available (see [`e2e/auth.setup.ts`](#e2eauthsetupts-real-session-storagestate) below), so one
case — clicking "Ghi nhận" while authenticated opens the composer dialog — runs for real as the
smoke test proving the session mechanic works end to end. The remaining 6 `test.fixme` cases
(form validation/hashtag limit, submit success/error, like/unlike toggling, self-like button
disabled) still stub `getUser()` via `page.route()` rather than using the new storageState, so
they keep failing for the original reason: `page.route()` intercepts browser fetch, not the
server-side `supabase.auth.getUser()` call Next.js makes during SSR. Converting them to use the
real session is unstarted work, not a limitation of the mechanism itself anymore. Compensating
coverage for the untouched fixme cases lives in `src/app/sun-kudos/sun-kudos-client.test.tsx`
(composer open/redirect, like toggle, submit success/error, load more) plus
`src/components/kudos/composer/kudos-composer.test.tsx` and
`src/components/kudos/board/kudos-board.test.tsx` for the presentational validation/interaction
details.

### `e2e/auth.setup.ts` — real session storageState

Added alongside the split above: a Playwright `setup` project
(`playwright.config.ts`) runs `e2e/auth.setup.ts` first, which signs in seed user "An" (first
entry of `scripts/dev-seed-user-list.ts`'s `DEV_USERS`) against the actual Supabase auth backend
and writes two gitignored files under `playwright/.auth/`: `an.json` (a real `storageState` —
cookies only, no literal cookie name hardcoded, since `@supabase/ssr`'s own `setAll` decides
that) and `an-token.json` (the raw access token, for tests that call PostgREST directly rather
than through cookies). The `chromium-auth` project loads `an.json` as its `storageState` and runs
both `sun-kudos-authenticated.spec.ts` and `kudos-rls.spec.ts` (the latter proves the RLS rules —
including the self-like block above — using the raw token from `an-token.json`, not the cookie
jar). This is the first time this project has had a way around the "`page.route()` can't stub
server-side auth" limitation described throughout this section. `chromium-public` runs with no
stored state, for the unauthenticated specs. Both projects run against
`webServer.env.PRELAUNCH_GATE_ENABLED=false`, so the prelaunch gate never intercepts either
project's requests — `auth.setup.ts` also independently asserts the gate is off before signing in,
since a stale dev server with `reuseExistingServer` could otherwise leave every "authenticated"
test actually running against `/countdown`.

Getting a real session for `auth.setup.ts` to sign in with requires the dev user to actually be
loginable. `supabase/seeds/dev/001_kudos_dev_seed.sql`'s raw `auth.users` inserts alone are not
enough — the `npm run db:seed:users` script (`scripts/seed-auth-users.ts`) creates the three dev
identities through the Supabase Admin API instead, and must run *before* the SQL seed
(`npm run db:reset:dev` chains them in that order) because the SQL's
`on conflict (id) do nothing` silently no-ops if the admin-created rows already exist.
