# Phase I1 — Integration & GREEN

**Depends on:** A1 · **Owner:** generic `implementer` wires, `tester` verifies · **Status:** ✓ completed

## MoMorph refs
- Award Information: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/zFYDgyj_pD
- Clarifications: plans/260908-1118-award-information-screen/clarifications.md
- testPolicy: e2e-red-first

## Goal
Replace the plain stub in `src/app/awards-information/page.tsx` with the real `AwardInformationScreen`, enforce the spec's authentication requirement, and bring `e2e/awards-information.spec.ts` to real GREEN.

## Owned files
`src/app/awards-information/page.tsx`, `src/app/awards-information/page.test.tsx`

## Steps
1. `src/app/awards-information/page.tsx` (server component): call `redirectIfUnauthenticated("/login")` from `src/lib/auth/session-guard.ts` (same pattern as `/todo`) before rendering. If authenticated, render `<AwardInformationScreen />` (from Track A, no props).
2. Rewrite `page.test.tsx`: unauthenticated request redirects to `/login`; authenticated request renders `AwardInformationScreen` (mock the guard/session the same way `todo/page.test.tsx` does — don't duplicate what the E2E suite already covers in detail).
3. `tester` reruns `npx playwright test e2e/awards-information.spec.ts` — must exit 0 (GREEN), no test weakening. If a specific assertion turns out to be genuinely unobservable for a legitimate technical reason (mirroring the login/home screens' documented auth-observability gap), stop and report it as a documented gap in clarifications.md rather than gutting the assertion.
4. `tester` performs visual validation via Playwright MCP screenshot against the Figma frame (`get_frame_image` for `zFYDgyj_pD`) at desktop and mobile widths, including the hover-highlight check from test case ID-10 that wasn't covered by the E2E assertions.
5. Any GREEN failure or material visual mismatch → bounded fix back to `momorph-ui-implementer` (markup) or `implementer` (logic), never weaken the test.

## Success criteria
- `npx playwright test`, `npm run build`, `npx tsc --noEmit`, `npm run lint`, `npx jest src` all pass, including the full existing suite (login + home + this screen) with no regressions.
- Visual match confirmed against MoMorph frame `zFYDgyj_pD` at desktop and mobile widths.
- Unauthenticated → `/login` redirect confirmed; authenticated → full page content confirmed; the 6 existing homepage award-card hash-anchor links (`/awards-information#<slug>`) still resolve to the correct section for an authenticated user.
