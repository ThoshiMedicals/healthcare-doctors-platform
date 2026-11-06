import Link from "next/link";
import type { CareerApplicationDashboardStats } from "@/cms/careers-applications";

export function CareersWidgets({ stats }: { stats: CareerApplicationDashboardStats }) {
  const cards = [
    {
      label: "Open vacancies",
      value: stats.openVacancies,
      href: "/admin/careers/vacancies",
      hint: "Active roles on Join Our Team",
    },
    {
      label: "Applications today",
      value: stats.applicationsToday,
      href: "/admin/careers/applications",
      hint: "Submitted today",
    },
    {
      label: "Awaiting review",
      value: stats.awaitingReview,
      href: "/admin/careers/applications?status=reviewing",
      hint: "New + reviewing",
    },
    {
      label: "Interviews",
      value: stats.interviews,
      href: "/admin/careers/applications?status=interview",
      hint: "Interview stage",
    },
    {
      label: "Hired this month",
      value: stats.hiredThisMonth,
      href: "/admin/careers/applications?status=hired",
      hint: "Status updated this month",
    },
  ] as const;

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {cards.map((card) => (
        <Link
          key={card.href}
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
