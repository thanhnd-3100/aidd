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
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID, configured on the Supabase project's `auth.external.google` provider |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |

These are required for `/login` (Google sign-in via Supabase) and any page behind the session
middleware (`/todo`). See [docs/authentication.md](docs/authentication.md) for how the pieces
fit together.

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

Build and run with Docker Compose:

```bash
docker compose up --build
```

Or with plain Docker:

```bash
docker build -t aidd-nextapp .
docker run -p 3000:3000 aidd-nextapp
```

The app listens on http://localhost:3000. The image uses Next.js's `output: "standalone"` build for a minimal production runtime.
