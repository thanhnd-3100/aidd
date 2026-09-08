"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import styles from "./hero-cta.module.css";
import { IconArrowUpRight } from "./icon-arrow-up-right";

/**
 * mm:2167:9062 — B3 Call-To-Action: two plain navigation links (no
 * click-handler props needed) to the B0 stub routes.
 */
export function HeroCta() {
  const t = useTranslations("home.hero.cta");

  return (
    // mm:2167:9062
    <div className={styles.cta}>
      {/* mm:2167:9063 */}
      <Link href="/awards-information" className={`${styles.button} ${styles.primary}`}>
        <span>{t("aboutAwards")}</span>
        {/* mm:I2167:9063;186:1766 */}
        <IconArrowUpRight className={styles.icon} />
      </Link>
      {/* mm:2167:9064 */}
      <Link href="/sun-kudos" className={`${styles.button} ${styles.secondary}`}>
        <span>{t("aboutKudos")}</span>
        {/* mm:I2167:9064;186:2761 */}
        <IconArrowUpRight className={styles.icon} />
      </Link>
    </div>
  );
}
