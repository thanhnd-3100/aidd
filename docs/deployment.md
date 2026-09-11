# Deployment

## Platform: Vercel

Project `aidd` under the `thanhnd-3100` scope. Next.js is auto-detected — there is no
`vercel.json`, and adding one with SPA-style `rewrites` would break the App Router.

## URL

- Production: <https://aidd-black.vercel.app>
- Also aliased: `aidd-thanhnd-3100.vercel.app`

**Deployment Protection (Vercel Authentication) is ON** (`ssoProtection: all_except_custom_domains`).
Only members of the Vercel team can open a `*.vercel.app` URL; everyone else is bounced to
`vercel.com/sso-api`. This is deliberate — the app is a personal demo, not a public service.
To change it: `npx vercel project protection disable --sso` (or Vercel dashboard →
Settings → Deployment Protection).

## Deploy Command

```bash
npx vercel@latest --prod
```

CLI deploys straight from the working tree. The repo is not connected to Vercel's git
integration, so pushing to GitHub does not trigger a deploy.

## Environment Variables

Only three are needed in Production — the app reads exactly four `process.env` keys and
the fourth is deliberately left unset:

| Variable | Value | Why |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | hosted Supabase project URL | data + auth |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | hosted publishable key | data + auth |
| `EVENT_DATETIME` | `2025-09-08T18:30:00+07:00` | countdown target |
| `PRELAUNCH_GATE_ENABLED` | **unset on purpose** | see below |

Do **not** set `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`. The app never reads them — they
configure the *local* gotrue via `supabase/config.toml`. The hosted project's Google provider
is configured in the Supabase dashboard.

`PRELAUNCH_GATE_ENABLED` is tri-state (`src/lib/prelaunch/gate.ts`): `"true"` forces the gate on,
`"false"` forces it off, anything else falls back to date logic against `EVENT_DATETIME`. That
date is in the past, so the gate resolves off on its own. Setting it to `"true"` redirects every
route to `/countdown`.

## Supabase auth configuration (required for login)

Google always redirects to `https://<project>.supabase.co/auth/v1/callback`, never to the app
domain. The app domain must instead be allow-listed in **Supabase → Authentication → URL
Configuration**:

- Site URL: `https://aidd-black.vercel.app`
- Additional Redirect URLs: `https://aidd-black.vercel.app/**` and `http://localhost:3000/**`

Miss this and login on Vercel silently returns the user to `localhost:3000`.

## `output: "standalone"` — the one real gotcha

`next.config.ts` sets `output: "standalone"` **only when not building on Vercel**:

```ts
...(process.env.VERCEL ? {} : { output: "standalone" as const }),
```

The Dockerfile copies the standalone output, so it cannot simply be removed. But on Vercel the
build compiles fine and then dies in Vercel's `onBuildComplete` step with:

```
Error: ENOENT: no such file or directory, open '/vercel/path0/.next/next-server.js.nft.json'
```

Vercel does its own output tracing; standalone mode never emits that trace file. Vercel sets
`VERCEL=1` during the build, which is what the conditional keys off.

## Database migrations

Not part of the deploy. Vercel never touches the schema. Apply migrations by hand:

```bash
npx supabase@latest link --project-ref <project-ref>
npx supabase@latest db push
```

Never run `supabase config push` — `supabase/config.toml` carries `[auth.email] enable_signup = true`
for local Playwright runs, and pushing it would enable email signup on the hosted project, which
is meant to be Google-OAuth-only. Never apply `supabase/seeds/dev/` to hosted either; it inserts
fake users straight into `auth.users`.

## Rollback

```bash
npx vercel@latest rollback <deployment-url>
npx vercel@latest ls --prod        # list recent production deployments
```

## Notes

Vercel's Hobby plan is free but non-commercial only. This app carries Sun* branding; if it ever
serves the company rather than a personal demo, it needs Pro.

`vercel link` appends `VERCEL_OIDC_TOKEN` to `.env.local` and adds a broad `.env*` line to
`.gitignore`. A `!.env*.example` negation was added afterwards so the committed example files
stay trackable.
