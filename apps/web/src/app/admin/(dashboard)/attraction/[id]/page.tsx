import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAction } from "@/cms/context";
import { getAttractionDocument } from "@/attraction-cms/documents";
import { AttractionApprovalActions } from "./approval-actions";

export const dynamic = "force-dynamic";

export default async function AttractionDocumentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { clinic } = await requireAction("edit");
  const { id } = await params;
  const document = await getAttractionDocument(clinic.id, id);
  if (!document) notFound();

  const latest = document.revisions[0];

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <p>
        <Link href="/admin/attraction" className="text-sm font-medium text-slate-700 underline">
          ← Attraction CMS
        </Link>
      </p>

      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-800">
          {document.kind}
        </p>
        <h1 className="text-3xl font-semibold text-slate-900">{document.title}</h1>
        <p className="text-sm text-slate-600">{document.summary}</p>
        <p className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-950">
          synthetic_placeholder · Experience Validation may surface this pack on next. without
          production publish
        </p>
        <dl className="grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
          <div>
            <dt className="text-slate-500">State</dt>
            <dd>
              <code>{document.publishState}</code>
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Slug</dt>
            <dd>
              <code>{document.slug}</code>
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Surface</dt>
            <dd>
              <code>{document.surfacePath ?? "—"}</code>
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Schema rules</dt>
            <dd>
              <code>{document.schemaRuleSetKey}</code>
            </dd>
          </div>
        </dl>
      </header>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-semibold">Latest revision</h2>
        {latest ? (
          <div className="mt-2 space-y-2 text-sm">
            <p>
              v{latest.versionNumber} · sha <code>{latest.contentSha256.slice(0, 12)}…</code> ·{" "}
              {latest.changeClass}
            </p>
            <pre className="max-h-64 overflow-auto rounded-lg bg-slate-50 p-3 text-xs">
              {JSON.stringify(latest.body, null, 2)}
            </pre>
            <AttractionApprovalActions documentId={document.id} revisionId={latest.id} />
          </div>
        ) : (
          <p className="text-sm text-slate-600">No revisions</p>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-semibold">Approval events</h2>
        <ul className="mt-2 space-y-2 text-sm">
          {document.approvalEvents.length === 0 && (
            <li className="text-slate-600">No human approvals yet.</li>
          )}
          {document.approvalEvents.map((event) => (
            <li key={event.id} className="rounded-lg border border-slate-100 p-3">
              <p className="font-medium">
                {event.decision}: {event.fromState} → {event.toState}
              </p>
              <p className="text-xs text-slate-500">
                {event.reviewerName} ({event.reviewerRole}) · {event.createdAt.toISOString()}
              </p>
              <p className="mt-1 text-slate-700">{event.rationale}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-semibold">Relationships</h2>
        <dl className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-slate-500">Story Capture ref</dt>
            <dd>
              <code>{document.storyCaptureRef ?? "—"}</code>
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Surface path</dt>
            <dd>
              <code>{document.surfacePath ?? "—"}</code>
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Published revision pointer</dt>
            <dd>
              <code>{document.publishedRevisionId ?? "none (Phase 1)"}</code>
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">All revisions</dt>
            <dd>{document.revisions.length} immutable version(s)</dd>
          </div>
        </dl>
        {document.revisions.length > 1 ? (
          <ul className="mt-3 space-y-1 text-xs text-slate-600">
            {document.revisions.map((rev) => (
              <li key={rev.id}>
                v{rev.versionNumber} · {rev.changeClass} · {rev.contentSha256.slice(0, 12)}…
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-semibold">Schema validations</h2>
        <ul className="mt-2 space-y-2 text-sm">
          {document.schemaValidations.map((row) => (
            <li key={row.id}>
              {row.passed ? "PASS" : "FAIL"} · {row.ruleSetKey} ·{" "}
              {Array.isArray(row.violations) ? (row.violations as string[]).join("; ") || "—" : "—"}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
