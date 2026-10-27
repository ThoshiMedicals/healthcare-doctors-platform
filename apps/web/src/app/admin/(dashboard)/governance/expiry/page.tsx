import Link from "next/link";
import { requireAction } from "@/cms/context";
import { publicPageName } from "@/cms/staff-labels";
import { prisma } from "@/db/prisma";
import { buildGovernanceExpiryReport, type GovernanceExpiryBucket } from "@/governance/expiry-report";
import { resolveGovernanceDataset } from "@/measurement/demo/load-governance-dataset";
import { parseInsightsDataMode } from "@/measurement/insights-data-mode";
import {
  DashboardCard,
  DashboardHeader,
  DashboardMeta,
  DataModeBanner,
  DataModeSwitcher,
  EmptyState,
  HowToReadDashboard,
  InsightsFilterSync,
  InsightsNav,
  ProgressBar,
  StackedBar,
  StatusBadge,
  formatCount,
  governanceManagementHref,
  governanceReviewHref,
  type DashboardTone,
  type GovernanceQueue,
} from "../../dashboard-ui";
import { resolveInsightsFilters } from "../../dashboard-ui/resolve-insights-filters";

const BUCKET_QUEUE: Partial<Record<GovernanceExpiryBucket, GovernanceQueue>> = {
  overdue: "expired",
  due_within_horizon: "due_soon",
  hidden_until_approved: "awaiting_review",
};

export const dynamic = "force-dynamic";

const BUCKET_META: Record<GovernanceExpiryBucket, { label: string; tone: DashboardTone }> = {
  overdue: { label: "Expired", tone: "bad" },
  due_within_horizon: { label: "Due Soon", tone: "warn" },
  current: { label: "Current", tone: "good" },
  hidden_until_approved: { label: "Awaiting Review", tone: "info" },
};

