import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Reads the current session from the server-side Supabase client.
 * Returns `null` when there is no session or Supabase reports an error,
 * so callers never have to distinguish "not logged in" from "check failed".
 */
async function getSessionUser() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    return null;
  }

  return data.user;
}

/**
 * Redirects away from a guest-only page (e.g. /login) when a session
 * already exists. Call before rendering to avoid a flash of guest content.
 */
export async function redirectIfAuthenticated(
  destination: string = "/todo"
): Promise<void> {
  const user = await getSessionUser();

  if (user) {
    redirect(destination);
  }
}

/**
 * Redirects away from an authenticated-only page (e.g. /todo) when there
 * is no session. Inverse of `redirectIfAuthenticated`.
 */
export async function redirectIfUnauthenticated(
  destination: string = "/login"
): Promise<void> {
  const user = await getSessionUser();

  if (!user) {
    redirect(destination);
  }
}
