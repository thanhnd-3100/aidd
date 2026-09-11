import type { SVGProps } from "react";

/**
 * Like-count heart icon on each kudos card — Figma instance
 * I3127:21871;256:5171 (component 256:5162, shared icon set 178:1020).
 * Figma fill is the brand red (#D4271D); swapped to currentColor per
 * code-rules.md §2a so the disabled ("can't like your own kudos") state can
 * grey it out from the parent button's `color` instead of a second asset.
 */
export function IconHeart(props: SVGProps<SVGSVGElement>) {
  return (
    // mm:I3127:21871;256:5171
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M12.3364 21.1076L10.8864 19.7876C5.73643 15.1176 2.33643 12.0276 2.33643 8.25757C2.33643 5.16757 4.75643 2.75757 7.83643 2.75757C9.57643 2.75757 11.2464 3.56757 12.3364 4.83757C13.4264 3.56757 15.0964 2.75757 16.8364 2.75757C19.9164 2.75757 22.3364 5.16757 22.3364 8.25757C22.3364 12.0276 18.9364 15.1176 13.7864 19.7876L12.3364 21.1076Z"
        fill="currentColor"
      />
    </svg>
  );
}
