import { createClient } from "@/lib/supabase/client";
import { signInWithGoogle } from "./login-actions";

jest.mock("@/lib/supabase/client", () => ({
  createClient: jest.fn(),
}));

const mockedCreateClient = createClient as jest.Mock;

describe("signInWithGoogle", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("calls signInWithOAuth with the google provider and callback redirect", async () => {
    const signInWithOAuth = jest.fn().mockResolvedValue({ data: {}, error: null });
    mockedCreateClient.mockReturnValue({ auth: { signInWithOAuth } });

    await signInWithGoogle("https://app.example.com");

    expect(signInWithOAuth).toHaveBeenCalledWith({
      provider: "google",
      options: { redirectTo: "https://app.example.com/auth/callback" },
    });
  });

  it("returns an error result when Supabase reports a failure", async () => {
    const signInWithOAuth = jest
      .fn()
      .mockResolvedValue({ data: null, error: new Error("provider unavailable") });
    mockedCreateClient.mockReturnValue({ auth: { signInWithOAuth } });

    const result = await signInWithGoogle("https://app.example.com");

    expect(result.error).toBeInstanceOf(Error);
  });

  it("returns a success result when Supabase resolves without error", async () => {
    const signInWithOAuth = jest.fn().mockResolvedValue({ data: { provider: "google" }, error: null });
    mockedCreateClient.mockReturnValue({ auth: { signInWithOAuth } });

    const result = await signInWithGoogle("https://app.example.com");

    expect(result.error).toBeNull();
  });
});
