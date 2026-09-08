import { render, screen } from "@testing-library/react";
import SunKudosPage from "./page";

describe("SunKudosPage", () => {
  it("renders the coming-soon placeholder", () => {
    render(<SunKudosPage />);

    expect(screen.getByText(/sun\* kudos — coming soon/i)).toBeInTheDocument();
  });
});
