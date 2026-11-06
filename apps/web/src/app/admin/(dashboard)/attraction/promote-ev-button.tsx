"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function PromoteExperienceValidationButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function onPromote() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/attraction/experience-validation", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ seed: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Promote failed");
      setMessage(
        `EV promote: ${data.pages?.length ?? 0} page(s). AttractionDocument publish states unchanged.`,
      );
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Promote failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={onPromote}
        disabled={busy}
        className="inline-flex min-h-11 items-center rounded-lg bg-emerald-800 px-3 text-sm font-medium text-white disabled:opacity-60"
      >
        {busy ? "Promoting…" : "Promote to Experience Validation"}
      </button>
      {message ? <span className="text-sm text-slate-600">{message}</span> : null}
    </div>
  );
}
