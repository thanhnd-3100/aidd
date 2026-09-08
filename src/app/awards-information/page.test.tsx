import { render, screen } from "@testing-library/react";
import AwardsInformationPage, { AWARD_CATEGORIES } from "./page";

describe("AwardsInformationPage", () => {
  it("renders the page heading", () => {
    render(<AwardsInformationPage />);

    expect(
      screen.getByRole("heading", { level: 1, name: /awards information/i })
    ).toBeInTheDocument();
  });

  it.each(AWARD_CATEGORIES)(
    "renders an anchor section for the %s category",
    (category) => {
      render(<AwardsInformationPage />);

      const section = document.getElementById(category.slug);
      expect(section).not.toBeNull();
      expect(section).toHaveTextContent(category.title);
    }
  );
});
