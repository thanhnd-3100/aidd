# Clarifications — Home Screen (MoMorph i87tDx10uM)

Screen: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/i87tDx10uM
Note: MoMorph `design_status: in_progress` (visual polish may still be evolving in Figma) but
`spec_status: done` and every spec row's `spec_progress: completed` — content/behavior specs are
final; re-pull `get_frame_image`/`get_node` at build time for the latest visual values regardless.

## Session 2026-09-07

- Q: The homepage links to "Awards Information" and "Sun* Kudos" pages (nav, footer, CTA buttons, and 6 award-category cards with hash-anchor scrolling) that don't exist yet. How to handle? → A: Minimal stub pages with anchor sections — `/awards-information` gets real id-anchored sections per award category (top-talent, top-project, top-project-leader, best-manager, signature-2025-creator, mvp) so hash-scroll works; `/sun-kudos` is a plain stub. Full content is a future plan.
- Q: Notification bell (unread badge, opens panel) has no backend. How to handle? → A: Visual-only stub — bell renders for authenticated users, click opens an empty/placeholder panel ("No notifications yet"), badge always hidden (no unread-count logic).
- Q: Account menu shows "Admin Dashboard" only for admins, but no role field exists anywhere. How to handle? → A: Add a `role` field (Supabase user_metadata, default `"user"`), branch the menu on it, but `/admin-dashboard` is a stub route (role-gated: non-admins redirected away). Establishes the pattern for later.
- Q: Floating widget button's "quick action menu" has no defined actions. How to handle? → A: Build the button + an empty/placeholder menu shell ("Coming soon") — establishes the UI pattern without inventing functionality.

## Session 2026-09-07 (takumi execution)

- Q: 4 of 14 E2E assertions (notification bell visible when authenticated, notification panel opens, account menu Profile/Sign out, Admin Dashboard menu item for admins) can't be observed in Playwright — the auth check runs server-side (Next.js server component calling Supabase in the Node process), and `page.route()` only intercepts requests from the browser context, not the server process. Same class of gap as the login screen's OAuth-navigation issue. How to proceed? → A: Accept 10/14 E2E (layout, unauthenticated state, countdown, CTAs, awards grid + hash-anchor nav, language switch, footer, widget button) + the existing unit tests covering `get-homepage-view-data.ts`'s auth/role logic. Do not invest in a real local Supabase instance for E2E at this stage.

## Architecture decisions (resolved without asking, non-blocking)

- **Section-mode Track A fan-out**: given 46 spec items / 62 test cases, Track A runs as 4 bounded `momorph-ui-implementer` section jobs with disjoint file ownership (chrome, hero, content, promo) instead of one monolithic screen job — see plan.md phase table.
- **i18n message partials to avoid concurrent-write conflicts**: each Track A section owns its own message file (`src/messages/home/{chrome,hero,content,promo}.json`, each `{ vi: {...}, en: {...} }`) instead of all sections editing the shared `vi.json`/`en.json`. `src/i18n/request.ts` (Phase B0) merges these plus the existing login messages into one tree under the `home` namespace.
- **Countdown datetime**: server-only env var `EVENT_DATETIME` (ISO-8601, not `NEXT_PUBLIC_`) read once in the server component and passed as a prop to a client Countdown component — avoids bundling it and matches test cases ID-56/57/60 (env-configured, invalid-format fallback).
- **Auth/role data flow**: mirrors the login screen's container pattern — a server component (`src/app/page.tsx`) resolves `{ isAuthenticated, role }` via the existing Supabase server client and passes it down; Track A's Header/AccountMenu components are pure presentational, taking these as props.
- **Test policy**: `e2e-red-first` — countdown auto-update, multiple dropdown open/close/keyboard behaviors, role-based menu branching, and hash-anchor navigation are all real state transitions (not hover/responsive-only). Runner already exists from the login-screen plan.
- **Existing default homepage**: `src/app/page.tsx` (Next.js starter) and its `page.test.tsx`/`page.module.css` are replaced entirely by this plan — owned by the integration phase (I1).
