import Link from "next/link";
import { DemoShell } from "@/engagement-c1/DemoShell";

export default function PatientEngagementEligibilityPage() {
  return (
    <DemoShell
      active="eligibility"
      title="Installation and notification eligibility"
      lede="Clear guidance for when practice updates could work on a phone — demonstration copy only."
    >
      <section className="wmc-c1-panel">
        <h2>Before notifications can work</h2>
        <ol style={{ margin: 0, paddingLeft: "1.2rem", lineHeight: 1.5 }}>
          <li>Install or open the WMC Patient App / site on your phone.</li>
          <li>On iPhone, use Safari and Add to Home Screen for the best support.</li>
          <li>Choose topics in Preferences.</li>
          <li>Only later (not in this demo) would the browser ask for notification permission.</li>
        </ol>
      </section>
      <section className="wmc-c1-panel">
        <h2>Android</h2>
        <p style={{ margin: 0, lineHeight: 1.5 }}>
          Chrome and many Android browsers can show an install option. Notifications need permission
          after you opt in. If permission is denied, you can still read notices in the inbox.
        </p>
      </section>
      <section className="wmc-c1-panel">
        <h2>iPhone</h2>
        <p style={{ margin: 0, lineHeight: 1.5 }}>
          Web Push usually requires a Home Screen web app on supported iOS versions. Without that,
          use the inbox and public website. Reception can help: (07) 3217 3344.
        </p>
      </section>
      <section className="wmc-c1-panel">
        <h2>Always available without push</h2>
        <p style={{ margin: 0, lineHeight: 1.5 }}>
          Booking, Preferred GP, Digital Reception and practice information stay available in the{" "}
          <Link href="/patient-hub.html">Patient Hub</Link>. HotDoc keeps appointment reminders.
        </p>
      </section>
      <div className="wmc-c1-detail-actions">
        <Link className="wmc-c1-btn wmc-c1-btn-primary" href="/install-wmc-app.html">
          Open install guide
        </Link>
        <Link className="wmc-c1-btn" href="/dev/patient-engagement/preferences">
          Review preferences
        </Link>
      </div>
    </DemoShell>
  );
}
