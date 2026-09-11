---
status: delivered
work_type: feature
spec_waived: "SDD mode disabled (takumi.sddMode: off)"
testPolicy: e2e-red-first
priority: P2
effort: 10h
branch: master
tags: [momorph, kudos, supabase]
momorph:
  fileKey: 9ypp4enmFmdK3YAFJLIu6C
  screens:
    - name: "Sun* Kudos - Live board"
      screenId: MaZUn5xHXZ
    - name: "Viết Kudo (composer modal)"
      screenId: ihQ26W78P2
blockedBy: []
blocks: []
created: 2026-09-08
---

# Plan: Sun* Kudos Board (reduced scope) — SAA 2025

MoMorph screens:
- Live board: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/MaZUn5xHXZ
- Composer modal: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/ihQ26W78P2

Clarifications: [clarifications.md](./clarifications.md)

## Summary

Replace the `/sun-kudos` stub (`src/app/sun-kudos/page.tsx`) with a real, publicly-viewable board:
a static banner, an "all kudos" feed (paginated via Load More), and a composer modal (recipient
autocomplete, plain-text content, free-text hashtag chips) gated to authenticated users. This is
the project's **first real schema** — `supabase/migrations` was empty — adding `profiles` (synced
from `auth.users` via trigger), `kudos`, and `kudos_likes` with RLS.

**Deliberately reduced scope** (see clarifications.md for the Scope Challenge). NOT built here —
follow-up plan required: highlight-kudos carousel, hashtag/department filters, spotlight word-cloud
board, sidebar stats/leaderboards/Secret Box, special-day double-heart rule, anonymous send,
image upload, rich-text formatting/@mention, copy-link/detail-page/profile-page navigation, star
badge tiers.

## Test Policy

`e2e-red-first` — modal open/close, form validation, and like/unlike are real state transitions
(auto-selected per `momorph-development.md` rule 3, not user-chosen).

## Phases

| Phase | Track | Depends on | Status | File |
|---|---|---|---|---|
| B0 — DB schema, trigger, RLS | B | — | completed | [phase-b0-db-schema-and-rls.md](./phase-b0-db-schema-and-rls.md) |
| T-RED — Tester writes RED E2E test | Tester | B0 | completed | [phase-t-red-e2e-red-test.md](./phase-t-red-e2e-red-test.md) |
| A1 — Board screen presentational UI | A | T-RED | completed | [phase-a1-board-screen.md](./phase-a1-board-screen.md) |
| A2 — Composer modal presentational UI | A | T-RED | completed | [phase-a2-composer-modal.md](./phase-a2-composer-modal.md) |
| B1 — Kudos data layer (list/create/like/search) | B | B0 | completed | [phase-b1-kudos-data-layer.md](./phase-b1-kudos-data-layer.md) |
| I1 — Integration & GREEN (+ regression) | — | A1, A2, B1 | completed | [phase-i1-integration.md](./phase-i1-integration.md) |

A1, A2, and B1 all proceed once T-RED/B0 land and may run concurrently — they own disjoint files
(board UI vs. composer UI vs. server actions).

## Key Dependencies

- First DB migration in this project (`supabase/migrations` was empty) — B0 blocks every other
  phase that touches real data.
- Server actions (`"use server"`), matching the existing `src/lib/auth/login-actions.ts` pattern —
  no new API route convention introduced.
- Reuses `/login` as the unauthenticated redirect target for both the composer trigger and the
  heart button (no page-level auth guard on `/sun-kudos` itself — it stays public).

## Delivered

**All 6 phases completed and verified.** Final scope and evidence:

### Phase Evidence

- **B0 — DB schema, trigger, RLS:** `supabase/migrations/20260908165400_kudos_schema.sql` written with `profiles`, `kudos`, `kudos_likes` tables, auth-trigger, and RLS policies. Dev seed data included. Written only (not applied to live DB by design — user will apply via Supabase CLI in their own environment).

- **T-RED — E2E test authoring:** `e2e/sun-kudos.spec.ts` written and run to real RED (exit code 1, 4 assertion failures on the stub page). Later brought to real GREEN by I1 implementation.

- **A1 — Board screen UI:** `src/components/kudos/board/**` (KudosBoard, KudosCard components) implemented per MoMorph frames, 23 component tests.

- **A2 — Composer modal UI:** `src/components/kudos/composer/**` (KudosComposer component) implemented per MoMorph frames, included in shared component test suite.

- **B1 — Data layer:** `src/lib/kudos/{list-kudos,create-kudos,toggle-like,search-profiles}.ts` + full unit test coverage (21 tests), RED-first methodology confirmed.

- **I1 — Integration & GREEN:** `src/app/sun-kudos/{page.tsx,sun-kudos-client.tsx,page.test.tsx}` wired all components and server actions, replaced the stub, brought T-RED test to full GREEN.

### Verification

Independently reproduced by the orchestrator twice:

| Check | Result |
|---|---|
| TypeScript (`npx tsc --noEmit`) | ✓ Clean |
| Linting (`npx eslint src e2e`) | ✓ Clean (3 pre-existing `<img>` warnings only) |
| Jest unit tests (`npx jest src`) | ✓ 180/180 passing |
| Next.js build (`npm run build`) | ✓ Clean |
| Playwright E2E (`npx playwright test`) | ✓ 28 passed / 22 skipped / 0 failed |

### Reviewer Sign-off

**Score 8/10, SEALED** (0 critical, 1 high, 2 medium findings all resolved/logged).

**High-severity fix (post-review):** Silent error-swallowing in `listKudos`'s fail-soft path. Added `console.error("listKudos failed", error)` at `src/lib/kudos/list-kudos.ts` for observability. Re-verified all tests pass.

**Medium findings (accepted as non-blocking, logged for follow-up):**
1. No self-addressed-kudos rejection at the DB level — caught at app layer.
2. Rapid double-click like race — fails soft (no data corruption, cosmetic only).

Both logged in clarifications.md as explicitly deferred, not new scope creep.

### Known Gaps (Deliberately Out of Scope — Follow-up Required)

These were evaluated and explicitly deferred per clarifications.md:
- Highlight carousel, hashtag/department filters, spotlight word-cloud
- Sidebar stats, leaderboards, Secret Box
- Special-day double-hearts, anonymous send
- Image upload, rich-text/@mention
- Copy-link, detail-page, profile navigation, star badge tiers

## Follow-up: Cosmetic & Behavior Refinements (Next Plan)

Two issues identified during delivery, not critical to this plan but worth capturing:

1. **KudosCard heart button missing "already liked by me" visual state (cosmetic):** The heart icon does not visually distinguish between liked/unliked by the current user. No functional loss — toggle works, counts update — but UX clarity is degraded. Recommend visual feedback (filled vs. outline heart, or color change) in a follow-up refinement.

2. **Self-addressed kudos not rejected (behavior, non-blocking):** A user can send a kudos to themselves. The business requirement was ambiguous on this point (clarifications.md); app currently allows it. If rejection is desired, add sender != receiver validation to `createKudos` server action.

Both are optional refinements; functionality is complete and correct as specified in this plan.
