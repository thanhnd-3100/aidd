import { render, screen } from "@testing-library/react";
import CountdownPage from "./page";
import type { CountdownScreenProps } from "@/components/countdown/countdown-screen";

// Detailed rendering is covered by e2e/countdown.spec.ts against the real
// DOM; this unit test only proves page.tsx wires the env-sourced datetime
// into CountdownScreen correctly.
jest.mock("@/components/countdown/countdown-screen", () => ({
  CountdownScreen: (props: CountdownScreenProps) => (
    <div data-testid="countdown-screen" data-props={JSON.stringify(props)} />
  ),
}));

describe("CountdownPage", () => {
  const originalEnv = process.env.EVENT_DATETIME;

  afterEach(() => {
    process.env.EVENT_DATETIME = originalEnv;
  });

  it("passes EVENT_DATETIME through to CountdownScreen", () => {
    process.env.EVENT_DATETIME = "2026-01-01T00:00:00.000Z";

    render(CountdownPage());

    const countdownScreen = screen.getByTestId("countdown-screen");
    expect(
      JSON.parse(countdownScreen.getAttribute("data-props") ?? "{}")
    ).toEqual({ targetDatetime: "2026-01-01T00:00:00.000Z" });
  });

  it("falls back to the default datetime when EVENT_DATETIME is unset", () => {
    delete process.env.EVENT_DATETIME;

    render(CountdownPage());

    const countdownScreen = screen.getByTestId("countdown-screen");
    expect(
      JSON.parse(countdownScreen.getAttribute("data-props") ?? "{}")
    ).toEqual({ targetDatetime: "2026-12-31T00:00:00.000Z" });
  });

  it("falls back to the default datetime when EVENT_DATETIME is invalid", () => {
    process.env.EVENT_DATETIME = "not-a-date";

    render(CountdownPage());

    const countdownScreen = screen.getByTestId("countdown-screen");
    expect(
      JSON.parse(countdownScreen.getAttribute("data-props") ?? "{}")
    ).toEqual({ targetDatetime: "2026-12-31T00:00:00.000Z" });
  });
});
