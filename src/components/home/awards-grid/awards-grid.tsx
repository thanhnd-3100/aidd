import { useTranslations } from "next-intl";
import styles from "./awards-grid.module.css";
import { AwardCard } from "./award-card";
import { AWARD_CATEGORIES } from "./award-categories";

/**
 * mm:2167:9068 — "Hệ thống giải thưởng" section: the C1 header caption/title
 * plus the C2 grid of 6 award-category cards. Presentational only; each card
 * hash-links into `/awards-information` (stubbed with matching anchor ids by
 * Phase B0).
 */
export function AwardsGrid() {
  const t = useTranslations("home.awards");

  return (
    // mm:2167:9068
    <section className={styles.section}>
      {/* mm:2167:9069_mms_C1_Header Giải thưởng */}
      <div className={styles.header}>
        {/* mm:2167:9070 */}
        <p className={styles.caption}>{t("caption")}</p>
        {/* mm:2167:9071 */}
        <div className={styles.divider} aria-hidden="true" />
        {/* mm:2167:9072 -> mm:2167:9073 */}
        <h2 className={styles.title}>{t("title")}</h2>
      </div>

      {/* mm:5005:14974_mms_C2_Award list */}
      <div className={styles.grid}>
        {AWARD_CATEGORIES.map((category) => (
          <AwardCard key={category.slug} category={category} />
        ))}
      </div>
    </section>
  );
}
