# Phase T-RED — Tester: write the RED E2E test

**Track:** Tester (owns executable E2E only) · **Depends on:** none · **Blocks:** A1 · **Status:** ✓ completed

## MoMorph refs
- Award Information: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/zFYDgyj_pD
- Clarifications: plans/260908-1118-award-information-screen/clarifications.md
- testPolicy: e2e-red-first

## Goal
Before implementation, write one durable screen-level test at `e2e/awards-information.spec.ts` from the downloaded test cases + clarifications, run to a real RED (exit 1 — the page is still the plain stub, not the real content).

## Priority coverage (from downloaded test cases, see this session's `download_test_cases` CSV)
- Unauthenticated visitor to `/awards-information` is redirected to `/login` (ID-1).
- Authenticated visitor sees the page render: hero banner, section title ("Sun* annual awards 2025" + "Hệ thống giải thưởng SAA 2025"), 6-item category nav in order (Top Talent, Top Project, Top Project Leader, Best Manager, Signature 2025 - Creator, MVP), 6 award cards with correct content, Sun* Kudos block (ID-3/4/5/6/8).
- At least 2 award cards' exact quantity/prize text render correctly, e.g. Top Talent ("Số lượng giải thưởng: 10 Đơn vị", "7.000.000 VNĐ"), MVP ("15.000.000 VNĐ") (ID-6).
- Clicking a category nav item scrolls to the matching section and sets that item active (gold + underline), clearing any previous active item (ID-9, ID-11).
- Clicking "Chi tiết" in the Sun* Kudos block navigates to `/sun-kudos` (ID-12).

## Out of scope
- Real hover-highlight visual assertion (ID-10) — covered by tester's later visual validation pass, not this E2E test.
- Scroll-spy (auto-highlight without click) — not specified, not tested.
- Network-failure/404 error-page simulation (ID-14) — no custom error UI exists to assert against.

## Auth stub reuse
Reuse the existing authenticated-session network stub pattern already established in `e2e/home.spec.ts` (stubbing `**/auth/v1/user**`) for the ID-0 authenticated-access scenarios — do not invent a new stubbing approach.

## Record and pass forward (read-only to Track A)
`redTestFiles: [e2e/awards-information.spec.ts]`, `redCommand: npx playwright test e2e/awards-information.spec.ts`, `redExitCode`, `redFailure`.
