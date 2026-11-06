import Link from "next/link";
import { requireAction } from "@/cms/context";
import { prisma } from "@/db/prisma";
import {
  buildSearchOpportunityDashboard,
  searchOpportunityRangeOptions,
} from "@/measurement/search-opportunity-report";
import { isExecutiveRange, type ExecutiveRange } from "@/measurement/ranges";
import {
  DashboardHeader,
  DashboardMeta,
  DataModeBanner,
  DataModeSwitcher,
  HowToReadDashboard,
  InsightsFilterSync,
  InsightsNav,
  MetricTile,
  RangeTabs,
  SectionShell,
  insightsRangeHref,
  withInsightsQuery,
} from "../dashboard-ui";
import { resolveInsightsDashboardData } from "../dashboard-ui/resolve-insights-data";
import { resolveInsightsFilters } from "../dashboard-ui/resolve-insights-filters";

export const dynamic = "force-dynamic";

function trendLabel(trend: string) {
  if (trend === "rising") return "Rising";
  if (trend === "declining") return "Declining";
  if (trend === "new") return "New";
  return "Steady";
}

export default async function SearchOpportunitiesPage({
  searchParams,
}: {
  searchParams?: Promise<{ range?: string; data?: string }>;
}) {
  const { clinic } = await requireAction("manage_settings");
  const params = searchParams ? await searchParams : {};
  const baseFilters = await resolveInsightsFilters(params, "/admin/search-opportunities");
  const range: ExecutiveRange =
    baseFilters.range && isExecutiveRange(baseFilters.range) ? baseFilters.range : "last_7";
  const { mode, filters: active, loaded } = await resolveInsightsDashboardData({
    ...baseFilters,
    range,
  });

  const [signals, reviews] = await Promise.all([
    prisma.searchDemandSignal.findMany({
      where: { clinicId: clinic.id },
      orderBy: { occurredAt: "desc" },
      take: 5000,
    }),
    prisma.clinicalReview.findMany({
      where: { clinicId: clinic.id },
      include: { page: { select: { path: true, title: true, updatedAt: true } } },
    }),
  ]);

  const report = buildSearchOpportunityDashboard({
    signals,
    events: loaded.events,
    reviews,
    range,
    preferDemoWhenEmpty: mode !== "live" || signals.length === 0,
  });

  return (
    <main>
      <InsightsFilterSync filters={active} />
      <DashboardHeader
        title="Search & content opportunities"
        description="Use real patient demand from Digital Reception to spot missing service pages, health advice, practitioner authority gaps, and booking journeys — not SEO vanity scores."
        meta={
          <>
            {report.start} → {report.end} · {loaded.feedLabel} · signal source {report.source.replaceAll("_", " ")}
          </>
        }
      />

      <div className="mt-6 space-y-3">
        <InsightsNav current="search-opportunities" filters={active} />
        <DataModeBanner mode={mode} feedLabel={loaded.feedLabel} />
        <HowToReadDashboard dashboard="search-opportunities" />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <RangeTabs
            options={searchOpportunityRangeOptions()}
            active={range}
            hrefFor={(value) =>
              insightsRangeHref("/admin/search-opportunities", active, value as ExecutiveRange)
            }
          />
          <DataModeSwitcher path="/admin/search-opportunities" filters={active} active={mode} />
        </div>
        <p className="max-w-3xl text-xs text-slate-500">{report.privacy}</p>
      </div>

      <SectionShell
        id="sco-kpis"
        title="Demand snapshot"
        description="Top searches and content gaps for practice planning."
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <MetricTile label="Top search volume" value={String(report.kpis.searches)} hint="Normalised search events" />
          <MetricTile
            label="No-result searches"
            value={String(report.kpis.no_result_searches)}
            hint="Demand without a useful match"
          />
          <MetricTile label="Unique terms" value={String(report.kpis.unique_terms)} hint="Distinct patient asks" />
          <MetricTile
            label="Opportunity queue"
            value={String(report.kpis.opportunity_queue)}
            hint="High score content gaps"
          />
          <MetricTile
            label="Pages due for review"
            value={String(report.kpis.pages_due_for_review)}
            hint="Freshness / governance"
          />
        </div>
      </SectionShell>

      <SectionShell
        id="sco-freshness"
        title="Content freshness"
        description="Needs review, overdue, and recently updated pages from clinical review dates."
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricTile label="Needs review" value={String(report.freshness.needs_review)} hint="Due within 60 days" />
          <MetricTile label="Review overdue" value={String(report.freshness.review_overdue)} hint="Past next-review date" />
          <MetricTile label="Recently updated" value={String(report.freshness.recently_updated)} hint="Last 30 days" />
          <MetricTile label="Current" value={String(report.freshness.current)} hint="Within review horizon" />
        </div>
        <ul className="mt-4 divide-y divide-slate-200 rounded border border-slate-200 bg-white">
          {report.pages_due_for_review.length === 0 ? (
            <li className="px-4 py-3 text-sm text-slate-600">No pages currently due for review.</li>
          ) : (
            report.pages_due_for_review.map((row) => (
              <li key={row.path} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
                <span>
                  <span className="font-medium">{row.title}</span>
                  <span className="mt-0.5 block text-slate-500">{row.path}</span>
                </span>
                <span className="text-slate-600">
                  {row.bucket === "overdue" ? "Overdue" : "Due soon"}
                  {row.daysRemaining !== null ? ` · ${row.daysRemaining}d` : ""}
                </span>
              </li>
            ))
          )}
        </ul>
        <p className="mt-2 text-sm">
          <Link className="underline" href="/admin/governance/expiry">
            Open review due dates →
          </Link>
        </p>
      </SectionShell>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <SectionShell id="sco-top" title="Top searches" description="Highest volume normalised terms.">
          <TermTable rows={report.top_searches} />
        </SectionShell>
        <SectionShell id="sco-noresult" title="No-result searches" description="Demand with no useful coverage.">
          <TermTable rows={report.no_result_searches} showNoResults />
        </SectionShell>
        <SectionShell id="sco-rising" title="Rising searches" description="Up ≥25% vs prior equal window.">
          <TermTable rows={report.rising_searches} />
        </SectionShell>
        <SectionShell id="sco-declining" title="Declining searches" description="Down ≥25% vs prior equal window.">
          <TermTable rows={report.declining_searches} />
        </SectionShell>
      </div>

      <SectionShell
        id="sco-queue"
        title="Opportunity queue"
        description="Opportunity Score blends demand volume, no-result rate, weak click-through, and rising trend. Labels: High Demand, Low Coverage, Weak Journey."
      >
        <TermTable rows={report.opportunity_queue} showScore showLabel />
      </SectionShell>

      <SectionShell
        id="sco-alerts"
        title="Content gap alerts"
        description="Combined queue from search gaps, weak Digital Reception intents, and pages due for review."
      >
        <ul className="divide-y divide-slate-200 rounded border border-slate-200 bg-white">
          {report.content_gap_alerts.map((alert) => (
            <li key={alert.key}>
              <Link href={alert.href} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm hover:bg-slate-50">
                <span>
                  <span className="font-medium">{alert.title}</span>
                  <span className="mt-0.5 block text-slate-500">{alert.detail}</span>
                </span>
                <span className="font-medium text-slate-700">{alert.score}</span>
              </Link>
            </li>
          ))}
        </ul>
      </SectionShell>

      <SectionShell
        id="sco-practitioners"
        title="Practitioner opportunities"
        description="Most searched topics linked to practitioners, with gaps where demand exceeds coverage."
      >
        <ul className="divide-y divide-slate-200 rounded border border-slate-200 bg-white">
          {report.practitioner_opportunities.length === 0 ? (
            <li className="px-4 py-3 text-sm text-slate-600">No practitioner-linked demand in this range yet.</li>
          ) : (
            report.practitioner_opportunities.map((row) => (
              <li key={row.practitioner} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
                <span>
                  <span className="font-medium">{row.practitioner}</span>
                  <span className="mt-0.5 block text-slate-500">{row.top_terms.join(" · ") || "No topic terms"}</span>
                </span>
                <span className="text-right text-slate-600">
                  <span className="block font-medium text-slate-800">Gap {row.gap_score}</span>
                  <span className="block">
                    {row.searches} searches · {row.no_results} no-result
                  </span>
                </span>
              </li>
            ))
          )}
        </ul>
        <p className="mt-2 text-sm">
          <Link
            className="underline"
            href={withInsightsQuery("/admin/practitioner-authority", { range, data: active.data })}
          >
            Open doctor profile authority →
          </Link>
        </p>
      </SectionShell>

      <DashboardMeta>
        Built for practice content operations. No AI-generated page copy. No ranking vanity metrics.
      </DashboardMeta>
    </main>
  );
}

function TermTable({
  rows,
  showNoResults = false,
  showScore = false,
  showLabel = false,
}: {
  rows: Array<{
    term: string;
    searches: number;
    no_results: number;
    clicks: number;
    trend: string;
    opportunity_score: number;
    opportunity_label: string;
  }>;
  showNoResults?: boolean;
  showScore?: boolean;
  showLabel?: boolean;
}) {
  if (rows.length === 0) {
    return <p className="rounded border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">No rows in this range.</p>;
  }
  return (
    <ul className="divide-y divide-slate-200 rounded border border-slate-200 bg-white">
      {rows.map((row) => (
        <li key={row.term} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
          <span>
            <span className="font-medium">{row.term}</span>
            <span className="mt-0.5 block text-slate-500">
              {trendLabel(row.trend)}
              {showLabel ? ` · ${row.opportunity_label}` : ""}
              {showNoResults ? ` · ${row.no_results} no-result` : ""}
              {` · ${row.clicks} clicks`}
            </span>
          </span>
          <span className="text-right text-slate-700">
            <span className="block font-medium">{row.searches}</span>
            {showScore ? <span className="block text-xs text-slate-500">Score {row.opportunity_score}</span> : null}
          </span>
        </li>
      ))}
    </ul>
  );
}
