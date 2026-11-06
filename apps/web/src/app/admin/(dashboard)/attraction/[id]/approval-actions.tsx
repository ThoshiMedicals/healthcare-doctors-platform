"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const ACTIONS = [
  { decision: "submit_for_review", label: "Submit for review" },
  { decision: "approve", label: "Approve" },
  { decision: "request_changes", label: "Request changes" },
  { decision: "pause", label: "Pause" },
  { decision: "approve_publish_intent", label: "Record publish intent (no live publish)" },
] as const;

export function AttractionApprovalActions({
  documentId,
  revisionId,
}: {
  documentId: string;
  revisionId: string;
}) {
  const router = useRouter();
  const [rationale, setRationale] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function run(decision: (typeof ACTIONS)[number]["decision"]) {
    setBusy(decision);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/attraction/documents/${documentId}/approvals`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          revisionId,
          decision,
          rationale: rationale || `Phase 1 ${decision}`,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setMessage(
        data.productionPublishBlocked
          ? data.message || "Publish intent recorded — production blocked"
          : `Recorded ${decision}`,
      );
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-3 border-t border-slate-100 pt-3">
      <label className="block text-sm">
        <span className="font-medium text-slate-800">Rationale (required for audit)</span>
        <textarea
          className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm"
          rows={3}
          value={rationale}
          onChange={(e) => setRationale(e.target.value)}
          placeholder="Why this decision — human gate only"
        />
      </label>
      <div className="flex flex-wrap gap-2">
        {ACTIONS.map((action) => (
          <button
            key={action.decision}
            type="button"
            disabled={Boolean(busy)}
            onClick={() => run(action.decision)}
            className="inline-flex min-h-11 items-center rounded-lg border border-slate-300 px-3 text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
          >
            {busy === action.decision ? "…" : action.label}
          </button>
        ))}
      </div>
      {message ? <p className="text-sm text-slate-700">{message}</p> : null}
    </div>
  );
}
