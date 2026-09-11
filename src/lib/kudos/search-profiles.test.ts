import { createClient } from "@/lib/supabase/server";
import { searchProfiles } from "./search-profiles";

jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(),
}));

const mockedCreateClient = jest.mocked(createClient);

function mockClient(result: { data: unknown[] | null; error: Error | null }) {
  const limit = jest.fn().mockResolvedValue(result);
  const ilike = jest.fn().mockReturnValue({ limit });
  const select = jest.fn().mockReturnValue({ ilike });
  const from = jest.fn().mockReturnValue({ select });

  mockedCreateClient.mockResolvedValue({
    from,
    // Test double only needs the `from` surface searchProfiles reads; the
    // real client type has hundreds of unrelated members.
  } as unknown as Awaited<ReturnType<typeof createClient>>);

  return { from, select, ilike, limit };
}

describe("searchProfiles", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("returns matching profiles mapped to camelCase", async () => {
    mockClient({
      data: [{ id: "user-1", full_name: "Alice Smith", avatar_url: "alice.png" }],
      error: null,
    });

    const result = await searchProfiles("alice");

    expect(result).toEqual([{ id: "user-1", fullName: "Alice Smith", avatarUrl: "alice.png" }]);
  });

  it("caps results at 10 via the query builder", async () => {
    const { limit } = mockClient({ data: [], error: null });

    await searchProfiles("a");

    expect(limit).toHaveBeenCalledWith(10);
  });

  it("short-circuits on an empty query without calling the DB", async () => {
    const { from } = mockClient({ data: [], error: null });

    const result = await searchProfiles("");

    expect(result).toEqual([]);
    expect(from).not.toHaveBeenCalled();
  });

  it("short-circuits on a whitespace-only query without calling the DB", async () => {
    const { from } = mockClient({ data: [], error: null });

    const result = await searchProfiles("   ");

    expect(result).toEqual([]);
    expect(from).not.toHaveBeenCalled();
  });

  it("returns an empty array when Supabase reports an error", async () => {
    mockClient({ data: null, error: new Error("boom") });

    const result = await searchProfiles("alice");

    expect(result).toEqual([]);
  });

  it("works for an unauthenticated caller (no auth check performed)", async () => {
    mockClient({ data: [{ id: "user-1", full_name: "Bob", avatar_url: null }], error: null });

    const result = await searchProfiles("bob");

    expect(result).toEqual([{ id: "user-1", fullName: "Bob", avatarUrl: null }]);
  });
});
