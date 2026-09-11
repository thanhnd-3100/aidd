import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRouter } from "next/navigation";
import { createKudos } from "@/lib/kudos/create-kudos";
import { listKudos } from "@/lib/kudos/list-kudos";
import { searchProfiles } from "@/lib/kudos/search-profiles";
import { toggleLike } from "@/lib/kudos/toggle-like";
import type { Kudos } from "@/components/kudos/board/types";
import { mapKudosRow } from "./kudos-view-model";
import { SunKudosClient } from "./sun-kudos-client";

const boardMessages: Record<string, string> = {
  title: "Hệ thống ghi nhận và cảm ơn",
  wordmarkAlt: "KUDOS",
  ghiNhanPrompt: "Hôm nay, bạn muốn gửi lời cảm ơn và ghi nhận đến ai?",
  feedEyebrow: "Sun* Annual Awards 2025",
  feedHeading: "ALL KUDOS",
  emptyState: "Hiện tại chưa có Kudos nào.",
  loadMore: "Xem thêm",
};

const composerMessages: Record<string, string> = {
  title: "Gửi lời cám ơn và ghi nhận đến đồng đội",
  "recipient.label": "Người nhận",
  "recipient.placeholder": "Tìm kiếm",
  "content.label": "Nội dung",
  "content.placeholder": "Hãy gửi gắm lời cám ơn...",
  "hashtags.label": "Hashtag",
  "hashtags.placeholder": "Nhập hashtag rồi nhấn Enter",
  "hashtags.maxHint": "Tối đa 5 hashtag",
  "hashtags.remove": "Remove hashtag {tag}",
  cancel: "Hủy",
  submit: "Gửi",
  submitting: "Đang gửi...",
};

jest.mock("next-intl", () => ({
  useTranslations: (namespace: string) => {
    const messages = namespace === "kudos.composer" ? composerMessages : boardMessages;
    return (key: string, params?: Record<string, string>) => {
      const template = messages[key] ?? key;
      if (!params) return template;
      return Object.entries(params).reduce(
        (result, [paramKey, value]) => result.replace(`{${paramKey}}`, value),
        template
      );
    };
  },
}));

jest.mock("next/font/google", () => ({
  Montserrat: () => ({ variable: "--font-montserrat" }),
}));

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

jest.mock("@/lib/kudos/create-kudos", () => ({ createKudos: jest.fn() }));
jest.mock("@/lib/kudos/list-kudos", () => ({ listKudos: jest.fn() }));
jest.mock("@/lib/kudos/search-profiles", () => ({ searchProfiles: jest.fn() }));
jest.mock("@/lib/kudos/toggle-like", () => ({ toggleLike: jest.fn() }));

const mockedUseRouter = jest.mocked(useRouter);
const mockedCreateKudos = jest.mocked(createKudos);
const mockedListKudos = jest.mocked(listKudos);
const mockedSearchProfiles = jest.mocked(searchProfiles);
const mockedToggleLike = jest.mocked(toggleLike);

const push = jest.fn();

function renderClient(props: {
  initialKudos: Kudos[];
  initialHasMore: boolean;
  currentUserId: string | null;
}) {
  return render(<SunKudosClient {...props} />);
}

const otherUsersKudos: Kudos = {
  id: "kudos-1",
  senderId: "sender-1",
  senderName: "Alice",
  receiverName: "Bob",
  createdAt: "2026-09-08T00:00:00.000Z",
  content: "Great work!",
  hashtags: ["teamwork"],
  likeCount: 3,
};

describe("mapKudosRow", () => {
  it("maps a fully-populated row to the board's flat Kudos shape", () => {
    expect(
      mapKudosRow({
        id: "k1",
        content: "Nice",
        hashtags: ["a"],
        createdAt: "2026-01-01T00:00:00.000Z",
        sender: { id: "u1", fullName: "Alice", avatarUrl: "a.png" },
        receiver: { id: "u2", fullName: "Bob", avatarUrl: "b.png" },
        likeCount: 2,
      })
    ).toEqual({
      id: "k1",
      senderId: "u1",
      senderName: "Alice",
      senderAvatarUrl: "a.png",
      receiverName: "Bob",
      receiverAvatarUrl: "b.png",
      createdAt: "2026-01-01T00:00:00.000Z",
      content: "Nice",
      hashtags: ["a"],
      likeCount: 2,
    });
  });

  it("falls back to an empty name and undefined avatar when profile fields are null", () => {
    const mapped = mapKudosRow({
      id: "k1",
      content: "Nice",
      hashtags: [],
      createdAt: "2026-01-01T00:00:00.000Z",
      sender: { id: "u1", fullName: null, avatarUrl: null },
      receiver: { id: "u2", fullName: null, avatarUrl: null },
      likeCount: 0,
    });

    expect(mapped.senderName).toBe("");
    expect(mapped.senderAvatarUrl).toBeUndefined();
    expect(mapped.receiverName).toBe("");
    expect(mapped.receiverAvatarUrl).toBeUndefined();
  });
});

