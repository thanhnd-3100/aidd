import { Montserrat } from "next/font/google";

/**
 * Board typography (Figma: "Montserrat" throughout the banner, feed header,
 * and card text). Loaded locally to this feature so we don't touch the
 * shared root layout (out of ownership for this task) — mirrors
 * src/components/home/kudos/fonts.ts and src/components/countdown/fonts.ts.
 */
export const montserrat = Montserrat({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "700"],
  variable: "--font-montserrat",
});
