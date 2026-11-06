import Link from "next/link";
import {
  CAREER_APPLICATION_STATUS_LABEL,
  CAREER_APPLICATION_STATUS_OPTIONS,
  careerApplicationDashboardStats,
  careerApplicationWhere,
  type CareerApplicationListFilters,
  isCareerApplicationStatus,
} from "@/cms/careers-applications";
import { requireAction } from "@/cms/context";
import { plainText } from "@/cms/staff-labels";
import { prisma } from "@/db/prisma";
import { CareersWidgets } from "../careers-widgets";

export const dynamic = "force-dynamic";

function parseFilters(query: Record<string, string | undefined>): CareerApplicationListFilters {
  const statusRaw = query.status?.trim() || "all";
  return {
    q: query.q?.trim() || undefined,
    status: statusRaw === "all" || !statusRaw ? "all" : isCareerApplicationStatus(statusRaw) ? statusRaw : "all",
    vacancyId: query.vacancyId?.trim() || "all",
    from: query.from?.trim() || undefined,
    to: query.to?.trim() || undefined,
  };
}

export default async function CareerApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    status?: string;
    vacancyId?: string;
    from?: string;
    to?: string;
  }>;
}) {
  const query = await searchParams;
  const { clinic } = await requireAction("edit");
  const filters = parseFilters(query);
  const [stats, vacancies, rows] = await Promise.all([
    careerApplicationDashboardStats(clinic.id),
    prisma.vacancy.findMany({
      where: { clinicId: clinic.id },
      orderBy: [{ displayOrder: "asc" }, { title: "asc" }],
      select: { id: true, title: true },
    }),
    prisma.careerApplication.findMany({
      where: careerApplicationWhere(clinic.id, filters),
      orderBy: { createdAt: "desc" },
      take: 200,
      include: {
        vacancy: { select: { title: true } },
        assignedTo: { select: { name: true, email: true, username: true } },
      },
    }),
  ]);

  return (
    <main>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Careers</p>
          <h1 className="text-2xl font-semibold">Applications</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Expressions of interest from Join Our Talent Community. Search and filter by vacancy, status, or date.
          </p>
        </div>
        <Link href="/admin/careers" className="text-sm text-slate-600 underline">
          Careers hub
        </Link>
      </div>

      <CareersWidgets stats={stats} />

      <form className="mt-6 grid gap-3 rounded border border-slate-200 bg-white p-4 md:grid-cols-5" method="get">
        <label className="flex flex-col gap-1 text-sm text-slate-700 md:col-span-2">
          Search
          <input
            className="rounded border border-slate-300 px-3 py-2"
            name="q"
            type="search"
            defaultValue={filters.q ?? ""}
            placeholder="Name, email, role, notes…"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-700">
          Status
          <select className="rounded border border-slate-300 px-3 py-2" name="status" defaultValue={filters.status ?? "all"}>
            <option value="all">All statuses</option>
            {CAREER_APPLICATION_STATUS_OPTIONS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-700">
          Vacancy
          <select
            className="rounded border border-slate-300 px-3 py-2"
            name="vacancyId"
            defaultValue={filters.vacancyId ?? "all"}
          >
            <option value="all">All vacancies</option>
            <option value="none">Talent community only</option>
            {vacancies.map((vacancy) => (
              <option key={vacancy.id} value={vacancy.id}>
                {vacancy.title}
              </option>
            ))}
          </select>
        </label>
        <div className="grid grid-cols-2 gap-2 md:col-span-2">
          <label className="flex flex-col gap-1 text-sm text-slate-700">
            From
            <input className="rounded border border-slate-300 px-3 py-2" name="from" type="date" defaultValue={filters.from ?? ""} />
          </label>
          <label className="flex flex-col gap-1 text-sm text-slate-700">
            To
            <input className="rounded border border-slate-300 px-3 py-2" name="to" type="date" defaultValue={filters.to ?? ""} />
          </label>
        </div>
        <div className="flex items-end gap-2 md:col-span-5">
          <button className="rounded bg-slate-900 px-3 py-2 text-sm font-medium text-white" type="submit">
            Apply filters
          </button>
          <Link href="/admin/careers/applications" className="rounded border border-slate-300 px-3 py-2 text-sm">
            Clear
          </Link>
        </div>
      </form>

      <ul className="mt-4 divide-y divide-slate-200 rounded border border-slate-200 bg-white">
        {rows.length === 0 ? (
          <li className="px-4 py-3 text-sm text-slate-600">No applications match these filters.</li>
        ) : null}
        {rows.map((row) => {
          const assignee = row.assignedTo?.name || row.assignedTo?.email || row.assignedTo?.username || "Unassigned";
          return (
            <li key={row.id}>
              <Link
                href={`/admin/careers/applications/${row.id}`}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm hover:bg-slate-50"
              >
                <span>
                  <span className="font-medium">{plainText(row.name)}</span>
                  <span className="mt-0.5 block text-slate-500">
                    {plainText(row.roleInterest)}
                    {row.vacancy ? ` · ${plainText(row.vacancy.title)}` : " · Talent community"}
                    {row.resumeFileName ? " · Resume" : ""}
                  </span>
                </span>
                <span className="text-right text-slate-500">
                  <span className="block font-medium text-slate-700">
                    {CAREER_APPLICATION_STATUS_LABEL[row.status]}
                  </span>
                  <span className="block">
                    {row.createdAt.toISOString().slice(0, 10)} · {assignee}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
