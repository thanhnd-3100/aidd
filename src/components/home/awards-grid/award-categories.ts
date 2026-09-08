/**
 * mm:5005:14974 — the 6 award category cards, in Figma grid order (2 rows of
 * 3). Slugs match the anchor ids created in `/awards-information` (Phase B0)
 * exactly, so hash-scroll navigation resolves.
 *
 * `translationKey` looks up `home.awards.categories.{key}` for title +
 * (optional) description; `hasDescription` mirrors the downloaded specs
 * where only "Top Talent" (C2.1.3) carries real description copy — the other
 * 5 categories' spec description fields are empty, so their cards render
 * without a description line rather than inventing one (see
 * plans/260907-1545-home-screen/phase-a3-content-awards-grid.md).
 */
export interface AwardCategory {
  slug: string;
  translationKey: string;
  hasDescription: boolean;
  nameImageSrc: string;
  nameImageWidth: number;
  nameImageHeight: number;
}

export const AWARD_CATEGORIES: AwardCategory[] = [
  {
    slug: "top-talent",
    translationKey: "topTalent",
    hasDescription: true,
    nameImageSrc: "/home/awards-grid/name-top-talent.png",
    nameImageWidth: 222,
    nameImageHeight: 36,
  },
  {
    slug: "top-project",
    translationKey: "topProject",
    hasDescription: false,
    nameImageSrc: "/home/awards-grid/name-top-project.png",
    nameImageWidth: 232,
    nameImageHeight: 35,
  },
  {
    slug: "top-project-leader",
    translationKey: "topProjectLeader",
    hasDescription: false,
    nameImageSrc: "/home/awards-grid/name-top-project-leader.png",
    nameImageWidth: 232,
    nameImageHeight: 64,
  },
  {
    slug: "best-manager",
    translationKey: "bestManager",
    hasDescription: false,
    nameImageSrc: "/home/awards-grid/name-best-manager.png",
    nameImageWidth: 232,
    nameImageHeight: 30,
  },
  {
    slug: "signature-2025-creator",
    translationKey: "signature2025Creator",
    hasDescription: false,
    nameImageSrc: "/home/awards-grid/name-signature-2025-creator.png",
    nameImageWidth: 232,
    nameImageHeight: 54,
  },
  {
    slug: "mvp",
    translationKey: "mvp",
    hasDescription: false,
    nameImageSrc: "/home/awards-grid/name-mvp.png",
    nameImageWidth: 116,
    nameImageHeight: 52,
  },
];
