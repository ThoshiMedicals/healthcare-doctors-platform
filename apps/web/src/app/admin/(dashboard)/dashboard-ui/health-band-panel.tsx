import {
  PLATFORM_HEALTH_BAND_EXPLANATIONS,
  PLATFORM_HEALTH_BAND_LABEL,
  PLATFORM_HEALTH_DOMAIN_TARGETS,
  healthDomainsForPath,
} from "@/measurement/platform-health-investigation";
import {
  PLATFORM_HEALTH_DOMAIN_LABEL,
  type PlatformHealthDomainId,
  type PlatformHealthState,
} from "@/measurement/platform-health-score";
import { StatusBadge } from "./components";
import type { InsightsFilters } from "./insights-filters";
import { InsightsInvestigationBanner } from "./investigation-banner";

const STATE_TONE: Record<PlatformHealthState, "good" | "warn" | "bad"> = {
  healthy: "good",
  watch: "warn",
  needs_attention: "bad",
};

/** Healthy · Needs Watch · Needs Attention — what each band means (D3). */
export function HealthBandExplanationPanel({
  compact = false,
}: {
  compact?: boolean;
}) {
  const states: PlatformHealthState[] = ["healthy", "watch", "needs_attention"];
  return (
    <div
      className={`rounded-lg border border-slate-200 bg-slate-50 ${compact ? "px-3 py-2" : "px-4 py-3"}`}
      role="note"
      aria-label="Health band explanations"
    >
      <p className="text-xs font-medium text-slate-800">
        Healthy · Needs Watch · Needs Attention
      </p>
      <ul className={`mt-2 grid gap-2 ${compact ? "" : "sm:grid-cols-3"}`}>
        {states.map((state) => {
          const band = PLATFORM_HEALTH_BAND_EXPLANATIONS[state];
          return (
            <li key={state} className="rounded border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge label={band.label} tone={STATE_TONE[state]} />
                <span className="tabular-nums text-slate-400">{band.scoreBand}</span>
              </div>
              <p className="mt-1.5 leading-4 text-slate-600">{band.meaning}</p>
              <p className="mt-1 leading-4 text-slate-500">
                <span className="font-medium text-slate-700">What to do · </span>
                {band.whatToDo}
              </p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Compact legend for health badges (uses Needs Watch wording). */
export function PlatformHealthLegend() {
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs" role="group" aria-label="Health states">
      <span className="font-medium text-slate-500">Health</span>
      <StatusBadge label={PLATFORM_HEALTH_BAND_LABEL.healthy} tone="good" />
      <StatusBadge label={PLATFORM_HEALTH_BAND_LABEL.watch} tone="warn" />
      <StatusBadge label={PLATFORM_HEALTH_BAND_LABEL.needs_attention} tone="bad" />
    </div>
  );
}

/**
 * Health-score investigation banner (D3 + D6).
 * Pass the current pathname so only matching domains activate.
 */
export function PlatformHealthFocusBanner({
  filters,
  pathname,
  state,
  score,
  summary,
}: {
  filters: InsightsFilters;
  pathname: string;
  state?: PlatformHealthState;
  score?: number;
  summary?: string;
}) {
  const health = filters.health;
  if (!health) return null;
  const accepted = healthDomainsForPath(pathname);
  if (!accepted.includes(health)) return null;

  const target = PLATFORM_HEALTH_DOMAIN_TARGETS[health];
  const band = state ? PLATFORM_HEALTH_BAND_EXPLANATIONS[state] : null;
  const detailParts = [
    band?.label,
    typeof score === "number" ? `score ${score}` : null,
    summary ?? target.cta,
  ].filter(Boolean);

  return (
    <InsightsInvestigationBanner
      filters={{ ...filters, from: filters.from ?? "health", health }}
      pathname={pathname}
      viewing={{
        title: `${PLATFORM_HEALTH_DOMAIN_LABEL[health]} health`,
        detail: detailParts.join(" · "),
      }}
      recommendations={
        band
          ? [band.whatToDo, target.focusLabel, "Clear the filter when the domain is stable"]
          : undefined
      }
    />
  );
}

export type { PlatformHealthDomainId };
