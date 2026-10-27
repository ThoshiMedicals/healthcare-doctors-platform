import Link from "next/link";
import { requireAction } from "@/cms/context";
import {
  buildPracticeExecutiveDashboard,
  executiveRangeOptions,
} from "@/measurement/executive-report";
import {
  EXECUTIVE_RANGE_LABEL,
  isExecutiveRange,
  type ExecutiveRange,
} from "@/measurement/ranges";
import {
  DashboardCard,
  DashboardHeader,
  DashboardMeta,
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
  StatusBadge,
  digitalReceptionHref,
  getMetricGuide,
  healthFromValue,
  KpiInfoReasons,
  KpiTargets,
  METRIC_HEALTH_LABEL,
  METRIC_HEALTH_TONE,
  practitionerAuthorityHref,
  serviceAuthorityHref,
  withInsightsQuery,
} from "../dashboard-ui";
import { resolveInsightsDashboardData } from "../dashboard-ui/resolve-insights-data";
import { resolveInsightsFilters } from "../dashboard-ui/resolve-insights-filters";
import {
  MetricCard,
  PlacementBars,
  RankList,
  SectionShell,
  SeriesChart,
  TrendBadge,
  formatCount,
  formatRate,
} from "./visuals";

export const dynamic = "force-dynamic";

