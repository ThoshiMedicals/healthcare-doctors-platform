/**
 * Rebuild practitioner-peers.json and embed into public/site.js (+ old-html/site.js).
 * Source of truth: existing peers expertise + approved additions for published GPs
 * missing from the 2026-10-26 graph (James, Yamesha, Golnar).
 *
 * Peer edges = shared expertise labels only. No clinical ranking claims.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(webRoot, "../..");
const peersPath = path.join(webRoot, "public", "search-index", "practitioner-peers.json");
const siteJsPath = path.join(webRoot, "public", "site.js");
const oldSiteJsPath = path.join(repoRoot, "old-html", "site.js");

const existing = JSON.parse(fs.readFileSync(peersPath, "utf8"));

/** Expertise labels taken from live Hostinger related-service links (2026-11-11). */
const additions = {
  "doctors/dr-james.html": {
    name: "Dr James Chanaka",
    expertise: [
      "Family Health",
      "Children’s Health",
      "Mental Health Care",
      "Preventive Healthcare",
      "Telehealth",
    ],
  },
  "doctors/dr-yamesha-ranatunga.html": {
    name: "Dr Yamesha Ranatunga",
    expertise: [
      "Chronic Disease Care",
      "Family Health",
      "Preventive Healthcare",
      "Telehealth",
      "Women’s Health",
    ],
  },
  "doctors/dr-golnar-mortezaei.html": {
    name: "Dr Golnar Mortezaei",
    expertise: [
      "Chronic Disease Care",
      "Family Health",
      "Mental Health Care",
      "Preventive Healthcare",
      "Telehealth",
    ],
  },
};

const base = {};
for (const [url, node] of Object.entries(existing.practitioners)) {
  base[url] = { name: node.name, expertise: [...node.expertise] };
}
for (const [url, node] of Object.entries(additions)) {
  base[url] = { name: node.name, expertise: [...node.expertise] };
}

function sharedLabels(a, b) {
  const setB = new Set(b);
  return a.filter((label) => setB.has(label));
}

const practitioners = {};
for (const [url, node] of Object.entries(base)) {
  const peers = Object.entries(base)
    .filter(([otherUrl]) => otherUrl !== url)
    .map(([otherUrl, other]) => {
      const shared = sharedLabels(node.expertise, other.expertise);
      return {
        url: otherUrl,
        name: other.name,
        shared: shared.slice(0, 3),
        count: shared.length,
      };
    })
    .filter((p) => p.count > 0)
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, 4);
  practitioners[url] = {
    name: node.name,
    expertise: node.expertise,
    peers,
  };
}

const today = new Date().toISOString().slice(0, 10);
const payload = {
  generated: today,
  source: "search-index/doctors.json + services.json (shared service links only) + published profile service links 2026-11-11",
  disclaimer: existing.disclaimer,
  practitioners,
};

fs.writeFileSync(peersPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");

function embedPeers(siteJsFile) {
  if (!fs.existsSync(siteJsFile)) {
    console.warn(`skip missing ${siteJsFile}`);
    return;
  }
  const src = fs.readFileSync(siteJsFile, "utf8");
  const next = src.replace(
    /const PEERS = \{[\s\S]*?\};/,
    `const PEERS = ${JSON.stringify(payload)};`,
  );
  if (next === src) {
    throw new Error(`PEERS const not found in ${siteJsFile}`);
  }
  fs.writeFileSync(siteJsFile, next, "utf8");
  console.log(`updated ${path.relative(repoRoot, siteJsFile)}`);
}

embedPeers(siteJsPath);
embedPeers(oldSiteJsPath);

const keys = Object.keys(practitioners);
console.log(`peer practitioners: ${keys.length}`);
for (const k of Object.keys(additions)) {
  console.log(`  + ${k} peers=${practitioners[k].peers.length}`);
}
