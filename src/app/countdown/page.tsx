import { CountdownScreen } from "@/components/countdown/countdown-screen";

/**
 * Fallback event datetime used when `EVENT_DATETIME` is unset or not a
 * valid ISO-8601 string. Mirrors `get-homepage-view-data.ts`'s fallback so
 * the countdown page behaves deterministically even without the env var.
 */
const DEFAULT_EVENT_DATETIME = "2026-12-31T00:00:00.000Z";

function isValidIsoDatetime(value: string): boolean {
  return !Number.isNaN(new Date(value).getTime());
}

function resolveEventDatetime(): string {
  const raw = process.env.EVENT_DATETIME;

  if (raw && isValidIsoDatetime(raw)) {
    return raw;
  }

  return DEFAULT_EVENT_DATETIME;
}

/**
 * Fully public Countdown Prelaunch page (mm:2268:35127, clarifications.md
 * ID-3). No auth guard — this is the page every route redirects to while
 * the prelaunch gate (`middleware.ts` + `src/lib/prelaunch/gate.ts`) is on,
 * so it must render for guests too. Reads `EVENT_DATETIME` the same way
 * the homepage does (plain server-side read, no Edge Runtime involved).
 */
export default function CountdownPage() {
  const eventDatetime = resolveEventDatetime();

  return <CountdownScreen targetDatetime={eventDatetime} />;
}
