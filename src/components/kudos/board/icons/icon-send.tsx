import type { SVGProps } from "react";

/**
 * Sender → receiver arrow icon on each kudos card — Figma instance
 * I3127:21871;256:5147 (component 256:5140, shared icon set 178:1020). Mono
 * icon: fill swapped to currentColor per code-rules.md §2a.
 */
export function IconSend(props: SVGProps<SVGSVGElement>) {
  return (
    // mm:I3127:21871;256:5147
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M2.9043 20.4797V4.47974L21.9043 12.4797M4.9043 17.4797L16.7543 12.4797L4.9043 7.47974V10.9797L10.9043 12.4797L4.9043 13.9797M4.9043 17.4797V7.47974V13.9797V17.4797Z"
        fill="currentColor"
      />
    </svg>
  );
}
