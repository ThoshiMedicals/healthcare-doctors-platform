import Link from "next/link";
import { requireAction } from "@/cms/context";
import {
  ASSET_AI_POLICIES,
  ASSET_MODULES,
  ASSET_PERSONAS,
  ASSET_SCENES,
  ASSET_SURFACES,
} from "@/asset-library/taxonomy";
import { LIFECYCLE_TRANSITIONS, REVIEW_CADENCE_DAYS } from "@/asset-library/lifecycle";
import { STORAGE_FOLDERS, buildAssetFilename, masterObjectKey } from "@/asset-library/storage";

export const dynamic = "force-dynamic";

export default async function AssetLibraryArchitecturePage() {
  await requireAction("edit");

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-6">
      <Link href="/admin/asset-library" className="text-sm font-medium underline">
        ← Registry
      </Link>
      <header>
        <h1 className="text-3xl font-semibold">Storage &amp; architecture</h1>
        <p className="mt-2 text-sm text-slate-600">
          AI placeholders live under public paths today. Real masters land at{" "}
          <code>replaceablePath</code> without changing <code>assetId</code>.
        </p>
      </header>

      <section className="space-y-2 rounded-xl border p-4 text-sm">
        <h2 className="font-semibold">Kinds</h2>
        <p>image, video, transcript, quote (+ testimonial_ref, consent_document, other)</p>
        <h2 className="mt-4 font-semibold">Lifecycle decisions</h2>
        <ul className="list-disc pl-5">
          {Object.entries(LIFECYCLE_TRANSITIONS).map(([decision, t]) => (
            <li key={decision}>
              <code>{decision}</code>: [{t.from.join(", ")}] → {t.to}
            </li>
          ))}
        </ul>
        <h2 className="mt-4 font-semibold">Review cadence (days)</h2>
        <pre className="overflow-x-auto rounded bg-slate-50 p-2 text-xs">
          {JSON.stringify(REVIEW_CADENCE_DAYS, null, 2)}
        </pre>
        <h2 className="mt-4 font-semibold">AI policies</h2>
        <p>{ASSET_AI_POLICIES.join(", ")}</p>
        <h2 className="mt-4 font-semibold">Storage folders</h2>
        <ul className="list-disc pl-5">
          {Object.entries(STORAGE_FOLDERS).map(([k, v]) => (
            <li key={k}>
              <code>
                {k}: {v}
              </code>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-slate-500">
          Example master key:{" "}
          <code>{masterObjectKey("image", buildAssetFilename({ assetId: "PE-TD-01", scene: "consulting_room", ext: "webp" }))}</code>
        </p>
      </section>

      <section className="space-y-2 rounded-xl border p-4 text-sm">
        <h2 className="font-semibold">Taxonomy</h2>
        <p>
          <strong>Scenes:</strong> {ASSET_SCENES.join(", ")}
        </p>
        <p>
          <strong>Surfaces:</strong> {ASSET_SURFACES.join(", ")}
        </p>
        <p>
          <strong>Modules:</strong> {ASSET_MODULES.join(", ")}
        </p>
        <p>
          <strong>Personas:</strong> {ASSET_PERSONAS.join(", ")}
        </p>
      </section>

      <section className="space-y-2 rounded-xl border p-4 text-sm">
        <h2 className="font-semibold">Code map</h2>
        <ul className="list-disc pl-5">
          <li>
            <code>asset-library/registry.ts</code> — upsert, replace placeholder, list/get
          </li>
          <li>
            <code>asset-library/lifecycle.ts</code> — states, cadence, publish gates
          </li>
          <li>
            <code>asset-library/reviews.ts</code> — human review events
          </li>
          <li>
            <code>asset-library/consent.ts</code> — consent + story linkage
          </li>
          <li>
            <code>asset-library/seed-placeholders.ts</code> — AI PE image/video/transcript/quote seed
          </li>
        </ul>
      </section>
    </div>
  );
}
