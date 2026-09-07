import { createClient } from "@/lib/supabase/client";

export interface SignInWithGoogleResult {
  error: Error | null;
}

/**
 * Starts the Google OAuth flow via Supabase from a Client Component.
 *
 * `origin` must be the browser's `window.location.origin` (passed in by the
 * caller rather than read here) so this stays a plain, testable function.
 */
export async function signInWithGoogle(
  origin: string
): Promise<SignInWithGoogleResult> {
  const supabase = createClient();

  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback`,
    },
  });

  return { error: error ?? null };
}
