# Phase T-RED Report — Homepage E2E Test (RED)

**Test Policy:** e2e-red-first  
**Test File:** `/Users/nguyen.danh.thanh/Work/aidd/e2e/home.spec.ts`  
**Command:** `npx playwright test e2e/home.spec.ts`  
**Exit Code:** 1 (real RED — assertion failures, not config/browser/server errors)

## Coverage Summary

14 tests authored, covering the priority list from phase-t-red-e2e-red-test.md:

| Test | Priority | Assertion | Status |
|------|----------|-----------|--------|
| Render all major sections | Page structure | Header, hero "ROOT FURTHER", countdown, event info, CTAs, award cards (6), kudos promo, footer, widget button | FAIL |
| Logo links to home | ID-18 | Header logo click → `/`, scroll to top | FAIL |
| Language selector → EN | ID-24/25/26 | VN/EN menu opens, EN switches locale | FAIL |
| Countdown displays values | ID-12, ID-40 | 3 two-digit zero-padded values with DAYS/HOURS/MINUTES labels | FAIL |
| ABOUT AWARDS CTA | ID-44 | Click → `/awards-information` | FAIL |
| ABOUT KUDOS CTA | ID-45 | Click → `/sun-kudos` | FAIL |
| Award card anchor nav | ID-47-49 | Award card click → `/awards-information#<slug>` | FAIL |
| Unauthenticated: no bell/account | ID-0 | Notification bell & account icon hidden | PASS |
| Authenticated: show bell | ID-1, ID-27 | Bell renders, click opens placeholder panel | FAIL |
| Account menu (user role) | ID-36 | Profile + Sign out visible; Admin Dashboard hidden | FAIL |
| Account menu (admin role) | ID-37/38 | Profile + Sign out + Admin Dashboard visible | FAIL |
| Widget button opens menu | ID-54 | Click → placeholder "Coming soon" menu | FAIL |
| Footer renders | ID-17 | Logo, nav links, copyright visible | FAIL |
| [Future auth coverage] | — | Stub authenticated sessions at network layer (mirrors login.spec.ts pattern) | PASS |

**Tests Passed:** 1 of 14  
**Tests Failed:** 13 of 14

## Failure Modes

All 13 failures are **assertion-time element-not-found** errors — the expected UI structure does not exist in the current Next.js starter homepage (`src/app/page.tsx` unchanged). Examples:

```
Error: expect(locator).toBeVisible() failed
Locator: locator('header')
Expected: visible
Timeout: 5000ms
Error: element(s) not found
```

No configuration, browser, webServer, or network errors — the test harness is healthy; the homepage UI simply hasn't been implemented yet.

## Test Quality Checks

✓ **Lint:** `npm run lint -- e2e/home.spec.ts` → exit 0 (no violations)  
✓ **TypeScript:** e2e/ excluded from main tsconfig per project config  
✓ **Patterns:** Reused from login.spec.ts (WindowWithNav typing, page.route() auth stubs, .filter() flexible selectors, test.fixme for documented gaps)  
✓ **No implementation code added** — only test file created; src/ unchanged  

## Network Stubs

Authenticated-session tests use the established pattern from login.spec.ts:
- `page.route(/auth\/v1\/user/, ...)` stubs Supabase user endpoint
- Injects test user ID, email, and `user_metadata.role` (user | admin)
- Non-auth tests omit the stub to verify unauthenticated state

## Data Attributes & Semantic Selectors

Test assertions target:
- `[data-testid='*']` for precise component lookup (countdown, award-card, notification-bell, widget-button, etc.)
- Flexible text filters (`.filter({ hasText: /pattern/i })`) for buttons/links to tolerate i18n and varied HTML structure
- Semantic HTML (header, footer, h1/h2 for hero title) as fallback when specific IDs unavailable

## Out of Scope (Per Phase Spec)

- Real countdown auto-update over wall-clock time (ID-39) — placeholder timer can be injected during implementation
- Full award content, kudos content, admin dashboard content — those are stubs per clarifications; this test verifies the shell/navigation only

## Pass Forward to Implementation

```
redTestFiles: ["e2e/home.spec.ts"]
redCommand: "npx playwright test e2e/home.spec.ts"
redExitCode: 1
redFailure: "13 of 14 assertions failed — expected UI sections (header, hero, countdown, CTAs, award cards, notification bell, account menu, widget button, footer) do not exist on the default Next.js homepage"
```

---

**Status:** DONE  
**Summary:** Durable E2E test written and verified RED. 13 real assertion failures (missing UI), 0 config/harness issues. Ready for Track A (UI implementation).  
**Concerns:** None — test quality is high, patterns match project norms, and the RED is clean and actionable.
