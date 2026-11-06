"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function SeedCompositeStoriesButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function onSeed() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/story-capture/seed-composites", {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Seed failed");
      setMessage(
        `Created ${data.result?.createdCount ?? 0} · skipped ${data.result?.skippedCount ?? 0} composite stories.`,
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
        {busy ? "Seeding…" : "Seed composite EV stories"}
      </button>
      {message ? <p className="text-xs text-slate-600">{message}</p> : null}
    </div>
  );
}
