import { notFound } from "next/navigation";
import { saveKnowledgeTopic } from "@/cms/actions";
import { requireAction } from "@/cms/context";
import { editorText } from "@/cms/modules";
import { readLede, readTitle } from "@/cms/overlay";
import { prisma } from "@/db/prisma";
import { Area, Field, GateNotice, SavedNotice, SaveBar, ViewPublicPage } from "../../../ui";
import { WorkflowControls } from "../../../workflow-controls";

export const dynamic = "force-dynamic";

export default async function TopicEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; published?: string; error?: string; reason?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const { clinic, role } = await requireAction("edit");
  const row = await prisma.knowledgeTopic.findFirst({
    where: { id, clinicId: clinic.id },
    include: { page: { select: { path: true, publishedRevision: { select: { html: true } } } } },
  });
  if (!row) notFound();
  const html = row.page?.publishedRevision?.html ?? "";
  const returnTo = `/admin/knowledge/topics/${row.id}`;

  return (
    <main>
      <h1 className="text-2xl font-semibold">{readTitle(html) || row.title}</h1>
      <ViewPublicPage path={row.page?.path} />
      <SavedNotice saved={query.saved} published={query.published} status={row.status} />
      <GateNotice error={query.error} reason={query.reason} />
      <form action={saveKnowledgeTopic} className="mt-6 grid max-w-2xl gap-4">
        <input type="hidden" name="id" value={row.id} />
        <Field
          label="Title"
          name="title"
          defaultValue={editorText(row.status, row.publishedPayload, row.title, readTitle(html))}
          required
          impact={["Topic page", "Knowledge navigation", "Schema name"]}
        />
        <Area
          label="Summary"
          name="summary"
          defaultValue={editorText(row.status, row.publishedPayload, row.summary, readLede(html))}
          impact={["Topic page"]}
        />
        <p className="text-sm text-slate-600">
          Saving keeps this as a draft. The title updates the topic heading, breadcrumb, and knowledge navigation
          where that heading is already shown. The summary updates the visible introduction.
        </p>
        <SaveBar historyHref={`/admin/revisions/knowledge_topic/${row.id}`} />
      </form>
      <WorkflowControls entityType="knowledge_topic" entityId={row.id} status={row.status} returnTo={returnTo} role={role} />
    </main>
  );
}
