# Phase A1 — Track A (section: chrome): Header + Footer

**Track:** A, section mode (`momorph-ui-implementer` only) · **Depends on:** T-RED · **Runs concurrently with:** A2, A3, A4, B1 · **Status:** ✅ completed

## MoMorph refs
- Homepage: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/i87tDx10uM
- Clarifications: plans/260907-1545-home-screen/clarifications.md
- testPolicy: e2e-red-first

## Goal
Build the Header (A1 in spec: logo, nav links About/Awards/Sun* Kudos, notification bell, language selector, account icon+menu) and Footer (item 7: logo, nav links, copyright) — presentational only, per Figma spec items A1, A1.1-A1.8, 7, 7.1-7.5.

## Owned files (disjoint from A2/A3/A4)
`src/components/home/header/**`, `src/components/home/footer/**`, `src/messages/home/chrome.json`

## Out of scope
- Session/role data fetching — Header takes `{ isAuthenticated, role, activeSection }` as props (Track B/integration wires real values).
- Notification panel content beyond a placeholder ("No notifications yet") — no backend, per clarifications.
- Awards Information / Sun* Kudos page content — those are Phase B0's stub routes, just link to them.

## Integration contract
- `Header` component: `{ isAuthenticated: boolean; role: "user" | "admin"; activeLink?: "about" | "awards" | "kudos" }`. Renders notification bell + account icon only when `isAuthenticated`. Account menu: Profile + Sign out always; + Admin Dashboard when `role === "admin"` (links to `/admin-dashboard`, already stubbed by B0).
- Nav links: "About SAA 2025" → `/` (home itself, active/selected state); "Awards Information" → `/awards-information`; "Sun* Kudos" → `/sun-kudos`.
- Language selector: reuse the exact same self-contained VN/EN cookie-toggle pattern already built in `src/components/login/language-selector.tsx` — do not reinvent, extract/reuse if reasonable, or duplicate minimally if extraction isn't worth it for one component.
- Footer: logo click → `/` + scroll to top; same 3 nav links as header; copyright text "Bản quyền thuộc về Sun* © 2025".
- Populate `src/messages/home/chrome.json` as `{ "vi": { "header": {...}, "footer": {...} }, "en": { "header": {...}, "footer": {...} } }`.

## Test policy
`e2e-red-first`. Use Figma design content as mock data source — do not invent data. `testRunner: playwright`, `redTestFiles/redCommand/redExitCode/redFailure/redEvidence` passed from T-RED, read-only.

## Completion Note
Header and Footer components built with auth-conditional notification bell and account menu (showing Admin Dashboard only for admins). Language selector reused from login screen. All section-owned files completed: header/footer/account-menu/language-selector components and chrome.json message partials (vi/en). Integrated cleanly with other A-phase sections and B1 data layer.
