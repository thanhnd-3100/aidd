import { useTranslations } from "next-intl";
import styles from "./section-title.module.css";

/**
 * mm:313:8453 (mms_A_Title hệ thống giải thưởng) — static section title:
 * small eyebrow text plus the large gold heading. Not interactive.
 */
export function SectionTitle() {
  const t = useTranslations("awards-information.section");

  return (
    // mm:313:8453
    <div className={styles.sectionTitle}>
      {/* mm:313:8454 */}
      <p className={styles.eyebrow}>{t("eyebrow")}</p>
      {/* mm:313:8455 */}
      <span className={styles.divider} aria-hidden="true" />
      {/* mm:313:8457 */}
      <h2 className={styles.title}>{t("title")}</h2>
    </div>
  );
}
