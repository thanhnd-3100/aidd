# Phase A1 — Track A: Award Information presentational UI

**Track:** A (`momorph-ui-implementer`, screen mode) · **Depends on:** T-RED · **Status:** ✓ completed

## MoMorph refs
- Award Information: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/zFYDgyj_pD
- Clarifications: plans/260908-1118-award-information-screen/clarifications.md
- testPolicy: e2e-red-first

## Goal
Build the full presentational screen per spec items 3 (Keyvisual hero), A (section title), B/C/C.1-C.6 (category nav), D.1-D.6 (6 award cards), D1/D2/D2.1 (Sun* Kudos — reuse existing component). Replace the plain stub content in a new `AwardInformationScreen` component (do not touch `src/app/awards-information/page.tsx` itself — that's the integration phase's job, which will import and render this component plus wire the auth guard).

## Owned files
`src/components/awards-information/**`, `src/messages/awards-information.json` (new namespace, `{ "vi": {...}, "en": {...} }` — this screen isn't part of the `home` merge structure; add it directly to `src/i18n/request.ts`'s existing per-locale message tree the same simple way, or as its own top-level namespace — check how `login`/`home` are structured in `request.ts` and follow the same pattern, whichever requires the smaller change)

## Out of scope
- `src/app/awards-information/page.tsx` and the auth guard — integration phase (I1) owns wiring this component into the page and enforcing `redirectIfUnauthenticated`.
- Sun* Kudos block markup — reuse `src/components/home/kudos/kudos-promo.tsx` directly (`import { KudosPromo } from "@/components/home/kudos/kudos-promo"`), do not duplicate or modify it.
- Real Sun* Kudos/Admin Dashboard page content — unrelated to this screen.

## Integration contract
- `AwardInformationScreen` component: no props needed (all content is static per spec — titles, descriptions, quantities, and prize values are fixed for this screen, not dynamic/backend-driven).
- Structure: Keyvisual hero (background 1200x871 cover, title "ROOT FURTHER", subtitle "Sun* Annual Award 2025", alt text "Keyvisual Sun* Annual Award 2025") → section title block (A) → two-column layout: left sticky category nav (C, 6 items matching the existing slugs `top-talent`, `top-project`, `top-project-leader`, `best-manager`, `signature-2025-creator`, `mvp` — reuse these exact ids so any existing inbound `#slug` links keep working), right column with 6 `AwardCard`s (D.1-D.6, each `id={slug}` matching its nav item) → `<KudosPromo />` at the bottom.
- Category nav: click scrolls to the matching `#slug` section (`scrollIntoView` or anchor navigation) and sets that item's active state (gold text + underline); clicking a different item clears the previous active state. Self-contained client component state (like the existing `language-selector.tsx`/`widget-button.tsx` open/close pattern) — no external state management needed.
- Each `AwardCard`: image (336×336, from MoMorph media — do not invent placeholder art, pull the real asset via `get_media_files`/`get_frame_image`), title, description paragraph, quantity line ("Số lượng giải thưởng: X"), prize value line. Use the exact quantity/value text from the downloaded specs for all 6 categories — do not invent or round numbers.
- Populate the message file with all 6 categories' title/description/quantity/prize text (vi + faithful en translation, matching the login/home screens' precedent for missing English source copy).

## Test policy
`e2e-red-first`. Use Figma design content as mock data source — do not invent data. `testRunner: playwright`, `redTestFiles/redCommand/redExitCode/redFailure/redEvidence` passed from T-RED, read-only.
