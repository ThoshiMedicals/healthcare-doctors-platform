import Link from "next/link";
import { requireAction } from "@/cms/context";
import {
  buildPracticeConversionIntelligenceReport,
  conversionIntelligenceRangeOptions,
} from "@/measurement/conversion-intelligence-report";
import { isExecutiveRange, type ExecutiveRange } from "@/measurement/ranges";
import {
  DashboardHeader,
  DataModeBanner,
  DataModeSwitcher,
  ExportActions,
  HealthStatusLegend,
  HowToReadDashboard,
  InsightsFilterSync,
  InsightsInvestigationBanner,
  InsightsNav,
  KpiTargets,
  MetricTile,
  RankingGrid,
  RangeTabs,
  formatCount,
  insightsFiltersActive,
  matchFocusKey,
  practitionerAuthorityHref,
  serviceAuthorityHref,
  withInsightsQuery,
} from "../dashboard-ui";
import { resolveInsightsDashboardData } from "../dashboard-ui/resolve-insights-data";
import { resolveInsightsFilters } from "../dashboard-ui/resolve-insights-filters";
import {
  AbandonmentChart,
  ConversionFunnelChart,
  ExitChart,
  OpportunityPanel,
  PerformerChart,
  SectionShell,
} from "./visuals";

export const dynamic = "force-dynamic";

function filterByKey<T extends { key: string }>(rows: T[], focus: string | undefined): T[] {
  if (!focus) return rows;
  const matched = rows.filter((row) => matchFocusKey(row.key, focus));
  return matched.length ? matched : rows;
}

