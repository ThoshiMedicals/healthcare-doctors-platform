import Link from "next/link";
import { requireAction } from "@/cms/context";
import { getAttractionAnalyticsDashboard } from "@/attraction-analytics/dashboard";
import { GraphIngestButton } from "./graph-ingest-button";
import { SeedAnalyticsDemoButton } from "./seed-demo-button";

export const dynamic = "force-dynamic";

function priorityClass(priority: string) {
  if (priority === "high") return "border-amber-300 bg-amber-50 text-amber-950";
  if (priority === "medium") return "border-slate-200 bg-slate-50 text-slate-800";
  return "border-slate-100 bg-white text-slate-700";
}

export default async function AttractionAnalyticsPage() {
  const { clinic } = await requireAction("manage_settings");
  const dash = await getAttractionAnalyticsDashboard(clinic.id, 28);

  const kpiTiles: Array<[string, number | string]> = [
    ["Join Our Team visits", dash.kpis.joinOurTeamVisits],
    ["Join sessions", dash.kpis.joinOurTeamSessions],
    ["Join → Opportunity", dash.kpis.joinToOpportunity],
    ["Opportunity → EOI", dash.kpis.opportunityToEoiRate],
    ["GP Opportunities sessions", dash.kpis.opportunitiesVisits],
    ["Opportunity card opens", dash.kpis.jobCardOpens],
    ["FAQ opens", dash.kpis.faqOpens],
    ["Pack downloads", dash.kpis.opportunityPackDownloads],
    ["EOI submissions", dash.kpis.eoiSubmissions],
    ["Join → EOI", dash.kpis.overallJoinToEoi],
  ];

  const oppSummary: Array<[string, number | string]> = [
    ["Opportunity Views", dash.kpis.opportunityViews],
    ["Unique Visitors", dash.kpis.uniqueOpportunityVisitors],
    ["Pack Downloads", dash.kpis.opportunityPackDownloads],
    ["EOI Starts", dash.kpis.eoiStarts],
    ["EOI Submissions", dash.kpis.eoiSubmissions],
    ["Opp → EOI %", dash.kpis.opportunityToEoiRate],
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-800">
          Insights · Attraction
        </p>
        <h1 className="text-3xl font-semibold text-slate-900">GP Attraction Analytics</h1>
        <p className="max-w-3xl text-sm text-slate-600">{dash.decisionNotice}</p>
        <p className="text-xs text-slate-500">
          Window: last {dash.windowDays} days · {dash.eventCount} events · clinic{" "}
          <code>{clinic.slug}</code>
        </p>
        <p className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-950">
          Read-only insights · human review required · no auto-publish
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <SeedAnalyticsDemoButton />
        <p className="text-xs text-slate-500">
          Localhost: seed demo data, then refresh. Live pages also emit via{" "}
          <code>attraction-track.js</code> on :3000 / :3100.
        </p>
      </div>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-slate-900">Tracked signals</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {kpiTiles.map(([label, value]) => (
            <div key={String(label)} className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs text-slate-500">{label}</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">{value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-slate-900">Funnel conversion (28d)</h2>
        <p className="mt-1 text-sm text-slate-600">
          Join → FAQ → Readiness → GP Opportunities → Pack → EOI. Overall Join → EOI:{" "}
          <strong>{dash.kpis.overallJoinToEoi}</strong>
        </p>
        <ol className="mt-4 space-y-3">
          {dash.funnel.map((step, i) => {
            const max = Math.max(...dash.funnel.map((s) => s.sessions), 1);
            const width = Math.max(8, Math.round((100 * step.sessions) / max));
            return (
              <li key={step.id}>
                <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
                  <span className="font-medium text-slate-800">
                    {i + 1}. {step.label}
                  </span>
                  <span className="tabular-nums text-slate-600">{step.sessions} sessions</span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded bg-slate-100">
                  <div className="h-full rounded bg-emerald-700" style={{ width: `${width}%` }} />
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-semibold text-slate-900">Drop-off analysis</h2>
          <p className="mt-1 text-sm text-slate-600">Step-to-step leakage on the primary funnel.</p>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[28rem] text-left text-sm">
              <thead>
                <tr className="border-b text-xs uppercase tracking-wide text-slate-500">
                  <th className="py-2 pr-2">From → To</th>
                  <th className="py-2 pr-2">Conv.</th>
                  <th className="py-2">Drop-off</th>
                </tr>
              </thead>
              <tbody>
                {dash.dropOff.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-3 text-slate-500">
                      No funnel steps yet — seed demo data.
                    </td>
                  </tr>
                )}
                {dash.dropOff.map((row) => (
                  <tr key={`${row.from}-${row.to}`} className="border-b border-slate-100">
                    <td className="py-2 pr-2">
                      <span className="text-slate-800">{row.from}</span>
                      <span className="text-slate-400"> → </span>
                      <span className="text-slate-800">{row.to}</span>
                      <p className="text-xs text-slate-500">
                        {row.fromSessions} → {row.toSessions}
                        {row.severity && row.severity !== "ok" ? (
                          <span className="ml-2 uppercase tracking-wide text-amber-800">
                            · {row.severity}
                          </span>
                        ) : null}
                      </p>
                    </td>
                    <td className="py-2 pr-2 tabular-nums text-emerald-800">{row.conversion}</td>
                    <td className="py-2 tabular-nums text-amber-900">{row.dropOff}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-semibold text-slate-900">Tool completion drop-off</h2>
          <p className="mt-1 text-sm text-slate-600">
            Readiness, Session Planner, and Provider Number tools.
          </p>
          <ul className="mt-3 space-y-3 text-sm">
            {dash.toolFunnel.map((t) => (
              <li key={t.id} className="rounded-lg border border-slate-100 p-3">
                <p className="font-medium text-slate-900">{t.label}</p>
                <p className="text-xs text-slate-500">
                  Starts {t.starts} · Completes {t.completes} · Conv {t.conversion} · Drop{" "}
                  {t.dropOff}
                </p>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-slate-900">GP Opportunities Performance</h2>
        <p className="mt-1 text-sm text-slate-600">
          Opportunity-level interest and conversion — advisory only; no candidate scoring or ranking.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {oppSummary.map(([label, value]) => (
            <div key={String(label)} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
              <p className="text-xs text-slate-500">{label}</p>
              <p className="mt-1 text-xl font-semibold text-slate-900">{value}</p>
            </div>
          ))}
        </div>
        {dash.opportunityPerformance.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">
            No opportunity card events yet — open roles on GP Opportunities or seed demo data.
          </p>
        ) : (
          <div className="mt-4 space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[40rem] text-left text-sm">
                <thead>
                  <tr className="border-b text-xs uppercase tracking-wide text-slate-500">
                    <th className="py-2 pr-2">Opportunity</th>
                    <th className="py-2 pr-2">Views</th>
                    <th className="py-2 pr-2">Pack</th>
                    <th className="py-2 pr-2">EOI Starts</th>
                    <th className="py-2 pr-2">EOIs</th>
                    <th className="py-2">Conversion</th>
                  </tr>
                </thead>
                <tbody>
                  {dash.opportunityPerformance.map((row) => (
                    <tr key={`tbl-${row.opportunityId}`} className="border-b border-slate-100">
                      <td className="py-2 pr-2">
                        <p className="font-medium text-slate-900">{row.opportunityType}</p>
                        <p className="font-mono text-[11px] text-slate-400">{row.opportunityId}</p>
                      </td>
                      <td className="py-2 pr-2 tabular-nums">{row.views}</td>
                      <td className="py-2 pr-2 tabular-nums">{row.packDownloads}</td>
                      <td className="py-2 pr-2 tabular-nums">{row.eoiStarts}</td>
                      <td className="py-2 pr-2 tabular-nums">{row.eoiSubmissions}</td>
                      <td className="py-2 tabular-nums text-emerald-800">{row.conversionToEoi}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-1 text-xs text-slate-500">Sorted by conversion (desc).</p>
            </div>
            {dash.opportunityPerformance.map((row) => (
              <div key={row.opportunityId} className="rounded-lg border border-slate-100 p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div>
                    <p className="font-medium text-slate-900">{row.opportunityType}</p>
                    <p className="font-mono text-[11px] text-slate-400">{row.opportunityId}</p>
                  </div>
                  <p className="text-sm text-emerald-800">
                    Opp → EOI <strong>{row.conversionToEoi}</strong>
                  </p>
                </div>
                <dl className="mt-3 grid gap-2 sm:grid-cols-3 lg:grid-cols-6 text-sm">
                  <div>
                    <dt className="text-xs text-slate-500">Views</dt>
                    <dd className="tabular-nums font-semibold">{row.views}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">Unique viewers</dt>
                    <dd className="tabular-nums font-semibold">{row.uniqueViewers}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">Detail opens</dt>
                    <dd className="tabular-nums font-semibold">{row.jobDetailOpens}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">Pack downloads</dt>
                    <dd className="tabular-nums font-semibold">{row.packDownloads}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">EOI starts</dt>
                    <dd className="tabular-nums font-semibold">{row.eoiStarts}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">EOI submissions</dt>
                    <dd className="tabular-nums font-semibold">{row.eoiSubmissions}</dd>
                  </div>
                </dl>
                {row.sources.length > 0 && (
                  <div className="mt-3 overflow-x-auto">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Source attribution
                    </p>
                    <table className="w-full min-w-[28rem] text-left text-xs">
                      <thead>
                        <tr className="border-b text-slate-500">
                          <th className="py-1 pr-2">Source</th>
                          <th className="py-1 pr-2">Views</th>
                          <th className="py-1 pr-2">Pack</th>
                          <th className="py-1 pr-2">EOIs</th>
                          <th className="py-1">Conversion</th>
                        </tr>
                      </thead>
                      <tbody>
                        {row.sources.map((s) => (
                          <tr key={s.source} className="border-b border-slate-50">
                            <td className="py-1 pr-2 font-medium text-slate-800">{s.source}</td>
                            <td className="py-1 pr-2 tabular-nums">{s.views}</td>
                            <td className="py-1 pr-2 tabular-nums">{s.packDownloads}</td>
                            <td className="py-1 pr-2 tabular-nums">{s.eois}</td>
                            <td className="py-1 tabular-nums text-emerald-800">{s.conversion}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-slate-900">Content opportunities</h2>
        <p className="mt-1 text-sm text-slate-600">
          Advisory only — editors decide. Derived from funnel leakage and engagement skew.
        </p>
        <ul className="mt-3 space-y-2">
          {dash.contentOpportunities.length === 0 && (
            <li className="text-sm text-slate-500">No opportunities yet.</li>
          )}
          {dash.contentOpportunities.map((item) => (
            <li
              key={item.id}
              className={`rounded-lg border p-3 text-sm ${priorityClass(item.priority)}`}
            >
              <p className="font-medium">
                <span className="mr-2 text-xs uppercase tracking-wide opacity-70">
                  {item.priority}
                </span>
                {item.title}
              </p>
              <p className="mt-1 text-xs opacity-90">{item.rationale}</p>
            </li>
          ))}
        </ul>
        {(dash.intelligenceRecs?.items?.length ?? 0) > 0 ? (
          <div className="mt-4 border-t border-slate-100 pt-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Content intelligence run
            </p>
            <ul className="mt-2 space-y-2">
              {(dash.intelligenceRecs?.items ?? []).map((item) => (
                <li key={item.title} className="rounded border border-slate-100 p-2 text-sm">
                  <p className="font-medium">{item.title}</p>
                  <p className="text-xs text-slate-600">
                    {item.type} · {item.rationale}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-semibold text-slate-900">Recruitment source attribution</h2>
          <p className="mt-1 text-sm text-slate-600">
            First <code>page_view</code> channel / referrer per session (anonymous).
          </p>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b text-xs uppercase tracking-wide text-slate-500">
                  <th className="py-2 pr-2">Source</th>
                  <th className="py-2 pr-2">Sessions</th>
                  <th className="py-2 pr-2">EOIs</th>
                  <th className="py-2">EOI rate</th>
                </tr>
              </thead>
              <tbody>
                {dash.sources.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-3 text-slate-500">
                      No attributed sessions yet.
                    </td>
                  </tr>
                )}
                {dash.sources.map((s) => (
                  <tr key={s.source} className="border-b border-slate-100">
                    <td className="py-2 pr-2 font-medium text-slate-800">{s.source}</td>
                    <td className="py-2 pr-2 tabular-nums">{s.sessions}</td>
                    <td className="py-2 pr-2 tabular-nums">{s.eoiSubmissions}</td>
                    <td className="py-2 tabular-nums text-emerald-800">{s.eoiRate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-semibold text-slate-900">EOI paths</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {dash.topPaths.length === 0 && <li className="text-slate-500">No path data yet.</li>}
            {dash.topPaths.map((p) => (
              <li key={p.path} className="rounded-lg border border-slate-100 p-2">
                <p className="text-xs text-slate-500">{p.eoiSessions} EOI session(s)</p>
                <p className="font-medium text-slate-800">{p.label}</p>
                <p className="mt-0.5 break-all font-mono text-[11px] text-slate-500">{p.path}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-5 text-sm">
          <h2 className="font-semibold text-slate-900">Top FAQ engagement</h2>
          <ul className="mt-2 space-y-1">
            {dash.topFaq.length === 0 && <li className="text-slate-500">No FAQ events yet.</li>}
            {dash.topFaq.map((f) => (
              <li key={f.faqId} className="flex justify-between gap-2 border-b border-slate-50 py-1">
                <span>
                  {f.label}{" "}
                  <code className="text-[11px] text-slate-400">{f.faqId}</code>
                </span>
                <span className="tabular-nums text-slate-700">{f.count}</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-xl border border-slate-200 bg-white p-5 text-sm">
          <h2 className="font-semibold text-slate-900">Practice Experience modules</h2>
          <ul className="mt-2 space-y-1">
            {dash.peModules.length === 0 && (
              <li className="text-slate-500">No module_view events yet.</li>
            )}
            {dash.peModules.map((m) => (
              <li key={m.moduleId} className="flex justify-between gap-2 border-b border-slate-50 py-1">
                <code>{m.moduleId}</code>
                <span className="tabular-nums">{m.count}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-4 text-sm">
        <h2 className="font-semibold">Knowledge graph snapshot (read-only)</h2>
        <p className="mt-1 text-slate-600">
          {dash.graphSnapshotId
            ? `${dash.graphNodeCount} nodes · ${dash.graphEdgeCount} edges · generated ${dash.graphGeneratedAt?.toISOString() ?? "—"}`
            : "No snapshot yet — seed demo events or run ingest."}
        </p>
        <GraphIngestButton
          graphSnapshotId={dash.graphSnapshotId}
          intelligenceRunId={dash.intelligenceRunId}
        />
      </section>

      <p className="text-sm">
        <Link href="/admin/attraction-analytics/architecture" className="underline">
          Tracking architecture &amp; graph ingestion plan
        </Link>
      </p>
    </div>
  );
}
