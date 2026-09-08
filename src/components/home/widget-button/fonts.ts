import { Montserrat } from "next/font/google";

/**
 * Widget button typography (Figma: "Montserrat", the "/" separator glyph).
 * Loaded locally to this feature so we don't touch the shared root layout
 * (out of ownership for this task) — exposed as a CSS variable consumed by
 * the CSS Modules in this directory. Mirrors src/components/login/fonts.ts.
 */
export const montserrat = Montserrat({
  subsets: ["latin", "vietnamese"],
  weight: ["700"],
  variable: "--font-montserrat",
});
