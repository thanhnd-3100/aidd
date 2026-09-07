import { Montserrat, Montserrat_Alternates } from "next/font/google";

/**
 * Login screen typography (Figma: "Montserrat" / "Montserrat Alternates").
 * Loaded locally to this feature so we don't touch the shared root layout
 * (out of ownership for this task) — exposed as CSS variables consumed by
 * the CSS Modules in this directory.
 */
export const montserrat = Montserrat({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-montserrat",
});

export const montserratAlternates = Montserrat_Alternates({
  subsets: ["latin", "vietnamese"],
  weight: ["700"],
  variable: "--font-montserrat-alternates",
});
