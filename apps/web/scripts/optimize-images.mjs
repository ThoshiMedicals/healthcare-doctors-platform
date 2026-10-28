import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const assets = path.join(root, "public", "assets");
const output = path.join(assets, "performance");

const variants = [
  ["clinic-reception.png", "clinic-reception", [720, 1080]],
  ["location-storefront-polished.webp", "location-storefront", [720, 1280, 1800]],
];

await mkdir(output, { recursive: true });
for (const [source, name, widths] of variants) {
  const original = await readFile(path.join(assets, source));
  for (const width of widths) {
    const destination = path.join(output, `${name}-${width}.webp`);
    const bytes = await sharp(original)
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 86, effort: 4 })
      .toBuffer();
    if (!bytes.length) throw new Error(`Empty optimised image: ${destination}`);
    await writeFile(destination, bytes);
    console.log(`${name}-${width}.webp: ${bytes.length} bytes`);
  }
}
