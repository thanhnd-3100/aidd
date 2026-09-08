import { Montserrat } from "next/font/google";

/**
 * Header typography (Figma: "Montserrat", nav links + language selector).
 * Loaded locally to this feature so we don't touch the shared root layout
 * (out of ownership for this task) — exposed as a CSS variable consumed by
 * the CSS Modules in this directory. Mirrors
 * src/components/login/fonts.ts.
 */
export const montserrat = Montserrat({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-montserrat",
});
