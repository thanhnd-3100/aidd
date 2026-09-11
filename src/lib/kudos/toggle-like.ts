"use server";

import { createClient } from "@/lib/supabase/server";

export interface ToggleLikeParams {
  kudosId: string;
}

export type ToggleLikeAction = "liked" | "unliked";

export interface ToggleLikeResult {
  action: ToggleLikeAction | null;
  error: Error | null;
}

/**
 * Toggles the caller's like on a kudos: inserts a `kudos_likes` row if none
 * exists, deletes it otherwise. Rejects self-likes and unauthenticated callers.
 *
 * The self-like rule is enforced in BOTH layers on purpose: here for a clean
 * error message, and in RLS (`20260911140000_kudos_likes_block_self_like.sql`)
 * because this server action is not on the only path to the table — a caller
 * holding their own access token can POST to /rest/v1/kudos_likes directly.
 */
export async function toggleLike({ kudosId }: ToggleLikeParams): Promise<ToggleLikeResult> {
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    return { action: null, error: new Error("You must be signed in to like kudos.") };
  }

  const userId = userData.user.id;

  const { data: kudosRow, error: kudosError } = await supabase
    .from("kudos")
    .select("sender_id")
    .eq("id", kudosId)
    .single();

  if (kudosError || !kudosRow) {
    return { action: null, error: new Error("Kudos not found.") };
  }

  if (kudosRow.sender_id === userId) {
    return { action: null, error: new Error("You can't like your own kudos.") };
  }

  const { data: existingLike, error: existingLikeError } = await supabase
    .from("kudos_likes")
    .select("kudos_id")
    .eq("kudos_id", kudosId)
    .eq("user_id", userId)
    .maybeSingle();

  if (existingLikeError) {
    return { action: null, error: new Error("Failed to check like status.") };
  }

  if (existingLike) {
    const { error: deleteError } = await supabase
      .from("kudos_likes")
      .delete()
      .eq("kudos_id", kudosId)
      .eq("user_id", userId);

    if (deleteError) {
      return { action: null, error: new Error("Failed to unlike kudos.") };
    }

    return { action: "unliked", error: null };
  }

  const { error: insertError } = await supabase
    .from("kudos_likes")
    .insert({ kudos_id: kudosId, user_id: userId });

  if (insertError) {
    return { action: null, error: new Error("Failed to like kudos.") };
  }

  return { action: "liked", error: null };
}
