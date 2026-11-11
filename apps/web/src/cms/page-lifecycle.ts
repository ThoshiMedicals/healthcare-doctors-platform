/**
 * Authorised Page unpublish / archive / restore.
 * Keeps PageRevision rows and audit history. Public serve requires status === "published".
 */

import type { PageStatus, Prisma } from "@prisma/client";
import { writeAuditLog } from "@/cms/audit";
import { invalidatePublicHtmlCache, bumpPublicCacheEpoch } from "@/documents/public-html-cache";
import { prisma } from "@/db/prisma";

export type PageLifecycleResult =
  | { ok: true; pageId: string; path: string; status: PageStatus }
  | { ok: false; reason: string };

async function loadClinicPage(clinicId: string, pageId: string) {
  return prisma.page.findFirst({
    where: { id: pageId, clinicId },
    select: {
      id: true,
      path: true,
      status: true,
      publishedRevisionId: true,
      title: true,
      clinicId: true,
    },
  });
}

export async function unpublishPage(input: {
  clinicId: string;
  pageId: string;
  actorId: string;
}): Promise<PageLifecycleResult> {
  const page = await loadClinicPage(input.clinicId, input.pageId);
  if (!page) return { ok: false, reason: "Page not found for this clinic." };
  if (page.status !== "published") {
    return { ok: false, reason: "Only a published page can be unpublished." };
  }
  if (!page.publishedRevisionId) {
    return { ok: false, reason: "Published page is missing its revision pointer." };
  }

  await prisma.page.update({
    where: { id: page.id },
    data: { status: "draft" },
  });
  await writeAuditLog({
    clinicId: input.clinicId,
    actorId: input.actorId,
    action: "page.unpublish",
    entityType: "page",
    entityId: page.id,
    metadata: { path: page.path, previousStatus: "published", nextStatus: "draft" },
  });
  await bumpPublicCacheEpoch(input.clinicId);
  invalidatePublicHtmlCache(input.clinicId);
  return { ok: true, pageId: page.id, path: page.path, status: "draft" };
}

export async function archivePage(input: {
  clinicId: string;
  pageId: string;
  actorId: string;
}): Promise<PageLifecycleResult> {
  const page = await loadClinicPage(input.clinicId, input.pageId);
  if (!page) return { ok: false, reason: "Page not found for this clinic." };
  if (page.status === "archived") {
    return { ok: false, reason: "Page is already archived." };
  }

  await prisma.page.update({
    where: { id: page.id },
    data: { status: "archived" },
  });
  await writeAuditLog({
    clinicId: input.clinicId,
    actorId: input.actorId,
    action: "page.archive",
    entityType: "page",
    entityId: page.id,
    metadata: { path: page.path, previousStatus: page.status, nextStatus: "archived" },
  });
  await bumpPublicCacheEpoch(input.clinicId);
  invalidatePublicHtmlCache(input.clinicId);
  return { ok: true, pageId: page.id, path: page.path, status: "archived" };
}

/**
 * Authorised restore through the publish gate: republishes an existing immutable revision.
 * Does not invent HTML; fails closed without an immutable publishedRevision pointer.
 */
export async function restorePublishedPage(input: {
  clinicId: string;
  pageId: string;
  actorId: string;
}): Promise<PageLifecycleResult> {
  const page = await loadClinicPage(input.clinicId, input.pageId);
  if (!page) return { ok: false, reason: "Page not found for this clinic." };
  if (page.status === "published") {
    return { ok: false, reason: "Page is already published." };
  }
  if (!page.publishedRevisionId) {
    return { ok: false, reason: "No immutable revision available to restore. Publish through the content workflow first." };
  }

  const revision = await prisma.pageRevision.findFirst({
    where: { id: page.publishedRevisionId, pageId: page.id },
    select: { id: true, immutable: true, html: true },
  });
  if (!revision?.immutable || revision.html == null) {
    return { ok: false, reason: "Stored revision is not an immutable published snapshot." };
  }

  await prisma.page.update({
    where: { id: page.id },
    data: { status: "published" },
  });
  await writeAuditLog({
    clinicId: input.clinicId,
    actorId: input.actorId,
    action: "page.restore_publish",
    entityType: "page",
    entityId: page.id,
    metadata: {
      path: page.path,
      previousStatus: page.status,
      nextStatus: "published",
      revisionId: revision.id,
    } satisfies Prisma.InputJsonValue,
  });
  await bumpPublicCacheEpoch(input.clinicId);
  invalidatePublicHtmlCache(input.clinicId);
  return { ok: true, pageId: page.id, path: page.path, status: "published" };
}
