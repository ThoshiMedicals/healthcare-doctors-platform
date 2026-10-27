/**
 * Insights dashboard data modes (C9).
 * Live = warehouse / production events · Demo = training sample · Empty = UAT empty states.
 * Demo datasets live under `@/measurement/demo` — never mixed into the warehouse file.
 */

export const INSIGHTS_DATA_MODES = ["live", "demo", "empty"] as const;

export type InsightsDataMode = (typeof INSIGHTS_DATA_MODES)[number];

export const INSIGHTS_DATA_MODE_LABEL: Record<InsightsDataMode, string> = {
  live: "Live",
  demo: "Demo",
  empty: "Empty",
};

export const INSIGHTS_DATA_MODE_DESCRIPTION: Record<InsightsDataMode, string> = {
  live: "Production warehouse feed when connected; empty until traffic is collected.",
  demo: "Realistic healthcare sample for training, presentations, and UAT — not live traffic.",
  empty: "Zero-activity view for empty-state and onboarding UAT.",
};

export function isInsightsDataMode(value: string | null | undefined): value is InsightsDataMode {
  return !!value && (INSIGHTS_DATA_MODES as readonly string[]).includes(value);
}

export function parseInsightsDataMode(value: string | null | undefined): InsightsDataMode | undefined {
  return isInsightsDataMode(value) ? value : undefined;
}

/** Default: Demo when no warehouse so dashboards stay meaningful before live traffic. */
export function defaultInsightsDataMode(warehouseAvailable: boolean): InsightsDataMode {
  return warehouseAvailable ? "live" : "demo";
}

export function resolveInsightsDataMode(
  requested: string | null | undefined,
  warehouseAvailable: boolean,
): InsightsDataMode {
  return parseInsightsDataMode(requested) ?? defaultInsightsDataMode(warehouseAvailable);
}

export function insightsDataModeOptions(): Array<{ value: InsightsDataMode; label: string }> {
  return INSIGHTS_DATA_MODES.map((value) => ({
    value,
    label: INSIGHTS_DATA_MODE_LABEL[value],
  }));
}
