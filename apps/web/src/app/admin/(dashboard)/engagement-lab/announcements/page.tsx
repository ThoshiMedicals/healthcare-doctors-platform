import Link from "next/link";
import { requireAction } from "@/cms/context";
import { DEMO_ANNOUNCEMENTS, categoryLabel } from "@/engagement-c1/dummy-data";
import { EngagementLabChrome } from "../lab-chrome";

export default async function EngagementLabAnnouncementsPage() {
  await requireAction("edit");
  return (
    <EngagementLabChrome title="Announcements">
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-3">Title</th>
              <th className="px-3 py-3">Class</th>
              <th className="px-3 py-3">Category</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3">Schedule / publish</th>
              <th className="px-3 py-3">Author</th>
            </tr>
          </thead>
          <tbody>
            {DEMO_ANNOUNCEMENTS.map((row) => (
              <tr key={row.id} className="border-b border-slate-100">
                <td className="px-3 py-3">
                  <Link className="font-medium text-teal-800 underline" href={`/admin/engagement-lab/announcements/${row.id}`}>
                    {row.title}
                  </Link>
                </td>
                <td className="px-3 py-3">{row.classification}</td>
                <td className="px-3 py-3">{categoryLabel(row.category)}</td>
                <td className="px-3 py-3">{row.status}</td>
                <td className="px-3 py-3 text-slate-600">
                  {row.scheduledFor || row.publishedAt || "—"}
                </td>
                <td className="px-3 py-3">{row.authorLabel}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </EngagementLabChrome>
  );
}
