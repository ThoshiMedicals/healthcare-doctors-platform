import { rollbackRevision } from "@/cms/actions";
import { requireAction } from "@/cms/context";
import { assetRevisionSnapshot } from "@/cms/image-replacement";
import { revisionChanges } from "@/cms/revision-summary";
import { listRevisions } from "@/cms/revisions";
import { brisbaneTime } from "@/cms/staff-labels";
import { roleAllows } from "@/auth/permissions";
import { prisma } from "@/db/prisma";
import { PendingButton } from "../../../pending-button";
import { SavedNotice } from "../../../ui";
import { ImageRevisionHistory } from "../../image-revision-history";

export const dynamic = "force-dynamic";

export default async function RevisionsPage({
  params,
  searchParams,
}: {
  params: Promise<{ entityType: string; entityId: string }>;
  searchParams: Promise<{ rolled?: string; error?: string }>;
}) {
  const { entityType, entityId } = await params;
  const query = await searchParams;
  const { clinic, role } = await requireAction("edit");
  const revisions = await listRevisions(clinic.id, entityType, entityId);
  const canRollback = roleAllows(role, "rollback");
  const image =
    entityType === "media_asset"
      ? await prisma.mediaAsset.findFirst({ where: { id: entityId, clinicId: clinic.id } })
      : null;

  return (
    <main>
      <h1 className="text-2xl font-semibold">{image ? "Image version history" : "Revision history"}</h1>
      {image ? (
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          Newest first. Current is the image in use. Previous is the image from immediately before that.
          Choosing another version replaces the current image with that version’s result, including the published
          file when the version has one. The filename and the page layout stay the same. Nothing is deleted.
        </p>
      ) : (
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          Every content change is kept. Rollback writes a new revision from an earlier version. Nothing is
          deleted.
        </p>
      )}
      {query.error === "archive" ? (
        <p className="mt-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          The earlier image file is not in the archive, so the current file was left unchanged.
        </p>
      ) : null}
      <SavedNotice
        rolled={query.rolled}
        kind={image ? "image" : entityType === "clinical_review" ? "governance" : "content"}
      />
      {image ? (
        <ImageRevisionHistory revisions={revisions} current={assetRevisionSnapshot(image)} canRollback={canRollback} />
      ) : (
      <ol className="mt-6 space-y-4">
        {revisions.length === 0 ? <li className="text-sm text-slate-600">No revisions yet.</li> : null}
        {revisions.map((revision) => (
          <li key={revision.id} className="rounded border border-slate-200 bg-white p-4 text-sm">
            <p>
              <span className="font-medium">{revision.author?.username ?? revision.author?.name ?? "Unknown user"}</span>
              <span className="text-slate-500"> · {brisbaneTime(revision.createdAt)} Brisbane</span>
            </p>
            <div className="mt-3">
              <p className="font-medium">What changed</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-700">
                {revisionChanges(revision.previous, revision.next).map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
            {canRollback ? (
              <form action={rollbackRevision} className="mt-3">
                <input type="hidden" name="revisionId" value={revision.id} />
                <PendingButton label="Restore this version" pendingLabel="Restoring…" className="rounded border border-slate-300 px-3 py-1" />
              </form>
            ) : null}
          </li>
        ))}
      </ol>
      )}
    </main>
  );
}
