import type { User } from "@supabase/supabase-js";

export type UserRole = "user" | "admin";

const DEFAULT_ROLE: UserRole = "user";

function isUserRole(value: unknown): value is UserRole {
  return value === "user" || value === "admin";
}

/**
 * Reads `role` from the Supabase user's `app_metadata`, defaulting to
 * `"user"` when it is absent or holds an unrecognized value. No dedicated
 * roles table exists yet — `auth.users.app_metadata` is sufficient for
 * this stage (see plans/260907-1545-home-screen/clarifications.md).
 */
export function getUserRole(user: Pick<User, "app_metadata"> | null): UserRole {
  if (!user) {
    return DEFAULT_ROLE;
  }

  // `app_metadata` (not `user_metadata`, which the authenticated user can
  // rewrite from the browser via `supabase.auth.updateUser`) can only be
  // written through the privileged service-role/Admin API, so reading the
  // role from here is what actually prevents client-side self-promotion.
  const role = user.app_metadata?.role;

  return isUserRole(role) ? role : DEFAULT_ROLE;
}
