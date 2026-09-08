# Phase B0 — Setup: PRELAUNCH_GATE_ENABLED env var + Docker build-arg wiring

**Track:** B (generic `implementer`) · **Depends on:** none · **Blocks:** B1, T-RED, A1 · **Status:** COMPLETED ✓

## MoMorph refs
- Countdown Prelaunch: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/8PJQswPZmU
- Clarifications: plans/260908-1417-countdown-prelaunch-screen/clarifications.md
- testPolicy: e2e-red-first

## Goal
Add the `PRELAUNCH_GATE_ENABLED` toggle (default off) and wire it through Docker's build-arg mechanism, since it will be read inside `middleware.ts` (Edge Runtime) — the exact class of "env var frozen empty in the Docker-built Edge Runtime bundle" bug already hit twice this project for the Supabase vars (`plans/reports/260908-docker-build-guard/`).

## Steps
1. `.env.local.example` and `.env.local`: add `PRELAUNCH_GATE_ENABLED=false` (server-only, no `NEXT_PUBLIC_` prefix — the client never needs to know this).
2. `Dockerfile`'s builder stage: add `ARG PRELAUNCH_GATE_ENABLED` + `ENV PRELAUNCH_GATE_ENABLED=$PRELAUNCH_GATE_ENABLED`, mirroring the existing `NEXT_PUBLIC_SUPABASE_URL` pattern exactly (right next to it, before `RUN npm run build`). Do NOT add it to the build-time guard's `[ -z ... ]` check — an empty/unset value must default safely to "off" (gate inactive), unlike the Supabase vars which must hard-fail if missing.
3. `docker-compose.yml`: add `PRELAUNCH_GATE_ENABLED: ${PRELAUNCH_GATE_ENABLED}` to the `web` service's `build.args`, matching the existing entries.
4. Verify `env_file: .env.local` (already present) covers this var for container runtime too (belt-and-suspenders alongside the build arg, though only the build-arg copy matters for middleware's Edge Runtime bundle).

## Out of scope
- Any gate logic itself (routing decisions, middleware integration) — Phase B1.
- `EVENT_DATETIME` — untouched, not read by middleware, no Docker wiring needed for it (only `get-homepage-view-data.ts`, a regular Node.js Server Component, reads it).

## Success criteria
- `npx tsc --noEmit`, `npm run build` pass.
- `npm run docker:up` still builds and runs cleanly with the new var present (default `false`) — verify with a real `docker compose --env-file .env.local build` + a request to `/`, confirming no gate redirect fires by default.
- Existing `/login`, `/todo`, `/awards-information` routes and their tests unaffected.

## Completion Note

✓ All environment files updated (`.env.local.example`, `.env.local`)
✓ `Dockerfile` build-arg wiring in place (`ARG PRELAUNCH_GATE_ENABLED` + `ENV PRELAUNCH_GATE_ENABLED=$PRELAUNCH_GATE_ENABLED`)
✓ `docker-compose.yml` updated with build args
✓ `npm run build` passes with middleware detection (`ƒ Proxy (Middleware)`)
✓ `npm run docker:up` verified with gate off (default safe state)
✓ Zero regressions to existing routes
