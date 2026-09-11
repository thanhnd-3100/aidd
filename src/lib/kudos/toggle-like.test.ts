import { createClient } from "@/lib/supabase/server";
import { toggleLike } from "./toggle-like";

jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(),
}));

const mockedCreateClient = jest.mocked(createClient);

interface MockOptions {
  userId?: string | null;
  userError?: Error | null;
  kudosSenderId?: string | null;
  kudosLookupError?: Error | null;
  existingLike?: { kudos_id: string } | null;
  existingLikeError?: Error | null;
  deleteError?: Error | null;
  insertError?: Error | null;
}

function mockClient(options: MockOptions) {
  const {
    userId = "user-2",
    userError = null,
    kudosSenderId = "user-1",
    kudosLookupError = null,
    existingLike = null,
    existingLikeError = null,
    deleteError = null,
    insertError = null,
  } = options;

  const getUser = jest.fn().mockResolvedValue({
    data: { user: userId ? { id: userId } : null },
    error: userError,
  });

  // kudos lookup: from("kudos").select("sender_id").eq("id", kudosId).single()
  const kudosSingle = jest.fn().mockResolvedValue({
    data: kudosSenderId ? { sender_id: kudosSenderId } : null,
    error: kudosLookupError,
  });
  const kudosEq = jest.fn().mockReturnValue({ single: kudosSingle });
  const kudosSelect = jest.fn().mockReturnValue({ eq: kudosEq });

  // existing like lookup: from("kudos_likes").select("kudos_id").eq().eq().maybeSingle()
  const likeMaybeSingle = jest.fn().mockResolvedValue({ data: existingLike, error: existingLikeError });
  const likeEq2 = jest.fn().mockReturnValue({ maybeSingle: likeMaybeSingle });
  const likeEq1 = jest.fn().mockReturnValue({ eq: likeEq2 });
  const likeSelect = jest.fn().mockReturnValue({ eq: likeEq1 });

  // delete: from("kudos_likes").delete().eq().eq()
  const deleteEq2 = jest.fn().mockResolvedValue({ error: deleteError });
  const deleteEq1 = jest.fn().mockReturnValue({ eq: deleteEq2 });
  const deleteFn = jest.fn().mockReturnValue({ eq: deleteEq1 });

  // insert: from("kudos_likes").insert({...})
  const insertFn = jest.fn().mockResolvedValue({ error: insertError });

  const from = jest.fn((table: string) => {
    if (table === "kudos") {
      return { select: kudosSelect };
    }
    return { select: likeSelect, delete: deleteFn, insert: insertFn };
  });

  mockedCreateClient.mockResolvedValue({
    auth: { getUser },
    from,
    // Test double only needs the `auth.getUser`/`from` surface toggleLike
    // reads; the real client type has hundreds of unrelated members.
  } as unknown as Awaited<ReturnType<typeof createClient>>);

  return { getUser, from, insertFn, deleteFn };
}

describe("toggleLike", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("inserts a like row when the user has not liked the kudos yet", async () => {
    const { insertFn } = mockClient({ existingLike: null });

    const result = await toggleLike({ kudosId: "kudos-1" });

    expect(insertFn).toHaveBeenCalledWith({ kudos_id: "kudos-1", user_id: "user-2" });
    expect(result).toEqual({ action: "liked", error: null });
  });

  it("deletes the like row when the user has already liked the kudos (unlike)", async () => {
    const { deleteFn } = mockClient({ existingLike: { kudos_id: "kudos-1" } });

    const result = await toggleLike({ kudosId: "kudos-1" });

    expect(deleteFn).toHaveBeenCalled();
    expect(result).toEqual({ action: "unliked", error: null });
  });

  it("rejects liking your own kudos", async () => {
    const { insertFn } = mockClient({ userId: "user-1", kudosSenderId: "user-1" });

    const result = await toggleLike({ kudosId: "kudos-1" });

    expect(result.action).toBeNull();
    expect(result.error).toBeInstanceOf(Error);
    expect(insertFn).not.toHaveBeenCalled();
  });

  it("rejects an unauthenticated caller", async () => {
    const { from } = mockClient({ userId: null });

    const result = await toggleLike({ kudosId: "kudos-1" });

    expect(result.action).toBeNull();
    expect(result.error).toBeInstanceOf(Error);
    expect(from).not.toHaveBeenCalled();
  });

  it("returns an error result when the target kudos cannot be found", async () => {
    mockClient({ kudosSenderId: null });

    const result = await toggleLike({ kudosId: "missing-kudos" });

    expect(result.action).toBeNull();
    expect(result.error).toBeInstanceOf(Error);
  });
});
