import path from "node:path";

const BLOCKED_EXTENSIONS = new Set([".svg", ".gif", ".bmp", ".tif", ".tiff"]);
const CLAIMED_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp"]);

export type ImageKind = "jpeg" | "png" | "webp";

/** Reads the file bytes. The filename extension is not trusted on its own. */
export function detectImageFormat(bytes: Buffer): ImageKind | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpeg";
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "png";
  }
  if (bytes.length >= 12 && bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP") {
    return "webp";
  }
  return null;
}

export function acceptedImage(
  filename: string,
  bytes: Buffer,
): { ok: true; extension: ".jpg" | ".png" | ".webp" } | { ok: false } {
  const claimed = path.extname(filename).toLowerCase();
  if (BLOCKED_EXTENSIONS.has(claimed)) return { ok: false };
  if (claimed && !CLAIMED_EXTENSIONS.has(claimed)) return { ok: false };
  const kind = detectImageFormat(bytes);
  if (!kind) return { ok: false };
  if ((claimed === ".jpg" || claimed === ".jpeg") && kind !== "jpeg") return { ok: false };
  if (claimed === ".png" && kind !== "png") return { ok: false };
  if (claimed === ".webp" && kind !== "webp") return { ok: false };
  return { ok: true, extension: kind === "jpeg" ? ".jpg" : kind === "png" ? ".png" : ".webp" };
}
