import sharp from "sharp";
import { copyFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const out = path.join(root, "docs", "icon-previews");
await mkdir(out, { recursive: true });

const copies = [
  ["public/favicon-16x16.png", "preview-favicon-16.png"],
  ["public/favicon-32x32.png", "preview-favicon-32.png"],
  ["public/apple-touch-icon.png", "preview-apple-touch-180.png"],
  ["public/icons/icon-192.png", "preview-pwa-192.png"],
  ["public/icons/icon-512.png", "preview-pwa-512.png"],
  ["public/icons/maskable-192.png", "preview-maskable-192.png"],
  ["public/icons/maskable-512.png", "preview-maskable-512.png"],
  ["public/assets/brand/healthcare-doctors-lockup-tm-caring.png", "source-lockup.png"],
];

for (const [src, dest] of copies) {
  await copyFile(path.join(root, src), path.join(out, dest));
}

async function enlarge(src, dest, scale) {
  const abs = path.join(root, src);
  const m = await sharp(abs).metadata();
  await sharp(abs)
    .resize(m.width * scale, m.height * scale, { kernel: "nearest" })
    .png()
    .toFile(path.join(out, dest));
}

await enlarge("public/favicon-16x16.png", "preview-favicon-16-enlarged-8x.png", 8);
await enlarge("public/favicon-32x32.png", "preview-favicon-32-enlarged-4x.png", 4);

const tiles = [
  { file: "public/favicon-16x16.png", box: 96 },
  { file: "public/favicon-32x32.png", box: 96 },
  { file: "public/apple-touch-icon.png", box: 180 },
  { file: "public/icons/icon-192.png", box: 192 },
  { file: "public/icons/maskable-192.png", box: 192 },
];
const pad = 24;
const width = pad + tiles.reduce((n, t) => n + t.box + pad, 0);
const height = 220 + pad * 2;
const composites = [];
let x = pad;
for (const t of tiles) {
  const buf = await sharp(path.join(root, t.file))
    .resize(t.box, t.box, {
      fit: "contain",
      background: { r: 240, g: 244, b: 248, alpha: 1 },
    })
    .png()
    .toBuffer();
  composites.push({ input: buf, left: x, top: pad });
  x += t.box + pad;
}

await sharp({
  create: { width, height, channels: 3, background: { r: 248, g: 250, b: 252 } },
})
  .composite(composites)
  .png()
  .toFile(path.join(out, "contact-sheet.png"));

await writeFile(
  path.join(out, "README.md"),
  [
    "# Icon refresh previews",
    "",
    "Source: `healthcare-doctors-lockup-tm-caring.png` (owner lockup with trademark and Caring for you).",
    "Square icons use the left brand block only (contain-fit; full horizontal lockup is not squeezed).",
    "Cache token: `hd-tm-caring-short-20261111b`.",
    "",
  ].join("\n"),
);

console.log("previews written to", out);
