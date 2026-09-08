# Phase T-RED Report — E2E RED Test Execution

**Date:** 2026-09-08 · **Test File:** `e2e/awards-information.spec.ts` · **Status:** RED (exit code 1)

## Summary

Wrote one durable screen-level E2E test covering the Award Information page spec. Test passed linting (0 errors) and ran to a **real non-zero exit (1)** with 9 failed assertions — all assertion-driven, none configuration/setup failures. Ready for Track A UI implementation.

## Test File Details

**Path:** `/Users/nguyen.danh.thanh/Work/aidd/e2e/awards-information.spec.ts`

**Lines:** 458 (10 test cases, covering all priority spec areas)

**Patterns Reused:**
- `/auth/v1/user` endpoint stub (from home.spec.ts) for authenticated sessions
- Typed window-override pattern (no `any` casts)
- Locator filters by text and role
- `test.fixme()` avoided (all tests are RED-valid, not broken infrastructure)

## Test Coverage (from phase spec priority list)

| ID | Priority Area | Test Case | Status |
|-----|---|---|---|
| ID-1 | Unauthenticated → /login redirect | `should redirect unauthenticated visitor to /login` | RED ✗ |
| ID-0 | Authenticated access (session guard) | Authenticated session stub via `/auth/v1/user` | RED ✗ |
| ID-3/4/5/6/8 | Hero, section title, 6-item nav, 6 cards, kudos | Multiple tests (see below) | RED ✗ |
| ID-6 | Top Talent & MVP exact text (quantity/prize) | `should render Top Talent card with exact quantity and prize text` | RED ✗ |
| ID-6 | MVP exact text | `should render MVP card with exact quantity and prize text` | RED ✗ |
| ID-9/ID-11 | Nav click → scroll + active state (2 items) | `should set active state when clicking Top Talent nav item and scroll to section` | RED ✗ |
| ID-9/ID-11 | Nav click → clear previous active | `should set active state when clicking MVP nav item and clear previous active` | RED ✗ |
| ID-12 | "Chi tiết" link → /sun-kudos navigation | `should navigate to /sun-kudos when Chi tiết link is clicked` | RED ✗ |

**Out of scope (per phase spec):**
- Hover-highlight visual (ID-10) — visual validation phase
- Scroll-spy auto-highlight (not specified) — not tested
- Error-page 404 (ID-14) — no custom error UI exists

## RED Evidence

**Command Run:**
```bash
npx playwright test e2e/awards-information.spec.ts
```

**Exit Code:** `1` (real, non-zero)

**Test Results:**
- Total: 10 tests
- Passed: 1
- Failed: 9

**Linting:**
```bash
npx eslint e2e/awards-information.spec.ts
```
Exit code: `0` (clean, zero warnings)

**First Failure Example (auth redirect missing):**
```
Error: expect(page).toHaveURL(expected) failed

Expected: "http://localhost:3000/login"
Received: "http://localhost:3000/awards-information"
Timeout:  5000ms

At /Users/nguyen.danh.thanh/Work/aidd/e2e/awards-information.spec.ts:10:24
```

**Second Failure Example (hero content missing):**
```
Error: expect(locator).toBeVisible() failed

Locator: locator('h1, h2').filter({ hasText: /ROOT FURTHER/i })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

At /Users/nguyen.danh.thanh/Work/aidd/e2e/awards-information.spec.ts:43:29
```

**Third Failure Example (nav missing):**
```
Error: expect(locator).toBeVisible() failed

Locator: locator('button, a, li, div').filter({ hasText: /^Top Talent$/i })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

At /Users/nguyen.danh.thanh/Work/aidd/e2e/awards-information.spec.ts:103:29
```

## Test Design Notes

1. **Unauthenticated test** runs without auth stub (stub added BEFORE navigation, reusing established pattern from home/login specs)
2. **Authenticated tests** run with `/auth/v1/user` endpoint returning a valid user session — matches the approach used on `/todo` and other guarded routes
3. **Content assertions** target exact spec text (e.g., "Số lượng giải thưởng: 10 Đơn vị", "7.000.000 VNĐ")
4. **Navigation behavior** tests click → scroll + active-state logic (checked via class, aria-selected, or aria-pressed attributes)
5. **Kudos reuse** targets the existing `KudosPromo` component's `data-testid='kudos-promo'` (no new fixture)

## Ready for Track A

| Key | Value |
|-----|-------|
| **redTestFiles** | `["e2e/awards-information.spec.ts"]` |
| **redCommand** | `npx playwright test e2e/awards-information.spec.ts` |
| **redExitCode** | `1` |
| **redFailure** | Multiple assertion failures (auth redirect, hero content, nav, card text, active states all missing in stub) |

**Next Step:** UI implementation agent (Track A) will code the page to GREEN, then tester will run visual validation.

---

## Unresolved Questions

None — all clarifications already resolved in `clarifications.md` session 2026-09-08.
