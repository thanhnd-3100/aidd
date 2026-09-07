import { render, screen } from "@testing-library/react";
import TodoPage from "./page";
import { redirectIfUnauthenticated } from "@/lib/auth/session-guard";

jest.mock("@/lib/auth/session-guard", () => ({
  redirectIfUnauthenticated: jest.fn(),
}));

const mockedRedirectIfUnauthenticated = jest.mocked(redirectIfUnauthenticated);

describe("TodoPage", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("redirects unauthenticated visitors to /login", async () => {
    // In the real app, next/navigation's redirect() throws to halt rendering.
    // session-guard's redirectIfUnauthenticated wraps that call, so the stub
    // page mirrors the same "guard rejects -> page never renders" contract.
    const redirectSignal = new Error("NEXT_REDIRECT");
    mockedRedirectIfUnauthenticated.mockRejectedValue(redirectSignal);

    await expect(TodoPage()).rejects.toThrow(redirectSignal);

    expect(mockedRedirectIfUnauthenticated).toHaveBeenCalledWith("/login");
  });

  it("renders the placeholder for authenticated visitors", async () => {
    mockedRedirectIfUnauthenticated.mockResolvedValue(undefined);

    const ui = await TodoPage();
    render(ui);

    expect(screen.getByText(/todo — coming soon/i)).toBeInTheDocument();
  });
});
