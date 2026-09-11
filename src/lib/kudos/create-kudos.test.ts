import { createClient } from "@/lib/supabase/server";
import { createKudos } from "./create-kudos";

jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(),
}));

const mockedCreateClient = jest.mocked(createClient);

function mockAuthenticatedClient(options: {
  userId?: string | null;
  userError?: Error | null;
  insertResult?: { data: { id: string } | null; error: Error | null };
}) {
  const { userId = "user-1", userError = null, insertResult = { data: { id: "kudos-1" }, error: null } } = options;

  const getUser = jest.fn().mockResolvedValue({
    data: { user: userId ? { id: userId } : null },
    error: userError,
  });

  const single = jest.fn().mockResolvedValue(insertResult);
  const select = jest.fn().mockReturnValue({ single });
  const insert = jest.fn().mockReturnValue({ select });
  const from = jest.fn().mockReturnValue({ insert });

  mockedCreateClient.mockResolvedValue({
    auth: { getUser },
    from,
    // Test double only needs the `auth.getUser`/`from` surface createKudos
    // reads; the real client type has hundreds of unrelated members.
  } as unknown as Awaited<ReturnType<typeof createClient>>);

  return { getUser, from, insert, select, single };
}

describe("createKudos", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("inserts a kudos row using the caller's auth.uid() as sender_id", async () => {
    const { insert } = mockAuthenticatedClient({ userId: "user-1" });

    const result = await createKudos({
      receiverId: "receiver-1",
      content: "Great work on the release!",
      hashtags: ["teamwork", "shipfast"],
    });

    expect(insert).toHaveBeenCalledWith({
      sender_id: "user-1",
      receiver_id: "receiver-1",
      content: "Great work on the release!",
      hashtags: ["teamwork", "shipfast"],
    });
    expect(result).toEqual({ kudosId: "kudos-1", error: null });
  });

  it("rejects empty (or whitespace-only) content without hitting the DB", async () => {
    const { from } = mockAuthenticatedClient({});

    const result = await createKudos({ receiverId: "receiver-1", content: "   ", hashtags: ["x"] });

    expect(result.kudosId).toBeNull();
    expect(result.error).toBeInstanceOf(Error);
    expect(from).not.toHaveBeenCalled();
  });

  it("rejects zero hashtags without hitting the DB", async () => {
    const { from } = mockAuthenticatedClient({});

    const result = await createKudos({ receiverId: "receiver-1", content: "Nice job", hashtags: [] });

    expect(result.kudosId).toBeNull();
    expect(result.error).toBeInstanceOf(Error);
    expect(from).not.toHaveBeenCalled();
  });

  it("rejects more than 5 hashtags without hitting the DB", async () => {
    const { from } = mockAuthenticatedClient({});

    const result = await createKudos({
      receiverId: "receiver-1",
      content: "Nice job",
      hashtags: ["a", "b", "c", "d", "e", "f"],
    });

    expect(result.kudosId).toBeNull();
    expect(result.error).toBeInstanceOf(Error);
    expect(from).not.toHaveBeenCalled();
  });

  it("rejects an unauthenticated caller", async () => {
    const { from } = mockAuthenticatedClient({ userId: null });

    const result = await createKudos({ receiverId: "receiver-1", content: "Nice job", hashtags: ["x"] });

    expect(result.kudosId).toBeNull();
    expect(result.error).toBeInstanceOf(Error);
    expect(from).not.toHaveBeenCalled();
  });

  it("returns an error result when the insert fails", async () => {
    mockAuthenticatedClient({ insertResult: { data: null, error: new Error("insert failed") } });

    const result = await createKudos({ receiverId: "receiver-1", content: "Nice job", hashtags: ["x"] });

    expect(result.kudosId).toBeNull();
    expect(result.error).toBeInstanceOf(Error);
  });
});
