/** How the user entered an Insights investigation (D6). */
export const INVESTIGATION_SOURCES = [
  "kpi",
  "recommendation",
  "chart",
  "health",
  "queue",
  "filter",
] as const;

export type InvestigationSource = (typeof INVESTIGATION_SOURCES)[number];

export const INVESTIGATION_SOURCE_LABEL: Record<InvestigationSource, string> = {
  kpi: "From KPI",
  recommendation: "From recommendation",
  chart: "From chart",
  health: "From health score",
  queue: "From queue",
  filter: "Filtered investigation",
};

export function isInvestigationSource(
  value: string | null | undefined,
): value is InvestigationSource {
  return !!value && (INVESTIGATION_SOURCES as readonly string[]).includes(value);
}

/** Attach investigation source onto filters for outbound navigation. */
export function withInvestigationSource<T extends { from?: InvestigationSource }>(
  filters: T | null | undefined,
  from: InvestigationSource,
): T & { from: InvestigationSource } {
  return { ...(filters ?? ({} as T)), from };
}
