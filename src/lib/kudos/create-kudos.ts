"use server";

import { createClient } from "@/lib/supabase/server";

export interface CreateKudosParams {
  receiverId: string;
  content: string;
  hashtags: string[];
}

export interface CreateKudosResult {
  kudosId: string | null;
  error: Error | null;
}

const MIN_HASHTAGS = 1;
const MAX_HASHTAGS = 5;

/**
 * Creates a kudos from the caller (read server-side via `auth.uid()`, never
 * trusted from the client) to `receiverId`. Validates content and hashtag
 * count before touching the database.
 */
export async function createKudos({
  receiverId,
  content,
  hashtags,
}: CreateKudosParams): Promise<CreateKudosResult> {
  const trimmedContent = content.trim();

  if (!trimmedContent) {
    return { kudosId: null, error: new Error("Content is required.") };
  }

  if (hashtags.length < MIN_HASHTAGS || hashtags.length > MAX_HASHTAGS) {
    return {
      kudosId: null,
      error: new Error(`Choose between ${MIN_HASHTAGS} and ${MAX_HASHTAGS} hashtags.`),
    };
  }

  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    return { kudosId: null, error: new Error("You must be signed in to send kudos.") };
  }

  const { data, error } = await supabase
    .from("kudos")
    .insert({
      sender_id: userData.user.id,
      receiver_id: receiverId,
      content: trimmedContent,
      hashtags,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { kudosId: null, error: error ?? new Error("Failed to create kudos.") };
  }

  return { kudosId: data.id, error: null };
}
