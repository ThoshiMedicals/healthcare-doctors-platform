import { DemoShell } from "@/engagement-c1/DemoShell";
import { InboxClient } from "@/engagement-c1/InboxClient";

export default function PatientEngagementInboxPage() {
  return (
    <DemoShell
      active="inbox"
      title="Practice notices"
      lede="Demonstration inbox with labelled dummy notices. Read and unread states stay on this device only."
    >
      <InboxClient />
    </DemoShell>
  );
}
