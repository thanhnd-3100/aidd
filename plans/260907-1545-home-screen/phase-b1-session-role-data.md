# Phase B1 — Track B: session/role data layer for the homepage

**Track:** B (generic `implementer`, RED-first) · **Depends on:** B0, T-RED · **Runs concurrently with:** A1-A4 · **Status:** ✅ completed

## MoMorph refs
- Homepage: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/i87tDx10uM
- Clarifications: plans/260907-1545-home-screen/clarifications.md
- testPolicy: e2e-red-first

## Goal
Provide the data-fetching logic the homepage needs, independent of Track A's markup: current auth/role state for the Header, and the event countdown datetime.

## Requirements
- `src/lib/home/get-homepage-view-data.ts` (server-only): returns `{ isAuthenticated: boolean; role: "user" | "admin"; eventDatetime: string }`. Reuses the existing Supabase server client (`src/lib/supabase/server.ts`) to check the session (no redirect — home is public per ID-0/ID-1, just varies what renders) and `src/lib/auth/get-user-role.ts` (from B0) for the role. Reads `process.env.EVENT_DATETIME` (falls back to a documented default if unset, never throws).
- Unit tests: unauthenticated → `{ isAuthenticated: false, role: "user" }`; authenticated regular user → `role: "user"`; authenticated admin (mocked `user_metadata.role: "admin"`) → `role: "admin"`; missing/invalid `EVENT_DATETIME` → documented fallback, no crash.

## Out of scope
- Any UI/markup — Track A owns that. This phase produces one importable function.
- `src/app/page.tsx` itself — that's the integration phase (I1), which calls this function and passes its result into the composed `HomeScreen`.

## Test policy
`e2e-red-first`, generic `implementer`'s normal RED-first contract (own unit tests, not the E2E file).

## Completion Note
`get-homepage-view-data.ts` (server-only) returns `{ isAuthenticated, role, eventDatetime }` for the homepage. Uses existing Supabase server client for session check and `get-user-role.ts` for role lookup (reads from `app_metadata`, not `user_metadata`). Unit tests cover authenticated/unauthenticated, user/admin roles, missing/invalid datetime. All checks pass: tsc, jest, build. No browser-level scope added.
