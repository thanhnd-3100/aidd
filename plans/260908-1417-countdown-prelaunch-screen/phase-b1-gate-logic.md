# Phase B1 — Track B: prelaunch gate logic + middleware integration

**Track:** B (generic `implementer`, RED-first) · **Depends on:** B0 · **Blocks:** I1 · **Status:** COMPLETED ✓

## MoMorph refs
- Countdown Prelaunch: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/8PJQswPZmU
- Clarifications: plans/260908-1417-countdown-prelaunch-screen/clarifications.md
- testPolicy: e2e-red-first

## Goal
Implement the site-wide gate as a small, pure, unit-testable routing decision, then wire it into `middleware.ts`, broadening its matcher to a catch-all.

## Requirements
1. `src/lib/prelaunch/gate.ts`: export `shouldGate(pathname: string, enabled: boolean): boolean` — returns `true` for any path except `/countdown` itself and Next.js internals (`/_next/*`, `/favicon.ico`, `/api/*`) when `enabled` is true; always `false` when `enabled` is false. Pure function, no I/O.
2. Also export `checkPrelaunchGate(request: NextRequest): NextResponse | null` — reads `process.env.PRELAUNCH_GATE_ENABLED === "true"`, calls `shouldGate(request.nextUrl.pathname, enabled)`, returns a redirect `NextResponse` to `/countdown` if gated, `null` otherwise.
3. `middleware.ts` (root): call `checkPrelaunchGate(request)` first; if it returns a response, return it immediately (skip session refresh). Otherwise fall through to the existing `updateSession(request)` call unchanged.
4. Broaden `middleware.ts`'s `config.matcher` to `["/((?!_next/static|_next/image|favicon.ico|api).*)"]`, replacing the current explicit per-route array. This is a deliberate improvement (see clarifications.md) — verify it doesn't change behavior for `/`, `/login`, `/todo`, `/awards-information`, `/sun-kudos`, `/admin-dashboard`, and additionally now covers `/auth/callback` and `/countdown` for session refresh (harmless — `updateSession` is a no-op refresh, not a redirect).

## Out of scope
- `/countdown` page content — Track A (A1) and integration (I1) own that.
- Any admin bypass or role-based exception to the gate — not requested, don't invent.

## Tests (RED-first, generic `implementer` contract)
Unit tests for `shouldGate`: gate off → false for every path tried; gate on → true for `/`, `/login`, `/todo`, `/awards-information`, `/sun-kudos`, `/admin-dashboard`, `/auth/callback`; false for `/countdown`, `/_next/static/...`, `/favicon.ico`, `/api/...` (even when the app has no `/api` routes today, exempt it defensively). Unit tests for `checkPrelaunchGate`: mocks `process.env.PRELAUNCH_GATE_ENABLED` and a `NextRequest`, asserts redirect response / null in each case.

## Completion Note

✓ `src/lib/prelaunch/gate.ts` implemented with `shouldGate()` and `checkPrelaunchGate()` pure functions
✓ 17 unit tests written and passing (gate logic coverage: on/off, all exempted paths, edge cases)
✓ `middleware.ts` broadened to catch-all matcher: `/((?!_next/static|_next/image|favicon.ico|api).*)/`
✓ Gate logic integrated into middleware: early return on gate redirect, fall through to session refresh if no gate
✓ Middleware fails open (logs and passes through) if updateSession throws
✓ Live verification: PRELAUNCH_GATE_ENABLED=true in next dev redirects / → /countdown; /countdown itself returns 200
✓ Zero regressions to existing route behavior when gate is off (default)
