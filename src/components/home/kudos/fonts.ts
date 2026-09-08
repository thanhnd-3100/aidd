import { Montserrat } from "next/font/google";

/**
 * Kudos promo typography (Figma: "Montserrat", label/title/description/CTA).
 * Loaded locally to this feature so we don't touch the shared root layout
 * (out of ownership for this task) — exposed as a CSS variable consumed by
 * the CSS Modules in this directory. Mirrors src/components/login/fonts.ts.
 */
export const montserrat = Montserrat({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "700"],
  variable: "--font-montserrat",
});
