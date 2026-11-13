import { DEMO_DASHBOARD, DEMO_ANNOUNCEMENTS, DEMO_SUBSCRIBERS } from "@/engagement-c1/dummy-data";
import { DemoShell } from "@/engagement-c1/DemoShell";

/**
 * Visual QA mirror of admin engagement surfaces without Auth.js session.
 * Live staff workflows remain at /admin/engagement-lab (requireAction).
 */
export default function StaffPreviewPage() {
  return (
    <DemoShell
      active="inbox"
      title="Staff UI preview (no auth)"
      lede="Demonstration mirror of Engagement Admin metrics for C1 screenshots. Real staff routes stay behind Auth.js at /admin/engagement-lab."
    >
      <section className="wmc-c1-panel">
        <h2>Dashboard cards (dummy)</h2>
        <ul style={{ margin: 0, paddingLeft: "1.1rem", lineHeight: 1.5 }}>
          <li>Devices with active push subscription: {DEMO_DASHBOARD.activePushSubscriptions}</li>
          <li>
            Installations with operational consent:{" "}
            {DEMO_DASHBOARD.installationsWithOperationalConsent}
          </li>
          <li>
            Accepted by push service (not proof of read):{" "}
            {DEMO_DASHBOARD.pushAcceptedNotProofOfRead}
          </li>
          <li>Estimate — see methodology: ${DEMO_DASHBOARD.estimatedSmsAvoidedAud.toFixed(2)}</li>
        </ul>
      </section>
      <section className="wmc-c1-panel">
        <h2>Announcement workflow statuses</h2>
        <ul style={{ margin: 0, paddingLeft: "1.1rem", lineHeight: 1.5 }}>
          {DEMO_ANNOUNCEMENTS.map((row) => (
            <li key={row.id}>
              <strong>{row.status}</strong> — {row.title}
            </li>
          ))}
        </ul>
      </section>
      <section className="wmc-c1-panel">
        <h2>Subscribers (device keys only)</h2>
        <ul style={{ margin: 0, paddingLeft: "1.1rem", lineHeight: 1.5 }}>
          {DEMO_SUBSCRIBERS.map((row) => (
            <li key={row.installationKeyPrefix}>
              {row.installationKeyPrefix} · {row.status}
            </li>
          ))}
        </ul>
      </section>
    </DemoShell>
  );
}
