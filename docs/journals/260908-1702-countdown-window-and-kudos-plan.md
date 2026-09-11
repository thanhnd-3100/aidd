# Countdown window shrink, double bug fix, and Kudos blueprint crisis

**Date**: 2026-09-08 17:02
**Severity**: high
**Component**: prelaunch gate, countdown screen, database schema
**Status**: resolved

## What Happened

Three concurrent threads this session, each surfacing genuine friction:

1. **Prelaunch gate window reduced** — User request: shrink the early-access window from 24 hours to 1 hour before the event. This went cleanly: changed `LAUNCH_WINDOW_MS` in `src/lib/prelaunch/gate.ts` from `24 * 60 * 60 * 1000` to `60 * 60 * 1000` (line 5), RED-first boundary test caught a false-positive (test passed against BOTH old and new logic), fixed the test to a genuine "2 hours before" discriminator, implementation landed and passed all jest/tsc/eslint/build/playwright.

2. **Countdown screen "stuck at 00:00" bug** — Appeared twice with identical user report but different root causes:
   - **Round 1 (environment):** `.env.local`'s `PRELAUNCH_GATE_ENABLED=true` was forcing the gate on regardless of `EVENT_DATETIME` — the user set this to debug something, forgot to flip it back, and now `/countdown` rendered forever. This is the **fourth or fifth occurrence** of this exact misconfiguration this session/project. The real sting: `PRELAUNCH_GATE_ENABLED` is a tri-state (`true`/`false`/unset`) but the user keeps treating `true` as "feature enabled" rather than "force-gate-on-ignore-date". Secondary discovery during debugging: stale Docker container (`aidd-web-1`) squatting on port 3000 with old baked-in code, silently feeding Playwright's `reuseExistingServer` tests against obsolete logic. Fixed via `docker compose down`.
   - **Round 2 (genuine code bug):** `src/components/countdown/countdown-screen.tsx` computed `isPast` via `useCountdown()` hook but never consumed it. The countdown ticked client-side, reached `isPast: true` once timer hit zero, but nothing ever navigated the guest away from `/countdown` — they just sat looking at `00:00` forever. RED-first test confirmed this: 0 calls to `router.replace()` before the fix. Implementation: added `useEffect` keyed on `isPast` to call `router.replace("/")` (lines 74-78). Verified GREEN. **Gotcha for next time:** if `PRELAUNCH_GATE_ENABLED=true` ever coexists with a past `EVENT_DATETIME`, this client-side redirect could flicker against server-side middleware forcing back onto `/countdown` — worth a defensive look if the override problem recurs.

3. **Sun* Kudos board plan created** — `/tkm:create-plan` for two MoMorph screens (live board + composer modal). This is the project's **first real Supabase schema** — `supabase/migrations/` was empty until now. The Figma spec is ambitious: spotlight word-cloud, secret-box gamification, leaderboards, rich-text composer with @mentions, image upload. Scope Challenge via `AskUserQuestion`: user chose SCOPE REDUCTION. Resulting plan `plans/260908-1654-sun-kudos-board/plan.md` (6 phases) covers only: submit a kudos (recipient autocomplete + plain text + hashtag chips), view paginated feed, like/unlike with "no self-like" + "one like per user" rules. Everything else deferred to follow-up. Proposed `profiles`/`kudos`/`kudos_likes` tables with RLS mirroring existing "public read, gated write" pattern.

## The Brutal Truth

The countdown window change was trivial and clean — but it exposed that the red-first boundary test itself wasn't sharp enough to catch the difference (it passed when it shouldn't have). Fixing a test is fine; realizing you wrote a test that can't discriminate between old and new logic is annoying.

The round-1 countdown bug stung because it wasn't a bug at all — it was the user re-triggering the same environment override they've hit multiple times now. That's a communication/UX issue that code review can't catch. We're patching the symptom (user forgets to flip the toggle), not the root (the tri-state semantics are opaque).

The stale Docker container discovery was worse — we were genuinely testing against the wrong code. How many times has Playwright validated something that never actually shipped because the container was out of date? This needs a tighter pre-test ritual.

Round 2 was a real defect and catches it's small enough to feel like a careless omission: consume the value you calculate. But at least the test caught it cleanly.

