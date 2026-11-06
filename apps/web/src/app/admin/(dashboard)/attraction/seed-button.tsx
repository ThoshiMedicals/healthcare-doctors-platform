"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function SeedAttractionDefaultsButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function onSeed(action: "seed_defaults" | "seed_publish_ready") {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/attraction/documents", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Seed failed");
      if (action === "seed_publish_ready") {
        setMessage(
          `Publish-ready: created ${data.createdCount}, updated ${data.updatedCount}`,
        );
      } else {
        setMessage(`Created ${data.createdCount} document(s)`);
      }
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Seed failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => onSeed("seed_publish_ready")}
        disabled={busy}
        className="inline-flex min-h-11 items-center rounded-lg bg-slate-900 px-3 text-sm font-medium text-white disabled:opacity-60"
      >
        {busy ? "Seeding…" : "Populate publish-ready content"}
      </button>
      <button
        type="button"
        onClick={() => onSeed("seed_defaults")}
        disabled={busy}
        className="inline-flex min-h-11 items-center rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium disabled:opacity-60"
      >
        Seed Phase 1 shells
      </button>
      {message ? <span className="text-sm text-slate-600">{message}</span> : null}
    </div>
  );
}
