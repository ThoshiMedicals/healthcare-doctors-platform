import type { PublicationStatus } from "@prisma/client";
import { imageGovernanceSnapshot } from "@/cms/image-governance";
import { detectImageFormat } from "@/cms/image-signature";
import { isPortraitName } from "@/cms/practitioner-media";
import {
  clearPending,
  ImageArchiveError,
  pendingSha,
  readArchive,
  readServedBytes,
  restoreServed,
  servedSha,
  writePending,
} from "@/cms/image-store";

const LOGO = "assets/brand/healthcare-doctors-woolloongabba-logo.png";
const HERO = "assets/hero-final-desktop.webp";
const EXTERIOR = "assets/institutional-exterior-consistent.webp";
const PNG_CAP = 512 * 1024;
const WEBP_CAP = 4 * 1024 * 1024;

export type ReplacementKind = "logo" | "hero" | "exterior" | "portrait";

export type ReplacementTarget = {
  kind: ReplacementKind;
  publicPath: string;
  thumbPath: string | null;
  format: "png" | "webp";
};

export function replacementTarget(storagePath: string): ReplacementTarget | null {
  if (storagePath === LOGO) return { kind: "logo", publicPath: LOGO, thumbPath: null, format: "png" };
  if (storagePath === HERO) return { kind: "hero", publicPath: HERO, thumbPath: null, format: "webp" };
  if (storagePath === EXTERIOR) return { kind: "exterior", publicPath: EXTERIOR, thumbPath: null, format: "webp" };
  const name = storagePath.startsWith("assets/team/") ? storagePath.slice("assets/team/".length) : "";
  if (!isPortraitName(name) || !existingPortrait(name)) return null;
  return {
    kind: "portrait",
    publicPath: storagePath,
    thumbPath: `assets/team/${name.replace(/\.webp$/i, "")}-640.webp`,
    format: "webp",
  };
}

export function managedPublicPath(relative: string): string | null {
  if (replacementTarget(relative)) return relative;
  const thumb = relative.match(/^assets\/team\/([a-z0-9-]+)-640\.webp$/);
  if (!thumb || !existingPortrait(`${thumb[1]}.webp`)) return null;
  return relative;
}

export function replacementTransition(status: string | null, action: "submit" | "approve" | "publish"): PublicationStatus | null {
  if (action === "submit" && status === "drafting") return "clinical_review";
  if (action === "approve" && status === "clinical_review") return "approved";
  if (action === "publish" && status === "approved") return "published";
  return null;
}

export function replacementProblems(target: ReplacementTarget, bytes: Buffer): string[] {
  if (bytes.length === 0) return ["Choose an image file."];
  const cap = target.format === "png" ? PNG_CAP : WEBP_CAP;
  if (bytes.length > cap) return ["That file is too large, so the current image was left unchanged."];
  const format = detectImageFormat(bytes);
  if (format !== target.format) {
    return [target.format === "png" ? "The logo must stay a PNG." : "This photograph must stay a WebP."];
  }
  let current: Buffer;
  try {
    current = readServedBytes(target.publicPath);
  } catch {
    return ["The current image could not be read, so it was left unchanged."];
  }
  const currentSize = target.format === "png" ? pngSize(current) : webpSize(current);
  const nextSize = target.format === "png" ? pngSize(bytes) : webpSize(bytes);
  if (!currentSize || !nextSize || currentSize.width !== nextSize.width || currentSize.height !== nextSize.height) {
    const width = currentSize?.width ?? "the current";
    const height = currentSize?.height ?? "the current";
    return [`The image must be ${width} by ${height} pixels so the page layout stays the same.`];
  }
  return [];
}

function existingPortrait(name: string): boolean {
  if (!isPortraitName(name)) return false;
  const full = `assets/team/${name}`;
  const thumb = `assets/team/${name.replace(/\.webp$/i, "")}-640.webp`;
  try {
    return readServedBytes(full).length > 0 && readServedBytes(thumb).length > 0;
  } catch {
    return false;
  }
}

