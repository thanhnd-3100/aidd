# Phase T-RED — Tester: write the RED E2E test

**Track:** Tester (owns executable E2E only) · **Depends on:** B0 · **Blocks:** A1 · **Status:** COMPLETED ✓

## MoMorph refs
- Countdown Prelaunch: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/8PJQswPZmU
- Clarifications: plans/260908-1417-countdown-prelaunch-screen/clarifications.md
- testPolicy: e2e-red-first

## Goal
Before implementation, write one durable screen-level test at `e2e/countdown.spec.ts` from the downloaded test cases + clarifications, run to a real RED (exit 1 — `/countdown` doesn't exist yet).

## Scope (from downloaded test cases + clarifications — see this session's `download_test_cases` CSV)
- `/countdown` renders: full-bleed background image, title text (locale-aware: "Sự kiện sẽ bắt đầu sau" VI / "Event starts in" EN), 3 countdown units (DAYS, HOURS, MINUTES) each showing 2-digit zero-padded values with uppercase white labels.
- Regression check: with the gate off (the current, default `.env.local` state — `PRELAUNCH_GATE_ENABLED` unset/false), navigating to `/`, `/login`, `/todo`, `/awards-information`, `/sun-kudos` does NOT redirect to `/countdown`. This is the safe-default guarantee the clarifications decision depends on — it must be explicit and real, not assumed.

## Out of scope (per clarifications — do not invent)
- Testing the gate-ON scenario (all routes redirecting to `/countdown`) — that's covered by Phase B1's unit tests on the pure `shouldGate`/`checkPrelaunchGate` functions, not this E2E file. Flipping a real env var mid-suite would need a second Playwright server/config for one boolean; out of proportion for this feature.
- Real per-second countdown decrement over wall-clock time — flaky in CI; assert the 2-digit format/labels are present and correct-looking, not that a specific digit decrements after N seconds.
- Any access-control/auth test cases from the downloaded test-case CSV beyond "fully public, no redirect for anyone" — the design's own test cases were explicitly non-committal here; clarifications resolved it to "fully public," so there is nothing further to test on this axis.

## Record and pass forward (read-only to Track A)
`redTestFiles: [e2e/countdown.spec.ts]`, `redCommand: npx playwright test e2e/countdown.spec.ts`, `redExitCode`, `redFailure`.

## Completion Note

✓ `e2e/countdown.spec.ts` written with 7 tests (1 RED, 6 GREEN regression checks)
✓ Real RED confirmed: exit 1, "should render countdown page..." assertion fails because `/countdown` does not exist yet
✓ 6 regression tests all GREEN: gate-off safe default verified for `/`, `/login`, `/todo`, `/awards-information`, `/sun-kudos`
✓ Test file linted clean, no style or TypeScript errors
✓ Test patterns follow established conventions from existing e2e specs
✓ RED evidence documented in [tester-260908-1427-red-test.md](./reports/tester-260908-1427-red-test.md)
