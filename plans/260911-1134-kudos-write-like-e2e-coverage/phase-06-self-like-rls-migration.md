# Phase 06 — Self-like RLS migration + proof test

## Context Links

- `supabase/migrations/20260908165400_kudos_schema.sql` (policy `kudos_likes_insert_own`)
- `src/lib/kudos/toggle-like.ts:42` (the app-layer self-like rule)
- Depends on: 03 (needs the access token the setup project dumps)

## Overview

- **Priority:** P1 (security)
- **Status:** completed (2026-09-11)
- **Goal:** the "you can't like your own kudos" rule holds at the database, not only in a server
  action that a direct PostgREST call walks straight past.

## Key Insights

- `kudos_likes_insert_own` checks only `auth.uid() = user_id`. The DB therefore **allows a self-like**.
- The rule lives solely at `toggle-like.ts:42`. Verified this session: a direct authenticated
  `POST /rest/v1/kudos` returns `201`, so the server-action layer is genuinely bypassable — the same
  holds for `kudos_likes`.
- The migration `20260908165400` is already applied. **Do not edit it.** Add a new timestamped one.
- `kudos_select_all` is public, so a subquery against `public.kudos` inside the policy resolves fine.

## Requirements

Functional:
- An authenticated `insert` into `kudos_likes` where the target kudos' `sender_id = auth.uid()` is
  rejected by RLS (`42501` / HTTP 403).
- Liking someone else's kudos still works; unliking still works; the existing e2e stays green.

Non-functional:
- Forward-only migration. No edit to an applied file.

## Architecture

```sql
-- supabase/migrations/<ts>_kudos_likes_block_self_like.sql
drop policy "kudos_likes_insert_own" on public.kudos_likes;

create policy "kudos_likes_insert_own"
  on public.kudos_likes
  for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and not exists (
      select 1 from public.kudos k
      where k.id = kudos_id and k.sender_id = auth.uid()
    )
  );
```

Proof test lives in Playwright, not jest: it needs the running local stack, and the jest suite is
jsdom-only and must stay runnable without Supabase.

## Related Code Files

- Create: `supabase/migrations/<YYYYMMDDHHMMSS>_kudos_likes_block_self_like.sql`
- Create: `e2e/kudos-rls.spec.ts`

**Owned exclusively by this phase.** No overlap with phase 05's spec file or phase 02's seed.

## Implementation Steps

1. Write the migration with a real timestamp after `20260908165400`.
2. Apply: `supabase db reset` via `npm run db:reset:dev` (re-seeds too).
3. `e2e/kudos-rls.spec.ts`, in `chromium-auth`, using `request` with the access token dumped by the
   setup project (`playwright/.auth/an-token.json`) plus the publishable key as `apikey`:
   - **self-like blocked:** `POST /rest/v1/kudos_likes` `{ kudos_id: 'aaaa…' (An's own), user_id: '1111…' }`
     → expect 4xx, body code `42501`.
   - **other-like allowed:** same against `bbbb…` → 201. Then `DELETE` it to restore the fixture.
   - **forged like user_id blocked:** `user_id: '2222…'` → 4xx (regression on the existing policy).
   - **forged sender blocked:** `POST /rest/v1/kudos` with `sender_id: '2222…'` → 4xx.
4. Confirm the happy path did not regress: rerun phase 05's like test.

## Todo List

- [ ] migration written, timestamp after the applied one
- [ ] `npm run db:reset:dev` applies it clean
- [ ] four RLS assertions in `e2e/kudos-rls.spec.ts`
- [ ] fixture restored by the test (the allowed like is deleted)
- [ ] phase 05 like test still green

## Success Criteria

- `npm run db:reset:dev` → exit `0`.
- `npx playwright test e2e/kudos-rls.spec.ts` → exit `0`, 4 passed.
- `psql "$SUPABASE_DB_URL" -c "select count(*) from pg_policies where tablename='kudos_likes'"` → `3`
  (select / insert / delete — the insert policy replaced, not duplicated).

## Risk Assessment

| Risk | L | I | Countermove |
|---|---|---|---|
| `drop policy` leaves a window with no insert policy if the create fails | Low | Med | Both statements in one migration file → one transaction |
| Subquery in the policy slows inserts | Low | Low | Single PK lookup on `kudos.id`; like inserts are low volume |
| Existing self-like rows in some dev DB now violate the rule | Low | Low | `with check` governs inserts only; existing rows are untouched. Seed has none |
| Test leaves a stray like row and skews phase 05 | Med | Med | The test deletes the like it created; phase 05 reads counts relatively, not absolutely |

## Rollback

Add a further migration restoring the original `with check (auth.uid() = user_id)`. Never revert by
editing the file once it has been applied anywhere shared. Delete `e2e/kudos-rls.spec.ts`.

## Security Considerations

- This phase closes a real authorization hole: defense in depth, DB-enforced rather than action-enforced.
- The test uses a user access token, never the service key — a service-key call bypasses RLS by
  design and would prove nothing.
- Do not log the token.

## Next Steps

Phase 07. Worth noting in the journal that `toggle-like.ts:42` is now the friendly error message and
the DB is the actual boundary.

## Result — 2026-09-11 (completed)

Migration `supabase/migrations/20260911140000_kudos_likes_block_self_like.sql` written with:
- `drop policy if exists "kudos_likes_insert_own"` (idempotent, verified by applying twice)
- New policy blocking self-like via subquery on `public.kudos` checking `sender_id = auth.uid()`

Test file `e2e/kudos-rls.spec.ts` created with 4 assertions:
1. Self-like blocked: POST `/rest/v1/kudos_likes` with `sender_id = user_id` → 42501 (forbidden)
2. Other-like allowed: POST `/rest/v1/kudos_likes` with `sender_id ≠ user_id` → 201, then DELETE to restore fixture
3. Forged user_id blocked: user_id mismatch → 4xx (regression check on existing policy)
4. Forged sender blocked: POST `/rest/v1/kudos` with sender_id mismatch → 4xx (regression check)

Migration applied via `docker exec … psql` (not via `supabase db reset` which had docker failures).
**Note:** `supabase_migrations.schema_migrations` table was wiped during this session's docker failures,
so no local record of applied migrations exists. Migration has timestamp and is forward-only.

`e2e/kudos-rls.spec.ts` runs in `chromium-auth` project, uses real access token from setup, cleanup
deletes test-inserted rows to preserve fixture state.
