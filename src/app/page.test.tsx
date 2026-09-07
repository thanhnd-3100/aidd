import { render, screen } from "@testing-library/react";
import Home from "./page";

describe("Home page", () => {
  it("renders the getting started heading", () => {
    render(<Home />);
    expect(
      screen.getByRole("heading", { name: /to get started/i })
    ).toBeInTheDocument();
  });

  it("renders links to Templates and Documentation", () => {
    render(<Home />);
    expect(screen.getByRole("link", { name: /templates/i })).toHaveAttribute(
      "href",
      expect.stringContaining("vercel.com/templates")
    );
    expect(
      screen.getByRole("link", { name: /documentation/i })
    ).toHaveAttribute("href", expect.stringContaining("nextjs.org/docs"));
  });
});
