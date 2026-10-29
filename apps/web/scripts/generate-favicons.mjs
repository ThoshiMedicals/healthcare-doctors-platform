/**
 * Healthcare Doctors brand-symbol-only favicon generator.
 *
 * Crop the EXISTING green-heart/blue-curves Healthcare Doctors mark from
 * assets/brand/wmc-brand-mark.webp; exclude the "Caring for You" tagline.
 * The photograph's pale background is removed to produce transparent PNGs.
 * Do not edit the immutable brand source or use the wordmark, tagline or ™.
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicRoot = path.join(root, "public");
const source = path.join(publicRoot, "assets", "brand", "wmc-brand-mark.webp");
const metadata = await sharp(source).metadata();

if (metadata.width !== 512 || metadata.height !== 512) {
  throw new Error("Healthcare Doctors source mark dimensions changed; refuse automatic crop.");
}

// The symbol occupies the upper region. The tagline begins below this crop.
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

    // Extract only the two existing saturated brand colours. All pale
    // photographic background, white ECG cutouts and tagline become alpha 0.
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

if (totals.some(t => t[3] < 700) || x1 - x0 < 200 || y1 - y0 < 170) {
  throw new Error("Cannot identify the two-colour Healthcare Doctors mark reliably.");
}

const palette = totals.map(([r, g, b, n]) => [
  Math.round(r / n),
  Math.round(g / n),
  Math.round(b / n),
]);

// Tight alpha-bounded crop retains every part of the symbol and strips all text.
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

async function renderIcon(size) {
  const padding = size === 16 ? 1 : size === 32 ? 2 : 10;
  const mark = await sharp(isolatedMark)
    .resize({
      width: size - padding * 2,
      height: size - padding * 2,
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();
  const output = await sharp({
    create: {
      width: size, height: size, channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  }).composite([{ input: mark, gravity: "centre" }])
    .png({ compressionLevel: 9 })
    .toBuffer();

  const probe = await sharp(output).ensureAlpha().raw().toBuffer();
  if (probe[3] !== 0 || probe[(size * size - 1) * 4 + 3] !== 0) {
    throw new Error(`Favicon ${size}x${size} lost transparency`);
  }
  return output;
}

function encodeIco(frames) {
  const header = Buffer.alloc(6 + frames.length * 16);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(frames.length, 4);
  let offset = header.length;
  for (const [i, frame] of frames.entries()) {
    const at = 6 + i * 16;
    header.writeUInt8(frame.size, at);
    header.writeUInt8(frame.size, at + 1);
    header.writeUInt16LE(1, at + 4);
    header.writeUInt16LE(32, at + 6);
    header.writeUInt32LE(frame.png.length, at + 8);
    header.writeUInt32LE(offset, at + 12);
    offset += frame.png.length;
  }
  return Buffer.concat([header, ...frames.map(f => f.png)]);
}

const png16 = await renderIcon(16);
const png32 = await renderIcon(32);
const png180 = await renderIcon(180);

await mkdir(publicRoot, { recursive: true });
await Promise.all([
  writeFile(path.join(publicRoot, "favicon.ico"), encodeIco([
    { size: 16, png: png16 }, { size: 32, png: png32 },
  ])),
  writeFile(path.join(publicRoot, "favicon-16x16.png"), png16),
  writeFile(path.join(publicRoot, "favicon-32x32.png"), png32),
  writeFile(path.join(publicRoot, "apple-touch-icon.png"), png180),
]);

console.log("Healthcare Doctors SYMBOL ONLY: generated transparent favicon.ico, 16x16, 32x32 and 180x180 icons.");
console.log("Colours preserved from original mark:", JSON.stringify(palette));
