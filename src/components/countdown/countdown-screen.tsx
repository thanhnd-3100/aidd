"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import styles from "./countdown-screen.module.css";
import { montserrat } from "./fonts";
import { useCountdown } from "./use-countdown";

export interface CountdownScreenProps {
  /** ISO-8601 event start datetime. Server-resolved (integration phase reads
   * `EVENT_DATETIME`), passed down so this stays a pure client component
   * with no direct env access. */
  targetDatetime: string;
}

function pad2(value: number): string {
  return String(Math.min(Math.max(0, value), 99)).padStart(2, "0");
}

interface UnitProps {
  value: number;
  label: string;
}

/**
 * mm:2268:35139 / mm:2268:35144 / mm:2268:35149 (Days / Hours / Minutes) —
 * each unit is a pair of LED-style digit boxes plus an uppercase label
 * below.
 */
function CountdownUnit({ value, label }: UnitProps) {
  const [tens, ones] = pad2(value).split("");

  return (
    <div className={styles.unit}>
      {/* mm:2268:35140 (Frame 485) */}
      <div className={styles.digits} data-testid="countdown-value">
        {/* mm:2268:35141 (Group 5) */}
        <span className={styles.digitBox}>
          <span className={styles.digit}>{tens}</span>
        </span>
        {/* mm:2268:35142 (Group 4) */}
        <span className={styles.digitBox}>
          <span className={styles.digit}>{ones}</span>
        </span>
      </div>
      {/* Explicit spaces: browsers don't insert whitespace between block-level
          siblings' text nodes, so concatenated textContent would otherwise
          read "14Ngày03Giờ" with no word boundary for tests/assistive tech. */}
      {" "}
      <p className={styles.label}>{label}</p>
      {" "}
    </div>
  );
}

/**
 * mm:2268:35127 (Countdown - Prelaunch page) — full-bleed background with a
 * dark overlay, centered title, and the three DAYS/HOURS/MINUTES LED-digit
 * units. Purely presentational: no page/routing/gate logic (owned by the
 * integration phase, `src/app/countdown/page.tsx`). Days/Hours/Minutes are
 * clamped by construction — `useCountdown` derives them from a correct
 * remaining-time calculation, so Hours/Minutes are always in 00–23/00–59.
 */
export function CountdownScreen({ targetDatetime }: CountdownScreenProps) {
  const t = useTranslations("countdown");
  const router = useRouter();
  const { days, hours, minutes, isPast } = useCountdown(targetDatetime);

  // The gate itself is server-authoritative (middleware re-checks on every
  // navigation); this just gets a guest who is already sitting on this page
  // off it once the tick-driven countdown reaches zero, instead of leaving
  // them stuck looking at 00:00:00 forever.
  useEffect(() => {
    if (isPast) {
      router.replace("/");
    }
  }, [isPast, router]);

  return (
    // mm:2268:35127
    <section className={`${styles.screen} ${montserrat.variable}`}>
      {/* mm:2268:35129 MM_MEDIA_BG Image */}
      <div
        className={styles.background}
        data-testid="countdown-background"
        aria-hidden="true"
      />
      {/* mm:2268:35130 Cover */}
      <div className={styles.cover} aria-hidden="true" />

      {/* mm:2268:35131 Bìa */}
      <div className={styles.content}>
        {/* mm:2268:35137 */}
        <h1 className={styles.title}>{t("title")}</h1>

        {/* mm:2268:35138 Time */}
        <div className={styles.units} data-testid="countdown">
          <CountdownUnit value={days} label={t("days")} />
          <CountdownUnit value={hours} label={t("hours")} />
          <CountdownUnit value={minutes} label={t("minutes")} />
        </div>
      </div>
    </section>
  );
}
