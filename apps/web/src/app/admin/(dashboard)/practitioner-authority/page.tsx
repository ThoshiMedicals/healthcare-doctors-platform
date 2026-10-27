import Link from "next/link";
import { requireAction } from "@/cms/context";
import { filterRowsByTier } from "@/measurement/authority-tier-investigation";
import {
  buildPracticePractitionerAuthorityDashboardFromIndex,
  practitionerAuthorityRangeOptions,
} from "@/measurement/practitioner-authority-report";
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
  executiveHref,
  getMetricGuide,
  KpiTargets,
  practitionerAuthorityHref,
} from "../dashboard-ui";
import { resolveInsightsDashboardData } from "../dashboard-ui/resolve-insights-data";
import { resolveInsightsFilters } from "../dashboard-ui/resolve-insights-filters";
import {
  ComparisonChart,
  MetricCard,
  RankTable,
  RosterTable,
  SectionShell,
  TierSummaryCards,
  formatCount,
  formatRate,
} from "./visuals";

export const dynamic = "force-dynamic";

export default async function PractitionerAuthorityDashboardPage({
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
    health?: string;
  }>;
}) {
  await requireAction("manage_settings");
  const params = searchParams ? await searchParams : {};
  const baseFilters = await resolveInsightsFilters({ ...params, focusAs: "practitioner" });
  const range: ExecutiveRange =
    baseFilters.range && isExecutiveRange(baseFilters.range) ? baseFilters.range : "last_7";
  const focus = baseFilters.practitioner ?? null;
  const tierFilter = baseFilters.tier ?? null;
  const { mode, filters: active, loaded } = await resolveInsightsDashboardData({
    ...baseFilters,
    range,
    ...(focus ? { practitioner: focus } : {}),
    ...(tierFilter ? { tier: tierFilter } : {}),
  });
  const report = await buildPracticePractitionerAuthorityDashboardFromIndex(loaded.events, range);
  const focused = focus ? report.practitioners.find((row) => row.slug === focus) : null;
  const rosterRows = filterRowsByTier(report.practitioners, tierFilter);

  return (
    <main>
      <InsightsFilterSync filters={active} />
      <DashboardHeader
        title="Doctor profile strength"
        description="Which doctor pages patients view, and whether those visits lead to booking or calling. Link labels describe the website — not clinical skill."
        actions={
          <ExportActions
            csvHref={`/api/admin/exports/practitioner-authority?format=csv&range=${range}&data=${mode}`}
          />
        }
        meta={
          <>
            {report.start} → {report.end}
            <span className="block sm:inline sm:before:content-['·_']">
              vs {report.previous_start} → {report.previous_end}
            </span>
            <span className="block sm:inline sm:before:content-['·_']">{loaded.feedLabel}</span>
          </>
        }
      />

      <div className="mt-6 space-y-3">
        <InsightsNav current="practitioner-authority" filters={active} />
        <DataModeBanner mode={mode} feedLabel={loaded.feedLabel} />
        <HowToReadDashboard dashboard="practitioner-authority" />
        <AuthorityTierExplained />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <RangeTabs
            options={practitionerAuthorityRangeOptions()}
            active={range}
            hrefFor={(value) =>
              practitionerAuthorityHref({
                range: value as ExecutiveRange,
                focus: focus || undefined,
                filters: active,
              })
            }
          />
          <div className="flex flex-wrap items-center gap-3">
            <HealthStatusLegend />
            <DataModeSwitcher path="/admin/practitioner-authority" filters={active} active={mode} />
          </div>
        </div>
        <InsightsInvestigationBanner
          filters={active}
          pathname="/admin/practitioner-authority"
          counts={{
            count: tierFilter ? rosterRows.length : undefined,
            entityLabel: tierFilter ? "Doctor profiles" : undefined,
            focusTitle: focused?.title ?? (focus ? `No practitioner matched “${focus}”` : undefined),
          }}
        />
      </div>

      <SectionShell
        id="pa-performance"
        title="How doctor pages are performing"
        description="Views first, then whether patients book or call from those profiles."
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <MetricCard
            label={getMetricGuide("practitioner-authority", "profile_views")!.label}
            value={formatCount(report.totals.profile_views)}
            hint={getMetricGuide("practitioner-authority", "profile_views")!.meaning}
            trend={report.trends.profile_views}
            href={KpiTargets.samePageSection("/admin/practitioner-authority", active, "pa-views", "Open profile rankings").href}
            hrefLabel="Open profile rankings"
          />
          <MetricCard
            label={getMetricGuide("practitioner-authority", "booking_intent")!.label}
            value={formatRate(report.totals.booking_intent)}
            hint={getMetricGuide("practitioner-authority", "booking_intent")!.meaning}
            trend={report.trends.booking_intent}
            href={KpiTargets.bookingJourney(active).href}
            hrefLabel={KpiTargets.bookingJourney(active).label}
          />
          <MetricCard
            label={getMetricGuide("practitioner-authority", "contact_rate")!.label}
            value={formatRate(report.totals.contact_rate)}
            hint={getMetricGuide("practitioner-authority", "contact_rate")!.meaning}
            trend={report.trends.contact_rate}
            href={KpiTargets.samePageSection("/admin/practitioner-authority", active, "pa-contact", "Open contact rankings").href}
            hrefLabel="Open contact rankings"
          />
        </div>
        <RankingGrid>
          <ComparisonChart
            title="Profile views"
            hint="Top practitioners by profile traffic"
            rows={report.ranked_by_profile_views}
            valueOf={(row) => row.profile_views}
            accent="#0f172a"
            hrefFor={(slug) =>
              practitionerAuthorityHref({ range, focus: slug, filters: { ...active, practitioner: slug } })
            }
          />
          <ComparisonChart
            title="Booking intent"
            hint="Top practitioners by booking rate"
            rows={report.ranked_by_booking_intent}
            valueOf={(row) => row.booking_intent ?? 0}
            formatValue={(value) => `${value.toFixed(1)}%`}
            accent="#166534"
            hrefFor={(slug) =>
              practitionerAuthorityHref({ range, focus: slug, filters: { ...active, practitioner: slug } })
            }
          />
          <ComparisonChart
            title="Contact rate"
            hint="Top practitioners by contact rate"
            rows={report.ranked_by_contact_rate}
            valueOf={(row) => row.contact_rate ?? 0}
            formatValue={(value) => `${value.toFixed(1)}%`}
            accent="#0369a1"
            hrefFor={(slug) =>
              practitionerAuthorityHref({ range, focus: slug, filters: { ...active, practitioner: slug } })
            }
          />
        </RankingGrid>
      </SectionShell>

      <SectionShell
        id="pa-tiers"
        title="Website link strength"
        description="Well connected / Building links / Needs more links — how strongly each profile is connected across the site (not a clinical rating)."
      >
        <TierSummaryCards counts={report.tier_counts} filters={active} activeTier={tierFilter} />
      </SectionShell>

      <SectionShell
        id="pa-rankings"
        title="Rankings"
        description="Compare practitioners with visual bars, Hub / Developing / Thin badges, and performance trends."
      >
        <RankingGrid>
          <RankTable
            id="pa-views"
            title="Ranked by profile views"
            hint="Absolute profile traffic"
            rows={report.ranked_by_profile_views}
            metric="profile_views"
          />
          <RankTable
            id="pa-contact"
            title="Ranked by contact rate"
            hint="(Booking + call clicks) ÷ profile views"
            rows={report.ranked_by_contact_rate}
            metric="contact_rate"
          />
          <RankTable
            id="pa-booking"
            title="Ranked by booking intent"
            hint="Booking clicks ÷ profile views"
            rows={report.ranked_by_booking_intent}
            metric="booking_intent"
          />
        </RankingGrid>
      </SectionShell>

      <SectionShell
        id="pa-roster"
        title={
          tierFilter
            ? `Practitioner roster · ${AUTHORITY_TIER_FRIENDLY[tierFilter]}`
            : "Practitioner roster"
        }
        description={
          tierFilter
            ? "Filtered by link strength. Each row explains why it is in this tier and what to improve."
            : "Full comparison with authority score meters and period trends where prior-window data is available. Click a tier above to investigate."
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
        measurement 2G · authority graph from published search index · performance trends vs equal-length prior window
        · authority score is current published graph (no historical score series) · debug queries remain local for{" "}
        {report.privacy.ttl_days} days ·{" "}
        <Link href={executiveHref(range)} className="underline underline-offset-2 hover:text-slate-800">
          Executive Dashboard
        </Link>
      </p>
    </main>
  );
}
