"use server";

import { redirect } from "next/navigation";
import type { PublicationStatus } from "@prisma/client";
import { requireAction } from "@/cms/context";
import { recordRevision } from "@/cms/revisions";
import { assetRevisionSnapshot, prepareReplacement, replacementTarget, replacementTransition } from "@/cms/image-replacement";
import { clearPending, readPending, writeLive, writePending } from "@/cms/image-store";
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
  const previous = assetRevisionSnapshot(current);
  if (action === "publish") {
    const prepared = await prepareReplacement(target, proposal);
    if (prepared.problems.length > 0) fail(returnTo, prepared.problems.join(" "));
    writeLive(target.publicPath, prepared.full);
    if (target.thumbPath && prepared.thumb) writeLive(target.thumbPath, prepared.thumb);
    clearPending(current.id);
    const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Australia/Brisbane" }).format(new Date());
    const uploadedBy = current.uploadedBy || user.name || "Staff";
    const approvedAt = current.approvedAt ?? new Date(`${today}T00:00:00.000Z`);
    await prisma.mediaAsset.update({
      where: { id: current.id },
      data: { replacementStatus: "published", uploadedBy, approvedAt },
    });
    const next = assetRevisionSnapshot({ ...current, replacementStatus: "published", uploadedBy, approvedAt });
    await recordRevision({
      clinicId: clinic.id,
      authorId: user.id,
      entityType: "media_asset",
      entityId: current.id,
      previous,
      next,
    });
    redirect(`${returnTo}?published=1`);
  }
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
