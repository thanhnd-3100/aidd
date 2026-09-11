"use server";

import { createClient } from "@/lib/supabase/server";

export interface ProfileSearchResult {
  id: string;
  fullName: string | null;
  avatarUrl: string | null;
}

const MAX_RESULTS = 10;

/**
 * Searches profiles by `full_name` (case-insensitive substring match) for
 * the recipient picker. Public — no auth check, matching the recipient
 * picker's public search UX. Empty/whitespace queries short-circuit before
 * touching the database.
 */
export async function searchProfiles(query: string): Promise<ProfileSearchResult[]> {
  const trimmed = query.trim();

  if (!trimmed) {
    return [];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url")
    .ilike("full_name", `%${trimmed}%`)
    .limit(MAX_RESULTS);

  if (error || !data) {
    return [];
  }

  return (data as { id: string; full_name: string | null; avatar_url: string | null }[]).map(
    (row) => ({
      id: row.id,
      fullName: row.full_name,
      avatarUrl: row.avatar_url,
    })
  );
}
