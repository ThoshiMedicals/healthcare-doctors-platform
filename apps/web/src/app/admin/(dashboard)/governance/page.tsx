import Link from "next/link";
import { requireAction } from "@/cms/context";
import { publicPageName } from "@/cms/staff-labels";
import { prisma } from "@/db/prisma";

export const dynamic = "force-dynamic";

export default async function GovernancePage() {
  const { clinic } = await requireAction("clinical_signoff");
  const rows = await prisma.clinicalReview.findMany({
    where: { clinicId: clinic.id },
    include: { page: { select: { path: true, title: true } } },
    orderBy: { page: { path: "asc" } },
  });

  return (
    <main>
      <h1 className="text-2xl font-semibold">Governance review</h1>
      <p className="mt-2 max-w-2xl text-sm text-slate-600">
        A review can be marked approved or published only after the reviewer, approver, approval date,
        evidence reference, and content fingerprint are recorded.
      </p>
      <ul className="mt-6 divide-y divide-slate-200 rounded border border-slate-200 bg-white">
        {rows.map((row) => (
          <li key={row.id}>
            <Link href={`/admin/governance/${row.id}`} className="flex justify-between gap-4 px-4 py-3 text-sm hover:bg-slate-50">
              <span>{publicPageName(row.page.path)}</span>
              <span className="text-slate-500">{row.status.replaceAll("_", " ")}</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
