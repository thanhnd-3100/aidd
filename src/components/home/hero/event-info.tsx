"use client";

import { useTranslations } from "next-intl";
import styles from "./event-info.module.css";

/**
 * mm:2167:9053 — B2 Thông tin sự kiện: static time/location/note block,
 * no interaction. Wraps onto its own lines on narrow viewports (rule 3
 * "Static: Responsive: Trên màn nhỏ các dòng sẽ xuống hàng").
 */
export function EventInfo() {
  const t = useTranslations("home.hero.eventInfo");

  return (
    // mm:2167:9053
    <div className={styles.eventInfo}>
      {/* mm:2167:9054 */}
      <div className={styles.rows}>
        {/* mm:2167:9055 */}
        <p className={styles.row}>
          <span className={styles.label}>{t("timeLabel")}</span>
          <span className={styles.value}>{t("timeValue")}</span>
        </p>
        {/* mm:2167:9058 */}
        <p className={styles.row}>
          <span className={styles.label}>{t("locationLabel")}</span>
          <span className={styles.value}>{t("locationValue")}</span>
        </p>
      </div>
      {/* mm:2167:9061 */}
      <p className={styles.note}>{t("note")}</p>
    </div>
  );
}
