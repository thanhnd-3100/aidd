# E2E Test Cleanup Report — login.spec.ts

**Date:** 2026-09-07  
**File:** `e2e/login.spec.ts`  
**Status:** ✅ COMPLETE

## Summary

Fixed two reviewer findings in the E2E test file:

### 1. Lint Errors (High)

**Before:** 7 `@typescript-eslint/no-explicit-any` errors + 3 unused-variable warnings

**Fixes applied:**
- Removed unused `stubSupabaseAuth()` helper function (lines 8–26)
- Removed unused `original` variable assignments (lines 99, 161)
- Replaced all `(window as any)` casts with properly typed interfaces:
  - Created narrow `WindowWithNav` / `WindowWithNavAttempts` interfaces
  - Used `as unknown as TypedInterface` casting pattern instead of `any`
  - Applied to all window property overrides (lines 78, 149, 183)

**Result:** ✅ `npm run lint e2e/login.spec.ts` → **Exit code 0, 0 errors/warnings**

### 2. Known-Failing Tests (Medium)

**Before:** 3 tests left live in the default run despite being known to fail
- "should disable login button and show loading state when clicked"  
- "should navigate away from /login when login button is clicked (OAuth flow)"  
- "should redirect authenticated user from /login to /todo"

**Root cause (from clarifications.md § takumi execution):**
- Supabase's real OAuth flow performs top-level browser navigation that destroys the page before states can be checked
- Faking an authenticated session requires Supabase SSR's exact cookie format
- Underlying logic already unit-tested (13 passing tests elsewhere)

**Fix applied:**
- Changed 3 tests to `test.fixme()` with detailed reason strings pointing to clarifications.md
- Reason string documents why the test cannot be observed in Playwright and references the decision
- Test bodies preserved in the file for future reference/debugging
- All 4 intended-to-pass tests remain as regular `test()`

**Result:**  
✅ `npx playwright test e2e/login.spec.ts`
- Exit code: **0**
- **4 passed** (all passing tests executed)
- **3 skipped** (fixme tests properly isolated)

## Code Changes

- Removed: `stubSupabaseAuth()` function and `Page` import (unused)
- Added: Narrow `WindowWithNav` / `WindowWithNavAttempts` interfaces for proper typing
- Updated: All 3 fixme tests with reason strings referencing clarifications.md
- Fixed: Indentation consistency across all test bodies

## Validation

```bash
# Playwright tests
$ npx playwright test e2e/login.spec.ts
→ 4 passed, 3 skipped (exit code 0)

# Lint
$ npm run lint e2e/login.spec.ts
→ 0 errors, 0 warnings (exit code 0)
```

## Files Modified

- `/Users/nguyen.danh.thanh/Work/aidd/e2e/login.spec.ts` — lint fixes + test quarantine

No other files touched.
