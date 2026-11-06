"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function GraphIngestButton({
  graphSnapshotId,
  intelligenceRunId,
}: {
  graphSnapshotId: string | null;
  intelligenceRunId: string | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function onIngest() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/attraction-analytics/graph-ingest", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ windowDays: 28 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ingest failed");
      setMessage(
        `Snapshot ${data.snapshot?.id} · signals ${data.signalCount} · ${data.notice}`,
      );
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Ingest failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="space-y-2 rounded-xl border border-amber-200 bg-amber-50/50 p-4 text-sm">
      <h2 className="font-semibold">Knowledge Graph + Content Intelligence ingest</h2>
      <p className="text-slate-600">
        Latest graph: {graphSnapshotId || "none"} · intel run: {intelligenceRunId || "none"}
      </p>
      <button
        type="button"
        disabled={busy}
        onClick={onIngest}
        className="inline-flex min-h-11 items-center rounded-lg bg-slate-900 px-3 font-medium text-white disabled:opacity-60"
      >
        {busy ? "Ingesting…" : "Run graph / intelligence ingest"}
      </button>
      {message ? <p className="text-slate-700">{message}</p> : null}
    </section>
  );
}
