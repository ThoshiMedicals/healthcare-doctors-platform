import Link from "next/link";
import { notFound } from "next/navigation";
import { saveImageGovernance } from "@/cms/actions";
import { requireAction } from "@/cms/context";
import { displayRecordDate, imageTitle, recordDate, recordDateStatus } from "@/cms/image-governance";
import { replacementTarget } from "@/cms/image-replacement";
import { imageRegister } from "@/cms/image-register";
import { publicHref, publicPageName } from "@/cms/staff-labels";
import { prisma } from "@/db/prisma";
import { ImageProposalPanel } from "../../image-proposal-panel";
import { Field, GateNotice, SavedNotice, SaveBar } from "../../ui";

export const dynamic = "force-dynamic";

export default async function ImageGovernanceEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; published?: string; error?: string; reason?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const { clinic, role } = await requireAction("clinical_signoff");
  const registered = (await imageRegister(clinic.id)).find((row) => row.id === id);
  const stored =
    registered ??
    (await prisma.mediaAsset.findFirst({
      where: { id, clinicId: clinic.id },
    }));
  if (!stored) notFound();
  const usage = registered?.usage ?? stored.usage;
  const observedAlts = registered?.observedAlts ?? [];
  const preview = stored.storagePath.startsWith("http") ? stored.storagePath : `/${stored.storagePath}`;
  const expiry = recordDateStatus(stored.expiresAt);

  return (
    <main>
      <p className="text-sm">
        <Link href="/admin/image-governance" className="text-slate-600 underline">
          All images
        </Link>
      </p>
      <h1 className="mt-2 text-2xl font-semibold">{imageTitle(stored.storagePath)}</h1>
      <p className="mt-2 max-w-2xl text-sm text-slate-600">
        {stored.assetType}. This record does not change the image file, the alt text on the page, or the layout.
      </p>
      <SavedNotice saved={query.saved} published={query.published} kind="governance" />
      <GateNotice error={query.error} reason={query.reason} />
      <img src={preview} alt={stored.altText} className="mt-4 max-h-40 max-w-xs rounded border border-slate-200 bg-slate-50 object-contain" />
      <form action={saveImageGovernance} className="mt-6 grid max-w-2xl gap-4">
        <input type="hidden" name="id" value={stored.id} />
        <Field label="Uploaded by" name="uploadedBy" defaultValue={stored.uploadedBy} impact={[]} />
        <Field label="Approval date" name="approvedAt" type="date" defaultValue={recordDate(stored.approvedAt)} impact={[]} />
        <Field label="Photographer" name="photographer" defaultValue={stored.photographer} impact={[]} />
        <Field label="Copyright owner" name="copyrightOwner" defaultValue={stored.copyrightOwner} impact={[]} />
        <Field
          label="Expiry date"
          name="expiresAt"
          type="date"
          defaultValue={recordDate(stored.expiresAt)}
          impact={[]}
        />
        {expiry === "expired" ? (
          <p className="text-sm text-amber-800">This record expired on {displayRecordDate(stored.expiresAt)}. The page still shows the image.</p>
        ) : null}
        <Field label="Alt text" name="altText" defaultValue={stored.altText} impact={[]} />
        <div className="text-sm text-slate-700">
          <p>On the website</p>
          <p className="mt-1 text-xs font-medium text-slate-500">CMS only</p>
          <p className="mt-1 text-slate-600">
            {observedAlts.length > 0 ? observedAlts.join(" · ") : "No alt text was found on the published pages."}
          </p>
        </div>
        <div className="text-sm text-slate-700">
          <p>Usage locations</p>
          <p className="mt-1 text-xs font-medium text-slate-500">CMS only</p>
          {usage.length === 0 ? <p className="mt-2 text-slate-600">This image is not on a published page.</p> : null}
          <ul className="mt-2 max-h-64 space-y-1 overflow-auto">
            {usage.map((path) => {
              const href = publicHref(path);
              return (
                <li key={path}>
                  {href ? (
                    <a className="text-slate-700 underline" href={href} target="_blank" rel="noreferrer">
                      {publicPageName(path)}
                    </a>
                  ) : (
                    publicPageName(path)
                  )}
                </li>
              );
            })}
          </ul>
        </div>
        <SaveBar historyHref={`/admin/revisions/media_asset/${stored.id}`} historyLabel="Image version history" />
        <p className="text-sm text-slate-600">
          Version history marks the current image and the previous image. Choosing another version replaces the
          published file. This save does not.
        </p>
      </form>
      {stored.storagePath.endsWith("-640.webp") ? (
        <p className="mt-6 max-w-2xl text-sm text-slate-600">
          This smaller file is generated from the full portrait. Replace the full portrait to update the card. The card layout stays as it is.
        </p>
      ) : replacementTarget(stored.storagePath) ? (
        <ImageProposalPanel
          assetId={stored.id}
          storagePath={stored.storagePath}
          status={stored.replacementStatus}
          role={role}
          returnTo={`/admin/image-governance/${stored.id}`}
        />
      ) : (
        <p className="mt-6 max-w-2xl text-sm text-slate-600">
          This image stays as it was published. Knowledge Centre images, service images, and new image regions are not replaced here.
        </p>
      )}
    </main>
  );
}
