import type { UserRole } from "@/lib/auth/get-user-role";
import { Header } from "./header/header";
import { Footer } from "./footer/footer";
import { HeroSection } from "./hero/hero-section";
import { RootFurtherContent } from "./root-further/root-further-content";
import { AwardsGrid } from "./awards-grid/awards-grid";
import { KudosPromo } from "./kudos/kudos-promo";
import { WidgetButton } from "./widget-button/widget-button";

export interface HomeScreenProps {
  isAuthenticated: boolean;
  role: UserRole;
  /** ISO-8601 event start datetime, forwarded to the hero section's countdown. */
  eventDatetime: string;
}

/**
 * Integration point (phase-i1): composes the 4 Track A sections (chrome,
 * hero, content, promo) plus Track B's session/role/datetime data into the
 * full homepage. Each section owns its own presentation; this component
 * only wires the props each one actually needs.
 */
export function HomeScreen({
  isAuthenticated,
  role,
  eventDatetime,
}: HomeScreenProps) {
  return (
    <>
      <Header isAuthenticated={isAuthenticated} role={role} activeLink="about" />
      <main>
        <HeroSection targetDatetime={eventDatetime} />
        <RootFurtherContent />
        <AwardsGrid />
        <KudosPromo />
      </main>
      <WidgetButton />
      <Footer />
    </>
  );
}
