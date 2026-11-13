import { requireAction } from "@/cms/context";
import { DEMO_SUBSCRIBERS, categoryLabel } from "@/engagement-c1/dummy-data";
import type { EngagementCategory } from "@/engagement-c1/types";
import { EngagementLabChrome } from "../lab-chrome";

export default async function EngagementLabSubscribersPage() {
  await requireAction("edit");
  return (
    <EngagementLabChrome title="Subscribers & consent">
      <p className="text-sm text-slate-600">
        Device-scoped demonstration rows only — no patient names, phones, or HotDoc IDs.
      </p>
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-3">Installation key</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3">Topics</th>
              <th className="px-3 py-3">Last seen</th>
              <th className="px-3 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {DEMO_SUBSCRIBERS.map((row) => (
              <tr key={row.installationKeyPrefix} className="border-b border-slate-100">
                <td className="px-3 py-3 font-mono text-xs">{row.installationKeyPrefix}</td>
                <td className="px-3 py-3">{row.status}</td>
                <td className="px-3 py-3">
                  {row.topics.length
                    ? row.topics.map((t) => categoryLabel(t as EngagementCategory)).join(", ")
                    : "—"}
                </td>
                <td className="px-3 py-3">{row.lastSeenAt}</td>
                <td className="px-3 py-3">
                  <button
                    type="button"
                    disabled
                    className="cursor-not-allowed rounded border border-slate-200 px-2 py-1 text-xs text-slate-400"
                  >
                    Invalidate (disabled)
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <section className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
        <h2 className="font-semibold text-slate-900">Retention (presentation)</h2>
        <p className="mt-2">
          Live policy will follow the C0 privacy pack. Export of consent evidence remains clinic-admin
          only and must redact push endpoints.
        </p>
      </section>
    </EngagementLabChrome>
  );
}
