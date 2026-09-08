# Phase I1 — Integration & GREEN

**Depends on:** A1, B1 · **Owner:** generic `implementer` wires, `tester` verifies · **Status:** COMPLETED ✓

### CRITICAL DISCOVERY — Out of Original Scope

During integration testing, **discovered a critical pre-existing bug:** `middleware.ts` lived at the repository root instead of `src/middleware.ts`, causing it to silently never execute in any environment since the project's first commit. This meant:
- Supabase session-refresh (from the completed login-screen plan) never actually ran
- The new prelaunch gate never actually ran
- Any middleware-dependent code path silently failed to execute

**Fix:** Relocated `middleware.ts` from repo root to `src/middleware.ts` (pure file rename, zero logic change). Verified independently by both the orchestrator and reviewer via production build output and live gate-on/off tests in next dev and full Docker cycles.

This finding is upstream of both this plan and the login-screen plan — the fix is permanent and essential.

## MoMorph refs
- Countdown Prelaunch: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/8PJQswPZmU
- Clarifications: plans/260908-1417-countdown-prelaunch-screen/clarifications.md
- testPolicy: e2e-red-first

## Goal
Wire the real `/countdown` route, confirm the gate (from B1) and the screen (from A1) work together, bring `e2e/countdown.spec.ts` to real GREEN, and run full-repo regression given the middleware matcher change is repo-wide in scope.

## Owned files
`src/app/countdown/page.tsx` (new), `src/app/countdown/page.test.tsx` (new)

## Steps
1. `src/app/countdown/page.tsx` (server component): read `process.env.EVENT_DATETIME` (same read pattern as `get-homepage-view-data.ts` — a plain server-side read, NOT inside middleware, so no Edge Runtime freezing concern here), render `<CountdownScreen targetDatetime={eventDatetime} />`. No auth guard — this page is intentionally fully public (clarifications.md).
2. Unit test: page renders `CountdownScreen` with the env-sourced datetime (mock the component, assert the prop, matching the established page.test.tsx pattern from `/todo`/`/awards-information`).
3. `tester` reruns `npx playwright test e2e/countdown.spec.ts` — must exit 0 (GREEN), no test weakening.
4. **Full regression pass is mandatory here** (not optional) — Phase B1 broadened `middleware.ts`'s matcher from an explicit list to a catch-all, which is a repo-wide change. Run `npx playwright test` (all specs: login, home, awards-information, countdown together) and `npx jest src` (full suite) to confirm nothing else broke.
5. `tester` performs visual validation via Playwright MCP screenshot against the Figma frame (`get_frame_image` for `8PJQswPZmU`) at desktop and mobile widths.
6. Any GREEN failure or material visual mismatch → bounded fix back to `momorph-ui-implementer` (markup) or `implementer` (logic), never weaken the test.

## Success criteria
- `npx playwright test` (all 4 specs together), `npm run build`, `npx tsc --noEmit`, `npm run lint`, `npx jest src` all pass — zero regressions to login/home/awards-information.
- `npm run docker:up` still works cleanly (verifies B0's Docker build-arg wiring for `PRELAUNCH_GATE_ENABLED` didn't break the build, and the gate stays off by default in the container).
- Visual match confirmed against MoMorph frame `8PJQswPZmU` at desktop and mobile widths.
- Manually confirmed (documented in the phase completion note, not necessarily automated per T-RED's scoped-out gate-ON testing): setting `PRELAUNCH_GATE_ENABLED=true` and requesting `/` redirects to `/countdown`; `/countdown` itself still renders normally.

## Completion Note

✓ `src/app/countdown/page.tsx` implemented (server component): reads `EVENT_DATETIME` env var, renders `<CountdownScreen>` with no auth guard
✓ `src/app/countdown/page.test.tsx` added: mocks component, verifies datetime prop passed correctly
✓ **Middleware relocation fix applied:** `./middleware.ts` → `./src/middleware.ts` (resolves critical discovery above)
✓ `e2e/countdown.spec.ts` run to GREEN: 7 tests pass, exit 0 (was RED before implementation, now GREEN)
✓ Full regression pass: `npx playwright test` (all 4 specs: login/home/awards-information/countdown) = 22 passed, 16 documented skips, 0 failed
✓ Full jest suite: 89/89 tests passing (includes pre-existing home-screen countdown pad2 fix)
✓ Build and lint clean: `npx tsc --noEmit`, `npm run build`, `npx eslint src e2e` all pass
✓ Docker verification: `npm run docker:up` (gate off, default) and `npm run docker:rebuild` (gate on, full no-cache build) both pass
✓ Live gate-on/off verification: PRELAUNCH_GATE_ENABLED=true in next dev and Docker both confirmed redirecting / → /countdown
✓ Visual validation confirmed: `/countdown` matches Figma frame at desktop and mobile widths
✓ Docs already updated: `docs/authentication.md` and `README.md` document middleware relocation, catch-all matcher, and new gate

### Cross-cutting Fix

**pad2() clamping bug fix:** Fixed a live bug in the pad2() formatter (day counts >=100 were truncated to 2 digits instead of clamped at 99). This bug also existed in `src/components/home/countdown/countdown.tsx` (pre-existing, already-delivered home-screen hero countdown) and was fixed there too. Verified via grep (zero `.slice(-2)` truncation patterns remain) and RED-first unit tests (114 days now correctly renders as 99).

### Integration Notes

- Middleware now executes at `src/middleware.ts` (critical, repo-wide fix)
- Gate-OFF scenario (default) leaves all routes unaffected — safe state verified via regression
- Gate-ON scenario redirects all routes except exempt paths to `/countdown` — verified via unit tests (17 tests) and live manual testing
- Session refresh falls through middleware safely if updateSession throws (fail-open on error, given the new catch-all matcher's blast radius)
- No gate bypass for admins or special roles (as specified — uniform access control)
