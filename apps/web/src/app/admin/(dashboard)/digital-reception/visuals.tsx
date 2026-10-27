import Link from "next/link";
import {
  DashboardCard,
  EmptyState,
  GaugeMeter,
  HorizontalBarChart,
  ProgressBar,
  SectionShell,
  StatusBadge,
  digitalReceptionFunnelStageHref,
  formatCount,
  formatDashboardLabel,
  formatRate,
  intentInvestigationHref,
  searchDestinationHref,
  type DashboardTone,
  type InsightsFilters,
} from "../dashboard-ui";
import type {
  DigitalReceptionFunnelStep,
  IntentPerformanceRow,
  ResolutionBand,
  WatchlistRow,
} from "@/measurement/digital-reception-report";
import type { CountRow } from "@/measurement/types";

export { SectionShell, formatCount, formatRate };

export function formatIntent(key: string): string {
  if (key === "hotdoc_message") return "HotDoc message";
  if (key === "new_patient") return "New patient";
  if (key === "vaccination") return "Vaccine";
  return formatDashboardLabel(key);
}

function bandTone(band: ResolutionBand): DashboardTone {
  if (band === "green") return "good";
  if (band === "amber") return "warn";
  if (band === "red") return "bad";
  return "neutral";
}

function bandLabel(band: ResolutionBand): string {
  if (band === "green") return "Healthy";
  if (band === "amber") return "Needs Watch";
  if (band === "red") return "Needs Attention";
  return "No data";
}

export function BandBadge({ band }: { band: ResolutionBand }) {
  return <StatusBadge label={bandLabel(band)} tone={bandTone(band)} />;
}

export function ResolutionGauge({
  label,
  value,
  band,
  hint,
  href,
  hrefLabel,
  informational,
  informationalReason,
}: {
  label: string;
  value: number | null;
  band: ResolutionBand;
  hint: string;
  href?: string;
  hrefLabel?: string;
  informational?: boolean;
  informationalReason?: string;
}) {
  return (
    <GaugeMeter
      label={label}
      valueLabel={formatRate(value)}
      percent={value}
      tone={bandTone(band)}
      hint={hint}
      badge={<BandBadge band={band} />}
      href={href}
      hrefLabel={hrefLabel ?? (band === "red" || band === "amber" ? "Investigate alert" : undefined)}
      informational={informational}
      informationalReason={informationalReason}
    />
  );
}

export function FunnelChart({
  steps,
  filters,
}: {
  steps: DigitalReceptionFunnelStep[];
  filters?: InsightsFilters;
}) {
  const total = steps.reduce((sum, step) => sum + step.count, 0);
  if (steps.length === 0 || total === 0) {
    return (
      <DashboardCard>
        <h3 className="text-sm font-semibold text-slate-900">Journey funnel</h3>
        <p className="mt-0.5 text-xs text-slate-500">
          Open → Search → Result click → Booking → Call · click a stage to investigate
        </p>
        <EmptyState
          title="No journey activity"
          message="No Digital Reception sessions in this range."
          className="mt-4"
        />
      </DashboardCard>
    );
  }
  const max = Math.max(...steps.map((step) => step.count), 1);
  return (
    <DashboardCard>
      <h3 className="text-sm font-semibold text-slate-900">Journey funnel</h3>
      <p className="mt-0.5 text-xs text-slate-500">
        Open → Search → Result click → Booking → Call · click a stage to investigate
      </p>
      <ol className="mt-5 space-y-3">
        {steps.map((step, index) => {
          const width = Math.max((step.count / max) * 100, step.count ? 6 : 0);
          const drop =
            index === 0 || step.conversion_from_previous === null ? null : 100 - step.conversion_from_previous;
          const href = digitalReceptionFunnelStageHref(step.key, filters);
          return (
            <li key={step.key}>
              <Link
                href={href}
                className="group block rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                aria-label={`${step.label} funnel stage. Investigate`}
              >
                <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2 text-sm">
                  <span className="font-medium text-slate-800 group-hover:underline">
                    {index + 1}. {step.label}
                  </span>
                  <span className="tabular-nums text-slate-600">
                    {formatCount(step.count)}
                    {step.conversion_from_previous !== null
                      ? ` · ${formatRate(step.conversion_from_previous)} from previous`
                      : ""}
                    {drop !== null && drop > 40 ? (
                      <StatusBadge label={`−${drop.toFixed(0)}% drop`} tone="bad" dot={false} />
                    ) : null}
                  </span>
                </div>
                <div
                  className="mx-auto h-9 overflow-hidden rounded bg-slate-100 transition group-hover:ring-2 group-hover:ring-slate-400"
                  style={{ width: `${width}%` }}
                >
                  <div className="flex h-full items-center justify-center bg-slate-800 text-xs font-medium text-white">
                    {width > 28 ? formatRate(step.share_of_opens) : ""}
                  </div>
                </div>
              </Link>
            </li>
          );
        })}
      </ol>
    </DashboardCard>
  );
}

