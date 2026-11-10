"use client";

import { useEffect } from "react";

export default function AdminDashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[admin] dashboard route error", error.digest ?? error.message);
  }, [error]);

  return (
    <main className="mx-auto max-w-xl space-y-4 p-6">
      <h1 className="text-xl font-semibold">Admin page failed to load</h1>
      <p className="text-sm text-slate-600">
        A server-side error interrupted this CMS section. This is often a brief database pool timeout
        under load — retry usually works. Public pages are unaffected.
      </p>
      {error.digest ? (
        <p className="font-mono text-xs text-slate-500">Digest: {error.digest}</p>
      ) : null}
      <button
        type="button"
        className="rounded border border-slate-300 bg-white px-3 py-2 text-sm"
        onClick={() => reset()}
      >
        Try again
      </button>
    </main>
  );
}
