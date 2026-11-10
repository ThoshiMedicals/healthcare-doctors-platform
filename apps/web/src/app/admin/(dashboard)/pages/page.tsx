import Link from "next/link";
import { redirect } from "next/navigation";
import { roleAllows } from "@/auth/permissions";
import { editorContext } from "@/cms/context";
import { prisma } from "@/db/prisma";

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
  const { clinic, role } = await editorContext();
  if (
    !clinic ||
    !role ||
    !(roleAllows(role, "edit") || roleAllows(role, "unpublish_page") || roleAllows(role, "publish"))
  ) {
    redirect("/admin");
  }

  const pages = await prisma.page.findMany({
    where: { clinicId: clinic.id },
    select: { id: true, path: true, title: true, status: true, indexable: true },
    orderBy: { path: "asc" },
    take: 80,
  });

  return (
    <main>
      <h1 className="text-2xl font-semibold">Pages</h1>
      <p className="mt-2 max-w-2xl text-sm text-slate-600">
        Edit published page content, SEO, and public lifecycle. Layout, footer, and booking controls stay as approved on
        the public site.
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

      <h2 className="mt-10 text-lg font-semibold">Public page lifecycle &amp; SEO</h2>
      <p className="mt-1 max-w-2xl text-sm text-slate-600">
        Unpublish, archive, restore, draft preview, and governed SEO for imported public paths.
      </p>
      <ul className="mt-4 divide-y divide-slate-100 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        {pages.map((page) => (
          <li key={page.id}>
            <Link href={`/admin/pages/${page.id}`} className="block px-4 py-3 hover:bg-slate-50">
              <span className="font-medium text-slate-900">{page.title}</span>
              <p className="mt-0.5 text-sm text-slate-500">
                {page.path} · {page.status}
                {page.indexable ? "" : " · noindex"}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
