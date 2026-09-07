# Authentication

Google OAuth via Supabase Auth, cookie-based sessions, no `[locale]` URL segment for i18n.
First auth integration in this codebase — this note exists so the next person doesn't have to
reverse-engineer why there are three Supabase client constructors.

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

## Environment variables

See the README's [Environment Variables](../README.md#environment-variables) section —
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `GOOGLE_CLIENT_ID`,
`GOOGLE_CLIENT_SECRET`. The Google client ID/secret are configured on the Supabase project's
`auth.external.google` provider, not read directly by this app.

## i18n note

Locale is cookie-only (`NEXT_LOCALE`), resolved in `src/i18n/request.ts` — there is no
`/[locale]/...` URL segment. Supported locales: `vi` (default), `en`. Messages live in
`src/messages/{vi,en}.json`.

## Known test gaps

`e2e/login.spec.ts` has three `test.fixme` cases (loading state, OAuth navigation, authenticated
redirect) that Playwright cannot exercise without faking Supabase's exact session-cookie format
or triggering a real top-level navigation that would kill the test page. The underlying logic
(`session-guard.ts`, `login-actions.ts`) is covered by Jest unit tests instead
(`src/lib/auth/*.test.ts`).
