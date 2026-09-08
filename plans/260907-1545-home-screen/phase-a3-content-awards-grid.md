# Phase A3 — Track A (section: content): Root Further content + Awards grid

**Track:** A, section mode (`momorph-ui-implementer` only) · **Depends on:** T-RED · **Runs concurrently with:** A1, A2, A4, B1 · **Status:** ✅ completed

## MoMorph refs
- Homepage: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/i87tDx10uM
- Clarifications: plans/260907-1545-home-screen/clarifications.md
- testPolicy: e2e-red-first

## Goal
Build the "Root Further" theme content block (spec B4) and the Awards section (spec C1 header + C2/C2.1-C2.6 grid of 6 category cards).

## Owned files (disjoint from A1/A2/A4)
`src/components/home/root-further/**`, `src/components/home/awards-grid/**`, `src/messages/home/content.json`

## Out of scope
- Awards Information page content — cards link to `/awards-information#<slug>` (B0 stub with matching anchor ids).

## Integration contract
- `RootFurtherContent`: static block — decorative "ROOT"/"FURTHER" background typography, body paragraphs, the English proverb quote. Pure presentational, no props needed beyond translated strings.
- `AwardsGrid`: renders 6 `AwardCard`s from a local const array (title, description, slug) — do NOT invent per-category descriptions beyond what MoMorph specs provide (only "Top Talent" has a real description in the downloaded specs: "Vinh danh top cá nhân xuất sắc trên mọi phương diện"; the other 5 have empty description fields in the spec — use the same is-empty description gracefully, e.g. omit the description line rather than fabricating text). Slugs (matching B0's anchor ids exactly): `top-talent`, `top-project`, `top-project-leader`, `best-manager`, `signature-2025-creator`, `mvp`.
- Each `AwardCard`: image/title/"Chi tiết" link all navigate to `/awards-information#{slug}`; hover = lift + border/glow (per spec). Grid: 3 columns desktop, 2 tablet, 1 mobile (per test cases ID-15/16).

## Test policy
`e2e-red-first`. Use Figma design content as mock data source — do not invent data (see the description-gap note above — leave absent fields absent, don't invent). `testRunner: playwright`, `redTestFiles/redCommand/redExitCode/redFailure/redEvidence` passed from T-RED, read-only.

## Completion Note
"Root Further" theme content block and 6-card awards grid built. Each award card links to `/awards-information#{slug}` with hash-anchor navigation. Grid responsive: 3 columns desktop, 2 tablet, 1 mobile. Card descriptions honored spec data (only "Top Talent" has description; others left empty as per spec). All section-owned files completed: root-further/awards-grid components, award card, and content.json message partials (vi/en). Selector refinement applied during visual validation to avoid strict-mode violations.
