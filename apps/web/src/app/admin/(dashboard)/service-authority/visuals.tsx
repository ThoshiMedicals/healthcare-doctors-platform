import { Fragment } from "react";
import Link from "next/link";
import { AUTHORITY_TIER_FRIENDLY, type AuthorityTier } from "@/measurement/authority-framework";
import {
  investigateServiceTier,
  type AuthorityTierInvestigation,
} from "@/measurement/authority-tier-investigation";
import type { ServiceAuthorityRow, TierConversionSlice } from "@/measurement/service-authority-report";
import {
  AuthorityInvestigationBlock,
  AuthorityPaletteLegend,
  DashboardCard,
  EmptyState,
  HorizontalBarChart,
  MetricTile,
  ProgressBar,
  SectionShell,
  StackedBar,
  StatusBadge,
  formatCount,
  formatRate,
  type DashboardTone,
  type InsightsFilters,
} from "../dashboard-ui";
import { serviceAuthorityHref } from "../dashboard-ui/links";

export { SectionShell, formatCount, formatRate };
export const SummaryCard = MetricTile;

function tierTone(tier: AuthorityTier): DashboardTone {
  if (tier === "Hub") return "hub";
  if (tier === "Developing") return "developing";
  return "thin";
}

export function TierBadge({ tier }: { tier: AuthorityTier }) {
  return <StatusBadge label={AUTHORITY_TIER_FRIENDLY[tier]} tone={tierTone(tier)} />;
}

