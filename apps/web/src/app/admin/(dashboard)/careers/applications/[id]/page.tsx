import Link from "next/link";
import { notFound } from "next/navigation";
import { saveCareerApplication } from "@/cms/actions";
import {
  CAREER_APPLICATION_STATUS_LABEL,
  CAREER_APPLICATION_STATUS_OPTIONS,
} from "@/cms/careers-applications";
import { requireAction } from "@/cms/context";
import { prisma } from "@/db/prisma";
import { Area, ErrorNotice, Impact } from "../../../ui";
import { PendingButton } from "../../../pending-button";

export const dynamic = "force-dynamic";

export default async function CareerApplicationDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const { clinic } = await requireAction("edit");
  const [row, staff] = await Promise.all([
    prisma.careerApplication.findFirst({
      where: { id, clinicId: clinic.id },
      include: {
        vacancy: { select: { id: true, title: true } },
        assignedTo: { select: { id: true, name: true, email: true, username: true } },
      },
    }),
    prisma.clinicMembership.findMany({
      where: { clinicId: clinic.id },
      include: { user: { select: { id: true, name: true, email: true, username: true, disabledAt: true } } },
      orderBy: { createdAt: "asc" },
    }),
  ]);
  if (!row) notFound();

  const assignees = staff
    .map((membership) => membership.user)
    .filter((user) => !user.disabledAt);

  return (
    <main>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Careers · Applications</p>
      <h1 className="text-2xl font-semibold">{row.name}</h1>
      <p className="mt-1 text-sm text-slate-600">
        {CAREER_APPLICATION_STATUS_LABEL[row.status]} · {row.roleInterest} · received{" "}
        {row.createdAt.toISOString().slice(0, 10)}
      </p>
      <Link className="mt-2 inline-block text-sm text-slate-600 underline" href="/admin/careers/applications">
        Back to applications
      </Link>

      {query.saved === "1" ? (
        <p className="mt-4 rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          Application updated.
        </p>
      ) : null}
      <ErrorNotice error={query.error} />

      <dl className="mt-6 grid max-w-2xl gap-3 rounded border border-slate-200 bg-white p-4 text-sm">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Email</dt>
          <dd>
            <a className="underline" href={`mailto:${row.email}`}>
              {row.email}
            </a>
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Phone</dt>
          <dd>{row.phone || "Not provided"}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Vacancy</dt>
          <dd>
            {row.vacancy ? (
              <Link className="underline" href={`/admin/careers/vacancies/${row.vacancy.id}`}>
                {row.vacancy.title}
              </Link>
            ) : (
              "Talent community (no specific vacancy)"
            )}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Role interest</dt>
          <dd>{row.roleInterest}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Message</dt>
          <dd className="whitespace-pre-wrap">{row.message || "Not provided"}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Resume</dt>
          <dd>
            {row.resumeStoragePath ? (
              <a className="underline" href={`/api/admin/career-applications/${row.id}/resume`}>
                Download {row.resumeFileName || "resume"}
              </a>
            ) : (
              "No resume uploaded"
            )}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Created / Updated</dt>
          <dd>
            {row.createdAt.toISOString().slice(0, 19).replace("T", " ")} UTC · updated{" "}
            {row.updatedAt.toISOString().slice(0, 19).replace("T", " ")} UTC
          </dd>
        </div>
      </dl>

      <form action={saveCareerApplication} className="mt-6 grid max-w-2xl gap-4">
        <input type="hidden" name="id" value={row.id} />
        <label className="flex flex-col gap-1 text-sm text-slate-700">
          Status
          <Impact items={["Applications queue and careers dashboard"]} />
          <select className="rounded border border-slate-300 bg-white px-3 py-2" name="status" defaultValue={row.status} required>
            {CAREER_APPLICATION_STATUS_OPTIONS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-700">
          Assigned to
          <Impact items={["Internal recruitment ownership"]} />
          <select
            className="rounded border border-slate-300 bg-white px-3 py-2"
            name="assignedToUserId"
            defaultValue={row.assignedToUserId ?? ""}
          >
            <option value="">Unassigned</option>
            {assignees.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name || user.email || user.username || user.id}
              </option>
            ))}
          </select>
        </label>
        <Area label="Notes" name="notes" defaultValue={row.notes} impact={["Internal recruitment notes only"]} />
        <PendingButton
          label="Save application"
          pendingLabel="Saving…"
          className="rounded bg-slate-900 px-3 py-2 text-sm font-medium text-white"
        />
      </form>
    </main>
  );
}
