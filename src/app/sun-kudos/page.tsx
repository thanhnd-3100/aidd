import { createClient } from "@/lib/supabase/server";
import { listKudos, type ListKudosResult } from "@/lib/kudos/list-kudos";
import { mapKudosRow, PAGE_SIZE } from "./kudos-view-model";
import { SunKudosClient } from "./sun-kudos-client";

/**
 * Reads the current session's user id without redirecting — mirrors
 * `get-homepage-view-data.ts`'s "public page, auth only informs rendering"
 * pattern. Any lookup failure (missing Supabase env vars, network error, no
 * session) is treated as "unauthenticated" rather than thrown, since this
 * page must stay public per clarifications.md.
 */
async function getCurrentUserId(): Promise<string | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {
      return null;
    }

    return data.user.id;
  } catch {
    return null;
  }
}

/**
 * Fetches the first feed page. `listKudos` already fails soft to an empty
 * page on a Supabase-level error, but it doesn't guard against
 * `createClient()` itself throwing (e.g. missing env vars) — that case is
 * caught here so a data-layer misconfiguration renders the empty state
 * instead of crashing this public page.
 */
async function getFirstPage(): Promise<ListKudosResult> {
  try {
    return await listKudos({ offset: 0, limit: PAGE_SIZE });
  } catch {
    return { kudos: [], hasMore: false };
  }
}

/**
 * Public Sun* Kudos board page (mm:2940:13431, live board). No auth guard —
 * this page stays public per clarifications.md; `SunKudosClient` is the one
 * that redirects an unauthenticated visitor to /login, and only when they
 * try to act ("Ghi nhận" or like), not on page load.
 */
export default async function SunKudosPage() {
  const [currentUserId, { kudos, hasMore }] = await Promise.all([
    getCurrentUserId(),
    getFirstPage(),
  ]);

  return (
    <SunKudosClient
      initialKudos={kudos.map(mapKudosRow)}
      initialHasMore={hasMore}
      currentUserId={currentUserId}
    />
  );
}
