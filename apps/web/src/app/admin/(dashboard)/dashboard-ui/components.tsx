import Link from "next/link";
import type { ReactNode } from "react";
import {
  INSIGHTS_DATA_MODE_DESCRIPTION,
  INSIGHTS_DATA_MODE_LABEL,
  insightsDataModeOptions,
  type InsightsDataMode,
} from "@/measurement/insights-data-mode";
import type { ExecutiveRange } from "@/measurement/ranges";
import { formatCount } from "./format";
import type { InsightsFilters } from "./insights-filters";
import { withInsightsQuery } from "./insights-filters";
import { InvestigationBanner } from "./investigation-banner";
import type { InvestigationSource } from "./investigation-source";
import { insightsNavItems, type InsightsDestination } from "./links";
import { CHART_ACCENTS, DASHBOARD_TONE, type DashboardTone } from "./tokens";

export type TrendInput = {
  current: number;
  previous: number;
  delta: number;
  delta_pct: number | null;
  direction: "up" | "down" | "flat";
};

/** Page chrome shared by every admin dashboard. */
export function DashboardHeader({
  title,
  description,
  meta,
  actions,
}: {
  title: string;
  description: string;
  meta?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">{description}</p>
      </div>
      <div className="flex flex-col items-end gap-2">
        {actions ? <div className="flex flex-wrap gap-3 text-sm">{actions}</div> : null}
        {meta ? <div className="text-xs text-slate-500">{meta}</div> : null}
      </div>
    </div>
  );
}

export function DashboardMeta({ children }: { children: ReactNode }) {
  return <p className="mt-8 text-xs text-slate-500">{children}</p>;
}

