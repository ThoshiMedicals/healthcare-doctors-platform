import Link from "next/link";
import { requireAction } from "@/cms/context";
import type { AttractionAssetKind, AttractionAssetStatus } from "@prisma/client";
import { listLibraryAssets } from "@/asset-library/registry";
import { SeedAssetPlaceholdersButton } from "./seed-button";

export const dynamic = "force-dynamic";

const KINDS: AttractionAssetKind[] = [
  "image",
  "video",
  "transcript",
  "quote",
  "testimonial_ref",
  "consent_document",
  "other",
];
const STATUSES: AttractionAssetStatus[] = [
  "captured",
  "catalogued",
  "in_review",
  "approved",
  "published",
  "review_due",
  "retired",
  "withdrawn",
  "purged",
];

export default async function AssetLibraryAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string; status?: string; scene?: string; surface?: string }>;
}) {
  const { clinic } = await requireAction("edit");
  const sp = await searchParams;
  const kind = KINDS.includes(sp.kind as AttractionAssetKind)
    ? (sp.kind as AttractionAssetKind)
    : undefined;
  const status = STATUSES.includes(sp.status as AttractionAssetStatus)
    ? (sp.status as AttractionAssetStatus)
    : undefined;
  const scene = sp.scene?.trim() || undefined;
  const surface = sp.surface?.trim() || undefined;

  const assets = await listLibraryAssets(clinic.id, { kind, status });
  const filtered = assets.filter((a) => {
    if (scene && a.scene !== scene) return false;
    if (surface && !(a.surfaceHints ?? []).includes(surface)) return false;
    return true;
  });

  const byKind = assets.reduce<Record<string, number>>((acc, a) => {
    acc[a.kind] = (acc[a.kind] ?? 0) + 1;
    return acc;
  }, {});

  const scenes = [...new Set(assets.map((a) => a.scene).filter(Boolean))] as string[];
  const surfaces = [
    ...new Set(assets.flatMap((a) => a.surfaceHints ?? []).filter(Boolean)),
  ] as string[];

  function href(next: Record<string, string | undefined>) {
    const q = new URLSearchParams();
    const merged = {
      kind: kind ?? undefined,
      status: status ?? undefined,
      scene: scene ?? undefined,
      surface: surface ?? undefined,
      ...next,
    };
    for (const [k, v] of Object.entries(merged)) {
      if (v) q.set(k, v);
    }
    const s = q.toString();
    return s ? `/admin/asset-library?${s}` : "/admin/asset-library";
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-800">
          GP Attraction Asset Library
        </p>
        <h1 className="text-3xl font-semibold text-slate-900">Asset registry</h1>
        <p className="max-w-3xl text-sm text-slate-600">
          Images, videos, transcripts, and quotes with taxonomy, lifecycle review, consent linkage,
          and story linkage. AI placeholders now — swap masters later without changing asset IDs.
        </p>
      </header>

      <div className="flex flex-wrap gap-3">
        <SeedAssetPlaceholdersButton />
        <Link
          href="/admin/asset-library/architecture"
          className="inline-flex min-h-11 items-center rounded-lg border border-slate-300 px-3 text-sm font-medium"
        >
          Storage &amp; architecture
        </Link>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-4 text-sm">
        <h2 className="font-semibold">Taxonomy &amp; lifecycle filters</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            href={href({ kind: undefined })}
            className={`rounded-full border px-3 py-1 text-xs ${!kind ? "bg-slate-900 text-white" : ""}`}
          >
            All kinds
          </Link>
          {KINDS.map((k) => (
            <Link
              key={k}
              href={href({ kind: k })}
              className={`rounded-full border px-3 py-1 text-xs ${kind === k ? "bg-slate-900 text-white" : ""}`}
            >
              {k}
            </Link>
          ))}
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          <Link
            href={href({ status: undefined })}
            className={`rounded-full border px-3 py-1 text-xs ${!status ? "bg-slate-900 text-white" : ""}`}
          >
            All statuses
          </Link>
          {STATUSES.map((s) => (
            <Link
              key={s}
              href={href({ status: s })}
              className={`rounded-full border px-3 py-1 text-xs ${status === s ? "bg-slate-900 text-white" : ""}`}
            >
              {s}
            </Link>
          ))}
        </div>
        {scenes.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-2">
            <Link
              href={href({ scene: undefined })}
              className={`rounded-full border px-3 py-1 text-xs ${!scene ? "bg-slate-900 text-white" : ""}`}
            >
              All scenes
            </Link>
            {scenes.map((s) => (
              <Link
                key={s}
                href={href({ scene: s })}
                className={`rounded-full border px-3 py-1 text-xs ${scene === s ? "bg-slate-900 text-white" : ""}`}
              >
                scene:{s}
              </Link>
            ))}
          </div>
        ) : null}
        {surfaces.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-2">
            <Link
              href={href({ surface: undefined })}
              className={`rounded-full border px-3 py-1 text-xs ${!surface ? "bg-slate-900 text-white" : ""}`}
            >
              All surfaces
            </Link>
            {surfaces.map((s) => (
              <Link
                key={s}
                href={href({ surface: s })}
                className={`rounded-full border px-3 py-1 text-xs ${surface === s ? "bg-slate-900 text-white" : ""}`}
              >
                surface:{s}
              </Link>
            ))}
          </div>
        ) : null}
        <p className="mt-2 text-xs text-slate-500">
          Showing {filtered.length} of {assets.length} · by kind:{" "}
          {Object.keys(byKind).length === 0
            ? "none"
            : Object.entries(byKind)
                .map(([k, v]) => `${k}:${v}`)
                .join(" · ")}
        </p>
      </section>

      <section className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm">
        <h2 className="font-semibold text-amber-950">Review queue</h2>
        <p className="mt-1 text-amber-900">
          Lifecycle states needing attention (review_due / in_review / catalogued placeholders).
        </p>
        <ul className="mt-3 divide-y divide-amber-100 rounded-lg border border-amber-200 bg-white">
          {assets
            .filter((a) =>
              ["review_due", "in_review", "catalogued", "captured"].includes(a.status),
            )
            .slice(0, 20)
            .map((asset) => (
              <li key={`q-${asset.id}`} className="flex justify-between gap-2 px-3 py-2">
                <Link href={`/admin/asset-library/${asset.id}`} className="underline">
                  <code>{asset.assetId}</code> · {asset.status}
                </Link>
                <span className="text-xs text-slate-500">
                  {asset.scene ?? asset.kind} ·{" "}
                  {asset.placeholderKind === "ai" ? "AI" : asset.rightsClass}
                </span>
              </li>
            ))}
          {assets.filter((a) =>
            ["review_due", "in_review", "catalogued", "captured"].includes(a.status),
          ).length === 0 ? (
            <li className="px-3 py-2 text-slate-500">
              Queue empty — seed placeholders or open inventory.
            </li>
          ) : null}
        </ul>
      </section>

      <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
        {filtered.map((asset) => (
          <li key={asset.id}>
            <Link
              href={`/admin/asset-library/${asset.id}`}
              className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 hover:bg-slate-50"
            >
              <div className="flex items-center gap-3">
                {asset.kind === "image" && asset.storagePath ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={asset.storagePath}
                    alt=""
                    className="h-12 w-20 rounded object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-20 items-center justify-center rounded bg-slate-100 text-xs uppercase text-slate-500">
                    {asset.kind}
                  </div>
                )}
                <div>
                  <p className="font-medium text-slate-900">
                    <code>{asset.assetId}</code> · {asset.title}
                  </p>
                  <p className="text-xs text-slate-500">
                    {asset.status} · {asset.rightsClass} ·{" "}
                    {asset.placeholderKind === "ai" ? "AI placeholder" : asset.placeholderKind || "—"}
                    {asset.scene ? ` · scene ${asset.scene}` : ""}
                  </p>
                </div>
              </div>
              <p className="text-xs text-slate-500">
                reviews {asset._count.reviewEvents}
                {asset.relatedStory ? ` · story linked` : ""}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
