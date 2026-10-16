import { requireAction } from "@/cms/context";
import { publicationLabel } from "@/cms/modules";
import { plainText } from "@/cms/staff-labels";
import { prisma } from "@/db/prisma";
import { RecordList } from "../ui";

export const dynamic = "force-dynamic";

export default async function UpdatesPage() {
  const { clinic } = await requireAction("edit");
  const rows = await prisma.practiceUpdate.findMany({
    where: { clinicId: clinic.id },
    orderBy: { title: "asc" },
    select: { id: true, title: true, status: true, slug: true },
  });
  return (
    <RecordList
      title="Updates"
      intro="Practice update titles, summaries, and authors. The public update pages keep their imported URLs."
      rows={rows.map((row) => ({ href: `/admin/updates/${row.id}`, title: plainText(row.title), meta: publicationLabel(row.status) }))}
    />
  );
}
