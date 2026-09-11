import { createClient } from "@/lib/supabase/server";
import { listKudos } from "./list-kudos";

jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(),
}));

const mockedCreateClient = jest.mocked(createClient);

type RangeResult = { data: unknown[] | null; error: Error | null };

function mockRange(result: RangeResult) {
  const range = jest.fn().mockResolvedValue(result);
  const order = jest.fn().mockReturnValue({ range });
  const select = jest.fn().mockReturnValue({ order });
  const from = jest.fn().mockReturnValue({ select });

  mockedCreateClient.mockResolvedValue({
    from,
    // Test double only needs the `from` surface listKudos reads; the real
    // client type has hundreds of unrelated members.
  } as unknown as Awaited<ReturnType<typeof createClient>>);

  return { from, select, order, range };
}

function makeRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "kudos-1",
    content: "Great work!",
    hashtags: ["teamwork"],
    created_at: "2026-09-08T00:00:00.000Z",
    sender: { id: "sender-1", full_name: "Alice", avatar_url: "alice.png" },
    receiver: { id: "receiver-1", full_name: "Bob", avatar_url: "bob.png" },
    kudos_likes: [{ count: 3 }],
    ...overrides,
  };
}

describe("listKudos", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("returns mapped kudos rows ordered by created_at desc, hasMore false when under limit", async () => {
    const { range } = mockRange({ data: [makeRow()], error: null });

    const result = await listKudos({ offset: 0, limit: 10 });

    expect(range).toHaveBeenCalledWith(0, 10);
    expect(result.hasMore).toBe(false);
    expect(result.kudos).toHaveLength(1);
    expect(result.kudos[0]).toEqual({
      id: "kudos-1",
      content: "Great work!",
      hashtags: ["teamwork"],
      createdAt: "2026-09-08T00:00:00.000Z",
      sender: { id: "sender-1", fullName: "Alice", avatarUrl: "alice.png" },
      receiver: { id: "receiver-1", fullName: "Bob", avatarUrl: "bob.png" },
      likeCount: 3,
    });
  });

  it("sets hasMore true when the extra probe row comes back", async () => {
    mockRange({ data: [makeRow({ id: "a" }), makeRow({ id: "b" })], error: null });

    const result = await listKudos({ offset: 0, limit: 1 });

    expect(result.hasMore).toBe(true);
    expect(result.kudos).toHaveLength(1);
    expect(result.kudos[0].id).toBe("a");
  });

  it("returns an empty result set when there are no rows", async () => {
    mockRange({ data: [], error: null });

    const result = await listKudos({ offset: 0, limit: 10 });

    expect(result).toEqual({ kudos: [], hasMore: false });
  });

  it("fails soft to an empty result when Supabase reports an error", async () => {
    mockRange({ data: null, error: new Error("relation \"kudos\" does not exist") });

    const result = await listKudos({ offset: 0, limit: 10 });

    expect(result).toEqual({ kudos: [], hasMore: false });
  });
});
