# Phase A4 — Track A (section: promo): Sun* Kudos block + Widget button

**Track:** A, section mode (`momorph-ui-implementer` only) · **Depends on:** T-RED · **Runs concurrently with:** A1, A2, A3, B1 · **Status:** ✅ completed

## MoMorph refs
- Homepage: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/i87tDx10uM
- Clarifications: plans/260907-1545-home-screen/clarifications.md
- testPolicy: e2e-red-first

## Goal
Build the Sun* Kudos promo block (spec D1/D2/D2.1) and the floating widget button (spec item 6).

## Owned files (disjoint from A1/A2/A3)
`src/components/home/kudos/**`, `src/components/home/widget-button/**`, `src/messages/home/promo.json`

## Out of scope
- Sun* Kudos page content — "Chi tiết" links to `/sun-kudos` (B0 stub).
- Real widget menu actions — per clarifications, the menu is a placeholder shell ("Coming soon"), not real functionality.

## Integration contract
- `KudosPromo`: label "Phong trào ghi nhận", title "Sun* Kudos", description, illustration/background image, "Chi tiết" button linking to `/sun-kudos`.
- `WidgetButton`: fixed-position pill (105×64px per spec) bottom-right, pencil icon + SAA icon separated by "/", click toggles a small menu panel with one placeholder line ("Coming soon"). Self-contained open/close state (like the language selector) — no external props needed.
- Populate `src/messages/home/promo.json` as `{ "vi": { "kudos": {...}, "widget": {...} }, "en": {...} }`.

## Test policy
`e2e-red-first`. Use Figma design content as mock data source — do not invent data. `testRunner: playwright`, `redTestFiles/redCommand/redExitCode/redFailure/redEvidence` passed from T-RED, read-only.

## Completion Note
Sun* Kudos promo block and floating widget button built. Widget button (105×64px, bottom-right) contains self-managed open/close state for placeholder menu ("Coming soon"). Kudos block includes label, title, description, illustration, and "Chi tiết" link to `/sun-kudos` stub. All section-owned files completed: kudos/widget-button components and promo.json message partials (vi/en).
