import { fireEvent, render, screen } from "@testing-library/react";
import { KudosBoard } from "./kudos-board";
import type { Kudos } from "./types";

jest.mock("next-intl", () => ({
  useTranslations: () => {
    const messages: Record<string, string> = {
      title: "Hệ thống ghi nhận và cảm ơn",
      wordmarkAlt: "KUDOS",
      ghiNhanPrompt: "Hôm nay, bạn muốn gửi lời cảm ơn và ghi nhận đến ai?",
      feedEyebrow: "Sun* Annual Awards 2025",
      feedHeading: "ALL KUDOS",
      emptyState: "Hiện tại chưa có Kudos nào.",
      loadMore: "Xem thêm",
    };
    return (key: string) => messages[key] ?? key;
  },
}));

jest.mock("next/font/google", () => ({
  Montserrat: () => ({ variable: "--font-montserrat" }),
}));

function buildKudos(overrides: Partial<Kudos> = {}): Kudos {
  return {
    id: "kudos-1",
    senderId: "sender-1",
    senderName: "Huỳnh Dương Xuân Nhật",
    receiverName: "Huỳnh Dương Xuân",
    createdAt: "2025-10-30T10:00:00+07:00",
    content: "Cảm ơn người em bình thường nhưng phi thường :D",
    hashtags: ["Dedicated", "Inspring"],
    likeCount: 1000,
    ...overrides,
  };
}

describe("KudosBoard", () => {
  const noop = () => {};

  it("renders the banner with the exact Figma title", () => {
    render(
      <KudosBoard
        kudos={[]}
        hasMore={false}
        onLoadMore={noop}
        onGhiNhanClick={noop}
        onLikeClick={noop}
      />
    );

    expect(screen.getByTestId("kudos-banner")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 1, name: "Hệ thống ghi nhận và cảm ơn" })
    ).toBeInTheDocument();
  });

  it("renders the exact empty-state copy required by the e2e contract", () => {
    render(
      <KudosBoard
        kudos={[]}
        hasMore={false}
        onLoadMore={noop}
        onGhiNhanClick={noop}
        onLikeClick={noop}
      />
    );

    expect(screen.getByTestId("kudos-empty-state")).toHaveTextContent(
      "Hiện tại chưa có Kudos nào."
    );
  });

  it("does not render the empty state when kudos exist", () => {
    render(
      <KudosBoard
        kudos={[buildKudos()]}
        hasMore={false}
        onLoadMore={noop}
        onGhiNhanClick={noop}
        onLikeClick={noop}
      />
    );

    expect(screen.queryByTestId("kudos-empty-state")).not.toBeInTheDocument();
    expect(screen.getAllByTestId("kudos-card")).toHaveLength(1);
  });

  it("calls onGhiNhanClick when the trigger pill is clicked", () => {
    const onGhiNhanClick = jest.fn();
    render(
      <KudosBoard
        kudos={[]}
        hasMore={false}
        onLoadMore={noop}
        onGhiNhanClick={onGhiNhanClick}
        onLikeClick={noop}
      />
    );

    fireEvent.click(screen.getByTestId("ghi-nhan-button"));
    expect(onGhiNhanClick).toHaveBeenCalledTimes(1);
  });

  it("shows the 'Ghi nhận' trigger with prompt copy containing 'ghi nhận'", () => {
    render(
      <KudosBoard
        kudos={[]}
        hasMore={false}
        onLoadMore={noop}
        onGhiNhanClick={noop}
        onLikeClick={noop}
      />
    );

    expect(screen.getByTestId("ghi-nhan-button")).toHaveTextContent(/ghi nhận/i);
  });

  it("renders 'Load more' only when hasMore is true, and wires the click", () => {
    const onLoadMore = jest.fn();
    const { rerender } = render(
      <KudosBoard
        kudos={[buildKudos()]}
        hasMore={false}
        onLoadMore={onLoadMore}
        onGhiNhanClick={noop}
        onLikeClick={noop}
      />
    );

    expect(screen.queryByTestId("kudos-load-more")).not.toBeInTheDocument();

    rerender(
      <KudosBoard
        kudos={[buildKudos()]}
        hasMore
        onLoadMore={onLoadMore}
        onGhiNhanClick={noop}
        onLikeClick={noop}
      />
    );

    const loadMoreButton = screen.getByTestId("kudos-load-more");
    fireEvent.click(loadMoreButton);
    expect(onLoadMore).toHaveBeenCalledTimes(1);
  });

  it("passes currentUserId through so a kudos card can disable its own like button", () => {
    render(
      <KudosBoard
        kudos={[buildKudos({ senderId: "viewer-1" })]}
        hasMore={false}
        onLoadMore={noop}
        onGhiNhanClick={noop}
        onLikeClick={noop}
        currentUserId="viewer-1"
      />
    );

    expect(screen.getByTestId("like-button")).toBeDisabled();
  });
});
