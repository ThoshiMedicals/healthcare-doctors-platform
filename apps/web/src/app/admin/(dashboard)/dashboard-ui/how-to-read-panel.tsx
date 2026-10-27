import type { ReactNode } from "react";
import {
  AUTHORITY_TIER_FRIENDLY,
  AUTHORITY_TIER_GUIDANCE,
  METRIC_HEALTH_LABEL,
  METRIC_HEALTH_TONE,
  getHowToReadGuide,
  healthFromValue,
  type HowToReadGuide,
  type MetricGuide,
  type MetricHealthLevel,
} from "./how-to-read";
import type { InsightsDestination } from "./links";
import { StatusBadge } from "./components";
import { DASHBOARD_TONE } from "./tokens";

/**
 * "How to Read This Dashboard" — 60-second briefing for non-technical clinic staff (C10).
 */
export function HowToReadDashboard({
  dashboard,
  guide,
  defaultOpen = true,
}: {
  dashboard?: InsightsDestination | "monthly-executive";
  /** Override when composing a custom guide (tests / special pages). */
  guide?: HowToReadGuide;
  defaultOpen?: boolean;
}) {
  const resolved = guide ?? (dashboard ? getHowToReadGuide(dashboard) : null);
  if (!resolved) return null;

  return (
    <details
      className="rounded-lg border border-sky-200 bg-sky-50 open:shadow-none"
      open={defaultOpen}
    >
      <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-sky-950 marker:content-none [&::-webkit-details-marker]:hidden">
        <span className="flex flex-wrap items-center justify-between gap-2">
          <span>How to read this dashboard</span>
          <span className="text-xs font-normal text-sky-800/80">~60 second briefing · tap to collapse</span>
        </span>
      </summary>
      <div className="space-y-4 border-t border-sky-200 px-4 py-4 text-sm text-sky-950">
        <p className="leading-6">{resolved.inSixtySeconds}</p>
        <div className="grid gap-4 lg:grid-cols-3">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-sky-900/70">
              What good looks like
            </h3>
            <p className="mt-1.5 leading-5 text-sky-950/90">{resolved.whatGoodLooksLike}</p>
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-sky-900/70">
              Scan in this order
            </h3>
            <ol className="mt-1.5 list-decimal space-y-1 pl-4 leading-5 text-sky-950/90">
              {resolved.scanOrder.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-sky-900/70">
              Status colours
            </h3>
            <ul className="mt-1.5 space-y-1.5">
              {resolved.statusKey.map((row) => (
                <li key={row.level} className="flex flex-wrap items-start gap-2">
                  <StatusBadge label={METRIC_HEALTH_LABEL[row.level]} tone={METRIC_HEALTH_TONE[row.level]} />
                  <span className="min-w-0 flex-1 text-xs leading-4 text-sky-950/90">{row.meaning}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        {resolved.metrics.length > 0 ? (
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-sky-900/70">
              Key metrics explained
            </h3>
            <ul className="mt-2 grid gap-2 sm:grid-cols-2">
              {resolved.metrics.map((metric) => (
                <li
                  key={metric.id}
                  className="rounded border border-sky-200/80 bg-white/70 px-3 py-2"
                >
                  <p className="text-xs font-semibold text-slate-900">{metric.label}</p>
                  <p className="mt-1 text-xs leading-4 text-slate-600">{metric.meaning}</p>
                  {metric.target ? (
                    <p className="mt-1 text-[11px] font-medium text-slate-700">Target · {metric.target}</p>
                  ) : null}
                  <p className="mt-1 text-[11px] leading-4 text-slate-500">{metric.guidance}</p>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </details>
  );
}

/** Compact healthy / watch / critical strip for chart legends. */
export function HealthStatusLegend({
  className = "",
}: {
  className?: string;
}) {
  const levels: MetricHealthLevel[] = ["healthy", "watch", "critical"];
  return (
    <div
      className={`flex flex-wrap items-center gap-2 text-xs ${className}`}
      role="group"
      aria-label="Health status colours"
    >
      <span className="font-medium text-slate-500">Status</span>
      {levels.map((level) => (
        <StatusBadge key={level} label={METRIC_HEALTH_LABEL[level]} tone={METRIC_HEALTH_TONE[level]} />
      ))}
    </div>
  );
}

/** Label row with optional health chip + plain-language explain. */
export function MetricLabel({
  guide,
  value,
  fallbackLabel,
}: {
  guide?: MetricGuide;
  value?: number | null;
  fallbackLabel?: string;
}) {
  const label = guide?.label ?? fallbackLabel ?? "Metric";
  const health = healthFromValue(value, guide?.thresholds);
  return (
    <div className="min-w-0 space-y-1">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
        {health !== "neutral" ? (
          <StatusBadge label={METRIC_HEALTH_LABEL[health]} tone={METRIC_HEALTH_TONE[health]} dot />
        ) : null}
      </div>
      {guide?.target ? (
        <p className="text-[11px] leading-4 text-slate-400">Target · {guide.target}</p>
      ) : null}
    </div>
  );
}

/** One-line explain under a metric value. */
export function MetricMeaning({ guide, children }: { guide?: MetricGuide; children?: ReactNode }) {
  if (!guide && !children) return null;
  return (
    <p className="mt-1 text-xs leading-4 text-slate-500">
      {children ?? (
        <>
          {guide?.meaning}
          {guide?.guidance ? (
            <span className="mt-0.5 block text-slate-400">{guide.guidance}</span>
          ) : null}
        </>
      )}
    </p>
  );
}

/** Authority tiers renamed for clinic managers. */
export function AuthorityTierExplained() {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700" role="note">
      <p className="font-medium text-slate-800">Website link strength (not clinical ratings)</p>
      <p className="mt-1 leading-4 text-slate-600">{AUTHORITY_TIER_GUIDANCE}</p>
      <ul className="mt-2 flex flex-wrap gap-2">
        <li>
          <StatusBadge label={`${AUTHORITY_TIER_FRIENDLY.Hub} (Hub)`} tone="hub" />
        </li>
        <li>
          <StatusBadge label={`${AUTHORITY_TIER_FRIENDLY.Developing} (Developing)`} tone="developing" />
        </li>
        <li>
          <StatusBadge label={`${AUTHORITY_TIER_FRIENDLY.Thin} (Thin)`} tone="thin" />
        </li>
      </ul>
    </div>
  );
}

/** Tiny target range bar for percentage metrics. */
export function TargetRangeHint({
  guide,
  value,
}: {
  guide?: MetricGuide;
  value?: number | null;
}) {
  if (!guide?.thresholds || value === null || value === undefined) return null;
  const style = DASHBOARD_TONE[METRIC_HEALTH_TONE[healthFromValue(value, guide.thresholds)]];
  return (
    <p className={`mt-1 text-[11px] font-medium ${style.text}`}>
      {METRIC_HEALTH_LABEL[healthFromValue(value, guide.thresholds)]}
      {guide.target ? ` · ${guide.target}` : null}
    </p>
  );
}
