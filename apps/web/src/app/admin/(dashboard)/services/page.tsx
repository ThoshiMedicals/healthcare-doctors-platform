import { requireAction } from "@/cms/context";
import { publicationLabel } from "@/cms/modules";
import { plainText } from "@/cms/staff-labels";
import { prisma } from "@/db/prisma";
import { RecordList } from "../ui";

export const dynamic = "force-dynamic";

export default async function ServicesPage() {
  const { clinic } = await requireAction("edit");
  const rows = await prisma.service.findMany({
    where: { clinicId: clinic.id },
    orderBy: { title: "asc" },
    select: { id: true, title: true, status: true },
  });
  return (
    <RecordList
      title="Services"
      intro="Service titles and summaries. The public service pages keep their imported design and URLs."
      rows={rows.map((row) => ({ href: `/admin/services/${row.id}`, title: plainText(row.title), meta: publicationLabel(row.status) }))}
    />
  );
}
