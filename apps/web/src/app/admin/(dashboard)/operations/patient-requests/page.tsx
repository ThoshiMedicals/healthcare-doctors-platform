import Link from "next/link";
import {
  FORM_REQUEST_STATUS_LABEL,
  FORM_REQUEST_STATUS_OPTIONS,
  FORM_REQUEST_TYPES,
  OVERDUE_AFTER_DAYS,
  isFormRequestStatus,
  patientRequestDashboardStats,
  patientRequestWhere,
  type PatientRequestListFilters,
} from "@/cms/patient-requests";
import { requireAction } from "@/cms/context";
import { plainText } from "@/cms/staff-labels";
import { prisma } from "@/db/prisma";
import { PatientRequestWidgets } from "../patient-request-widgets";

export const dynamic = "force-dynamic";

function parseFilters(query: Record<string, string | undefined>): PatientRequestListFilters {
  const statusRaw = query.status?.trim() || "all";
  return {
    q: query.q?.trim() || undefined,
    status: statusRaw === "all" || !statusRaw ? "all" : isFormRequestStatus(statusRaw) ? statusRaw : "all",
    formType: query.formType?.trim() || "all",
    assignedToUserId: query.assignedToUserId?.trim() || "all",
    from: query.from?.trim() || undefined,
    to: query.to?.trim() || undefined,
  };
}

export default async function PatientRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    status?: string;
    formType?: string;
    assignedToUserId?: string;
    from?: string;
    to?: string;
  }>;
}) {
  const query = await searchParams;
  const { clinic } = await requireAction("edit");
  const filters = parseFilters(query);
  const overdueBefore = new Date(Date.now() - OVERDUE_AFTER_DAYS * 86_400_000);

  const [stats, staff, rows] = await Promise.all([
    patientRequestDashboardStats(clinic.id),
    prisma.clinicMembership.findMany({
      where: { clinicId: clinic.id },
      include: { user: { select: { id: true, name: true, email: true, username: true, disabledAt: true } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.formRequest.findMany({
      where: patientRequestWhere(clinic.id, filters),
      orderBy: { createdAt: "desc" },
      take: 250,
      include: {
        assignedTo: { select: { name: true, email: true, username: true } },
      },
    }),
  ]);

  const assignees = staff.map((row) => row.user).filter((user) => !user.disabledAt);

  return (
    <main>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Operations</p>
          <h1 className="text-2xl font-semibold">Patient Requests</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Reception inbox for website form requests — registration, records, contact, and feedback. Not a clinical
            messaging system.
          </p>
        </div>
      </div>

      <PatientRequestWidgets stats={stats} />

      <form className="mt-6 grid gap-3 rounded border border-slate-200 bg-white p-4 md:grid-cols-6" method="get">
        <label className="flex flex-col gap-1 text-sm text-slate-700 md:col-span-2">
          Search
          <input
            className="rounded border border-slate-300 px-3 py-2"
            name="q"
            type="search"
            defaultValue={filters.q ?? ""}
            placeholder="Name, email, phone…"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-700">
          Status
          <select className="rounded border border-slate-300 px-3 py-2" name="status" defaultValue={filters.status ?? "all"}>
            <option value="all">All statuses</option>
            {FORM_REQUEST_STATUS_OPTIONS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-700">
          Request type
          <select
            className="rounded border border-slate-300 px-3 py-2"
            name="formType"
            defaultValue={filters.formType ?? "all"}
          >
            <option value="all">All types</option>
            {FORM_REQUEST_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-700">
          Assignee
          <select
            className="rounded border border-slate-300 px-3 py-2"
            name="assignedToUserId"
            defaultValue={filters.assignedToUserId ?? "all"}
          >
            <option value="all">Anyone</option>
            <option value="unassigned">Unassigned</option>
            {assignees.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name || user.email || user.username || user.id}
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
        <div className="flex items-end gap-2 md:col-span-6">
          <button className="rounded bg-slate-900 px-3 py-2 text-sm font-medium text-white" type="submit">
            Apply filters
          </button>
          <Link href="/admin/operations/patient-requests" className="rounded border border-slate-300 px-3 py-2 text-sm">
            Clear
          </Link>
        </div>
      </form>

      <div className="mt-4 overflow-x-auto rounded border border-slate-200 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-2 font-semibold">Date</th>
              <th className="px-3 py-2 font-semibold">Patient name</th>
              <th className="px-3 py-2 font-semibold">Email</th>
              <th className="px-3 py-2 font-semibold">Phone</th>
              <th className="px-3 py-2 font-semibold">Request type</th>
              <th className="px-3 py-2 font-semibold">Delivery</th>
              <th className="px-3 py-2 font-semibold">Status</th>
              <th className="px-3 py-2 font-semibold">Assigned to</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.length === 0 ? (
              <tr>
                <td className="px-3 py-4 text-slate-600" colSpan={8}>
                  No patient requests match these filters.
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const overdue =
                  ["new", "assigned", "in_progress", "waiting_for_patient"].includes(row.status) &&
                  row.createdAt < overdueBefore;
                const assignee =
                  row.assignedTo?.name || row.assignedTo?.email || row.assignedTo?.username || "Unassigned";
                return (
                  <tr key={row.id} className="hover:bg-slate-50">
                    <td className="px-3 py-2 whitespace-nowrap">
                      <Link className="font-medium text-slate-900 underline-offset-2 hover:underline" href={`/admin/operations/patient-requests/${row.id}`}>
                        {row.createdAt.toISOString().slice(0, 10)}
                      </Link>
                      {overdue ? <span className="mt-0.5 block text-xs text-amber-700">Overdue</span> : null}
                    </td>
                    <td className="px-3 py-2">{plainText(row.name)}</td>
                    <td className="px-3 py-2">{row.email || "—"}</td>
                    <td className="px-3 py-2">{row.phone || "—"}</td>
                    <td className="px-3 py-2">{plainText(row.formType)}</td>
                    <td className="px-3 py-2">{row.delivery || "—"}</td>
                    <td className="px-3 py-2">{FORM_REQUEST_STATUS_LABEL[row.status]}</td>
                    <td className="px-3 py-2">{assignee}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
