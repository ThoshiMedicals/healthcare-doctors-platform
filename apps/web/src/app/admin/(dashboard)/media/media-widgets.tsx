import Link from "next/link";
import type { MediaLibraryDashboardStats } from "@/cms/media-library-shared";

export function MediaLibraryWidgets({ stats }: { stats: MediaLibraryDashboardStats }) {
  const cards = [
    {
      label: "Media Assets",
      value: stats.total,
      href: "/admin/media",
      hint: "All catalogued clinic images",
    },
    {
      label: "Unused Assets",
      value: stats.unused,
      href: "/admin/media?usage=unused",
      hint: "Not found on published pages",
    },
    {
      label: "Large Files",
      value: stats.largeFiles,
      href: "/admin/media?sort=size",
      hint: "500 KB or larger",
    },
    {
      label: "Missing Alt Text",
      value: stats.missingAlt,
      href: "/admin/media?alt=missing",
      hint: "CMS alt field empty",
    },
    {
      label: "Recent Uploads",
      value: stats.recentUploads,
      href: "/admin/media?sort=uploaded",
      hint: "Added in the last 7 days",
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
