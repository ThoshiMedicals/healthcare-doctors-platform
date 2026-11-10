import Link from "next/link";
import { redirect } from "next/navigation";
import { roleAllows } from "@/auth/permissions";
import {
  archivePublicPage,
  createPageDraftPreview,
  publishPageSeo,
  restorePublicPage,
  savePageSeoDraft,
  unpublishPublicPage,
} from "@/cms/actions";
import { editorContext } from "@/cms/context";
import { parseSeoDraft } from "@/documents/page-seo";
import { prisma } from "@/db/prisma";
import { PendingButton } from "../../pending-button";

export const dynamic = "force-dynamic";

export default async function PageAdminDetail({
  params,
  searchParams,
}: {
  params: Promise<{ pageId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { clinic, role } = await editorContext();
  if (
    !clinic ||
    !role ||
    !(
      roleAllows(role, "edit") ||
      roleAllows(role, "unpublish_page") ||
      roleAllows(role, "publish") ||
      roleAllows(role, "preview_draft")
    )
  ) {
    redirect("/admin");
  }
  const { pageId } = await params;
  const query = await searchParams;
  const page = await prisma.page.findFirst({
    where: { id: pageId, clinicId: clinic.id },
    include: {
      publishedRevision: { select: { id: true, immutable: true, createdAt: true } },
      clinicalReview: { select: { reviewerSignedBy: true, approvedBy: true } },
    },
  });
  if (!page) {
    return (
      <main>
        <h1 className="text-2xl font-semibold">Page not found</h1>
        <p className="mt-2 text-sm text-slate-600">That page is not in this clinic.</p>
        <Link href="/admin/pages" className="mt-4 inline-block text-sm text-slate-900 underline">
          Back to Pages
        </Link>
      </main>
    );
  }

  const draft = parseSeoDraft(page.seoDraft);
  const notice = typeof query.unpublished === "string"
    ? "Page unpublished — public requests now 404."
    : typeof query.archived === "string"
      ? "Page archived — public requests now 404."
      : typeof query.restored === "string"
        ? "Page restored to published."
        : typeof query.seoDraft === "string"
          ? "SEO draft saved (not live until published)."
          : typeof query.seoPublished === "string"
            ? "SEO published into live HTML head."
            : typeof query.error === "string"
              ? String(query.reason ?? "Action failed.")
              : null;

  const canUnpublish = roleAllows(role, "unpublish_page");
  const canPublish = roleAllows(role, "publish");
  const canSeo = roleAllows(role, "manage_seo");
  const canPreview = roleAllows(role, "preview_draft");
  const returnTo = `/admin/pages/${page.id}`;

  return (
    <main className="max-w-3xl">
      <p className="text-sm text-slate-500">
        <Link href="/admin/pages" className="underline">
          Pages
        </Link>{" "}
        / {page.path}
      </p>
      <h1 className="mt-2 text-2xl font-semibold">{page.title}</h1>
      <p className="mt-1 text-sm text-slate-600">
        Status: <span className="font-medium">{page.status}</span>
        {page.publishedRevisionId ? ` · revision ${page.publishedRevisionId.slice(0, 8)}…` : " · no published revision"}
      </p>
      {notice ? (
        <p className="mt-4 rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800">{notice}</p>
      ) : null}

      <section className="mt-8 rounded border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-semibold">Public lifecycle</h2>
        <p className="mt-1 text-sm text-slate-600">
          Unpublish and archive stop public serving without deleting revisions. Restore republishes the existing immutable revision through the publish gate.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {canUnpublish && page.status === "published" ? (
            <form action={unpublishPublicPage}>
              <input type="hidden" name="pageId" value={page.id} />
              <input type="hidden" name="returnTo" value={returnTo} />
              <PendingButton label="Unpublish" pendingLabel="Unpublishing…" className="rounded border border-slate-300 px-3 py-2 text-sm" />
            </form>
          ) : null}
          {canUnpublish && page.status !== "archived" ? (
            <form action={archivePublicPage}>
              <input type="hidden" name="pageId" value={page.id} />
              <input type="hidden" name="returnTo" value={returnTo} />
              <PendingButton label="Archive" pendingLabel="Archiving…" className="rounded border border-slate-300 px-3 py-2 text-sm" />
            </form>
          ) : null}
          {canPublish && page.status !== "published" ? (
            <form action={restorePublicPage}>
              <input type="hidden" name="pageId" value={page.id} />
              <input type="hidden" name="returnTo" value={returnTo} />
              <PendingButton
                label="Restore and publish"
                pendingLabel="Restoring…"
                className="rounded bg-slate-900 px-3 py-2 text-sm font-medium text-white"
              />
            </form>
          ) : null}
          {canPreview ? (
            <form action={createPageDraftPreview}>
              <input type="hidden" name="pageId" value={page.id} />
              <input type="hidden" name="returnTo" value={returnTo} />
              <PendingButton label="Draft preview" pendingLabel="Opening…" className="rounded border border-slate-300 px-3 py-2 text-sm" />
            </form>
          ) : null}
        </div>
      </section>

      <section className="mt-8 rounded border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-semibold">SEO metadata</h2>
        <p className="mt-1 text-sm text-slate-600">
          Draft SEO stays off the public site until a publisher applies it. Live HTML head is rewritten at serve time from published Page columns.
        </p>
        {canSeo ? (
          <form action={savePageSeoDraft} className="mt-4 grid gap-3">
            <input type="hidden" name="pageId" value={page.id} />
            <input type="hidden" name="returnTo" value={returnTo} />
            <label className="grid gap-1 text-sm">
              Meta title
              <input
                name="title"
                defaultValue={draft?.title ?? page.title}
                className="rounded border border-slate-300 px-3 py-2"
                maxLength={70}
                required
              />
            </label>
            <label className="grid gap-1 text-sm">
              Meta description
              <textarea
                name="description"
                defaultValue={draft?.description ?? page.description}
                className="min-h-24 rounded border border-slate-300 px-3 py-2"
                maxLength={320}
                required
              />
            </label>
            <label className="grid gap-1 text-sm">
              Canonical path
              <input
                name="canonicalPath"
                defaultValue={draft?.canonicalPath ?? page.canonicalPath}
                className="rounded border border-slate-300 px-3 py-2"
                required
              />
            </label>
            <label className="grid gap-1 text-sm">
              Robots
              <input
                name="robots"
                defaultValue={draft?.robots ?? page.robots}
                className="rounded border border-slate-300 px-3 py-2"
                required
              />
            </label>
            <label className="grid gap-1 text-sm">
              Indexable
              <select
                name="indexable"
                defaultValue={String(draft?.indexable ?? page.indexable)}
                className="rounded border border-slate-300 px-3 py-2"
              >
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </label>
            <label className="grid gap-1 text-sm">
              Open Graph title
              <input
                name="ogTitle"
                defaultValue={draft?.ogTitle ?? page.title}
                className="rounded border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="grid gap-1 text-sm">
              Open Graph description
              <textarea
                name="ogDescription"
                defaultValue={draft?.ogDescription ?? page.description}
                className="min-h-20 rounded border border-slate-300 px-3 py-2"
              />
            </label>
            <PendingButton label="Save SEO draft" pendingLabel="Saving…" className="w-fit rounded border border-slate-300 px-3 py-2 text-sm" />
          </form>
        ) : (
          <p className="mt-3 text-sm text-slate-600">Your role cannot edit SEO drafts.</p>
        )}
        {canPublish ? (
          <form action={publishPageSeo} className="mt-3">
            <input type="hidden" name="pageId" value={page.id} />
            <input type="hidden" name="returnTo" value={returnTo} />
            <PendingButton
              label="Publish SEO to live HTML"
              pendingLabel="Publishing…"
              className="rounded bg-slate-900 px-3 py-2 text-sm font-medium text-white"
            />
          </form>
        ) : null}
      </section>
    </main>
  );
}
