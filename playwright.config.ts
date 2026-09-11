import { existsSync } from "node:fs";
import path from "node:path";
import { defineConfig } from "@playwright/test";

// The suite runs against the LOCAL Supabase stack, while the app itself runs
// against the hosted project via `.env.local`. `.env.e2e` holds the local
// values and is loaded here — before workers spawn — so the setup project's
// own Node process (which signs in directly against Supabase) inherits them.
// Falls back to `.env.local` so a checkout without `.env.e2e` still resolves
// something rather than failing with an opaque "missing env var".
const envPath = [".env.e2e", ".env.local"]
  .map((f) => path.resolve(process.cwd(), f))
  .find((f) => existsSync(f));
if (envPath) {
  process.loadEnvFile(envPath);
}

/**
 * Port is overridable so a stale server already bound to the default (e.g. the
 * `docker compose` web container) can't be picked up by `reuseExistingServer`
 * and silently serve old code to the suite.
 */
const port = Number(process.env.PLAYWRIGHT_PORT ?? 3000);
const baseURL = `http://localhost:${port}`;

const AUTH_STATE_PATH = "playwright/.auth/an.json";

export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "html",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "setup",
      testMatch: /auth\.setup\.ts/,
      use: { browserName: "chromium" },
    },
    {
      name: "chromium-public",
      // Every spec except the setup file and the authenticated-only kudos
      // specs — this keeps the pre-existing unauthenticated suites (home,
      // login, countdown, awards-information) running exactly as before.
      testIgnore: [
        /\.setup\.ts$/,
        /sun-kudos-authenticated\.spec\.ts$/,
        /kudos-rls\.spec\.ts$/,
      ],
      use: { browserName: "chromium" },
    },
    {
      name: "chromium-auth",
      // kudos-rls.spec.ts makes direct PostgREST calls with the access
      // token the "setup" project dumps to playwright/.auth/an-token.json —
      // it needs that dependency, not the storageState cookies.
      testMatch: [/sun-kudos-authenticated\.spec\.ts$/, /kudos-rls\.spec\.ts$/],
      use: { browserName: "chromium", storageState: AUTH_STATE_PATH },
      dependencies: ["setup"],
    },
  ],
  webServer: {
    command: `npm run dev -- --port ${port}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    env: {
      PRELAUNCH_GATE_ENABLED: "false",
      // Next.js loads `.env.local` (hosted project) on its own, but it never
      // overrides a variable already present in the environment — so these
      // pin the server under test to the local stack. Without them the suite
      // would sign in against local Supabase while the page it drives reads
      // the hosted one, and every authenticated assertion would fail.
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "",
    },
  },
});
