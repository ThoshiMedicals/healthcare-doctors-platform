import Link from "next/link";
import { notFound } from "next/navigation";
import { savePatientRequest } from "@/cms/actions";
import {
  FORM_REQUEST_STATUS_LABEL,
  FORM_REQUEST_STATUS_OPTIONS,
  parseFormRequestHistory,
} from "@/cms/patient-requests";
import { requireAction } from "@/cms/context";
import { prisma } from "@/db/prisma";
import { Area, ErrorNotice, Impact } from "../../../ui";
import { PendingButton } from "../../../pending-button";

export const dynamic = "force-dynamic";

export default async function PatientRequestDetailPage({
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
    prisma.formRequest.findFirst({
      where: { id, clinicId: clinic.id },
      include: { assignedTo: { select: { id: true, name: true, email: true, username: true } } },
    }),
    prisma.clinicMembership.findMany({
      where: { clinicId: clinic.id },
      include: { user: { select: { id: true, name: true, email: true, username: true, disabledAt: true } } },
      orderBy: { createdAt: "asc" },
    }),
  ]);
  if (!row) notFound();

  const assignees = staff.map((membership) => membership.user).filter((user) => !user.disabledAt);
  const history = parseFormRequestHistory(row.history).slice().reverse();

  return (
    <main>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Operations · Patient Requests</p>
      <h1 className="text-2xl font-semibold">{row.name}</h1>
      <p className="mt-1 text-sm text-slate-600">
        {FORM_REQUEST_STATUS_LABEL[row.status]} · {row.formType} · received{" "}
        {row.createdAt.toISOString().slice(0, 10)}
      </p>
      <Link className="mt-2 inline-block text-sm text-slate-600 underline" href="/admin/operations/patient-requests">
        Back to inbox
      </Link>

      {query.saved === "1" ? (
        <p className="mt-4 rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          Patient request updated.
        </p>
      ) : null}
      <ErrorNotice error={query.error} />

      <dl className="mt-6 grid max-w-2xl gap-3 rounded border border-slate-200 bg-white p-4 text-sm">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Email</dt>
          <dd>
            {row.email ? (
              <a className="underline" href={`mailto:${row.email}`}>
                {row.email}
              </a>
            ) : (
              "Not provided"
            )}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Phone</dt>
          <dd>
            {row.phone ? (
              <a className="underline" href={`tel:${row.phone.replace(/\s+/g, "")}`}>
                {row.phone}
              </a>
            ) : (
              "Not provided"
            )}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Request type</dt>
          <dd>{row.formType}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Delivery method</dt>
          <dd>{row.delivery || "Not specified"}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Privacy confirmed</dt>
          <dd>{row.privacyConfirmedAt.toISOString().slice(0, 19).replace("T", " ")} UTC</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Created / Updated</dt>
          <dd>
            {row.createdAt.toISOString().slice(0, 19).replace("T", " ")} UTC · updated{" "}
            {row.updatedAt.toISOString().slice(0, 19).replace("T", " ")} UTC
          </dd>
        </div>
      </dl>

      <form action={savePatientRequest} className="mt-6 grid max-w-2xl gap-4">
        <input type="hidden" name="id" value={row.id} />
        <label className="flex flex-col gap-1 text-sm text-slate-700">
          Status
          <Impact items={["Patient Requests inbox and briefing widgets"]} />
          <select className="rounded border border-slate-300 bg-white px-3 py-2" name="status" defaultValue={row.status} required>
            {FORM_REQUEST_STATUS_OPTIONS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-700">
          Assigned to
          <Impact items={["Reception ownership"]} />
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
        <Area label="Notes" name="notes" defaultValue={row.notes} impact={["Internal reception notes only"]} />
        <PendingButton
          label="Save request"
          pendingLabel="Saving…"
          className="rounded bg-slate-900 px-3 py-2 text-sm font-medium text-white"
        />
      </form>

      <section className="mt-8 max-w-2xl">
        <h2 className="text-lg font-semibold">Status history</h2>
        <p className="mt-1 text-sm text-slate-600">Audit of status, assignment, and note changes (plus ContentRevision).</p>
        <ul className="mt-3 divide-y divide-slate-200 rounded border border-slate-200 bg-white">
          {history.length === 0 ? (
            <li className="px-4 py-3 text-sm text-slate-600">No history recorded yet.</li>
          ) : (
            history.map((entry, index) => (
              <li key={`${entry.at}-${index}`} className="px-4 py-3 text-sm">
                <p className="font-medium text-slate-900">
                  {entry.action === "created" && "Created"}
                  {entry.action === "status" &&
                    `Status ${entry.from ? FORM_REQUEST_STATUS_LABEL[entry.from as keyof typeof FORM_REQUEST_STATUS_LABEL] || entry.from : "—"} → ${
                      entry.to ? FORM_REQUEST_STATUS_LABEL[entry.to as keyof typeof FORM_REQUEST_STATUS_LABEL] || entry.to : "—"
                    }`}
                  {entry.action === "assign" && "Assignment updated"}
                  {entry.action === "notes" && "Notes updated"}
                </p>
                <p className="mt-0.5 text-slate-500">
                  {entry.at.slice(0, 19).replace("T", " ")} UTC
                  {entry.actorName ? ` · ${entry.actorName}` : ""}
                </p>
                {entry.note ? <p className="mt-1 text-slate-600">{entry.note}</p> : null}
              </li>
            ))
          )}
        </ul>
      </section>
    </main>
  );
}
