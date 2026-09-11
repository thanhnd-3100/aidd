function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

/**
 * Matches the Figma card timestamp format exactly (mm:I3127:21871;256:5229,
 * e.g. "10:00 - 10/30/2025"): 24h HH:mm, then MM/DD/YYYY. Uses local time —
 * the design gives no timezone-conversion requirement and Sunners are all
 * on the same office timezone.
 */
export function formatKudosTimestamp(isoDatetime: string): string {
  const date = new Date(isoDatetime);
  const hours = pad2(date.getHours());
  const minutes = pad2(date.getMinutes());
  const month = pad2(date.getMonth() + 1);
  const day = pad2(date.getDate());
  const year = date.getFullYear();

  return `${hours}:${minutes} - ${month}/${day}/${year}`;
}
