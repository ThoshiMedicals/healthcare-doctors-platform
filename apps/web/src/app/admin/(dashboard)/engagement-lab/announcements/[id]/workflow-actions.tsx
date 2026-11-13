"use client";

import { useState } from "react";
import type { AnnouncementWorkflowStatus } from "@/engagement-c1/types";

export function WorkflowDemoActions({
  status,
  authorLabel,
}: {
  status: AnnouncementWorkflowStatus;
  authorLabel: string;
}) {
  const [note, setNote] = useState("");

  function present(action: string) {
    setNote(
      `${action} is presentation-only for status “${status}” (author ${authorLabel}). No database transition or notification send.`,
    );
  }

  return (
    <div className="space-y-3 border-t border-slate-200 pt-4">
      <p className="text-sm font-medium text-slate-800">Approval / scheduling presentation</p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="min-h-11 rounded-lg border border-slate-300 px-3 text-sm"
          onClick={() => present("Approve")}
        >
          Approve (demo)
        </button>
        <button
          type="button"
          className="min-h-11 rounded-lg border border-slate-300 px-3 text-sm"
          onClick={() => present("Request changes")}
        >
          Request changes (demo)
        </button>
        <button
          type="button"
          className="min-h-11 rounded-lg border border-slate-300 px-3 text-sm"
          onClick={() => present("Schedule")}
        >
          Schedule (demo)
        </button>
        <button
          type="button"
          className="min-h-11 rounded-lg border border-slate-300 px-3 text-sm"
          onClick={() => present("Retract")}
        >
          Retract (demo)
        </button>
        <button
          type="button"
          disabled
          className="min-h-11 cursor-not-allowed rounded-lg border border-slate-200 px-3 text-sm text-slate-400"
          title="Operational send disabled in C1"
        >
          Publish / send (disabled)
        </button>
      </div>
      <p className="text-sm text-teal-900" aria-live="polite">
        {note}
      </p>
    </div>
  );
}
