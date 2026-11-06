import Link from "next/link";
import { requireAction } from "@/cms/context";
import {
  GP_READINESS_STATUS_LABEL,
  GP_READINESS_STATUS_OPTIONS,
  GP_RECRUITMENT_SOURCE_LABEL,
  GP_RECRUITMENT_SOURCE_OPTIONS,
  isGpReadinessPackageStatus,
  isGpRecruitmentSource,
  listRecruitmentPackages,
  recruitmentDashboardStats,
  type PracticeManagerFilter,
} from "@/gp-pipeline/recruitment-ops";

export const dynamic = "force-dynamic";

const PM_FILTERS: Array<{ id: PracticeManagerFilter; label: string }> = [
  { id: "all", label: "All packages" },
  { id: "pending_review", label: "Pending Review" },
  { id: "needs_provider_number", label: "Needs Provider Number Support" },
  { id: "needs_website_profile", label: "Needs Website Profile" },
  { id: "pending_documents", label: "Pending Documents" },
  { id: "ready_to_start", label: "Ready To Start" },
  { id: "active_gps", label: "Active GPs" },
];

export default async function GpReadinessRecruitmentDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; source?: string; pm?: string }>;
}) {
  const query = await searchParams;
  const { clinic } = await requireAction("edit");
  const statusRaw = query.status?.trim() || "all";
  const sourceRaw = query.source?.trim() || "all";
  const pmRaw = (query.pm?.trim() || "all") as PracticeManagerFilter;
  const status =
    statusRaw === "all" || !isGpReadinessPackageStatus(statusRaw) ? "all" : statusRaw;
  const source =
    sourceRaw === "all" || !isGpRecruitmentSource(sourceRaw) ? "all" : sourceRaw;
  const pmFilter = PM_FILTERS.some((row) => row.id === pmRaw) ? pmRaw : "all";
  const q = query.q?.trim() || undefined;

  const [stats, packages] = await Promise.all([
    recruitmentDashboardStats(clinic.id),
    listRecruitmentPackages(clinic.id, { status, source, q, pmFilter }),
  ]);

  const conversion =
    stats.funnel.portalSubmission > 0
      ? Math.round((stats.funnel.activeGp / stats.funnel.portalSubmission) * 100)
      : 0;

  return (
    <main>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Recruitment</p>
          <h1 className="text-2xl font-semibold">GP Readiness Operations</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-600">
            Manage every GP Readiness Package from portal submission through onboarding, provider-number
            support, website profile preparation, and active GP.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 text-sm">
          <Link href="/admin/recruitment/gp-readiness/profiles" className="text-slate-600 underline">
            Doctor profile drafts
          </Link>
          <Link href="/admin/gp-pipeline" className="text-slate-600 underline">
            GP Pipeline
          </Link>
        </div>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <div className="rounded border border-slate-200 bg-white p-3">
          <p className="text-xs uppercase tracking-wide text-slate-500">Total portal submissions</p>
          <p className="text-2xl font-semibold">{stats.total}</p>
        </div>
        <div className="rounded border border-slate-200 bg-white p-3">
          <p className="text-xs uppercase tracking-wide text-slate-500">Confidential discussions</p>
          <p className="text-2xl font-semibold">{stats.counts.confidential_discussion}</p>
        </div>
        <div className="rounded border border-slate-200 bg-white p-3">
          <p className="text-xs uppercase tracking-wide text-slate-500">Recruitment reviews</p>
          <p className="text-2xl font-semibold">{stats.counts.recruitment_review}</p>
        </div>
        <div className="rounded border border-slate-200 bg-white p-3">
          <p className="text-xs uppercase tracking-wide text-slate-500">Offers extended</p>
          <p className="text-2xl font-semibold">{stats.funnel.offersExtended}</p>
        </div>
        <div className="rounded border border-slate-200 bg-white p-3">
          <p className="text-xs uppercase tracking-wide text-slate-500">Active GPs</p>
          <p className="text-2xl font-semibold">{stats.counts.active_gp}</p>
        </div>
        <div className="rounded border border-slate-200 bg-white p-3 sm:col-span-2 lg:col-span-3 xl:col-span-3">
          <p className="text-xs uppercase tracking-wide text-slate-500">Conversion funnel</p>
          <p className="mt-2 text-sm text-slate-700">
            Portal Submission ({stats.funnel.portalSubmission}) → Discussion ({stats.funnel.discussion}) →
            Applicant ({stats.funnel.applicant}) → Onboarding ({stats.funnel.onboarding}) → Active GP (
            {stats.funnel.activeGp}) · <strong>{conversion}%</strong> to Active GP
          </p>
        </div>
      </section>

      <section className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {GP_READINESS_STATUS_OPTIONS.map(([value, label]) => (
          <Link
            key={value}
            href={`/admin/recruitment/gp-readiness?status=${value}`}
            className="rounded border border-slate-200 bg-white p-3 hover:border-slate-400"
          >
            <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
            <p className="text-xl font-semibold">{stats.counts[value]}</p>
          </Link>
        ))}
      </section>

      <section className="mt-4 flex flex-wrap gap-2">
        {PM_FILTERS.map((filter) => {
          const active = pmFilter === filter.id;
          return (
            <Link
              key={filter.id}
              href={
                filter.id === "all"
                  ? "/admin/recruitment/gp-readiness"
                  : `/admin/recruitment/gp-readiness?pm=${filter.id}`
              }
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                active
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-300 bg-white text-slate-700"
              }`}
            >
              {filter.label}
            </Link>
          );
        })}
      </section>

      <form className="mt-6 grid gap-3 rounded border border-slate-200 bg-white p-4 md:grid-cols-5" method="get">
        {pmFilter !== "all" ? <input type="hidden" name="pm" value={pmFilter} /> : null}
        <label className="flex flex-col gap-1 text-sm text-slate-700 md:col-span-2">
          Search
          <input
            className="rounded border border-slate-300 px-3 py-2"
            name="q"
            type="search"
            defaultValue={q ?? ""}
            placeholder="Name, email, mobile…"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-700">
          Status
          <select className="rounded border border-slate-300 px-3 py-2" name="status" defaultValue={status}>
            <option value="all">All statuses</option>
            {GP_READINESS_STATUS_OPTIONS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-700">
          Source
          <select className="rounded border border-slate-300 px-3 py-2" name="source" defaultValue={source}>
            <option value="all">All sources</option>
            {GP_RECRUITMENT_SOURCE_OPTIONS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-end">
          <button type="submit" className="rounded bg-slate-900 px-4 py-2 text-sm text-white">
            Filter
          </button>
        </div>
      </form>

      <div className="mt-4 overflow-x-auto rounded border border-slate-200 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-2 font-semibold">Candidate</th>
              <th className="px-3 py-2 font-semibold">Status</th>
              <th className="px-3 py-2 font-semibold">Source</th>
              <th className="px-3 py-2 font-semibold">Profile</th>
              <th className="px-3 py-2 font-semibold">Notes / Tasks</th>
              <th className="px-3 py-2 font-semibold">Submitted</th>
            </tr>
          </thead>
          <tbody>
            {packages.length === 0 ? (
              <tr>
                <td className="px-3 py-6 text-slate-500" colSpan={6}>
                  No readiness packages match these filters.
                </td>
              </tr>
            ) : (
              packages.map((row) => (
                <tr key={row.id} className="border-t border-slate-100">
                  <td className="px-3 py-3">
                    <Link
                      className="font-medium text-slate-900 underline"
                      href={`/admin/recruitment/gp-readiness/${row.id}`}
                    >
                      {row.firstName} {row.lastName}
                    </Link>
                    <p className="text-xs text-slate-500">{row.email}</p>
                  </td>
                  <td className="px-3 py-3">{GP_READINESS_STATUS_LABEL[row.status]}</td>
                  <td className="px-3 py-3">
                    {row.recruitmentSource
                      ? GP_RECRUITMENT_SOURCE_LABEL[row.recruitmentSource]
                      : "—"}
                  </td>
                  <td className="px-3 py-3">
                    {row.doctorProfileDraft
                      ? `${row.doctorProfileDraft.completenessScore}%`
                      : "—"}
                  </td>
                  <td className="px-3 py-3">
                    {row._count.notes} notes · {row._count.tasks} tasks
                  </td>
                  <td className="px-3 py-3">{row.submittedAt.toISOString().slice(0, 10)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
