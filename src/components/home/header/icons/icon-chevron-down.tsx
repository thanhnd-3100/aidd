import type { SVGProps } from "react";

/**
 * mm_media_down (single-color icon) — fill swapped for currentColor so the
 * parent controls color via CSS, per code-rules.md rule 2a. Duplicated from
 * src/components/login/icons/icon-chevron-down.tsx (per clarifications: the
 * login language selector's icon is minimal enough to duplicate rather than
 * share across features).
 */
export function IconChevronDown(props: SVGProps<SVGSVGElement>) {
  return (
    // mm:I2167:9091;186:1696;186:1821;186:1441
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      {...props}
    >
      <path d="M7 10L12 15L17 10H7Z" fill="currentColor" />
    </svg>
  );
}
