import { requireAction } from "@/cms/context";
import { publicationLabel } from "@/cms/modules";
import { ensurePracticePages } from "@/cms/practice-pages";
import { listPageName } from "@/cms/staff-labels";
import { RecordList } from "../ui";

export const dynamic = "force-dynamic";

export default async function AboutPage() {
  const { clinic } = await requireAction("edit");
  const rows = await ensurePracticePages(clinic.id, "about");
  return (
    <RecordList
      title="About Us"
      intro="About Us pages. Introduction, philosophy, story, community, accreditation, network, and careers text can be edited and published. The public layout stays in place."
      rows={rows.map((row) => ({
        href: `/admin/about/${row.id}`,
        title: listPageName(row.title, row.page?.path ?? `${row.slug}.html`),
        meta: publicationLabel(row.status),
      }))}
    />
  );
}
