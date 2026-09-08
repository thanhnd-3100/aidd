import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Refreshes the Supabase auth session for a middleware request.
 *
 * `supabase.auth.getUser()` rotates the access/refresh token pair when the
 * access token has expired. Any rotated cookies are written both onto the
 * incoming request (so downstream Server Components see the fresh session)
 * and onto the outgoing response (so the browser stores them) — without
 * this, expired access tokens spuriously log the user out because nothing
 * else in the app refreshes the session.
 */
export async function updateSession(request: NextRequest): Promise<NextResponse> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    throw new Error(
      "Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY must be set."
    );
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }

        response = NextResponse.next({ request });

        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // Result is intentionally unused: the call's side effect (rotating cookies
  // via `setAll` above) is what this function exists for.
  await supabase.auth.getUser();

  return response;
}
