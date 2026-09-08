interface AwardCategory {
  slug: string;
  title: string;
}

/**
 * Stub award categories the homepage's category cards hash-link into
 * (`#slug`). Real content is a future plan — see
 * plans/260907-1545-home-screen/clarifications.md.
 */
export const AWARD_CATEGORIES: AwardCategory[] = [
  { slug: "top-talent", title: "Top Talent" },
  { slug: "top-project", title: "Top Project" },
  { slug: "top-project-leader", title: "Top Project Leader" },
  { slug: "best-manager", title: "Best Manager" },
  { slug: "signature-2025-creator", title: "Signature 2025 Creator" },
  { slug: "mvp", title: "MVP" },
];

/**
 * Stub landing page for the homepage's "Awards Information" link and its
 * six award-category cards. Each category gets a real id-anchored section
 * so hash-scroll navigation (e.g. `/awards-information#mvp`) works; full
 * content is a future plan.
 */
export default function AwardsInformationPage() {
  return (
    <main>
      <h1>Awards Information</h1>
      {AWARD_CATEGORIES.map((category) => (
        <section key={category.slug} id={category.slug}>
          <h2>{category.title}</h2>
        </section>
      ))}
    </main>
  );
}
