"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import styles from "./kudos-promo.module.css";
import { montserrat } from "./fonts";
import { IconArrowDetail } from "./icons/icon-arrow-detail";

/**
 * Sun* Kudos promo block (Figma spec D1/D2/D2.1, instance mms_D1_Sunkudos
 * node 3390:10349). Static/presentational — "Chi tiết" links to the
 * `/sun-kudos` stub page (out of scope here per phase-a4).
 */
export function KudosPromo() {
  const t = useTranslations("home.kudos");

  return (
    // mm:3390:10349
    <section
      data-testid="kudos-promo"
      className={`${styles.kudosPromo} ${montserrat.variable}`}
    >
      {/* mm:I3390:10349;313:8415 */}
      <div className={styles.card}>
        {/* mm:I3390:10349;313:8416 */}
        <Image
          src="/home/kudos/kudos-background.png"
          alt=""
          fill
          className={styles.background}
          sizes="(max-width: 1120px) 100vw, 1120px"
        />

        {/* mm:I3390:10349;313:8419 */}
        <div className={styles.content}>
          {/* mm:I3390:10349;313:8420 */}
          <div className={styles.textBlock}>
            {/* mm:I3390:10349;313:8421 */}
            <p className={styles.label}>{t("label")}</p>
            {/* mm:I3390:10349;313:8422 */}
            <h2 className={styles.title}>{t("title")}</h2>
            {/* mm:I3390:10349;313:8423 */}
            <p className={styles.description}>{t("description")}</p>
          </div>

          {/* mm:I3390:10349;313:8424 */}
          <div className={styles.actions}>
            {/* mm:I3390:10349;313:8426 */}
            <Link href="/sun-kudos" className={styles.ctaButton}>
              {/* mm:I3390:10349;313:8426;186:1935 */}
              <span className={styles.ctaLabel}>
                {/* mm:I3390:10349;313:8426;186:1568 */}
                {t("cta")}
              </span>
              {/* mm:I3390:10349;313:8426;186:1766 */}
              <IconArrowDetail className={styles.ctaIcon} />
            </Link>
          </div>
        </div>

        {/* mm:I3390:10349;313:8417 — empty decorative frame, no fill/effect in design */}
        <span className={styles.decorativeSlot} aria-hidden="true" />

        {/* mm:I3390:10349;329:2948 */}
        <Image
          src="/home/kudos/kudos-wordmark.svg"
          alt=""
          width={364}
          height={72}
          className={styles.wordmark}
        />
      </div>
    </section>
  );
}
