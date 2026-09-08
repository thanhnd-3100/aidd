import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { checkPrelaunchGate } from "@/lib/prelaunch/gate";

/**
 * Redirects every route to `/countdown` while the site-wide prelaunch gate
 * is enabled, otherwise refreshes the Supabase auth session on every
 * request to a matched path, so an expired access token gets rotated
 * before it reaches a Server Component (which cannot write cookies itself
 * — see `src/lib/supabase/server.ts`).
 */
export async function middleware(request: NextRequest) {
  const gateResponse = checkPrelaunchGate(request);
  if (gateResponse) {
    return gateResponse;
  }

  return updateSession(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api).*)"],
};
