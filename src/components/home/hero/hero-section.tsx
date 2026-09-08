"use client";

import { useTranslations } from "next-intl";
import styles from "./hero-section.module.css";
import { montserrat } from "./fonts";
import { EventInfo } from "./event-info";
import { Countdown } from "../countdown/countdown";
import { HeroCta } from "../cta/hero-cta";

export interface HeroSectionProps {
  /** ISO-8601 event start datetime, resolved server-side (EVENT_DATETIME)
   * and passed down — see Countdown's own doc comment for why this stays
   * out of this component's own concerns too. */
  targetDatetime: string;
}

/**
 * mm:2167:9027 + mm:2167:9030 (Bìa wrapper, hero slice only) — composes the
 * homepage hero: full-bleed keyvisual, "ROOT FURTHER" title, countdown,
 * event info, and the two CTA buttons. Presentational only; Header/Footer
 * and the sections below the hero are owned by other Track A jobs.
 */
export function HeroSection({ targetDatetime }: HeroSectionProps) {
  const t = useTranslations("home.hero");

  return (
    // mm:2167:9030
    <section className={`${styles.hero} ${montserrat.variable}`}>
      {/* mm:2167:9027 */}
      <div className={styles.keyVisual} aria-hidden="true" />
      {/* mm:2167:9029 */}
      <div className={styles.cover} aria-hidden="true" />

      {/* mm:2167:9031 */}
      <div className={styles.content}>
        {/* mm:2167:9032 */}
        <h1 className={styles.title}>{t("title")}</h1>

        {/* mm:2167:9034 */}
        <div className={styles.body}>
          <Countdown targetDatetime={targetDatetime} />
          <EventInfo />
        </div>

        {/* mm:2167:9062 */}
        <HeroCta />
      </div>
    </section>
  );
}
