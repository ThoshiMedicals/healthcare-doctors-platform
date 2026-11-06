import Link from "next/link";
import type { PatientRequestDashboardStats } from "@/cms/patient-requests";

export function PatientRequestWidgets({ stats }: { stats: PatientRequestDashboardStats }) {
  const cards = [
    {
      label: "New requests",
      value: stats.newToday,
      href: "/admin/operations/patient-requests?status=new",
      hint: "Submitted today (UTC)",
    },
    {
      label: "Assigned",
      value: stats.assigned,
      href: "/admin/operations/patient-requests?status=assigned",
      hint: "Assigned or in progress",
    },
    {
      label: "Waiting for patient",
      value: stats.waitingForPatient,
      href: "/admin/operations/patient-requests?status=waiting_for_patient",
      hint: "Blocked on patient reply",
    },
    {
      label: "Overdue",
      value: stats.overdue,
      href: "/admin/operations/patient-requests",
      hint: "Open longer than 3 days",
    },
    {
      label: "Closed this week",
      value: stats.closedThisWeek,
      href: "/admin/operations/patient-requests?status=closed",
      hint: "Completed or closed (7d)",
    },
  ] as const;

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {cards.map((card) => (
        <Link
          key={card.label}
          href={card.href}
          className="rounded border border-slate-200 bg-white px-4 py-3 hover:border-slate-400"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{card.label}</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{card.value}</p>
          <p className="mt-1 text-xs text-slate-500">{card.hint}</p>
        </Link>
      ))}
    </div>
  );
}
