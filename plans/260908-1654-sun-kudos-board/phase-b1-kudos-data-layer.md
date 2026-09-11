# Phase B1 — Track B: Kudos data layer (list/create/like/search)

**Track:** B (generic `implementer`, RED-first) · **Depends on:** B0 · **Blocks:** I1

## MoMorph refs
- Live board: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/MaZUn5xHXZ
- Composer modal: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/ihQ26W78P2
- Clarifications: plans/260908-1654-sun-kudos-board/clarifications.md
- testPolicy: e2e-red-first

## Goal
Server actions (`"use server"`, matching `src/lib/auth/login-actions.ts`'s existing pattern — no
new API-route convention) for the board feed, kudos creation, like/unlike, and recipient search.

## Owned files
`src/lib/kudos/**` (new: `list-kudos.ts`, `create-kudos.ts`, `toggle-like.ts`, `search-profiles.ts`,
plus colocated `*.test.ts`)

## Data flow
- `listKudos({ offset, limit })`: `select` from `kudos` joined to `profiles` (sender/receiver
  name+avatar) + a like count, ordered `created_at desc`, returns rows + `hasMore`. Public — works
  for anon callers (RLS allows it).
- `createKudos({ receiverId, content, hashtags })`: validates content non-empty, `1 <= hashtags.length
  <= 5`, reads `auth.uid()` server-side as `sender_id`, inserts. Rejects if not authenticated
  (caller — I1 — is expected to have already redirected, but this is the real enforcement boundary).
- `toggleLike({ kudosId })`: reads `auth.uid()`; if the kudos' `sender_id === auth.uid()`, reject
  (app-layer "can't like own kudos" rule, per clarifications.md); else upsert-or-delete the
  `kudos_likes` row (delete if already liked = unlike, insert otherwise).
- `searchProfiles(query)`: `ilike` search on `profiles.full_name`, capped at ~10 results.

## Requirements (RED-first, generic `implementer` contract)
Unit tests per action: happy path, empty/invalid content, hashtag count out of 1-5, unauthenticated
caller rejected on create/like, self-like rejected, unlike removes the row, search returns capped
results and handles empty query. Mock the Supabase client per this project's existing test patterns
(check `login-actions.test.ts` for the mocking approach before inventing a new one).

## Out of scope
Optimistic UI, realtime subscriptions, pagination beyond offset/limit, department/hashtag filtering
queries — not requested (clarifications.md).

## Success criteria
- `npx jest src/lib/kudos` green, `npx tsc --noEmit` passes.
- Manual check against local Supabase (from B0): unauthenticated `createKudos`/`toggleLike` reject;
  self-like rejects; unlike after like removes the row.