export function TierDistribution({
  counts,
  slices,
  filters,
  activeTier,
}: {
  counts: Record<AuthorityTier, number>;
  slices: TierConversionSlice[];
  filters: InsightsFilters;
  activeTier?: AuthorityTier | null;
}) {
  const total = counts.Hub + counts.Developing + counts.Thin || 1;
  return (
    <div className="space-y-3">
      <AuthorityPaletteLegend />
      <p className="text-xs text-slate-500">Click a tier to open the roster and see why each service sits there.</p>
      <div className="grid gap-4 lg:grid-cols-2">
      <DashboardCard>
        <h3 className="text-sm font-semibold text-slate-900">Authority tier distribution</h3>
        <p className="mt-0.5 text-xs text-slate-500">Published services by Well connected · Building links · Needs more links</p>
        <div className="mt-4">
          <StackedBar
            className="h-4"
            slices={(["Hub", "Developing", "Thin"] as const).map((tier) => ({
              key: tier,
              value: counts[tier],
              tone: tierTone(tier),
              title: `${AUTHORITY_TIER_FRIENDLY[tier]}: ${counts[tier]}`,
            }))}
          />
        </div>
        <ul className="mt-4 space-y-3">
          {(["Hub", "Developing", "Thin"] as const).map((tier) => {
            const href = serviceAuthorityHref({
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
              <li key={tier}>
                <Link
                  href={href}
                  aria-current={selected ? "page" : undefined}
                  className={`flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm transition hover:bg-slate-50 ${
                    selected
                      ? "border-slate-900 bg-slate-50 ring-2 ring-slate-900 ring-offset-1"
                      : "border-transparent"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <TierBadge tier={tier} />
                    <span className="text-slate-500">
                      {tier === "Hub" ? "≥ 40" : tier === "Developing" ? "14–39" : "< 14"}
                    </span>
                  </span>
                  <span className="tabular-nums font-semibold text-slate-900">
                    {counts[tier]} · {((counts[tier] / total) * 100).toFixed(0)}%
                    <span className="ml-2 text-xs font-medium text-slate-600">Investigate →</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </DashboardCard>

      <DashboardCard>
        <h3 className="text-sm font-semibold text-slate-900">Conversion distribution</h3>
        <p className="mt-0.5 text-xs text-slate-500">Share of views, bookings, and contact actions by tier</p>
        <ul className="mt-4 space-y-4">
          {(
            [
              ["Views", "views_share", "service_views"],
              ["Bookings", "booking_share", "booking_clicks"],
              ["Contact actions", "contact_share", "contact_actions"],
            ] as const
          ).map(([label, shareKey, countKey]) => (
            <li key={label}>
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
              <StackedBar
                slices={slices.map((slice) => ({
                  key: `${label}-${slice.tier}`,
                  value: slice[shareKey],
                  tone: tierTone(slice.tier),
                  title: `${AUTHORITY_TIER_FRIENDLY[slice.tier]}: ${formatCount(slice[countKey])} (${slice[shareKey].toFixed(1)}%)`,
                }))}
              />
              <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-slate-500">
                {slices.map((slice) => (
                  <span key={`${label}-legend-${slice.tier}`} className="tabular-nums">
                    {AUTHORITY_TIER_FRIENDLY[slice.tier]} {formatCount(slice[countKey])} ({slice[shareKey].toFixed(0)}%)
                  </span>
                ))}
              </div>
            </li>
          ))}
        </ul>
      </DashboardCard>
      </div>
    </div>
  );
}

export function RankingChart({
  title,
  hint,
  rows,
  valueOf,
  formatValue = formatCount,
  hrefFor,
}: {
  title: string;
  hint: string;
  rows: ServiceAuthorityRow[];
  valueOf: (row: ServiceAuthorityRow) => number;
  formatValue?: (value: number) => string;
  hrefFor?: (slug: string) => string;
}) {
  return (
    <HorizontalBarChart
      title={title}
      hint={hint}
      rows={rows.slice(0, 8).map((row) => ({
        key: row.slug,
        href: hrefFor?.(row.slug),
        label: row.title,
        value: valueOf(row),
        displayValue: formatValue(valueOf(row)),
        tone: tierTone(row.tier),
        meta: <TierBadge tier={row.tier} />,
      }))}
      empty="No services to rank."
    />
  );
}

export function DigitalReceptionCharts({
  rows,
  slices,
  totals,
  hrefFor,
}: {
  rows: ServiceAuthorityRow[];
  slices: TierConversionSlice[];
  totals: { digital_reception_entrances: number; digital_reception_outcomes: number };
  hrefFor?: (slug: string) => string;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <HorizontalBarChart
        title="Digital Reception entry charts"
        hint={`Entrances by service · ${formatCount(totals.digital_reception_entrances)} total · ${formatCount(totals.digital_reception_outcomes)} outcomes`}
        rows={rows.slice(0, 10).map((row) => ({
          key: row.slug,
          href: hrefFor?.(row.slug),
          label: row.title,
          value: row.digital_reception_entrances,
          displayValue: `${formatCount(row.digital_reception_entrances)} in · ${formatCount(row.digital_reception_outcomes)} out`,
          tone: tierTone(row.tier),
          meta: <TierBadge tier={row.tier} />,
        }))}
        empty="No Digital Reception service entrances in this range."
      />
      <DashboardCard>
        <h3 className="text-sm font-semibold text-slate-900">DR entrances by authority tier</h3>
        <p className="mt-0.5 text-xs text-slate-500">Where Digital Reception traffic lands across link-strength tiers</p>
        <div className="mt-4">
          <StackedBar
            className="h-4"
            slices={slices.map((slice) => ({
              key: slice.tier,
              value: slice.digital_reception_entrances,
              tone: tierTone(slice.tier),
            }))}
          />
        </div>
        <ul className="mt-4 space-y-3">
          {slices.map((slice) => (
            <li key={slice.tier} className="flex items-center justify-between gap-3 text-sm">
              <TierBadge tier={slice.tier} />
              <span className="tabular-nums text-slate-600">
                {formatCount(slice.digital_reception_entrances)} · {slice.dr_entrance_share.toFixed(0)}% ·{" "}
                {formatCount(slice.digital_reception_outcomes)} outcomes
              </span>
            </li>
          ))}
        </ul>
      </DashboardCard>
    </div>
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
  rows: ServiceAuthorityRow[];
  focusSlug?: string | null;
  showInvestigation?: boolean;
}) {
  if (rows.length === 0) {
    return (
      <EmptyState
        title="No services in this tier"
        message="No service pages match the selected link-strength filter for this range."
      />
    );
  }
  const ordered = focusSlug
    ? [...rows].sort((a, b) => Number(b.slug === focusSlug) - Number(a.slug === focusSlug))
    : rows;
  return (
    <DashboardCard>
      <ul className="divide-y divide-slate-100 md:hidden">
        {ordered.map((row) => {
          const investigation = showInvestigation ? investigateServiceTier(row) : null;
          return (
            <li
              key={`mobile-${row.slug}`}
              id={row.slug === focusSlug ? "sa-focus" : undefined}
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
                  <dd className="tabular-nums font-medium text-slate-900">{formatCount(row.service_views)}</dd>
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
                  <dt className="text-slate-500">DR in / out</dt>
                  <dd className="tabular-nums font-medium text-slate-900">
                    {formatCount(row.digital_reception_entrances)} / {formatCount(row.digital_reception_outcomes)}
                  </dd>
                </div>
              </dl>
              <div>
                <div className="mb-1 text-xs tabular-nums text-slate-500">Authority {row.authority_score}</div>
                <ProgressBar
                  value={Math.max(0, Math.min(row.authority_score, 80))}
                  max={80}
                  tone={tierTone(row.tier)}
                  className="h-1.5"
                />
              </div>
              {investigation ? <RosterInvestigation investigation={investigation} /> : null}
            </li>
          );
        })}
      </ul>

      <div className="hidden overflow-x-auto md:block">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="pb-2 pr-3 font-medium">Service</th>
              <th className="pb-2 pr-3 font-medium">Tier</th>
              <th className="pb-2 pr-3 font-medium">Views</th>
              <th className="pb-2 pr-3 font-medium">Contact</th>
              <th className="pb-2 pr-3 font-medium">Book intent</th>
              <th className="pb-2 pr-3 font-medium">DR in / out</th>
              <th className="pb-2 font-medium">Authority</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {ordered.map((row) => {
              const investigation = showInvestigation ? investigateServiceTier(row) : null;
              return (
                <Fragment key={row.slug}>
                  <tr
                    id={row.slug === focusSlug ? "sa-focus-desktop" : undefined}
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
                    <td className="py-3 pr-3 tabular-nums">{formatCount(row.service_views)}</td>
                    <td className="py-3 pr-3 tabular-nums">{formatRate(row.contact_rate)}</td>
                    <td className="py-3 pr-3 tabular-nums">{formatRate(row.booking_intent)}</td>
                    <td className="py-3 pr-3 tabular-nums text-slate-600">
                      {formatCount(row.digital_reception_entrances)} / {formatCount(row.digital_reception_outcomes)}
                    </td>
                    <td className="min-w-[8rem] py-3">
                      <div className="mb-1 text-xs tabular-nums text-slate-500">{row.authority_score}</div>
                      <ProgressBar
                        value={Math.max(0, Math.min(row.authority_score, 80))}
                        max={80}
                        tone={tierTone(row.tier)}
                        className="h-1.5"
                      />
                    </td>
                  </tr>
                  {investigation ? (
                    <tr className={row.slug === focusSlug ? "bg-indigo-50/80" : undefined}>
                      <td colSpan={7} className="pb-4 pr-3">
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
