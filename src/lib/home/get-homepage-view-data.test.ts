import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { getHomepageViewData, DEFAULT_EVENT_DATETIME } from "./get-homepage-view-data";

jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(),
}));

const mockedCreateClient = jest.mocked(createClient);

function mockGetUser(user: Pick<User, "app_metadata"> | null, error: Error | null = null) {
  const client = {
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user }, error }),
    },
    // Test double only needs the `auth.getUser` surface this module reads;
    // the real client type has hundreds of unrelated members.
  } as unknown as Awaited<ReturnType<typeof createClient>>;

  mockedCreateClient.mockResolvedValue(client);
}

describe("getHomepageViewData", () => {
  const originalEventDatetime = process.env.EVENT_DATETIME;

  afterEach(() => {
    jest.clearAllMocks();
    if (originalEventDatetime === undefined) {
      delete process.env.EVENT_DATETIME;
    } else {
      process.env.EVENT_DATETIME = originalEventDatetime;
    }
  });

  it("returns unauthenticated + default role when there is no session", async () => {
    mockGetUser(null);
    process.env.EVENT_DATETIME = "2026-12-01T09:00:00.000Z";

    const result = await getHomepageViewData();

    expect(result.isAuthenticated).toBe(false);
    expect(result.role).toBe("user");
  });

  it("returns unauthenticated when Supabase reports an error", async () => {
    mockGetUser(null, new Error("network error"));
    process.env.EVENT_DATETIME = "2026-12-01T09:00:00.000Z";

    const result = await getHomepageViewData();

    expect(result.isAuthenticated).toBe(false);
    expect(result.role).toBe("user");
  });

  it("returns authenticated + role \"user\" for a regular user", async () => {
    mockGetUser({ app_metadata: {} });
    process.env.EVENT_DATETIME = "2026-12-01T09:00:00.000Z";

    const result = await getHomepageViewData();

    expect(result.isAuthenticated).toBe(true);
    expect(result.role).toBe("user");
  });

  it("returns authenticated + role \"admin\" for an admin user", async () => {
    mockGetUser({ app_metadata: { role: "admin" } });
    process.env.EVENT_DATETIME = "2026-12-01T09:00:00.000Z";

    const result = await getHomepageViewData();

    expect(result.isAuthenticated).toBe(true);
    expect(result.role).toBe("admin");
  });

  it("passes through a valid EVENT_DATETIME", async () => {
    mockGetUser(null);
    process.env.EVENT_DATETIME = "2026-12-01T09:00:00.000Z";

    const result = await getHomepageViewData();

    expect(result.eventDatetime).toBe("2026-12-01T09:00:00.000Z");
  });

  it("falls back to the documented default when EVENT_DATETIME is unset", async () => {
    mockGetUser(null);
    delete process.env.EVENT_DATETIME;

    const result = await getHomepageViewData();

    expect(result.eventDatetime).toBe(DEFAULT_EVENT_DATETIME);
  });

  it("falls back to the documented default when EVENT_DATETIME is invalid", async () => {
    mockGetUser(null);
    process.env.EVENT_DATETIME = "not-a-date";

    const result = await getHomepageViewData();

    expect(result.eventDatetime).toBe(DEFAULT_EVENT_DATETIME);
  });

  it("never throws even when Supabase client creation fails", async () => {
    mockedCreateClient.mockRejectedValue(new Error("missing env vars"));
    process.env.EVENT_DATETIME = "2026-12-01T09:00:00.000Z";

    const result = await getHomepageViewData();

    expect(result.isAuthenticated).toBe(false);
    expect(result.role).toBe("user");
  });
});
