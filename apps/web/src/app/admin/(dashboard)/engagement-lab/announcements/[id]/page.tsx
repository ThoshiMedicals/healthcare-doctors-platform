import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAction } from "@/cms/context";
import { categoryLabel, findDemoAnnouncement } from "@/engagement-c1/dummy-data";
import { EngagementLabChrome } from "../../lab-chrome";
import { WorkflowDemoActions } from "./workflow-actions";

export default async function EngagementLabAnnouncementDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAction("edit");
  const { id } = await params;
  const row = findDemoAnnouncement(id);
  if (!row) notFound();

  return (
    <EngagementLabChrome title="Announcement workflow">
      <article className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
        <p className="text-xs uppercase tracking-wide text-slate-500">
          {row.classification} · {categoryLabel(row.category)} · {row.status}
        </p>
        <h2 className="text-2xl font-semibold text-slate-900">{row.title}</h2>
        <p className="text-slate-600">{row.summary}</p>
        <div className="whitespace-pre-wrap text-sm leading-relaxed text-slate-800">{row.body}</div>
        <dl className="grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
          <div>
            <dt className="font-medium">Author</dt>
            <dd>{row.authorLabel}</dd>
          </div>
          <div>
            <dt className="font-medium">Approver</dt>
            <dd>{row.approverLabel ?? "—"}</dd>
          </div>
          <div>
            <dt className="font-medium">Published</dt>
            <dd>{row.publishedAt ?? "—"}</dd>
          </div>
          <div>
            <dt className="font-medium">Scheduled</dt>
            <dd>{row.scheduledFor ?? "—"}</dd>
          </div>
        </dl>
        <WorkflowDemoActions status={row.status} authorLabel={row.authorLabel} />
        <p>
          <Link href="/admin/engagement-lab/announcements" className="text-teal-800 underline">
            Back to list
          </Link>
        </p>
      </article>
    </EngagementLabChrome>
  );
}
