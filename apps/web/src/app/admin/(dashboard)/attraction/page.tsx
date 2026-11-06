import Link from "next/link";
import { requireAction } from "@/cms/context";
import { listAttractionDocuments } from "@/attraction-cms/documents";
import { listAttractionAssets } from "@/attraction-cms/assets";
import { SeedAttractionDefaultsButton } from "./seed-button";
import { PromoteExperienceValidationButton } from "./promote-ev-button";

export const dynamic = "force-dynamic";

const KIND_LABEL: Record<string, string> = {
  opportunities: "Opportunities",
  faq: "FAQ",
  practice_experience: "Practice Experience Pack",
  registrar_pathway: "Registrar Pathway",
  story: "Stories",
  catchment_analysis: "Catchment Analysis",
  continuity_network: "Continuity Network",
  clinical_interests: "Clinical Interests",
};

export default async function AttractionCmsAdminPage() {
  const { clinic } = await requireAction("edit");
  const [documents, assets] = await Promise.all([
    listAttractionDocuments(clinic.id),
    listAttractionAssets(clinic.id),
  ]);

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-800">
          GP Attraction CMS · Phase 1
        </p>
        <h1 className="text-3xl font-semibold text-slate-900">Attraction documents</h1>
        <p className="max-w-3xl text-sm leading-relaxed text-slate-600">
          Human approvals only. Revisions are immutable. Schema validation hooks run on every
          revision. <strong>Production publish is blocked</strong> in Phase 1 — use approve /
          approve_publish_intent only.
        </p>
      </header>

      <section className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
        <p className="font-semibold">Phase 1 + Experience Validation</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>
            <strong>Production publish remains blocked</strong> — never uses{" "}
            <code>publish_production</code>
          </li>
          <li>
            <strong>Promote to Experience Validation</strong> writes UAT{" "}
            <code>PageRevision</code> HTML for <code>next.</code> only — AttractionDocument
            publish state stays unchanged
          </li>
          <li>Synthetic packs show <code>synthetic_placeholder</code> markers in admin</li>
          <li>Story Capture consent remains the gate for named (non-composite) stories</li>
          <li>
            Asset Library uses AI placeholders now — swap masters later via{" "}
            <Link href="/admin/asset-library" className="underline">
              Asset Library
            </Link>
          </li>
        </ul>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <PromoteExperienceValidationButton />
        <SeedAttractionDefaultsButton />
        <Link
          href="/admin/attraction/architecture"
          className="inline-flex min-h-11 items-center rounded-lg border border-slate-300 px-3 text-sm font-medium text-slate-800 hover:bg-slate-50"
        >
          Admin UI architecture
        </Link>
        <Link
          href="/admin/asset-library"
          className="inline-flex min-h-11 items-center rounded-lg border border-slate-300 px-3 text-sm font-medium text-slate-800 hover:bg-slate-50"
        >
          Asset Library
        </Link>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">Documents ({documents.length})</h2>
        {documents.length === 0 ? (
          <p className="text-sm text-slate-600">
            No documents yet. Seed Phase 1 defaults for Opportunities, FAQ, Practice Experience,
            Registrar Pathway, and Stories.
          </p>
        ) : (
          <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
            {documents.map((doc) => (
              <li key={doc.id}>
                <Link
                  href={`/admin/attraction/${doc.id}`}
                  className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 hover:bg-slate-50"
                >
                  <div>
                    <p className="font-medium text-slate-900">{doc.title}</p>
                    <p className="text-xs text-slate-500">
                      {KIND_LABEL[doc.kind] ?? doc.kind} · {doc.slug} · {doc.publishState}
                      {doc.surfacePath ? ` · ${doc.surfacePath}` : ""}
                      {" · "}
                      <span className="rounded bg-amber-100 px-1 text-amber-900">
                        synthetic_placeholder
                      </span>
                    </p>
                  </div>
                  <p className="text-xs text-slate-500">
                    revs {doc._count.revisions} · approvals {doc._count.approvalEvents}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-slate-900">
          Asset library ({assets.length}){" "}
          <Link href="/admin/asset-library" className="text-sm font-medium underline">
            open
          </Link>
        </h2>
        <p className="text-sm text-slate-600">
          AI placeholders + taxonomy/lifecycle registry. Swap masters later without changing asset
          IDs.
        </p>
        {assets.length > 0 && (
          <ul className="rounded-xl border border-slate-200 bg-white text-sm">
            {assets.slice(0, 12).map((asset) => (
              <li key={asset.id} className="border-b border-slate-100 px-4 py-2 last:border-0">
                <Link href={`/admin/asset-library/${asset.id}`} className="hover:underline">
                  <code>{asset.assetId}</code> · {asset.kind} · {asset.status}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
