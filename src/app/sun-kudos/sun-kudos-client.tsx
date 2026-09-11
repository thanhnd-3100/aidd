"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { KudosBoard } from "@/components/kudos/board/kudos-board";
import type { Kudos } from "@/components/kudos/board/types";
import { KudosComposer } from "@/components/kudos/composer/kudos-composer";
import type {
  KudosComposerSubmitPayload,
  RecipientOption,
} from "@/components/kudos/composer/types";
import { createKudos } from "@/lib/kudos/create-kudos";
import { listKudos, type KudosRow } from "@/lib/kudos/list-kudos";
import { searchProfiles } from "@/lib/kudos/search-profiles";
import { mapKudosRow, PAGE_SIZE } from "./kudos-view-model";
import { toggleLike } from "@/lib/kudos/toggle-like";

export interface SunKudosClientProps {
  initialKudos: Kudos[];
  initialHasMore: boolean;
  /** `null` when the visitor has no session — the page itself stays public. */
  currentUserId: string | null;
}

/**
 * Client-side wiring for `/sun-kudos` (mm:2940:13431 board + mm:520:11647
 * composer). Holds the composer's open state and the paginated feed, routes
 * unauthenticated "Ghi nhận"/like clicks to `/login`, and calls B1's server
 * actions for search, create, refetch, and like toggling. No business logic
 * lives in `KudosBoard`/`KudosComposer` themselves — both stay presentational.
 */
export function SunKudosClient({
  initialKudos,
  initialHasMore,
  currentUserId,
}: SunKudosClientProps) {
  const router = useRouter();
  const [kudos, setKudos] = useState<Kudos[]>(initialKudos);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [modalOpen, setModalOpen] = useState(false);
  const [recipientOptions, setRecipientOptions] = useState<RecipientOption[]>(
    []
  );
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  /** Unauthenticated visitors are redirected to /login instead of acting. */
  function requireAuth(action: () => void) {
    if (!currentUserId) {
      router.push("/login");
      return;
    }
    action();
  }

  function handleGhiNhanClick() {
    requireAuth(() => setModalOpen(true));
  }

  async function performLikeToggle(kudosId: string) {
    try {
      const { action, error } = await toggleLike({ kudosId });

      if (error || !action) {
        // Fail soft: the composer/board have no error slot for like
        // failures, so the count simply stays unchanged.
        return;
      }

      const delta = action === "liked" ? 1 : -1;
      setKudos((current) =>
        current.map((item) =>
          item.id === kudosId
            ? { ...item, likeCount: item.likeCount + delta }
            : item
        )
      );
    } catch {
      // Network/unexpected failure — leave state unchanged, fail soft.
    }
  }

  function handleLikeClick(kudosId: string) {
    requireAuth(() => {
      void performLikeToggle(kudosId);
    });
  }

  async function handleSearchRecipient(query: string) {
    try {
      const results = await searchProfiles(query);
      setRecipientOptions(
        results.map((profile) => ({
          id: profile.id,
          name: profile.fullName ?? "",
          avatarUrl: profile.avatarUrl ?? undefined,
        }))
      );
    } catch {
      setRecipientOptions([]);
    }
  }

  async function handleSubmit(payload: KudosComposerSubmitPayload) {
    setSubmitting(true);
    setSubmitError(null);

    try {
      const { error } = await createKudos({
        receiverId: payload.recipientId,
        content: payload.content,
        hashtags: payload.hashtags,
      });

      if (error) {
        setSubmitError(error.message);
        setSubmitting(false);
        return;
      }

      // Clarifications.md: refetch page 1 rather than optimistic prepend.
      const refetched = await listKudos({ offset: 0, limit: PAGE_SIZE });
      setKudos(refetched.kudos.map(mapKudosRow));
      setHasMore(refetched.hasMore);
      setSubmitting(false);
      setModalOpen(false);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Failed to send kudos."
      );
      setSubmitting(false);
    }
  }

  async function handleLoadMore() {
    try {
      const result = await listKudos({ offset: kudos.length, limit: PAGE_SIZE });
      setKudos((current) => [...current, ...result.kudos.map(mapKudosRow)]);
      setHasMore(result.hasMore);
    } catch {
      // Fail soft: keep the current page rather than crash the board.
    }
  }

  return (
    <>
      <KudosBoard
        kudos={kudos}
        hasMore={hasMore}
        onLoadMore={() => void handleLoadMore()}
        onGhiNhanClick={handleGhiNhanClick}
        onLikeClick={handleLikeClick}
        currentUserId={currentUserId}
      />
      <KudosComposer
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        recipientOptions={recipientOptions}
        onSearchRecipient={(query) => void handleSearchRecipient(query)}
        onSubmit={(payload) => void handleSubmit(payload)}
        submitting={submitting}
        submitError={submitError}
      />
    </>
  );
}
