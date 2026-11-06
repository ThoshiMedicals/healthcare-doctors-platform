"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const CATEGORIES = [
  "early_career",
  "established",
  "returning",
  "part_time",
  "special_interest",
] as const;

export function CreateStoryForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/admin/story-capture/stories", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          workingTitle: fd.get("workingTitle"),
          subjectDisplayName: fd.get("subjectDisplayName"),
          subjectEmail: fd.get("subjectEmail") || undefined,
          primaryCategory: fd.get("primaryCategory"),
          specialInterestLabel: fd.get("specialInterestLabel") || undefined,
          internalNotes: fd.get("internalNotes") || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      router.push(`/admin/story-capture/${data.story.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
      <label className="block text-sm">
        <span className="font-medium">Working title</span>
        <input name="workingTitle" required className="mt-1 w-full rounded-lg border px-3 py-2" />
      </label>
      <label className="block text-sm">
        <span className="font-medium">Subject display name (internal)</span>
        <input
          name="subjectDisplayName"
          required
          className="mt-1 w-full rounded-lg border px-3 py-2"
        />
      </label>
      <label className="block text-sm">
        <span className="font-medium">Subject email</span>
        <input name="subjectEmail" type="email" className="mt-1 w-full rounded-lg border px-3 py-2" />
      </label>
      <label className="block text-sm">
        <span className="font-medium">Primary category</span>
        <select name="primaryCategory" required className="mt-1 w-full rounded-lg border px-3 py-2">
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm">
        <span className="font-medium">Special interest label (if applicable)</span>
        <input name="specialInterestLabel" className="mt-1 w-full rounded-lg border px-3 py-2" />
      </label>
      <label className="block text-sm">
        <span className="font-medium">Internal notes</span>
        <textarea name="internalNotes" rows={3} className="mt-1 w-full rounded-lg border px-3 py-2" />
      </label>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <button
        type="submit"
        disabled={busy}
        className="min-h-11 rounded-lg bg-slate-900 px-4 text-sm font-medium text-white disabled:opacity-50"
      >
        {busy ? "Creating…" : "Create story"}
      </button>
    </form>
  );
}
