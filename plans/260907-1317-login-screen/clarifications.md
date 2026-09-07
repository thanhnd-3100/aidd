# Clarifications — Login Screen (MoMorph GzbNeVGJHz)

Screen: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/GzbNeVGJHz

## Session 2026-09-07

- Q: Specs/test-cases describe real behavior (OAuth redirect, disabled/loading button, dropdown, auth-redirect guard) which normally selects `e2e-red-first` — but no `@playwright/test` runner exists in this repo. How should the plan handle this? → A: Add Playwright as a Track B setup phase; run full `e2e-red-first` (RED before code, GREEN after) for this screen.
- Q: The Supabase project already has Google OAuth configured (`auth.external.google` enabled, `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`). What should Track B use to integrate the login button with it? → A: `@supabase/ssr` + `@supabase/supabase-js` (SSR-aware client, cookie session, `signInWithOAuth('google')`).
- Q: Spec says successful login redirects to `/todo`; authenticated users visiting `/login` redirect to the "main application page." Neither route exists yet. What should this plan cover? → A: Stub `/todo` as the landing page (minimal, session-protected placeholder). Full page content is a future plan.
- Q: The language selector (VN/EN, cookie `NEXT_LOCALE`) implies real i18n. How deep should this plan go? → A: Full `next-intl` setup, VN+EN strings for this screen, reusable foundation for future screens. (Implementation note: cookie-only locale detection, no `[locale]` URL segment — matches the spec's cookie-based behavior and avoids restructuring existing routes; see phase-b0.)

## Session 2026-09-07 (takumi execution)

- Q: 3 of 7 E2E assertions (loading/disabled state on click, OAuth navigate-away, authenticated-user redirect to `/todo`) can't be observed in Playwright — Supabase's OAuth flow does a real top-level browser navigation that destroys the page before those states can be checked, and faking an authenticated session needs Supabase SSR's exact cookie format. Underlying logic is already unit-tested (13 passing tests: session-guard, OAuth error mapping, callback route). How to proceed? → A: Accept 4/7 E2E (render, dropdown, error message, footer) + the existing unit tests as sufficient coverage; do not invest further engineering time refactoring for full E2E observability of the OAuth redirect. Visual validation (desktop + mobile) against the MoMorph frame passed for both flagged fidelity concerns (hero background gradient approximation, text-based hero title).

## Resolved without asking (reasonable defaults, non-blocking)

- Accessibility: no explicit spec/test-case requirement. Default to semantic HTML, keyboard-operable dropdown and button, visible focus states (WCAG AA baseline) — no dedicated audit phase.
- Error display: OAuth failure message ("Đăng nhập không thành công. Vui lòng thử lại.") renders as an inline message near the login button — no toast library exists in the repo and none is warranted for one message.
