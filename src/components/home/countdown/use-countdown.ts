"use client";

import { useEffect, useState } from "react";

const UPDATE_INTERVAL_MS = 30_000;
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
 * Client-side minute-granularity countdown to `targetDatetime` (ISO-8601).
 * Tracks only a `now` tick in state (updated every ~30s — spec B1/B1.3 only
 * requires the displayed minutes to stay accurate, not a per-second ticker)
 * and derives days/hours/minutes from it at render, so the interval callback
 * is the only thing calling `setState`. An unparseable or past
 * `targetDatetime` resolves to a static 0/0/0 with `isPast: true`, never
 * throws.
 */
export function useCountdown(targetDatetime: string): CountdownValue {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const intervalId = setInterval(() => setNow(Date.now()), UPDATE_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, []);

  return computeRemaining(targetDatetime, now);
}
