# Phase I1 — Integration & GREEN

**Depends on:** A1, A2, B1 · **Owner:** generic `implementer` wires, `tester` verifies

## MoMorph refs
- Live board: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/MaZUn5xHXZ
- Composer modal: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/ihQ26W78P2
- Clarifications: plans/260908-1654-sun-kudos-board/clarifications.md
- testPolicy: e2e-red-first

## Goal
Replace the `/sun-kudos` stub with the real page: wire `KudosBoard` (A1) + `KudosComposer` (A2) to
B1's server actions, add the unauthenticated-click login redirect, bring `e2e/sun-kudos.spec.ts`
(T-RED) to real GREEN, run full regression.

## Owned files
`src/app/sun-kudos/page.tsx` (replace stub), `src/app/sun-kudos/page.test.tsx` (replace/extend
existing stub test), a thin client-component wrapper if needed to hold modal-open state (e.g.
`src/app/sun-kudos/sun-kudos-client.tsx`, colocated).

## Steps
1. Server component `page.tsx`: reads the session (reuse the pattern from `session-guard.ts`'s
   `getSessionUser`-equivalent, but do NOT redirect — this page stays public), calls `listKudos`
   for the first page, passes `currentUserId` (or `null`) down.
2. Client wrapper holds `modalOpen` state; `onGhiNhanClick`/`onLikeClick` check `currentUserId` —
   if `null`, `redirect("/login")` (client-side `next/navigation` router push); else open the modal
   / call `toggleLike`.
3. Wire `KudosComposer`'s `onSearchRecipient` → `searchProfiles`, `onSubmit` → `createKudos` then
   refetch page 1 (clarifications.md: refetch, not optimistic prepend) and close the modal.
4. Wire `KudosBoard`'s `onLoadMore` → `listKudos({ offset: nextOffset })`, appending results.
5. `tester` reruns `npx playwright test e2e/sun-kudos.spec.ts` to GREEN; then the full suite
   (`npx playwright test`, `npx jest src`) to confirm zero regressions on login/home/awards-
   information/countdown.
6. `tester` performs visual validation via Playwright MCP against both Figma frames at desktop and
   mobile widths.
7. Any GREEN failure or material visual mismatch → bounded fix back to `momorph-ui-implementer`
   (markup) or `implementer` (logic/server actions), never weaken the test.

## Success criteria
- `npx playwright test` (full suite incl. `sun-kudos.spec.ts`), `npm run build`, `npx tsc --noEmit`,
  `npm run lint`, `npx jest src` all pass.
- Visual match confirmed against both MoMorph frames (`MaZUn5xHXZ`, `ihQ26W78P2`) at desktop and
  mobile widths.
- Manually confirmed: unauthenticated click on "Ghi nhận" and on a heart both redirect to `/login`;
  authenticated flow (open composer → fill → submit → see new card in feed → like/unlike another
  user's kudos) works end to end against local Supabase.
- Existing `/` links to `/sun-kudos` (footer/header/hero/kudos-promo) unaffected.

## Rollback
Revert `page.tsx`/`page.test.tsx` to the stub (single-file revert, no migration rollback needed —
B0's tables are additive and harmless to leave in place even if this phase is reverted).
