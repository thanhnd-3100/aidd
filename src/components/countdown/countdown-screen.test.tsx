import { render, screen } from "@testing-library/react";
import { CountdownScreen } from "./countdown-screen";
import type { CountdownValue } from "./use-countdown";

jest.mock("next-intl", () => ({
  useTranslations: () => {
    const messages: Record<string, string> = {
      title: "Sự kiện sẽ bắt đầu sau",
      days: "Ngày",
      hours: "Giờ",
      minutes: "Phút",
    };
    return (key: string) => messages[key] ?? key;
  },
}));

const mockUseCountdown = jest.fn<CountdownValue, [string]>();
jest.mock("./use-countdown", () => ({
  useCountdown: (targetDatetime: string) => mockUseCountdown(targetDatetime),
}));

describe("CountdownScreen", () => {
  beforeEach(() => {
    mockUseCountdown.mockReset();
  });

  it("renders zero-padded 2-digit values for a normal countdown", () => {
    mockUseCountdown.mockReturnValue({
      days: 5,
      hours: 3,
      minutes: 9,
      isPast: false,
    });

    render(<CountdownScreen targetDatetime="2026-12-31T18:30:00+07:00" />);

    const values = screen.getAllByTestId("countdown-value");
    expect(values[0]).toHaveTextContent("05");
    expect(values[1]).toHaveTextContent("03");
    expect(values[2]).toHaveTextContent("09");
  });

  it("caps a day count >= 100 at '99' instead of truncating to its last two digits", () => {
    // Reproduces the live bug window: EVENT_DATETIME 2026-12-31T18:30:00+07:00
    // is ~114 days out as of 2026-09-08. The old `.slice(-2)` implementation
    // rendered "14" for 114 — a wrong number, not an overflow indicator.
    mockUseCountdown.mockReturnValue({
      days: 114,
      hours: 0,
      minutes: 0,
      isPast: false,
    });

    render(<CountdownScreen targetDatetime="2026-12-31T18:30:00+07:00" />);

    const values = screen.getAllByTestId("countdown-value");
    expect(values[0]).toHaveTextContent("99");
    expect(values[0]).not.toHaveTextContent("14");
  });
});
