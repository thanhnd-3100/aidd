import { KudosPromo } from "@/components/home/kudos/kudos-promo";
import styles from "./award-information-screen.module.css";
import { montserrat } from "./fonts";
import { KeyvisualHero } from "./keyvisual-hero";
import { SectionTitle } from "./section-title";
import { CategoryNav } from "./category-nav";
import { AwardCard } from "./award-card";
import { AWARD_CATEGORIES } from "./award-categories";

/**
 * mm:313:8436 (Hệ thống giải) — Award Information screen, presentational
 * only. Composes: Keyvisual hero (3) -> section title (A) -> two-column
 * layout (left: category nav (C), right: 6 award cards (D.1-D.6)) ->
 * Sun* Kudos promo (D1/D2/D2.1, reused as-is). No props: every category's
 * title/description/quantity/prize is static per the downloaded MoMorph
 * specs — see plans/260908-1118-award-information-screen/phase-a1-award-
 * information-screen.md. Header/Footer and the auth guard are owned by the
 * integration phase (I1), which renders this component from
 * src/app/awards-information/page.tsx.
 */
export function AwardInformationScreen() {
  return (
    <main className={`${styles.screen} ${montserrat.variable}`}>
      <KeyvisualHero />
      <SectionTitle />

      {/* mm:313:8458 (Hệ thống giải thưởng) */}
      <div className={styles.body}>
        <CategoryNav />

        {/* mm:313:8466 (mms_D.Danh sách giải thưởng) */}
        <div className={styles.cards}>
          {AWARD_CATEGORIES.map((category) => (
            <AwardCard
              key={category.slug}
              slug={category.slug}
              messageKey={category.messageKey}
            />
          ))}
        </div>
      </div>

      <div className={styles.kudos}>
        <KudosPromo />
      </div>
    </main>
  );
}
