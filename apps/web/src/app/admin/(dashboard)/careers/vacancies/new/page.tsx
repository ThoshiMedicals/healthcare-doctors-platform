import { saveVacancy } from "@/cms/actions";
import { VACANCY_ROLE_OPTIONS, VACANCY_STATUS_OPTIONS } from "@/cms/careers-vacancies";
import { requireAction } from "@/cms/context";
import { Area, ErrorNotice, Field, Impact } from "../../../ui";
import { PendingButton } from "../../../pending-button";

export const dynamic = "force-dynamic";

export default async function NewVacancyPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireAction("edit");
  const query = await searchParams;
  return (
    <main>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Careers</p>
      <h1 className="text-2xl font-semibold">New vacancy</h1>
      <p className="mt-2 max-w-2xl text-sm text-slate-600">
        Create a healthcare employer opportunity for Join Our Team. Mark Active to publish on the public page.
      </p>
      <ErrorNotice error={query.error} />
      <form action={saveVacancy} className="mt-6 grid max-w-2xl gap-4">
        <Field label="Title" name="title" required impact={["Join Our Team opportunities"]} />
        <label className="flex flex-col gap-1 text-sm text-slate-700">
          Status
          <Impact items={["Join Our Team status badge"]} />
          <select className="rounded border border-slate-300 bg-white px-3 py-2" name="status" defaultValue="expression_of_interest" required>
            {VACANCY_STATUS_OPTIONS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <Field label="Location" name="location" defaultValue="Woolloongabba, Brisbane" impact={["Join Our Team card meta"]} />
        <Field label="Employment Type" name="employmentType" defaultValue="Full-Time" impact={["Join Our Team card meta"]} />
        <Field label="Remuneration note (optional)" name="remunerationNote" impact={["Join Our Team card remuneration line"]} />
        <label className="flex flex-col gap-1 text-sm text-slate-700">
          Role Category / Department
          <Impact items={["Talent Community role matching", "Vacancy department label"]} />
          <select className="rounded border border-slate-300 bg-white px-3 py-2" name="roleCategory" defaultValue="other" required>
            {VACANCY_ROLE_OPTIONS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <Area label="Short Summary" name="shortSummary" impact={["Join Our Team card summary"]} />
        <Area label="Full Description" name="fullDescription" impact={["Expanded role detail"]} />
        <Area label="Offer Highlights (one per line)" name="offerHighlights" impact={["Featured card bullets", "Expanded role detail"]} />
        <Area label="Requirements (one per line)" name="requirements" impact={["Expanded role detail"]} />
        <Field label="Apply URL (optional — defaults to Express Interest)" name="applyUrl" impact={["Vacancy CTA destination"]} />
        <Field label="Display Order" name="displayOrder" type="number" defaultValue="0" impact={["Vacancy sort order"]} />
        <Field label="Published date (optional)" name="publishedAt" type="date" impact={["New badge timing"]} />
        <Field label="Expiry date (optional)" name="expiresAt" type="date" impact={["Auto-hide after expiry"]} />
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" name="featured" />
          Featured opportunity (highlighted first)
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" name="active" defaultChecked />
          Active / open on Join Our Team
        </label>
        <PendingButton
          label="Create vacancy"
          pendingLabel="Saving…"
          className="rounded bg-slate-900 px-3 py-2 text-sm font-medium text-white"
        />
      </form>
    </main>
  );
}
