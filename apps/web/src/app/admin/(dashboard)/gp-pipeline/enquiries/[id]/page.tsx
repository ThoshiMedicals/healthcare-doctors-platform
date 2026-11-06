import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAction } from "@/cms/context";
import { getEnquiry } from "@/gp-pipeline/eoi";
import { EnquiryActions } from "./enquiry-actions";

export const dynamic = "force-dynamic";

export default async function GpPipelineEnquiryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { clinic } = await requireAction("edit");
  const { id } = await params;
  const enquiry = await getEnquiry(clinic.id, id);
  if (!enquiry) notFound();

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <Link href="/admin/gp-pipeline" className="text-sm font-medium underline">
        ← Pipeline
      </Link>
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-800">
          {enquiry.status}
        </p>
        <h1 className="text-3xl font-semibold">{enquiry.doctorDisplayName}</h1>
        <p className="text-sm text-slate-600">
          {enquiry.email} · score {enquiry.priorityScore} ({enquiry.scoreBand})
        </p>
      </header>

      <dl className="grid gap-3 rounded-xl border bg-white p-4 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-slate-500">Readiness</dt>
          <dd>
            {enquiry.readinessLink
              ? `${enquiry.readinessLink.overallBand} (${enquiry.readinessLink.totalScore})`
              : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-slate-500">Match runs</dt>
          <dd>{enquiry.matchRuns.length}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Onboarding</dt>
          <dd>
            {enquiry.onboardingCase
              ? `${enquiry.onboardingCase.currentStageId} / ${enquiry.onboardingCase.status}`
              : "not opened"}
          </dd>
        </div>
        <div>
          <dt className="text-slate-500">First 90</dt>
          <dd>
            {enquiry.onboardingCase?.first90Case
              ? `${enquiry.onboardingCase.first90Case.status} · ${enquiry.onboardingCase.first90Case.currentPhase}`
              : "—"}
          </dd>
        </div>
      </dl>

      <EnquiryActions
        enquiryId={enquiry.id}
        status={enquiry.status}
        onboardingCaseId={enquiry.onboardingCase?.id ?? null}
        currentStageId={enquiry.onboardingCase?.currentStageId ?? null}
      />

      <section className="rounded-xl border bg-white p-4 text-sm">
        <h2 className="font-semibold">Status audits</h2>
        <ul className="mt-2 space-y-2">
          {enquiry.statusAudits.map((a) => (
            <li key={a.id} className="rounded border border-slate-100 p-2 text-xs">
              {a.fromStatus} → {a.toStatus} · {a.actorName || a.actorUserId}
              {a.note ? ` · ${a.note}` : ""}
            </li>
          ))}
        </ul>
      </section>

      {enquiry.matchRuns[0] ? (
        <section className="rounded-xl border bg-white p-4 text-sm">
          <h2 className="font-semibold">Latest session match (advisory)</h2>
          <p className="mt-1">
            Score {enquiry.matchRuns[0].compatibilityScore}% — {enquiry.matchRuns[0].notice}
          </p>
        </section>
      ) : null}

      <section className="rounded-xl border bg-white p-4 text-sm">
        <h2 className="font-semibold">Notifications</h2>
        <p className="mt-1 text-xs text-slate-500">
          Role alerts only — no automatic hiring or onboarding progression.
        </p>
        <ul className="mt-2 space-y-2">
          {enquiry.notifications.length === 0 && (
            <li className="text-slate-500">No notifications recorded.</li>
          )}
          {enquiry.notifications.map((n) => (
            <li key={n.id} className="rounded border border-slate-100 p-2 text-xs">
              <p className="font-medium">
                {n.eventId} · {n.channel} → {n.recipientRole}
              </p>
              <p className="text-slate-600">
                {n.sentAt.toISOString()}
                {n.countsAsApproval ? " · (never counts as approval)" : ""}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
