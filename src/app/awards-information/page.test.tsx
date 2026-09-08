import { render, screen } from "@testing-library/react";
import AwardsInformationPage from "./page";
import { redirectIfUnauthenticated } from "@/lib/auth/session-guard";

jest.mock("@/lib/auth/session-guard", () => ({
  redirectIfUnauthenticated: jest.fn(),
}));

jest.mock("@/components/awards-information/award-information-screen", () => ({
  AwardInformationScreen: () => <div>award-information-screen</div>,
}));

const mockedRedirectIfUnauthenticated = jest.mocked(redirectIfUnauthenticated);

describe("AwardsInformationPage", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("redirects unauthenticated visitors to /login", async () => {
    // Same "guard rejects -> page never renders" contract as /todo: in the
    // real app next/navigation's redirect() throws to halt rendering.
    const redirectSignal = new Error("NEXT_REDIRECT");
    mockedRedirectIfUnauthenticated.mockRejectedValue(redirectSignal);

    await expect(AwardsInformationPage()).rejects.toThrow(redirectSignal);

    expect(mockedRedirectIfUnauthenticated).toHaveBeenCalledWith("/login");
  });

  it("renders AwardInformationScreen for authenticated visitors", async () => {
    mockedRedirectIfUnauthenticated.mockResolvedValue(undefined);

    const ui = await AwardsInformationPage();
    render(ui);

    expect(screen.getByText("award-information-screen")).toBeInTheDocument();
  });
});
