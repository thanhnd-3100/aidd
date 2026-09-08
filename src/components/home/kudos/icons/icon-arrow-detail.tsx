import type { SVGProps } from "react";

/**
 * "Chi tiết" (detail) link arrow — Figma instance
 * I3390:10349;313:8426;186:1766 (component 186:2691, shared "Up" icon).
 * Mono icon: fill swapped to currentColor per code-rules.md §2a so the
 * parent's `color` controls it via CSS.
 */
export function IconArrowDetail(props: SVGProps<SVGSVGElement>) {
  return (
    // mm:I3390:10349;313:8426;186:1766
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M8.49945 18.3104L5.68945 15.5004L12.0595 9.12043H7.10945V5.69043H18.3095V16.8904H14.8895V11.9404L8.49945 18.3104Z"
        fill="currentColor"
      />
    </svg>
  );
}
