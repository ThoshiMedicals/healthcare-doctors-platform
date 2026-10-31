import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PROFILE = "doctors/dr-gemunu-suresh-ranawake.html";
const TOKEN = /ranawake|gemunu/i;

const targets = [
  "old-html/search-index/doctors.json",
  "apps/web/public/search-index/doctors.json",
  "old-html/search-index/administration.json",
  "apps/web/public/search-index/administration.json",
  "old-html/search-index/conditions.json",
  "apps/web/public/search-index/conditions.json",
  "old-html/search-index/life-stages.json",
  "apps/web/public/search-index/life-stages.json",
  "old-html/search-index/manifest.json",
  "apps/web/public/search-index/manifest.json",
  "old-html/search-index/mental-health.json",
  "apps/web/public/search-index/mental-health.json",
  "old-html/search-index/prevention.json",
  "apps/web/public/search-index/prevention.json",
  "old-html/search-index/services.json",
  "apps/web/public/search-index/services.json",
  "old-html/assets/IMAGE_LIBRARY.json",
  "apps/web/public/assets/IMAGE_LIBRARY.json",
  "old-html/assets/team/MANIFEST.json",
  "apps/web/public/assets/team/MANIFEST.json",
  "old-html/assets/team/INSTITUTIONAL-CATEGORY.json",
  "apps/web/public/assets/team/INSTITUTIONAL-CATEGORY.json",
  "old-html/digital-reception.js",
  "apps/web/public/digital-reception.js",
  "old-html/digital-reception-index.js",
  "apps/web/public/digital-reception-index.js",
];

function deepClean(value) {
  if (Array.isArray(value)) {
    return value
      .map(deepClean)
      .filter((item) => {
        if (item == null) return false;
        const blob = typeof item === "string" ? item : JSON.stringify(item);
        if (!TOKEN.test(blob) && !blob.includes(PROFILE)) return true;
        // Drop whole objects/strings that are primarily about him
        if (typeof item === "string") return false;
        if (
          item.url === PROFILE ||
          item.path === PROFILE ||
          item.href === PROFILE ||
          item.slug === "dr-gemunu-suresh-ranawake" ||
          item.title === "Dr Gemunu Suresh Ranawake" ||
          item.name === "Dr Gemunu Suresh Ranawake" ||
          item.h1 === "Dr Gemunu Suresh Ranawake" ||
          item.file === "dr-gemunu-suresh-ranawake.webp" ||
          item.file === "dr-gemunu-suresh-ranawake-640.webp" ||
          String(item.id || "").includes("ranawake") ||
          String(item.key || "").includes("ranawake")
        ) {
          return false;
        }
        // Keep objects that only mention him in related[] — those get cleaned recursively
        return true;
      });
  }
  if (value && typeof value === "object") {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      if (TOKEN.test(k) || k.includes("ranawake") || k.includes("gemunu")) continue;
      if (k === PROFILE) continue;
      out[k] = deepClean(v);
    }
    for (const key of Object.keys(out)) {
      if (Array.isArray(out[key]) && out[key].every((x) => typeof x === "string")) {
        out[key] = out[key].filter((s) => !TOKEN.test(s) && !s.includes(PROFILE));
      }
    }
    return out;
  }
  if (typeof value === "string") {
    if (TOKEN.test(value) || value.includes(PROFILE)) return null;
    return value;
  }
  return value;
}

function scrubJs(raw) {
  let next = raw;
  // Remove quoted doctor path occurrences
  next = next.replace(/"?doctors\/dr-gemunu-suresh-ranawake\.html"?\s*,?/g, "");
  next = next.replace(/,?\s*"doctors\/dr-gemunu-suresh-ranawake\.html"/g, "");
  // Remove objects with Ranawake title/name/url
  next = next.replace(/\{[^{}]*dr-gemunu-suresh-ranawake\.html[^{}]*\}\s*,?/gi, "");
  next = next.replace(/\{[^{}]*Dr Gemunu Suresh Ranawake[^{}]*\}\s*,?/gi, "");
  next = next.replace(/\{[^{}]*ranawake[^{}]*\}\s*,?/gi, "");
  next = next.replace(/,\s*,/g, ",");
  next = next.replace(/\[\s*,/g, "[");
  next = next.replace(/,\s*\]/g, "]");
  next = next.replace(/\{\s*,/g, "{");
  next = next.replace(/,\s*\}/g, "}");
  return next;
}

const updated = [];
for (const rel of targets) {
  const full = path.join(repoRoot, rel);
  if (!fs.existsSync(full)) continue;
  const raw = fs.readFileSync(full, "utf8");
  if (!TOKEN.test(raw) && !raw.includes(PROFILE)) continue;

  if (rel.endsWith(".json")) {
    const data = JSON.parse(raw);
    const cleaned = deepClean(data);
    fs.writeFileSync(full, `${JSON.stringify(cleaned, null, 2)}\n`);
    updated.push(rel);
  } else {
    const next = scrubJs(raw);
    fs.writeFileSync(full, next);
    updated.push(rel);
  }
}

const remaining = [];
for (const rel of targets) {
  const full = path.join(repoRoot, rel);
  if (!fs.existsSync(full)) continue;
  const raw = fs.readFileSync(full, "utf8");
  if (TOKEN.test(raw) || raw.includes(PROFILE)) remaining.push(rel);
}

console.log(JSON.stringify({ updated, remaining }, null, 2));
