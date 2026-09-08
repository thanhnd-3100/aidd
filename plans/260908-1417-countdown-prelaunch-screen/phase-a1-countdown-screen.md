# Phase A1 — Track A: Countdown Prelaunch presentational UI

**Track:** A (`momorph-ui-implementer`, screen mode) · **Depends on:** T-RED · **Status:** COMPLETED ✓

## MoMorph refs
- Countdown Prelaunch: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/8PJQswPZmU
- Clarifications: plans/260908-1417-countdown-prelaunch-screen/clarifications.md
- testPolicy: e2e-red-first

## Goal
Build the presentational screen per spec items 0.1 (background), 0.2 (title), 1/2/3 (Days/Hours/Minutes LED-style countdown units). Component takes `{ targetDatetime: string }` as its only prop — no page/routing/gate logic here.

## Owned files
`src/components/countdown/**`, `src/messages/countdown.json` (new namespace — check `src/i18n/request.ts`'s existing merge pattern for `login`/`home`/`awards-information` and add this one the same straightforward way)

## Out of scope
- `src/app/countdown/page.tsx` and reading `EVENT_DATETIME` — integration phase (I1) owns wiring the real env value in.
- The gate/middleware logic — Phase B1.
- Real-time wall-clock testing — this component just needs correct math and formatting.

## Integration contract
- `CountdownScreen({ targetDatetime }: { targetDatetime: string })`: full-bleed background (dark, organic pattern + semi-transparent dark overlay per spec, cover/no-repeat), centered title (`t("title")`, VI/EN via next-intl), and 3 LED-digit units (DAYS/HOURS/MINUTES) below it.
- **Tick interval: every 1 second** (per this screen's spec — "auto-updates every second" — differs deliberately from the home screen's hero countdown, which ticks every ~30s per its own spec; do not force these two screens to share one hook/interval, a small dedicated hook here is fine).
- Zero-pad to 2 digits; clamp Hours to 00–23 and Minutes to 00–59 (matches the spec's explicit valid ranges — this is a display concern of the component itself, not the day/hour/minute math, which naturally produces values in range from a correct remaining-time calculation).
- Invalid/unparseable `targetDatetime`, or a datetime already in the past: render `00`/`00`/`00` for all three units, never throw.
- Check `src/components/home/countdown/use-countdown.ts` (delivered, home-screen plan) for the existing remaining-time calculation pattern before writing a new one — reuse the math approach if it fits cleanly with a 1s interval; a small, separate hook is acceptable if adapting the existing one is awkward (KISS — don't force an abstraction across two unrelated feature directories for ~15 lines of logic).

## Test policy
`e2e-red-first`. Use Figma design content as mock data source — do not invent data. `testRunner: playwright`, `redTestFiles/redCommand/redExitCode/redFailure/redEvidence` passed from T-RED, read-only.

## Completion Note

✓ `CountdownScreen` component built with full-bleed background, locale-aware title, and 3 LED-digit countdown units
✓ 1-second tick interval implemented (per this screen's spec, deliberately different from home screen's ~30s)
✓ Zero-padding to 2 digits, Hours clamped 00–23, Minutes clamped 00–59
✓ Invalid/past datetimes render 00/00/00 safely (no throw)
✓ `src/messages/countdown.json` added with VI/EN translations ("Sự kiện sẽ bắt đầu sau" / "Event starts in")
✓ Integrated into i18n request pattern (followed existing `login`/`home`/`awards-information` merge)
✓ Code builds clean, no lint errors, matches Figma design at desktop and mobile widths
✓ Track A handoff: presentational UI ready for integration
