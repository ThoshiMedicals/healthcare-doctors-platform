import Link from "next/link";
import {
  CHART_ACCENTS,
  DashboardCard,
  EmptyState,
  LineChart,
  MetricTile,
  ProgressBar,
  SectionShell,
  TrendIndicator,
  formatCount,
  formatDashboardLabel,
  formatRate,
  type TrendInput,
} from "../dashboard-ui";
import type { DailySeriesPoint, MetricTrend } from "@/measurement/executive-report";

export { SectionShell, formatCount, formatRate };
export const MetricCard = MetricTile;
export const TrendBadge = TrendIndicator;

export function formatLabel(key: string): string {
  return formatDashboardLabel(key);
}

export function placementLabel(key: string): string {
  if (key === "digital_reception") return "Digital Reception";
  return formatDashboardLabel(key);
}

export function SeriesChart({
  title,
  series,
  valueKey,
  formatValue = formatCount,
  accent = CHART_ACCENTS.slate,
}: {
  title: string;
  series: DailySeriesPoint[];
  valueKey: keyof Pick<DailySeriesPoint, "traffic" | "booking_clicks" | "call_clicks" | "contact_rate">;
  formatValue?: (value: number) => string;
  accent?: string;
}) {
  return (
    <LineChart
      title={title}
      hint="Daily · Brisbane calendar"
      accent={accent}
      formatValue={formatValue}
      points={series.map((point) => ({
        date: point.date,
        value: typeof point[valueKey] === "number" ? (point[valueKey] as number) : 0,
      }))}
    />
  );
}

export function PlacementBars({
  rows,
}: {
  rows: Array<{ placement: string; count: number; share: number }>;
}) {
  if (rows.length === 0) {
    return <EmptyState title="No placements" message="No booking placement data in this range." />;
  }
  const max = Math.max(...rows.map((row) => row.count), 1);
  return (
    <ul className="space-y-3">
      {rows.map((row) => (
        <li key={row.placement}>
          <div className="mb-1 flex items-center justify-between gap-3 text-sm">
            <span>{placementLabel(row.placement)}</span>
            <span className="tabular-nums text-slate-600">
              {formatCount(row.count)} · {row.share.toFixed(1)}%
            </span>
          </div>
          <ProgressBar value={row.count} max={max} tone="neutral" className="h-2" />
        </li>
      ))}
    </ul>
  );
}

export function RankList({
  rows,
  empty,
  hrefFor,
  hrefHint,
}: {
  rows: Array<{ key: string; count: number }>;
  empty: string;
  hrefFor?: (key: string) => string;
  hrefHint?: string;
}) {
  if (rows.length === 0) return <EmptyState title="No rankings" message={empty} />;
  const visible = rows.slice(0, 8);
  const max = Math.max(...visible.map((row) => row.count), 1);
  return (
    <DashboardCard>
      {hrefHint ? <p className="mb-3 text-xs text-slate-500">{hrefHint}</p> : null}
      <ol className="space-y-3">
        {visible.map((row, index) => {
          const href = hrefFor?.(row.key);
          const label = (
            <>
              <span className="mr-2 text-slate-400">{index + 1}.</span>
              {formatLabel(row.key)}
            </>
          );
          return (
            <li key={row.key}>
              <div className="mb-1 flex items-start justify-between gap-3 text-sm">
                {href ? (
                  <Link
                    href={href}
                    className="font-medium text-slate-900 underline-offset-2 hover:underline"
                  >
                    {label}
                  </Link>
                ) : (
                  <span>{label}</span>
                )}
                <span className="tabular-nums text-slate-600">{formatCount(row.count)}</span>
              </div>
              <ProgressBar value={row.count} max={max} tone="neutral" className="h-1.5" />
            </li>
          );
        })}
      </ol>
    </DashboardCard>
  );
}

export function PlacementCard({
  rows,
}: {
  rows: Array<{ placement: string; count: number; share: number }>;
}) {
  return (
    <DashboardCard>
      <h3 className="text-sm font-semibold text-slate-900">Booking placement mix</h3>
      <p className="mt-0.5 text-xs text-slate-500">Share of booking clicks by control placement</p>
      <div className="mt-4">
        <PlacementBars rows={rows} />
      </div>
    </DashboardCard>
  );
}

export type { MetricTrend, TrendInput };
