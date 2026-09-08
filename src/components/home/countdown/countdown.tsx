"use client";

import { useTranslations } from "next-intl";
import styles from "./countdown.module.css";
import { useCountdown } from "./use-countdown";

export interface CountdownProps {
  /** ISO-8601 event start datetime. Server-resolved, passed down as a prop
   * (integration phase reads EVENT_DATETIME) so this stays a pure client
   * component with no direct env access. */
  targetDatetime: string;
}

function pad2(value: number): string {
  return String(Math.min(Math.max(0, value), 99)).padStart(2, "0");
}

interface TileProps {
  value: number;
  label: string;
}

function CountdownTile({ value, label }: TileProps) {
  const [tens, ones] = pad2(value).split("");

  return (
    // mm:2167:9038 (Days) / mm:2167:9043 (Hours) / mm:2167:9048 (Minutes)
    <div className={styles.tile}>
      {/* mm:2167:9039 */}
      <div className={styles.digits} data-testid="countdown-value">
        {/* mm:2167:9040 */}
        <span className={styles.digitBox}>
          <span className={styles.digit}>{tens}</span>
        </span>
        {/* mm:2167:9041 */}
        <span className={styles.digitBox}>
          <span className={styles.digit}>{ones}</span>
        </span>
      </div>
      <p className={styles.label}>{label}</p>
    </div>
  );
}

/**
 * mm:2167:9035 — B1 Countdown time: owns both the "Coming soon" subtitle and
 * the DAYS/HOURS/MINUTES tiles (B1.2 + B1.3 sit as siblings under the same
 * Figma frame), so hiding the subtitle on `isPast` is local state here
 * rather than a value threaded back up through the parent.
 */
export function Countdown({ targetDatetime }: CountdownProps) {
  const t = useTranslations("home.hero");
  const { days, hours, minutes, isPast } = useCountdown(targetDatetime);

  return (
    <div className={styles.countdown} data-testid="countdown">
      {!isPast ? (
        // mm:2167:9036
        <p className={styles.comingSoon}>{t("comingSoon")}</p>
      ) : null}
      {/* mm:2167:9037 */}
      <div className={styles.tiles}>
        <CountdownTile value={days} label={t("countdown.days")} />
        <CountdownTile value={hours} label={t("countdown.hours")} />
        <CountdownTile value={minutes} label={t("countdown.minutes")} />
      </div>
    </div>
  );
}
