"use server";

import { redirect } from "next/navigation";
import { requireAction } from "@/cms/context";
import { recordRevision } from "@/cms/revisions";
import { assetRevisionSnapshot, prepareReplacement, replacementTarget, replacementTransition } from "@/cms/image-replacement";
import { evaluateImagePublication } from "@/cms/publish-gates";
import { clearPending, readPending, sha256, writeLive, writePending } from "@/cms/image-store";
import { prisma } from "@/db/prisma";

function text(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function fail(returnTo: string, reason: string): never {
  redirect(`${returnTo}?error=gate&reason=${encodeURIComponent(reason)}`);
}

export async function proposeImageReplacement(formData: FormData) {
  const { user, clinic } = await requireAction("clinical_signoff");
  const id = text(formData, "id");
  const returnTo = text(formData, "returnTo") || `/admin/image-governance/${id}`;
  const current = await prisma.mediaAsset.findFirst({ where: { id, clinicId: clinic.id } });
  if (!current) redirect("/admin/image-governance");
  const target = replacementTarget(current.storagePath);
  if (!target) fail(returnTo, "This image cannot be replaced.");
  const upload = formData.get("image");
  if (!(upload instanceof File) || upload.size === 0) fail(returnTo, "Choose an image file.");
  const prepared = await prepareReplacement(target, Buffer.from(await upload.arrayBuffer()));
  if (prepared.problems.length > 0) fail(returnTo, prepared.problems.join(" "));
  const previous = assetRevisionSnapshot(current);
  writePending(current.id, prepared.full, prepared.thumb);
  await prisma.mediaAsset.update({ where: { id: current.id }, data: { replacementStatus: "drafting" } });
  const next = assetRevisionSnapshot({ ...current, replacementStatus: "drafting" });
  await recordRevision({
    clinicId: clinic.id,
    authorId: user.id,
    entityType: "media_asset",
    entityId: current.id,
    previous,
    next,
  });
  redirect(`${returnTo}?saved=1`);
}

export async function submitImageReplacement(formData: FormData) {
  await moveImage(formData, "submit");
}

export async function approveImageReplacement(formData: FormData) {
  await moveImage(formData, "approve");
}

export async function publishImageReplacement(formData: FormData) {
  await moveImage(formData, "publish");
}

export async function publishImageRecord(input: {
  clinicId: string;
  assetId: string;
  authorId: string;
  publisherName: string;
}): Promise<{ ok: true } | { ok: false; reasons: string[] }> {
  const current = await prisma.mediaAsset.findFirst({ where: { id: input.assetId, clinicId: input.clinicId } });
  if (!current) return { ok: false, reasons: ["That image could not be found."] };
  const target = replacementTarget(current.storagePath);
  if (!target) return { ok: false, reasons: ["This image cannot be replaced."] };
  if (!replacementTransition(current.replacementStatus, "publish")) {
    return { ok: false, reasons: ["Approve the image before publishing it."] };
  }
  const proposal = readPending(current.id, "full");
  const thumb = target.thumbPath ? readPending(current.id, "thumb") : null;
  if (!proposal || (target.thumbPath && !thumb)) {
    return { ok: false, reasons: ["The proposed image is missing, so the website was left unchanged."] };
  }
  const prepared = await prepareReplacement(target, proposal);
  if (prepared.problems.length > 0) return { ok: false, reasons: prepared.problems };
  const decision = evaluateImagePublication({
    reviewedBy: current.reviewedBy,
    evidenceReference: current.evidenceReference,
    approvedAt: current.approvedAt,
    proposalSha256: sha256(proposal),
    reviewedSha256: current.contentSha256,
    storagePath: current.storagePath,
    publisherName: input.publisherName,
    fileChecksAccepted: true,
  });
  if (!decision.ok) return decision;

  const previous = assetRevisionSnapshot(current);
  writeLive(target.publicPath, prepared.full);
  if (target.thumbPath && prepared.thumb) writeLive(target.thumbPath, prepared.thumb);
  clearPending(current.id);
  const uploadedBy = current.uploadedBy || input.publisherName;
  await prisma.mediaAsset.update({
    where: { id: current.id },
    data: { replacementStatus: "published", uploadedBy, approvedAt: current.approvedAt },
  });
  const next = assetRevisionSnapshot({
    ...current,
    replacementStatus: "published",
    uploadedBy,
    approvedAt: current.approvedAt,
  });
  await recordRevision({
    clinicId: input.clinicId,
    authorId: input.authorId,
    entityType: "media_asset",
    entityId: current.id,
    previous,
    next,
  });
  return { ok: true };
}

async function moveImage(formData: FormData, action: "submit" | "approve" | "publish") {
  const permission = action === "submit" ? "submit_for_review" : action === "approve" ? "practice_approve" : "publish";
  const { user, clinic } = await requireAction(permission);
  const id = text(formData, "id");
  const returnTo = text(formData, "returnTo") || `/admin/image-governance/${id}`;
  const current = await prisma.mediaAsset.findFirst({ where: { id, clinicId: clinic.id } });
  if (!current) redirect("/admin/image-governance");
  const target = replacementTarget(current.storagePath);
  if (!target) fail(returnTo, "This image cannot be replaced.");
  const nextStatus = replacementTransition(current.replacementStatus, action);
  if (!nextStatus) {
    fail(
      returnTo,
      action === "submit"
        ? "Save a proposed image before submitting it for review."
        : action === "approve"
          ? "Submit the image for review before approving it."
          : "Approve the image before publishing it.",
    );
  }
  const proposal = readPending(current.id, "full");
  if (!proposal || (target.thumbPath && !readPending(current.id, "thumb"))) {
    fail(returnTo, "The proposed image is missing, so the website was left unchanged.");
  }
  if (action === "publish") {
    const result = await publishImageRecord({
      clinicId: clinic.id,
      assetId: current.id,
      authorId: user.id,
      publisherName: user.name || user.email || "Staff",
    });
    if (!result.ok) fail(returnTo, result.reasons.join(" "));
    redirect(`${returnTo}?published=1`);
  }
  const previous = assetRevisionSnapshot(current);
  await prisma.mediaAsset.update({ where: { id: current.id }, data: { replacementStatus: nextStatus } });
  const next = assetRevisionSnapshot({ ...current, replacementStatus: nextStatus });
  await recordRevision({
    clinicId: clinic.id,
    authorId: user.id,
    entityType: "media_asset",
    entityId: current.id,
    previous,
    next,
  });
  redirect(`${returnTo}?saved=1`);
}
