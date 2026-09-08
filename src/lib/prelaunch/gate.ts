import { NextResponse, type NextRequest } from "next/server";

const EXEMPT_PATH_PREFIXES = ["/countdown", "/_next", "/favicon.ico", "/api"];

/**
 * Pure routing decision for the site-wide prelaunch gate: does this
 * `pathname` need to be redirected to `/countdown`?
 *
 * Always `false` when `enabled` is `false`. When `enabled` is `true`,
 * `true` for every path except `/countdown` itself and Next.js internals
 * (`/_next/*`, `/favicon.ico`, `/api/*`) — those must stay reachable so the
 * countdown page can render and the app keeps functioning at the platform
 * level while the gate is active.
 */
export function shouldGate(pathname: string, enabled: boolean): boolean {
  if (!enabled) {
    return false;
  }

  return !EXEMPT_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

/**
 * Reads the `PRELAUNCH_GATE_ENABLED` toggle and, when the gate is active
 * and the requested path isn't exempt, returns a redirect `NextResponse` to
 * `/countdown`. Returns `null` when the request should proceed normally.
 */
export function checkPrelaunchGate(request: NextRequest): NextResponse | null {
  const enabled = process.env.PRELAUNCH_GATE_ENABLED === "true";

  if (!shouldGate(request.nextUrl.pathname, enabled)) {
    return null;
  }

  const redirectUrl = new URL("/countdown", request.nextUrl.origin);
  return NextResponse.redirect(redirectUrl);
}
