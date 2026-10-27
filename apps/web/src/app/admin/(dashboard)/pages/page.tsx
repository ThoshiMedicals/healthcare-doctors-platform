import Link from "next/link";
import { requireAction } from "@/cms/context";

export const dynamic = "force-dynamic";

const PAGE_COLLECTIONS = [
  {
    href: "/admin/knowledge",
    label: "Knowledge Centre",
    description: "Condition and topic pages for patient education.",
  },
  {
    href: "/admin/updates",
    label: "Updates",
    description: "Practice news and timed announcements.",
  },
  {
    href: "/admin/patient-information",
    label: "Patient Information",
    description: "Guides, posters, and operational patient materials.",
  },
  {
    href: "/admin/about",
    label: "About Us",
    description: "Practice story, philosophy, and community pages.",
  },
  {
    href: "/admin/navigation",
    label: "Navigation Ownership",
    description: "Assign ownership for primary navigation destinations.",
  },
] as const;

export default async function PagesHubPage() {
  await requireAction("edit");

  return (
    <main>
      <h1 className="text-2xl font-semibold">Pages</h1>
      <p className="mt-2 max-w-2xl text-sm text-slate-600">
        Edit published page content. Layout, footer, and booking controls stay as approved on the public site.
      </p>
      <ul className="mt-8 divide-y divide-slate-100 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        {PAGE_COLLECTIONS.map((item) => (
          <li key={item.href}>
            <Link href={item.href} className="block px-4 py-3 hover:bg-slate-50">
              <span className="font-medium text-slate-900">{item.label}</span>
              <p className="mt-0.5 text-sm text-slate-500">{item.description}</p>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