export default async function ConversionIntelligencePage({
  searchParams,
}: {
  searchParams?: Promise<{
    range?: string;
    practitioner?: string;
    service?: string;
    queue?: string;
    data?: string;
    health?: string;
  }>;
}) {
  await requireAction("manage_settings");
  const params = searchParams ? await searchParams : {};
  const baseFilters = await resolveInsightsFilters(params);
  const range: ExecutiveRange =
    baseFilters.range && isExecutiveRange(baseFilters.range) ? baseFilters.range : "last_7";
  const { mode, filters: active, loaded } = await resolveInsightsDashboardData({
    ...baseFilters,
    range,
  });
  const report = buildPracticeConversionIntelligenceReport(loaded.events, range);

  const practitionerFocus = active.practitioner;
  const serviceFocus = active.service;
  const focused = insightsFiltersActive(active);
  const bottleneck = report.funnel.find((step) => step.bottleneck);
  const opportunityCount =
    report.opportunities.weak_booking_paths.length +
    report.opportunities.weak_service_journeys.length +
    report.opportunities.weak_practitioner_journeys.length;
  const funnelAction = KpiTargets.samePageSection(
    "/admin/conversion-intelligence",
    active,
    "ci-funnel",
    "Open patient funnel",
  );
  const dropoffAction = KpiTargets.samePageSection(
    "/admin/conversion-intelligence",
    active,
    "ci-dropoffs",
    "Open exits & drop-offs",
  );
  const opportunityAction = KpiTargets.samePageSection(
    "/admin/conversion-intelligence",
    active,
    "ci-opportunities",
    "Open weak booking paths",
  );

  return (
    <main>
      <InsightsFilterSync filters={active} />
      <DashboardHeader
        title="Booking journey"
        description="Follow the patient path from visit to booking or call. The bottleneck step is where most people drop off — fix that first."
        actions={
          <ExportActions
            csvHref={`/api/admin/exports/conversion-intelligence?format=csv&range=${range}&data=${mode}`}
          />
        }
        meta={
          <>
            {report.start} → {report.end} · {loaded.feedLabel}
          </>
        }
      />

      <div className="mt-6 space-y-3">
        <InsightsNav current="conversion-intelligence" filters={active} />
        <DataModeBanner mode={mode} feedLabel={loaded.feedLabel} />
        <HowToReadDashboard dashboard="conversion-intelligence" />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <RangeTabs
            options={conversionIntelligenceRangeOptions()}
            active={range}
            hrefFor={(value) =>
              withInsightsQuery("/admin/conversion-intelligence", {
                ...active,
                range: value as ExecutiveRange,
              })
            }
          />
          <div className="flex flex-wrap items-center gap-3">
            <HealthStatusLegend />
            <DataModeSwitcher path="/admin/conversion-intelligence" filters={active} active={mode} />
          </div>
        </div>
        <InsightsInvestigationBanner
          filters={active}
          pathname="/admin/conversion-intelligence"
          counts={{
            focusTitle: focused
              ? practitionerFocus || serviceFocus || undefined
              : practitionerFocus
                ? `No practitioner matched “${practitionerFocus}”`
                : serviceFocus
                  ? `No service matched “${serviceFocus}”`
                  : undefined,
          }}
        />
        <div className="grid gap-3 sm:grid-cols-3">
          <MetricTile
            label="Funnel bottleneck"
            value={bottleneck?.label ?? "None"}
            hint={
              bottleneck?.drop_from_previous != null
                ? `${bottleneck.drop_from_previous}% drop from the previous step`
                : "Largest relative drop in the patient journey"
            }
            href={funnelAction.href}
            hrefLabel={funnelAction.label}
          />
          <MetricTile
            label="Exits to investigate"
            value={formatCount(report.highest_exit_pages.length)}
            hint="Pages where non-booking sessions leave"
            href={dropoffAction.href}
            hrefLabel={dropoffAction.label}
          />
          <MetricTile
            label="Weak booking paths"
            value={formatCount(opportunityCount)}
            hint="High-volume paths converting at ≤25%"
            href={opportunityAction.href}
            hrefLabel={opportunityAction.label}
          />
        </div>
      </div>

      <SectionShell
        id="ci-funnel"
        title="Funnel"
        description="Visitor → Search → Service → Practitioner → Booking. The largest relative drop is highlighted as the bottleneck."
      >
        <ConversionFunnelChart steps={report.funnel} filters={active} />
      </SectionShell>

      <SectionShell
        id="ci-dropoffs"
        title="Exits & abandonment"
        description="Where non-booking sessions leave, and how far they got before dropping out."
      >
        <RankingGrid columns={2}>
          <ExitChart rows={report.highest_exit_pages} />
          <AbandonmentChart rows={report.highest_abandonment_journeys} />
        </RankingGrid>
      </SectionShell>

      <SectionShell
        id="ci-best"
        title="Best conversion performers"
        description="Highest booking conversion among practitioners, services, and entry pages (minimum 2 sessions)."
      >
        <RankingGrid>
          <PerformerChart
            title="Practitioners"
            hint="Sessions that touched a practitioner and reached booking · open Practitioner Authority"
            rows={filterByKey(report.highest_converting_practitioners, practitionerFocus)}
            tone="best"
            hrefFor={(key) =>
              practitionerAuthorityHref({
                range,
                focus: key,
                filters: { ...active, practitioner: key },
              })
            }
          />
          <PerformerChart
            title="Services"
            hint="Sessions that touched a service and reached booking · open Service Authority"
            rows={filterByKey(report.highest_converting_services, serviceFocus)}
            tone="best"
            hrefFor={(key) =>
              serviceAuthorityHref({
                range,
                focus: key,
                filters: { ...active, service: key },
              })
            }
          />
          <PerformerChart
            title="Entry pages"
            hint="First page in session → booking"
            rows={report.highest_converting_entry_pages}
            tone="best"
          />
        </RankingGrid>
      </SectionShell>

      <SectionShell
        id="ci-worst"
        title="Worst conversion performers"
        description="Lowest booking conversion among practitioners, services, and entry pages (minimum 2 sessions)."
      >
        <RankingGrid>
          <PerformerChart
            title="Practitioners"
            hint="High volume or weak booking rate relative to peers · open Practitioner Authority"
            rows={filterByKey(report.lowest_converting_practitioners, practitionerFocus)}
            tone="worst"
            hrefFor={(key) =>
              practitionerAuthorityHref({
                range,
                focus: key,
                filters: { ...active, practitioner: key },
              })
            }
          />
          <PerformerChart
            title="Services"
            hint="Service sessions rarely reach booking · open Service Authority"
            rows={filterByKey(report.lowest_converting_services, serviceFocus)}
            tone="worst"
            hrefFor={(key) =>
              serviceAuthorityHref({
                range,
                focus: key,
                filters: { ...active, service: key },
              })
            }
          />
          <PerformerChart
            title="Entry pages"
            hint="Entry paths with weak booking conversion"
            rows={report.lowest_converting_entry_pages}
            tone="worst"
          />
        </RankingGrid>
      </SectionShell>

      <SectionShell
        id="ci-opportunities"
        title="Action opportunities"
        description="High-volume paths with booking conversion at or below 25% — investigate these next."
      >
        <RankingGrid>
          <OpportunityPanel
            title="Weak booking paths"
            rows={report.opportunities.weak_booking_paths}
            hrefFor={() =>
              withInsightsQuery("/admin/conversion-intelligence", active, { hash: "ci-dropoffs" })
            }
          />
          <OpportunityPanel
            title="Weak service journeys"
            rows={filterByKey(report.opportunities.weak_service_journeys, serviceFocus)}
            hrefFor={(key) =>
              serviceAuthorityHref({
                range,
                focus: key,
                filters: { ...active, service: key },
              })
            }
          />
          <OpportunityPanel
            title="Weak practitioner journeys"
            rows={filterByKey(report.opportunities.weak_practitioner_journeys, practitionerFocus)}
            hrefFor={(key) =>
              practitionerAuthorityHref({
                range,
                focus: key,
                filters: { ...active, practitioner: key },
              })
            }
          />
        </RankingGrid>
      </SectionShell>

      <p className="mt-8 text-xs text-slate-500">
        Generated {new Date(report.generated_at).toLocaleString("en-AU", { timeZone: "Australia/Brisbane" })} ·
        measurement 2G · session-attributed funnel · debug queries remain local for {report.privacy.ttl_days} days ·{" "}
        <Link href="/admin/executive" className="underline underline-offset-2 hover:text-slate-800">
          Executive Dashboard
        </Link>
      </p>
    </main>
  );
}
