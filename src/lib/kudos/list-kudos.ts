"use server";

import { createClient } from "@/lib/supabase/server";

export interface KudosProfile {
  id: string;
  fullName: string | null;
  avatarUrl: string | null;
}

export interface KudosRow {
  id: string;
  content: string;
  hashtags: string[];
  createdAt: string;
  sender: KudosProfile;
  receiver: KudosProfile;
  likeCount: number;
}

export interface ListKudosParams {
  offset: number;
  limit: number;
}

export interface ListKudosResult {
  kudos: KudosRow[];
  hasMore: boolean;
}

interface RawProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
}

interface RawKudosRow {
  id: string;
  content: string;
  hashtags: string[] | null;
  created_at: string;
  sender: RawProfile | RawProfile[] | null;
  receiver: RawProfile | RawProfile[] | null;
  kudos_likes: { count: number }[] | null;
}

const EMPTY_PROFILE: RawProfile = { id: "", full_name: null, avatar_url: null };

function mapProfile(raw: RawProfile | RawProfile[] | null): KudosProfile {
  const profile = (Array.isArray(raw) ? raw[0] : raw) ?? EMPTY_PROFILE;

  return {
    id: profile.id,
    fullName: profile.full_name,
    avatarUrl: profile.avatar_url,
  };
}

function mapRow(row: RawKudosRow): KudosRow {
  return {
    id: row.id,
    content: row.content,
    hashtags: row.hashtags ?? [],
    createdAt: row.created_at,
    sender: mapProfile(row.sender),
    receiver: mapProfile(row.receiver),
    likeCount: row.kudos_likes?.[0]?.count ?? 0,
  };
}

/**
 * Lists the kudos feed newest-first with sender/receiver profile info and a
 * like count per kudos. Public — works for anonymous callers since the
 * `kudos_select_all`/`profiles_select_all` RLS policies allow anon reads.
 *
 * Fails soft to an empty page on any Supabase error (including "relation
 * does not exist" when the kudos migration has not been applied yet) so
 * the board page can always render its empty state instead of crashing.
 */
export async function listKudos({ offset, limit }: ListKudosParams): Promise<ListKudosResult> {
  const supabase = await createClient();

  // Fetch one extra row beyond `limit` to cheaply detect whether more pages
  // remain, without a separate count query.
  const { data, error } = await supabase
    .from("kudos")
    .select(
      `id, content, hashtags, created_at,
       sender:profiles!kudos_sender_id_fkey(id, full_name, avatar_url),
       receiver:profiles!kudos_receiver_id_fkey(id, full_name, avatar_url),
       kudos_likes(count)`
    )
    .order("created_at", { ascending: false })
    .range(offset, offset + limit);

  if (error || !data) {
    // Logged rather than thrown: this path also covers the pre-migration
    // "relation does not exist" state, which must still render the board's
    // empty state. Without this line, a real bug (bad join, RLS
    // misconfiguration, exhausted pool) is indistinguishable from "no
    // kudos yet" once the migration is live.
    console.error("listKudos failed", error);
    return { kudos: [], hasMore: false };
  }

  const rows = data as unknown as RawKudosRow[];
  const hasMore = rows.length > limit;
  const pageRows = hasMore ? rows.slice(0, limit) : rows;

  return { kudos: pageRows.map(mapRow), hasMore };
}
