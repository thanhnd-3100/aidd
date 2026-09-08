import Image from "next/image";
import { useTranslations } from "next-intl";
import styles from "./keyvisual-hero.module.css";

/**
 * mm:313:8437 (mms_3_Keyvisual) — full-bleed hero banner. Figma models the
 * "ROOT FURTHER" wordmark as a static raster (MM_MEDIA_Root Further Logo,
 * node 2789:12915) with no TEXT style; rendered here as real, localizable,
 * testable text instead — the same call already made for the homepage hero
 * (see src/components/home/hero/hero-section.tsx) and the login hero.
 */
export function KeyvisualHero() {
  const t = useTranslations("awards-information.hero");

  return (
    // mm:313:8437
    <section className={styles.hero}>
      <div className={styles.cover} aria-hidden="true" />
      <Image
        src="/awards-information/hero-logo.png"
        alt={t("alt")}
        width={338}
        height={150}
        className={styles.logo}
        priority
      />
      <div className={styles.content}>
        <h1 className={styles.title}>{t("title")}</h1>
        <p className={styles.subtitle}>{t("subtitle")}</p>
      </div>
    </section>
  );
}
