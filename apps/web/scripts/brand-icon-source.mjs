/**
 * Shared Healthcare Doctors™ icon source (owner short lockup with ™ + Caring for you).
 *
 * Source: assets/brand/healthcare-doctors-lockup-tm-caring.png
 * - Prefer the short wordmark (no clinic divider).
 * - If a full clinic lockup with red divider is supplied, crop the left brand block only.
 * - Tiny favicons use a compact left crop so type stays recognisable.
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const publicRoot = path.join(root, "public");
export const iconsRoot = path.join(publicRoot, "icons");

/** Canonical owner-supplied Healthcare Doctors™ short lockup. */
export const LOCKUP_SOURCE = path.join(
  publicRoot,
  "assets",
  "brand",
  "healthcare-doctors-lockup-tm-caring.png",
);

/** White canvas for opaque PWA icons. */
export const ICON_BACKGROUND = { r: 255, g: 255, b: 255, alpha: 1 };

async function loadInkBounds(sourcePath) {
  const { data, info } = await sharp(sourcePath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let x0 = info.width;
  let x1 = -1;
  let y0 = info.height;
  let y1 = -1;
  const redCols = [];

  for (let x = 0; x < info.width; x++) {
    let redHits = 0;
    for (let y = 0; y < info.height; y++) {
      const i = (y * info.width + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];
      if (a < 20) continue;
      if (r > 245 && g > 245 && b > 245) continue;
      x0 = Math.min(x0, x);
      x1 = Math.max(x1, x);
      y0 = Math.min(y0, y);
      y1 = Math.max(y1, y);
      if (r > 160 && g < 90 && b < 90) redHits++;
    }
    if (redHits > info.height * 0.35) redCols.push(x);
  }

  if (x1 < x0 || y1 < y0) {
    throw new Error("Healthcare Doctors lockup has no detectable ink.");
  }

  return {
    info,
    redCols,
    bounds: {
      left: x0,
      top: y0,
      width: x1 - x0 + 1,
      height: y1 - y0 + 1,
    },
  };
}

/**
 * Extract Healthcare Doctors™ + Caring for you artwork for square icons.
 * Short owner mark: trimmed full wordmark. Full clinic lockup: left of red divider.
 */
export async function extractBrandLockupCrop() {
  const meta = await sharp(LOCKUP_SOURCE).metadata();
  if (!meta.width || !meta.height) {
    throw new Error("Healthcare Doctors lockup source is unreadable.");
  }
  if (meta.width < 200 || meta.height < 50) {
    throw new Error(
      `Unexpected lockup dimensions ${meta.width}x${meta.height}; refuse automatic crop.`,
    );
  }

  const { info, redCols, bounds } = await loadInkBounds(LOCKUP_SOURCE);

  let crop;
  if (redCols.length > 0) {
    const divider = redCols[0];
    const leftEnd = Math.max(bounds.left + 40, divider - 6);
    crop = {
      left: bounds.left,
      top: Math.max(0, bounds.top - 2),
      width: leftEnd - bounds.left,
      height: Math.min(info.height - Math.max(0, bounds.top - 2), bounds.height + 5),
    };
  } else {
    // Short lockup (no clinic divider): pad ink bounds slightly.
    crop = {
      left: Math.max(0, bounds.left - 4),
      top: Math.max(0, bounds.top - 4),
      width: Math.min(info.width - Math.max(0, bounds.left - 4), bounds.width + 8),
      height: Math.min(info.height - Math.max(0, bounds.top - 4), bounds.height + 8),
    };
  }

  if (crop.width < 80 || crop.height < 40) {
    throw new Error("Healthcare Doctors brand crop is too small; refuse generation.");
  }

  const png = await sharp(LOCKUP_SOURCE).extract(crop).png().toBuffer();
  return { png, crop, sourceWidth: info.width, sourceHeight: info.height };
}

/**
 * Compact left crop for 16/32 favicons — keeps a recognisable HD mark, not a
 * microscopic full wordmark.
 */
export async function extractCompactFaviconMark() {
  const { png, crop } = await extractBrandLockupCrop();
  const meta = await sharp(png).metadata();
  const width = meta.width || crop.width;
  const height = meta.height || crop.height;
  // Keep left stacked letters (HEALTHCARE / DOCTORS) — roughly square.
  const compactWidth = Math.max(48, Math.round(Math.min(width * 0.42, height * 1.15)));
  const compact = {
    left: 0,
    top: 0,
    width: Math.min(width, compactWidth),
    height,
  };
  const mark = await sharp(png).extract(compact).png().toBuffer();
  return { png: mark, crop: { ...crop, compact }, sourceWidth: width, sourceHeight: height };
}

/** Place lockup crop centred on a square canvas without distortion. */
export async function composeSquareIcon(lockupPng, size, { opaque, markFraction }) {
  const markBox = Math.round(size * markFraction);
  const mark = await sharp(lockupPng)
    .resize({
      width: markBox,
      height: markBox,
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  const background = opaque
    ? ICON_BACKGROUND
    : { r: 0, g: 0, b: 0, alpha: 0 };

  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background,
    },
  })
    .composite([{ input: mark, gravity: "centre" }])
    .png({ compressionLevel: 9 })
    .toBuffer();
}

export function encodeIco(frames) {
  const header = Buffer.alloc(6 + frames.length * 16);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(frames.length, 4);
  let offset = header.length;
  for (const [i, frame] of frames.entries()) {
    const at = 6 + i * 16;
    header.writeUInt8(frame.size === 256 ? 0 : frame.size, at);
    header.writeUInt8(frame.size === 256 ? 0 : frame.size, at + 1);
    header.writeUInt16LE(1, at + 4);
    header.writeUInt16LE(32, at + 6);
    header.writeUInt32LE(frame.png.length, at + 8);
    header.writeUInt32LE(offset, at + 12);
    offset += frame.png.length;
  }
  return Buffer.concat([header, ...frames.map((f) => f.png)]);
}
