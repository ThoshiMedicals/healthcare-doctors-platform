import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteVacancy, saveVacancy } from "@/cms/actions";
import {
  listToLines,
  VACANCY_ROLE_OPTIONS,
  VACANCY_STATUS_LABEL,
  VACANCY_STATUS_OPTIONS,
} from "@/cms/careers-vacancies";
import { requireAction } from "@/cms/context";
import { mediaLibraryPickerHref } from "@/cms/media-library-shared";
import { prisma } from "@/db/prisma";
import { Area, ErrorNotice, Field, Impact } from "../../../ui";
import { PendingButton } from "../../../pending-button";

export const dynamic = "force-dynamic";

export default async function EditVacancyPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const { clinic } = await requireAction("edit");
  const row = await prisma.vacancy.findFirst({ where: { id, clinicId: clinic.id } });
  if (!row) notFound();

  return (
    <main>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Careers</p>
      <h1 className="text-2xl font-semibold">{row.title}</h1>
      <p className="mt-1 text-sm text-slate-600">
        {VACANCY_STATUS_LABEL[row.status]} · {row.active ? "Active" : "Inactive"} · updated{" "}
        {row.updatedAt.toISOString().slice(0, 10)}
      </p>
      <div className="mt-2 flex flex-wrap gap-3 text-sm">
        <Link className="text-slate-600 underline" href="/join-our-team.html" target="_blank">
          View Join Our Team
        </Link>
        <Link
          className="text-slate-600 underline"
          href={mediaLibraryPickerHref({
            category: "Careers",
            returnTo: `/admin/careers/vacancies/${row.id}`,
            field: "careers-image",
          })}
        >
          Browse Media Library (Careers)
        </Link>
      </div>
      {query.saved === "1" ? (
        <p className="mt-4 rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          {row.active
            ? "Saved. Active vacancies appear immediately on Join Our Team."
            : "Saved. This vacancy is inactive and will not appear on the public careers page."}
        </p>
      ) : null}
      <ErrorNotice error={query.error} />
      <form action={saveVacancy} className="mt-6 grid max-w-2xl gap-4">
        <input type="hidden" name="id" value={row.id} />
        <Field label="Title" name="title" defaultValue={row.title} required impact={["Join Our Team opportunities"]} />
        <label className="flex flex-col gap-1 text-sm text-slate-700">
          Status
          <Impact items={["Join Our Team status badge"]} />
          <select className="rounded border border-slate-300 bg-white px-3 py-2" name="status" defaultValue={row.status} required>
            {VACANCY_STATUS_OPTIONS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <Field label="Location" name="location" defaultValue={row.location} impact={["Join Our Team card meta"]} />
        <Field label="Employment Type" name="employmentType" defaultValue={row.employmentType} impact={["Join Our Team card meta"]} />
        <Field
          label="Remuneration note (optional)"
          name="remunerationNote"
          defaultValue={row.remunerationNote}
          impact={["Join Our Team card remuneration line"]}
        />
        <label className="flex flex-col gap-1 text-sm text-slate-700">
          Role Category / Department
          <Impact items={["Talent Community role matching", "Vacancy department label"]} />
          <select className="rounded border border-slate-300 bg-white px-3 py-2" name="roleCategory" defaultValue={row.roleCategory} required>
            {VACANCY_ROLE_OPTIONS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <Area label="Short Summary" name="shortSummary" defaultValue={row.shortSummary} impact={["Join Our Team card summary"]} />
        <Area label="Full Description" name="fullDescription" defaultValue={row.fullDescription} impact={["Expanded role detail"]} />
        <Area
          label="Offer Highlights (one per line)"
          name="offerHighlights"
          defaultValue={listToLines(row.offerHighlights)}
          impact={["Featured card bullets", "Expanded role detail"]}
        />
        <Area
          label="Requirements (one per line)"
          name="requirements"
          defaultValue={listToLines(row.requirements)}
          impact={["Expanded role detail"]}
        />
        <Field
          label="Apply URL (optional — defaults to Express Interest)"
          name="applyUrl"
          defaultValue={row.applyUrl}
          impact={["Vacancy CTA destination"]}
        />
        <Field
          label="Display Order"
          name="displayOrder"
          type="number"
          defaultValue={String(row.displayOrder)}
          impact={["Vacancy sort order"]}
        />
        <Field
          label="Published date (optional)"
          name="publishedAt"
          type="date"
          defaultValue={row.publishedAt ? row.publishedAt.toISOString().slice(0, 10) : ""}
          impact={["New badge timing", "Public visibility start"]}
        />
        <Field
          label="Expiry date (optional)"
          name="expiresAt"
          type="date"
          defaultValue={row.expiresAt ? row.expiresAt.toISOString().slice(0, 10) : ""}
          impact={["Auto-hide after expiry"]}
        />
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" name="featured" defaultChecked={row.featured} />
          Featured opportunity (highlighted first)
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" name="active" defaultChecked={row.active} />
          Active / open on Join Our Team (uncheck to archive)
        </label>
        <p className="text-xs text-slate-500">
          Created {row.createdAt.toISOString().slice(0, 10)} · Updated {row.updatedAt.toISOString().slice(0, 10)}
        </p>
        <PendingButton
          label="Save vacancy"
          pendingLabel="Saving…"
          className="rounded bg-slate-900 px-3 py-2 text-sm font-medium text-white"
        />
      </form>
      <form action={deleteVacancy} className="mt-8 max-w-2xl border-t border-slate-200 pt-6">
        <input type="hidden" name="id" value={row.id} />
        <p className="text-sm text-slate-600">Delete removes this vacancy from the CMS and the public careers list.</p>
        <PendingButton
          label="Delete vacancy"
          pendingLabel="Deleting…"
          className="mt-3 rounded border border-red-300 px-3 py-2 text-sm font-medium text-red-800"
        />
      </form>
    </main>
  );
}