The Kudos plan scope challenge landed as expected (the project hadn't touched schema before, so this was the moment to push back), but it surfaces a bigger concern: the current stack is still stateless/env-driven. Moving to real schema, real data, real RLS... this is the jump from "decorated website" to "actual application."

## Technical Details

**Window reduction:**
- `src/lib/prelaunch/gate.ts:5` changed from `24 * 60 * 60 * 1000` to `60 * 60 * 1000`
- Gate logic unchanged; same `shouldGate()`, same tri-state semantics
- Updated `docs/authentication.md` to reflect new window
- All jest (121/121 passing), tsc, eslint, build, and Playwright (22 passed, 16 skips, 0 failed) pass

**Countdown screen redirect:**
- `src/components/countdown/countdown-screen.tsx:74-78` added `useEffect`:
  ```typescript
  useEffect(() => {
    if (isPast) {
      router.replace("/");
    }
  }, [isPast, router]);
  ```
- Hook `useCountdown()` already returns `isPast: true` when timer reaches zero (lines 24–25 in `use-countdown.ts`: `remainingMs <= 0`)
- RED-first test: confirmed 0 calls before fix, 1+ calls after fix
- GREEN on all suites

**Kudos schema proposal (deferred implementation):**
- `profiles`: mirror of `auth.users` (id, email, name), synced via trigger, public read RLS
- `kudos`: (id, sender_id, recipient_id, content, hashtags, created_at), RLS: auth select all, insert as self, update/delete as author
- `kudos_likes`: (id, kudos_id, user_id, created_at), RLS: auth select all, one-per-user constraint via unique index
- First time project uses schema; all other screens were env-driven or static

## What We Tried

**Window reduction:**
- Initial boundary test: passed against both old and new code (false positive)
- Reworked test to "2h before launch" → fails old code, passes new code ✓
- Deployed, verified via three Docker production cycles (unset+2d, unset+12h, force-false)

**Round-1 countdown bug (misconfiguration):**
- User reported "countdown stuck at 00:00" — seemed like code defect
- Traced `.env.local` override: `PRELAUNCH_GATE_ENABLED=true` forcing gate on, unrelated to countdown code
- User flipped override to `false` → immediately resolved
- Stale Docker container also discovered and cleared (`docker compose down`)

**Round-2 countdown bug (code defect):**
- Same report from user; environment override now off
- Checked `countdown-screen.tsx`: hook computes `isPast` but never reads it
- Traced issue: when timer reaches `remainingMs <= 0`, `useCountdown()` returns `isPast: true`, but component does nothing
- Added `useEffect` to redirect when `isPast` flips ✓
- RED-first test confirmed fix
- Verified GREEN

**Kudos plan:**
- Ran Scope Challenge: user was shown three option levels (minimal, recommended, full)
- User chose scope reduction (minimal) to ship something faster
- Deferred: hashtag filters, leaderboards, word-cloud, secret-box, rich-text/@mentions, image upload, detail pages, profile integration

## Root Cause Analysis

**Window reduction:** Non-issue; this was a feature request, not a defect. The test gap (false positive) signals we need sharper boundary tests going forward — a test that passes against BOTH old and new code isn't a test, it's overhead.

**Round-1 countdown bug:** Not a code bug — a recurring misconfiguration. The tri-state `PRELAUNCH_GATE_ENABLED` design (`true` = force on, `false` = force off, unset = date-driven) isn't intuitive when users are under time pressure. The override's semantics need either better naming or a different control model. This has now recurred 4–5 times this session/project.

**Round-2 countdown bug:** Careless omission in the component logic. The hook correctly signals when the countdown reaches zero; the component just never acted on it. The fix is one small `useEffect` and its dependencies. No design flaw, just incomplete implementation. The client-side/server-side redirect race (if override and date conflict) is worth monitoring but low-severity as long as we remember to test it.

**Kudos scope:** Smart call to push back before drafting. The spec vastly exceeds what the infrastructure currently supports (first schema, first multi-table RLS, first real data lifecycle). Scope reduction locks a shippable feature in 6 phases; the full spec would be 12+ and block integration until all pieces land. User chose wisely.

**Docker stale-container issue:** Part of the test infrastructure workflow — `reuseExistingServer` is faster but silently serves stale code if the container was built/started before recent code changes. Pre-test ritual needs a `docker compose down && npm run docker:up` or equivalent to guarantee fresh code.

## Lessons Learned

1. **Boundary tests must discriminate:** A test that passes against both old and new logic isn't a regression test — it's masking a gap. When reducing a time window (24h → 1h), the test itself must fail with the old constant and pass with the new one.

2. **Tri-state env overrides recur:** The `PRELAUNCH_GATE_ENABLED` misconfiguration has now happened 4–5 times. This isn't a user mistake; it's a UX/naming issue. Consider either:
   - Rename to something that screams "override": `FORCE_GATE_ON`, `BYPASS_EVENT_DATE`, etc.
   - Document the tri-state semantics in `.env.example` with explicit examples for each branch
   - Consider collapsing to two-state: either remove the override entirely and require code/env changes for lockdown, or pivot to a different control surface

3. **Consume computed values in effects:** If a hook returns state that should trigger navigation/side effects, bind it in a `useEffect`. Don't leave dangling computations.

4. **Docker container staleness is silent:** `reuseExistingServer` for Playwright is a speed win but requires a fresh container before tests that validate code changes. Add a pre-test step (`docker compose down`) or document the limitation in test setup.

5. **Scope reduction is the right move for schema debuts:** This project's first real database work should start minimal (submit + read + like), ship fast, and let the full spec (leaderboards, gamification, rich-text) land in a follow-up. Trying to ship everything at once would delay the MVP and create integration risk.

## Next Steps

1. **Round-1 pattern (override misconfiguration):** Flag this with the user directly — the override has recurred too many times for code fixes to solve. Suggest renaming or collapsing to two-state. If naming only, update `.env.example` with all three tri-state branches explicitly shown. **Owner:** user decision; pass to them for naming/control-model input.

2. **Docker pre-test ritual:** Document or enforce `docker compose down` before running Playwright when code has changed. May want to add a `npm run docker:fresh` alias or a pre-test hook that ensures container freshness. **Owner:** devops/test setup.

3. **Kudos plan execution:** Next session spawns `tester` RED (phase-t-red) and `implementer` for phase-b0 (schema + RLS) in parallel. Both feed into A1 (board UI) and A2 (composer UI) and B1 (data layer). **Owner:** /tkm:takumi against `plans/260908-1654-sun-kudos-board/`.

4. **Boundary test sharpening:** Before any future threshold changes (time windows, rate limits, batch sizes), audit the test to confirm it actually fails on the old value. **Owner:** reviewer + test author as part of code review.
