# Phase B0 — Setup: Playwright, Supabase SDK, next-intl

**Track:** B (generic `implementer`) · **Depends on:** none · **Blocks:** B1, T-RED

## MoMorph refs
- Login: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/GzbNeVGJHz
- Clarifications: plans/260907-1317-login-screen/clarifications.md
- testPolicy: e2e-red-first

## Goal
Install and wire the three pieces of infra this screen needs: `@playwright/test` (E2E runner), `@supabase/ssr` + `@supabase/supabase-js` (auth client), `next-intl` (i18n).

## Out of scope
- Any screen UI or page logic (Track A / B1+).
- URL-based locale routing (`[locale]` segments) — use `next-intl` in cookie-only mode (`NEXT_LOCALE` cookie, no `getRequestConfig` route prefix) since the spec never shows a locale in the URL and this avoids restructuring `src/app`.

## Steps
1. `npm i @supabase/ssr @supabase/supabase-js next-intl` + `npm i -D @playwright/test` and `npx playwright install --with-deps chromium`.
2. `playwright.config.ts` at repo root: `testDir: "e2e"`, `webServer` block running `npm run dev` against `http://localhost:3000`, single `chromium` project (no cross-browser matrix needed yet).
3. Add `"test:e2e": "playwright test"` to `package.json` scripts.
4. `src/lib/supabase/client.ts` (browser client) and `src/lib/supabase/server.ts` (server client using `next/headers` cookies) per `@supabase/ssr` App Router pattern.
5. `.env.local.example` documenting `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (matches `supabase/config.toml`).
6. `src/i18n/request.ts` (next-intl config reading locale from `NEXT_LOCALE` cookie, fallback `vi`) and `src/messages/vi.json` / `src/messages/en.json` (empty shells — content added in A1/B2).
7. Wrap `src/app/layout.tsx` in `NextIntlClientProvider`.

## Success criteria
- `npm run build` and `npx tsc --noEmit` pass.
- `npx playwright test` runs (0 tests found is fine at this point — proves the runner works).
- No existing route (`/`) breaks.

## Status: DONE

Playwright, Supabase SDK, and next-intl installed and wired per spec. Build, tsc, lint all clean. Existing `/` route verified unaffected. See [implementer-260907-1323-phase-b0-setup-infra.md](./reports/implementer-260907-1323-phase-b0-setup-infra.md).
