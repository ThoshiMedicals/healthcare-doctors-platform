import { Fragment } from "react";
import Link from "next/link";
import { AUTHORITY_TIER_FRIENDLY, type AuthorityTier } from "@/measurement/authority-framework";
import {
  investigatePractitionerTier,
  type AuthorityTierInvestigation,
} from "@/measurement/authority-tier-investigation";
import type { MetricTrend } from "@/measurement/executive-report";
import type { PractitionerAuthorityRow } from "@/measurement/practitioner-authority-report";
import {
  AuthorityInvestigationBlock,
  AuthorityPaletteLegend,
  DashboardCard,
  EmptyState,
  HorizontalBarChart,
  MetricTile,
  ProgressBar,
  SectionShell,
  StatusBadge,
  TrendIndicator,
  formatCount,
  formatRate,
  type DashboardTone,
  type InsightsFilters,
} from "../dashboard-ui";
import { practitionerAuthorityHref } from "../dashboard-ui/links";

export { AuthorityPaletteLegend };

export { SectionShell, formatCount, formatRate };
export const MetricCard = MetricTile;

function tierTone(tier: AuthorityTier): DashboardTone {
  if (tier === "Hub") return "hub";
  if (tier === "Developing") return "developing";
  return "thin";
}

export function TierBadge({ tier }: { tier: AuthorityTier }) {
  return <StatusBadge label={AUTHORITY_TIER_FRIENDLY[tier]} tone={tierTone(tier)} />;
}

