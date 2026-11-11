/**
 * PWA installability icon generator.
 *
 * Crops the EXISTING green-heart/blue-curves Healthcare Doctors mark from
 * assets/brand/wmc-brand-mark.webp (same symbol-only region used by
 * generate-favicons.mjs) and composes it onto opaque canvases at the sizes
 * required by apps/web/public/manifest.webmanifest:
 *   - icon-96.png        96x96   purpose "any"   (manifest shortcuts)
 *   - icon-192.png       192x192 purpose "any"
 *   - icon-512.png       512x512 purpose "any"
 *   - maskable-192.png   192x192 purpose "maskable" (mark kept inside the
 *     80% safe-zone circle so Android's adaptive-icon mask cannot clip it)
 *   - maskable-512.png   512x512 purpose "maskable"
 *
 * This script intentionally re-derives the isolated mark rather than
 * importing generate-favicons.mjs, so favicon generation/tests stay
 * untouched. Do not edit the immutable brand source or use the wordmark,
 * tagline or (tm).
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicRoot = path.join(root, "public");
const iconsRoot = path.join(publicRoot, "icons");
const source = path.join(publicRoot, "assets", "brand", "wmc-brand-mark.webp");

const BACKGROUND = { r: 255, g: 255, b: 255, alpha: 1 }; // white; mark colours (brand blue/green) read clearly.

const metadata = await sharp(source).metadata();
if (metadata.width !== 512 || metadata.height !== 512) {
  throw new Error("Healthcare Doctors source mark dimensions changed; refuse automatic crop.");
}

// Same symbol-only region as generate-favicons.mjs; the tagline begins below this crop.
const region = { left: 60, top: 74, width: 428, height: 363 };
const { data, info } = await sharp(source)
  .extract(region)
  .removeAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

const pixelCount = info.width * info.height;
const alpha = new Uint8Array(pixelCount);
const family = new Uint8Array(pixelCount); // 1 = blue, 2 = green
const totals = [[0, 0, 0, 0], [0, 0, 0, 0]];
let x0 = info.width, y0 = info.height, x1 = -1, y1 = -1;

for (let y = 0; y < info.height; y++) {
  for (let x = 0; x < info.width; x++) {
    const i = y * info.width + x;
    const p = i * info.channels;
    const r = data[p], g = data[p + 1], b = data[p + 2];

    const blue = b > 68 && r < 155 && g < 175
      ? Math.max(0, Math.min(1, (b - Math.max(r, g) - 8) / 23))
      : 0;
    const green = g > 58 && r < 145 && b < 155
      ? Math.max(0, Math.min(1, (g - Math.max(r, b) - 6) / 23))
      : 0;
    const weight = Math.max(blue, green);
    if (weight < 0.15) continue;
    alpha[i] = Math.round(255 * weight);
    family[i] = blue >= green ? 1 : 2;

    if (weight > 0.8) {
      const tally = totals[family[i] - 1];
      tally[0] += r; tally[1] += g; tally[2] += b; tally[3]++;
    }
    if (alpha[i] > 25) {
      x0 = Math.min(x0, x); y0 = Math.min(y0, y);
      x1 = Math.max(x1, x); y1 = Math.max(y1, y);
    }
  }
}

if (totals.some((t) => t[3] < 700) || x1 - x0 < 200 || y1 - y0 < 170) {
  throw new Error("Cannot identify the two-colour Healthcare Doctors mark reliably.");
}

const palette = totals.map(([r, g, b, n]) => [
  Math.round(r / n),
  Math.round(g / n),
  Math.round(b / n),
]);

const width = x1 - x0 + 1;
const height = y1 - y0 + 1;
const pixels = Buffer.alloc(width * height * 4);
for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const i = (y0 + y) * info.width + x0 + x;
    const familyIndex = family[i];
    if (!familyIndex) continue;
    const dst = (y * width + x) * 4;
    const [r, g, b] = palette[familyIndex - 1];
    pixels[dst] = r;
    pixels[dst + 1] = g;
    pixels[dst + 2] = b;
    pixels[dst + 3] = alpha[i];
  }
}

const isolatedMark = await sharp(pixels, {
  raw: { width, height, channels: 4 },
}).png().toBuffer();

/**
 * Compose the isolated mark onto an opaque square canvas.
 * `markFraction` is the fraction of the canvas the mark's longest edge may
 * occupy — maskable icons use a smaller fraction so the mark sits inside the
 * Android adaptive-icon 80% safe-zone circle.
 */
async function renderIcon(size, markFraction) {
  const markSize = Math.round(size * markFraction);
  const mark = await sharp(isolatedMark)
    .resize({
      width: markSize,
      height: markSize,
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: BACKGROUND,
    },
  })
    .composite([{ input: mark, gravity: "centre" }])
    .png({ compressionLevel: 9 })
    .toBuffer();
}

const [icon96, icon192, icon512, maskable192, maskable512] = await Promise.all([
  renderIcon(96, 0.72),
  renderIcon(192, 0.72),
  renderIcon(512, 0.72),
  // Safe-zone: keep the mark within the inner ~60% so a circular/squircle
  // adaptive-icon mask never clips it.
  renderIcon(192, 0.58),
  renderIcon(512, 0.58),
]);

await mkdir(iconsRoot, { recursive: true });
await Promise.all([
  writeFile(path.join(iconsRoot, "icon-96.png"), icon96),
  writeFile(path.join(iconsRoot, "icon-192.png"), icon192),
  writeFile(path.join(iconsRoot, "icon-512.png"), icon512),
  writeFile(path.join(iconsRoot, "maskable-192.png"), maskable192),
  writeFile(path.join(iconsRoot, "maskable-512.png"), maskable512),
]);

console.log("WMC PWA icons generated: icon-96/192/512 (any) + maskable-192/512, opaque white background.");
console.log("Colours preserved from original mark:", JSON.stringify(palette));
