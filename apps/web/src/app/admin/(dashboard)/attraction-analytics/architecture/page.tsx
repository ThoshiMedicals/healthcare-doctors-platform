import Link from "next/link";
import { requireAction } from "@/cms/context";
import {
  ATTRACTION_EVENT_NAMES,
  TRACKED_PRODUCT_SIGNALS,
} from "@/attraction-analytics/event-schema";

export const dynamic = "force-dynamic";

export default async function AttractionAnalyticsArchitecturePage() {
  await requireAction("manage_settings");

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-6">
      <Link href="/admin/attraction-analytics" className="text-sm font-medium underline">
        ← Dashboard
      </Link>
      <header>
        <h1 className="text-3xl font-semibold">Tracking architecture</h1>
        <p className="mt-2 text-sm text-slate-600">
          Attraction Analytics + Knowledge Graph + Content Intelligence. No automated decisions.
        </p>
      </header>

      <pre className="overflow-x-auto rounded-xl border bg-slate-50 p-4 text-xs">{`Client (attraction-track.js)
  → POST /api/attraction-analytics/events
    → GpAttractionEvent (raw)
      → Dashboard aggregate (advisory KPIs)
      → Graph ingest (nodes/edges snapshot)
      → ContentIntelligenceSignalDaily
      → ContentIntelligenceInsightRun (human editor recs)`}</pre>

      <section className="text-sm">
        <h2 className="font-semibold">Tracked product signals</h2>
        <ul className="mt-2 list-disc pl-5">
          {TRACKED_PRODUCT_SIGNALS.map((s) => (
            <li key={s.id}>
              <code>{s.id}</code> — {[...s.events].join(", ")}
            </li>
          ))}
        </ul>
      </section>

      <section className="text-sm">
        <h2 className="font-semibold">Event names</h2>
        <p className="mt-1 text-xs">{ATTRACTION_EVENT_NAMES.join(", ")}</p>
      </section>

      <section className="text-sm">
        <h2 className="font-semibold">Graph ingestion plan</h2>
        <ol className="mt-2 list-decimal space-y-1 pl-5">
          <li>Pull raw events for window (default 28d)</li>
          <li>Aggregate FAQ / readiness / PE / pack / EOI path KPIs</li>
          <li>Emit faq / readiness / eoi_path / intelligence nodes + opens_faq / completes_tool / follows_path / submits_eoi edges</li>
          <li>Persist AttractionKnowledgeGraphSnapshot</li>
          <li>Upsert ContentIntelligenceSignalDaily keys</li>
          <li>Create advisory ContentIntelligenceInsightRun (status proposed — human editors only)</li>
        </ol>
      </section>
    </div>
  );
}
