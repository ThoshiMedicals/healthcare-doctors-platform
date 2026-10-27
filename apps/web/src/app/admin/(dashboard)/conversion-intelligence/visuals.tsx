import Link from "next/link";
import type {
  AbandonmentJourneyRow,
  ConversionFunnelStep,
  ConverterRow,
  ExitPageRow,
  OpportunityRow,
} from "@/measurement/conversion-intelligence-report";
import {
  DashboardCard,
  EmptyState,
  HorizontalBarChart,
  ProgressBar,
  SectionShell,
  StatusBadge,
  conversionFunnelStageHref,
  formatCount,
  formatRate,
  type InsightsFilters,
} from "../dashboard-ui";

export { SectionShell, formatCount, formatRate };

export function ConversionFunnelChart({
  steps,
  filters,
}: {
  steps: ConversionFunnelStep[];
  filters?: InsightsFilters;
}) {
  const totalSessions = steps.reduce((sum, step) => sum + step.sessions, 0);
  if (steps.length === 0 || totalSessions === 0) {
    return (
      <DashboardCard>
        <h3 className="text-sm font-semibold text-slate-900">Conversion funnel</h3>
        <p className="mt-0.5 text-xs text-slate-500">
          Visitor → Search → Service → Practitioner → Booking · click a stage to investigate
        </p>
        <EmptyState
          title="No funnel activity"
          message="No conversion sessions in this range."
          className="mt-4"
        />
      </DashboardCard>
    );
  }
  const max = Math.max(...steps.map((step) => step.sessions), 1);
  return (
    <DashboardCard>
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Conversion funnel</h3>
          <p className="mt-0.5 text-xs text-slate-500">
            Visitor → Search → Service → Practitioner → Booking · click a stage to investigate
          </p>
        </div>
        {steps.some((step) => step.bottleneck) ? <StatusBadge label="Bottleneck highlighted" tone="bad" /> : null}
      </div>
      <ol className="mt-5 space-y-3">
        {steps.map((step, index) => {
          const width = Math.max((step.sessions / max) * 100, step.sessions ? 8 : 0);
          const href = conversionFunnelStageHref(step.key, filters);
          return (
            <li key={step.key}>
              <Link
                href={href}
                className="group block rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                aria-label={`${step.label} funnel stage${step.bottleneck ? ", bottleneck" : ""}. Investigate`}
              >
                <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2 text-sm">
                  <span className="font-medium text-slate-800 group-hover:underline">
                    {index + 1}. {step.label}
                    {step.bottleneck ? (
                      <span className="ml-2">
                        <StatusBadge label="Largest drop" tone="bad" />
                      </span>
                    ) : null}
                  </span>
                  <span className="tabular-nums text-slate-600">
                    {formatCount(step.sessions)}
                    {step.conversion_from_previous !== null
                      ? ` · ${formatRate(step.conversion_from_previous)} from previous`
                      : " · funnel start"}
                    {step.drop_from_previous !== null && step.drop_from_previous > 0 ? (
                      <span className={`ml-2 text-xs ${step.bottleneck ? "font-semibold text-rose-700" : "text-slate-500"}`}>
                        −{step.drop_from_previous.toFixed(0)}% drop
                      </span>
                    ) : null}
                  </span>
                </div>
                <div
                  className={`mx-auto h-10 overflow-hidden rounded transition group-hover:brightness-95 ${
                    step.bottleneck ? "ring-2 ring-rose-300" : "group-hover:ring-2 group-hover:ring-slate-400"
                  }`}
                  style={{ width: `${width}%` }}
                >
                  <div
                    className={`flex h-full items-center justify-center text-xs font-medium text-white ${
                      step.bottleneck ? "bg-rose-700" : "bg-slate-800"
                    }`}
                  >
                    {width > 22 ? formatRate(step.share_of_visitors) : ""}
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

export function ExitChart({ rows }: { rows: ExitPageRow[] }) {
  return (
    <HorizontalBarChart
      title="Top exits"
      hint="Last page in sessions that left without booking"
      rows={rows.map((row) => ({
        key: row.path,
        label: row.label,
        value: row.exits,
        displayValue: `${formatCount(row.exits)} · ${row.share.toFixed(1)}%`,
        tone: "bad",
      }))}
      empty="No non-booking exits in this range."
    />
  );
}

export function AbandonmentChart({ rows }: { rows: AbandonmentJourneyRow[] }) {
  return (
    <HorizontalBarChart
      title="Top abandonment paths"
      hint="Furthest funnel stage reached before leaving without booking"
      rows={rows.map((row) => ({
        key: row.journey,
        label: row.journey,
        value: row.sessions,
        displayValue: `${formatCount(row.sessions)} · ${row.share_of_abandoners.toFixed(1)}%`,
        tone: "warn",
      }))}
      empty="No abandonment journeys in this range."
    />
  );
}

export function PerformerChart({
  title,
  hint,
  rows,
  tone,
  hrefFor,
}: {
  title: string;
  hint: string;
  rows: ConverterRow[];
  tone: "best" | "worst";
  hrefFor?: (key: string) => string;
}) {
  return (
    <HorizontalBarChart
      title={title}
      hint={hint}
      rows={rows.slice(0, 8).map((row) => ({
        key: row.key,
        href: hrefFor?.(row.key),
        label: (
          <span>
            {row.label}
            <span className="mt-0.5 block text-xs font-normal text-slate-500">
              {formatCount(row.bookings)} bookings · {formatCount(row.sessions)} sessions
            </span>
          </span>
        ),
        value: row.conversion_rate ?? 0,
        displayValue: formatRate(row.conversion_rate),
        tone: tone === "best" ? "good" : "bad",
        meta: <StatusBadge label={tone === "best" ? "Best" : "Worst"} tone={tone === "best" ? "good" : "bad"} />,
      }))}
      empty="No performers in this range."
    />
  );
}

export function OpportunityPanel({
  title,
  rows,
  hrefFor,
}: {
  title: string;
  rows: OpportunityRow[];
  hrefFor?: (key: string) => string;
}) {
  return (
    <DashboardCard tone="warn">
      <h3 className="text-sm font-semibold text-amber-950">{title}</h3>
      {rows.length === 0 ? (
        <EmptyState
          title="No weak journeys"
          message="No weak journeys flagged in this range."
          className="mt-3 border-amber-200 bg-amber-50/50"
        />
      ) : (
        <ul className="mt-3 divide-y divide-amber-200/80">
          {rows.map((row) => {
            const href = hrefFor?.(row.key);
            const titleNode = href ? (
              <Link href={href} className="font-semibold text-amber-950 underline-offset-2 hover:underline">
                {row.label}
              </Link>
            ) : (
              <strong className="text-amber-950">{row.label}</strong>
            );
            return (
              <li key={row.key} className="flex flex-wrap items-start justify-between gap-3 py-3 text-sm">
                <div>
                  {titleNode}
                  <p className="mt-1 text-amber-900/80">{row.reason}</p>
                  <p className="mt-1 text-xs text-amber-900/60">
                    {formatCount(row.sessions)} sessions · {formatCount(row.bookings)} bookings
                  </p>
                  <div className="mt-2">
                    <ProgressBar value={row.conversion_rate ?? 0} tone="warn" className="h-1.5" />
                  </div>
                  {href ? (
                    <p className="mt-2 text-xs font-medium text-amber-950">
                      <Link href={href} className="underline-offset-2 hover:underline">
                        Open investigation →
                      </Link>
                    </p>
                  ) : null}
                </div>
                <StatusBadge label={formatRate(row.conversion_rate)} tone="warn" />
              </li>
            );
          })}
        </ul>
      )}
    </DashboardCard>
  );
}
