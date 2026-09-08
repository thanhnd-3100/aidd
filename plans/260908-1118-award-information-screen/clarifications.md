# Clarifications — Award Information Screen (MoMorph zFYDgyj_pD, "Hệ thống giải")

Screen: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/zFYDgyj_pD

## Session 2026-09-08

- Q: The design's test cases literally specify URL `/he-thong-giai` (Vietnamese), but the home screen already links everywhere to `/awards-information` (matching the app's English route convention: /login, /todo, /sun-kudos, /admin-dashboard). Which route? → A: Keep `/awards-information`. No home-screen links need updating. The spec's literal Vietnamese URL is treated as descriptive, not a hard requirement.
- Q: Test cases ID-0/ID-1 require this page to be authenticated-only (unauthenticated → redirect to /login) — but the home screen currently links to it as a fully public page, including all 6 award cards clickable by guests. Enforce, or keep public? → A: Enforce the spec's auth guard as written. Accepted consequence: a guest clicking an award card from the public homepage will be redirected to `/login` instead of seeing award info (no hash-anchor preservation across that redirect — out of scope, matches existing session-guard behavior used by `/todo`).

## Session 2026-09-08 (takumi execution)

- Q: 9 of 10 E2E assertions can't be observed in Playwright because this page requires auth (redirectIfUnauthenticated guard) and Supabase's server-side auth check in Next.js (Node.js context) can't be intercepted by browser-level page.route() stubs. Same class of gap as the login screen (4/7 E2E tests) and home screen (10/14 E2E tests), already documented in plans/260907-1317-login-screen/clarifications.md and plans/260907-1545-home-screen/clarifications.md. The entire page is auth-gated (unlike login/home which are partially public), so the coverage gap is larger (9/10 vs 29-43%). How to proceed? → A: Accept 1/10 E2E pass (redirect unauthenticated visitor to /login, which runs client-side before auth check) + add RTL unit tests for the AwardInformationScreen component itself, which has no auth dependency and renders all UI logic directly. Tests cover hero title/subtitle, section title block, all 6 category nav items, all 6 award cards with correct id/slug and text, Sun* Kudos block, and category nav active state on click + clearing previous state. Quarantine the other 9 tests with `test.fixme()` citing this plan's clarifications. This matches the established pattern from login/home screens: use E2E only for what can be observed in the browser, rely on unit tests for coverage of the auth-walled UI logic.

## Resolved without asking (reasonable defaults, non-blocking)

- Reuse the existing `src/components/home/kudos/kudos-promo.tsx` component as-is for the Sun* Kudos block (spec D1/D2/D2.1) — it's already a self-contained, no-props component matching this exact Figma node (`mms_D1_Sunkudos`, node 3390:10349). No duplication.
- Reuse the existing `src/lib/auth/session-guard.ts`'s `redirectIfUnauthenticated` (already used by `/todo`) for the auth guard — no new auth logic needed.
- Category navigation is click-to-scroll + active-state-on-click only (per test case ID-9/ID-11's actual test steps). Scroll-spy (auto-highlighting the nav item as the user scrolls past a section without clicking) is not tested/specified — not built, to avoid inventing scope.
- Existing award-category slugs from the `/awards-information` stub (`top-talent`, `top-project`, `top-project-leader`, `best-manager`, `signature-2025-creator`, `mvp`) already match this screen's 6 categories exactly — reused as the anchor ids, no renaming.
- Test cases ID-13/ID-14 (invalid section id, failed Sun* Kudos navigation) — basic hardening only: invalid hash targets are simply a no-op (no JS error), and the "Chi tiết" link failure case isn't given a custom error UI (a broken link would show the browser/Next.js default, matching KudosPromo's existing behavior on the homepage) — no new error-page work invented.
