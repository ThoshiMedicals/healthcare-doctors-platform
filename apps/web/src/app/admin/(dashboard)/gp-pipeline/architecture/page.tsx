import Link from "next/link";
import { requireAction } from "@/cms/context";
import { API_INTEGRATIONS, PIPELINE_STAGES } from "@/gp-pipeline/workflow-map";
import { PIPELINE_NOTIFICATION_CATALOG } from "@/gp-pipeline/notifications";

export const dynamic = "force-dynamic";

export default async function GpPipelineArchitecturePage() {
  await requireAction("edit");

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-6">
      <Link href="/admin/gp-pipeline" className="text-sm font-medium underline">
        ← Pipeline
      </Link>
      <header>
        <h1 className="text-3xl font-semibold">Workflow implementation map</h1>
        <p className="mt-2 text-sm text-slate-600">
          Proposal-only connections. No new workflow concepts.
        </p>
      </header>

      <pre className="overflow-x-auto rounded-xl border bg-slate-50 p-4 text-xs">{`Doctor Readiness
  → EOI (GpEnquiry)
    → Session Matching (advisory)
      → Onboarding (human gates)
        → First 90 Days (after go_live)`}</pre>

      <section className="space-y-3 text-sm">
        <h2 className="font-semibold">Stages</h2>
        <ul className="space-y-2">
          {PIPELINE_STAGES.map((s) => (
            <li key={s.id} className="rounded border p-3">
              <p className="font-medium">{s.label}</p>
              <p className="text-xs text-slate-500">{s.proposal}</p>
              <p className="text-xs">
                Model: <code>{s.model}</code>
              </p>
              <p className="mt-1">{s.rule}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-2 text-sm">
        <h2 className="font-semibold">API integrations</h2>
        <ul className="list-disc space-y-1 pl-5">
          {API_INTEGRATIONS.map((a) => (
            <li key={a.path}>
              <code>
                {a.method} {a.path}
              </code>{" "}
              — {a.connects}
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-2 text-sm">
        <h2 className="font-semibold">Notifications (never approvals)</h2>
        <ul className="list-disc pl-5">
          {PIPELINE_NOTIFICATION_CATALOG.map((n) => (
            <li key={n.id}>
              <code>{n.id}</code> → {n.recipients.join(", ")}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
