# Phase A1 — Track A: Board screen presentational UI

**Track:** A (`momorph-ui-implementer`, screen mode) · **Depends on:** T-RED

## MoMorph refs
- Live board: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/MaZUn5xHXZ
- Clarifications: plans/260908-1654-sun-kudos-board/clarifications.md
- testPolicy: e2e-red-first

## Goal
Static banner + "Ghi nhận" trigger pill + vertical kudos feed + "Load more" + empty state. Prop-
driven only — no fetching, no Supabase, no routing/auth logic.

## Owned files
`src/components/kudos/board/**`, `src/messages/kudos.json` (follow `countdown.json` merge pattern)

## Out of scope
`src/app/sun-kudos/page.tsx`/real fetching/login-redirect (I1); composer modal (A2); carousel,
filters, spotlight, sidebar (not in this plan — clarifications.md).

## Integration contract
`KudosBoard({ kudos, hasMore, onLoadMore, onGhiNhanClick, onLikeClick, currentUserId })`.
`KudosCard`: sender+receiver name/avatar, `created_at`, line-clamped content, plain hashtag chips,
like count + heart (disabled when `kudos.senderId === currentUserId`). Empty state copy exactly
"Hiện tại chưa có Kudos nào." Use Figma content as mock data — do not invent copy.

## Test policy
`e2e-red-first`. `testRunner: playwright`; redTestFiles/redCommand/redExitCode/redFailure/
redEvidence passed from T-RED, read-only.
