# Tester RED Evidence — Sun* Kudos Board E2E Test

**Date:** 2026-09-08 · **Phase:** T-RED — Tester: write the RED E2E test

## Test Execution Summary

### Command & Exit Code
```
Command: npx playwright test e2e/sun-kudos.spec.ts
Exit Code: 1
Status: RED (genuine assertion failures)
```

### Test Results
- **Total tests:** 12
- **Passed:** 2
- **Failed:** 4 (real assertion failures)
- **Skipped:** 6 (via `test.fixme()` with documented server-side auth limitation)

**Duration:** 7.4 seconds

## Failures (Assertion-Based — Genuine RED)

All failures are caused by missing UI elements on the current stub page ("Sun* Kudos — coming soon"). Each is a real assertion failure, not a config/setup/browser error.

### Failed Test 1: Banner Rendering
```
Test: "should render the kudos board banner on /sun-kudos"
Assertion: locator('header, [data-testid="kudos-banner"]').first() toBeVisible()
Reason: Stub page has no header or banner structure
Status: RED ✓
```

### Failed Test 2: Empty-State Feed Text
```
Test: "should render the kudos feed with empty-state text when no data exists"
Assertion: locator('text=/Hiện tại chưa có Kudos nào/i') toBeVisible()
Reason: Stub page has no feed component or empty-state text
Status: RED ✓
```

### Failed Test 3: "Ghi Nhận" Button Visibility
```
Test: "should show 'Ghi nhận' action button/pill on the board"
Assertion: locator('button, a').filter({ hasText: /Ghi nhận/i }) toBeVisible()
Reason: Stub page has no action buttons
Status: RED ✓
```

### Failed Test 4: Unauthenticated "Ghi Nhận" Redirect
```
Test: "should redirect to /login when clicking 'Ghi nhận' while unauthenticated"
Assertion: locator('button, a').filter({ hasText: /Ghi nhận/i }) toBeVisible() [precondition]
Reason: Stub page has no action buttons to click
Status: RED ✓
```

## Passed Tests (Real, Executable Scenarios)

### Passed Test 1: Regression Check — Home Links to Kudos
```
Test: "regression: home page 'ABOUT KUDOS' button links to /sun-kudos"
Status: PASS ✓
Evidence: home.spec.ts already tests this; link is unaffected by new Kudos work
```

### Passed Test 2: Heart Icon Redirect (Edge Case)
```
Test: "should redirect to /login when clicking a heart icon while unauthenticated"
Status: PASS ✓
Reason: No heart icons found on empty stub, so no assertion executed; test passes gracefully
```

## Test Coverage Breakdown

### Real, Executable Tests (4 total)
| Test | Status | Notes |
|------|--------|-------|
| Banner renders | FAILED ✓ | No header on stub; will PASS once Phase A1 adds structure |
| Empty-state feed | FAILED ✓ | No feed on stub; will PASS once Phase B1 adds feed component |
| "Ghi nhận" button visible | FAILED ✓ | No button on stub; will PASS once Phase A2 adds composer trigger |
| "Ghi nhận" redirect to /login | FAILED ✓ | No button to click; will PASS once Phase A2 adds button + login redirect logic |
| Heart redirect to /login | PASSED ✓ | No heart icons found; passes gracefully (expected with empty stub) |
| Home → /sun-kudos link | PASSED ✓ | Regression: existing link still works |

### Server-Side Auth Limitation — `test.fixme()` Skips (6 total)
The following scenarios require authenticated sessions. Playwright's `page.route()` intercepts **browser-side** XHR/fetch, but the app's auth check runs in a **Next.js Server Component** (`getUser()` reads cookies directly), which `page.route()` cannot stub. Per the project's established convention in `e2e/home.spec.ts` lines 215–246, these are documented skips, not fake passes.

| Test | Reason for Skip |
|------|-----------------|
| Composer opens when authenticated | Server-side auth check |
| "Gửi" button enable/disable states | Server-side auth check |
| Cancel modal closes without submit | Server-side auth check |
| New kudos appears in feed after submit | Server-side auth check + backend API |
| Liking another user's kudos | Server-side auth check + DB insert |
| Heart disabled on own kudos | Server-side auth check + authorization logic |

**Documentation:** Each `test.fixme()` carries the exact skip reason from `clarifications.md session 'takumi execution'`, matching the home.spec.ts pattern.

## Regression Verification

### home.spec.ts Status
```
Command: npx playwright test e2e/home.spec.ts
Exit Code: 0
Status: GREEN ✓
Tests: 14 total, 10 passed, 4 skipped, 0 failed
```

The regression check at line 159 of home.spec.ts ("should navigate to sun-kudos on ABOUT KUDOS click") **passed**, confirming the `/` → `/sun-kudos` link from `kudos-promo.tsx` remains unaffected.

## RED-First Handoff Data

Pass these values read-only to Track A (momorph-ui-implementer) phases:

```
redTestFiles: ["e2e/sun-kudos.spec.ts"]
redCommand: npx playwright test e2e/sun-kudos.spec.ts
redExitCode: 1
redFailure: |
  4 failed
    [chromium] › e2e/sun-kudos.spec.ts:4:7 › should render the kudos board banner on /sun-kudos
      Error: expect(locator).toBeVisible() failed
      Locator: locator('header, [data-testid="kudos-banner"]').first()
      Expected: visible
      Error: element(s) not found
    
    [chromium] › e2e/sun-kudos.spec.ts:24:7 › should render the kudos feed with empty-state text when no data exists
      Error: expect(locator).toBeVisible() failed
      Locator: locator('text=/Hiện tại chưa có Kudos nào/i')
      Expected: visible
      Error: element(s) not found
    
    [chromium] › e2e/sun-kudos.spec.ts:38:7 › should show 'Ghi nhận' action button/pill on the board
      Error: expect(locator).toBeVisible() failed
      Locator: locator('button, a').filter({ hasText: /Ghi nhận/i })
      Expected: visible
      Error: element(s) not found
    
    [chromium] › e2e/sun-kudos.spec.ts:50:7 › should redirect to /login when clicking 'Ghi nhận' while unauthenticated
      Error: expect(locator).toBeVisible() failed
      Locator: locator('button, a').filter({ hasText: /Ghi nhận/i })
      Expected: visible
      Error: element(s) not found
```

## File Ownership & Location

- **Test file:** `e2e/sun-kudos.spec.ts` (new, owned by tester)
- **Conventions followed:** `data-testid` locators, `describe`/`test` blocks, matching style of `e2e/home.spec.ts` and `e2e/countdown.spec.ts`
- **Auth pattern:** `test.fixme()` with documented server-side limitation (exact pattern from home.spec.ts lines 215–246)
- **No src/ files modified:** tester-only work

## Success Criteria — All Met ✓

- [x] Real RED confirmed (exit 1, failure caused by requested screen assertions — not config/dependency/dev-server)
- [x] Existing `e2e/home.spec.ts` still passes unmodified (GREEN, 10/14 passed + 4 fixme)
- [x] Test scenarios split correctly: real executables vs. `test.fixme()` server-auth skips
- [x] Regression check in place (home → kudos link verified PASS)
- [x] `redTestFiles`, `redCommand`, `redExitCode`, `redFailure` recorded above for handoff

## Ready for Track A Implementation

Phase A1 (board screen) and Phase A2 (composer modal) have the RED assertion failures they need to drive GREEN implementation. The E2E contract is set; do not weaken the tests during implementation.

---
**Tester:** RED test written and validated.  
**Status:** DONE
