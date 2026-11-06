import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAction } from "@/cms/context";
import { getLibraryAsset } from "@/asset-library/registry";
import { AssetReviewActions } from "./review-actions";

export const dynamic = "force-dynamic";

export default async function AssetLibraryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { clinic } = await requireAction("edit");
  const { id } = await params;
  const asset = await getLibraryAsset(clinic.id, id);
  if (!asset) notFound();

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <Link href="/admin/asset-library" className="text-sm font-medium underline">
        ← Registry
      </Link>

      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-800">
          {asset.kind} · {asset.status}
        </p>
        <h1 className="text-3xl font-semibold text-slate-900">
          <code>{asset.assetId}</code>
        </h1>
        <p className="text-sm text-slate-600">{asset.title}</p>
      </header>

      {asset.kind === "image" && asset.storagePath ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={asset.storagePath}
          alt={asset.altText}
          className="max-h-80 w-full rounded-xl border object-cover"
        />
      ) : null}

      <dl className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-slate-500">Current path</dt>
          <dd>
            <code>{asset.storagePath || "—"}</code>
          </dd>
        </div>
        <div>
          <dt className="text-slate-500">Replaceable master path</dt>
          <dd>
            <code>{asset.replaceablePath || "—"}</code>
          </dd>
        </div>
        <div>
          <dt className="text-slate-500">Rights / AI</dt>
          <dd>
            {asset.rightsClass} · {asset.aiPolicy} · placeholder={asset.placeholderKind || "—"}
          </dd>
        </div>
        <div>
          <dt className="text-slate-500">Review</dt>
          <dd>
            cadence {asset.reviewCadenceDays}d · next{" "}
            {asset.nextReviewAt ? asset.nextReviewAt.toISOString().slice(0, 10) : "—"}
          </dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-slate-500">Alt / caption</dt>
          <dd>
            {asset.altText}
            <br />
            <span className="text-slate-600">{asset.caption}</span>
          </dd>
        </div>
        {asset.quoteText ? (
          <div className="sm:col-span-2">
            <dt className="text-slate-500">Quote</dt>
            <dd className="italic">“{asset.quoteText}”</dd>
          </div>
        ) : null}
        <div>
          <dt className="text-slate-500">Taxonomy</dt>
          <dd className="text-xs">{asset.taxonomyTags.join(", ") || "—"}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Story / consent</dt>
          <dd>
            story={asset.relatedStoryId || asset.relatedStoryRef || "—"}
            <br />
            consent={asset.consentRecord?.consentVersion || asset.consentRef || "—"} (
            {asset.consentRecord?.status || "unlinked"}
            {asset.consentRecord?.subjectDisplayName
              ? ` · ${asset.consentRecord.subjectDisplayName}`
              : ""}
            )
          </dd>
        </div>
      </dl>

      <AssetReviewActions
        assetRowId={asset.id}
        consentId={asset.consentRecordId}
        status={asset.status}
      />

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-semibold">Review events</h2>
        <ul className="mt-2 space-y-2 text-sm">
          {asset.reviewEvents.length === 0 && (
            <li className="text-slate-600">No human reviews yet.</li>
          )}
          {asset.reviewEvents.map((ev) => (
            <li key={ev.id} className="rounded border border-slate-100 p-3">
              <p className="font-medium">
                {ev.decision}: {ev.fromStatus} → {ev.toStatus}
              </p>
              <p className="text-xs text-slate-500">
                {ev.reviewerName} · {ev.createdAt.toISOString()}
              </p>
              <p>{ev.rationale}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
