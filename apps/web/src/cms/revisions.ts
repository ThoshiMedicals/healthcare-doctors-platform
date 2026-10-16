import type { Prisma } from "@prisma/client";
import { prisma } from "@/db/prisma";
import { writeAuditLog } from "@/cms/audit";

export type RevisionSnapshot = Prisma.InputJsonValue;

/**
 * Appends a revision. Previous rows are never updated or deleted.
 * This does not change the published HTML document.
 */
export async function recordRevision(entry: {
  clinicId: string;
  entityType: string;
  entityId: string;
  authorId: string;
  previous: RevisionSnapshot;
  next: RevisionSnapshot;
}) {
  const revision = await prisma.contentRevision.create({
    data: {
      clinicId: entry.clinicId,
      entityType: entry.entityType,
      entityId: entry.entityId,
      authorId: entry.authorId,
      previous: entry.previous,
      next: entry.next,
    },
  });
  await writeAuditLog({
    clinicId: entry.clinicId,
    actorId: entry.authorId,
    action: "content.revision",
    entityType: entry.entityType,
    entityId: entry.entityId,
    metadata: { revisionId: revision.id },
  });
  return revision;
}

export async function listRevisions(clinicId: string, entityType: string, entityId: string) {
  return prisma.contentRevision.findMany({
    where: { clinicId, entityType, entityId },
    include: { author: { select: { username: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });
}
