import { Montserrat } from "next/font/google";

/**
 * Countdown Prelaunch screen typography (Figma: "Montserrat"). Loaded
 * locally to this feature — matches the same per-feature font pattern used
 * by src/components/home/hero/fonts.ts and
 * src/components/awards-information/fonts.ts.
 */
export const montserrat = Montserrat({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "700", "800"],
  variable: "--font-montserrat",
});
