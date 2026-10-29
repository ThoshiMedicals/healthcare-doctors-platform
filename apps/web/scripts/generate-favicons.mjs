/**
 * Derive WMC favicon assets directly from the approved header wordmark.
 * The old wmc-brand-mark.webp contains the former Healthcare Doctors mark
 * and must never be used for favicon generation.
 *
 * Does not modify either original logo. Run during standard and UAT builds.
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicRoot = path.join(root, "public");
const wordmark = path.join(publicRoot, "assets", "brand", "healthcare-doctors-woolloongabba-logo.png");

const metadata = await sharp(wordmark).metadata();
if (metadata.width !== 475 || metadata.height !== 71) {
  throw new Error("The approved WMC header wordmark dimensions have changed; review favicon extraction before rebuilding.");
}

// Extract the leading W from "Woolloongabba" in the approved header artwork.
// Keeping the exact source lettering avoids replacing the brand with a new logo.
const glyph = await sharp(wordmark)
  .extract({ left: 131, top: 13, width: 24, height: 26 })
  .trim({ background: "#ffffff", threshold: 10 })
  .png()
  .toBuffer();

const glyphMetadata = await sharp(glyph).metadata();
if (!glyphMetadata.width || !glyphMetadata.height || glyphMetadata.width < 8 || glyphMetadata.height < 8) {
  throw new Error("The approved WMC wordmark glyph could not be extracted.");
}

async function renderIcon(size) {
  const padding = size === 16 ? 2 : size === 32 ? 4 : 24;
  const glyphPng = await sharp(glyph)
    .resize({ width: size - 2 * padding, height: size - 2 * padding, fit: "contain" })
    .png()
    .toBuffer();
  return sharp({
    create: { width: size, height: size, channels: 4, background: "#ffffff" },
  }).composite([{ input: glyphPng, gravity: "centre" }])
    .png({ compressionLevel: 9 })
    .toBuffer();
}

// ICO stores PNG-encoded frames, supported by current Windows and web browsers.
function encodeIco(frames) {
  const directory = Buffer.alloc(6 + frames.length * 16);
  directory.writeUInt16LE(0, 0);
  directory.writeUInt16LE(1, 2);
  directory.writeUInt16LE(frames.length, 4);
  let offset = directory.length;
  frames.forEach(({ size, png }, i) => {
    const p = 6 + i * 16;
    directory.writeUInt8(size, p);
    directory.writeUInt8(size, p + 1);
    directory.writeUInt8(0, p + 2);
    directory.writeUInt8(0, p + 3);
    directory.writeUInt16LE(1, p + 4);
    directory.writeUInt16LE(32, p + 6);
    directory.writeUInt32LE(png.length, p + 8);
    directory.writeUInt32LE(offset, p + 12);
    offset += png.length;
  });
  return Buffer.concat([directory, ...frames.map(frame => frame.png)]);
}

const png16 = await renderIcon(16);
const png32 = await renderIcon(32);
const png180 = await renderIcon(180);

await mkdir(publicRoot, { recursive: true });
await Promise.all([
  writeFile(path.join(publicRoot, "favicon.ico"), encodeIco([{ size: 16, png: png16 }, { size: 32, png: png32 }])),
  writeFile(path.join(publicRoot, "favicon-16x16.png"), png16),
  writeFile(path.join(publicRoot, "favicon-32x32.png"), png32),
  writeFile(path.join(publicRoot, "apple-touch-icon.png"), png180),
]);
console.log("Generated WMC favicon.ico, 16x16, 32x32 and apple-touch-icon.png from approved wordmark.");
