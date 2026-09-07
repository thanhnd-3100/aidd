import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { redirectIfAuthenticated, redirectIfUnauthenticated } from "./session-guard";

jest.mock("next/navigation", () => ({
  redirect: jest.fn(),
}));

jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(),
}));

const mockedRedirect = jest.mocked(redirect);
const mockedCreateClient = jest.mocked(createClient);

function mockGetUser(user: { id: string } | null, error: Error | null = null) {
  const client = {
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user }, error }),
    },
    // Test double only needs the `auth.getUser` surface session-guard reads;
    // the real client type has hundreds of unrelated members.
  } as unknown as Awaited<ReturnType<typeof createClient>>;

  mockedCreateClient.mockResolvedValue(client);
}

describe("redirectIfAuthenticated", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("redirects to /todo when a session exists", async () => {
    mockGetUser({ id: "user-1" });

    await redirectIfAuthenticated();

    expect(mockedRedirect).toHaveBeenCalledWith("/todo");
  });

  it("redirects to a custom destination when provided", async () => {
    mockGetUser({ id: "user-1" });

    await redirectIfAuthenticated("/dashboard");

    expect(mockedRedirect).toHaveBeenCalledWith("/dashboard");
  });

  it("does not redirect when there is no session", async () => {
    mockGetUser(null);

    await redirectIfAuthenticated();

    expect(mockedRedirect).not.toHaveBeenCalled();
  });

  it("does not redirect when Supabase returns an error", async () => {
    mockGetUser(null, new Error("network error"));

    await redirectIfAuthenticated();

    expect(mockedRedirect).not.toHaveBeenCalled();
  });
});

describe("redirectIfUnauthenticated", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("redirects to /login when there is no session", async () => {
    mockGetUser(null);

    await redirectIfUnauthenticated();

    expect(mockedRedirect).toHaveBeenCalledWith("/login");
  });

  it("redirects to a custom destination when provided", async () => {
    mockGetUser(null);

    await redirectIfUnauthenticated("/signin");

    expect(mockedRedirect).toHaveBeenCalledWith("/signin");
  });

  it("does not redirect when a session exists", async () => {
    mockGetUser({ id: "user-1" });

    await redirectIfUnauthenticated();

    expect(mockedRedirect).not.toHaveBeenCalled();
  });
});
