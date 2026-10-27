import fs from "fs";
import path from "path";

const ROOT = "C:/Users/RoshanSamarawickrema/Desktop/WMC-Master-Project";
const oldHtml = path.join(ROOT, "old-html");
const indexDir = path.join(ROOT, "apps/web/public/search-index");

function relatedFromHtml(file) {
  const html = fs.readFileSync(path.join(oldHtml, file), "utf8");
  const dir = path.posix.dirname(file.replace(/\\/g, "/"));
  return [...html.matchAll(/class="resource-link"[^>]*href="([^"]+)"/g)]
    .map((m) => m[1])
    .filter((u) => !u.startsWith("http") && !u.startsWith("tel:") && !u.startsWith("mailto:"))
    .map((u) => {
      if (u.startsWith("/")) return u.slice(1);
      if (dir === ".") return u.replace(/^\.\//, "");
      return path.posix.normalize(path.posix.join(dir, u));
    })
    .filter((u, i, arr) => arr.indexOf(u) === i)
    .slice(0, 12);
}

const pages = [
  "new-patients.html",
  "patient-forms.html",
  "repeat-scripts.html",
  "new-patient-prescribing-policy.html",
  "test-results.html",
  "telehealth.html",
  "services/pathology.html",
  "knowledge/articles/when-can-i-use-telehealth.html",
  "doctors/dr-mary-abadir.html",
  "doctors/dr-tanya-goodwill.html",
  "doctors/dr-steven-chang.html",
  "doctors/mr-samuel-stafford.html",
  "knowledge/articles/planning-a-pregnancy.html",
  "knowledge/articles/what-happens-during-antenatal-care.html",
  "knowledge/articles/your-first-pregnancy-gp-appointment.html",
  "knowledge/articles/back-pain-when-should-i-see-a-gp.html",
  "knowledge/articles/understanding-neck-pain.html",
  "knowledge/articles/understanding-muscle-and-joint-pain.html",
  "knowledge/womens-health.html",
  "knowledge/mens-health.html",
  "knowledge/childrens-health.html",
  "knowledge/mental-health.html",
  "knowledge/pregnancy.html",
  "knowledge/skin-health-skin-cancer.html",
  "services/womens-health.html",
  "services/mens-health.html",
  "services/childrens-health.html",
  "services/mental-health.html",
  "services/antenatal-postnatal-care.html",
  "services/pre-pregnancy-care.html",
  "services/skin-cancer-care.html",
];

const shardFiles = fs.readdirSync(indexDir).filter((n) => n.endsWith(".json") && n !== "manifest.json");
const byUrl = new Map();
for (const shard of shardFiles) {
  const data = JSON.parse(fs.readFileSync(path.join(indexDir, shard), "utf8"));
  for (const entry of data) byUrl.set(entry.url, { shard, entry });
}

let updated = 0;
const dirty = new Map();
for (const page of pages) {
  const hit = byUrl.get(page);
  if (!hit) {
    console.log("missing from index:", page);
    continue;
  }
  const next = relatedFromHtml(page);
  const prev = hit.entry.related || [];
  if (JSON.stringify(prev) === JSON.stringify(next)) continue;
  hit.entry.related = next;
  dirty.set(hit.shard, true);
  updated += 1;
  console.log(page, "\n  was:", prev.join(" | "), "\n  now:", next.join(" | "));
}

for (const shard of dirty.keys()) {
  const data = JSON.parse(fs.readFileSync(path.join(indexDir, shard), "utf8"));
  for (const entry of data) {
    const hit = byUrl.get(entry.url);
    if (hit) entry.related = hit.entry.related;
  }
  fs.writeFileSync(path.join(indexDir, shard), JSON.stringify(data));
}

console.log("updated entries:", updated, "shards:", dirty.size);
