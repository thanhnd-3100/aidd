# Phase B2 — Track B: /todo stub route

**Track:** B (generic `implementer`) · **Depends on:** B1

## MoMorph refs
- Login: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/GzbNeVGJHz (redirect target only — no design for /todo yet)
- Clarifications: plans/260907-1317-login-screen/clarifications.md
- testPolicy: e2e-red-first

## Goal
Minimal `src/app/todo/page.tsx`: session-protected (unauthenticated → `redirect('/login')`), renders a plain placeholder ("Todo — coming soon") so the login redirect has a real, working destination.

## Out of scope
- Any real /todo feature content, design, or data model — this is a stub landing target only, per clarifications decision. A future plan owns the actual page.

## Tests
Unit test: unauthenticated request to `/todo` redirects to `/login`; authenticated request renders the placeholder.

## Status: DONE

Minimal `src/app/todo/page.tsx` implemented: session-protected (unauthenticated → redirect to `/login`), renders placeholder text ("Todo — coming soon"). Unit test passes. Route serves as working redirect target for the `/login` flow.
