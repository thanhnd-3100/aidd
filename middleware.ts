import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * Refreshes the Supabase auth session on every request to a matched path,
 * so an expired access token gets rotated before it reaches a Server
 * Component (which cannot write cookies itself — see
 * `src/lib/supabase/server.ts`).
 */
export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/todo",
    "/awards-information",
    "/sun-kudos",
    "/admin-dashboard",
  ],
};
