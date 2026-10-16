import { requireAction } from "@/cms/context";
import { publicationLabel } from "@/cms/modules";
import { ensurePracticePages } from "@/cms/practice-pages";
import { listPageName } from "@/cms/staff-labels";
import { RecordList } from "../ui";

export const dynamic = "force-dynamic";

export default async function PatientInformationPage() {
  const { clinic } = await requireAction("edit");
  const rows = await ensurePracticePages(clinic.id, "patient-info");
  return (
    <RecordList
      title="Patient information"
      intro="Patient information pages. New patients, fees, Medicare, bulk billing, referrals, scripts, results, forms, after-hours care, and FAQs can be edited and published. The public layout stays in place."
      rows={rows.map((row) => ({
        href: `/admin/patient-information/${row.id}`,
        title: listPageName(row.title, row.page?.path ?? `${row.slug}.html`),
        meta: publicationLabel(row.status),
      }))}
    />
  );
}
