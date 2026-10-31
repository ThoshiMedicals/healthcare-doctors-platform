/**
 * Builds responsive WebP derivatives for Phase 1A authority diagrams.
 * Masters stay unchanged. Derivatives are width-only resizes at the same aspect ratio.
 *
 * Usage:
 *   node old-html/cms/tools/build-authority-images.mjs [sourceDir]
 */
import { copyFile, mkdir, readdir } from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../apps/web/package.json"),
);
const sharp = require("sharp");

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const sourceDir = path.resolve(
  process.argv[2] || "C:/Users/RoshanSamarawickrema/Downloads/wmc_18_website_images_webp",
);
const destinations = [
  path.join(repoRoot, "old-html/assets/knowledge/authority"),
  path.join(repoRoot, "apps/web/public/assets/knowledge/authority"),
];
const widths = [640, 960];

const files = (await readdir(sourceDir)).filter((name) => name.endsWith(".webp")).sort();
if (files.length !== 18) {
  throw new Error(`Expected 18 WebP masters in ${sourceDir}, found ${files.length}`);
}

for (const destination of destinations) {
  await mkdir(destination, { recursive: true });
}

for (const file of files) {
  const master = path.join(sourceDir, file);
  const image = sharp(master);
  const meta = await image.metadata();
  if (!meta.width || !meta.height) throw new Error(`Missing dimensions for ${file}`);

  for (const destination of destinations) {
    await copyFile(master, path.join(destination, file));
    for (const width of widths) {
      if (width >= meta.width) continue;
      const variant = file.replace(/\.webp$/, `-${width}.webp`);
      await sharp(master)
        .resize({ width, withoutEnlargement: true })
        .webp({ quality: 90, effort: 5 })
        .toFile(path.join(destination, variant));
    }
  }
  console.log(`${file} ${meta.width}x${meta.height}`);
}

console.log(`Wrote masters and ${widths.join("/")} variants to ${destinations.length} asset roots.`);
