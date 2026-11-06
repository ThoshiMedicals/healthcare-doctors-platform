"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function PipelineActions() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function seedDemo() {
    setBusy(true);
    setMessage(null);
    try {
      const readiness = await fetch("/api/admin/gp-pipeline/readiness", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          applicantName: "Composite GP · demo",
          applicantEmail: "demo.gp@example.com",
          totalScore: 84,
          answersJson: { credentials: "ready", availability: "part_week", advisory: true },
        }),
      }).then((r) => r.json());
      if (readiness.error) throw new Error(readiness.error);

      const eoi = await fetch("/api/admin/gp-pipeline/eoi", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          applicant: {
            name: "Composite GP · demo",
            email: "demo.gp@example.com",
            phone: "0412345678",
          },
          credentials: {
            ahpraRegistration: "MED0000000001",
            racgpFellowship: "yes",
            acrrmFellowship: "no",
          },
          preferences: {
            specialInterests: ["womens_health", "chronic_disease"],
            preferredStartDate: new Date().toISOString(),
            sessionsPerWeek: 3,
            preferredSessions: ["monday_afternoon", "wednesday_morning", "friday_afternoon"],
          },
          readinessResultId: readiness.result?.id,
          source: "localhost_test",
        }),
      }).then((r) => r.json());
      if (eoi.error) throw new Error(eoi.error);

      const match = await fetch("/api/admin/gp-pipeline/session-match", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          preferredSessions: ["monday_afternoon", "wednesday_morning", "friday_afternoon"],
          enquiryId: eoi.enquiry.id,
          doctorDisplayName: eoi.enquiry.doctorDisplayName,
          source: "enquiry_session_prefs",
          persist: true,
        }),
      }).then((r) => r.json());
      if (match.error) throw new Error(match.error);

      setMessage(
        `Demo path: readiness ${readiness.band?.id} → EOI ${eoi.enquiry.id} → match ${match.compatibilityScore}%`,
      );
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Demo seed failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        disabled={busy}
        onClick={seedDemo}
        className="inline-flex min-h-11 items-center rounded-lg bg-slate-900 px-3 text-sm font-medium text-white disabled:opacity-60"
      >
        {busy ? "Running…" : "Seed demo: Readiness → EOI → Match"}
      </button>
      {message ? <span className="text-sm text-slate-600">{message}</span> : null}
    </div>
  );
}
