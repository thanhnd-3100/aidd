# Phase T-RED — Tester: write the RED E2E test

**Track:** Tester (owns executable E2E only) · **Depends on:** B0 · **Blocks:** A1-A4, B1 · **Status:** ✅ completed

## MoMorph refs
- Homepage: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/i87tDx10uM
- Clarifications: plans/260907-1545-home-screen/clarifications.md
- testPolicy: e2e-red-first

## Goal
Before implementation, write one durable screen-level test at `e2e/home.spec.ts` from the downloaded test cases + clarifications, run to a real RED (exit 1, page/elements don't exist — not a config error). 62 test cases exist for this screen — cover the highest-priority/highest-risk behaviors, not literally all 62 (same depth precedent as `e2e/login.spec.ts`).

## Priority coverage (from downloaded test cases, see this session's `download_test_cases` CSV)
- Page renders all major sections: header, hero (title "ROOT FURTHER", countdown, event info, CTAs), Root Further content, 6 award cards, Sun* Kudos promo, footer, widget button.
- Header logo click navigates to `/` and scrolls to top (ID-18).
- Language button opens VN/EN menu; selecting EN switches locale (ID-24/25/26).
- Countdown displays 3 two-digit values with DAYS/HOURS/MINUTES labels, zero-padded (ID-12, ID-40).
- CTA "ABOUT AWARDS" navigates to `/awards-information`; "ABOUT KUDOS" navigates to `/sun-kudos` (ID-44/45).
- Award card click navigates to `/awards-information#<slug>` for at least one category (ID-47-49).
- Unauthenticated: no notification bell, no account icon (ID-0). Stub authenticated session (reuse the cookie/network-stub approach from `e2e/login.spec.ts`) to assert: notification bell renders, clicking opens a placeholder panel (ID-1, ID-27); account menu opens with Profile/Sign out (ID-36); admin role shows an additional Admin Dashboard item, non-admin does not (ID-37/38).
- Widget button click opens a placeholder quick-action menu (ID-54).
- Footer renders logo, nav links, copyright (ID-17).

## Out of scope
- Real countdown auto-update over wall-clock time (ID-39) — flaky in CI; if covered, use a short interval or inject a fake timer, don't `waitForTimeout` a full minute.
- Full award-category content, Sun* Kudos content, admin dashboard content — those are stubs per clarifications, not this screen's assertions.

## Record and pass forward (read-only to Track A/B)
`redTestFiles: [e2e/home.spec.ts]`, `redCommand: npx playwright test e2e/home.spec.ts`, `redExitCode: 1`, `redFailure: 13 of 14 assertions failed (homepage/sections/components did not exist before implementation)`.

## Completion Note
e2e/home.spec.ts written and run to confirmed RED (exit 1, 13 failing) before implementation. Covers priority behaviors: page sections, header logo, language switch, countdown, CTAs, award-grid navigation, auth conditional rendering, widget menu, footer. Final state after implementation: 10 passing + 4 test.fixme (server-side auth unobservable via Playwright's page.route()). All evidence recorded.
