# Phase B0 — Setup: env var, role field, stub routes, i18n merge

**Track:** B (generic `implementer`) · **Depends on:** none · **Blocks:** T-RED, all A-phases, B1 · **Status:** ✅ completed

## MoMorph refs
- Homepage: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/i87tDx10uM
- Clarifications: plans/260907-1545-home-screen/clarifications.md
- testPolicy: e2e-red-first

## Goal
Lay the infra this screen needs before any UI/behavior code: countdown env var, user role field, three stub destination routes, and the i18n message-merge structure that lets Track A sections write disjoint message files.

## Steps
1. Add `EVENT_DATETIME` (ISO-8601, e.g. `2025-12-31T18:30:00+07:00`) to `.env.local.example` and `.env.local`. NOT `NEXT_PUBLIC_` — read server-side only.
2. `src/lib/auth/get-user-role.ts`: reads `role` from the Supabase user's `user_metadata` (default `"user"` when absent). No new DB table — Supabase `auth.users.user_metadata` is sufficient for this stage.
3. Update `src/i18n/request.ts` to deep-merge `src/messages/{vi,en}.json` (existing login namespace) with `src/messages/home/{chrome,hero,content,promo}.json` (each shaped `{ vi: {...}, en: {...} }`) into one messages tree, all four home partials nested under a `home` top-level key. Create the four files now as empty shells (`{ "vi": {}, "en": {} }`) so Track A sections have a file to own and edit.
4. Stub routes (plain content, no MoMorph design — do not over-build):
   - `src/app/awards-information/page.tsx`: heading + one `<section id="...">` per award category slug: `top-talent`, `top-project`, `top-project-leader`, `best-manager`, `signature-2025-creator`, `mvp`. Each section just needs a heading matching the category name — real content is a future plan.
   - `src/app/sun-kudos/page.tsx`: plain placeholder page ("Sun* Kudos — coming soon").
   - `src/app/admin-dashboard/page.tsx`: role-gated via `get-user-role.ts` — non-admins (`role !== "admin"`) redirected to `/`; placeholder content for admins.
5. Unit tests: `get-user-role.ts` (default + explicit role), each stub route's redirect/render behavior.

## Out of scope
- Any real award/kudos/admin content — placeholders only, per clarifications.
- Notification backend — none exists, none is added here (visual-only stub is Track A's job).

## Success criteria
- `npx tsc --noEmit`, `npm run build`, `npx jest src` all pass.
- Existing `/login`, `/todo` routes and their tests unaffected.
- The four `src/messages/home/*.json` shell files exist and `request.ts` merges them without error (verify by temporarily rendering `useTranslations("home")` returns an object, even if empty).

## Completion Note
All steps completed successfully. EVENT_DATETIME env var added, role field sourced from Supabase app_metadata (service-role-writable, not user_metadata), three stub routes created with anchor-tagged sections for awards-information, and i18n message-merge structure in place. `tsc`, `npm run build`, `npx jest src` all pass.
