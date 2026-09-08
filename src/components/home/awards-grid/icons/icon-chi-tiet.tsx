import type { SVGProps } from "react";

/**
 * mm_media_up (single-color icon used on every "Chi tiết" link) — fill
 * swapped for currentColor so the parent controls color via CSS, per
 * code-rules.md rule 2a.
 */
export function IconChiTiet(props: SVGProps<SVGSVGElement>) {
  return (
    // mm:I2167:9075;214:1023;186:1441
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      {...props}
    >
      <path
        d="M8.49945 18.3104L5.68945 15.5004L12.0595 9.12043H7.10945V5.69043H18.3095V16.8904H14.8895V11.9404L8.49945 18.3104Z"
        fill="currentColor"
      />
    </svg>
  );
}
