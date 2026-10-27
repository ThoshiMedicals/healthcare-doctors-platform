import { createRequire } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";

const webRoot = process.cwd();

const { prisma } = await import(pathToFileURL(path.join(webRoot, "src/db/prisma.ts")).href);
const { toPublicGovernanceFields } = await import(
  pathToFileURL(path.join(webRoot, "src/governance/public-fields.ts")).href
);

const total = await prisma.clinicalReview.count();
const byStatus = await prisma.clinicalReview.groupBy({ by: ["status"], _count: true });
const rows = await prisma.clinicalReview.findMany({
  include: { page: { select: { path: true } } },
});

const fieldStats = {
  reviewedBy: rows.filter((r) => r.reviewedBy?.trim()).length,
  contentOwner: rows.filter((r) => r.contentOwner?.trim()).length,
  lastReviewed: rows.filter((r) => r.lastReviewed).length,
  nextReview: rows.filter((r) => r.nextReview).length,
  reviewerSignedAt: rows.filter((r) => r.reviewerSignedAt).length,
  approvedAt: rows.filter((r) => r.approvedAt).length,
  approvalReference: rows.filter((r) => r.approvalReference?.trim()).length,
  evidenceReference: rows.filter((r) => r.evidenceReference?.trim()).length,
  fingerprint: rows.filter((r) => r.reviewedContentSha256).length,
};

const publicReady = rows
  .map((r) => ({ path: r.page.path, status: r.status, fields: toPublicGovernanceFields(r) }))
  .filter((r) => r.fields);

console.log(
  JSON.stringify(
    {
      total,
      byStatus,
      fieldStats,
      publicReadyCount: publicReady.length,
      publicReadySample: publicReady.slice(0, 8),
    },
    null,
    2,
  ),
);

await prisma.$disconnect();
