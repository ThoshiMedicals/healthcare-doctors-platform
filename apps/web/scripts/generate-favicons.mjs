/**
 * Favicon generator from the owner-supplied Healthcare Doctors™ short lockup
 * (™ + "Caring for you"). Tiny tiles use a compact left crop; larger tiles use
 * the full short wordmark contain-fit — never distorted.
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  composeSquareIcon,
  encodeIco,
  extractBrandLockupCrop,
  extractCompactFaviconMark,
  publicRoot,
} from "./brand-icon-source.mjs";

const { png: lockup, crop } = await extractBrandLockupCrop();
const { png: compact, crop: compactMeta } = await extractCompactFaviconMark();

async function renderTransparent(size, sourcePng, markFraction) {
  return composeSquareIcon(sourcePng, size, {
    opaque: false,
    markFraction,
  });
}

const png16 = await renderTransparent(16, compact, 0.94);
const png32 = await renderTransparent(32, compact, 0.92);
const png180 = await renderTransparent(180, lockup, 0.84);

await mkdir(publicRoot, { recursive: true });
await Promise.all([
  writeFile(
    path.join(publicRoot, "favicon.ico"),
    encodeIco([
      { size: 16, png: png16 },
      { size: 32, png: png32 },
    ]),
  ),
  writeFile(path.join(publicRoot, "favicon-16x16.png"), png16),
  writeFile(path.join(publicRoot, "favicon-32x32.png"), png32),
  writeFile(path.join(publicRoot, "apple-touch-icon.png"), png180),
]);

console.log(
  "Healthcare Doctors™ short-lockup favicons generated (compact 16/32, full 180).",
);
console.log("Brand crop:", JSON.stringify(crop));
console.log("Compact crop:", JSON.stringify(compactMeta));