export function TierSummaryCards({
  counts,
  filters,
  activeTier,
}: {
  counts: Record<AuthorityTier, number>;
  filters: InsightsFilters;
  activeTier?: AuthorityTier | null;
}) {
  return (
    <div className="space-y-3">
      <AuthorityPaletteLegend />
      <p className="text-xs text-slate-500">Click a tier to open the roster and see why each profile sits there.</p>
      <div className="grid gap-3 sm:grid-cols-3">
        {(["Hub", "Developing", "Thin"] as const).map((tier) => {
          const href = practitionerAuthorityHref({
            range: filters.range,
            tier,
            filters: {
              range: filters.range,
              data: filters.data,
              tier,
              from: "chart",
            },
          });
          const selected = activeTier === tier;
          return (
            <Link
              key={tier}
              href={href}
              className={`block rounded-lg outline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-slate-900 ${
                selected ? "ring-2 ring-slate-900 ring-offset-2" : ""
              }`}
              aria-current={selected ? "page" : undefined}
            >
              <DashboardCard tone={tierTone(tier)} className="h-full transition hover:shadow-md">
                <div className="flex items-center justify-between gap-2">
                  <TierBadge tier={tier} />
                  <p className="text-3xl font-semibold tabular-nums">{counts[tier]}</p>
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  {tier === "Hub" ? "Score ≥ 40" : tier === "Developing" ? "Score 14–39" : "Score < 14"}
                </p>
                <p className="mt-2 text-xs font-medium text-slate-700">
                  Investigate roster →
                </p>
              </DashboardCard>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function ComparisonChart({
  title,
  hint,
  rows,
  valueOf,
  formatValue = formatCount,
  accent,
  hrefFor,
}: {
  title: string;
  hint: string;
  rows: PractitionerAuthorityRow[];
  valueOf: (row: PractitionerAuthorityRow) => number;
  formatValue?: (value: number) => string;
  accent?: string;
  hrefFor?: (slug: string) => string;
}) {
  return (
    <HorizontalBarChart
      title={title}
      hint={hint}
      accent={accent}
      rows={rows.slice(0, 8).map((row) => ({
        key: row.slug,
        href: hrefFor?.(row.slug),
        label: row.title,
        value: valueOf(row),
        displayValue: formatValue(valueOf(row)),
        tone: tierTone(row.tier),
        meta: <TierBadge tier={row.tier} />,
      }))}
      empty="No practitioners to compare."
    />
  );
}

export function AuthorityScoreMeter({
  score,
  tier,
  compact = false,
}: {
  score: number;
  tier: AuthorityTier;
  compact?: boolean;
}) {
  const capped = Math.max(0, Math.min(score, 80));
  if (compact) {
    return (
      <div className="min-w-[5.5rem]" title={`Authority score ${score}`}>
        <div className="mb-0.5 text-right text-[10px] tabular-nums text-slate-400">score {score}</div>
        <ProgressBar value={capped} max={80} tone={tierTone(tier)} className="h-1.5" />
      </div>
    );
  }
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-2 text-xs">
        <span className="text-slate-500">Authority score</span>
        <span className="font-semibold tabular-nums text-slate-800">{score}</span>
      </div>
      <ProgressBar value={capped} max={80} tone={tierTone(tier)} className="h-2" />
      <div className="mt-1 flex justify-between text-[10px] text-slate-400">
        <span>Thin</span>
        <span>14</span>
        <span>40 Hub</span>
      </div>
    </div>
  );
}

export function RankTable({
  id,
  title,
  hint,
  rows,
  metric,
}: {
  id: string;
  title: string;
  hint: string;
  rows: PractitionerAuthorityRow[];
  metric: "profile_views" | "contact_rate" | "booking_intent";
}) {
  const values = rows.map((row) => (metric === "profile_views" ? row.profile_views : (row[metric] ?? 0)));
  const max = Math.max(...values, 1);

  return (
    <DashboardCard>
      <h3 id={id} className="text-sm font-semibold text-slate-900">
        {title}
      </h3>
      <p className="mt-0.5 text-xs text-slate-500">{hint}</p>
      <ol className="mt-4 max-h-[28rem] divide-y divide-slate-100 overflow-y-auto sm:max-h-none sm:overflow-visible">
        {rows.length === 0 ? (
          <li className="py-3">
            <EmptyState title="No practitioners" message="No practitioners in this range." />
          </li>
        ) : (
          rows.slice(0, 8).map((row, index) => {
            const value = metric === "profile_views" ? row.profile_views : (row[metric] ?? 0);
            const trend =
              metric === "profile_views"
                ? row.trends.profile_views
                : metric === "contact_rate"
                  ? row.trends.contact_rate
                  : row.trends.booking_intent;
            return (
              <li key={`${id}-${row.slug}`} className="py-3">
                <div className="flex flex-col gap-3 text-sm sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="w-5 shrink-0 text-slate-400">{index + 1}.</span>
                      <strong className="text-slate-900">{row.title}</strong>
                      <TierBadge tier={row.tier} />
                    </div>
                    <p className="mt-1 pl-7 text-xs text-slate-500">
                      {formatCount(row.profile_views)} views · {formatCount(row.booking_clicks)} bookings ·{" "}
                      {formatCount(row.call_clicks)} calls · DR {row.digital_reception_recommendations}/
                      {row.digital_reception_selections}
                    </p>
                    <div className="mt-2 pl-7">
                      <ProgressBar value={value} max={max} tone={tierTone(row.tier)} className="h-2" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-3 pl-7 sm:flex-col sm:items-end sm:pl-0 sm:text-right">
                    <div className="tabular-nums font-semibold text-slate-900">
                      {metric === "profile_views" ? formatCount(row.profile_views) : formatRate(row[metric])}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <TrendIndicator trend={trend} />
                      <AuthorityScoreMeter score={row.authority_score} tier={row.tier} compact />
                    </div>
                  </div>
                </div>
              </li>
            );
          })
        )}
      </ol>
      {rows.length > 8 ? (
        <p className="mt-2 text-xs text-slate-500">Showing top 8 · full roster below</p>
      ) : null}
    </DashboardCard>
  );
}

function RosterInvestigation({ investigation }: { investigation: AuthorityTierInvestigation }) {
  return <AuthorityInvestigationBlock investigation={investigation} />;
}

export function RosterTable({
  rows,
  focusSlug,
  showInvestigation = false,
}: {
  rows: PractitionerAuthorityRow[];
  focusSlug?: string | null;
  /** When a tier filter is active, show why + recommendations per row. */
  showInvestigation?: boolean;
}) {
  if (rows.length === 0) {
    return (
      <EmptyState
        title="No practitioners in this tier"
        message="No doctor profiles match the selected link-strength filter for this range."
      />
    );
  }

  const ordered = focusSlug
    ? [...rows].sort((a, b) => Number(b.slug === focusSlug) - Number(a.slug === focusSlug))
    : rows;

  return (
    <DashboardCard>
      {/* Mobile: stacked cards — no horizontal scroll */}
      <ul className="divide-y divide-slate-100 md:hidden">
        {ordered.map((row) => {
          const investigation = showInvestigation ? investigatePractitionerTier(row) : null;
          return (
            <li
              key={`mobile-${row.slug}`}
              id={row.slug === focusSlug ? "pa-focus" : undefined}
              className={`space-y-3 py-4 ${row.slug === focusSlug ? "rounded-md bg-indigo-50/80 px-2" : ""}`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <strong className="text-sm text-slate-900">{row.title}</strong>
                <TierBadge tier={row.tier} />
                {row.slug === focusSlug ? <StatusBadge label="Focused" tone="info" /> : null}
              </div>
              <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                <div>
                  <dt className="text-slate-500">Views</dt>
                  <dd className="tabular-nums font-medium text-slate-900">{formatCount(row.profile_views)}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Contact</dt>
                  <dd className="tabular-nums font-medium text-slate-900">{formatRate(row.contact_rate)}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Book intent</dt>
                  <dd className="tabular-nums font-medium text-slate-900">{formatRate(row.booking_intent)}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">DR</dt>
                  <dd className="tabular-nums font-medium text-slate-900">
                    {row.digital_reception_recommendations}/{row.digital_reception_selections}
                  </dd>
                </div>
              </dl>
              <AuthorityScoreMeter score={row.authority_score} tier={row.tier} />
              <div className="flex flex-wrap gap-1">
                <TrendIndicator trend={row.trends.profile_views} />
                <TrendIndicator trend={row.trends.contact_rate} />
                <TrendIndicator trend={row.trends.booking_intent} />
              </div>
              {investigation ? <RosterInvestigation investigation={investigation} /> : null}
            </li>
          );
        })}
      </ul>

      {/* Desktop: wide table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="pb-2 pr-3 font-medium">Practitioner</th>
              <th className="pb-2 pr-3 font-medium">Tier</th>
              <th className="pb-2 pr-3 font-medium">Views</th>
              <th className="pb-2 pr-3 font-medium">Contact</th>
              <th className="pb-2 pr-3 font-medium">Book intent</th>
              <th className="pb-2 pr-3 font-medium">Authority</th>
              <th className="pb-2 pr-3 font-medium">Trends</th>
              <th className="pb-2 font-medium">DR</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {ordered.map((row) => {
              const investigation = showInvestigation ? investigatePractitionerTier(row) : null;
              return (
                <Fragment key={row.slug}>
                  <tr
                    id={row.slug === focusSlug ? "pa-focus-desktop" : undefined}
                    className={row.slug === focusSlug ? "bg-indigo-50/80" : undefined}
                  >
                    <td className="py-3 pr-3 font-medium text-slate-900">
                      {row.title}
                      {row.slug === focusSlug ? (
                        <span className="ml-2">
                          <StatusBadge label="Focused" tone="info" />
                        </span>
                      ) : null}
                    </td>
                    <td className="py-3 pr-3">
                      <TierBadge tier={row.tier} />
                    </td>
                    <td className="py-3 pr-3 tabular-nums">{formatCount(row.profile_views)}</td>
                    <td className="py-3 pr-3 tabular-nums">{formatRate(row.contact_rate)}</td>
                    <td className="py-3 pr-3 tabular-nums">{formatRate(row.booking_intent)}</td>
                    <td className="min-w-[9rem] py-3 pr-3">
                      <AuthorityScoreMeter score={row.authority_score} tier={row.tier} />
                    </td>
                    <td className="py-3 pr-3">
                      <div className="flex flex-col items-start gap-1">
                        <TrendIndicator trend={row.trends.profile_views} />
                        <TrendIndicator trend={row.trends.contact_rate} />
                        <TrendIndicator trend={row.trends.booking_intent} />
                      </div>
                    </td>
                    <td className="py-3 tabular-nums text-slate-600">
                      {row.digital_reception_recommendations}/{row.digital_reception_selections}
                    </td>
                  </tr>
                  {investigation ? (
                    <tr className={row.slug === focusSlug ? "bg-indigo-50/80" : undefined}>
                      <td colSpan={8} className="pb-4 pr-3">
                        <RosterInvestigation investigation={investigation} />
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </DashboardCard>
  );
}

export type { MetricTrend };
