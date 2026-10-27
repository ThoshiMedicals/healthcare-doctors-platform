import { brisbaneDateIso, brisbaneMonthKey } from "@/measurement/periods";
import type { MeasurementEvent } from "@/measurement/types";

export const EXECUTIVE_RANGES = ["last_7", "last_30", "mtd"] as const;
export type ExecutiveRange = (typeof EXECUTIVE_RANGES)[number];

export const EXECUTIVE_RANGE_LABEL: Record<ExecutiveRange, string> = {
  last_7: "Last 7 days",
  last_30: "Last 30 days",
  mtd: "Month-to-date",
};

function addDaysIso(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const utc = new Date(Date.UTC(y, m - 1, d + days, 12, 0, 0));
  return utc.toISOString().slice(0, 10);
}

export function resolveExecutiveRange(
  range: ExecutiveRange,
  now = new Date(),
): { start: string; end: string; label: string } {
  const end = brisbaneDateIso(now);
  if (range === "mtd") {
    const month = brisbaneMonthKey(now);
    return { start: `${month}-01`, end, label: EXECUTIVE_RANGE_LABEL.mtd };
  }
  if (range === "last_7") {
    return { start: addDaysIso(end, -6), end, label: EXECUTIVE_RANGE_LABEL.last_7 };
  }
  return { start: addDaysIso(end, -29), end, label: EXECUTIVE_RANGE_LABEL.last_30 };
}

export function eventBrisbaneDate(ts: string): string {
  const parsed = Date.parse(ts);
  if (Number.isNaN(parsed)) return "1970-01-01";
  return brisbaneDateIso(new Date(parsed));
}

export function filterEventsByRange(
  events: MeasurementEvent[],
  range: ExecutiveRange,
  now = new Date(),
): MeasurementEvent[] {
  const { start, end } = resolveExecutiveRange(range, now);
  return events.filter((event) => {
    const day = eventBrisbaneDate(event.ts);
    return day >= start && day <= end;
  });
}

export function isExecutiveRange(value: string | null | undefined): value is ExecutiveRange {
  return Boolean(value && (EXECUTIVE_RANGES as readonly string[]).includes(value));
}
