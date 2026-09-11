/**
 * Shared board types — prop-driven, no fetching/Supabase types here (owned by
 * the integration phase). See plans/260908-1654-sun-kudos-board/phase-a1-board-screen.md.
 */
export interface Kudos {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatarUrl?: string;
  receiverName: string;
  receiverAvatarUrl?: string;
  /** ISO-8601 timestamp. */
  createdAt: string;
  content: string;
  hashtags: string[];
  likeCount: number;
}

export interface KudosBoardProps {
  kudos: Kudos[];
  hasMore: boolean;
  onLoadMore: () => void;
  onGhiNhanClick: () => void;
  onLikeClick: (kudosId: string) => void;
  /** `null`/`undefined` when the visitor is unauthenticated. */
  currentUserId?: string | null;
}

export interface KudosCardProps {
  kudos: Kudos;
  currentUserId?: string | null;
  onLikeClick: (kudosId: string) => void;
}
