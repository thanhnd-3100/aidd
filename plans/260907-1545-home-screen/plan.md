---
status: delivered
work_type: feature
spec_waived: true
testPolicy: e2e-red-first
momorph:
  fileKey: 9ypp4enmFmdK3YAFJLIu6C
  screens:
    - name: "Homepage SAA"
      screenId: i87tDx10uM
blockedBy: []
blocks: []
---

# Plan: Home Screen ("/") — SAA 2025

MoMorph screen: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/i87tDx10uM
Clarifications: [clarifications.md](./clarifications.md)

## Summary

Build the "/" route: SAA 2025 homepage with auth-aware header (nav, language, notification bell,
account menu), hero with a live countdown to the event + CTAs, a "Root Further" theme block, a
6-category awards grid, a Sun* Kudos promo, a floating widget button, and footer. Replaces the
default Next.js starter homepage.

Larger surface than the login screen (46 spec items, 62 test cases). Links to two pages that don't
exist yet (Awards Information, Sun* Kudos) get minimal stub routes with real anchor ids so
hash-scroll navigation works; a `role` field is added (Supabase user_metadata) to gate a stubbed
Admin Dashboard; the notification bell is a visual-only stub (no backend); the widget button opens
an empty placeholder menu. See clarifications.md for the full reasoning on each.

MoMorph `design_status: in_progress` — content/behavior specs are `completed`, but Track A must
re-pull live design data (`get_frame_image`/`get_node`) at build time rather than trust anything
cached from this planning session.

## Test Policy

`e2e-red-first` — countdown auto-update, multiple dropdown behaviors, role-based menu branching,
and hash-anchor navigation are real state transitions. Runner already exists from the login-screen
plan (`plans/260907-1317-login-screen/`, delivered).

## Phases

| Phase | Track | Depends on | Status | File |
|---|---|---|---|---|
| B0 — Setup (env var, role field, stub routes, i18n merge) | B | — | completed | [phase-b0-infra-and-stubs.md](./phase-b0-infra-and-stubs.md) |
| T-RED — Tester writes RED E2E test | Tester | B0 | completed | [phase-t-red-e2e-red-test.md](./phase-t-red-e2e-red-test.md) |
| A1 — Section: chrome (Header + Footer) | A | T-RED | completed | [phase-a1-chrome-header-footer.md](./phase-a1-chrome-header-footer.md) |
| A2 — Section: hero (Keyvisual + Countdown + CTA) | A | T-RED | completed | [phase-a2-hero-countdown-cta.md](./phase-a2-hero-countdown-cta.md) |
| A3 — Section: content (Root Further + Awards grid) | A | T-RED | completed | [phase-a3-content-awards-grid.md](./phase-a3-content-awards-grid.md) |
| A4 — Section: promo (Sun* Kudos + Widget button) | A | T-RED | completed | [phase-a4-kudos-widget.md](./phase-a4-kudos-widget.md) |
| B1 — Session/role data layer | B | B0, T-RED | completed | [phase-b1-session-role-data.md](./phase-b1-session-role-data.md) |
| I1 — Integration & GREEN | — | A1, A2, A3, A4, B1 | completed | [phase-i1-integration.md](./phase-i1-integration.md) |

A1-A4 and B1 all run concurrently once T-RED hands off `redEvidence` — 4 bounded `momorph-ui-implementer`
section jobs with **disjoint file ownership** (component dirs + separate message-partial files per
section, see clarifications.md), per MoMorph's section-mode fan-out allowance for large screens.

## Key Dependencies

- Reuses `src/lib/supabase/{client,server}.ts` and the session-check pattern from the login-screen
  plan — no new Supabase client code needed, only a new role-reading helper (B0).
- `src/i18n/request.ts` (from the login plan) is extended, not replaced, to merge in the new
  per-section message partials under a `home` namespace.
- `/awards-information`, `/sun-kudos`, `/admin-dashboard` are stub routes created by this plan
  (B0) — full content for each is future work.

## Delivered

**Final Status:** All phases completed and verified. Reviewer verdict: **SEALED**, score 9, zero critical findings, human signed off.

**E2E Test Scope:** 10 of 14 tests pass for real (layout, unauthenticated state, countdown, CTAs, awards grid + hash-anchor navigation, language switch, footer, widget button). 4 tests quarantined via `test.fixme()` — server-side Supabase auth checks are unobservable via Playwright's browser-level `page.route()`. This is the same class of documented gap as the login screen's OAuth-navigation issue, per clarifications.md.

**Security Fix:** During review, a privilege-escalation path was found and closed — role is read from `app_metadata` (service-role-writable only), not `user_metadata` (client-writable). All unit tests updated and passing.

**Key Delivery Artifacts:**
- `/` homepage: header, hero, countdown, CTAs, awards grid (6 cards), kudos promo, widget button, footer
- `/awards-information`: stub with 6 anchor-tagged sections (per award category)
- `/sun-kudos`: minimal stub
- `/admin-dashboard`: role-gated stub
- `e2e/home.spec.ts`: 10 passing + 4 documented-gap assertions
- All checks pass: tsc, build, lint, jest (60 tests), playwright (home + login together)

## Unresolved Questions

None — all blocking decisions resolved in [clarifications.md](./clarifications.md).
