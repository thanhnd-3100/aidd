# Phase A1 — Track A: Login screen presentational UI

**Track:** A (`momorph-ui-implementer` only) · **Depends on:** T-RED (reads redEvidence) · **Runs concurrently with:** B1

## MoMorph refs
- Login: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/GzbNeVGJHz
- Clarifications: plans/260907-1317-login-screen/clarifications.md
- testPolicy: e2e-red-first

## Goal
Build the static Login screen components exactly per the Figma spec (8 design items: header/logo/language selector, hero visual, intro content block, Google login button, footer), wired to `next-intl` message keys — no auth logic, no OAuth call.

## Out of scope
- Supabase OAuth call, session check, redirect logic (Track B / integration owns wiring the `onClick` to real auth).
- `/todo` route content (phase B3).
- Deciding final auth redirect target — component only exposes an `onLoginClick` prop.

## Integration contract
- `src/components/login/*` exports `LoginHeader`, `LoginHero`, `LoginFooter`, composed by `LoginScreen` which takes `{ onLoginClick, isLoading, errorMessage }` props.
- Language dropdown reads/writes the `NEXT_LOCALE` cookie itself (self-contained) per `src/i18n/request.ts` from B0.
- Populate `src/messages/vi.json` / `en.json` with this screen's strings (title, subtitle, tagline, button label, error message) — use Figma content as the literal copy source, do not invent text.

## Test policy
`e2e-red-first` (per clarifications). Use Figma design content as mock data source — do not invent data. `testRunner: playwright`, `redTestFiles/redCommand/redExitCode/redFailure/redEvidence` passed from T-RED, read-only.

## Status: DONE

All login screen components built per Figma spec: header (logo + nav), language selector (VN/EN dropdown), hero section (title "ROOT FURTHER" + subtitle + tagline), Google OAuth button, footer. Components located in `src/components/login/`, wired to next-intl message keys, and composed in `LoginScreen` component. Messages populated in `src/messages/vi.json` and `src/messages/en.json` using Figma content as source. No auth logic or OAuth calls — those are Track B concerns.
