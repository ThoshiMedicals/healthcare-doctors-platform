import Link from "next/link";
import { notFound } from "next/navigation";
import { saveMedia } from "@/cms/actions";
import { requireAction } from "@/cms/context";
import { displayRecordDate, imageTitle } from "@/cms/image-governance";
import { replacementTarget } from "@/cms/image-replacement";
import {
  MEDIA_LIBRARY_CATEGORIES,
  formatByteSize,
  formatDimensions,
  inferMediaCategory,
  isMediaLibraryCategory,
  mediaLibraryPreviewUrl,
  syncMediaLibrary,
} from "@/cms/media-library";
import { roleAllows } from "@/auth/permissions";
import { publicHref, publicPageName } from "@/cms/staff-labels";
import { prisma } from "@/db/prisma";
import { ImageProposalPanel } from "../../image-proposal-panel";
import { Field, GateNotice, SavedNotice, SaveBar } from "../../ui";

export const dynamic = "force-dynamic";

export default async function MediaLibraryDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; error?: string; reason?: string; uploaded?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const { clinic, role } = await requireAction("edit");
  await syncMediaLibrary(clinic.id);

  const stored = await prisma.mediaAsset.findFirst({ where: { id, clinicId: clinic.id } });
  if (!stored) notFound();

  const category =
    stored.category && isMediaLibraryCategory(stored.category)
      ? stored.category
      : inferMediaCategory(stored.storagePath, stored.usage);
  const preview = mediaLibraryPreviewUrl(stored.storagePath);
  const canReplace = Boolean(replacementTarget(stored.storagePath));
  const canGovern = roleAllows(role, "clinical_signoff");

  return (
    <main>
      <p className="text-sm">
        <Link href="/admin/media" className="text-slate-600 underline">
          Media Library
        </Link>
      </p>
      <h1 className="mt-2 text-2xl font-semibold">{stored.title || imageTitle(stored.storagePath)}</h1>
      <p className="mt-2 max-w-2xl text-sm text-slate-600">
        {category}. Filename {stored.filename}. Editing metadata here does not change the public layout. File
        replacement stays on the approved pixel-matched workflow.
      </p>
      <SavedNotice saved={query.saved} published={query.uploaded} kind="media" />
      <GateNotice error={query.error} reason={query.reason} />

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={preview}
        alt={stored.altText || ""}
        className="mt-4 max-h-56 max-w-md rounded border border-slate-200 bg-slate-50 object-contain"
      />

      <dl className="mt-4 grid max-w-2xl gap-2 text-sm text-slate-700 sm:grid-cols-2">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">File size</dt>
          <dd>{formatByteSize(stored.byteSize)}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Dimensions</dt>
          <dd>{formatDimensions(stored.width, stored.height)}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Upload date</dt>
          <dd>{displayRecordDate(stored.createdAt) || "—"}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Uploader</dt>
          <dd>{stored.uploadedBy || "—"}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Last used</dt>
          <dd>{displayRecordDate(stored.lastUsedAt) || "—"}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Usage count</dt>
          <dd>{stored.usage.length}</dd>
        </div>
      </dl>

      <div className="mt-6 max-w-2xl text-sm text-slate-700">
        <p className="font-medium">Used on</p>
        {stored.usage.length === 0 ? (
          <p className="mt-2 text-amber-800">Unused — not detected on published pages.</p>
        ) : (
          <ul className="mt-2 max-h-64 space-y-1 overflow-auto">
            {stored.usage.map((path) => {
              const href = publicHref(path);
              return (
                <li key={path}>
                  {href ? (
                    <a className="underline" href={href} target="_blank" rel="noreferrer">
                      {publicPageName(path)}
                    </a>
                  ) : (
                    publicPageName(path)
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <form action={saveMedia} className="mt-6 grid max-w-2xl gap-4">
        <input type="hidden" name="id" value={stored.id} />
        <Field label="Title" name="title" defaultValue={stored.title || imageTitle(stored.storagePath)} impact={[]} />
        <label className="flex flex-col gap-1 text-sm text-slate-700">
          Category
          <select className="rounded border border-slate-300 bg-white px-3 py-2" name="category" defaultValue={category}>
            {MEDIA_LIBRARY_CATEGORIES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <Field label="Alt text" name="altText" defaultValue={stored.altText} impact={[]} />
        <Field label="Uploaded by" name="uploadedBy" defaultValue={stored.uploadedBy} impact={[]} />
        <SaveBar historyHref={`/admin/revisions/media_asset/${stored.id}`} historyLabel="Media version history" />
      </form>

      <div className="mt-8 max-w-2xl space-y-3 text-sm text-slate-700">
        <p className="font-medium">Replacement workflow</p>
        {canReplace ? (
          <>
            <p>
              This path supports pixel-matched replacement. Preview impact and publish through the proposal panel
              below{canGovern ? "" : " once a Clinic Admin opens Image reviews"}.
            </p>
            {canGovern ? (
              <ImageProposalPanel
                assetId={stored.id}
                storagePath={stored.storagePath}
                status={stored.replacementStatus}
                role={role}
                returnTo={`/admin/media/${stored.id}`}
              />
            ) : (
              <p>
                <Link href={`/admin/image-governance/${stored.id}`} className="underline">
                  Open in Image reviews
                </Link>{" "}
                for Clinic Admin propose → approve → publish.
              </p>
            )}
          </>
        ) : (
          <p>
            Knowledge Centre, service, and other locked regions are not replaced from the library. Paths stay as
            published to avoid broken references.{" "}
            {canGovern ? (
              <Link href={`/admin/image-governance/${stored.id}`} className="underline">
                Governance record
              </Link>
            ) : null}
          </p>
        )}
      </div>
    </main>
  );
}
