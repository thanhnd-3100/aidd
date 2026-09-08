import { redirectIfUnauthenticated } from "@/lib/auth/session-guard";
import { AwardInformationScreen } from "@/components/awards-information/award-information-screen";

/**
 * Authenticated-only Awards Information page (mm:313:8436). Guards the
 * route the same way `/todo` does, then renders the fully static
 * `AwardInformationScreen` composition from Track A — see
 * plans/260908-1118-award-information-screen/phase-i1-integration.md.
 */
export default async function AwardsInformationPage() {
  await redirectIfUnauthenticated("/login");

  return <AwardInformationScreen />;
}
