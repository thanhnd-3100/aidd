import { render, screen } from "@testing-library/react";
import SunKudosPage from "./page";
import { createClient } from "@/lib/supabase/server";
import { listKudos } from "@/lib/kudos/list-kudos";
import type { SunKudosClientProps } from "./sun-kudos-client";

jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(),
}));

jest.mock("@/lib/kudos/list-kudos", () => ({
  listKudos: jest.fn(),
}));

// `sun-kudos-client.tsx` pulls in the real `KudosBoard`/`KudosComposer`
// (via `requireActual` below), which import `next-intl`/`next/font/google` —
// both need stubbing here the same way their own component tests do.
jest.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

jest.mock("next/font/google", () => ({
  Montserrat: () => ({ variable: "--font-montserrat" }),
}));

// Detailed rendering/behavior is covered by e2e/sun-kudos-{public,authenticated}.spec.ts and
// sun-kudos-client.test.tsx; this unit test only proves page.tsx resolves
// the session + first feed page and wires them into SunKudosClient.
jest.mock("./sun-kudos-client", () => ({
  ...jest.requireActual("./sun-kudos-client"),
  SunKudosClient: (props: SunKudosClientProps) => (
    <div data-testid="sun-kudos-client" data-props={JSON.stringify(props)} />
  ),
}));

const mockedCreateClient = jest.mocked(createClient);
const mockedListKudos = jest.mocked(listKudos);

function mockAuthUser(user: { id: string } | null) {
  mockedCreateClient.mockResolvedValue({
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user },
        error: user ? null : null,
      }),
    },
    // Test double only needs the `auth.getUser` surface this page reads.
  } as unknown as Awaited<ReturnType<typeof createClient>>);
}

const sampleRow = {
  id: "kudos-1",
  content: "Great work!",
  hashtags: ["teamwork"],
  createdAt: "2026-09-08T00:00:00.000Z",
  sender: { id: "sender-1", fullName: "Alice", avatarUrl: "alice.png" },
  receiver: { id: "receiver-1", fullName: "Bob", avatarUrl: "bob.png" },
  likeCount: 3,
};

describe("SunKudosPage", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("passes the mapped feed and authenticated user id to SunKudosClient", async () => {
    mockAuthUser({ id: "user-1" });
    mockedListKudos.mockResolvedValue({ kudos: [sampleRow], hasMore: true });

    render(await SunKudosPage());

    expect(mockedListKudos).toHaveBeenCalledWith({ offset: 0, limit: 20 });

    const client = screen.getByTestId("sun-kudos-client");
    const props = JSON.parse(client.getAttribute("data-props") ?? "{}");

    expect(props.currentUserId).toBe("user-1");
    expect(props.initialHasMore).toBe(true);
    expect(props.initialKudos).toEqual([
      {
        id: "kudos-1",
        senderId: "sender-1",
        senderName: "Alice",
        senderAvatarUrl: "alice.png",
        receiverName: "Bob",
        receiverAvatarUrl: "bob.png",
        createdAt: "2026-09-08T00:00:00.000Z",
        content: "Great work!",
        hashtags: ["teamwork"],
        likeCount: 3,
      },
    ]);
  });

  it("passes currentUserId=null when there is no session, without redirecting", async () => {
    mockAuthUser(null);
    mockedListKudos.mockResolvedValue({ kudos: [], hasMore: false });

    render(await SunKudosPage());

    const client = screen.getByTestId("sun-kudos-client");
    const props = JSON.parse(client.getAttribute("data-props") ?? "{}");

    expect(props.currentUserId).toBeNull();
    expect(props.initialKudos).toEqual([]);
  });

  it("renders the empty state data when the Supabase client itself throws", async () => {
    mockedCreateClient.mockRejectedValue(new Error("missing env vars"));
    mockedListKudos.mockRejectedValue(new Error("missing env vars"));

    render(await SunKudosPage());

    const client = screen.getByTestId("sun-kudos-client");
    const props = JSON.parse(client.getAttribute("data-props") ?? "{}");

    expect(props.currentUserId).toBeNull();
    expect(props.initialKudos).toEqual([]);
    expect(props.initialHasMore).toBe(false);
  });
});
