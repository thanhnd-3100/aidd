import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const LOGIN_FAILURE_REDIRECT = "/login?error=oauth_failed";
const LOGIN_SUCCESS_REDIRECT = "/todo";

/**
 * OAuth callback route: Supabase (via Google) redirects here with a `code`
 * query param. Exchanges it for a session cookie, then sends the user on to
 * /todo. Any missing code or exchange failure sends the user back to
 * /login with an error code the login page maps to a user-facing message.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const code = request.nextUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(
      new URL(LOGIN_FAILURE_REDIRECT, request.url)
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      new URL(LOGIN_FAILURE_REDIRECT, request.url)
    );
  }

  return NextResponse.redirect(new URL(LOGIN_SUCCESS_REDIRECT, request.url));
}
