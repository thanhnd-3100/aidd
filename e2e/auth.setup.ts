import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { test as setup } from "@playwright/test";
import { createServerClient } from "@supabase/ssr";
import { DEV_USERS } from "../scripts/dev-seed-user-list";

/**
 * Produces a real, server-accepted authenticated `storageState` for An
 * (seed user `1111…`) so `chromium-auth` tests hit `/sun-kudos` already
 * logged in — `page.route()` stubbing can't reach the Server Component's
 * `supabase.auth.getUser()` check, only a real session cookie can.
 *
 * The cookie name/chunking is never hand-serialized: a stub in-memory jar is
 * handed to `createServerClient`, `signInWithPassword` runs against it, and
 * `@supabase/ssr`'s own `setAll` decides what gets written and under what
 * name — this file never references a literal cookie name.
 */

const AUTH_DIR = path.join(process.cwd(), "playwright/.auth");
const STORAGE_STATE_PATH = path.join(AUTH_DIR, "an.json");
const TOKEN_PATH = path.join(AUTH_DIR, "an-token.json");

const AN = DEV_USERS[0];

setup("authenticate as An", async ({ page, baseURL }) => {
  if (!baseURL) {
    throw new Error("setup: no baseURL configured on the Playwright project.");
  }

  // Gate assertion first: `reuseExistingServer` can silently attach to a
  // stale dev server that still has the prelaunch gate on, which would make
  // every "authenticated" test below actually run against /countdown.
  const gateCheck = await fetch(`${baseURL}/sun-kudos`, { redirect: "manual" });
  if (gateCheck.status >= 300 && gateCheck.status < 400) {
    throw new Error(
      "setup: prelaunch gate is ON for the dev server under test (GET /sun-kudos " +
        `returned ${gateCheck.status}). Stop the stale dev server on this port or ` +
        "set PRELAUNCH_GATE_ENABLED=false."
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!supabaseUrl || !publishableKey) {
    throw new Error(
      "setup: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY must be set " +
        "(see .env.local.example)."
    );
  }

  const jar = new Map<string, string>();
  const supabase = createServerClient(supabaseUrl, publishableKey, {
    cookies: {
      getAll() {
        return Array.from(jar.entries()).map(([name, value]) => ({ name, value }));
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          jar.set(name, value);
        }
      },
    },
  });

  const { data, error } = await supabase.auth.signInWithPassword({
    email: AN.email,
    password: AN.password,
  });

  if (error || !data.session) {
    throw new Error(
      `setup: signInWithPassword failed for ${AN.email}: ${error?.message ?? "no session returned"}`
    );
  }

  await page.context().addCookies(
    Array.from(jar.entries()).map(([name, value]) => ({
      name,
      value,
      domain: "localhost",
      path: "/",
      httpOnly: true,
      secure: false,
      sameSite: "Lax" as const,
    }))
  );

  mkdirSync(AUTH_DIR, { recursive: true });
  await page.context().storageState({ path: STORAGE_STATE_PATH });

  // Phase 06 needs the raw access token for direct PostgREST calls (RLS
  // proof tests) — kept in the same gitignored directory, never logged.
  writeFileSync(
    TOKEN_PATH,
    JSON.stringify({ access_token: data.session.access_token }, null, 2),
    "utf-8"
  );
});
