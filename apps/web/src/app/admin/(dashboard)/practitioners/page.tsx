import { requireAction } from "@/cms/context";
import { publicationLabel } from "@/cms/modules";
import { plainText } from "@/cms/staff-labels";
import { prisma } from "@/db/prisma";
import { RecordList } from "../ui";

export const dynamic = "force-dynamic";

export default async function PractitionersPage() {
  const { clinic } = await requireAction("edit");
  const rows = await prisma.practitioner.findMany({
    where: { clinicId: clinic.id },
    orderBy: { name: "asc" },
    select: { id: true, name: true, status: true, slug: true },
  });

  return (
    <RecordList
      title="Practitioners"
      intro="Name, qualifications, biography, languages, interests, photo, and HotDoc URL. Profile page design stays as imported."
      rows={rows.map((row) => ({
        href: `/admin/practitioners/${row.id}`,
        title: plainText(row.name),
        meta: publicationLabel(row.status),
      }))}
    />
  );
}
