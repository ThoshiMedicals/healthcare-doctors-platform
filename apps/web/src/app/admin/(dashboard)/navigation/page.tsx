import { requireAction } from "@/cms/context";
import { publicPageName } from "@/cms/staff-labels";
import { prisma } from "@/db/prisma";

export const dynamic = "force-dynamic";

export default async function NavigationPage() {
  const { clinic } = await requireAction("edit");
  const items = await prisma.navigationItem.findMany({
    where: { clinicId: clinic.id },
    orderBy: { sortOrder: "asc" },
  });
  const ownership = await prisma.navigationOwnership.findMany({
    where: { page: { clinicId: clinic.id } },
    include: { page: { select: { path: true, title: true } } },
    orderBy: { page: { path: "asc" } },
  });

  return (
    <main>
      <h1 className="text-2xl font-semibold">Navigation ownership</h1>
      <p className="mt-2 max-w-2xl text-sm text-slate-600">
        Read only. Navigation structure is part of the frozen website and cannot be edited here.
      </p>
      <h2 className="mt-8 text-lg font-semibold">Primary navigation</h2>
      <ol className="mt-3 divide-y divide-slate-200 rounded border border-slate-200 bg-white">
        {items.map((item) => (
          <li key={item.id} className="flex justify-between px-4 py-3 text-sm">
            <span>{item.label}</span>
            <span className="text-slate-500">{publicPageName(item.href)}</span>
          </li>
        ))}
      </ol>
      <h2 className="mt-8 text-lg font-semibold">Page ownership</h2>
      <ul className="mt-3 divide-y divide-slate-200 rounded border border-slate-200 bg-white">
        {ownership.map((row) => (
          <li key={row.id} className="flex justify-between gap-4 px-4 py-3 text-sm">
            <span>{publicPageName(row.page.path)}</span>
            <span className="text-slate-500">
              {row.sectionKey}
              {row.isHub ? " · hub" : ""}
            </span>
          </li>
        ))}
      </ul>
    </main>
  );
}
