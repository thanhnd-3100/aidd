import { fireEvent, render, screen } from "@testing-library/react";
import { KudosComposer } from "./kudos-composer";
import type { RecipientOption } from "./types";

jest.mock("next-intl", () => ({
  useTranslations: () => {
    const messages: Record<string, string> = {
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

const recipientOptions: RecipientOption[] = [
  { id: "u1", name: "Nguyễn Văn A" },
  { id: "u2", name: "Trần Thị B" },
];

function renderComposer(overrides: Partial<Parameters<typeof KudosComposer>[0]> = {}) {
  const props = {
    open: true,
    onClose: jest.fn(),
    recipientOptions,
    onSearchRecipient: jest.fn(),
    onSubmit: jest.fn(),
    submitting: false,
    submitError: null,
    ...overrides,
  };
  render(<KudosComposer {...props} />);
  return props;
}

function fillMinimumValidForm() {
  fireEvent.change(screen.getByLabelText("Người nhận"), {
    target: { value: "Nguyễn" },
  });
  fireEvent.click(screen.getByText("Nguyễn Văn A"));
  fireEvent.change(screen.getByLabelText("Nội dung"), {
    target: { value: "Cảm ơn bạn rất nhiều!" },
  });
  const hashtagInput = screen.getByPlaceholderText("Nhập hashtag rồi nhấn Enter");
  fireEvent.change(hashtagInput, { target: { value: "teamwork" } });
  fireEvent.keyDown(hashtagInput, { key: "Enter" });
}

describe("KudosComposer", () => {
  it("renders nothing when open is false", () => {
    renderComposer({ open: false });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders the modal when open is true", () => {
    renderComposer();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(
      screen.getByText("Gửi lời cám ơn và ghi nhận đến đồng đội")
    ).toBeInTheDocument();
  });

  it("disables the submit button until recipient, content, and a hashtag are all filled", () => {
    renderComposer();
    const submitButton = screen.getByText("Gửi").closest("button")!;
    expect(submitButton).toBeDisabled();

    fireEvent.change(screen.getByLabelText("Người nhận"), {
      target: { value: "Nguyễn" },
    });
    fireEvent.click(screen.getByText("Nguyễn Văn A"));
    expect(submitButton).toBeDisabled();

    fireEvent.change(screen.getByLabelText("Nội dung"), {
      target: { value: "Cảm ơn bạn rất nhiều!" },
    });
    expect(submitButton).toBeDisabled();

    const hashtagInput = screen.getByPlaceholderText("Nhập hashtag rồi nhấn Enter");
    fireEvent.change(hashtagInput, { target: { value: "teamwork" } });
    fireEvent.keyDown(hashtagInput, { key: "Enter" });

    expect(submitButton).toBeEnabled();
  });

  it("adds a hashtag chip on Enter and on comma", () => {
    renderComposer();
    const hashtagInput = screen.getByPlaceholderText("Nhập hashtag rồi nhấn Enter");

    fireEvent.change(hashtagInput, { target: { value: "teamwork" } });
    fireEvent.keyDown(hashtagInput, { key: "Enter" });
    expect(screen.getByText("#teamwork")).toBeInTheDocument();

    fireEvent.change(hashtagInput, { target: { value: "sunstar" } });
    fireEvent.keyDown(hashtagInput, { key: "," });
    expect(screen.getByText("#sunstar")).toBeInTheDocument();
  });

  it("removes a hashtag chip when its 'x' button is clicked", () => {
    renderComposer();
    const hashtagInput = screen.getByPlaceholderText("Nhập hashtag rồi nhấn Enter");
    fireEvent.change(hashtagInput, { target: { value: "teamwork" } });
    fireEvent.keyDown(hashtagInput, { key: "Enter" });
    expect(screen.getByText("#teamwork")).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Remove hashtag teamwork"));
    expect(screen.queryByText("#teamwork")).not.toBeInTheDocument();
  });

  it("enforces a maximum of 5 hashtags by hiding the input past the limit", () => {
    renderComposer();
    const addHashtag = (tag: string) => {
      const input = screen.getByPlaceholderText("Nhập hashtag rồi nhấn Enter");
      fireEvent.change(input, { target: { value: tag } });
      fireEvent.keyDown(input, { key: "Enter" });
    };

    ["one", "two", "three", "four", "five"].forEach(addHashtag);

    expect(screen.getAllByText(/^#/)).toHaveLength(5);
    expect(
      screen.queryByPlaceholderText("Nhập hashtag rồi nhấn Enter")
    ).not.toBeInTheDocument();
  });

  it("calls onSubmit with the form data when Gửi is clicked", () => {
    const props = renderComposer();
    fillMinimumValidForm();

    fireEvent.click(screen.getByText("Gửi").closest("button")!);

    expect(props.onSubmit).toHaveBeenCalledWith({
      recipientId: "u1",
      content: "Cảm ơn bạn rất nhiều!",
      hashtags: ["teamwork"],
    });
  });

  it("shows a loading label while submitting is true", () => {
    renderComposer({ submitting: true });
    expect(screen.getByText("Đang gửi...")).toBeInTheDocument();
  });

  it("displays submitError when set", () => {
    renderComposer({ submitError: "Không thể gửi kudo, vui lòng thử lại." });
    expect(
      screen.getByText("Không thể gửi kudo, vui lòng thử lại.")
    ).toBeInTheDocument();
  });

  it("calls onClose and discards local state when Hủy is clicked", () => {
    const props = renderComposer();
    fillMinimumValidForm();

    fireEvent.click(screen.getByText("Hủy").closest("button")!);

    expect(props.onClose).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText("Người nhận")).toHaveValue("");
    expect(screen.getByLabelText("Nội dung")).toHaveValue("");
    expect(screen.queryByText("#teamwork")).not.toBeInTheDocument();
  });
});
