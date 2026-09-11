# Phase 05 — Un-fixme and repair the 6 tests

## Context Links

- `e2e/sun-kudos-authenticated.spec.ts` (created by phase 03)
- `src/app/sun-kudos/sun-kudos-client.tsx`
- `src/components/kudos/board/kudos-card.tsx`
- Phase 02 fixture contract, phase 04 testid contract
- Depends on: 03, 04

## Overview

- **Priority:** P1 — this is the commission's actual deliverable
- **Status:** deferred (by user decision)
- **Goal:** all six tests executable, green, and asserting what the app really does.

**Deferral reason:** Deferred together with phase 04. Plan `260911-1143-viet-kudo-screen` restructures
the composer and hashtag handling, making the testid contract and 6 test bodies volatile. Both phases
stay on hold until the Viết Kudo integration lands; they will be revisited together at that point.

## Key Insights — the measured UI contract

- `canSubmit` = recipient selected **and** trimmed content non-empty **and** ≥1 hashtag **and**
  not submitting. Selecting a recipient requires clicking a suggestion; typing the name is not enough.
- Suggestions render only when `recipientOpen && options.length > 0`, populated async by
  `searchProfiles`. Never `waitForTimeout` — wait for `recipient-option` to be visible.
- Like count is formatted with `Intl.NumberFormat("vi-VN")`: 1000 renders `1.000`. **Do not `parseInt`.**
  Assert on the exact rendered string, or strip `.` before parsing.
- `aria-pressed` is hardcoded `false` and there is no `likedByMe` anywhere — liked state is invisible
  in the DOM. Assert on the count only.
- The like button is disabled **only** when `currentUserId === kudos.senderId`. There is no
  "authored by me" text on the card — locate the own-kudos card by its seeded content string.
- `performLikeToggle` swallows every error. A failed like produces **no UI signal** — an assertion on
  an unchanged count is the only detection, so a failure will read as "count did not change".
- On successful submit the client refetches page 1 (offset 0, limit 20) and then closes the modal.
  The new kudos is newest-first, so it lands at the top of the feed.

## Requirements

Rewrite per the approved rule: **fix the tests to match real behavior, never add features to match
the tests.**

| # | Test | What it must assert |
|---|---|---|
| 1 | composer opens | click `ghi-nhan-button` → `composer-modal` visible, URL still `/sun-kudos` |
| 2 | submit gating | `composer-submit` disabled → +recipient still disabled → +content still disabled → +hashtag enabled |
| 3 | cancel closes | click `composer-cancel` → `composer-modal` hidden, no new card |
| 4 | valid submit | fill all three, submit → modal closes → a card with the unique content string appears at the top of `kudos-feed` |
| 5 | **rewritten** like toggle | click `like-button` on Binh's kudos (`bbbb…`) → count +1 → click again → count back to the original. (Was: "button becomes disabled" — false; it is a toggle.) |
| 6 | **rewritten** own kudos | locate the card whose content is An's seeded kudos (`aaaa…`) → its `like-button` is disabled. (Was: looked for a nonexistent "by me"/"Tôi" indicator, and the whole body sat inside `if (visible)` — vacuously passing.) |

## Architecture / test data discipline

- Test 4 writes a real row. Use a per-run unique content string (`E2E submit ${Date.now()}`) so
  repeated runs never collide and no cleanup is required. Do **not** invent recipient data — pick a
  recipient by searching a seeded name ("Binh").
- Test 5 mutates like state but is self-reversing (like then un-like), so it leaves the fixture as it
  found it. Test 6 is read-only. They target different cards, so `fullyParallel` is safe.
- No `page.route()` anywhere. No mocked auth. If a test needs a session it gets it from `storageState`.

## Related Code Files

- Modify: `e2e/sun-kudos-authenticated.spec.ts` — **the only file this phase owns.**

Keep it under 200 lines. If the six tests plus the phase-03 smoke test exceed that, split by feature:
`e2e/kudos-composer.spec.ts` and `e2e/kudos-like.spec.ts`.

## Implementation Steps

1. Delete every `page.route(/auth\/v1\/user/)` block and every `test.fixme` wrapper and its reason string.
2. Add a small `openComposer(page)` helper at the top of the file — used by tests 1–4 (DRY).
3. Write tests 1–4 against the phase-04 testids.
4. Write test 5: read the count text from the target card's `like-button`, click, `expect` the text to
   become count+1 (use `expect(locator).toHaveText` so Playwright retries), click again, expect the
   original. Strip `.` before numeric comparison.
5. Write test 6: `page.getByTestId('kudos-card').filter({ hasText: '<An seeded content>' })` →
   `getByTestId('like-button')` → `toBeDisabled()`. No `if (visible)` guard — the card must exist, and
   its absence is a real failure.
6. Run against a freshly seeded DB.

## Todo List

- [ ] all `test.fixme` and `page.route` removed
- [ ] `openComposer` helper
- [ ] tests 1–4 rewritten against testids
- [ ] test 5 rewritten as like→unlike
- [ ] test 6 rewritten, no conditional body
- [ ] no `waitForTimeout` anywhere
- [ ] file < 200 lines (or split)

## Success Criteria

- `npm run db:reset:dev && npx playwright test` → exit `0`, **0 skipped**, and the authenticated
  project reports 6 (+1 smoke) passed.
- `grep -c "test.fixme\|page.route\|waitForTimeout" e2e/` → `0`.
- `npx playwright test --repeat-each=3 --project=chromium-auth` → exit `0` (flake check).

## Risk Assessment

| Risk | L | I | Countermove |
|---|---|---|---|
| Like count assertion flakes on the async refetch | Med | Med | `toHaveText` auto-retry, never a manual read-compare |
| Test 5's two clicks race under parallel workers | Low | High | Only test 5 touches `bbbb…`; `--repeat-each=3` is the check |
| Submitted rows accumulate across runs and shift the feed | Med | Low | Unique per-run content; assertions locate by string, never by index |
| Strict-mode multiple matches on `/Gửi/i` | Med | Low | Testids only — no text queries for buttons |
| Silent like failure reads as a count assertion timeout | Med | Med | Note it in the test comment so the next reader looks at the server action, not the locator |

## Rollback

`git checkout e2e/` — returns to the phase-03 split with the bodies untouched. The fixmes can be
restored from HEAD if the auth mechanic turns out unusable.

## Security Considerations

- The tests act as a real authenticated user against a local DB only. Nothing points at the hosted project.
- Never print the storageState contents in a failure message.

## Next Steps

Phase 07 runs the whole gate. Phase 06 is independent and can land before or after.
