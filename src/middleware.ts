import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { checkPrelaunchGate } from "@/lib/prelaunch/gate";

/**
 * Redirects every route to `/countdown` while the site-wide prelaunch gate
 * is enabled, otherwise refreshes the Supabase auth session on every
 * request to a matched path, so an expired access token gets rotated
 * before it reaches a Server Component (which cannot write cookies itself
 * — see `src/lib/supabase/server.ts`).
 *
 * The matcher below covers every route (minus static assets/api), so
 * `updateSession` throwing on a transient env/config issue (e.g. missing
 * Supabase env vars) would otherwise 500 the entire site. Fail open instead:
 * log it and let the request through unauthenticated rather than crash.
 */
export async function middleware(request: NextRequest) {
  const gateResponse = checkPrelaunchGate(request);
  if (gateResponse) {
    return gateResponse;
  }

  try {
    return await updateSession(request);
  } catch (error) {
    console.error("middleware: updateSession failed, failing open", error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api).*)"],
};
