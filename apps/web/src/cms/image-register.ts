import { prisma } from "@/db/prisma";
import { assetKind, imageUsesFromHtml, type ImageUse } from "@/cms/image-governance";
import { practitionerFromPayload } from "@/cms/overlay";

export type RegisteredImage = {
  id: string;
  storagePath: string;
  filename: string;
  assetType: string;
  altText: string;
  uploadedBy: string | null;
  approvedAt: Date | null;
  photographer: string | null;
  copyrightOwner: string | null;
  expiresAt: Date | null;
  replacementStatus: string | null;
  reviewedBy: string | null;
  evidenceReference: string | null;
  contentSha256: string | null;
  usage: string[];
  observedAlts: string[];
};

export async function imageRegister(clinicId: string): Promise<RegisteredImage[]> {
  const [pages, practitioners] = await Promise.all([
    prisma.page.findMany({
      where: { clinicId },
      select: { path: true, publishedRevision: { select: { html: true } } },
    }),
    prisma.practitioner.findMany({
      where: { clinicId, status: "published" },
      select: { publishedPayload: true },
    }),
  ]);
  const swaps = practitioners.flatMap((row) => {
    const content = practitionerFromPayload(row.publishedPayload);
    if (!content?.portraitFile || !content.sourcePortraitFile || content.portraitFile === content.sourcePortraitFile) return [];
    return [{ source: content.sourcePortraitFile, next: content.portraitFile }];
  });
  const grouped = new Map<string, { pages: Set<string>; alts: Set<string> }>();
  for (const page of pages) {
    const html = publishedImageHtml(page.publishedRevision?.html ?? "", swaps);
    if (!html) continue;
    for (const use of imageUsesFromHtml(html, page.path)) addUse(grouped, use);
  }

  const paths = [...grouped.keys()];
  if (paths.length === 0) return [];
  const existing = await prisma.mediaAsset.findMany({ where: { clinicId, storagePath: { in: paths } } });
  const byPath = new Map(existing.map((row) => [row.storagePath, row]));
  for (const [assetPath, entry] of grouped) {
    const usage = [...entry.pages].sort();
    const kind = assetKind(assetPath);
    const current = byPath.get(assetPath);
    if (!current) {
      const created = await prisma.mediaAsset.create({
        data: {
          clinicId,
          filename: assetPath.split("/").pop() || assetPath,
          storagePath: assetPath,
          assetType: kind,
          altText: [...entry.alts].join(" · "),
          usage,
        },
      });
      byPath.set(assetPath, created);
      continue;
    }
    const sameUsage = current.usage.length === usage.length && current.usage.every((item, index) => item === usage[index]);
    if (sameUsage && current.assetType === kind) continue;
    const updated = await prisma.mediaAsset.update({
      where: { id: current.id },
      data: { usage, assetType: kind },
    });
    byPath.set(assetPath, updated);
  }

  return [...byPath.values()]
    .sort((left, right) => left.filename.localeCompare(right.filename))
    .map((row) => ({
      id: row.id,
      storagePath: row.storagePath,
      filename: row.filename,
      assetType: row.assetType,
      altText: row.altText,
      uploadedBy: row.uploadedBy,
      approvedAt: row.approvedAt,
      photographer: row.photographer,
      copyrightOwner: row.copyrightOwner,
      expiresAt: row.expiresAt,
      replacementStatus: row.replacementStatus,
      reviewedBy: row.reviewedBy,
      evidenceReference: row.evidenceReference,
      contentSha256: row.contentSha256,
      usage: [...(grouped.get(row.storagePath)?.pages ?? [])].sort(),
      observedAlts: [...(grouped.get(row.storagePath)?.alts ?? [])],
    }));
}

export async function ensureImageAsset(clinicId: string, storagePath: string, altText: string) {
  const { replacementTarget } = await import("@/cms/image-replacement");
  if (!replacementTarget(storagePath)) return null;
  const existing = await prisma.mediaAsset.findUnique({ where: { clinicId_storagePath: { clinicId, storagePath } } });
  if (existing) return existing;
  return prisma.mediaAsset.create({
    data: {
      clinicId,
      filename: storagePath.split("/").pop() || storagePath,
      storagePath,
      assetType: assetKind(storagePath),
      altText,
      usage: [],
    },
  });
}

function publishedImageHtml(html: string, swaps: { source: string; next: string }[]): string {
  let next = html;
  for (const swap of swaps) {
    if (!next.includes(swap.source)) continue;
    const sourceStem = swap.source.replace(/\.webp$/i, "");
    const nextStem = swap.next.replace(/\.webp$/i, "");
    next = next.split(`${sourceStem}-640.webp`).join(`${nextStem}-640.webp`).split(`${sourceStem}.webp`).join(`${nextStem}.webp`);
  }
  return next;
}

function addUse(grouped: Map<string, { pages: Set<string>; alts: Set<string> }>, use: ImageUse) {
  const entry = grouped.get(use.assetPath) ?? { pages: new Set<string>(), alts: new Set<string>() };
  entry.pages.add(use.pagePath);
  if (use.alt) entry.alts.add(use.alt);
  grouped.set(use.assetPath, entry);
}
