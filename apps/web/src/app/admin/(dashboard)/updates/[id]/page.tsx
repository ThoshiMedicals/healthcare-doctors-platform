import { notFound } from "next/navigation";
import { saveUpdate } from "@/cms/actions";
import { requireAction } from "@/cms/context";
import { editorText } from "@/cms/modules";
import { readTitle, readUpdateAuthor, readUpdateSummary } from "@/cms/overlay";
import { prisma } from "@/db/prisma";
import { Area, Field, GateNotice, SavedNotice, SaveBar, ViewPublicPage } from "../../ui";
import { WorkflowControls } from "../../workflow-controls";

export const dynamic = "force-dynamic";

export default async function UpdateEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; published?: string; error?: string; reason?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const { clinic, role } = await requireAction("edit");
  const row = await prisma.practiceUpdate.findFirst({
    where: { id, clinicId: clinic.id },
    include: { page: { select: { path: true, publishedRevision: { select: { html: true } } } } },
  });
  if (!row) notFound();
  const html = row.page?.publishedRevision?.html ?? "";
  const returnTo = `/admin/updates/${row.id}`;

  return (
    <main>
      <h1 className="text-2xl font-semibold">{row.title}</h1>
      <ViewPublicPage path={row.page?.path} />
      <SavedNotice saved={query.saved} published={query.published} status={row.status} />
      <GateNotice error={query.error} reason={query.reason} />
      <form action={saveUpdate} className="mt-6 grid max-w-2xl gap-4">
        <input type="hidden" name="id" value={row.id} />
        <Field label="Title" name="title" defaultValue={editorText(row.status, row.publishedPayload, row.title, readTitle(html))} required impact={["Update page", "Updates index", "Homepage card", "Digital Reception"]} />
        <Area label="Summary" name="summary" defaultValue={editorText(row.status, row.publishedPayload, row.summary, readUpdateSummary(html))} impact={["Update page", "Updates index", "Homepage card", "Digital Reception"]} />
        <Field label="Author" name="author" defaultValue={editorText(row.status, row.publishedPayload, (row.author ?? "").replace(/^By\s+/, ""), readUpdateAuthor(html))} impact={["Update page", "Updates index"]} />
        <SaveBar historyHref={`/admin/revisions/practice_update/${row.id}`} />
      </form>
      <WorkflowControls entityType="practice_update" entityId={row.id} status={row.status} returnTo={returnTo} role={role} />
    </main>
  );
}
