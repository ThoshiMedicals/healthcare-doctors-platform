import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAction } from "@/cms/context";
import { getStory } from "@/story-capture/stories";
import { CHANNEL_SURFACE } from "@/story-capture/channels";
import { StoryWorkflowActions } from "./workflow-actions";

export const dynamic = "force-dynamic";

export default async function StoryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { clinic } = await requireAction("edit");
  const { id } = await params;
  const story = await getStory(clinic.id, id);
  if (!story) notFound();

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <Link href="/admin/story-capture" className="text-sm font-medium underline">
        ← Inventory
      </Link>

      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-800">
          {story.status}
        </p>
        <h1 className="text-3xl font-semibold text-slate-900">{story.workingTitle}</h1>
        <p className="text-sm text-slate-600">
          {story.subjectDisplayName} · {story.primaryCategory}
          {story.specialInterestLabel ? ` · ${story.specialInterestLabel}` : ""}
        </p>
      </header>

      <StoryWorkflowActions
        storyId={story.id}
        status={story.status}
        latestConsentId={story.consents[0]?.id}
        latestVersionId={story.versions[0]?.id}
        versions={story.versions.map((v) => ({
          id: v.id,
          label: `v${v.versionNumber} ${v.format}`,
        }))}
        placements={story.placements.map((p) => ({
          id: p.id,
          label: `${p.channel} · ${p.live ? "LIVE" : "planned"}`,
          live: p.live,
        }))}
      />

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-semibold">Reuse policies (default deny)</h2>
        <ul className="mt-2 space-y-1 text-sm">
          {story.reusePolicies.map((p) => (
            <li key={p.id}>
              <code>{p.channel}</code> → {p.allowed ? "ALLOWED" : "DENIED"} ·{" "}
              {CHANNEL_SURFACE[p.channel].product}
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-semibold">Consent versions</h2>
        <ul className="mt-2 space-y-2 text-sm">
          {story.consents.map((c) => (
            <li key={c.id} className="rounded border border-slate-100 p-3">
              <p>
                {c.consentVersion} · <strong>{c.status}</strong>
              </p>
              <p className="text-xs text-slate-500">
                allowed: {JSON.stringify(c.channelsAllowedJson)} · denied:{" "}
                {JSON.stringify(c.channelsDeniedJson)}
              </p>
              {c.signedAt ? (
                <p className="text-xs">Signed {c.signedAt.toISOString()} by {c.signedByName}</p>
              ) : null}
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-semibold">Versions</h2>
        <ul className="mt-2 space-y-2 text-sm">
          {story.versions.map((v) => (
            <li key={v.id} className="rounded border border-slate-100 p-3">
              <p>
                v{v.versionNumber} · {v.format} · {v.attribution}
              </p>
              <p className="text-slate-700">{v.pullQuoteText || v.bodyText.slice(0, 160)}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-semibold">Placements &amp; destinations</h2>
        <ul className="mt-2 space-y-2 text-sm">
          {story.placements.length === 0 && <li className="text-slate-600">No placements yet.</li>}
          {story.placements.map((p) => (
            <li key={p.id}>
              {p.live ? "LIVE" : "planned"} · {p.channel} · {p.surfacePath}
              {p.takeDownReason ? ` · down: ${p.takeDownReason}` : ""}
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-slate-500">
          Destinations: Practice Experience · GP Opportunities · Opportunity Pack. Withdrawal takes
          placements offline and blocks reuse until a new consented version is approved.
        </p>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-semibold">Review events</h2>
        <ul className="mt-2 space-y-2 text-sm">
          {story.reviews.map((r) => (
            <li key={r.id} className="rounded border border-slate-100 p-3">
              <p className="font-medium">
                {r.decision}: {r.fromStatus} → {r.toStatus}
              </p>
              <p className="text-xs text-slate-500">
                {r.reviewerName} ({r.reviewerRole}) · {r.createdAt.toISOString()}
              </p>
              <p>{r.rationale}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
