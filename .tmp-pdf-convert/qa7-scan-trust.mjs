import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (entry.name.endsWith(".html")) out.push(full);
  }
  return out;
}

function scan(files, kind) {
  const rows = files.map((full) => {
    const html = fs.readFileSync(full, "utf8");
    return {
      file: path.relative(repoRoot, full).replace(/\\/g, "/"),
      kind,
      footerTrust: /footer-trust|agpal-mark|bulk-billing-practice/i.test(html),
      agpal: /agpal|Accredited General Practice|ACSQHC/i.test(html),
      bulk: /bulk.?billing/i.test(html),
      govHost: /data-governance-review|governance-review/i.test(html),
      authorityPeers: /authority-peer|authority-related|Related Practitioners|practitioner-knowledge/i.test(html),
      authoritySignal: /authority-signal|Published areas of care|published care/i.test(html),
      reviewMeta: /Last reviewed|Next review|Reviewed by|knowledge-byline|Updated 20/i.test(html),
      siteJs: /site\.js/.test(html),
      trustStripClass: /trust-strip|hero-trust|trust-chip/i.test(html),
    };
  });
  const keys = Object.keys(rows[0] || {}).filter((k) => k !== "file" && k !== "kind");
  const summary = {};
  for (const k of keys) {
    const ok = rows.filter((r) => r[k]).length;
    summary[k] = { ok, missing: rows.length - ok };
  }
  return { count: rows.length, summary, sampleMissingGov: rows.filter((r) => !r.govHost).slice(0, 8).map((r) => r.file) };
}

const doctors = walk(path.join(repoRoot, "old-html/doctors"));
const services = walk(path.join(repoRoot, "old-html/services"));
const knowledge = walk(path.join(repoRoot, "old-html/knowledge"));
const home = path.join(repoRoot, "apps/web/public/index.html");
const gov = fs.readFileSync(path.join(repoRoot, "apps/web/public/governance-published.js"), "utf8");
const govEmpty = /Object\.freeze\(\{\}\)/.test(gov);
const govKeys = [...gov.matchAll(/"([^"]+\.html)"/g)].map((m) => m[1]);

console.log(
  JSON.stringify(
    {
      home: scan([home], "home"),
      doctors: scan(doctors, "doctor"),
      services: scan(services, "service"),
      knowledge: scan(knowledge, "knowledge"),
      governancePublished: { empty: govEmpty, keyCount: new Set(govKeys).size },
    },
    null,
    2,
  ),
);
