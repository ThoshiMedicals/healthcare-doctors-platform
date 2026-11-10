import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import type { Prisma } from "@prisma/client";
import { assetKind, imageTitle, imageUsesFromHtml } from "@/cms/image-governance";
import { publicAssetPath } from "@/cms/image-store";
import {
  inferMediaCategory,
  isMediaLibraryCategory,
  mediaLibraryPreviewUrl,
  type MediaLibraryDashboardStats,
  type MediaLibraryItem,
  RECENT_UPLOAD_DAYS,
  LARGE_FILE_BYTES,
} from "@/cms/media-library-shared";
import { practitionerFromPayload } from "@/cms/overlay";
import { prisma } from "@/db/prisma";

export * from "@/cms/media-library-shared";

const IMAGE_EXT = /\.(webp|png|jpe?g|gif|avif|svg)$/i;

function walkImageFiles(rootRelative: string): string[] {
  const absoluteRoot = publicAssetPath(rootRelative);
  if (!fs.existsSync(absoluteRoot)) return [];
  const out: string[] = [];
  const walk = (dir: string, relative: string) => {
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const nextRel = relative ? `${relative}/${entry.name}` : entry.name;
      const nextAbs = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(nextAbs, nextRel);
        continue;
      }
      if (!IMAGE_EXT.test(entry.name)) continue;
      out.push(nextRel.replace(/\\/g, "/"));
    }
  };
  walk(absoluteRoot, rootRelative.replace(/\\/g, "/").replace(/\/$/, ""));
  return out;
}

async function collectUsage(clinicId: string): Promise<Map<string, { pages: Set<string>; alts: Set<string> }>> {
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
    if (!content?.portraitFile || !content.sourcePortraitFile || content.portraitFile === content.sourcePortraitFile) {
      return [];
    }
    return [{ source: content.sourcePortraitFile, next: content.portraitFile }];
  });

  const grouped = new Map<string, { pages: Set<string>; alts: Set<string> }>();
  for (const page of pages) {
    let html = page.publishedRevision?.html ?? "";
    for (const swap of swaps) {
      if (!html.includes(swap.source)) continue;
      const sourceStem = swap.source.replace(/\.webp$/i, "");
      const nextStem = swap.next.replace(/\.webp$/i, "");
      html = html
        .split(`${sourceStem}-640.webp`)
        .join(`${nextStem}-640.webp`)
        .split(`${sourceStem}.webp`)
        .join(`${nextStem}.webp`);
    }
    if (!html) continue;
    for (const use of imageUsesFromHtml(html, page.path)) {
      const entry = grouped.get(use.assetPath) ?? { pages: new Set<string>(), alts: new Set<string>() };
      entry.pages.add(use.pagePath);
      if (use.alt) entry.alts.add(use.alt);
      grouped.set(use.assetPath, entry);
    }
  }
  return grouped;
}

async function readFileMeta(storagePath: string): Promise<{
  byteSize: number | null;
  width: number | null;
  height: number | null;
}> {
  if (/^https?:\/\//i.test(storagePath)) {
    return { byteSize: null, width: null, height: null };
  }
  try {
    const absolute = publicAssetPath(storagePath);
    if (!fs.existsSync(absolute)) return { byteSize: null, width: null, height: null };
    const stat = fs.statSync(absolute);
    const byteSize = stat.size;
    if (/\.svg$/i.test(storagePath)) return { byteSize, width: null, height: null };
    const meta = await sharp(absolute, { failOn: "none" }).metadata();
    return { byteSize, width: meta.width ?? null, height: meta.height ?? null };
  } catch {
    return { byteSize: null, width: null, height: null };
  }
}

/** Fast path: read MediaAsset rows only (no HTML scan / disk walk / sharp). */
export async function listMediaLibrary(clinicId: string): Promise<MediaLibraryItem[]> {
  const rows = await prisma.mediaAsset.findMany({
    where: { clinicId },
    orderBy: { filename: "asc" },
  });
  return rows.map((row) => toLibraryItem(row));
}

