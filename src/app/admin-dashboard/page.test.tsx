import { render, screen } from "@testing-library/react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminDashboardPage from "./page";

jest.mock("next/navigation", () => ({
  redirect: jest.fn(),
}));

jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(),
}));

const mockedRedirect = jest.mocked(redirect);
const mockedCreateClient = jest.mocked(createClient);

function mockGetUser(user: { app_metadata: Record<string, unknown> } | null) {
  const client = {
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user }, error: null }),
    },
    // Test double only needs the `auth.getUser` surface the page reads; the
    // real client type has hundreds of unrelated members.
  } as unknown as Awaited<ReturnType<typeof createClient>>;

  mockedCreateClient.mockResolvedValue(client);
}

describe("AdminDashboardPage", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("redirects non-admins to /", async () => {
    mockGetUser({ app_metadata: { role: "user" } });

    await AdminDashboardPage();

    expect(mockedRedirect).toHaveBeenCalledWith("/");
  });

  it("redirects unauthenticated visitors to /", async () => {
    mockGetUser(null);

    await AdminDashboardPage();

    expect(mockedRedirect).toHaveBeenCalledWith("/");
  });

  it("renders placeholder content for admins", async () => {
    mockGetUser({ app_metadata: { role: "admin" } });

    const ui = await AdminDashboardPage();
    render(ui);

    expect(mockedRedirect).not.toHaveBeenCalled();
    expect(screen.getByText(/admin dashboard/i)).toBeInTheDocument();
  });
});
