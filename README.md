# aidd

Next.js (App Router, TypeScript) app.

## Development

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Environment Variables

Copy `.env.local.example` to `.env.local` and fill in:

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (see `supabase/config.toml`) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable (public) key |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID, configured on the Supabase project's `auth.external.google` provider |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `EVENT_DATETIME` | ISO-8601 target datetime for the homepage countdown (server-only, no `NEXT_PUBLIC_` prefix). Falls back to a fixed default when unset or invalid — see `src/lib/home/get-homepage-view-data.ts`. |

`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `GOOGLE_CLIENT_ID`, and
`GOOGLE_CLIENT_SECRET` are required for `/login` (Google sign-in via Supabase) and any page behind
the session middleware (`/`, `/todo`, `/awards-information`, `/sun-kudos`, `/admin-dashboard`).
`EVENT_DATETIME` is optional. See [docs/authentication.md](docs/authentication.md) for how the
pieces fit together, including the role/authorization model.

## Testing

```bash
npm test              # run once
npm run test:watch    # watch mode
npm run test:coverage # with coverage report
```

Tests use Jest + React Testing Library, configured via `next/jest` in `jest.config.ts`.

### E2E Tests

```bash
npm run test:e2e
```

Runs Playwright (`playwright.config.ts`) against `http://localhost:3000`, starting `npm run dev`
automatically if nothing is already listening there. Requires the environment variables above —
without them the app throws on the routes Playwright visits. Specs live in `e2e/`.

## Docker

Requires `.env.local` to exist first (see [Environment Variables](#environment-variables)).

```bash
npm run docker:up
```

**Always use `npm run docker:up`, not a plain `docker compose up --build`.** `NEXT_PUBLIC_*` vars
(and even server-only ones read by `middleware.ts`, which runs in the Edge Runtime) get baked into
the build at compile time — Next.js's Edge Runtime bundle does not read live container env at
request time the way normal Node.js server code does. Compose only substitutes `.env.local` values
into `build.args` when told to via `--env-file .env.local`; it otherwise silently falls back to a
(nonexistent) `.env` file, passes empty build args, and the middleware bundle gets compiled with
nothing — which throws `Missing Supabase environment variables` at request time even though
`docker exec <container> env` shows the right values (misleadingly, since env_file DOES set the
container's runtime env correctly — it just doesn't fix what was already frozen into the build).
`npm run docker:up` wraps the correct `--env-file .env.local` flag so this can't be forgotten.
The Dockerfile also guards this at build time: `docker build`/`docker compose build` now fails
immediately with a clear error if `NEXT_PUBLIC_SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
is empty, pointing you back to `npm run docker:up` — so skipping it is caught at build time instead
of surfacing as a confusing runtime error later.

Need a clean rebuild (e.g. after changing the Dockerfile or dependencies)? Use `npm run docker:rebuild`
instead of a plain `docker compose build --no-cache` — the plain form skips `--env-file .env.local` and
hits the same build guard.

Runtime env vars (including server-only ones like `GOOGLE_CLIENT_SECRET` and `EVENT_DATETIME`) are
also loaded via `env_file: .env.local` in `docker-compose.yml` for the parts of the app that do read
live process env (regular Node.js Server Components/Route Handlers). `npm run docker:down` stops it.

Or with plain Docker (pass the same build args and an env file manually):

```bash
docker build \
  --build-arg NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL \
  --build-arg NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=$NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY \
  -t aidd-nextapp .
docker run -p 3000:3000 --env-file .env.local aidd-nextapp
```

The app listens on http://localhost:3000. The image uses Next.js's `output: "standalone"` build for a minimal production runtime.
