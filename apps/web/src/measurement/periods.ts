import type { PeriodGrain } from "@/measurement/types";

const BRISBANE = "Australia/Brisbane";

function brisbaneParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-AU", {
    timeZone: BRISBANE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  }).formatToParts(date);
  const value = (type: string) => parts.find((part) => part.type === type)?.value || "";
  return {
    year: Number(value("year")),
    month: Number(value("month")),
    day: Number(value("day")),
    weekday: value("weekday"),
  };
}

/** Calendar date in Australia/Brisbane as YYYY-MM-DD. */
export function brisbaneDateIso(date: Date): string {
  const { year, month, day } = brisbaneParts(date);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function parseIsoDate(iso: string): Date {
  const ts = Date.parse(iso);
  if (Number.isNaN(ts)) return new Date(0);
  return new Date(ts);
}

/** ISO-8601 week key (YYYY-Www) using Brisbane calendar date. */
export function brisbaneWeekKey(date: Date): string {
  const { year, month, day } = brisbaneParts(date);
  // Use UTC noon on the Brisbane Y-M-D so weekday math is stable.
  const utc = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  const dayNum = utc.getUTCDay() || 7; // Mon=1 … Sun=7
  utc.setUTCDate(utc.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((utc.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
  return `${utc.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

export function brisbaneMonthKey(date: Date): string {
  const { year, month } = brisbaneParts(date);
  return `${year}-${String(month).padStart(2, "0")}`;
}

export function periodKeyFor(ts: string | Date, grain: PeriodGrain): string {
  const date = typeof ts === "string" ? parseIsoDate(ts) : ts;
  if (grain === "daily") return brisbaneDateIso(date);
  if (grain === "weekly") return brisbaneWeekKey(date);
  return brisbaneMonthKey(date);
}

export function emptyPeriodBucket(period: string, grain: PeriodGrain) {
  return {
    period,
    grain,
    page_views: 0,
    booking_clicks: 0,
    call_clicks: 0,
    digital_reception_opens: 0,
    digital_reception_searches: 0,
    digital_reception_result_clicks: 0,
    task_shortcuts: 0,
  };
}
