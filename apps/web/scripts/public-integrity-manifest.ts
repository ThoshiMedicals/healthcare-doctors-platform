import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildPublicIntegrityManifest } from "../src/importer/public-integrity";

const webDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function main() {
  const manifest = buildPublicIntegrityManifest();
  const outDir = path.join(webDir, "reports");
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, "b1a-public-integrity.json");
  fs.writeFileSync(outFile, JSON.stringify(manifest, null, 2), "utf8");
  console.log(JSON.stringify({ root: manifest.root, fileCount: manifest.files.length, reportPath: outFile }, null, 2));
}

main();