export default async function ExecutiveDashboardPage({
  searchParams,
}: {
  searchParams?: Promise<{
    range?: string;
    data?: string;
    practitioner?: string;
    service?: string;
    queue?: string;
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
  const report = buildPracticeExecutiveDashboard(loaded.events, range);
  const exportQs = `format=csv&range=${range}&data=${mode}`;

  return (
    <main>
      <InsightsFilterSync filters={active} />
      <DashboardHeader
        title="Website overview"
        description="See how many people visit the clinic website, and how many book or call — designed for practice managers, not technical analysts."
        actions={
          <ExportActions
            csvHref={`/api/admin/exports/executive?${exportQs}`}
            pdfHref={`/api/admin/exports/executive?format=pdf&range=${range}&data=${mode}`}
            monthlyHref={withInsightsQuery("/admin/executive/monthly", active)}
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
        <InsightsNav current="executive" filters={active} />
        <DataModeBanner mode={mode} feedLabel={loaded.feedLabel} />
        <HowToReadDashboard dashboard="executive" />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <RangeTabs
            options={executiveRangeOptions()}
            active={range}
            hrefFor={(value) => withInsightsQuery("/admin/executive", { ...active, range: value as ExecutiveRange })}
          />
          <div className="flex flex-wrap items-center gap-3">
            <HealthStatusLegend />
            <DataModeSwitcher path="/admin/executive" filters={active} active={mode} />
          </div>
        </div>
        <InsightsInvestigationBanner filters={active} pathname="/admin/executive" />
      </div>

      <SectionShell
        id="exec-performance"
        title="How the website is performing"
        description={`Headline patient interest for ${EXECUTIVE_RANGE_LABEL[range]} — visits first, then whether they book or call.`}
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label={getMetricGuide("executive", "traffic")!.label}
            value={formatCount(report.kpis.traffic)}
            hint={getMetricGuide("executive", "traffic")!.meaning}
            trend={report.trends.traffic}
            href={KpiTargets.executivePatients(active).href}
            hrefLabel={KpiTargets.executivePatients(active).label}
          />
          <MetricCard
            label={getMetricGuide("executive", "sessions")!.label}
            value={formatCount(report.kpis.sessions)}
            hint={getMetricGuide("executive", "sessions")!.meaning}
            trend={report.trends.sessions}
            informational
            informationalReason={KpiInfoReasons.volumeContext}
          />
          <MetricCard
            label={getMetricGuide("executive", "contact_rate")!.label}
            value={formatRate(report.rates.find((card) => card.key === "contact_rate")?.value ?? null)}
            explain={getMetricGuide("executive", "contact_rate")!.meaning}
            target={getMetricGuide("executive", "contact_rate")!.target}
            trend={report.trends.contact_rate}
            statusBadge={(() => {
              const rate = report.rates.find((card) => card.key === "contact_rate")?.value ?? null;
              const guide = getMetricGuide("executive", "contact_rate")!;
              const health = healthFromValue(rate, guide.thresholds);
              return (
                <StatusBadge
                  label={METRIC_HEALTH_LABEL[health]}
                  tone={METRIC_HEALTH_TONE[health]}
                />
              );
            })()}
            href={KpiTargets.bookingJourney(active).href}
            hrefLabel={KpiTargets.bookingJourney(active).label}
          />
          <MetricCard
            label={getMetricGuide("executive", "booking_intent")!.label}
            value={formatRate(report.rates.find((card) => card.key === "booking_intent_rate")?.value ?? null)}
            hint={getMetricGuide("executive", "booking_intent")!.meaning}
            trend={report.rates.find((card) => card.key === "booking_intent_rate")!.trend}
            href={KpiTargets.bookingJourney(active).href}
            hrefLabel={KpiTargets.bookingJourney(active).label}
          />
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <SeriesChart title="Daily traffic" series={report.series} valueKey="traffic" accent="#0f172a" />
          <SeriesChart
            title="Contact rate"
            series={report.series}
            valueKey="contact_rate"
            formatValue={(value) => `${value.toFixed(1)}%`}
            accent="#0369a1"
          />
        </div>
      </SectionShell>

      <SectionShell
        id="exec-patients"
        title="Patients"
        description="Where patients spend attention across pages, services, and practitioners."
      >
        <RankingGrid>
          <div>
            <h3 className="mb-2 text-sm font-semibold text-slate-800">Top pages</h3>
            <RankList rows={report.top_pages} empty="No traffic in this range." />
          </div>
          <div>
            <h3 className="mb-2 text-sm font-semibold text-slate-800">Top services</h3>
            <RankList
              rows={report.top_services}
              empty="No service traffic in this range."
              hrefHint="Open Service Authority filtered to this service"
              hrefFor={(key) => serviceAuthorityHref({ range, focus: key })}
            />
          </div>
          <div>
            <h3 className="mb-2 text-sm font-semibold text-slate-800">Top practitioners</h3>
            <RankList
              rows={report.top_practitioners}
              empty="No practitioner traffic in this range."
              hrefHint="Open Practitioner Authority filtered to this practitioner"
              hrefFor={(key) => practitionerAuthorityHref({ range, focus: key })}
            />
          </div>
        </RankingGrid>
      </SectionShell>

      <SectionShell
        id="exec-bookings"
        title="Bookings"
        description="HotDoc booking intent and where booking controls are used."
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <MetricCard
            label={getMetricGuide("executive", "booking_clicks")!.label}
            value={formatCount(report.kpis.booking_clicks)}
            hint={getMetricGuide("executive", "booking_clicks")!.meaning}
            trend={report.trends.booking_clicks}
            href={KpiTargets.bookingJourney(active).href}
            hrefLabel={KpiTargets.bookingJourney(active).label}
          />
          <MetricCard
            label={getMetricGuide("executive", "booking_intent")!.label}
            value={formatRate(report.rates.find((card) => card.key === "booking_intent_rate")?.value ?? null)}
            hint={getMetricGuide("executive", "booking_intent")!.target}
            trend={report.rates.find((card) => card.key === "booking_intent_rate")!.trend}
            href={KpiTargets.bookingJourney(active).href}
            hrefLabel={KpiTargets.bookingJourney(active).label}
          />
          <MetricCard
            label="Search-assisted bookings"
            value={formatRate(
              report.booking_placement_mix.find((row) => row.placement === "digital_reception")?.share ?? 0,
            )}
            hint="Share of booking clicks that started from online search / reception"
            href={KpiTargets.searchFunnel(active).href}
            hrefLabel={KpiTargets.searchFunnel(active).label}
          />
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <SeriesChart
            title="Booking clicks"
            series={report.series}
            valueKey="booking_clicks"
            accent="#166534"
          />
          <DashboardCard>
            <h3 className="text-sm font-semibold text-slate-900">Booking placement mix</h3>
            <p className="mt-0.5 text-xs text-slate-500">Share of booking clicks by control placement</p>
            <div className="mt-4">
              <PlacementBars rows={report.booking_placement_mix} />
            </div>
          </DashboardCard>
        </div>
      </SectionShell>

      <SectionShell
        id="exec-calls"
        title="Calls"
        description="Clinic call intent from the website — (07) 3217 3344."
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <MetricCard
            label={getMetricGuide("executive", "clinic_calls")!.label}
            value={formatCount(report.kpis.clinic_calls)}
            explain={getMetricGuide("executive", "clinic_calls")!.meaning}
            hint="Call clinic clicks"
            trend={report.trends.clinic_calls}
            href={KpiTargets.bookingJourney(active, "ci-funnel").href}
            hrefLabel="Investigate call & booking journey"
          />
          <MetricCard
            label="Call intent rate"
            value={formatRate(report.rates.find((card) => card.key === "call_intent_rate")?.value ?? null)}
            hint="Clinic calls ÷ sessions"
            trend={report.rates.find((card) => card.key === "call_intent_rate")!.trend}
            href={KpiTargets.bookingJourney(active).href}
            hrefLabel={KpiTargets.bookingJourney(active).label}
          />
          <MetricCard
            label="Contact actions"
            value={formatCount(report.kpis.booking_clicks + report.kpis.clinic_calls)}
            hint="Bookings + calls combined"
            trend={report.trends.contact_actions}
            href={KpiTargets.bookingJourney(active).href}
            hrefLabel={KpiTargets.bookingJourney(active).label}
          />
        </div>
        <div className="mt-4">
          <SeriesChart title="Call clicks" series={report.series} valueKey="call_clicks" accent="#9a3412" />
        </div>
      </SectionShell>

      <SectionShell
        id="exec-digital-reception"
        title="Digital Reception"
        description="Assistant usage feeding patient journeys and booking outcomes."
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Reception opens"
            value={formatCount(report.digital_reception.opens)}
            hint="Online reception opened"
            trend={report.digital_reception.trends.opens}
            href={KpiTargets.searchFunnel(active).href}
            hrefLabel={KpiTargets.searchFunnel(active).label}
          />
          <MetricCard
            label="Searches"
            value={formatCount(report.digital_reception.searches)}
            hint="Patient searches in online reception"
            trend={report.digital_reception.trends.searches}
            href={KpiTargets.searchQuality(active, "dr-charts").href}
            hrefLabel="Open search topics"
          />
          <MetricCard
            label="Useful result clicks"
            value={formatCount(report.digital_reception.result_clicks)}
            hint="Searches that chose a next step"
            trend={report.digital_reception.trends.result_clicks}
            href={KpiTargets.searchQuality(active).href}
            hrefLabel={KpiTargets.searchQuality(active).label}
          />
          <MetricCard
            label="Bookings from search"
            value={formatCount(report.digital_reception.booking_clicks)}
            hint="Bookings attributed to online reception"
            trend={report.digital_reception.trends.booking_clicks}
            href={KpiTargets.bookingJourney(active).href}
            hrefLabel={KpiTargets.bookingJourney(active).label}
          />
        </div>
        <DashboardCard className="mt-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Clinic calls from Digital Reception</h3>
              <p className="mt-0.5 text-xs text-slate-500">Call intent attributed to Digital Reception placement</p>
            </div>
            <div className="flex items-center gap-3">
              <p className="text-2xl font-semibold tabular-nums">
                {formatCount(report.digital_reception.clinic_calls)}
              </p>
              <TrendBadge trend={report.digital_reception.trends.clinic_calls} />
            </div>
          </div>
          <p className="mt-3 text-sm text-slate-600">
            <Link
              href={digitalReceptionHref(range)}
              className="underline underline-offset-2 hover:text-slate-900"
            >
              Open Digital Reception dashboard
            </Link>{" "}
            for funnel, watchlist, and resolution detail.
          </p>
        </DashboardCard>
      </SectionShell>

      <DashboardMeta>
        Generated {new Date(report.generated_at).toLocaleString("en-AU", { timeZone: "Australia/Brisbane" })} ·
        measurement 2G · trends compare equal-length prior window · search dashboards keep intent bucket / result type /
        result count only · debug queries remain local for {report.privacy.ttl_days} days
      </DashboardMeta>
    </main>
  );
}
