import Link from "next/link";
import { requireAction } from "@/cms/context";
import { prisma } from "@/db/prisma";
import { buildPracticeGovernanceManagementReport } from "@/governance/management-report";
import {
  GOVERNANCE_QUEUE_LABEL,
  isGovernanceRemediationQueue,
  type GovernanceRemediationQueue,
} from "@/governance/remediation";
import { resolveGovernanceDataset } from "@/measurement/demo/load-governance-dataset";
import { parseInsightsDataMode } from "@/measurement/insights-data-mode";
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
  governanceExpiryHref,
  governanceManagementHref,
  governanceReviewHref,
} from "../../dashboard-ui";
import { resolveInsightsFilters } from "../../dashboard-ui/resolve-insights-filters";
import {
  ExpiryChart,
  Legend,
  ReviewCalendar,
  SectionShell,
  SegmentProgress,
  WorkloadCards,
  WorkloadList,
  formatCount,
} from "./visuals";

export const dynamic = "force-dynamic";

function rowsForQueue(
  report: ReturnType<typeof buildPracticeGovernanceManagementReport>,
  queue: GovernanceRemediationQueue,
) {
  if (queue === "awaiting_review") return report.pages_awaiting_review;
  if (queue === "due_soon") return report.pages_due_within_60_days;
  if (queue === "expired") return report.pages_expired;
  return report.pages_missing_ownership;
}

export default async function GovernanceManagementPage({
  searchParams,
}: {
  searchParams?: Promise<{
    queue?: string;
    practitioner?: string;
    service?: string;
    range?: string;
    data?: string;
    health?: string;
  }>;
}) {
  const { clinic } = await requireAction("clinical_signoff");
  const params = searchParams ? await searchParams : {};
  const filters = await resolveInsightsFilters(params, "/admin/governance/management");
  const queue =
    filters.queue && isGovernanceRemediationQueue(filters.queue) ? filters.queue : null;
  const liveRows = await prisma.clinicalReview.findMany({
    where: { clinicId: clinic.id },
    include: { page: { select: { path: true, title: true } } },
  });
  const mode =
    parseInsightsDataMode(filters.data) ?? (liveRows.length > 0 ? "live" : "demo");
  const active = { ...filters, data: mode, ...(queue ? { queue } : {}) };
  const dataset = resolveGovernanceDataset(mode, liveRows);
  const report = buildPracticeGovernanceManagementReport(dataset.rows, 60);
  const focusedRows = queue ? rowsForQueue(report, queue) : null;

  return (
    <main>
      <InsightsFilterSync filters={active} />
      <DashboardHeader
        title="Content review board"
        description="Triage clinic content reviews: expired and missing owner first, then due soon. Click a queue card to remediate — affected items, next action, owner, and due date."
        actions={
          <>
            <ExportActions
              csvHref={`/api/admin/exports/governance?format=csv&data=${mode}`}
              pdfHref={`/api/admin/exports/governance?format=pdf&data=${mode}`}
            />
            <Link href={governanceReviewHref({ filters: active })} className="text-slate-600 underline">
              Governance review
            </Link>
            <Link href={governanceExpiryHref(active)} className="text-slate-600 underline">
              Expiry report
            </Link>
          </>
        }
        meta={
          <>
            {formatCount(report.totals.total)} records · {report.generated_on} · horizon {report.horizon_days}{" "}
            days · {dataset.feedLabel}
          </>
        }
      />

      <div className="mt-6 space-y-3">
        <InsightsNav current="governance-management" filters={active} />
        <DataModeBanner mode={mode} feedLabel={dataset.feedLabel} />
        <HowToReadDashboard dashboard="governance-management" />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Legend />
          <div className="flex flex-wrap items-center gap-3">
            <HealthStatusLegend />
            <DataModeSwitcher path="/admin/governance/management" filters={active} active={mode} />
          </div>
        </div>
        <InsightsInvestigationBanner
          filters={active}
          pathname="/admin/governance/management"
          counts={{
            count: focusedRows?.length,
            entityLabel: "Records",
          }}
          continueLinks={
            queue
              ? [
                  {
                    href: governanceReviewHref({ queue, filters: active }),
                    label: "Open review list",
                  },
                ]
              : undefined
          }
        />
      </div>

      <SectionShell
        id="gm-workload"
        title="What needs attention"
        description="Awaiting Review · Due Soon · Expired · Missing Owner. One click opens the exact remediation queue."
      >
        <WorkloadCards
          totals={{
            awaiting_review: report.totals.awaiting_review,
            due_within_60_days: report.totals.due_within_60_days,
            expired: report.totals.expired,
            missing_ownership: report.totals.missing_ownership,
          }}
          total={report.totals.total}
          activeQueue={queue}
          filters={active}
        />
      </SectionShell>

      {queue && focusedRows ? (
        <SectionShell
          id="gm-remediation"
          title={`Remediation · ${GOVERNANCE_QUEUE_LABEL[queue]}`}
          description="Affected items with next action, responsible owner, and review due date. Open a record to remediate."
        >
          <WorkloadList kind={queue} rows={focusedRows} highlighted compact />
        </SectionShell>
      ) : null}

      <SectionShell
        id="gm-visuals"
        title="Progress, calendar & expiry"
        description="Collection progress bars, this month’s review calendar, and forward expiry load. Segments open the matching queue."
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <SegmentProgress breakdowns={report.breakdowns} filters={active} />
          <ExpiryChart rows={report.workload_by_month} filters={active} />
        </div>
        <div className="mt-4">
          <ReviewCalendar
            monthLabel={report.calendar_month_label}
            days={report.review_calendar}
            today={report.generated_on}
          />
        </div>
      </SectionShell>

      {!queue ? (
        <SectionShell
          id="gm-queues"
          title="Action queues"
          description="All remediation queues — affected item, next action, owner, and due date on every row."
        >
          <div className="grid gap-4 lg:grid-cols-2">
            <WorkloadList kind="awaiting_review" rows={report.pages_awaiting_review} />
            <WorkloadList kind="due_soon" rows={report.pages_due_within_60_days} />
            <WorkloadList kind="expired" rows={report.pages_expired} />
            <WorkloadList kind="missing_ownership" rows={report.pages_missing_ownership} />
          </div>
        </SectionShell>
      ) : (
        <SectionShell
          id="gm-other-queues"
          title="Other queues"
          description="Switch queues from the cards above, or open another list here."
        >
          <div className="grid gap-4 sm:grid-cols-3">
            {(
              [
                "awaiting_review",
                "due_soon",
                "expired",
                "missing_ownership",
              ] as GovernanceRemediationQueue[]
            )
              .filter((kind) => kind !== queue)
              .map((kind) => (
                <Link
                  key={kind}
                  href={governanceManagementHref({ queue: kind, filters: active })}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 underline-offset-2 hover:border-slate-400 hover:underline"
                >
                  {GOVERNANCE_QUEUE_LABEL[kind]} · {formatCount(rowsForQueue(report, kind).length)} →
                </Link>
              ))}
          </div>
        </SectionShell>
      )}

      {(report.totals.missing_approval > 0 || report.totals.missing_review_metadata > 0) && (
        <p className="mt-6 text-xs text-slate-500">
          Also tracked: {formatCount(report.totals.missing_approval)} missing approval ·{" "}
          {formatCount(report.totals.missing_review_metadata)} missing review metadata. Open individual records from
          the queues above or via{" "}
          <Link href={governanceReviewHref()} className="underline underline-offset-2 hover:text-slate-800">
            Governance review
          </Link>
          .
        </p>
      )}
    </main>
  );
}
