/**
 * Shared Healthcare Doctors icon source: owner lockup with ™ + "Caring for you".
 *
 * Uses assets/brand/healthcare-doctors-lockup-tm-caring.png (horizontal lockup).
 * Extracts only the left brand block (before the red clinic divider) so the
 * full horizontal artwork is never squeezed into a square — callers place that
 * crop with fit:"contain" on a square canvas.
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const publicRoot = path.join(root, "public");
export const iconsRoot = path.join(publicRoot, "icons");

/** Canonical owner-supplied source (do not substitute the prior symbol-only mark). */
export const LOCKUP_SOURCE = path.join(
  publicRoot,
  "assets",
  "brand",
  "healthcare-doctors-lockup-tm-caring.png",
);

/** Navy / teal brand canvas for opaque PWA icons. */
export const ICON_BACKGROUND = { r: 255, g: 255, b: 255, alpha: 1 };

/**
 * Extract the left Healthcare Doctors™ + Caring for you block (exclude red
 * divider and Woolloongabba Medical Centre wordmark).
 */
export async function extractBrandLockupCrop() {
  const meta = await sharp(LOCKUP_SOURCE).metadata();
  if (!meta.width || !meta.height) {
    throw new Error("Healthcare Doctors lockup source is unreadable.");
  }
  if (meta.width < 400 || meta.height < 50) {
    throw new Error(
      `Unexpected lockup dimensions ${meta.width}x${meta.height}; refuse automatic crop.`,
    );
  }

  const { data, info } = await sharp(LOCKUP_SOURCE)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const redCols = [];
  let x0 = info.width;
  let x1 = -1;
  let y0 = info.height;
  let y1 = -1;

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

  if (redCols.length === 0) {
    throw new Error("Cannot locate red clinic divider in Healthcare Doctors lockup.");
  }

  const divider = redCols[0];
  // Leave a small gap before the divider; keep tagline fully inside the crop.
  const leftEnd = Math.max(x0 + 40, divider - 6);
  if (leftEnd - x0 < 120 || y1 - y0 < 40) {
    throw new Error("Healthcare Doctors brand crop is too small; refuse generation.");
  }

  const crop = {
    left: x0,
    top: Math.max(0, y0 - 2),
    width: leftEnd - x0,
    height: Math.min(info.height - Math.max(0, y0 - 2), y1 - y0 + 5),
  };

  const png = await sharp(LOCKUP_SOURCE).extract(crop).png().toBuffer();
  return { png, crop, sourceWidth: info.width, sourceHeight: info.height };
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
