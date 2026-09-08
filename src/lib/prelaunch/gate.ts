import { NextResponse, type NextRequest } from "next/server";

const EXEMPT_PATH_PREFIXES = ["/countdown", "/_next", "/favicon.ico", "/api"];

const LAUNCH_WINDOW_MS = 60 * 60 * 1000;

/**
 * Maps the raw `PRELAUNCH_GATE_ENABLED` env string to a tri-state override:
 * `"true"` forces the gate on, `"false"` forces it off, and anything else
 * (including unset) falls through to date-driven logic via `undefined`.
 */
export function parseGateOverride(raw: string | undefined): boolean | undefined {
  if (raw === "true") {
    return true;
  }

  if (raw === "false") {
    return false;
  }

  return undefined;
}

/**
 * Whether `now` is still more than 1 hour before `eventDatetime` (i.e.
 * still outside the 1-hour-early launch window). Returns `false` — never
 * gate on bad config — when `eventDatetime` is missing or unparseable.
 */
export function isBeforeLaunchWindow(
  eventDatetime: string | undefined,
  now: Date = new Date()
): boolean {
  if (!eventDatetime) {
    return false;
  }

  const eventTime = new Date(eventDatetime).getTime();
  if (Number.isNaN(eventTime)) {
    return false;
  }

  return now.getTime() < eventTime - LAUNCH_WINDOW_MS;
}

/**
 * Pure routing decision for the site-wide prelaunch gate: does this
 * `pathname` need to be redirected to `/countdown`?
 *
 * `gateOverride === true` forces the gate on for every non-exempt path.
 * `gateOverride === false` forces the gate off unconditionally.
 * `gateOverride === undefined` falls back to date logic: gated while
 * `isBeforeLaunchWindow` is `true`.
 *
 * Exempt paths (`/countdown` itself and Next.js internals — `/_next/*`,
 * `/favicon.ico`, `/api/*`) are never gated, regardless of the above, so the
 * countdown page can render and the app keeps functioning at the platform
 * level while the gate is active.
 */
export function shouldGate(
  pathname: string,
  gateOverride: boolean | undefined,
  isBeforeLaunchWindow: boolean
): boolean {
  const gateActive = gateOverride === undefined ? isBeforeLaunchWindow : gateOverride;

  if (!gateActive) {
    return false;
  }

  return !EXEMPT_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

/**
 * Reads `PRELAUNCH_GATE_ENABLED` and `EVENT_DATETIME` and, when the gate is
 * active and the requested path isn't exempt, returns a redirect
 * `NextResponse` to `/countdown`. Returns `null` when the request should
 * proceed normally.
 */
export function checkPrelaunchGate(request: NextRequest): NextResponse | null {
  const gateOverride = parseGateOverride(process.env.PRELAUNCH_GATE_ENABLED);
  const beforeLaunchWindow = isBeforeLaunchWindow(process.env.EVENT_DATETIME);

  if (!shouldGate(request.nextUrl.pathname, gateOverride, beforeLaunchWindow)) {
    return null;
  }

  const redirectUrl = new URL("/countdown", request.nextUrl.origin);
  return NextResponse.redirect(redirectUrl);
}
