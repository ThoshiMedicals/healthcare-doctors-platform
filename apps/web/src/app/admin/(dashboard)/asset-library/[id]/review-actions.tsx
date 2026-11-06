"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const DECISIONS = [
  "submit_for_review",
  "request_changes",
  "approve",
  "publish",
  "mark_review_due",
  "retire",
  "withdraw",
  "purge",
  "replace_placeholder",
] as const;

export function AssetReviewActions({
  assetRowId,
  consentId,
  status,
}: {
  assetRowId: string;
  consentId: string | null;
  status: string;
}) {
  const router = useRouter();
  const [decision, setDecision] = useState<(typeof DECISIONS)[number]>("submit_for_review");
  const [rationale, setRationale] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function onReview() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/attraction/assets/${assetRowId}/reviews`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ decision, rationale }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Review failed");
      setMessage(`Now ${data.asset?.status ?? "updated"}`);
      setRationale("");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Review failed");
    } finally {
      setBusy(false);
    }
  }

  async function onGrantConsent() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/attraction/assets/${assetRowId}/consent`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "create_consent",
          consentVersion: "asset-consent-v1",
          subjectDisplayName: "Placeholder subject (replace before production)",
          channelsAllowed: ["practice_experience_web", "opportunity_page"],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Consent failed");
      setMessage(`Consent ${data.consent?.status ?? "linked"}`);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Consent failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50/40 p-4">
      <h2 className="text-lg font-semibold">Human review workflow</h2>
      <p className="text-sm text-slate-600">Current status: {status}</p>
      <label className="block text-sm">
        Decision
        <select
          className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
          value={decision}
          onChange={(e) => setDecision(e.target.value as (typeof DECISIONS)[number])}
        >
          {DECISIONS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm">
        Rationale (required)
        <textarea
          className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
          rows={3}
          value={rationale}
          onChange={(e) => setRationale(e.target.value)}
        />
      </label>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy || rationale.trim().length < 3}
          onClick={onReview}
          className="inline-flex min-h-11 items-center rounded-lg bg-slate-900 px-3 text-sm font-medium text-white disabled:opacity-60"
        >
          Record review
        </button>
        {!consentId ? (
          <button
            type="button"
            disabled={busy}
            onClick={onGrantConsent}
            className="inline-flex min-h-11 items-center rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium disabled:opacity-60"
          >
            Attach placeholder consent
          </button>
        ) : null}
      </div>
      {message ? <p className="text-sm text-slate-700">{message}</p> : null}
    </section>
  );
}
