import { render, screen } from "@testing-library/react";
import Home from "./page";
import { getHomepageViewData } from "@/lib/home/get-homepage-view-data";
import type { HomeScreenProps } from "@/components/home/home-screen";

jest.mock("@/lib/home/get-homepage-view-data", () => ({
  getHomepageViewData: jest.fn(),
}));

// Detailed rendering of every section is covered by e2e/home.spec.ts against
// the real DOM; this unit test only proves page.tsx wires Track B's data
// into HomeScreen correctly.
jest.mock("@/components/home/home-screen", () => ({
  HomeScreen: (props: HomeScreenProps) => (
    <div data-testid="home-screen" data-props={JSON.stringify(props)} />
  ),
}));

const mockedGetHomepageViewData = jest.mocked(getHomepageViewData);

describe("Home page", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("passes the resolved view data through to HomeScreen", async () => {
    mockedGetHomepageViewData.mockResolvedValue({
      isAuthenticated: true,
      role: "admin",
      eventDatetime: "2026-01-01T00:00:00.000Z",
    });

    render(await Home());

    const homeScreen = screen.getByTestId("home-screen");
    expect(JSON.parse(homeScreen.getAttribute("data-props") ?? "{}")).toEqual({
      isAuthenticated: true,
      role: "admin",
      eventDatetime: "2026-01-01T00:00:00.000Z",
    });
  });

  it("renders as unauthenticated when the view data resolves with no session", async () => {
    mockedGetHomepageViewData.mockResolvedValue({
      isAuthenticated: false,
      role: "user",
      eventDatetime: "2026-12-31T00:00:00.000Z",
    });

    render(await Home());

    const homeScreen = screen.getByTestId("home-screen");
    expect(JSON.parse(homeScreen.getAttribute("data-props") ?? "{}")).toEqual({
      isAuthenticated: false,
      role: "user",
      eventDatetime: "2026-12-31T00:00:00.000Z",
    });
  });
});
