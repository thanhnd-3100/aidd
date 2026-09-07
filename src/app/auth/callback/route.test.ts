/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { GET } from "./route";

jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(),
}));

const mockedCreateClient = createClient as jest.Mock;

function buildRequest(url: string) {
  return new NextRequest(new Request(url));
}

describe("GET /auth/callback", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("exchanges the code for a session and redirects to /todo", async () => {
    const exchangeCodeForSession = jest.fn().mockResolvedValue({ error: null });
    mockedCreateClient.mockResolvedValue({
      auth: { exchangeCodeForSession },
    });

    const response = await GET(
      buildRequest("https://app.example.com/auth/callback?code=abc123")
    );

    expect(exchangeCodeForSession).toHaveBeenCalledWith("abc123");
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://app.example.com/todo"
    );
  });

  it("redirects to /login?error=oauth_failed when the exchange fails", async () => {
    const exchangeCodeForSession = jest
      .fn()
      .mockResolvedValue({ error: new Error("invalid code") });
    mockedCreateClient.mockResolvedValue({
      auth: { exchangeCodeForSession },
    });

    const response = await GET(
      buildRequest("https://app.example.com/auth/callback?code=bad-code")
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://app.example.com/login?error=oauth_failed"
    );
  });

  it("redirects to /login?error=oauth_failed when no code is present", async () => {
    const response = await GET(
      buildRequest("https://app.example.com/auth/callback")
    );

    expect(mockedCreateClient).not.toHaveBeenCalled();
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://app.example.com/login?error=oauth_failed"
    );
  });
});
