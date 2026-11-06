import Link from "next/link";
import { VACANCY_STATUS_LABEL } from "@/cms/careers-vacancies";
import { requireAction } from "@/cms/context";
import { plainText } from "@/cms/staff-labels";
import { prisma } from "@/db/prisma";
import { SearchableRecords } from "../../searchable-list";

export const dynamic = "force-dynamic";

export default async function VacanciesPage({
  searchParams,
}: {
  searchParams: Promise<{ deleted?: string }>;
}) {
  const query = await searchParams;
  const { clinic } = await requireAction("edit");
  const rows = await prisma.vacancy.findMany({
    where: { clinicId: clinic.id },
    orderBy: [{ displayOrder: "asc" }, { updatedAt: "desc" }],
    select: {
      id: true,
      title: true,
      status: true,
      active: true,
      location: true,
      employmentType: true,
      displayOrder: true,
    },
  });

  return (
    <main>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Careers</p>
          <h1 className="text-2xl font-semibold">Vacancies</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Manage Join Our Team opportunities. Active vacancies that are not Closed appear on the public careers page.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/careers/applications" className="rounded border border-slate-300 px-3 py-2 text-sm">
            Applications
          </Link>
          <Link
            href="/admin/careers/vacancies/new"
            className="rounded bg-slate-900 px-3 py-2 text-sm font-medium text-white"
          >
            New vacancy
          </Link>
        </div>
      </div>
      {query.deleted === "1" ? (
        <p className="mb-4 rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          Vacancy deleted. The public careers list updates immediately.
        </p>
      ) : null}
      <SearchableRecords
        title="Current vacancy records"
        intro="Status and Active control public visibility. Closed or inactive roles stay in the CMS only."
        rows={rows.map((row) => ({
          href: `/admin/careers/vacancies/${row.id}`,
          title: plainText(row.title),
          meta: `${VACANCY_STATUS_LABEL[row.status]} · ${row.active ? "Active" : "Inactive"} · order ${row.displayOrder}${
            row.employmentType ? ` · ${row.employmentType}` : ""
          }`,
        }))}
      />
    </main>
  );
}
