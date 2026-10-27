import Link from "next/link";
import { requireAction } from "@/cms/context";
import { publicPageName } from "@/cms/staff-labels";
import { prisma } from "@/db/prisma";
import { buildPracticeGovernanceManagementReport } from "@/governance/management-report";
import {
  GOVERNANCE_QUEUE_LABEL,
  isGovernanceRemediationQueue,
  toRemediationItems,
  type GovernanceRemediationQueue,
} from "@/governance/remediation";
import { resolveGovernanceDataset } from "@/measurement/demo/load-governance-dataset";
import { parseInsightsDataMode } from "@/measurement/insights-data-mode";
import {
  DataModeBanner,
  DataModeSwitcher,
  EmptyState,
  HowToReadDashboard,
  InsightsFilterSync,
  InsightsInvestigationBanner,
  InsightsNav,
  governanceExpiryHref,
  governanceManagementHref,
  governanceReviewHref,
} from "../dashboard-ui";
import { resolveInsightsFilters } from "../dashboard-ui/resolve-insights-filters";

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

export default async function GovernancePage({
  searchParams,
}: {
  searchParams?: Promise<{
    queue?: string;
    practitioner?: string;
    service?: string;
    range?: string;
    data?: string;
  }>;
}) {
  const { clinic } = await requireAction("clinical_signoff");
  const params = searchParams ? await searchParams : {};
  const filters = await resolveInsightsFilters(params, "/admin/governance");
  const queue =
    filters.queue && isGovernanceRemediationQueue(filters.queue) ? filters.queue : null;

  const liveRows = await prisma.clinicalReview.findMany({
    where: { clinicId: clinic.id },
    include: { page: { select: { path: true, title: true } } },
    orderBy: { page: { path: "asc" } },
  });
  const mode =
    parseInsightsDataMode(filters.data) ?? (liveRows.length > 0 ? "live" : "demo");
  const active = { ...filters, data: mode };
  const dataset = resolveGovernanceDataset(mode, liveRows);
  const rows = dataset.rows;

  const report = buildPracticeGovernanceManagementReport(rows, 60);
  const queueRows = queue ? rowsForQueue(report, queue) : null;
  const remediation = queue && queueRows ? toRemediationItems(queueRows, queue) : null;
  const editable = mode === "live";

  return (
    <main>
      <InsightsFilterSync filters={active} />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Content review list</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Open a page record to complete ownership, review dates, and approval. The public website only shows
            review details after approval rules are met — this list is your work queue, not a technical log.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 text-sm">
          <Link href={governanceManagementHref({ filters: active })} className="text-slate-600 underline">
            Governance management
          </Link>
          <Link href={governanceExpiryHref(active)} className="text-slate-600 underline">
            Review expiry report
          </Link>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        <InsightsNav current="governance-review" filters={active} />
        <DataModeBanner mode={mode} feedLabel={dataset.feedLabel} />
        <HowToReadDashboard dashboard="governance-review" />
        <DataModeSwitcher path="/admin/governance" filters={active} active={mode} />
        <InsightsInvestigationBanner
          filters={active}
          pathname="/admin/governance"
          counts={{
            count: remediation?.length,
            entityLabel: "Records",
          }}
        />
      </div>

      {queue && remediation ? (
        remediation.length === 0 ? (
          <EmptyState
            title="No records in this queue"
            message="Nothing matches the active governance filter. Clear the filter or open another queue from the board."
            className="mt-6"
          />
        ) : (
          <div className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-sm font-semibold text-slate-900">
                Remediation · {GOVERNANCE_QUEUE_LABEL[queue]}
              </p>
              <p className="mt-0.5 text-xs text-slate-600">
                Affected item · Next action · Responsible owner · Review due date
              </p>
            </div>
            <ul className="divide-y divide-slate-200 md:hidden">
              {remediation.map((item) => (
                <li key={item.id} className="space-y-2 px-4 py-3 text-sm">
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                      Affected item
                    </p>
                    {editable ? (
                      <Link href={item.recordHref} className="font-medium text-slate-900 hover:underline">
                        {publicPageName(item.path)}
                      </Link>
                    ) : (
                      <span className="font-medium text-slate-900">{publicPageName(item.path)}</span>
                    )}
                  </div>
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                      Next action
                    </p>
                    <p className="text-xs text-slate-700">{item.nextAction}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                        Responsible owner
                      </p>
                      <p className={item.ownerUnset ? "font-medium text-rose-800" : "text-slate-700"}>
                        {item.responsibleOwner}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                        Review due date
                      </p>
                      <p className="tabular-nums text-slate-700">{item.reviewDueLabel}</p>
                    </div>
                  </div>
                  {editable ? (
                    <p className="text-xs font-medium">
                      <Link href={item.recordHref} className="underline-offset-2 hover:underline">
                        Remediate record →
                      </Link>
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-2 font-medium">Affected item</th>
                    <th className="px-4 py-2 font-medium">Next action</th>
                    <th className="px-4 py-2 font-medium">Responsible owner</th>
                    <th className="px-4 py-2 font-medium">Review due date</th>
                    <th className="px-4 py-2 font-medium"> </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {remediation.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3 align-top font-medium text-slate-900">
                        {editable ? (
                          <Link href={item.recordHref} className="hover:underline">
                            {publicPageName(item.path)}
                          </Link>
                        ) : (
                          publicPageName(item.path)
                        )}
                        <p className="mt-0.5 text-xs font-normal text-slate-500">{item.statusLabel}</p>
                      </td>
                      <td className="max-w-[14rem] px-4 py-3 align-top text-xs text-slate-700">
                        {item.nextAction}
                      </td>
                      <td
                        className={`px-4 py-3 align-top text-xs ${
                          item.ownerUnset ? "font-medium text-rose-800" : "text-slate-700"
                        }`}
                      >
                        {item.responsibleOwner}
                      </td>
                      <td className="px-4 py-3 align-top text-xs tabular-nums text-slate-700">
                        {item.reviewDueLabel}
                      </td>
                      <td className="px-4 py-3 align-top text-xs font-medium">
                        {editable ? (
                          <Link href={item.recordHref} className="underline-offset-2 hover:underline">
                            Remediate →
                          </Link>
                        ) : (
                          <span className="text-slate-400">Demo</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : rows.length === 0 ? (
        <EmptyState
          title="No reviews yet"
          message="Clinical review records will appear here once pages are under governance."
          className="mt-6"
        />
      ) : (
        <ul className="mt-6 divide-y divide-slate-200 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          {rows.map((row) => {
            const body = (
              <>
                <span>{publicPageName(row.page.path)}</span>
                <span className="text-slate-500">{row.status.replaceAll("_", " ")}</span>
              </>
            );
            return (
              <li key={row.id}>
                {editable ? (
                  <Link
                    href={`/admin/governance/${row.id}`}
                    className="flex justify-between gap-4 px-4 py-3 text-sm hover:bg-slate-50"
                  >
                    {body}
                  </Link>
                ) : (
                  <div className="flex justify-between gap-4 px-4 py-3 text-sm text-slate-700">{body}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