export function RangeTabs({
  options,
  active,
  hrefFor,
}: {
  options: Array<{ value: string; label: string }>;
  active: string;
  hrefFor: (value: string) => string;
}) {
  return (
    <div className="flex flex-wrap gap-2" role="tablist" aria-label="Date range">
      {options.map((option) => {
        const selected = option.value === active;
        return (
          <Link
            key={option.value}
            href={hrefFor(option.value)}
            aria-current={selected ? "page" : undefined}
            className={`rounded border px-3 py-1.5 text-sm ${
              selected
                ? "border-slate-900 bg-slate-900 text-white"
                : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            {option.label}
          </Link>
        );
      })}
    </div>
  );
}

export function SectionShell({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="mt-6 sm:mt-8" aria-labelledby={id}>
      <div className="mb-3 border-b border-slate-200 pb-2 sm:mb-4 sm:pb-3">
        <h2 id={id} className="text-lg font-semibold text-slate-900">
          {title}
        </h2>
        <p className="mt-1 text-sm text-slate-600">{description}</p>
      </div>
      {children}
    </section>
  );
}

/** Stack ranking panels vertically on small screens; columns from `lg` up. */
export function RankingGrid({
  children,
  columns = 3,
}: {
  children: ReactNode;
  columns?: 2 | 3;
}) {
  const cols = columns === 2 ? "lg:grid-cols-2" : "lg:grid-cols-3";
  return <div className={`grid grid-cols-1 gap-4 ${cols}`}>{children}</div>;
}

/** Generic white dashboard card surface. */
export function DashboardCard({
  children,
  className = "",
  tone = "neutral",
}: {
  children: ReactNode;
  className?: string;
  tone?: DashboardTone;
}) {
  return (
    <article
      className={`rounded-lg border bg-white p-4 shadow-sm ${DASHBOARD_TONE[tone].border} ${className}`}
    >
      {children}
    </article>
  );
}

export function StatusBadge({
  label,
  tone = "neutral",
  count,
  dot = true,
}: {
  label: string;
  tone?: DashboardTone;
  count?: number;
  dot?: boolean;
}) {
  const style = DASHBOARD_TONE[tone];
  // Dual-encode family: round = semantic status · square = authority tier
  const markClass =
    style.family === "authority" ? "h-1.5 w-1.5 rounded-sm" : "h-1.5 w-1.5 rounded-full";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-xs font-medium ${style.badge}`}>
      {dot ? (
        <span
          className={markClass}
          style={{ backgroundColor: style.bar }}
          aria-hidden="true"
          title={style.family === "authority" ? "Authority tier" : "Status"}
        />
      ) : null}
      {label}
      {typeof count === "number" ? <span className="tabular-nums opacity-80">{formatCount(count)}</span> : null}
    </span>
  );
}

/** Explains that Hub/Developing/Thin are website link strength — not clinical ratings (C10). */
export function AuthorityPaletteLegend() {
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs" role="group" aria-label="Website link strength">
      <span className="font-medium text-slate-500">Link strength</span>
      <StatusBadge label="Well connected" tone="hub" />
      <StatusBadge label="Building links" tone="developing" />
      <StatusBadge label="Needs more links" tone="thin" />
      <span className="text-slate-400">· not clinical quality</span>
    </div>
  );
}

export function SemanticPaletteLegend({
  includeInfo = false,
}: {
  includeInfo?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs" role="group" aria-label="Status colours">
      <span className="font-medium text-slate-500">Status</span>
      <StatusBadge label="Success" tone="good" />
      <StatusBadge label="Warning" tone="warn" />
      <StatusBadge label="Failure" tone="bad" />
      {includeInfo ? <StatusBadge label="Info" tone="info" /> : null}
    </div>
  );
}

export function TrendIndicator({
  trend,
  invert = false,
}: {
  trend: TrendInput;
  invert?: boolean;
}) {
  const positiveIsGood = !invert;
  const good =
    trend.direction === "flat" ? null : (trend.direction === "up") === positiveIsGood;
  const arrow = trend.direction === "up" ? "↑" : trend.direction === "down" ? "↓" : "→";
  const tone =
    trend.direction === "flat"
      ? "bg-slate-100 text-slate-600"
      : good
        ? "bg-emerald-50 text-emerald-800"
        : "bg-rose-50 text-rose-800";
  const deltaLabel =
    trend.delta_pct === null ? "new" : `${trend.delta_pct > 0 ? "+" : ""}${trend.delta_pct.toFixed(1)}%`;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium tabular-nums ${tone}`}
      title={`Previous period: ${trend.previous.toLocaleString("en-AU")}`}
    >
      <span aria-hidden="true">{arrow}</span>
      <span>{deltaLabel}</span>
      <span className="font-normal opacity-80">vs prev</span>
    </span>
  );
}

/** Primary KPI tile used across executive / authority / governance dashboards. */
export function MetricTile({
  label,
  value,
  hint,
  trend,
  invertTrend = false,
  badge,
  href,
  hrefLabel = "Open related dashboard",
  explain,
  target,
  statusBadge,
  /** D1: when true (and no href), tile is explicitly non-actionable. */
  informational = false,
  informationalReason = "Informational · no filtered workflow for this KPI",
}: {
  label: string;
  value: string;
  hint?: string;
  trend?: TrendInput;
  invertTrend?: boolean;
  badge?: ReactNode;
  href?: string;
  hrefLabel?: string;
  /** Plain-language meaning for clinic managers (C10). */
  explain?: string;
  /** Target range in plain English. */
  target?: string;
  statusBadge?: ReactNode;
  informational?: boolean;
  informationalReason?: string;
}) {
  const showInfo = !href && informational;
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
          <div className="flex flex-wrap items-center gap-1.5">
            {statusBadge}
            {showInfo ? <StatusBadge label="Informational" tone="neutral" /> : null}
          </div>
        </div>
        {trend ? <TrendIndicator trend={trend} invert={invertTrend} /> : badge}
      </div>
      <p className="mt-2 text-3xl font-semibold tracking-tight tabular-nums text-slate-900">{value}</p>
      {target ? <p className="mt-1 text-[11px] font-medium text-slate-600">Target · {target}</p> : null}
      {explain ? <p className="mt-1 text-xs leading-4 text-slate-500">{explain}</p> : null}
      {hint ? <p className={`text-xs text-slate-500 ${explain ? "mt-0.5" : "mt-1"}`}>{hint}</p> : null}
      {href ? (
        <p className="mt-2 text-xs font-medium text-slate-700 underline-offset-2 group-hover:underline">
          {hrefLabel} →
        </p>
      ) : null}
      {showInfo ? (
        <p className="mt-2 text-[11px] leading-4 text-slate-400">{informationalReason}</p>
      ) : null}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="group block rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
        aria-label={`${label}: ${value}. ${hrefLabel}`}
      >
        <DashboardCard className="transition group-hover:border-slate-400 group-hover:shadow">{body}</DashboardCard>
      </Link>
    );
  }

  return (
    <DashboardCard aria-label={showInfo ? `${label}: ${value}. ${informationalReason}` : undefined}>
      {body}
    </DashboardCard>
  );
}

/** Shared strip so insight dashboards operate as one system. */
export function InsightsNav({
  current,
  range,
  filters,
}: {
  current: InsightsDestination;
  range?: ExecutiveRange;
  /** Persistent investigation filters carried across Insights destinations (C5). */
  filters?: import("./insights-filters").InsightsFilters;
}) {
  const navFilters = filters ?? (range ? { range } : undefined);
  return (
    <nav
      aria-label="Related dashboards"
      className="flex flex-wrap gap-1.5 rounded-lg border border-slate-200 bg-white p-2 shadow-sm"
    >
      {insightsNavItems(navFilters).map((item) => {
        const active = item.id === current;
        return (
          <Link
            key={item.id}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`rounded px-2.5 py-1 text-xs font-medium ${
              active
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

/**
 * Adapter over InvestigationBanner (D6). Prefer InsightsInvestigationBanner on new pages.
 * Layout: Viewing · Continue investigation · Recommendations · Clear filter.
 */
export function FocusBanner({
  label,
  clearHref,
  continueLinks,
  recommendations,
  detail,
  source = "filter",
}: {
  label: string;
  clearHref: string;
  continueLinks?: Array<{ href: string; label: string }>;
  recommendations?: string[];
  detail?: string;
  source?: InvestigationSource;
}) {
  return (
    <InvestigationBanner
      model={{
        source,
        viewing: { title: label, detail },
        recommendations:
          recommendations && recommendations.length > 0
            ? recommendations
            : [
                "Review the filtered results below",
                "Take the next remediation step",
                "Clear the filter when finished",
              ],
        continueLinks: continueLinks ?? [],
        clearHref,
      }}
    />
  );
}

/** Live · Demo · Empty switcher (C9). Preserves other Insights filters. */
export function DataModeSwitcher({
  path,
  filters,
  active,
}: {
  path: string;
  filters: InsightsFilters;
  active: InsightsDataMode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Dashboard data mode">
      <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Data</span>
      {insightsDataModeOptions().map((option) => {
        const selected = option.value === active;
        const href = withInsightsQuery(path, { ...filters, data: option.value });
        return (
          <Link
            key={option.value}
            href={href}
            aria-current={selected ? "page" : undefined}
            title={INSIGHTS_DATA_MODE_DESCRIPTION[option.value]}
            className={`rounded border px-3 py-1.5 text-sm ${
              selected
                ? option.value === "demo"
                  ? "border-amber-800 bg-amber-800 text-white"
                  : "border-slate-900 bg-slate-900 text-white"
                : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            {option.label}
          </Link>
        );
      })}
    </div>
  );
}

/** Persistent notice when Demo (or Empty) data is driving Insights views. */
export function DataModeBanner({
  mode,
  feedLabel,
}: {
  mode: InsightsDataMode;
  feedLabel: string;
}) {
  if (mode === "live") return null;
  const isDemo = mode === "demo";
  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-3 text-sm ${
        isDemo
          ? "border-amber-300 bg-amber-50 text-amber-950"
          : "border-slate-300 bg-slate-50 text-slate-800"
      }`}
      role="status"
      aria-live="polite"
    >
      <div className="min-w-0 space-y-0.5">
        <p className="font-medium">
          {isDemo ? "Demo data" : "Empty mode"} · {INSIGHTS_DATA_MODE_LABEL[mode]}
        </p>
        <p className="text-xs opacity-90">
          {isDemo
            ? `${feedLabel}. For training, presentations, and UAT — not live clinic traffic.`
            : `${feedLabel}. Use Empty to rehearse zero-activity states; switch to Demo or Live when ready.`}
        </p>
      </div>
      <span
        className={`shrink-0 rounded border px-2 py-0.5 text-xs font-semibold uppercase tracking-wide ${
          isDemo ? "border-amber-700 bg-amber-100 text-amber-950" : "border-slate-500 bg-white text-slate-800"
        }`}
      >
        {isDemo ? "Sample" : "Empty"}
      </span>
    </div>
  );
}

export function ProgressBar({
  value,
  max = 100,
  tone = "neutral",
  className = "h-2.5",
}: {
  value: number;
  max?: number;
  tone?: DashboardTone;
  className?: string;
}) {
  const style = DASHBOARD_TONE[tone];
  const width = max <= 0 ? 0 : Math.max(value ? 4 : 0, Math.min(100, (value / max) * 100));
  return (
    <div className={`overflow-hidden rounded-full ${className}`} style={{ backgroundColor: style.track }}>
      <div className="h-full rounded-full" style={{ width: `${width}%`, backgroundColor: style.bar }} />
    </div>
  );
}

export type StackedBarSlice = {
  key: string;
  value: number;
  tone: DashboardTone;
  title?: string;
  /** D4 — clickable segment opens an investigation. */
  href?: string;
};

export function StackedBar({
  slices,
  className = "h-3",
}: {
  slices: StackedBarSlice[];
  className?: string;
}) {
  const total = slices.reduce((sum, slice) => sum + slice.value, 0) || 1;
  const clickable = slices.some((slice) => slice.href && slice.value > 0);
  return (
    <div
      className={`flex overflow-hidden rounded-full bg-slate-100 ${className}`}
      role={clickable ? "group" : undefined}
      aria-label={clickable ? "Chart segments — click to investigate" : undefined}
    >
      {slices.map((slice) => {
        const width = (slice.value / total) * 100;
        if (!width) return null;
        const style = {
          width: `${width}%`,
          backgroundColor: DASHBOARD_TONE[slice.tone].fill,
        };
        const title = slice.title || `${slice.key}: ${slice.value}`;
        if (slice.href) {
          return (
            <Link
              key={slice.key}
              href={slice.href}
              style={style}
              title={`${title} — open investigation`}
              aria-label={`${title}. Open investigation`}
              className="block transition hover:brightness-90 focus:outline-none focus-visible:relative focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-slate-900"
            />
          );
        }
        return <div key={slice.key} style={style} title={title} />;
      })}
    </div>
  );
}

export type BarChartRow = {
  key: string;
  label: ReactNode;
  value: number;
  displayValue?: string;
  tone?: DashboardTone;
  meta?: ReactNode;
  href?: string;
};

export function HorizontalBarChart({
  title,
  hint,
  rows,
  empty = "No data in this range.",
  formatValue = formatCount,
  accent,
}: {
  title: string;
  hint?: string;
  rows: BarChartRow[];
  empty?: string;
  formatValue?: (value: number) => string;
  accent?: string;
}) {
  const max = Math.max(...rows.map((row) => row.value), 1);
  const anyLinks = rows.some((row) => row.href);
  return (
    <DashboardCard>
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      {hint ? (
        <p className="mt-0.5 text-xs text-slate-500">
          {hint}
          {anyLinks ? " · click a bar to investigate" : ""}
        </p>
      ) : anyLinks ? (
        <p className="mt-0.5 text-xs text-slate-500">Click a bar to investigate</p>
      ) : null}
      {rows.length === 0 ? (
        <EmptyState title="No chart data" message={empty} className="mt-4" />
      ) : (
        <ul className="mt-4 max-h-[22rem] space-y-3 overflow-y-auto sm:max-h-none sm:overflow-visible">
          {rows.map((row, index) => {
            const tone = row.tone || "neutral";
            const width = Math.max((row.value / max) * 100, row.value ? 4 : 0);
            const barColor = accent || DASHBOARD_TONE[tone].bar;
            const body = (
              <>
                <div className="mb-1 flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span className="flex min-w-0 flex-wrap items-center gap-2">
                    <span className="w-5 shrink-0 text-slate-400">{index + 1}.</span>
                    <span className="min-w-0 break-words font-medium text-slate-800">{row.label}</span>
                    {row.meta}
                  </span>
                  <span className="shrink-0 tabular-nums text-slate-600">
                    {row.displayValue ?? formatValue(row.value)}
                  </span>
                </div>
                <div
                  className="h-2.5 max-w-full overflow-hidden rounded-full"
                  style={{ backgroundColor: DASHBOARD_TONE[tone].track }}
                >
                  <div
                    className="h-full rounded-full transition group-hover:brightness-90"
                    style={{ width: `${width}%`, backgroundColor: barColor }}
                  />
                </div>
              </>
            );
            return (
              <li key={row.key}>
                {row.href ? (
                  <Link
                    href={row.href}
                    className="group block rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                    aria-label={`Investigate ${typeof row.label === "string" ? row.label : row.key}`}
                  >
                    {body}
                  </Link>
                ) : (
                  body
                )}
              </li>
            );
          })}
        </ul>
      )}
    </DashboardCard>
  );
}

export type LinePoint = { date: string; value: number };

export function LineChart({
  title,
  hint,
  points,
  formatValue = formatCount,
  accent = CHART_ACCENTS.slate,
  empty = "No series data in this range.",
}: {
  title: string;
  hint?: string;
  points: LinePoint[];
  formatValue?: (value: number) => string;
  accent?: string;
  empty?: string;
}) {
  const width = 480;
  const height = 160;
  const padX = 12;
  const padY = 16;
  const values = points.map((point) => point.value);
  const max = Math.max(...values, 1);
  const innerW = width - padX * 2;
  const innerH = height - padY * 2;
  const plotted = values.map((value, index) => {
    const x = padX + (points.length <= 1 ? innerW / 2 : (index / (points.length - 1)) * innerW);
    const y = padY + innerH - (value / max) * innerH;
    return { x, y, value, date: points[index]?.date || "" };
  });
  const polyline = plotted.map((point) => `${point.x},${point.y}`).join(" ");
  const area =
    plotted.length > 0
      ? `M ${plotted[0].x} ${padY + innerH} L ${polyline.replaceAll(" ", " L ")} L ${plotted[plotted.length - 1].x} ${padY + innerH} Z`
      : "";
  const latest = values.at(-1) ?? 0;
  const showEvery = points.length > 14 ? 5 : points.length > 7 ? 2 : 1;

  return (
    <DashboardCard>
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          {hint ? <p className="mt-0.5 text-xs text-slate-500">{hint}</p> : null}
        </div>
        {points.length > 0 ? (
          <p className="text-lg font-semibold tabular-nums text-slate-900">{formatValue(latest)}</p>
        ) : null}
      </div>
      {points.length === 0 ? (
        <EmptyState title="No series data" message={empty} className="mt-4" />
      ) : (
        <div className="mt-3 max-w-full">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="h-32 w-full max-w-full sm:h-36"
            preserveAspectRatio="xMidYMid meet"
            role="img"
            aria-label={`${title} chart`}
          >
            <line x1={padX} y1={padY + innerH} x2={width - padX} y2={padY + innerH} stroke="#e2e8f0" strokeWidth="1" />
            <path d={area} fill={accent} opacity="0.08" />
            <polyline
              fill="none"
              stroke={accent}
              strokeWidth="2.5"
              strokeLinejoin="round"
              strokeLinecap="round"
              points={polyline}
            />
            {plotted.map((point, index) => (
              <circle key={point.date || index} cx={point.x} cy={point.y} r="2.5" fill={accent} />
            ))}
            {plotted.map((point, index) =>
              index % showEvery === 0 || index === plotted.length - 1 ? (
                <text
                  key={`label-${point.date}`}
                  x={point.x}
                  y={height - 2}
                  textAnchor="middle"
                  className="fill-slate-400"
                  fontSize="9"
                >
                  {point.date.slice(-2)}
                </text>
              ) : null,
            )}
          </svg>
        </div>
      )}
    </DashboardCard>
  );
}

export function EmptyState({
  title = "Nothing to show",
  message,
  action,
  className = "",
}: {
  title?: string;
  message: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center ${className}`}
      role="status"
    >
      <p className="text-sm font-medium text-slate-700">{title}</p>
      <p className="mt-1 text-sm text-slate-500">{message}</p>
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  );
}

function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-slate-100 ${className}`} />;
}

export function LoadingState({
  label = "Loading dashboard…",
  rows = 3,
}: {
  label?: string;
  rows?: number;
}) {
  return (
    <div className="space-y-3" role="status" aria-live="polite" aria-label={label}>
      <span className="sr-only">{label}</span>
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <SkeletonBlock className="h-3 w-24 bg-slate-200" />
          <SkeletonBlock className="mt-3 h-8 w-32" />
          <SkeletonBlock className="mt-3 h-2 w-full" />
        </div>
      ))}
    </div>
  );
}

/** Full-page dashboard skeleton for route-level `loading.tsx` files. Composes LoadingState. */
export function DashboardLoading({
  label = "Loading dashboard…",
  tiles = 4,
  panels = 2,
}: {
  label?: string;
  tiles?: number;
  panels?: number;
}) {
  return (
    <main className="space-y-8" role="status" aria-live="polite" aria-busy="true" aria-label={label}>
      <span className="sr-only">{label}</span>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-[16rem] flex-1">
          <SkeletonBlock className="h-7 w-64 bg-slate-200" />
          <SkeletonBlock className="mt-3 h-4 w-full max-w-xl" />
          <SkeletonBlock className="mt-2 h-4 w-2/3 max-w-md" />
        </div>
        <SkeletonBlock className="h-4 w-40" />
      </div>

      <div className="flex flex-wrap gap-2">
        <SkeletonBlock className="h-9 w-24 rounded border border-slate-200 bg-white" />
        <SkeletonBlock className="h-9 w-28 rounded border border-slate-200 bg-white" />
        <SkeletonBlock className="h-9 w-32 rounded border border-slate-200 bg-white" />
      </div>

      <LoadingState label={label} rows={tiles} />

      <div className={`grid gap-4 ${panels > 1 ? "lg:grid-cols-2" : ""}`}>
        {Array.from({ length: panels }, (_, index) => (
          <div key={`panel-${index}`} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <SkeletonBlock className="h-4 w-40 bg-slate-200" />
            <SkeletonBlock className="mt-2 h-3 w-56" />
            <SkeletonBlock className="mt-6 h-36 w-full" />
          </div>
        ))}
      </div>
    </main>
  );
}

export function GaugeMeter({
  label,
  valueLabel,
  percent,
  tone = "neutral",
  hint,
  badge,
  href,
  hrefLabel = "Open related workflow",
  informational = false,
  informationalReason = "Informational · no filtered workflow for this KPI",
}: {
  label: string;
  valueLabel: string;
  percent: number | null;
  tone?: DashboardTone;
  hint?: string;
  badge?: ReactNode;
  href?: string;
  hrefLabel?: string;
  informational?: boolean;
  informationalReason?: string;
}) {
  const style = DASHBOARD_TONE[tone];
  const pct = percent === null ? 0 : Math.max(0, Math.min(100, percent));
  const radius = 54;
  const stroke = 10;
  const circumference = Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;
  const showInfo = !href && informational;

  const inner = (
    <DashboardCard className={href ? "transition group-hover:border-slate-400 group-hover:shadow" : undefined}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
          {showInfo ? <StatusBadge label="Informational" tone="neutral" /> : null}
        </div>
        {badge}
      </div>
      <div className="mt-3 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-4">
        <svg viewBox="0 0 140 80" className="h-20 w-36 max-w-full shrink-0" role="img" aria-label={`${label} ${valueLabel}`}>
          <path
            d="M 16 70 A 54 54 0 0 1 124 70"
            fill="none"
            stroke={style.track}
            strokeWidth={stroke}
            strokeLinecap="round"
          />
          <path
            d="M 16 70 A 54 54 0 0 1 124 70"
            fill="none"
            stroke={style.fill}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${circumference}`}
            strokeDashoffset={offset}
          />
          <text x="70" y="62" textAnchor="middle" className="fill-slate-900" fontSize="18" fontWeight="600">
            {valueLabel}
          </text>
        </svg>
        <div className="min-w-0 space-y-1">
          {hint ? <p className={`text-xs leading-5 ${style.text}`}>{hint}</p> : null}
          {href ? (
            <p className="text-xs font-medium text-slate-700 underline-offset-2 group-hover:underline">
              {hrefLabel} →
            </p>
          ) : null}
          {showInfo ? (
            <p className="text-[11px] leading-4 text-slate-400">{informationalReason}</p>
          ) : null}
        </div>
      </div>
    </DashboardCard>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="group block rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
        aria-label={`${label}: ${valueLabel}. ${hrefLabel}`}
      >
        {inner}
      </Link>
    );
  }

  return inner;
}
