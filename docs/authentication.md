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

## Three Supabase clients — why each exists

| File | Used from | Why it's separate |
|---|---|---|
| `src/lib/supabase/client.ts` | Client Components (`createBrowserClient`) | Runs in the browser; used to kick off `signInWithOAuth`. |
| `src/lib/supabase/server.ts` | Server Components, Server Actions, Route Handlers (`createServerClient`) | Reads/writes cookies via `next/headers`. Cookie writes are wrapped in try/catch because `cookies().set()` throws when called during a Server Component render (not a Server Action/Route Handler) — middleware refreshing the session makes that a safe no-op. |
| `src/lib/supabase/middleware.ts` | `middleware.ts` at the repo root (`updateSession`) | Rotates the access/refresh token pair when the access token has expired, and relays rotated cookies onto both the incoming request and the outgoing response. Without this, expired access tokens silently log users out because nothing else in the app refreshes the session. |

`middleware.ts` matches only `/login` and `/todo` (see its `config.matcher`) — it does not run on
every request.

## Session guard

`src/lib/auth/session-guard.ts` exposes `redirectIfAuthenticated()` and
`redirectIfUnauthenticated()`. Both call `supabase.auth.getUser()` server-side and treat any error
as "not logged in" — callers never distinguish "no session" from "check failed".

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

Three routes exist as placeholders reached from the homepage, with no real content yet (see
`plans/260907-1545-home-screen/clarifications.md` for scope decisions):

| Route | File | Notes |
|---|---|---|
| `/awards-information` | `src/app/awards-information/page.tsx` | Renders one `id`-anchored `<section>` per award category so hash links from the homepage (e.g. `/awards-information#mvp`) resolve; no role gate. |
| `/sun-kudos` | `src/app/sun-kudos/page.tsx` | "Coming soon" placeholder; no role gate. |
| `/admin-dashboard` | `src/app/admin-dashboard/page.tsx` | "Coming soon" placeholder behind the admin gate described above. |

`middleware.ts`'s `config.matcher` now also lists `/`, `/awards-information`, `/sun-kudos`, and
`/admin-dashboard` alongside `/login` and `/todo`, so session refresh runs on all of them.

## Environment variables

See the README's [Environment Variables](../README.md#environment-variables) section —
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `GOOGLE_CLIENT_ID`,
`GOOGLE_CLIENT_SECRET`, `EVENT_DATETIME`. The Google client ID/secret are configured on the
Supabase project's `auth.external.google` provider, not read directly by this app.
`EVENT_DATETIME` is unrelated to auth — it's the homepage countdown target, read in
`src/lib/home/get-homepage-view-data.ts`.

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
