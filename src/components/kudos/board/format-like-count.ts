/**
 * Matches the Figma card's grouped count format (mm:I3127:21871;256:5174,
 * e.g. "1.000" for one thousand) — vi-VN groups thousands with a dot.
 */
export function formatLikeCount(count: number): string {
  return new Intl.NumberFormat("vi-VN").format(count);
}