export async function prepareReplacement(target: ReplacementTarget, bytes: Buffer): Promise<{ full: Buffer; thumb: Buffer | null; problems: string[] }> {
  const problems = replacementProblems(target, bytes);
  if (problems.length > 0 || !target.thumbPath) return { full: bytes, thumb: null, problems };
  const current = webpSize(readServedBytes(target.thumbPath));
  if (!current) return { full: bytes, thumb: null, problems: ["The current smaller portrait could not be read, so the card was left unchanged."] };
  try {
    const { renderPortraitThumb } = await import("@/cms/portrait-variant");
    const thumb = await renderPortraitThumb(bytes, current.width, current.height);
    return { full: bytes, thumb, problems: [] };
  } catch {
    return { full: bytes, thumb: null, problems: ["The smaller portrait could not be generated at the current card size."] };
  }
}

export function assetRevisionSnapshot(row: {
  id: string;
  storagePath: string;
  replacementStatus: PublicationStatus | null;
  uploadedBy: string | null;
  approvedAt: Date | null;
  photographer: string | null;
  copyrightOwner: string | null;
  expiresAt: Date | null;
  altText: string;
  usage: string[];
}) {
  return { ...imageGovernanceSnapshot(row), ...imageFileSnapshot(row) };
}

export function imageFileSnapshot(row: { id: string; storagePath: string; replacementStatus: PublicationStatus | null }) {
  const target = replacementTarget(row.storagePath);
  if (!target) return { replacementStatus: row.replacementStatus ?? null };
  return {
    replacementStatus: row.replacementStatus ?? null,
    liveSha256: servedSha(target.publicPath),
    liveThumbSha256: target.thumbPath ? servedSha(target.thumbPath) : null,
    proposalSha256: pendingSha(row.id, "full"),
    proposalThumbSha256: pendingSha(row.id, "thumb"),
  };
}

export function applyImageFiles(row: { id: string; storagePath: string }, data: Record<string, unknown>) {
  if (!("liveSha256" in data) && !("proposalSha256" in data)) return;
  const target = replacementTarget(row.storagePath);
  if (!target) return;
  if (typeof data.liveSha256 === "string") restoreServed(target.publicPath, data.liveSha256);
  if (target.thumbPath && typeof data.liveThumbSha256 === "string") restoreServed(target.thumbPath, data.liveThumbSha256);
  if (!("proposalSha256" in data)) return;
  if (typeof data.proposalSha256 !== "string") {
    clearPending(row.id);
    return;
  }
  const full = readArchive(data.proposalSha256);
  const thumb = typeof data.proposalThumbSha256 === "string" ? readArchive(data.proposalThumbSha256) : null;
  if (!full || (typeof data.proposalThumbSha256 === "string" && !thumb)) throw new ImageArchiveError();
  writePending(row.id, full, thumb);
}

export function pngSize(buffer: Buffer): { width: number; height: number } | null {
  if (detectImageFormat(buffer) !== "png" || buffer.length < 24) return null;
  if (buffer.toString("ascii", 12, 16) !== "IHDR") return null;
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

export function webpSize(buffer: Buffer): { width: number; height: number } | null {
  if (detectImageFormat(buffer) !== "webp") return null;
  const chunk = buffer.toString("ascii", 12, 16);
  if (chunk === "VP8X" && buffer.length >= 30) {
    return { width: 1 + buffer.readUIntLE(24, 3), height: 1 + buffer.readUIntLE(27, 3) };
  }
  if (chunk === "VP8 " && buffer.length >= 30) {
    return { width: buffer.readUInt16LE(26) & 0x3fff, height: buffer.readUInt16LE(28) & 0x3fff };
  }
  if (chunk === "VP8L" && buffer.length >= 25) {
    const bits = buffer.readUInt32LE(21);
    return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
  }
  return null;
}
