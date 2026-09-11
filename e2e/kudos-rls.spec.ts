import { readFileSync } from "node:fs";
import path from "node:path";
import { test, expect, request, type APIRequestContext } from "@playwright/test";

/**
 * Proves the self-like RLS hole (phase 06) is closed at the database, not
 * only in the app-layer check in `src/lib/kudos/toggle-like.ts:42`.
 *
 * These requests go straight to PostgREST with a real user access token
 * (dumped by `e2e/auth.setup.ts` into `playwright/.auth/an-token.json`) —
 * never the service key, which bypasses RLS entirely and would prove
 * nothing. Runs in `chromium-auth`, which depends on the `setup` project.
 */

const TOKEN_PATH = path.join(process.cwd(), "playwright/.auth/an-token.json");

// Seed fixture ids (see supabase/seeds/dev/001_kudos_dev_seed.sql).
const AN_ID = "11111111-1111-1111-1111-111111111111";
const BINH_ID = "22222222-2222-2222-2222-222222222222";
const KUDOS_BY_AN = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"; // sender An, receiver Binh
const KUDOS_BY_BINH = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"; // sender Binh, receiver Chi

let apiContext: APIRequestContext;

test.beforeAll(async () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!supabaseUrl || !publishableKey) {
    throw new Error(
      "kudos-rls.spec: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY must be set."
    );
  }

  let accessToken: string;
  try {
    const raw = JSON.parse(readFileSync(TOKEN_PATH, "utf-8"));
    if (typeof raw.access_token !== "string" || raw.access_token.length === 0) {
      throw new Error("access_token missing or empty");
    }
    accessToken = raw.access_token;
  } catch (error) {
    throw new Error(
      `kudos-rls.spec: could not read a valid access token from ${TOKEN_PATH} ` +
        `(has the "setup" project run?): ${(error as Error).message}`
    );
  }

  apiContext = await request.newContext({
    baseURL: supabaseUrl,
    extraHTTPHeaders: {
      apikey: publishableKey,
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });
});

test.afterAll(async () => {
  await apiContext.dispose();
});

test("self-like is rejected by RLS", async () => {
  const response = await apiContext.post("/rest/v1/kudos_likes", {
    data: { kudos_id: KUDOS_BY_AN, user_id: AN_ID },
  });

  expect(response.status(), await response.text()).toBeGreaterThanOrEqual(400);
  expect(response.status()).toBeLessThan(500);
  const body = await response.json();
  expect(body.code).toBe("42501");
});

test("liking someone else's kudos still succeeds (not over-tightened)", async () => {
  const insertResponse = await apiContext.post("/rest/v1/kudos_likes", {
    data: { kudos_id: KUDOS_BY_BINH, user_id: AN_ID },
    headers: { Prefer: "return=representation" },
  });

  expect(insertResponse.status(), await insertResponse.text()).toBe(201);

  // Restore the fixture — leave kudos_likes exactly as found.
  const deleteResponse = await apiContext.delete("/rest/v1/kudos_likes", {
    params: { kudos_id: `eq.${KUDOS_BY_BINH}`, user_id: `eq.${AN_ID}` },
  });
  expect(deleteResponse.status(), await deleteResponse.text()).toBe(204);
});

test("forged like user_id (liking as another user) is rejected", async () => {
  const response = await apiContext.post("/rest/v1/kudos_likes", {
    data: { kudos_id: KUDOS_BY_BINH, user_id: BINH_ID },
  });

  expect(response.status(), await response.text()).toBeGreaterThanOrEqual(400);
  expect(response.status()).toBeLessThan(500);
  const body = await response.json();
  expect(body.code).toBe("42501");
});

test("forged sender_id on kudos insert is rejected", async () => {
  const response = await apiContext.post("/rest/v1/kudos", {
    data: {
      sender_id: BINH_ID,
      receiver_id: AN_ID,
      content: "RLS proof: forged sender must be rejected",
      hashtags: ["rls-proof"],
    },
  });

  expect(response.status(), await response.text()).toBeGreaterThanOrEqual(400);
  expect(response.status()).toBeLessThan(500);
  const body = await response.json();
  expect(body.code).toBe("42501");
});
