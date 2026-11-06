import Link from "next/link";
import { requireAction } from "@/cms/context";
import { getPipelineBoard } from "@/gp-pipeline/board";
import { PipelineActions } from "./pipeline-actions";

export const dynamic = "force-dynamic";

export default async function GpPipelineAdminPage() {
  const { clinic } = await requireAction("edit");
  const board = await getPipelineBoard(clinic.id);

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-800">
          GP Operational Pipeline
        </p>
        <h1 className="text-3xl font-semibold text-slate-900">
          Readiness → EOI → Matching → Onboarding → First 90
        </h1>
        <p className="max-w-3xl text-sm text-slate-600">{board.notice}</p>
      </header>

      <ol className="grid gap-3 sm:grid-cols-5">
        {board.stages.map((stage, i) => (
          <li key={stage.id} className="rounded-xl border border-slate-200 bg-white p-3 text-sm">
            <p className="text-xs text-slate-500">{i + 1}</p>
            <p className="font-semibold text-slate-900">{stage.label}</p>
            <p className="mt-1 text-xs text-slate-500">{stage.rule}</p>
          </li>
        ))}
      </ol>

      <section className="rounded-xl border border-slate-200 bg-white p-4 text-sm">
        <h2 className="font-semibold">Counts</h2>
        <pre className="mt-2 overflow-x-auto rounded bg-slate-50 p-3 text-xs">
          {JSON.stringify(board.counts, null, 2)}
        </pre>
      </section>

      <PipelineActions />

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Recent enquiries</h2>
        <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
          {board.recentEnquiries.length === 0 && (
            <li className="px-4 py-3 text-sm text-slate-600">No EOIs yet — seed a readiness + EOI.</li>
          )}
          {board.recentEnquiries.map((e) => (
            <li key={e.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
              <div>
                <p className="font-medium">
                  <Link href={`/admin/gp-pipeline/enquiries/${e.id}`} className="underline">
                    {e.doctorDisplayName}
                  </Link>
                </p>
                <p className="text-xs text-slate-500">
                  {e.status}
                  {e.readinessLink ? ` · readiness ${e.readinessLink.overallBand}` : ""}
                  {e.onboardingCase
                    ? ` · onboarding ${e.onboardingCase.currentStageId}/${e.onboardingCase.status}`
                    : ""}
                  {e.onboardingCase?.first90Case
                    ? ` · first90 ${e.onboardingCase.first90Case.currentPhase}`
                    : ""}
                </p>
              </div>
              <p className="text-xs text-slate-500">matches {e._count.matchRuns}</p>
            </li>
          ))}
        </ul>
      </section>

      <p className="text-sm">
        <Link href="/admin/gp-pipeline/architecture" className="underline">
          Workflow implementation map
        </Link>
      </p>
    </div>
  );
}
