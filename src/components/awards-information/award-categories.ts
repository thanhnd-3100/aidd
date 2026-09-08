/**
 * The 6 SAA 2025 award categories (Figma spec C.1-C.6 / D.1-D.6, node
 * 313:8459 "mms_C_Menu list" + 313:8466 "mms_D.Danh sách giải thưởng").
 * `slug` is reused verbatim from the existing `/awards-information` stub
 * (see plans/260908-1118-award-information-screen/clarifications.md) so any
 * existing inbound `#slug` links keep working. `messageKey` maps to the
 * matching `awards-information.cards.*` / `awards-information.nav.*` leaf
 * in src/messages/awards-information.json.
 */
export interface AwardCategory {
  slug: string;
  messageKey: string;
}

export const AWARD_CATEGORIES: AwardCategory[] = [
  { slug: "top-talent", messageKey: "topTalent" },
  { slug: "top-project", messageKey: "topProject" },
  { slug: "top-project-leader", messageKey: "topProjectLeader" },
  { slug: "best-manager", messageKey: "bestManager" },
  { slug: "signature-2025-creator", messageKey: "signature2025Creator" },
  { slug: "mvp", messageKey: "mvp" },
];
