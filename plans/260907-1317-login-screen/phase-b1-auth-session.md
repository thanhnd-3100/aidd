# Phase B1 — Track B: Auth session & OAuth wiring

**Track:** B (generic `implementer`, RED-first) · **Depends on:** B0, T-RED · **Runs concurrently with:** A1

## MoMorph refs
- Login: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/GzbNeVGJHz
- Clarifications: plans/260907-1317-login-screen/clarifications.md
- testPolicy: e2e-red-first

## Goal
Implement the real Google OAuth flow and session-guard logic behind the Login screen, independent of Track A's markup.

## Requirements (from specs/test cases)
- `signInWithOAuth({ provider: 'google', options: { redirectTo: '<origin>/auth/callback' } })` via `src/lib/supabase/client.ts`.
- Route handler `src/app/auth/callback/route.ts` exchanges the code for a session (`exchangeCodeForSession`), then redirects to `/todo`.
- On OAuth failure/cancel, redirect back to `/login?error=oauth_failed` and surface the spec's exact message: "Đăng nhập không thành công. Vui lòng thử lại."
- `src/app/login/page.tsx` (server component): checks session via `src/lib/supabase/server.ts`; if authenticated, `redirect('/todo')` before rendering anything.
- All Google accounts are permitted (no domain/allowlist restriction) — confirmed by spec.

## Out of scope
- Visual markup — this phase writes unit-testable logic/hooks (`useLoginAction` or equivalent) that phase-i1 wires into Track A's `LoginScreen`.
- `/todo` page content (B3).

## Tests (RED-first, generic `implementer` contract)
Unit tests for: session-guard redirect, OAuth error query-param → message mapping, callback route session exchange (mock Supabase client).

## Status: DONE

OAuth flow and session guard implemented: `src/lib/auth/login-actions.ts` (client action for `signInWithOAuth`), `src/app/auth/callback/route.ts` (server route for session exchange), `src/lib/auth/session-guard.ts` (redirects authenticated users from `/login` to `/todo`, unauthenticated from `/todo` to `/login`), `src/lib/auth/oauth-messages.ts` (locale-aware error message resolution). Middleware added for Supabase cookie refresh. All unit tests pass (13 tests covering session logic, OAuth errors, callback route). No visual markup — all logic is composable and tested in isolation.
