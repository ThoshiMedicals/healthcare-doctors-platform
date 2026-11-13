"use client";

import { useMemo, useState } from "react";
import type { DemoPreferenceTopic } from "@/engagement-c1/types";

export function CreateAnnouncementDemoForm({ topics }: { topics: DemoPreferenceTopic[] }) {
  const [title, setTitle] = useState("[DEMO] ");
  const [summary, setSummary] = useState("");
  const [body, setBody] = useState("");
  const [classification, setClassification] = useState("operational");
  const [selected, setSelected] = useState<string[]>(["operational"]);
  const [schedule, setSchedule] = useState("");
  const [note, setNote] = useState("");

  const preview = useMemo(
    () => ({
      title: title.trim() || "[DEMO] Untitled",
      summary: summary.trim() || "Summary preview…",
      body: body.trim() || "Body preview…",
      classification,
      topics: selected,
      schedule: schedule || "Immediate (presentation only)",
    }),
    [title, summary, body, classification, selected, schedule],
  );

  function toggleTopic(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form
        className="space-y-4 rounded-xl border border-slate-200 bg-white p-4"
        onSubmit={(event) => {
          event.preventDefault();
          setNote(
            "Draft saved in this browser session only. No database write, approval request, or send occurred.",
          );
        }}
      >
        <label className="block text-sm">
          <span className="font-medium text-slate-800">Title</span>
          <input
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-slate-800">Summary</span>
          <input
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-slate-800">Body</span>
          <textarea
            className="mt-1 min-h-32 w-full rounded border border-slate-300 px-3 py-2"
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-slate-800">Classification</span>
          <select
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
            value={classification}
            onChange={(e) => setClassification(e.target.value)}
          >
            <option value="operational">Operational</option>
            <option value="educational">Educational</option>
            <option value="promotional">Promotional</option>
          </select>
        </label>
        <fieldset>
          <legend className="text-sm font-medium text-slate-800">Topics</legend>
          <div className="mt-2 space-y-2">
            {topics.map((topic) => (
              <label key={topic.id} className="flex min-h-11 items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={selected.includes(topic.id)}
                  onChange={() => toggleTopic(topic.id)}
                />
                {topic.label}
              </label>
            ))}
          </div>
        </fieldset>
        <label className="block text-sm">
          <span className="font-medium text-slate-800">Schedule (presentation)</span>
          <input
            type="datetime-local"
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
            value={schedule}
            onChange={(e) => setSchedule(e.target.value)}
          />
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            className="inline-flex min-h-11 items-center rounded-lg bg-slate-900 px-3 text-sm font-medium text-white"
          >
            Save draft (local demo)
          </button>
          <button
            type="button"
            className="inline-flex min-h-11 items-center rounded-lg border border-slate-300 px-3 text-sm font-medium"
            onClick={() =>
              setNote("Submit for approval is presentation-only. No workflow email or DB transition.")
            }
          >
            Submit for approval (demo)
          </button>
          <button
            type="button"
            disabled
            title="Operational send disabled in C1"
            className="inline-flex min-h-11 cursor-not-allowed items-center rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-400"
          >
            Publish / send (disabled)
          </button>
        </div>
        <p className="text-sm text-teal-900" aria-live="polite">
          {note}
        </p>
      </form>

      <aside className="rounded-xl border border-slate-200 bg-slate-50 p-4" aria-label="Patient mobile preview">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Patient preview</p>
        <div className="mx-auto mt-3 w-full max-w-[320px] rounded-[28px] border border-slate-300 bg-white p-4 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wide text-teal-700">Practice notice</p>
          <h2 className="mt-1 font-serif text-lg text-slate-900">{preview.title}</h2>
          <p className="mt-2 text-sm text-slate-600">{preview.summary}</p>
          <p className="mt-3 whitespace-pre-wrap text-sm text-slate-800">{preview.body}</p>
          <p className="mt-4 text-xs text-slate-500">
            {preview.classification} · {preview.topics.join(", ")} · {preview.schedule}
          </p>
        </div>
      </aside>
    </div>
  );
}
