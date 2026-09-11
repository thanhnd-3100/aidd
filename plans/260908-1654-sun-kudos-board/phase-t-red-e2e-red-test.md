# Phase T-RED — Tester: write the RED E2E test

**Track:** Tester (owns executable E2E only) · **Depends on:** B0 · **Blocks:** A1, A2

## MoMorph refs
- Live board: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/MaZUn5xHXZ
- Composer modal: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/ihQ26W78P2
- Clarifications: plans/260908-1654-sun-kudos-board/clarifications.md
- testPolicy: e2e-red-first

## Goal
Before implementation, write one durable screen-level test at `e2e/sun-kudos.spec.ts` covering
both screens (board is not its own route split from the modal — modal renders over `/sun-kudos`).
Run to a real RED (exit 1 — the board/composer don't exist yet, only the stub).

## Scope (from downloaded test cases + clarifications)
- `/sun-kudos` (unauthenticated): banner renders, feed renders (empty-state text "Hiện tại chưa có
  Kudos nào." when no seed data, or card list when seeded), clicking the "Ghi nhận" pill redirects
  to `/login` instead of opening the composer, clicking a heart also redirects to `/login`.
- `/sun-kudos` (authenticated, via existing test-login fixture pattern from `login.spec.ts` /
  `home.spec.ts` if one exists — reuse it, don't invent a new auth-in-e2e mechanism): clicking
  "Ghi nhận" opens the composer modal; "Gửi" stays disabled until recipient + content + ≥1 hashtag
  are filled; "Hủy" closes without submitting; a valid submit closes the modal and the new kudos
  appears in the feed; liking a kudos not authored by the current user increments the like count
  and the heart button becomes disabled on a kudos the user IS the sender of.
- Regression check: `/` still links to `/sun-kudos` (existing `kudos-promo.tsx`/header/footer/hero
  links unaffected).

## Out of scope (per clarifications — do not invent)
- Carousel, filters, spotlight, sidebar, Secret Box, anonymous send, rich text/@mention, image
  upload, copy-link/detail-page nav — none of this exists; do not assert on it.
- Real-time "someone else's like updates live" behavior — not requested, no realtime subscription
  in scope.

## Record and pass forward (read-only to Track A)
`redTestFiles: [e2e/sun-kudos.spec.ts]`, `redCommand: npx playwright test e2e/sun-kudos.spec.ts`,
`redExitCode`, `redFailure`.

## Success criteria
- Real RED confirmed (exit 1, failure caused by the requested screen assertions — not a
  config/dependency/dev-server error).
- Existing `e2e/home.spec.ts` (kudos-promo link) still passes unmodified.
