"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function EnquiryActions({
  enquiryId,
  status,
  onboardingCaseId,
  currentStageId,
}: {
  enquiryId: string;
  status: string;
  onboardingCaseId: string | null;
  currentStageId: string | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [rationale, setRationale] = useState("");

  async function call(url: string, body: unknown) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Request failed");
    return data;
  }

  return (
    <section className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50/40 p-4">
      <h2 className="text-lg font-semibold">Admin actions</h2>
      <p className="text-sm text-slate-600">Current enquiry status: {status}</p>
      <label className="block text-sm">
        Gate / status note
        <textarea
          className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
          rows={2}
          value={rationale}
          onChange={(e) => setRationale(e.target.value)}
        />
      </label>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          className="rounded-lg border bg-white px-3 py-2 text-sm disabled:opacity-60"
          onClick={async () => {
            setBusy(true);
            try {
              await call(`/api/admin/gp-pipeline/enquiries/${enquiryId}/status`, {
                status: "reviewing",
                note: rationale || "Human triage to reviewing",
              });
              setMessage("Status → reviewing");
              router.refresh();
            } catch (e) {
              setMessage(e instanceof Error ? e.message : "Failed");
            } finally {
              setBusy(false);
            }
          }}
        >
          Mark reviewing
        </button>
        <button
          type="button"
          disabled={busy || Boolean(onboardingCaseId)}
          className="rounded-lg bg-slate-900 px-3 py-2 text-sm text-white disabled:opacity-60"
          onClick={async () => {
            setBusy(true);
            try {
              const data = await call(`/api/admin/gp-pipeline/enquiries/${enquiryId}/status`, {
                action: "open_onboarding",
              });
              setMessage(`Onboarding ${data.onboarding.id}`);
              router.refresh();
            } catch (e) {
              setMessage(e instanceof Error ? e.message : "Failed");
            } finally {
              setBusy(false);
            }
          }}
        >
          Open onboarding
        </button>
        {onboardingCaseId && currentStageId ? (
          <button
            type="button"
            disabled={busy || rationale.trim().length < 3}
            className="rounded-lg bg-emerald-800 px-3 py-2 text-sm text-white disabled:opacity-60"
            onClick={async () => {
              setBusy(true);
              try {
                // Mark required admin tasks done for current stage, then gate
                const detail = await fetch(
                  `/api/admin/gp-pipeline/onboarding/${onboardingCaseId}/gates`,
                ).then((r) => r.json());
                const tasks =
                  detail.onboarding?.tasks?.filter(
                    (t: { stageId: string; required: boolean; owner: string; status: string }) =>
                      t.stageId === currentStageId &&
                      t.required &&
                      t.owner !== "external" &&
                      t.status !== "done",
                  ) ?? [];
                for (const t of tasks) {
                  await call(`/api/admin/gp-pipeline/onboarding/${onboardingCaseId}/tasks`, {
                    taskKey: t.taskKey,
                    status: "done",
                  });
                }
                const gate = await call(
                  `/api/admin/gp-pipeline/onboarding/${onboardingCaseId}/gates`,
                  {
                    stageId: currentStageId,
                    decision: "approve_advance",
                    rationale,
                  },
                );
                setMessage(
                  gate.first90
                    ? `Advanced + First 90 ${gate.first90.id}`
                    : `Advanced from ${currentStageId}`,
                );
                router.refresh();
              } catch (e) {
                setMessage(e instanceof Error ? e.message : "Gate failed");
              } finally {
                setBusy(false);
              }
            }}
          >
            Approve stage advance
          </button>
        ) : null}
      </div>
      {message ? <p className="text-sm text-slate-700">{message}</p> : null}
    </section>
  );
}
