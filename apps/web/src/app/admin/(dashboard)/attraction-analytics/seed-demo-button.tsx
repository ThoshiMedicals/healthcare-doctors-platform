"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function SeedAnalyticsDemoButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function onSeed() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/attraction-analytics/seed-demo", {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Seed failed");
      setMessage(
        `Accepted ${data.accepted} events · graph ${data.graphSnapshotId} · ${data.notice}`,
      );
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Seed failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-1">
      <button
        type="button"
        disabled={busy}
        onClick={onSeed}
        className="inline-flex min-h-11 items-center rounded-lg border border-slate-300 px-3 text-sm font-medium disabled:opacity-60"
      >
        {busy ? "Seeding…" : "Seed demo analytics events"}
      </button>
      {message ? <p className="text-xs text-slate-600">{message}</p> : null}
    </div>
  );
}
