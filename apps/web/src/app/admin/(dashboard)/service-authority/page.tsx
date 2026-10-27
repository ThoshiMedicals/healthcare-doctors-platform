import Link from "next/link";
import { requireAction } from "@/cms/context";
import { filterRowsByTier } from "@/measurement/authority-tier-investigation";
import {
  buildPracticeServiceAuthorityDashboardFromIndex,
  serviceAuthorityRangeOptions,
} from "@/measurement/service-authority-report";
import { isExecutiveRange, type ExecutiveRange } from "@/measurement/ranges";
import {
  AUTHORITY_TIER_FRIENDLY,
  AuthorityTierExplained,
  DashboardHeader,
  DataModeBanner,
  DataModeSwitcher,
  ExportActions,
  HealthStatusLegend,
  HowToReadDashboard,
  InsightsFilterSync,
  InsightsInvestigationBanner,
  InsightsNav,
  RankingGrid,
  RangeTabs,
  KpiTargets,
  practitionerAuthorityHref,
  serviceAuthorityHref,
} from "../dashboard-ui";
import { resolveInsightsDashboardData } from "../dashboard-ui/resolve-insights-data";
import { resolveInsightsFilters } from "../dashboard-ui/resolve-insights-filters";
import {
  DigitalReceptionCharts,
  RankingChart,
  RosterTable,
  SectionShell,
  SummaryCard,
  TierDistribution,
  formatCount,
  formatRate,
} from "./visuals";

export const dynamic = "force-dynamic";

