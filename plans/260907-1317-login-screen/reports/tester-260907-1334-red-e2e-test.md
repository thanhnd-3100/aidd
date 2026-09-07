# Tester Report: Phase T-RED E2E Test — Login Screen

**Status:** RED (expected) ✗

## Red Evidence

- **testFile:** `e2e/login.spec.ts` (durable, screen-level)
- **command:** `npx playwright test e2e/login.spec.ts`
- **exitCode:** `1` (non-zero, real failure)
- **failureReason:** Page elements do not exist (assertions fail when locators don't find logo, button, footer, etc.)

### Test Run Summary

- Tests executed: 7
- Passed: 0
- Failed: 7
- Total failures due to missing UI elements

### Failure Details

All 7 tests failed for the same root cause: **the `/login` route and its UI elements do not exist yet**.

1. **"should render the login page with all required elements"**
   - Assertion: `await expect(logo).toBeVisible()`
   - Error: `Locator: locator('[alt*="Sun"], [alt*="Award"]').first()` — element(s) not found
   - Expected: Logo visible

2. **"should show language selector dropdown on click"**
   - Assertion: `await languageSelector.click()`
   - Error: Timeout (30s) waiting for `locator('button, a').filter({ hasText: /VN|Vietnam|Việt/i })`
   - Expected: VN language selector button present

3. **"should disable login button and show loading state when clicked"**
   - Assertion: `await loginButton.click()`
   - Error: Timeout (30s) waiting for `locator('button').filter({ hasText: /LOGIN.*Google|Google|Đăng nhập/ })`
   - Expected: Login button present and clickable

4. **"should navigate away from /login when login button is clicked (OAuth flow)"**
   - Assertion: `await loginButton.click()`
   - Error: Timeout (30s) waiting for login button
   - Expected: Button to exist and trigger OAuth flow

5. **"should show error message if OAuth fails"**
   - Assertion: `await loginButton.click()`
   - Error: Timeout (30s) waiting for login button
   - Expected: OAuth failure handling with error message display

6. **"should redirect authenticated user from /login to /todo"**
   - Assertion: `await expect(page).toHaveURL(/\/todo|^[^/]*\/$/)`
   - Error: Page stayed at `http://localhost:3000/login` (no redirect to `/todo`)
   - Expected: Auth guard redirects authenticated users away from login

7. **"should display footer with copyright text"**
   - Assertion: `await expect(footer).toBeVisible()`
   - Error: `Locator: locator('footer')` — element(s) not found
   - Expected: Footer with copyright text

## Test Coverage (from Phase Spec)

The test at `e2e/login.spec.ts` covers all requested scenarios:

- ✓ Unauthenticated user can reach `/login`; page shows logo, VN language selector, hero title "ROOT FURTHER", "LOGIN With Google" button
- ✓ Clicking the login button triggers the Google OAuth flow (assert navigation away from `/login` or popup opens) and the button becomes disabled with a loading indicator
- ✓ Authenticated user visiting `/login` is redirected to `/todo`
- ✓ Language selector opens a dropdown on click

## Test Quality

- **Durability:** Test is written to survive UI refinements (flexible selectors, no hardcoded classes)
- **Isolation:** Each test is independent; no shared state
- **Network Stubbing:** Supabase OAuth responses are stubbed at the network layer (Playwright route interception)—no mock code required in the implementation
- **Real RED:** Failures are due to missing page elements, not configuration/dependency errors

## Next Steps (for Track A & Track B)

### For Track A (momorph-ui-implementer)
- Implement the `/login` route and components per the MoMorph screen spec
- Ensure all elements targeted by this test are rendered (logo, buttons, dropdowns, footer)
- After implementation, tester will run the same command to GREEN

### For Track B (generic implementer)
- Set up Supabase OAuth integration and auth guard redirects
- Implement `/todo` route (stub/placeholder acceptable for now)
- Implement cookie-based locale switching and i18n wiring

### For Tester (after implementation)
- Rerun: `npx playwright test e2e/login.spec.ts`
- Expected: Exit code 0, all 7 tests pass GREEN
- Then perform post-code visual validation against the MoMorph design

## Recorded Evidence (read-only to Track A/B)

```
redTestFiles: [e2e/login.spec.ts]
redCommand: npx playwright test e2e/login.spec.ts
redExitCode: 1
redFailure: Page elements do not exist (logo, button, footer, language selector, redirect guard not implemented)
```

---

**Date:** 2026-09-07
**Tester:** Phase T-RED E2E Test
**Project:** Login Screen (MoMorph GzbNeVGJHz)