describe("SunKudosClient", () => {
  beforeEach(() => {
    mockedUseRouter.mockReturnValue({
      push,
    } as unknown as ReturnType<typeof useRouter>);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("redirects to /login when an unauthenticated visitor clicks 'Ghi nhận'", async () => {
    const user = userEvent.setup();
    renderClient({ initialKudos: [], initialHasMore: false, currentUserId: null });

    await user.click(screen.getByTestId("ghi-nhan-button"));

    expect(push).toHaveBeenCalledWith("/login");
  });

  it("opens the composer when an authenticated user clicks 'Ghi nhận'", async () => {
    const user = userEvent.setup();
    renderClient({
      initialKudos: [],
      initialHasMore: false,
      currentUserId: "user-1",
    });

    await user.click(screen.getByTestId("ghi-nhan-button"));

    expect(push).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("redirects to /login when an unauthenticated visitor clicks a like button", async () => {
    const user = userEvent.setup();
    renderClient({
      initialKudos: [otherUsersKudos],
      initialHasMore: false,
      currentUserId: null,
    });

    await user.click(screen.getByTestId("like-button"));

    expect(push).toHaveBeenCalledWith("/login");
    expect(mockedToggleLike).not.toHaveBeenCalled();
  });

  it("calls toggleLike and updates the like count for an authenticated user", async () => {
    const user = userEvent.setup();
    mockedToggleLike.mockResolvedValue({ action: "liked", error: null });

    renderClient({
      initialKudos: [otherUsersKudos],
      initialHasMore: false,
      currentUserId: "user-2",
    });

    await user.click(screen.getByTestId("like-button"));

    await waitFor(() => {
      expect(mockedToggleLike).toHaveBeenCalledWith({ kudosId: "kudos-1" });
    });
    expect(await screen.findByText("4")).toBeInTheDocument();
  });

  it("leaves the like count unchanged when toggleLike fails", async () => {
    const user = userEvent.setup();
    mockedToggleLike.mockResolvedValue({
      action: null,
      error: new Error("failed"),
    });

    renderClient({
      initialKudos: [otherUsersKudos],
      initialHasMore: false,
      currentUserId: "user-2",
    });

    await user.click(screen.getByTestId("like-button"));

    await waitFor(() => {
      expect(mockedToggleLike).toHaveBeenCalled();
    });
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("calls listKudos with the next offset and appends results on load more", async () => {
    const user = userEvent.setup();
    const nextRow = {
      id: "kudos-2",
      content: "Nice job",
      hashtags: [],
      createdAt: "2026-09-08T01:00:00.000Z",
      sender: { id: "sender-2", fullName: "Carl", avatarUrl: null },
      receiver: { id: "receiver-2", fullName: "Dan", avatarUrl: null },
      likeCount: 0,
    };
    mockedListKudos.mockResolvedValue({ kudos: [nextRow], hasMore: false });

    renderClient({
      initialKudos: [otherUsersKudos],
      initialHasMore: true,
      currentUserId: "user-1",
    });

    await user.click(screen.getByTestId("kudos-load-more"));

    expect(mockedListKudos).toHaveBeenCalledWith({ offset: 1, limit: 20 });
    expect(await screen.findByText("Nice job")).toBeInTheDocument();
  });

  it("submits via createKudos, refetches page 1, and closes the modal on success", async () => {
    const user = userEvent.setup();
    mockedSearchProfiles.mockResolvedValue([
      { id: "recipient-1", fullName: "Carl", avatarUrl: null },
    ]);
    mockedCreateKudos.mockResolvedValue({ kudosId: "kudos-3", error: null });
    mockedListKudos.mockResolvedValue({
      kudos: [
        {
          id: "kudos-3",
          content: "Thanks!",
          hashtags: ["ship-it"],
          createdAt: "2026-09-08T02:00:00.000Z",
          sender: { id: "user-1", fullName: "Me", avatarUrl: null },
          receiver: { id: "recipient-1", fullName: "Carl", avatarUrl: null },
          likeCount: 0,
        },
      ],
      hasMore: false,
    });

    renderClient({ initialKudos: [], initialHasMore: false, currentUserId: "user-1" });

    await user.click(screen.getByTestId("ghi-nhan-button"));

    const recipientInput = screen.getByLabelText(/Người nhận/i);
    await user.type(recipientInput, "Carl");
    await waitFor(() => expect(mockedSearchProfiles).toHaveBeenCalledWith("Carl"));
    await user.click(await screen.findByText("Carl"));

    await user.type(screen.getByLabelText(/Nội dung/i), "Thanks!");
    const hashtagInput = screen.getByLabelText(/Hashtag/i);
    await user.type(hashtagInput, "ship-it{Enter}");

    await user.click(screen.getByRole("button", { name: /^Gửi$/ }));

    await waitFor(() => {
      expect(mockedCreateKudos).toHaveBeenCalledWith({
        receiverId: "recipient-1",
        content: "Thanks!",
        hashtags: ["ship-it"],
      });
    });
    await waitFor(() => {
      expect(mockedListKudos).toHaveBeenCalledWith({ offset: 0, limit: 20 });
    });
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
    expect(await screen.findByText("Thanks!")).toBeInTheDocument();
  });

  it("shows the submit error and keeps the modal open when createKudos fails", async () => {
    const user = userEvent.setup();
    mockedSearchProfiles.mockResolvedValue([
      { id: "recipient-1", fullName: "Carl", avatarUrl: null },
    ]);
    mockedCreateKudos.mockResolvedValue({
      kudosId: null,
      error: new Error("Content is required."),
    });

    renderClient({ initialKudos: [], initialHasMore: false, currentUserId: "user-1" });

    await user.click(screen.getByTestId("ghi-nhan-button"));

    const recipientInput = screen.getByLabelText(/Người nhận/i);
    await user.type(recipientInput, "Carl");
    await waitFor(() => expect(mockedSearchProfiles).toHaveBeenCalledWith("Carl"));
    await user.click(await screen.findByText("Carl"));

    await user.type(screen.getByLabelText(/Nội dung/i), "Thanks!");
    await user.type(screen.getByLabelText(/Hashtag/i), "ship-it{Enter}");

    await user.click(screen.getByRole("button", { name: /^Gửi$/ }));

    expect(await screen.findByText("Content is required.")).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(mockedListKudos).not.toHaveBeenCalled();
  });
});
