# Phase 04 — Composer test hooks + hashtag-bound DRY

## Context Links

- `src/components/kudos/composer/kudos-composer.tsx`
- `src/lib/kudos/create-kudos.ts`
- `supabase/migrations/20260908165400_kudos_schema.sql` (the `1..5` check constraint)
- Depends on: nothing. Can run in parallel with 01–03.

## Overview

- **Priority:** P2
- **Status:** deferred (by user decision)
- **Goal:** give the composer stable test hooks and retire one duplicated constant. No behavior change.

**Deferral reason:** Plan `260911-1143-viet-kudo-screen` will restructure `src/components/kudos/composer/**`
and delete the free-typed hashtag interaction. Implementing testids + fixing tests here would result in
writing phase 05 tests twice. Phase 04/05 remain on hold until the Viết Kudo screen is integrated; both
will likely need rework at that point.

## Key Insights

- The composer has **no `data-testid` at all** today. Role/label queries are viable but brittle here:
  `/Gửi/i` matches the submit button, the "Đang gửi..." state, *and* the `h2` title "Gửi lời cám
  ơn…" → Playwright strict mode fails. Recipient suggestions are `<button>` in a `ul role="listbox"`
  with **no `role="option"`**. Testids are the cheaper, honest choice. Decision: **testids**, applied
  consistently across all six tests.
- Hashtag bounds `1..5` are stated in three places: the composer, `create-kudos.ts`, and the DB check
  constraint. Two of those are TS and can collapse to one. The DB constraint necessarily stays — it is
  the only one that survives a bypassed server action.

## Requirements

Functional:
- New testids: `composer-modal`, `recipient-input`, `recipient-option`, `content-input`,
  `hashtag-input`, `composer-submit`, `composer-cancel`.
- `MIN_HASHTAGS`/`MAX_HASHTAGS` defined once in TS, imported by both consumers.

Non-functional:
- Zero rendered-output change beyond the attributes. Existing aria-labels stay (accessibility is not
  being traded for testability).
- `kudos-composer.tsx` is ~230 lines today — already over the 200-line guidance. Extracting the
  constants trims it slightly; if it is still over, split the hashtag-chip group into
  `kudos-composer-hashtags.tsx` in this phase rather than leaving the file oversized.

## Architecture

```
src/lib/kudos/kudos-constraints.ts   ← single TS source of MIN/MAX_HASHTAGS
        ├── kudos-composer.tsx  (re-exports for existing importers)
        └── create-kudos.ts
DB check constraint                  ← independent, intentionally duplicated
```

## Related Code Files

- Create: `src/lib/kudos/kudos-constraints.ts`
- Modify: `src/components/kudos/composer/kudos-composer.tsx`
- Modify: `src/lib/kudos/create-kudos.ts`
- Modify: existing composer unit test (add testid assertions)
- Possibly create: `src/components/kudos/composer/kudos-composer-hashtags.tsx` (only if over 200 lines)

**Owned exclusively by this phase.** No other phase touches `src/`.

## Implementation Steps

1. `kudos-constraints.ts` exporting `MIN_HASHTAGS = 1`, `MAX_HASHTAGS = 5` with a comment naming the
   DB check constraint as the third, deliberate copy.
2. Import it in both consumers; keep `kudos-composer.tsx`'s existing `export { MAX_HASHTAGS, MIN_HASHTAGS }`
   as a re-export so no importer breaks.
3. Add the seven testids. `recipient-option` goes on each suggestion `<button>`.
4. Extend the composer unit test: each testid present when open, `composer-submit` disabled until
   recipient + content + ≥1 hashtag.
5. `npx tsc --noEmit && npm test && npm run lint`.

## Todo List

- [ ] constants module
- [ ] both consumers import it
- [ ] seven testids added
- [ ] unit test extended
- [ ] file size checked; split only if needed

## Success Criteria

- `npx tsc --noEmit` → exit `0`.
- `npm test` → exit `0`, suite count ≥ 180 tests (nothing lost).
- `npm run lint` → exit `0`, warning count still 4 (no new warnings).
- `wc -l src/components/kudos/composer/*.tsx` → every file < 200.

## Risk Assessment

| Risk | L | I | Countermove |
|---|---|---|---|
| Splitting the component breaks a snapshot/unit test | Low | Med | Split only if the line count forces it; run `npm test` before and after |
| Re-export removed and an importer breaks | Low | Low | tsc catches it |
| Testids drift from what phase 05 queries | Med | Med | The seven names above are the contract; phase 05 uses exactly these |

## Rollback

`git checkout src/` and delete `kudos-constraints.ts`. Purely additive — nothing depends on it until
phase 05.

## Security Considerations

None. `data-testid` leaks no data; the values are static strings.

## Next Steps

Phase 05 queries these testids. Do not rename them afterwards.
