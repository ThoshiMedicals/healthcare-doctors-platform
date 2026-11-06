"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function StoryWorkflowActions({
  storyId,
  status,
  latestConsentId,
  latestVersionId,
  versions,
  placements,
}: {
  storyId: string;
  status: string;
  latestConsentId?: string;
  latestVersionId?: string;
  versions: Array<{ id: string; label: string }>;
  placements: Array<{ id: string; label: string; live: boolean }>;
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [rationale, setRationale] = useState("");
  const [quote, setQuote] = useState(
    "Continuity holds because recalls and notes assume a shared history.",
  );
  const [channel, setChannel] = useState("practice_experience_web");
  const [versionId, setVersionId] = useState(latestVersionId || "");

  async function call(path: string, body: Record<string, unknown>) {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(path, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setMessage(data.message || "OK");
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
      <h2 className="text-lg font-semibold">Workflow actions</h2>
      <p className="text-sm text-slate-600">Current status: {status}</p>

      <label className="block text-sm">
        <span className="font-medium">Rationale / notes</span>
        <textarea
          className="mt-1 w-full rounded-lg border px-3 py-2"
          rows={2}
          value={rationale}
          onChange={(e) => setRationale(e.target.value)}
        />
      </label>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          className="min-h-11 rounded-lg border px-3 text-sm"
          onClick={() =>
            call(`/api/admin/story-capture/stories/${storyId}/consent`, {
              action: "share_summary",
            })
          }
        >
          Share consent summary
        </button>
        <button
          type="button"
          disabled={busy}
          className="min-h-11 rounded-lg border px-3 text-sm"
          onClick={() =>
            call(`/api/admin/story-capture/stories/${storyId}/versions`, {
              format: "pull_quote",
              bodyText: quote,
              pullQuoteText: quote,
              attribution: "role_label_only",
              publicByline: "GP at Woolloongabba Medical Centre",
            })
          }
        >
          Save pull-quote draft
        </button>
        <button
          type="button"
          disabled={busy || !latestConsentId || !latestVersionId}
          className="min-h-11 rounded-lg border px-3 text-sm"
          onClick={() =>
            call(`/api/admin/story-capture/stories/${storyId}/consent`, {
              action: "link_draft",
              consentId: latestConsentId,
              versionId: latestVersionId,
            })
          }
        >
          Link consent → draft
        </button>
        <button
          type="button"
          disabled={busy || !latestConsentId}
          className="min-h-11 rounded-lg border px-3 text-sm"
          onClick={() =>
            call(`/api/admin/story-capture/stories/${storyId}/consent`, {
              action: "sign",
              consentId: latestConsentId,
              signedByName: "Subject GP (admin-assisted)",
              attributionChosen: "role_label_only",
              channelsAllowed: ["practice_experience_web", "gp_opportunities_rail", "internal_proposal_pack"],
              commercialSilenceAck: true,
              patientPrivacyAck: true,
              editRightsAck: true,
            })
          }
        >
          Sign consent (PE + Opportunities + Pack)
        </button>
      </div>

      <label className="block text-sm">
        <span className="font-medium">Pull quote draft text</span>
        <input
          className="mt-1 w-full rounded-lg border px-3 py-2"
          value={quote}
          onChange={(e) => setQuote(e.target.value)}
        />
      </label>

      <div className="flex flex-wrap gap-2">
        {(
          [
            "approve_advance",
            "request_changes",
            "pause",
            "approve_publish",
          ] as const
        ).map((decision) => (
          <button
            key={decision}
            type="button"
            disabled={busy}
            className="min-h-11 rounded-lg border px-3 text-sm"
            onClick={() =>
              call(`/api/admin/story-capture/stories/${storyId}/reviews`, {
                decision,
                rationale: rationale || `Decision: ${decision}`,
                versionId: latestVersionId,
                reviewerRole: "practice_manager",
              })
            }
          >
            Review: {decision}
          </button>
        ))}
      </div>

      <div className="border-t border-slate-100 pt-3">
        <h3 className="font-medium">Placement</h3>
        <div className="mt-2 flex flex-wrap gap-2">
          <select
            className="rounded-lg border px-2 py-2 text-sm"
            value={channel}
            onChange={(e) => setChannel(e.target.value)}
          >
            <option value="practice_experience_web">Practice Experience</option>
            <option value="gp_opportunities_rail">GP Opportunities</option>
            <option value="internal_proposal_pack">Opportunity Pack</option>
          </select>
          <select
            className="rounded-lg border px-2 py-2 text-sm"
            value={versionId}
            onChange={(e) => setVersionId(e.target.value)}
          >
            {versions.map((v) => (
              <option key={v.id} value={v.id}>
                {v.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={busy || !versionId}
            className="min-h-11 rounded-lg border px-3 text-sm"
            onClick={() =>
              call(`/api/admin/story-capture/stories/${storyId}/placements`, {
                action: "create",
                versionId,
                channel,
              })
            }
          >
            Create placement
          </button>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {placements.map((p) => (
            <button
              key={p.id}
              type="button"
              disabled={busy || p.live}
              className="min-h-11 rounded-lg border px-3 text-sm disabled:opacity-50"
              onClick={() =>
                call(`/api/admin/story-capture/stories/${storyId}/placements`, {
                  action: "go_live",
                  placementId: p.id,
                })
              }
            >
              Go live: {p.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          disabled={busy}
          className="mt-2 min-h-11 rounded-lg border border-red-300 px-3 text-sm text-red-800"
          onClick={() =>
            call(`/api/admin/story-capture/stories/${storyId}/withdraw`, {
              reason: rationale || "GP withdrawal request",
              consentId: latestConsentId,
            })
          }
        >
          Withdraw story (take down all live)
        </button>
      </div>

      {message ? <p className="text-sm text-slate-700">{message}</p> : null}
    </section>
  );
}