export default async function ServiceAuthorityDashboardPage({
  searchParams,
}: {
  searchParams?: Promise<{
    range?: string;
    focus?: string;
    practitioner?: string;
    service?: string;
    queue?: string;
    data?: string;
    tier?: string;
  }>;
}) {
  await requireAction("manage_settings");
  const params = searchParams ? await searchParams : {};
  const baseFilters = await resolveInsightsFilters(params, "/admin/service-authority");
  const range: ExecutiveRange =
    baseFilters.range && isExecutiveRange(baseFilters.range) ? baseFilters.range : "last_7";
  const focus = baseFilters.service ?? null;
  const tierFilter = baseFilters.tier ?? null;
  const { mode, filters: active, loaded } = await resolveInsightsDashboardData({
    ...baseFilters,
    range,
    ...(focus ? { service: focus } : {}),
    ...(tierFilter ? { tier: tierFilter } : {}),
  });
  const report = await buildPracticeServiceAuthorityDashboardFromIndex(loaded.events, range);
  const focused = focus ? report.services.find((row) => row.slug === focus) : null;
  const rosterRows = filterRowsByTier(report.services, tierFilter);

  return (
    <main>
      <InsightsFilterSync filters={active} />
      <DashboardHeader
        title="Service page strength"
        description="Which clinic services patients look at, and whether those pages lead to a booking or call. Link labels describe the website — not clinical priority."
        actions={
          <ExportActions
            csvHref={`/api/admin/exports/service-authority?format=csv&range=${range}&data=${mode}`}
          />
        }
        meta={
          <>
            {report.start} → {report.end} · {loaded.feedLabel}
          </>
        }
      />

      <div className="mt-6 space-y-3">
        <InsightsNav current="service-authority" filters={active} />
        <DataModeBanner mode={mode} feedLabel={loaded.feedLabel} />
        <HowToReadDashboard dashboard="service-authority" />
        <AuthorityTierExplained />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <RangeTabs
            options={serviceAuthorityRangeOptions()}
            active={range}
            hrefFor={(value) =>
              serviceAuthorityHref({
                range: value as ExecutiveRange,
                focus: focus || undefined,
                tier: tierFilter ?? undefined,
                filters: active,
              })
            }
          />
          <div className="flex flex-wrap items-center gap-3">
            <HealthStatusLegend />
            <DataModeSwitcher path="/admin/service-authority" filters={active} active={mode} />
          </div>
        </div>
        <InsightsInvestigationBanner
          filters={active}
          pathname="/admin/service-authority"
          counts={{
            count: tierFilter ? rosterRows.length : undefined,
            entityLabel: tierFilter ? "Services" : undefined,
            focusTitle: focused?.title ?? (focus ? `No service matched “${focus}”` : undefined),
          }}
        />
      </div>

      <SectionShell
        id="sa-summary"
        title="How service pages are performing"
        description="Headline service engagement across the published service graph."
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            label="Service views"
            value={formatCount(report.totals.service_views)}
            hint="Service page views in range"
            href={KpiTargets.samePageSection("/admin/service-authority", active, "sa-rankings", "Open service rankings").href}
            hrefLabel="Open service rankings"
          />
          <SummaryCard
            label="Contact rate"
            value={formatRate(report.totals.contact_rate)}
            hint="(Bookings + calls) ÷ views"
            href={KpiTargets.bookingJourney(active).href}
            hrefLabel={KpiTargets.bookingJourney(active).label}
          />
          <SummaryCard
            label="Booking intent"
            value={formatRate(report.totals.booking_intent)}
            hint="Booking clicks ÷ views"
            href={KpiTargets.bookingJourney(active).href}
            hrefLabel={KpiTargets.bookingJourney(active).label}
          />
          <SummaryCard
            label="Arrivals from search"
            value={formatCount(report.totals.digital_reception_entrances)}
            hint={`${formatCount(report.totals.digital_reception_outcomes)} search outcomes`}
            href={KpiTargets.searchQuality(active, "dr-charts").href}
            hrefLabel="Open search destinations"
          />
        </div>
      </SectionShell>

      <SectionShell
        id="sa-tiers"
        title="Link strength & contact mix"
        description="Hub ≥ 40 · Developing ≥ 14 · Thin < 14 — colour-coded badges and stacked share charts."
      >
        <TierDistribution
          counts={report.tier_counts}
          slices={report.conversion_by_tier}
          filters={active}
          activeTier={tierFilter}
        />
      </SectionShell>

      <SectionShell
        id="sa-rankings"
        title="Service ranking charts"
        description="Compare services by traffic, contact rate, and booking intent with Hub / Developing / Thin badges."
      >
        <RankingGrid>
          <RankingChart
            title="Ranked by views"
            hint="Service page views"
            rows={report.ranked_by_views}
            valueOf={(row) => row.service_views}
            hrefFor={(slug) =>
              serviceAuthorityHref({ range, focus: slug, filters: { ...active, service: slug } })
            }
          />
          <RankingChart
            title="Ranked by contact rate"
            hint="(Booking + call clicks) ÷ views"
            rows={report.ranked_by_contact_rate}
            valueOf={(row) => row.contact_rate ?? 0}
            formatValue={(value) => `${value.toFixed(1)}%`}
            hrefFor={(slug) =>
              serviceAuthorityHref({ range, focus: slug, filters: { ...active, service: slug } })
            }
          />
          <RankingChart
            title="Ranked by booking intent"
            hint="Booking clicks ÷ views"
            rows={report.ranked_by_booking_intent}
            valueOf={(row) => row.booking_intent ?? 0}
            formatValue={(value) => `${value.toFixed(1)}%`}
            hrefFor={(slug) =>
              serviceAuthorityHref({ range, focus: slug, filters: { ...active, service: slug } })
            }
          />
        </RankingGrid>
      </SectionShell>

      <SectionShell
        id="sa-dr"
        title="Arrivals from online search"
        description="Which services Digital Reception sends patients into, and how that splits by authority tier. Click a bar to investigate."
      >
        <DigitalReceptionCharts
          rows={report.ranked_by_digital_reception}
          slices={report.conversion_by_tier}
          totals={{
            digital_reception_entrances: report.totals.digital_reception_entrances,
            digital_reception_outcomes: report.totals.digital_reception_outcomes,
          }}
          hrefFor={(slug) =>
            serviceAuthorityHref({ range, focus: slug, filters: { ...active, service: slug } })
          }
        />
      </SectionShell>

      <SectionShell
        id="sa-roster"
        title={
          tierFilter ? `Service roster · ${AUTHORITY_TIER_FRIENDLY[tierFilter]}` : "Service roster"
        }
        description={
          tierFilter
            ? "Filtered by link strength. Each row explains why it is in this tier and what to improve."
            : "Compact comparison with colour-coded tiers and authority score meters. Click a tier above to investigate."
        }
      >
        <RosterTable
          rows={rosterRows}
          focusSlug={focused?.slug ?? focus}
          showInvestigation={Boolean(tierFilter)}
        />
      </SectionShell>

      <p className="mt-8 text-xs text-slate-500">
        Generated {new Date(report.generated_at).toLocaleString("en-AU", { timeZone: "Australia/Brisbane" })} ·
        measurement 2G · authority graph from published search index · debug queries remain local for{" "}
        {report.privacy.ttl_days} days ·{" "}
        <Link
          href={practitionerAuthorityHref({ range })}
          className="underline underline-offset-2 hover:text-slate-800"
        >
          Practitioner Authority
        </Link>
      </p>
    </main>
  );
}