export default async function GovernanceExpiryPage({
  searchParams,
}: {
  searchParams?: Promise<{ data?: string; queue?: string; range?: string }>;
}) {
  const { clinic } = await requireAction("clinical_signoff");
  const params = searchParams ? await searchParams : {};
  const filters = await resolveInsightsFilters(params, "/admin/governance/expiry");
  const liveRows = await prisma.clinicalReview.findMany({
    where: { clinicId: clinic.id },
    include: { page: { select: { path: true, title: true } } },
  });
  const mode =
    parseInsightsDataMode(filters.data) ?? (liveRows.length > 0 ? "live" : "demo");
  const active = { ...filters, data: mode };
  const dataset = resolveGovernanceDataset(mode, liveRows);
  const report = buildGovernanceExpiryReport(dataset.rows, 60);
  const total = report.counts.total || 1;
  const chartBuckets: GovernanceExpiryBucket[] = [
    "overdue",
    "due_within_horizon",
    "current",
    "hidden_until_approved",
  ];

  return (
    <main>
      <InsightsFilterSync filters={active} />
      <DashboardHeader
        title="Review due dates"
        description="See which pages are overdue, due soon, or still waiting for approval — then jump into the matching work queue."
        actions={
          <>
            <Link href={governanceManagementHref({ filters: active })} className="text-slate-600 underline">
              Content review board
            </Link>
            <Link href={governanceReviewHref()} className="text-slate-600 underline">
              Back to governance review
            </Link>
          </>
        }
      />

      <div className="mt-6 space-y-3">
        <InsightsNav current="governance-expiry" filters={active} />
        <DataModeBanner mode={mode} feedLabel={dataset.feedLabel} />
        <HowToReadDashboard dashboard="governance-expiry" />
        <DataModeSwitcher path="/admin/governance/expiry" filters={active} active={mode} />
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {chartBuckets.map((bucket) => {
          const meta = BUCKET_META[bucket];
          const value = report.counts[bucket];
          const pct = Math.min(100, (value / total) * 100);
          const queue = BUCKET_QUEUE[bucket];
          const card = (
            <DashboardCard className={queue ? "transition group-hover:border-slate-400 group-hover:shadow" : undefined}>
              <StatusBadge label={meta.label} tone={meta.tone} />
              <p className="mt-3 text-3xl font-semibold tabular-nums">{formatCount(value)}</p>
              <div className="mt-3">
                <ProgressBar value={pct} tone={meta.tone} />
              </div>
              <p className="mt-1 text-[11px] tabular-nums text-slate-400">
                {pct.toFixed(0)}% of {formatCount(report.counts.total)} reviews
              </p>
              {queue ? (
                <p className="mt-2 text-xs font-medium text-slate-700 underline-offset-2 group-hover:underline">
                  Open governance queue →
                </p>
              ) : null}
            </DashboardCard>
          );
          return queue ? (
            <Link
              key={bucket}
              href={governanceManagementHref({ queue })}
              className="group block rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
              aria-label={`${meta.label}: ${value}. Open governance queue`}
            >
              {card}
            </Link>
          ) : (
            <div key={bucket}>{card}</div>
          );
        })}
      </div>

      <section className="mt-8" aria-labelledby="ge-chart">
        <h2 id="ge-chart" className="text-lg font-semibold">
          Expiry distribution
        </h2>
        <DashboardCard className="mt-3">
          {report.counts.total === 0 ? (
            <EmptyState
              title="No reviews yet"
              message="Clinical review records will appear here once pages are under governance."
            />
          ) : (
            <>
              <StackedBar
                className="h-4"
                slices={chartBuckets.map((bucket) => ({
                  key: bucket,
                  value: report.counts[bucket],
                  tone: BUCKET_META[bucket].tone,
                  title: `${BUCKET_META[bucket].label}: ${report.counts[bucket]}`,
                }))}
              />
              <div className="mt-3 flex flex-wrap gap-2">
                {chartBuckets.map((bucket) => (
                  <StatusBadge
                    key={`legend-${bucket}`}
                    label={BUCKET_META[bucket].label}
                    tone={BUCKET_META[bucket].tone}
                    count={report.counts[bucket]}
                  />
                ))}
              </div>
            </>
          )}
        </DashboardCard>
      </section>

      <DashboardMeta>
        Generated for {report.generatedOn} · horizon {report.horizonDays} days
      </DashboardMeta>

      {report.rows.length === 0 ? (
        <EmptyState
          title="No review rows"
          message="There are no clinical reviews to list for this clinic."
          className="mt-6"
        />
      ) : (
        <ul className="mt-6 divide-y divide-slate-100 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          {report.rows.map((row) => {
            const meta = BUCKET_META[row.bucket];
            return (
              <li
                key={row.id}
                className="flex flex-col gap-3 px-4 py-3 text-sm sm:flex-row sm:flex-wrap sm:items-start sm:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/admin/governance/${row.id}`} className="font-medium hover:underline">
                      {publicPageName(row.path)}
                    </Link>
                    <StatusBadge label={meta.label} tone={meta.tone} />
                  </div>
                  <p className="mt-1 text-slate-500">
                    {row.nextReviewDue ? `Next Review Due ${row.nextReviewDue}` : "No next review date"}
                    {row.daysRemaining !== null ? ` · ${row.daysRemaining} days` : ""}
                    {row.publicVisible ? " · public fields eligible" : " · public fields hidden"}
                  </p>
                  {row.daysRemaining !== null ? (
                    <div className="mt-2 max-w-xs">
                      <ProgressBar
                        value={
                          row.bucket === "overdue"
                            ? 100
                            : Math.max(0, 100 - (row.daysRemaining / Math.max(report.horizonDays, 1)) * 100)
                        }
                        tone={meta.tone}
                        className="h-1.5"
                      />
                    </div>
                  ) : null}
                </div>
                <div className="text-left text-slate-500 sm:text-right">
                  <div>{row.status.replaceAll("_", " ")}</div>
                  <div>{row.contentOwner || "Content Owner unset"}</div>
                  <div>{row.reviewedBy || "Reviewed By unset"}</div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
