import { Montserrat } from "next/font/google";

/**
 * Hero section typography (Figma: "Montserrat"), scoped to this section like
 * the login screen's local font loader — the CSS variable it exposes
 * cascades to Countdown and HeroCta since they're always mounted as
 * descendants of HeroSection's wrapper.
 */
export const montserrat = Montserrat({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "700", "800"],
  variable: "--font-montserrat",
});
