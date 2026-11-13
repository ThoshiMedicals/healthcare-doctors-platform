import Link from "next/link";
import { C1_DEMO_BANNER } from "@/engagement-c1/prototype-gate";

const LINKS = [
  { href: "/admin/engagement-lab", label: "Overview" },
  { href: "/admin/engagement-lab/announcements", label: "Announcements" },
  { href: "/admin/engagement-lab/announcements/new", label: "Create" },
  { href: "/admin/engagement-lab/subscribers", label: "Subscribers" },
  { href: "/admin/engagement-lab/delivery", label: "Delivery" },
  { href: "/admin/engagement-lab/costs", label: "SMS savings" },
] as const;

export function EngagementLabChrome({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div
        className="rounded-lg border-2 border-amber-700 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-950"
        role="status"
      >
        {C1_DEMO_BANNER} No send / publish / push actions are operational.
      </div>
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-800">
          Patient Engagement · UI lab
        </p>
        <h1 className="text-3xl font-semibold text-slate-900">{title}</h1>
        <p className="max-w-3xl text-sm text-slate-600">
          Prototype screens using labelled dummy data. Auth and clinic scoping follow existing CMS
          patterns. Database migrations and Web Push are out of scope for C1.
        </p>
      </header>
      <nav aria-label="Engagement lab" className="flex flex-wrap gap-2">
        {LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="inline-flex min-h-11 items-center rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-800 hover:bg-slate-50"
          >
            {link.label}
          </Link>
        ))}
        <Link
          href="/dev/patient-engagement/inbox"
          className="inline-flex min-h-11 items-center rounded-lg border border-teal-700 px-3 text-sm font-medium text-teal-900"
        >
          Open patient demo
        </Link>
      </nav>
      {children}
    </div>
  );
}
