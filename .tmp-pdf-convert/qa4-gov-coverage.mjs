import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const gov = fs.readFileSync(path.join(repoRoot, "apps/web/public/governance-published.js"), "utf8");
const keys = [...gov.matchAll(/"(knowledge\/[^"]+)"/g)].map((m) => m[1]);
const uniq = [...new Set(keys)];

const articles = fs
  .readdirSync(path.join(repoRoot, "old-html/knowledge/articles"))
  .filter((f) => f.endsWith(".html"))
  .map((a) => `knowledge/articles/${a}`);
const topics = fs
  .readdirSync(path.join(repoRoot, "old-html/knowledge"))
  .filter((f) => f.endsWith(".html"))
  .map((t) => `knowledge/${t}`);
const all = [...topics, ...articles];
const inReg = all.filter((k) => uniq.includes(k));
const missing = all.filter((k) => !uniq.includes(k));

// sample byline presence in articles
let withByline = 0;
let withClinician = 0;
for (const rel of articles) {
  const html = fs.readFileSync(path.join(repoRoot, "old-html", rel), "utf8");
  if (/knowledge-byline/.test(html)) withByline += 1;
  if (/knowledge-byline[\s\S]{0,400}Dr\s/.test(html)) withClinician += 1;
}

console.log(
  JSON.stringify(
    {
      pages: all.length,
      registryKnowledgeKeys: uniq.length,
      inRegistry: inReg.length,
      missingGovRecord: missing.length,
      missingSample: missing.slice(0, 20),
      articlesWithByline: withByline,
      articlesTotal: articles.length,
      bylineMentionsDr: withClinician,
    },
    null,
    2,
  ),
);