export function IntentBars({
  rows,
  filters,
  focusIntent,
}: {
  rows: IntentPerformanceRow[];
  filters?: InsightsFilters;
  focusIntent?: string | null;
}) {
  if (rows.length === 0) {
    return <EmptyState title="No searches" message="No searches in this range." />;
  }
  return (
    <HorizontalBarChart
      title="Top intent charts"
      hint="Search volume with resolution colour coding"
      rows={rows.map((row) => ({
        key: row.intent_bucket,
        href: intentInvestigationHref(row.intent_bucket, filters),
        label: formatIntent(row.intent_bucket),
        value: row.searches,
        displayValue: `${formatCount(row.searches)} · ${formatRate(row.resolution_rate)}`,
        tone: bandTone(row.resolution_band),
        meta: (
          <>
            {row.flagged ? (
              <StatusBadge label="High volume · low resolution" tone="bad" />
            ) : (
              <BandBadge band={row.resolution_band} />
            )}
            {focusIntent === row.intent_bucket ? <StatusBadge label="Focused" tone="info" /> : null}
          </>
        ),
      }))}
    />
  );
}

export function DestinationBars({
  rows,
  filters,
}: {
  rows: CountRow[];
  filters?: InsightsFilters;
}) {
  if (rows.length === 0) {
    return <EmptyState title="No result clicks" message="No result clicks in this range." />;
  }
  return (
    <HorizontalBarChart
      title="Search destination charts"
      hint="Where Digital Reception result clicks land"
      rows={rows.map((row) => ({
        key: row.key,
        href: searchDestinationHref(row.key, filters),
        label: formatDashboardLabel(row.key),
        value: row.count,
        tone: "info",
      }))}
    />
  );
}

export function FlaggedIntentPanel({
  rows,
  filters,
  focusIntent,
}: {
  rows: IntentPerformanceRow[];
  filters?: InsightsFilters;
  focusIntent?: string | null;
}) {
  if (rows.length === 0) {
    return (
      <EmptyState
        title="Nothing on the watchlist"
        message="No high-volume low-resolution intents in this range."
      />
    );
  }
  return (
    <DashboardCard tone="bad">
      <ul className="divide-y divide-rose-100">
        {rows.map((row) => {
          const href = intentInvestigationHref(row.intent_bucket, filters);
          const focused = focusIntent === row.intent_bucket;
          return (
            <li
              key={row.intent_bucket}
              id={`intent-${row.intent_bucket}`}
              className={`flex flex-wrap items-start justify-between gap-3 py-3 text-sm first:pt-0 last:pb-0 ${
                focused ? "rounded-md bg-rose-100/80 px-2" : ""
              }`}
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={href} className="font-semibold text-rose-950 underline-offset-2 hover:underline">
                    {formatIntent(row.intent_bucket)}
                  </Link>
                  <StatusBadge label="Investigate" tone="bad" />
                  {focused ? <StatusBadge label="Focused" tone="info" /> : null}
                </div>
                <p className="mt-1 text-rose-900/80">
                  {formatCount(row.searches)} searches · resolution {formatRate(row.resolution_rate)} · zero-result{" "}
                  {formatRate(row.zero_result_rate)}
                </p>
                <p className="mt-2 text-xs font-medium text-rose-900">
                  <Link href={href} className="underline-offset-2 hover:underline">
                    Open intent details →
                  </Link>
                </p>
              </div>
              <div className="min-w-[7rem]">
                <div className="mb-1 text-right text-xs font-semibold tabular-nums text-rose-800">
                  {formatRate(row.resolution_rate)}
                </div>
                <ProgressBar value={row.resolution_rate ?? 0} tone="bad" className="h-2" />
              </div>
            </li>
          );
        })}
      </ul>
    </DashboardCard>
  );
}

export function WatchlistCards({
  rows,
  filters,
  focusIntent,
}: {
  rows: WatchlistRow[];
  filters?: InsightsFilters;
  focusIntent?: string | null;
}) {
  if (rows.length === 0) {
    return (
      <EmptyState
        title="Watchlist clear"
        message="No intent buckets to watch in this range."
      />
    );
  }
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {rows.map((row) => {
        const tone = bandTone(row.resolution_band);
        const href = intentInvestigationHref(row.intent_bucket, filters);
        const focused = focusIntent === row.intent_bucket;
        return (
          <Link
            key={row.intent_bucket}
            id={`intent-${row.intent_bucket}`}
            href={href}
            className={`group block rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 ${
              focused ? "ring-2 ring-slate-900 ring-offset-2" : ""
            }`}
            aria-label={`${row.label}: ${formatRate(row.resolution_rate)}. Open intent details`}
          >
            <DashboardCard tone={tone} className="transition group-hover:shadow">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-semibold text-slate-900">{row.label}</h3>
                <BandBadge band={row.resolution_band} />
              </div>
              <p className="mt-3 text-3xl font-semibold tabular-nums text-slate-900">
                {formatRate(row.resolution_rate)}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {formatCount(row.searches)} searches · {formatCount(row.result_clicks)} result clicks ·{" "}
                {formatCount(row.zero_results)} zero-result
              </p>
              <div className="mt-3">
                <ProgressBar value={row.resolution_rate ?? 0} tone={tone} />
              </div>
              <p className="mt-2 text-xs font-medium text-slate-700 underline-offset-2 group-hover:underline">
                Open intent details →
              </p>
            </DashboardCard>
          </Link>
        );
      })}
    </div>
  );
}

export function Legend() {
  return (
    <div className="flex flex-wrap gap-2 text-xs" role="group" aria-label="Resolution status colours">
      <StatusBadge label="Success · ≥ 70%" tone="good" />
      <StatusBadge label="Warning · 50–69%" tone="warn" />
      <StatusBadge label="Failure · < 50%" tone="bad" />
    </div>
  );
}
