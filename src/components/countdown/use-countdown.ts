"use client";

import { useEffect, useState } from "react";

const TICK_INTERVAL_MS = 1_000;
const MS_PER_MINUTE = 60_000;
const MS_PER_HOUR = 60 * MS_PER_MINUTE;
const MS_PER_DAY = 24 * MS_PER_HOUR;

export interface CountdownValue {
  days: number;
  hours: number;
  minutes: number;
  /** true once `targetDatetime` has passed (or couldn't be parsed). */
  isPast: boolean;
}

const ZERO: CountdownValue = { days: 0, hours: 0, minutes: 0, isPast: true };

function computeRemaining(targetDatetime: string, now: number): CountdownValue {
  const targetMs = Date.parse(targetDatetime);
  if (Number.isNaN(targetMs)) return ZERO;

  const remainingMs = targetMs - now;
  if (remainingMs <= 0) return ZERO;

  return {
    days: Math.floor(remainingMs / MS_PER_DAY),
    hours: Math.floor((remainingMs % MS_PER_DAY) / MS_PER_HOUR),
    minutes: Math.floor((remainingMs % MS_PER_HOUR) / MS_PER_MINUTE),
    isPast: false,
  };
}

/**
 * Client-side second-granularity countdown to `targetDatetime` (ISO-8601).
 * This screen's own spec explicitly requires the DAYS/HOURS/MINUTES units to
 * "auto-update every second" — a stricter cadence than the home screen's
 * hero countdown (`src/components/home/countdown/use-countdown.ts`), which
 * only needs minute-granularity and ticks every ~30s. Kept as its own small
 * hook rather than sharing one abstraction across two unrelated feature
 * directories for ~15 lines of logic (YAGNI/KISS).
 *
 * An unparseable or already-past `targetDatetime` resolves to a static
 * 0/0/0 with `isPast: true`, never throws.
 */
export function useCountdown(targetDatetime: string): CountdownValue {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const intervalId = setInterval(() => setNow(Date.now()), TICK_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, []);

  return computeRemaining(targetDatetime, now);
}
