import { requireAction } from "@/cms/context";
import { DEMO_DASHBOARD, DEMO_ANNOUNCEMENTS } from "@/engagement-c1/dummy-data";
import { EngagementLabChrome } from "./lab-chrome";

export default async function EngagementLabOverviewPage() {
  await requireAction("edit");
  const metrics = [
    {
      label: "Devices with active push subscription",
      value: DEMO_DASHBOARD.activePushSubscriptions,
      hint: "Demonstration count — not live devices",
    },
    {
      label: "Installations with operational consent",
      value: DEMO_DASHBOARD.installationsWithOperationalConsent,
      hint: "Demonstration opt-in rate numerator",
    },
    {
      label: "Published announcements (30d)",
      value: DEMO_DASHBOARD.publishedLast30Days,
      hint: "From dummy catalogue",
    },
    {
      label: "Accepted by push service (not proof of read)",
      value: DEMO_DASHBOARD.pushAcceptedNotProofOfRead,
      hint: "Honest label required in production",
    },
    {
      label: "Inbox opens (device events)",
      value: DEMO_DASHBOARD.inboxOpensDeviceEvents,
      hint: "Anonymous device-scoped",
    },
    {
      label: "Explicit Got it taps",
      value: DEMO_DASHBOARD.explicitGotItTaps,
      hint: "Not patient identity verification",
    },
    {
      label: "Estimate — see methodology (AUD)",
      value: DEMO_DASHBOARD.estimatedSmsAvoidedAud.toFixed(2),
      hint: "Demonstration SMS savings figure",
    },
  ] as const;

  return (
    <EngagementLabChrome title="Engagement dashboard">
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {metrics.map((card) => (
          <article key={card.label} className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{card.label}</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{card.value}</p>
            <p className="mt-1 text-xs text-slate-500">{card.hint}</p>
          </article>
        ))}
      </section>
      <section className="rounded-xl border border-slate-200 bg-white p-4 text-sm">
        <h2 className="font-semibold text-slate-900">Workflow snapshot (dummy)</h2>
        <ul className="mt-2 space-y-1 text-slate-700">
          {DEMO_ANNOUNCEMENTS.map((row) => (
            <li key={row.id}>
              <span className="font-medium">{row.status}</span> — {row.title}
            </li>
          ))}
        </ul>
      </section>
    </EngagementLabChrome>
  );
}
