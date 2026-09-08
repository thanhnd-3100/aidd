import Image from "next/image";
import { useTranslations } from "next-intl";
import styles from "./award-card.module.css";

export interface AwardCardProps {
  /** Anchor id — matches the corresponding category-nav slug. */
  slug: string;
  /** Leaf key under `awards-information.cards.*` in the messages tree. */
  messageKey: string;
}

/**
 * mm:313:8467/313:8468/313:8469/313:8470/313:8471/313:8510
 * (mms_D.1-D.6 award cards) — award image (336x336, shared
 * mm_media_Award-Thumb-Background asset across all 6 categories per the
 * live Figma file), title, description, quantity line, and prize line(s).
 * Read-only.
 */
export function AwardCard({ slug, messageKey }: AwardCardProps) {
  const t = useTranslations(`awards-information.cards.${messageKey}`);
  const prizeLines = t.has("prizeLine2")
    ? [t("prizeLine1"), t("prizeLine2")]
    : [t("prizeLine1")];

  return (
    // mm:313:8467 etc.
    <section id={slug} className={styles.card}>
      {/* mm:*;214:2525;81:2442 mm_media_Award-Thumb-Background */}
      <Image
        src="/awards-information/award-thumbnail.png"
        alt=""
        width={336}
        height={336}
        className={styles.image}
      />

      <div className={styles.content}>
        {/* title */}
        <h3 className={styles.title}>{t("title")}</h3>
        {/* description paragraph */}
        <p className={styles.description}>{t("description")}</p>

        <span className={styles.divider} aria-hidden="true" />

        {/* quantity line */}
        <p className={styles.line}>
          {t("quantityLabel")} {t("quantity")}
        </p>

        <span className={styles.divider} aria-hidden="true" />

        {/* prize line(s) — Signature 2025 - Creator has two (individual/team) */}
        <div className={styles.prizeLines}>
          {prizeLines.map((line) => (
            <p key={line} className={styles.line}>
              {line}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}
