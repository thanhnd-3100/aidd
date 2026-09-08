# Phase A2 — Track A (section: hero): Keyvisual + Countdown + Event Info + CTA

**Track:** A, section mode (`momorph-ui-implementer` only) · **Depends on:** T-RED · **Runs concurrently with:** A1, A3, A4, B1 · **Status:** ✅ completed

## MoMorph refs
- Homepage: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/i87tDx10uM
- Clarifications: plans/260907-1545-home-screen/clarifications.md
- testPolicy: e2e-red-first

## Goal
Build the hero section per spec items 3.5, 3.5-Keyvisual BG, B1, B1.2, B1.3, B1.3.1-3, B2, B3, B3.1-2: full-bleed background, "ROOT FURTHER" title, "Coming soon" subtitle, live countdown (DAYS/HOURS/MINUTES, 2-digit zero-padded), event info block, and the two CTA buttons.

## Owned files (disjoint from A1/A3/A4)
`src/components/home/hero/**`, `src/components/home/countdown/**`, `src/components/home/cta/**`, `src/messages/home/hero.json`

## Out of scope
- Reading `EVENT_DATETIME` from env — Countdown is a **client component** taking `targetDatetime: string (ISO-8601)` as a prop; Track B/integration passes the real value from the server.
- Navigation targets' actual pages — CTAs just link to `/awards-information` and `/sun-kudos` (B0 stubs).

## Integration contract
- `Countdown` component: `{ targetDatetime: string }` — computes days/hours/minutes remaining client-side, updates every ~30s (not every second — spec only requires minute-granularity), zero-pads to 2 digits, clamps at `00`/`00`/`00` when `targetDatetime` is in the past and hides the "Coming soon" subtitle in that case (parent, not Countdown itself, controls the subtitle — Countdown only exposes an `isPast: boolean` via a render-prop or the parent recomputes independently; keep this simple, don't over-engineer a shared-state library for one boolean).
- Invalid `targetDatetime` (unparseable): render a static fallback (e.g. `00 / 00 / 00` with no crash) — never throw.
- `HeroCta` component: two buttons, "ABOUT AWARDS" (primary/yellow) and "ABOUT KUDOS" (outline), each a plain link to their stub route — no click-handler props needed, this is pure navigation.
- Populate `src/messages/home/hero.json` as `{ "vi": { "title": "ROOT FURTHER", "comingSoon": ..., "eventInfo": {...}, "cta": {...} }, "en": {...} }`.

## Test policy
`e2e-red-first`. Use Figma design content as mock data source — do not invent data. `testRunner: playwright`, `redTestFiles/redCommand/redExitCode/redFailure/redEvidence` passed from T-RED, read-only.

## Completion Note
Hero section built with full-bleed keyvisual background, "ROOT FURTHER" title, countdown component (3 two-digit zero-padded fields updating ~every 30s), event date/location/livestream info, and two CTA buttons. Countdown handles invalid/missing datetime gracefully with fallback. Client-side update mechanism implemented. All section-owned files completed: hero components, countdown hook, CTA button, and hero.json message partials (vi/en).
