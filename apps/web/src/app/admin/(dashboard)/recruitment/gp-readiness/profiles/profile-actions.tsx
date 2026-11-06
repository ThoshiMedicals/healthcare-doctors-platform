"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  profileId: string;
  currentStatus: string;
  practitionerId: string | null;
  practitioners: Array<{ id: string; name: string; slug: string }>;
};

export function ProfileActions({ profileId, currentStatus, practitionerId, practitioners }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [linkPractitionerId, setLinkPractitionerId] = useState(practitionerId || "");

  async function postJson(url: string, body: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Request failed");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setBusy(false);
    }
  }

  async function patchFields(body: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/gp-pipeline/doctor-profiles/${profileId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Update failed");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-6 space-y-4 rounded border border-slate-200 bg-white p-4">
      <h2 className="text-lg font-semibold">Review actions</h2>
      {error ? <p className="rounded border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">{error}</p> : null}
      <label className="block text-sm text-slate-700">
        Note
        <textarea
          className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
          rows={3}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Discussed Saturday availability…"
        />
      </label>
      <div className="flex flex-wrap gap-2">
        {currentStatus === "draft" ? (
          <button
            type="button"
            disabled={busy}
            className="rounded bg-slate-900 px-3 py-2 text-sm text-white disabled:opacity-50"
            onClick={() =>
              postJson(`/api/admin/gp-pipeline/doctor-profiles/${profileId}/status`, {
                status: "awaiting_review",
                note,
              })
            }
          >
            Submit for review
          </button>
        ) : null}
        {currentStatus === "awaiting_review" ? (
          <>
            <button
              type="button"
              disabled={busy}
              className="rounded bg-emerald-700 px-3 py-2 text-sm text-white disabled:opacity-50"
              onClick={() =>
                postJson(`/api/admin/gp-pipeline/doctor-profiles/${profileId}/status`, {
                  status: "approved",
                  note,
                })
              }
            >
              Approve
            </button>
            <button
              type="button"
              disabled={busy}
              className="rounded border border-slate-300 px-3 py-2 text-sm disabled:opacity-50"
              onClick={() =>
                postJson(`/api/admin/gp-pipeline/doctor-profiles/${profileId}/status`, {
                  status: "draft",
                  note: note || "Returned to draft for edits",
                })
              }
            >
              Return to draft
            </button>
          </>
        ) : null}
        {currentStatus === "approved" || currentStatus === "published" ? (
          <button
            type="button"
            disabled={busy}
            className="rounded bg-teal-700 px-3 py-2 text-sm text-white disabled:opacity-50"
            onClick={() =>
              postJson(`/api/admin/gp-pipeline/doctor-profiles/${profileId}/status`, {
                action: "publish",
              })
            }
          >
            Publish to practitioner page
          </button>
        ) : null}
        {currentStatus !== "archived" ? (
          <button
            type="button"
            disabled={busy}
            className="rounded border border-slate-300 px-3 py-2 text-sm disabled:opacity-50"
            onClick={() =>
              postJson(`/api/admin/gp-pipeline/doctor-profiles/${profileId}/status`, {
                status: "archived",
                note,
              })
            }
          >
            Archive
          </button>
        ) : (
          <button
            type="button"
            disabled={busy}
            className="rounded border border-slate-300 px-3 py-2 text-sm disabled:opacity-50"
            onClick={() =>
              postJson(`/api/admin/gp-pipeline/doctor-profiles/${profileId}/status`, {
                status: "draft",
                note,
              })
            }
          >
            Restore to draft
          </button>
        )}
      </div>

      <div className="border-t border-slate-100 pt-4">
        <p className="text-sm font-medium text-slate-800">Link practitioner page</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <select
            className="min-w-[240px] rounded border border-slate-300 px-3 py-2 text-sm"
            value={linkPractitionerId}
            onChange={(event) => setLinkPractitionerId(event.target.value)}
          >
            <option value="">Select practitioner…</option>
            {practitioners.map((practitioner) => (
              <option key={practitioner.id} value={practitioner.id}>
                {practitioner.name} ({practitioner.slug})
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={busy || !linkPractitionerId}
            className="rounded border border-slate-300 px-3 py-2 text-sm disabled:opacity-50"
            onClick={() => patchFields({ practitionerId: linkPractitionerId || null })}
          >
            Save link
          </button>
        </div>
      </div>

      <div className="border-t border-slate-100 pt-4">
        <p className="text-sm font-medium text-slate-800">Exports</p>
        <div className="mt-2 flex flex-wrap gap-2 text-sm">
          <a className="underline" href={`/api/admin/gp-pipeline/doctor-profiles/${profileId}/export?kind=website`}>
            Website package
          </a>
          <a className="underline" href={`/api/admin/gp-pipeline/doctor-profiles/${profileId}/export?kind=booking`}>
            Booking package
          </a>
          <a
            className="underline"
            href={`/api/admin/gp-pipeline/doctor-profiles/${profileId}/export?kind=announcement`}
          >
            Announcement package
          </a>
          <a
            className="underline"
            href={`/api/admin/gp-pipeline/doctor-profiles/${profileId}/export?kind=website&format=json`}
          >
            JSON
          </a>
        </div>
      </div>
    </div>
  );
}

export function SeedAndImportActions({
  practitioners,
}: {
  practitioners: Array<{ id: string; name: string; slug: string }>;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [practitionerId, setPractitionerId] = useState("");

  async function run(body: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/gp-pipeline/doctor-profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Request failed");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-4 rounded border border-slate-200 bg-white p-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Migration tools</h2>
      {error ? <p className="mt-2 text-sm text-rose-700">{error}</p> : null}
      <div className="mt-3 flex flex-wrap items-end gap-2">
        <button
          type="button"
          disabled={busy}
          className="rounded bg-slate-900 px-3 py-2 text-sm text-white disabled:opacity-50"
          onClick={() => run({ action: "seed_examples" })}
        >
          Seed Golnar / James + import 2 live GPs
        </button>
        <label className="text-sm text-slate-700">
          Import existing
          <select
            className="ml-2 rounded border border-slate-300 px-3 py-2"
            value={practitionerId}
            onChange={(event) => setPractitionerId(event.target.value)}
          >
            <option value="">Choose practitioner…</option>
            {practitioners.map((practitioner) => (
              <option key={practitioner.id} value={practitioner.id}>
                {practitioner.name}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          disabled={busy || !practitionerId}
          className="rounded border border-slate-300 px-3 py-2 text-sm disabled:opacity-50"
          onClick={() => run({ action: "import", practitionerId })}
        >
          Import profile
        </button>
      </div>
    </div>
  );
}
