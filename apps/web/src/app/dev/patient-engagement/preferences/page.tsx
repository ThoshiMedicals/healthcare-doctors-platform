import { DemoShell } from "@/engagement-c1/DemoShell";
import { PreferencesClient } from "@/engagement-c1/PreferencesClient";

export default function PatientEngagementPreferencesPage() {
  return (
    <DemoShell
      active="preferences"
      title="Notification preferences"
      lede="Choose demonstration topics and review the opt-in explanation. No live browser permission is requested in Phase C1."
    >
      <PreferencesClient />
    </DemoShell>
  );
}
