/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { updateSession } from "./middleware";

function buildRequest(url: string) {
  return new NextRequest(new Request(url));
}

jest.mock("@supabase/ssr", () => ({
  createServerClient: jest.fn(),
}));

const mockedCreateServerClient = jest.mocked(createServerClient);

const originalEnv = process.env;

beforeEach(() => {
  process.env = {
    ...originalEnv,
    NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "publishable-key",
  };
});

afterEach(() => {
  process.env = originalEnv;
  jest.clearAllMocks();
});

function mockSupabaseClient(options: {
  rotatedCookie?: { name: string; value: string };
  getUserError?: Error;
} = {}) {
  mockedCreateServerClient.mockImplementation((_url, _key, config) => {
    // The installed `@supabase/ssr` cookie adapter type is a union of
    // shapes across its supported cookie APIs; this test only needs the
    // `setAll` shape the middleware actually implements.
    const setAll = (
      config?.cookies as { setAll?: (cookiesToSet: Array<{ name: string; value: string; options: Record<string, unknown> }>) => void } | undefined
    )?.setAll;

    // Simulate a refreshed session rotating the auth cookie, exercising the
    // same `setAll` callback the middleware wires up.
    if (options.rotatedCookie) {
      setAll?.([
        {
          name: options.rotatedCookie.name,
          value: options.rotatedCookie.value,
          options: {},
        },
      ]);
    }

    return {
      auth: {
        getUser: jest.fn().mockResolvedValue(
          options.getUserError
            ? { data: { user: null }, error: options.getUserError }
            : { data: { user: { id: "user-1" } }, error: null }
        ),
      },
      // Test double only needs the `auth.getUser` surface the middleware
      // reads; the real client type has hundreds of unrelated members.
    } as unknown as ReturnType<typeof createServerClient>;
  });
}

describe("updateSession", () => {
  it("throws when Supabase environment variables are missing", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "";

    const request = buildRequest("https://app.example.com/todo");

    await expect(updateSession(request)).rejects.toThrow(
      "Missing Supabase environment variables"
    );
  });

  it("calls getUser to trigger a session refresh", async () => {
    mockSupabaseClient();

    const request = buildRequest("https://app.example.com/todo");
    await updateSession(request);

    const client = mockedCreateServerClient.mock.results[0].value as {
      auth: { getUser: jest.Mock };
    };
    expect(client.auth.getUser).toHaveBeenCalledTimes(1);
  });

  it("writes a rotated cookie onto the outgoing response", async () => {
    mockSupabaseClient({ rotatedCookie: { name: "sb-access-token", value: "new-token" } });

    const request = buildRequest("https://app.example.com/todo");
    const response = await updateSession(request);

    expect(response.cookies.get("sb-access-token")?.value).toBe("new-token");
  });

  it("still returns a response when getUser errors", async () => {
    mockSupabaseClient({ getUserError: new Error("invalid refresh token") });

    const request = buildRequest("https://app.example.com/todo");
    const response = await updateSession(request);

    expect(response).toBeDefined();
  });
});
