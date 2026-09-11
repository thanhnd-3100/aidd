import { fireEvent, render, screen } from "@testing-library/react";
import { KudosCard } from "./kudos-card";
import type { Kudos } from "./types";

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

describe("KudosCard", () => {
  it("renders sender/receiver names, timestamp, content, and hashtags", () => {
    render(<KudosCard kudos={buildKudos()} onLikeClick={jest.fn()} />);

    expect(screen.getByText("Huỳnh Dương Xuân Nhật")).toBeInTheDocument();
    expect(screen.getByText("Huỳnh Dương Xuân")).toBeInTheDocument();
    expect(screen.getByText("10:00 - 10/30/2025")).toBeInTheDocument();
    expect(
      screen.getByText("Cảm ơn người em bình thường nhưng phi thường :D")
    ).toBeInTheDocument();
    expect(screen.getByText("#Dedicated")).toBeInTheDocument();
    expect(screen.getByText("#Inspring")).toBeInTheDocument();
  });

  it("formats the like count with vi-VN thousands grouping", () => {
    render(<KudosCard kudos={buildKudos({ likeCount: 1000 })} onLikeClick={jest.fn()} />);

    expect(screen.getByText("1.000")).toBeInTheDocument();
  });

  it("calls onLikeClick with the kudos id when the heart is clicked", () => {
    const onLikeClick = jest.fn();
    render(<KudosCard kudos={buildKudos({ id: "kudos-42" })} onLikeClick={onLikeClick} />);

    fireEvent.click(screen.getByTestId("like-button"));
    expect(onLikeClick).toHaveBeenCalledWith("kudos-42");
  });

  it("disables the like button when the current user authored the kudos", () => {
    render(
      <KudosCard
        kudos={buildKudos({ senderId: "viewer-1" })}
        currentUserId="viewer-1"
        onLikeClick={jest.fn()}
      />
    );

    expect(screen.getByTestId("like-button")).toBeDisabled();
  });

  it("keeps the like button enabled for kudos authored by someone else", () => {
    render(
      <KudosCard
        kudos={buildKudos({ senderId: "sender-1" })}
        currentUserId="viewer-1"
        onLikeClick={jest.fn()}
      />
    );

    expect(screen.getByTestId("like-button")).toBeEnabled();
  });

  it("does not render a hashtag list when there are no hashtags", () => {
    render(<KudosCard kudos={buildKudos({ hashtags: [] })} onLikeClick={jest.fn()} />);

    expect(screen.queryByText(/^#/)).not.toBeInTheDocument();
  });
});
