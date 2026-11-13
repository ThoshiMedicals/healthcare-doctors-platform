import { DemoShell } from "@/engagement-c1/DemoShell";
import { InboxClient } from "@/engagement-c1/InboxClient";

export default async function PatientEngagementDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <DemoShell
      active="inbox"
      title="Notice detail"
      lede="Demonstration detail view. Acknowledgement is stored locally for this prototype only."
    >
      <InboxClient detailId={id} />
    </DemoShell>
  );
}
