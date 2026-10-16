import fs from "node:fs";
import path from "node:path";
import { listHtmlFiles, goldenHtmlRoot } from "../src/importer/golden-root";

async function main() {
const root = goldenHtmlRoot();
const origin = process.env.COMPARE_ORIGIN ?? "http://localhost:3000";
const mismatches: Array<{ path: string; status: number; differenceAt?: number }> = [];
let exact = 0;

for (const relativePath of listHtmlFiles(root)) {
  const urlPath = relativePath === "index.html" ? "/" : `/${relativePath}`;
  const response = await fetch(`${origin}${urlPath}`);
  const body = await response.text();
  const expected = fs.readFileSync(path.join(root, relativePath), "utf8");
  if (response.status === 200 && body === expected) {
    exact += 1;
    continue;
  }
  let differenceAt: number | undefined;
  const length = Math.min(body.length, expected.length);
  for (let index = 0; index < length; index += 1) {
    if (body[index] !== expected[index]) {
      differenceAt = index;
      break;
    }
  }
  mismatches.push({ path: relativePath, status: response.status, differenceAt });
}

const indexResponse = await fetch(`${origin}/index.html`);
const indexBody = await indexResponse.text();
const indexExpected = fs.readFileSync(path.join(root, "index.html"), "utf8");
const indexAliasExact = indexResponse.status === 200 && indexBody === indexExpected;

const styleResponse = await fetch(`${origin}/styles.css`);
const styleExact =
  styleResponse.status === 200 &&
  Buffer.from(await styleResponse.arrayBuffer()).equals(fs.readFileSync(path.join(root, "styles.css")));

const manifestResponse = await fetch(`${origin}/search-index/manifest.json`);
const manifestExact =
  manifestResponse.status === 200 &&
  Buffer.from(await manifestResponse.arrayBuffer()).equals(fs.readFileSync(path.join(root, "search-index/manifest.json")));

console.log(JSON.stringify({ compared: exact + mismatches.length, exact, mismatches, indexAliasExact, styleExact, manifestExact }, null, 2));
if (mismatches.length > 0 || !indexAliasExact || !styleExact || !manifestExact) process.exitCode = 1;
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
