import { createClient } from "@/lib/supabase/server";
import { getUserRole, type UserRole } from "@/lib/auth/get-user-role";

export interface HomepageViewData {
  isAuthenticated: boolean;
  role: UserRole;
  eventDatetime: string;
}

/**
 * Fallback event datetime used when `EVENT_DATETIME` is unset or not a
 * valid ISO-8601 string. Kept as a literal (rather than deriving from
 * `Date.now()`) so the countdown behaves deterministically until an
 * operator sets the real event date via env var.
 */
export const DEFAULT_EVENT_DATETIME = "2026-12-31T00:00:00.000Z";

function isValidIsoDatetime(value: string): boolean {
  return !Number.isNaN(new Date(value).getTime());
}

function resolveEventDatetime(): string {
  const raw = process.env.EVENT_DATETIME;

  if (raw && isValidIsoDatetime(raw)) {
    return raw;
  }

  return DEFAULT_EVENT_DATETIME;
}

/**
 * Server-only data for the homepage: whether a session exists, the
 * current user's role (only meaningful when authenticated), and the
 * event countdown target.
 *
 * The homepage itself is public (see clarifications ID-0/ID-1) — this
 * never redirects, it only informs what the header renders. Any lookup
 * failure (missing Supabase env vars, network error, no session) is
 * treated as "unauthenticated" rather than thrown, since a data-layer
 * failure must not break a public page.
 *
 * For an unauthenticated visitor, `role` defaults to `"user"` — the
 * least-privileged value — since there is no session to derive a role
 * from and callers must not accidentally grant admin-only UI to guests.
 */
export async function getHomepageViewData(): Promise<HomepageViewData> {
  const eventDatetime = resolveEventDatetime();

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {
      return { isAuthenticated: false, role: "user", eventDatetime };
    }

    return {
      isAuthenticated: true,
      role: getUserRole(data.user),
      eventDatetime,
    };
  } catch {
    return { isAuthenticated: false, role: "user", eventDatetime };
  }
}
