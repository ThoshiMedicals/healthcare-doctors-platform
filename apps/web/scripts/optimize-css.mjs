import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { transform } from "lightningcss";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = path.join(root, "public", "styles.css");
const optimizedPath = path.join(root, "public", "styles.min.css");

const source = await readFile(sourcePath);
const result = transform({
  filename: sourcePath,
  code: source,
  minify: true,
  sourceMap: false,
});

if (result.code.length === 0) {
  throw new Error("CSS minification generated an empty stylesheet");
}

await writeFile(optimizedPath, result.code);
console.log(`CSS minified: ${source.length} -> ${result.code.length} bytes`);
