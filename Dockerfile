# syntax=docker/dockerfile:1

FROM node:24-alpine AS base
WORKDIR /app

# ---- Dependencies ----
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# ---- Build ----
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1

# NEXT_PUBLIC_* vars are inlined into the client bundle at build time, so they
# must be passed as build args (via docker-compose.yml's build.args), not just
# set at container runtime.
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=$NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

# PRELAUNCH_GATE_ENABLED is read by middleware.ts (Edge Runtime) — same
# "frozen empty at build time" hazard as the Supabase vars above, so it must
# also be passed as a build arg. It is server-only (no NEXT_PUBLIC_ prefix)
# and is intentionally NOT part of the fail-fast guard below: an
# unset/empty value must default safely to "gate off", not fail the build.
ARG PRELAUNCH_GATE_ENABLED
ENV PRELAUNCH_GATE_ENABLED=$PRELAUNCH_GATE_ENABLED

# EVENT_DATETIME is also read by middleware.ts (Edge Runtime) to drive the
# date-based prelaunch gate fallback — same build-arg treatment as
# PRELAUNCH_GATE_ENABLED above. Server-only, intentionally NOT part of the
# fail-fast guard below: missing/invalid must default safely to "gate off".
ARG EVENT_DATETIME
ENV EVENT_DATETIME=$EVENT_DATETIME

# GOOGLE_CLIENT_ID/SECRET are not read by this app (Supabase's own
# auth.external.google provider reads them) and aren't needed by `next
# build`, but are accepted here so docker-compose.yml can pass them as
# build args without Docker warning about unconsumed args.
ARG GOOGLE_CLIENT_ID
ARG GOOGLE_CLIENT_SECRET

# Fail the BUILD, not a production request, when these are missing. Without
# this check, `docker compose build`/`up --build` run without `--env-file
# .env.local` (Compose's own default is a file literally named `.env`, which
# this project doesn't use) silently produces an image whose Edge Runtime
# middleware bundle has these values frozen in as empty strings — every
# request then throws "Missing Supabase environment variables" at runtime
# with no indication the build itself was the problem. See README.md#docker.
RUN if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY" ]; then \
      echo "ERROR: NEXT_PUBLIC_SUPABASE_URL and/or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY build args are empty." >&2; \
      echo "Use 'npm run docker:up' (not a bare 'docker compose up --build'/'docker build') so these are passed from .env.local." >&2; \
      exit 1; \
    fi

RUN npm run build

# ---- Runtime ----
FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]
