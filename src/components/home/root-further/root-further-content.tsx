import Image from "next/image";
import { useTranslations } from "next-intl";
import styles from "./root-further-content.module.css";

/**
 * mm:5001:14827 (mms_B4_content, wrapped in Frame 486 3204:10152) — the
 * "Root Further" theme block: decorative ROOT/FURTHER wordmark, two body
 * paragraphs, and the English proverb quote. Pure presentational, no props.
 */
export function RootFurtherContent() {
  const t = useTranslations("home.rootFurther");

  return (
    // mm:3204:10152_Frame 486
    <section className={styles.section}>
      {/* mm:3204:10153_Group 434 (decorative background wordmark) */}
      <div className={styles.wordmark} aria-hidden="true">
        {/* mm:3204:10155_MM_MEDIA_Root Text */}
        <Image
          src="/home/root-further/root-text.png"
          alt=""
          width={189}
          height={67}
          className={styles.rootText}
        />
        {/* mm:3204:10154_MM_MEDIA_Further Text */}
        <Image
          src="/home/root-further/further-text.png"
          alt=""
          width={290}
          height={67}
          className={styles.furtherText}
        />
      </div>

      {/* mm:3204:10156 */}
      <p className={styles.paragraph}>{t("paragraph1")}</p>

      {/* mm:3204:10161 */}
      <p className={styles.quote}>
        {t("quote")}
        <br />
        {t("quoteTranslation")}
      </p>

      {/* mm:3204:10162 */}
      <p className={styles.paragraph}>{t("paragraph2")}</p>
    </section>
  );
}
