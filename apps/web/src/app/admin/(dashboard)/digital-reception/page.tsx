import Link from "next/link";
import { requireAction } from "@/cms/context";
import {
  buildPracticeDigitalReceptionDashboard,
  digitalReceptionRangeOptions,
} from "@/measurement/digital-reception-report";
import { isExecutiveRange, type ExecutiveRange } from "@/measurement/ranges";
import {
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
  MetricTile,
  RangeTabs,
  getMetricGuide,
  KpiTargets,
  matchFocusKey,
  RESOLUTION_BAND_FRIENDLY,
  withInsightsQuery,
} from "../dashboard-ui";
import { resolveInsightsDashboardData } from "../dashboard-ui/resolve-insights-data";
import { resolveInsightsFilters } from "../dashboard-ui/resolve-insights-filters";
import {
  DestinationBars,
  FlaggedIntentPanel,
  FunnelChart,
  IntentBars,
  Legend,
  ResolutionGauge,
  SectionShell,
  WatchlistCards,
  formatCount,
  formatIntent,
} from "./visuals";

export const dynamic = "force-dynamic";

export default async function DigitalReceptionDashboardPage({
  searchParams,
}: {
  searchParams?: Promise<{
    range?: string;
    practitioner?: string;
    service?: string;
    queue?: string;
    data?: string;
    health?: string;
    intent?: string;
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
  const report = buildPracticeDigitalReceptionDashboard(loaded.events, range);
  const serviceFocus = active.service;
  const intentFocus = active.intent ?? null;
  const destinations = serviceFocus
    ? report.top_search_destinations.filter((row) => matchFocusKey(row.key, serviceFocus))
    : report.top_search_destinations;
  const destinationRows = destinations.length ? destinations : report.top_search_destinations;

  return (
    <main>
      <InsightsFilterSync filters={active} />
      <DashboardHeader
        title="Online reception & search"
        description="When patients search on the website, do they find a useful next step? Built for reception and practice managers — no technical background needed."
        actions={
          <ExportActions
            csvHref={`/api/admin/exports/digital-reception?format=csv&range=${range}&data=${mode}`}
          />
        }
        meta={
          <>
            {report.start} → {report.end} · {loaded.feedLabel}
          </>
        }
      />

      <div className="mt-6 space-y-3">
        <InsightsNav current="digital-reception" filters={active} />
        <DataModeBanner mode={mode} feedLabel={loaded.feedLabel} />
        <HowToReadDashboard dashboard="digital-reception" />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <RangeTabs
            options={digitalReceptionRangeOptions()}
            active={range}
            hrefFor={(value) =>
              withInsightsQuery("/admin/digital-reception", {
                ...active,
                range: value as ExecutiveRange,
              })
            }
          />
          <div className="flex flex-wrap items-center gap-3">
            <HealthStatusLegend />
            <DataModeSwitcher path="/admin/digital-reception" filters={active} active={mode} />
            <Legend />
          </div>
        </div>
        <InsightsInvestigationBanner
          filters={active}
          pathname="/admin/digital-reception"
          counts={{
            entityLabel: intentFocus ? "Intents" : serviceFocus ? "Services" : undefined,
            focusTitle: intentFocus
              ? formatIntent(intentFocus)
              : serviceFocus
                ? `Service · ${serviceFocus}`
                : undefined,
          }}
        />
      </div>

      <SectionShell
        id="dr-gauges"
        title="Is search helping patients?"
        description="Green = healthy · Amber = needs watch · Red = needs attention. Aim for search success at 70% or higher."
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <ResolutionGauge
            label={getMetricGuide("digital-reception", "resolution_rate")!.label}
            value={report.kpis.resolution_rate}
            band={report.kpis.resolution_band}
            hint={`${RESOLUTION_BAND_FRIENDLY[report.kpis.resolution_band]} · ${getMetricGuide("digital-reception", "resolution_rate")!.target} · ${formatCount(report.kpis.resolved_searches)} of ${formatCount(report.kpis.searches)} searches found a useful next step`}
            href={KpiTargets.samePageSection("/admin/digital-reception", active, "dr-flags", "Open search issues").href}
            hrefLabel="Open top search issues"
          />
          <ResolutionGauge
            label={getMetricGuide("digital-reception", "open_rate")!.label}
            value={report.kpis.open_rate}
            band={
              report.kpis.open_rate === null
                ? "unknown"
                : report.kpis.open_rate >= 40
                  ? "green"
                  : report.kpis.open_rate >= 20
                    ? "amber"
                    : "red"
            }
            hint={`${getMetricGuide("digital-reception", "open_rate")!.meaning} · ${formatCount(report.kpis.opens)} opens`}
            href={KpiTargets.samePageSection("/admin/digital-reception", active, "dr-funnel", "Open search funnel").href}
            hrefLabel="Open search funnel"
          />
          <MetricTile
            label={getMetricGuide("digital-reception", "searches")!.label}
            value={formatCount(report.kpis.searches)}
            explain={getMetricGuide("digital-reception", "searches")!.meaning}
            hint={getMetricGuide("digital-reception", "searches")!.guidance}
            href={KpiTargets.samePageSection("/admin/digital-reception", active, "dr-charts", "Open intent mix").href}
            hrefLabel="Open search topics"
          />
          <ResolutionGauge
            label={getMetricGuide("digital-reception", "zero_result_rate")!.label}
            value={report.kpis.zero_result_rate}
            band={
              report.kpis.zero_result_rate === null
                ? "unknown"
                : report.kpis.zero_result_rate <= 15
                  ? "green"
                  : report.kpis.zero_result_rate <= 30
                    ? "amber"
                    : "red"
            }
            hint={`${getMetricGuide("digital-reception", "zero_result_rate")!.target} · ${formatCount(report.kpis.zero_result_searches)} searches with no useful result`}
            href={KpiTargets.samePageSection("/admin/digital-reception", active, "dr-flags", "Open search issues").href}
            hrefLabel="Open top search issues"
          />
        </div>
      </SectionShell>

      <SectionShell
        id="dr-flags"
        title="High-volume · low-resolution"
        description="Intent buckets with strong search volume but resolution below 50% — investigate content and routing gaps first."
      >
        <FlaggedIntentPanel rows={report.flagged_intents} filters={active} focusIntent={intentFocus} />
      </SectionShell>

      <SectionShell
        id="dr-funnel"
        title="Funnel"
        description="Where journeys stall between open and clinic contact. Click a stage to investigate."
      >
        <FunnelChart steps={report.funnel} filters={active} />
      </SectionShell>

      <SectionShell
        id="dr-charts"
        title="Intent & destinations"
        description="Volume charts with green / amber / red resolution coding. Click a bar to open intent or destination investigation."
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <IntentBars rows={report.top_intent_buckets} filters={active} focusIntent={intentFocus} />
          <DestinationBars rows={destinationRows} filters={active} />
        </div>
      </SectionShell>

      <SectionShell
        id="dr-watchlist"
        title="Watchlist"
        description="Always-on intents: new patient, HotDoc message, and vaccine. Click a card for intent details."
      >
        <WatchlistCards rows={report.watchlist} filters={active} focusIntent={intentFocus} />
      </SectionShell>

      <DashboardMeta>
        Generated {new Date(report.generated_at).toLocaleString("en-AU", { timeZone: "Australia/Brisbane" })} ·
        measurement 2G · resolution bands: green ≥70%, amber 50–69%, red &lt;50% · exposed search fields: intent
        bucket, result type, result count · debug queries remain local for {report.privacy.ttl_days} days ·{" "}
        <Link href="/admin/executive" className="underline underline-offset-2 hover:text-slate-800">
          Executive Dashboard
        </Link>
      </DashboardMeta>
    </main>
  );
}
