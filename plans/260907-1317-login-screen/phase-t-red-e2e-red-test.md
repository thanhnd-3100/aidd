# Phase T-RED — Tester: write the RED E2E test

**Track:** Tester (owns executable E2E only) · **Depends on:** B0 · **Blocks:** A1, B1 (both read `redEvidence` read-only)

## MoMorph refs
- Login: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/GzbNeVGJHz
- Clarifications: plans/260907-1317-login-screen/clarifications.md
- testPolicy: e2e-red-first

## Goal
Before any implementation, `tester` writes one durable screen-level E2E test at `e2e/login.spec.ts` from the downloaded test cases + clarifications, and runs it to a real non-zero-exit RED (page doesn't exist / assertions fail — not a config/dependency error).

## Test coverage (from test cases, see download_test_cases CSV in this session)
- Unauthenticated user can reach `/login`; page shows logo, VN language selector, hero title "ROOT FURTHER", "LOGIN With Google" button.
- Clicking the login button triggers the Google OAuth flow (assert navigation away from `/login` or popup opens) and the button becomes disabled with a loading indicator.
- Authenticated user visiting `/login` is redirected to `/todo`.
- Language selector opens a dropdown on click.

## Out of scope
- Mocking real Google credentials — stub Supabase OAuth response at the network layer per project convention (Playwright route interception), not real Google sign-in.
- Visual assertions (colors, spacing) — that's tester's post-implementation visual-validation step, not this RED test.

## Record and pass forward (read-only to Track A/B)
`redTestFiles: [e2e/login.spec.ts]`, `redCommand: npx playwright test e2e/login.spec.ts`, `redExitCode`, `redFailure`.

## Status: DONE

Real RED achieved: `e2e/login.spec.ts` written and run to exit code 1 (all 7 tests fail, as expected — `/login` route and elements do not exist). Test coverage includes all spec scenarios (render, dropdown, button state, OAuth flow, auth redirect). See [tester-260907-1334-red-e2e-test.md](./reports/tester-260907-1334-red-e2e-test.md).
