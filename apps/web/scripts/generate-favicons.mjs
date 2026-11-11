/**
 * Favicon generator from the owner-supplied Healthcare Doctors lockup
 * (™ + "Caring for you"). Square icons use a contain-fit of the left brand
 * block only — the full horizontal clinic lockup is never distorted.
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  composeSquareIcon,
  encodeIco,
  extractBrandLockupCrop,
  publicRoot,
} from "./brand-icon-source.mjs";

const { png: lockup, crop } = await extractBrandLockupCrop();

async function renderTransparent(size) {
  // Slightly larger fill on tiny tiles so teal/navy type remains visible.
  const markFraction = size <= 32 ? 0.92 : 0.82;
  const output = await composeSquareIcon(lockup, size, {
    opaque: false,
    markFraction,
  });
  return output;
}

const png16 = await renderTransparent(16);
const png32 = await renderTransparent(32);
const png180 = await renderTransparent(180);

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
  "Healthcare Doctors lockup favicons generated (™ + Caring for you left block, contain-fit).",
);
console.log("Brand crop:", JSON.stringify(crop));
