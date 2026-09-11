import type { SVGProps } from "react";

/**
 * "Ghi nhận" trigger pen icon — Figma instance I2940:13449;186:2759
 * (component 214:3812, shared icon set 178:1020). Mono icon: fill swapped
 * to currentColor per code-rules.md §2a so the parent's `color` controls it.
 */
export function IconPen(props: SVGProps<SVGSVGElement>) {
  return (
    // mm:I2940:13449;186:2759
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M20.8067 6.72951C21.1967 6.33951 21.1967 5.68951 20.8067 5.31951L18.4667 2.97951C18.0967 2.58951 17.4467 2.58951 17.0567 2.97951L15.2167 4.80951L18.9667 8.55951M3.09668 16.9395V20.6895H6.84668L17.9067 9.61951L14.1567 5.86951L3.09668 16.9395Z"
        fill="currentColor"
      />
    </svg>
  );
}
