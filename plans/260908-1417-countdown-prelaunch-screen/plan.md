---
status: delivered
work_type: feature
spec_waived: true
testPolicy: e2e-red-first
momorph:
  fileKey: 9ypp4enmFmdK3YAFJLIu6C
  screens:
    - name: "Countdown - Prelaunch page"
      screenId: 8PJQswPZmU
blockedBy: []
blocks: []
---

# Plan: Countdown Prelaunch Screen ("/countdown") — SAA 2025

MoMorph screen: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/8PJQswPZmU
Clarifications: [clarifications.md](./clarifications.md)

## Summary

Build `/countdown`: a full-bleed background, locale-aware title, and a Days/Hours/Minutes
LED-style countdown (ticking every second, per this screen's own spec — stricter than the home
screen's ~30s hero countdown). More significantly, this plan adds a **site-wide prelaunch gate**:
when a new `PRELAUNCH_GATE_ENABLED` toggle is on, every other route redirects to `/countdown`,
fully public (no auth check), matching the spec's "navigation to other pages is locked/unlocked"
language.

The gate is a pure on/off toggle, deliberately NOT computed from `EVENT_DATETIME` — since
`.env.local` already has a future `EVENT_DATETIME`, a date-driven gate would immediately lock the
entire app (including in dev/test) the moment this ships. Default off; ops flips it on manually for
a real prelaunch period. See clarifications.md for the full reasoning, including a proactive fix for
the "env var frozen empty in the Docker-built Edge Runtime bundle" class of bug already hit twice
this project (`plans/reports/260908-docker-build-guard/`) — `PRELAUNCH_GATE_ENABLED` gets the same
Docker build-arg treatment as the Supabase vars from day one, since it's read inside `middleware.ts`.

## Test Policy

`e2e-red-first` — countdown auto-update and the (default-off) gate behavior are real state
transitions. The gate's ON-scenario routing decision is unit-tested (pure function), not
E2E-tested, per clarifications — see phase-t-red for the exact split.

## Phases

| Phase | Track | Depends on | Status | File |
|---|---|---|---|---|
| B0 — Setup (PRELAUNCH_GATE_ENABLED + Docker build-arg wiring) | B | — | completed | [phase-b0-infra-and-dockerfile.md](./phase-b0-infra-and-dockerfile.md) |
| B1 — Gate logic + middleware integration | B | B0 | completed | [phase-b1-gate-logic.md](./phase-b1-gate-logic.md) |
| T-RED — Tester writes RED E2E test | Tester | B0 | completed | [phase-t-red-e2e-red-test.md](./phase-t-red-e2e-red-test.md) |
| A1 — Countdown Prelaunch presentational UI | A | T-RED | completed | [phase-a1-countdown-screen.md](./phase-a1-countdown-screen.md) |
| I1 — Integration & GREEN (+ full regression pass) | — | A1, B1 | completed | [phase-i1-integration.md](./phase-i1-integration.md) |

B1, T-RED, and A1 can all proceed once B0 lands (B1 and A1/T-RED touch disjoint files — gate logic
vs. presentational UI — so they may run concurrently once T-RED hands off `redEvidence` to A1).

## Key Dependencies

- Reuses the `EVENT_DATETIME` env var (from the home-screen plan) as the countdown's target — no
  new API endpoint, resolving the spec's own open TODO in favor of the simpler existing mechanism.
- Broadens `middleware.ts`'s matcher from an explicit per-route list to a catch-all — a deliberate,
  repo-wide improvement (every prior plan had to remember to add its new route manually). Phase I1's
  full-regression-pass requirement exists specifically because of this change's blast radius.
- **Operational note for whoever runs this in production:** the gate and the countdown's target
  datetime are two independent controls (`PRELAUNCH_GATE_ENABLED` and `EVENT_DATETIME`) — both need
  to be set correctly together for a real prelaunch period, and the gate needs to be manually turned
  off once the event goes live.

## Delivered

**All phases completed.** Final scope (pure on/off toggle design):

> **NOTE:** This plan was subsequently refined in a follow-up session (2026-09-08). The gate's behavior was extended from a pure on/off toggle to tri-state semantics with date-driven logic. See [Follow-up: Date-driven gate (2026-09-08)](#follow-up-date-driven-gate-2026-09-08) below for details. This section documents the original pure-toggle design as delivered.

- **Screen:** `/countdown` renders full-bleed background, locale-aware title ("Sự kiện sẽ bắt đầu sau" VI / "Event starts in" EN), and 3 LED-digit countdown units (Days/Hours/Minutes) ticking every 1 second, sourced from the existing `EVENT_DATETIME` env var. No new API endpoint.
- **Gate:** `PRELAUNCH_GATE_ENABLED` toggle (default off) gates every route to `/countdown` when enabled, except `/countdown` itself, Next.js internals, and `/api/*`. Fully public, no auth check. Independent of `EVENT_DATETIME` to avoid locking dev/test/production immediately.
- **Infrastructure:** Docker build-arg wiring for `PRELAUNCH_GATE_ENABLED` (Edge Runtime safe), mirroring the existing Supabase env var pattern.
- **Test policy:** e2e-red-first. Real RED confirmed before implementation (`e2e/countdown.spec.ts` exit 1). Full GREEN after implementation plus full regression (4 e2e specs together: 22 passed, 16 documented skips, 0 failed; full jest suite: 89/89 passing).

### CRITICAL DISCOVERY — Out of Original Scope but Essential

**Middleware relocation bug fix (severity: critical, scope: repo-wide):** During integration testing, discovered that `middleware.ts` had lived at the repository root (since the project's first commit) instead of `src/middleware.ts` (required by this project's `src/app/` layout). This caused **silent non-execution in all environments** — the Supabase session-refresh middleware (from the completed login-screen plan) and the new prelaunch gate both depended on it but never actually ran. This was not part of the original plan scope but was a blocking discovery made during Phase I1 integration testing.

- **Fix:** Relocated the file from `./middleware.ts` to `./src/middleware.ts` (pure rename, zero logic change).
- **Verification:** Independent verification by both the orchestrator and the reviewer via:
  - Production build output showing `ƒ Proxy (Middleware)` line confirming middleware detection
  - Live gate-on/off tests in both `next dev` and full Docker build/run cycles
  - Full regression testing with all 4 e2e specs and full jest suite
- **Impact:** This fix is upstream of both this plan and the completed login-screen plan. The login-screen's session-refresh now actually executes as intended. The prelaunch gate works as specified. Future code paths that depend on middleware will no longer silently fail.

### Cross-cutting Bug Fix

**pad2() clamping fix:** Fixed a live bug in the pad2() formatter (day counts >=100 were truncated instead of capped, e.g., 114 days showed as "14" instead of "99"). This bug also existed in the pre-existing home-screen hero countdown (`src/components/home/countdown/countdown.tsx`) and was fixed there too as part of this delivery. Verified via grep (zero remaining `.slice(-2)` occurrences) and RED-first unit tests.

### Documentation

**Already completed during this session:** `docs/authentication.md` and `README.md` were updated to document:
- The middleware relocation from root to `src/middleware.ts`
- The catch-all matcher change and its repo-wide scope
- The new prelaunch gate and `PRELAUNCH_GATE_ENABLED` env var
- Docker build-arg wiring for the new toggle

A future doc-writer pass should NOT duplicate this work — these files are current as of this delivery.

### Test Evidence

- **Unit tests (B1):** 17 tests on `shouldGate()` and `checkPrelaunchGate()` — gate off/on scenarios, exempt paths, edge cases — all passing.
- **E2E tests:** 7 tests in `e2e/countdown.spec.ts` (1 RED before implementation, 7 GREEN after); 6 regression checks on existing routes (gate off default) all pass.
- **Full regression:** `npx playwright test` (all 4 specs) + `npx jest src` (full suite) — zero regressions.
- **Build/Docker:** `npm run build` succeeds with middleware detection; `npm run docker:up` (gate off) and `npm run docker:rebuild` (gate on) both verified working.

### Next Steps for Operations

Before using the gate in production:
1. Set `PRELAUNCH_GATE_ENABLED=true` in the appropriate environment (dev, staging, or production).
2. Confirm `EVENT_DATETIME` is also set to the intended event start time (independent control).
3. The gate will activate immediately; all routes except `/countdown`, `/_next/*`, `/favicon.ico`, and `/api/*` will redirect to `/countdown`.
4. Manually flip `PRELAUNCH_GATE_ENABLED` back to `false` (or unset it) once the event goes live to restore normal app access.

## Unresolved Questions

None — all four blocking decisions (gate scope, datetime source, access rule, gate control mechanism) resolved in [clarifications.md](./clarifications.md).

## Follow-up: Date-driven gate (2026-09-08)

### Request and Rationale

After initial delivery, user requested refinement to the gate's control model: instead of a pure on/off toggle
requiring manual ops intervention, the gate should activate automatically whenever `now < EVENT_DATETIME - 24h` —
allowing visitors to access the site during the final 24 hours before the event (a common UX pattern), while
remaining gated for longer lead-up periods.

Clarifying question resolved: keep `PRELAUNCH_GATE_ENABLED` as a manual override (not remove it), allowing three
distinct control modes without requiring code changes between environments.

### What Changed

**Tri-state semantics for `PRELAUNCH_GATE_ENABLED`:**

- `true`: Forces gate ON, ignoring EVENT_DATETIME. Manual override to lock the site immediately.
- `false`: Forces gate OFF, ignoring EVENT_DATETIME. Regression-safe default; matches the deployed `.env.local` value, ensuring all existing E2E tests continue to pass unchanged.
- `unset` (env var not defined): Falls through to date logic — gate ON while now < EVENT_DATETIME - 24h; gate OFF from 24h before the event onward (the "early-access window"). Safely defaults to OFF if EVENT_DATETIME is missing or unparseable.

**Implementation:**

- Gate logic rewritten in `src/lib/prelaunch/gate.ts` to evaluate the tri-state condition before any date comparison.
- `EVENT_DATETIME` now read in `middleware.ts` (Edge Runtime context) for the first time, requiring the same Docker build-arg wiring already in place for Supabase vars. Added to `Dockerfile` and `docker-compose.yml`.
- New test suite in `gate.test.ts` (32 tests, written RED-first before implementation) covering: all three tri-state branches, the 24h boundary, safe fallback on missing/invalid EVENT_DATETIME, and the strict `<` comparison.

**Regression Safety:**

- Full jest suite: 121/121 tests passing (32 new tri-state tests + 89 baseline tests).
- Full e2e suite: 22 passed, 16 documented skips, 0 failed (unchanged from baseline). Confirms that `.env.local`'s `PRELAUNCH_GATE_ENABLED=false` still forces gate off under the new tri-state logic, protecting all existing routes and tests.
- Verified across three real Docker production build/run cycles, testing each tri-state branch:
  1. `override=false` (deployed .env.local value): `/` returns 200, no gate redirect.
  2. `override=unset, EVENT_DATETIME +2 days`: `/` returns 307 to `/countdown` (date logic gates).
  3. `override=unset, EVENT_DATETIME +12 hours`: `/` returns 200 (24h-early-access window opens).

**Documentation:**

- `docs/authentication.md` and `README.md` updated to reflect tri-state design and the new date-driven behavior.

### Test Evidence and Reviewer Sign-off

- **RED-first:** All 32 new tri-state gate tests failed against the pre-change pure-toggle code, then passed after implementation.
- **Review verdict:** SEALED, score 9, 0 findings. Reviewer independently hand-traced all three tri-state branches and all 32 tests. Confirmed middleware build detection, confirmed all three Docker production cycles, confirmed zero regressions.
- **Sensitive area sign-off:** Auth-adjacent middleware change; human sign-off obtained and recorded.

### Operational Impact

Users may now configure the gate with three options instead of two:

1. **For immediate lockdown:** Set `PRELAUNCH_GATE_ENABLED=true` (manual override). Gate stays on regardless of EVENT_DATETIME.
2. **For normal/off state:** Set `PRELAUNCH_GATE_ENABLED=false` or leave unset alongside a past/missing EVENT_DATETIME. Gate stays off.
3. **For automatic date-driven gating (new):** Unset `PRELAUNCH_GATE_ENABLED` (don't define it) and set `EVENT_DATETIME` to the event start time. Gate activates automatically when now < (EVENT_DATETIME - 24h), allowing early-access 24h before the event.

No changes to `/countdown` route, countdown UI, or any other screens — the follow-up refines the gate's activation model only.
