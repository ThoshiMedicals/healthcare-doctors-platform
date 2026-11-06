"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Staff = { id: string; name: string | null; email: string | null; username: string | null };

export function PackageActions({
  packageId,
  currentStatus,
  statusOptions,
  recruitmentSource,
  sourceOptions,
  taskPresets,
  staff,
}: {
  packageId: string;
  currentStatus: string;
  statusOptions: Array<[string, string]>;
  recruitmentSource: string | null;
  sourceOptions: Array<[string, string]>;
  taskPresets: Array<{ key: string; title: string }>;
  staff: Staff[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState(currentStatus);
  const [statusNote, setStatusNote] = useState("");
  const [noteBody, setNoteBody] = useState("");
  const [source, setSource] = useState(recruitmentSource || "");
  const [taskTitle, setTaskTitle] = useState(taskPresets[0]?.title || "");
  const [taskKey, setTaskKey] = useState(taskPresets[0]?.key || "");
  const [taskAssignee, setTaskAssignee] = useState("");
  const [taskDue, setTaskDue] = useState("");

  async function run(url: string, init: RequestInit) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(url, init);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Request failed");
      router.refresh();
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
      return null;
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      {error ? (
        <p className="rounded border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">{error}</p>
      ) : null}

      <section className="rounded border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-semibold">Status</h2>
        <div className="mt-3 grid gap-2">
          <select
            className="rounded border border-slate-300 px-3 py-2 text-sm"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            {statusOptions.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <textarea
            className="rounded border border-slate-300 px-3 py-2 text-sm"
            rows={2}
            placeholder="Status note (optional)"
            value={statusNote}
            onChange={(event) => setStatusNote(event.target.value)}
          />
          <button
            type="button"
            disabled={busy || status === currentStatus}
            className="rounded bg-slate-900 px-3 py-2 text-sm text-white disabled:opacity-50"
            onClick={() =>
              run(`/api/admin/gp-pipeline/readiness-packages/${packageId}/status`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status, note: statusNote || undefined }),
              })
            }
          >
            Update status
          </button>
        </div>
      </section>

      <section className="rounded border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-semibold">Recruitment source</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <select
            className="rounded border border-slate-300 px-3 py-2 text-sm"
            value={source}
            onChange={(event) => setSource(event.target.value)}
          >
            <option value="">Not set</option>
            {sourceOptions.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={busy}
            className="rounded border border-slate-300 px-3 py-2 text-sm disabled:opacity-50"
            onClick={() =>
              run(`/api/admin/gp-pipeline/readiness-packages/${packageId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ recruitmentSource: source || null }),
              })
            }
          >
            Save source
          </button>
        </div>
      </section>

      <section className="rounded border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-semibold">Internal note</h2>
        <textarea
          className="mt-3 w-full rounded border border-slate-300 px-3 py-2 text-sm"
          rows={4}
          placeholder="Discussed availability. Interested in skin cancer work…"
          value={noteBody}
          onChange={(event) => setNoteBody(event.target.value)}
        />
        <button
          type="button"
          disabled={busy || !noteBody.trim()}
          className="mt-2 rounded bg-teal-700 px-3 py-2 text-sm text-white disabled:opacity-50"
          onClick={async () => {
            const ok = await run(`/api/admin/gp-pipeline/readiness-packages/${packageId}/notes`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ body: noteBody }),
            });
            if (ok) setNoteBody("");
          }}
        >
          Add note
        </button>
      </section>

      <section className="rounded border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-semibold">Create task</h2>
        <div className="mt-3 grid gap-2">
          <select
            className="rounded border border-slate-300 px-3 py-2 text-sm"
            value={taskKey}
            onChange={(event) => {
              const preset = taskPresets.find((row) => row.key === event.target.value);
              setTaskKey(event.target.value);
              if (preset) setTaskTitle(preset.title);
            }}
          >
            {taskPresets.map((preset) => (
              <option key={preset.key} value={preset.key}>
                {preset.title}
              </option>
            ))}
            <option value="custom">Custom…</option>
          </select>
          <input
            className="rounded border border-slate-300 px-3 py-2 text-sm"
            value={taskTitle}
            onChange={(event) => setTaskTitle(event.target.value)}
            placeholder="Task title"
          />
          <select
            className="rounded border border-slate-300 px-3 py-2 text-sm"
            value={taskAssignee}
            onChange={(event) => setTaskAssignee(event.target.value)}
          >
            <option value="">Unassigned</option>
            {staff.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name || member.username || member.email || member.id}
              </option>
            ))}
          </select>
          <input
            className="rounded border border-slate-300 px-3 py-2 text-sm"
            type="date"
            value={taskDue}
            onChange={(event) => setTaskDue(event.target.value)}
          />
          <button
            type="button"
            disabled={busy || !taskTitle.trim()}
            className="rounded border border-slate-300 px-3 py-2 text-sm disabled:opacity-50"
            onClick={async () => {
              const ok = await run(`/api/admin/gp-pipeline/readiness-packages/${packageId}/tasks`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  title: taskTitle,
                  taskKey: taskKey === "custom" ? null : taskKey,
                  assignedToUserId: taskAssignee || null,
                  dueAt: taskDue || null,
                }),
              });
              if (ok) setTaskDue("");
            }}
          >
            Add task
          </button>
        </div>
      </section>
    </div>
  );
}

export function TaskStatusButton({
  packageId,
  taskId,
  status,
}: {
  packageId: string;
  taskId: string;
  status: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  if (status === "completed") {
    return <span className="text-xs text-emerald-700">Completed</span>;
  }

  return (
    <button
      type="button"
      disabled={busy}
      className="rounded border border-slate-300 px-2 py-1 text-xs disabled:opacity-50"
      onClick={async () => {
        setBusy(true);
        try {
          await fetch(`/api/admin/gp-pipeline/readiness-packages/${packageId}/tasks`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ taskId, status: "completed" }),
          });
          router.refresh();
        } finally {
          setBusy(false);
        }
      }}
    >
      Mark complete
    </button>
  );
}
