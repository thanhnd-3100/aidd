import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AwardInformationScreen } from "./award-information-screen";

// Mock scrollIntoView (not available in jsdom)
Element.prototype.scrollIntoView = jest.fn();

// Mock next/image for the KeyvisualHero and AwardCard images
jest.mock("next/image", () => ({
  __esModule: true,
  default: ({
    src,
    alt,
    ...props
  }: {
    src: string;
    alt: string;
    [key: string]: unknown;
  }) => {
    // Filter out Next.js-specific props that shouldn't go to img element
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { priority, fill, sizes, ...imgProps } = props;
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} {...imgProps} />;
  },
}));

// Mock next-intl useTranslations hook
jest.mock("next-intl", () => ({
  useTranslations: (namespace: string) => {
    const messages: Record<string, Record<string, unknown>> = {
      "awards-information.hero": {
        title: "ROOT FURTHER",
        subtitle: "Sun* Annual Award 2025",
        alt: "Keyvisual Sun* Annual Award 2025",
      },
      "awards-information.section": {
        eyebrow: "Sun* Annual Awards 2025",
        title: "Hệ thống giải thưởng SAA 2025",
      },
      "awards-information.nav": {
        ariaLabel: "Danh mục giải thưởng",
        topTalent: "Top Talent",
        topProject: "Top Project",
        topProjectLeader: "Top Project Leader",
        bestManager: "Best Manager",
        signature2025Creator: "Signature 2025 - Creator",
        mvp: "MVP",
      },
      "awards-information.cards.topTalent": {
        title: "Top Talent",
        description:
          "Giải thưởng Top Talent vinh danh những cá nhân xuất sắc toàn diện – những người không ngừng khẳng định năng lực chuyên môn vững vàng, hiệu suất công việc vượt trội, luôn mang lại giá trị vượt kỳ vọng, được đánh giá cao bởi khách hàng và đồng đội.",
        quantityLabel: "Số lượng giải thưởng:",
        quantity: "10 Đơn vị",
        prizeLine1: "Giá trị giải thưởng: 7.000.000 VNĐ cho mỗi giải thưởng",
      },
      "awards-information.cards.topProject": {
        title: "Top Project",
        description:
          "Giải thưởng Top Project vinh danh các tập thể dự án xuất sắc với kết quả kinh doanh vượt kỳ vọng.",
        quantityLabel: "Số lượng giải thưởng:",
        quantity: "02 Tập thể",
        prizeLine1: "Giá trị giải thưởng: 15.000.000 VNĐ mỗi giải",
      },
      "awards-information.cards.topProjectLeader": {
        title: "Top Project Leader",
        description:
          "Giải thưởng Top Project Leader vinh danh những nhà quản lý dự án xuất sắc.",
        quantityLabel: "Số lượng giải thưởng:",
        quantity: "03 Cá nhân",
        prizeLine1: "Giá trị giải thưởng: 7.000.000 VNĐ",
      },
      "awards-information.cards.bestManager": {
        title: "Best Manager",
        description:
          "Giải thưởng Best Manager vinh danh những nhà lãnh đạo tiêu biểu.",
        quantityLabel: "Số lượng giải thưởng:",
        quantity: "01 Cá nhân",
        prizeLine1: "Giá trị giải thưởng: 10.000.000 VNĐ",
      },
      "awards-information.cards.signature2025Creator": {
        title: "Signature 2025 - Creator",
        description: "Giải thưởng Signature vinh danh cá nhân hoặc tập thể.",
        quantityLabel: "Số lượng giải thưởng:",
        quantity: "01 (Cá nhân hoặc tập thể)",
        prizeLine1: "Giá trị giải thưởng: 5.000.000 VNĐ cho giải cá nhân",
        prizeLine2: "Giá trị giải thưởng: 8.000.000 VNĐ cho giải tập thể",
      },
      "awards-information.cards.mvp": {
        title: "MVP (Most Valuable Person)",
        description:
          "Giải thưởng MVP vinh danh cá nhân xuất sắc nhất năm – gương mặt tiêu biểu đại diện cho toàn bộ tập thể Sun*.",
        quantityLabel: "Số lượng giải thưởng:",
        quantity: "01",
        prizeLine1: "Giá trị giải thưởng: 15.000.000 VNĐ",
      },
      "home.kudos": {
        label: "Sun* Kudos",
        title: "Celebrate Your Wins",
        description: "Give kudos to your teammates.",
        cta: "Chi tiết",
      },
    };

    const t = (key: string) => {
      const parts = key.split(".");
      let value: unknown = messages[namespace];

      for (const part of parts) {
        if (typeof value === "object" && value !== null) {
          value = (value as Record<string, unknown>)[part];
        } else {
          return key;
        }
      }

      return typeof value === "string" ? value : key;
    };

    t.has = (key: string) => {
      const parts = key.split(".");
      let value: unknown = messages[namespace];

      for (const part of parts) {
        if (typeof value === "object" && value !== null) {
          value = (value as Record<string, unknown>)[part];
        } else {
          return false;
        }
      }

      return true;
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return t as any;
  },
}));

describe("AwardInformationScreen", () => {
  it("renders hero title 'ROOT FURTHER'", () => {
    render(<AwardInformationScreen />);

    expect(screen.getByText("ROOT FURTHER")).toBeInTheDocument();
  });

  it("renders hero subtitle 'Sun* Annual Award 2025'", () => {
    render(<AwardInformationScreen />);

    expect(screen.getByText("Sun* Annual Award 2025")).toBeInTheDocument();
  });

  it("renders section title block with eyebrow and heading", () => {
    render(<AwardInformationScreen />);

    expect(screen.getByText("Sun* Annual Awards 2025")).toBeInTheDocument();
    expect(screen.getByText("Hệ thống giải thưởng SAA 2025")).toBeInTheDocument();
  });

  it("renders all 6 category nav items in correct order", () => {
    render(<AwardInformationScreen />);

    const expectedCategories = [
      "Top Talent",
      "Top Project",
      "Top Project Leader",
      "Best Manager",
      "Signature 2025 - Creator",
      "MVP",
    ];

    // Find nav buttons (which are in <nav> element)
    const nav = screen.getByRole("navigation", {
      name: /Danh mục giải thưởng/i,
    });

    for (const category of expectedCategories) {
      const button = screen.getByRole("button", { name: new RegExp(`^${category.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") });
      expect(button).toBeInTheDocument();
      expect(nav).toContainElement(button);
    }
  });

  it("renders all 6 award cards with correct id/slug", () => {
    render(<AwardInformationScreen />);

    const expectedSlugs = [
      "top-talent",
      "top-project",
      "top-project-leader",
      "best-manager",
      "signature-2025-creator",
      "mvp",
    ];

    for (const slug of expectedSlugs) {
      const section = document.getElementById(slug);
      expect(section).toBeInTheDocument();
    }
  });

  it("renders Top Talent card with correct quantity and prize text", () => {
    render(<AwardInformationScreen />);

    // Check quantity
    expect(
      screen.getByText(/Số lượng giải thưởng:.*10 Đơn vị/)
    ).toBeInTheDocument();

    // Check prize
    expect(
      screen.getByText(/7\.000\.000 VNĐ cho mỗi giải thưởng/)
    ).toBeInTheDocument();
  });

  it("renders MVP card with correct quantity and prize text", () => {
    render(<AwardInformationScreen />);

    // Check MVP quantity
    const mvpSection = document.getElementById("mvp");
    expect(mvpSection).toBeInTheDocument();

    // Check prize - MVP has exactly "Giá trị giải thưởng: 15.000.000 VNĐ" with no extra text
    expect(
      screen.getByText("Giá trị giải thưởng: 15.000.000 VNĐ")
    ).toBeInTheDocument();
  });

  it("renders Sun* Kudos block with data-testid", () => {
    render(<AwardInformationScreen />);

    const kudosBlock = screen.getByTestId("kudos-promo");
    expect(kudosBlock).toBeInTheDocument();
  });

  it("sets active state when clicking a category nav item", async () => {
    const user = userEvent.setup();
    render(<AwardInformationScreen />);

    const topTalentButton = screen.getByRole("button", {
      name: /top talent/i,
    });

    // Initially not active
    expect(topTalentButton).toHaveAttribute("aria-current", "false");

    // Click to activate
    await user.click(topTalentButton);

    // Should now be active (aria-current="true")
    expect(topTalentButton).toHaveAttribute("aria-current", "true");

    // Verify scrollIntoView was called
    expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
  });

  it("clears previous active state when clicking a different nav item", async () => {
    const user = userEvent.setup();
    render(<AwardInformationScreen />);

    const topTalentButton = screen.getByRole("button", {
      name: /top talent/i,
    });
    const mvpButton = screen.getByRole("button", { name: /^MVP$/i });

    // Click Top Talent to set initial active state
    await user.click(topTalentButton);
    expect(topTalentButton).toHaveAttribute("aria-current", "true");

    // Click MVP
    await user.click(mvpButton);

    // Top Talent should no longer be active
    expect(topTalentButton).toHaveAttribute("aria-current", "false");

    // MVP should now be active
    expect(mvpButton).toHaveAttribute("aria-current", "true");
  });
});
