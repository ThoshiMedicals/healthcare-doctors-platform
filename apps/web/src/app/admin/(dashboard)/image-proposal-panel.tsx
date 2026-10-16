import type { MembershipRole } from "@prisma/client";
import { roleAllows } from "@/auth/permissions";
import { approveImageReplacement, proposeImageReplacement, publishImageReplacement, submitImageReplacement } from "@/cms/image-replacement-actions";
import { replacementTarget } from "@/cms/image-replacement";
import { readPending } from "@/cms/image-store";
import { publicationLabel } from "@/cms/modules";
import { PendingButton } from "./pending-button";

export function ImageProposalPanel({
  assetId,
  storagePath,
  status,
  role,
  returnTo,
}: {
  assetId: string;
  storagePath: string;
  status: string | null;
  role: MembershipRole;
  returnTo: string;
}) {
  const target = replacementTarget(storagePath);
  if (!target || !roleAllows(role, "clinical_signoff")) return null;
  const proposal = readPending(assetId, "full");
  const workflow = status && status !== "published" ? status : proposal ? "drafting" : "";
  const accept = target.format === "png" ? "image/png,.png" : "image/webp,.webp";
  const rule =
    target.kind === "logo"
      ? "The logo must be the same PNG, the same pixel size, and the same filename. The header layout stays as it is."
      : target.kind === "hero"
        ? "The homepage hero must be the same WebP and the same pixel size. The page layout stays as it is."
        : target.kind === "exterior"
          ? "The exterior photograph must be the same WebP, the same pixel size, and the same filename."
          : "Upload the full WebP at the current portrait size. The smaller card image is generated at the current card size.";

  return (
    <section className="mt-8 grid max-w-2xl gap-4 rounded border border-slate-200 bg-white p-4">
      <h2 className="text-lg font-semibold">Replace this image</h2>
      <p className="text-sm text-slate-600">{rule} A proposal stays off the website until it is approved and published.</p>
      {workflow ? (
        <p className="text-sm text-slate-700">
          Proposal: <span className="font-medium">{publicationLabel(workflow)}</span>. The published file stays in place until you publish.
        </p>
      ) : (
        <p className="text-sm text-slate-700">The website is using the current file.</p>
      )}
      {proposal ? (
        <img
          src={`/api/image-proposal/${assetId}`}
          alt=""
          className="max-h-40 max-w-xs rounded border border-slate-200 bg-slate-50 object-contain"
        />
      ) : null}
      <form action={proposeImageReplacement} className="grid gap-3">
        <input type="hidden" name="id" value={assetId} />
        <input type="hidden" name="returnTo" value={returnTo} />
        <label className="flex flex-col gap-1 text-sm text-slate-700">
          Proposed file
          <input className="text-sm" name="image" type="file" accept={accept} required />
        </label>
        <PendingButton label="Save proposal" pendingLabel="Saving…" className="w-fit rounded border border-slate-300 px-3 py-2 text-sm" />
      </form>
      {workflow === "drafting" && proposal ? (
        <form action={submitImageReplacement}>
          <input type="hidden" name="id" value={assetId} />
          <input type="hidden" name="returnTo" value={returnTo} />
          <PendingButton label="Submit for review" pendingLabel="Submitting…" className="rounded border border-slate-300 px-3 py-2 text-sm" />
        </form>
      ) : null}
      {workflow === "clinical_review" && roleAllows(role, "clinical_signoff") ? (
        <form action={approveImageReplacement}>
          <input type="hidden" name="id" value={assetId} />
          <input type="hidden" name="returnTo" value={returnTo} />
          <PendingButton label="Approve" pendingLabel="Approving…" className="rounded border border-slate-300 px-3 py-2 text-sm" />
        </form>
      ) : null}
      {workflow === "approved" && roleAllows(role, "publish") ? (
        <form action={publishImageReplacement}>
          <input type="hidden" name="id" value={assetId} />
          <input type="hidden" name="returnTo" value={returnTo} />
          <PendingButton label="Publish" pendingLabel="Publishing…" className="rounded bg-slate-900 px-3 py-2 text-sm font-medium text-white" />
        </form>
      ) : null}
    </section>
  );
}
