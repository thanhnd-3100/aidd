import type { Kudos } from "@/components/kudos/board/types";
import type { KudosRow } from "@/lib/kudos/list-kudos";

/** Page size used for both the initial server fetch and every client refetch. */
export const PAGE_SIZE = 20;

/**
 * Maps B1's nested `KudosRow` (sender/receiver as profile objects) onto the
 * flat `Kudos` shape A1's `KudosBoard`/`KudosCard` expect. Neither phase
 * owns this translation — it only exists at this integration boundary.
 *
 * Lives in its own module rather than in `sun-kudos-client.tsx`: that file is
 * a `"use client"` module, so anything a Server Component imports from it is
 * replaced by a client-reference proxy. `PAGE_SIZE` then coerced to `NaN`
 * (sending `limit=NaN` to PostgREST, which answers with an empty feed) and
 * calling `mapKudosRow` server-side would have thrown outright.
 */
export function mapKudosRow(row: KudosRow): Kudos {
  return {
    id: row.id,
    senderId: row.sender.id,
    senderName: row.sender.fullName ?? "",
    senderAvatarUrl: row.sender.avatarUrl ?? undefined,
    receiverName: row.receiver.fullName ?? "",
    receiverAvatarUrl: row.receiver.avatarUrl ?? undefined,
    createdAt: row.createdAt,
    content: row.content,
    hashtags: row.hashtags,
    likeCount: row.likeCount,
  };
}