/** Sync disk assets + published usage into MediaAsset, then return library rows. */
export async function syncMediaLibrary(clinicId: string): Promise<MediaLibraryItem[]> {
  const usageMap = await collectUsage(clinicId);
  const diskPaths = new Set(walkImageFiles("assets"));
  const catalogPaths = new Set([...diskPaths, ...usageMap.keys()]);

  const existing = await prisma.mediaAsset.findMany({ where: { clinicId } });
  const byPath = new Map(existing.map((row) => [row.storagePath, row]));
  const now = new Date();

  for (const storagePath of catalogPaths) {
    const observed = usageMap.get(storagePath);
    const usage = observed ? [...observed.pages].sort() : [];
    const kind = assetKind(storagePath);
    const inferred = inferMediaCategory(storagePath, usage);
    const current = byPath.get(storagePath);
    const metaNeeded = !current || current.byteSize == null || current.width == null;
    const meta = metaNeeded ? await readFileMeta(storagePath) : null;

    if (!current) {
      const created = await prisma.mediaAsset.create({
        data: {
          clinicId,
          filename: storagePath.split("/").pop() || storagePath,
          storagePath,
          assetType: kind,
          category: inferred,
          title: imageTitle(storagePath),
          altText: observed ? [...observed.alts].join(" · ") : "",
          usage,
          lastUsedAt: usage.length > 0 ? now : null,
          byteSize: meta?.byteSize ?? null,
          width: meta?.width ?? null,
          height: meta?.height ?? null,
        },
      });
      byPath.set(storagePath, created);
      continue;
    }

    const sameUsage =
      current.usage.length === usage.length && current.usage.every((item, index) => item === usage[index]);
    const nextCategory = current.category && isMediaLibraryCategory(current.category) ? current.category : inferred;
    const data: Prisma.MediaAssetUpdateInput = {};
    if (!sameUsage) {
      data.usage = usage;
      data.lastUsedAt = usage.length > 0 ? now : current.lastUsedAt;
    }
    if (current.assetType !== kind) data.assetType = kind;
    if (current.category !== nextCategory) data.category = nextCategory;
    if (!current.title) data.title = imageTitle(storagePath);
    if (meta) {
      if (current.byteSize !== meta.byteSize) data.byteSize = meta.byteSize;
      if (current.width !== meta.width) data.width = meta.width;
      if (current.height !== meta.height) data.height = meta.height;
    }
    if (Object.keys(data).length === 0) continue;
    const updated = await prisma.mediaAsset.update({ where: { id: current.id }, data });
    byPath.set(storagePath, updated);
  }

  for (const row of byPath.values()) {
    if (catalogPaths.has(row.storagePath)) continue;
    if (row.usage.length === 0) continue;
    const updated = await prisma.mediaAsset.update({
      where: { id: row.id },
      data: { usage: [] },
    });
    byPath.set(row.storagePath, updated);
  }

  return [...byPath.values()]
    .filter((row) => diskPaths.has(row.storagePath) || row.usage.length > 0 || Boolean(row.category))
    .map((row) => toLibraryItem(row));
}

function toLibraryItem(row: {
  id: string;
  filename: string;
  storagePath: string;
  title: string | null;
  category: string | null;
  assetType: string;
  altText: string;
  uploadedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
  lastUsedAt: Date | null;
  usage: string[];
  byteSize: number | null;
  width: number | null;
  height: number | null;
  replacementStatus: string | null;
}): MediaLibraryItem {
  const usage = [...row.usage].sort();
  const category =
    row.category && isMediaLibraryCategory(row.category)
      ? row.category
      : inferMediaCategory(row.storagePath, usage);
  return {
    id: row.id,
    filename: row.filename,
    storagePath: row.storagePath,
    title: row.title || imageTitle(row.storagePath),
    category,
    assetType: row.assetType,
    altText: row.altText,
    uploadedBy: row.uploadedBy,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    lastUsedAt: row.lastUsedAt,
    usage,
    usageCount: usage.length,
    byteSize: row.byteSize,
    width: row.width,
    height: row.height,
    replacementStatus: row.replacementStatus,
    previewUrl: mediaLibraryPreviewUrl(row.storagePath),
  };
}

/** Lightweight briefing stats from MediaAsset rows (no disk walk). */
export async function mediaLibraryDashboardStatsForClinic(clinicId: string): Promise<MediaLibraryDashboardStats> {
  const rows = await prisma.mediaAsset.findMany({
    where: { clinicId },
    select: { usage: true, altText: true, byteSize: true, createdAt: true },
  });
  const recentCut = Date.now() - RECENT_UPLOAD_DAYS * 86_400_000;
  return {
    total: rows.length,
    unused: rows.filter((row) => row.usage.length === 0).length,
    largeFiles: rows.filter((row) => (row.byteSize ?? 0) >= LARGE_FILE_BYTES).length,
    missingAlt: rows.filter((row) => !row.altText.trim()).length,
    recentUploads: rows.filter((row) => row.createdAt.getTime() >= recentCut).length,
  };
}
