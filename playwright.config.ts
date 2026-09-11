import { existsSync } from "node:fs";
import path from "node:path";
import { defineConfig } from "@playwright/test";

// The webServer's `npm run dev` picks up `.env.local` itself (Next.js does
// this automatically), but the setup project's own Node process — which
// signs in directly against Supabase — needs the same vars in *this*
// process too. Loaded once here, before workers are spawned, so they
// inherit it.
const envLocalPath = path.resolve(process.cwd(), ".env.local");
if (existsSync(envLocalPath)) {
  process.loadEnvFile(envLocalPath);
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
    },
  },
});
