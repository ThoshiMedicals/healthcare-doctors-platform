import fs from "fs";
import path from "path";

const indexDir = "C:/Users/RoshanSamarawickrema/Desktop/WMC-Master-Project/apps/web/public/search-index";

const additions = {
  "new-patients.html": ["patient-forms.html"],
  "repeat-scripts.html": ["new-patient-prescribing-policy.html"],
  "test-results.html": ["services/pathology.html"],
  "services/pathology.html": ["test-results.html"],
  "telehealth.html": ["knowledge/articles/when-can-i-use-telehealth.html"],
  "knowledge/articles/when-can-i-use-telehealth.html": ["telehealth.html"],
  "doctors/dr-mary-abadir.html": [
    "knowledge/articles/planning-a-pregnancy.html",
    "knowledge/articles/what-happens-during-antenatal-care.html",
    "knowledge/articles/your-first-pregnancy-gp-appointment.html",
    "knowledge/pregnancy.html",
    "services/pre-pregnancy-care.html",
    "knowledge/articles/when-should-i-have-a-cervical-screening-test.html",
  ],
  "doctors/dr-tanya-goodwill.html": [
    "knowledge/articles/when-should-i-book-a-skin-check.html",
    "knowledge/articles/why-skin-checks-matter-in-australia.html",
    "knowledge/articles/understanding-skin-cancer-risks.html",
    "knowledge/articles/when-should-i-speak-to-a-gp-about-weight.html",
    "knowledge/articles/healthy-weight-management.html",
    "knowledge/articles/understanding-healthy-lifestyle-changes.html",
    "knowledge/weight.html",
  ],
  "knowledge/articles/planning-a-pregnancy.html": ["doctors/dr-mary-abadir.html"],
  "knowledge/articles/what-happens-during-antenatal-care.html": ["doctors/dr-mary-abadir.html"],
  "knowledge/articles/your-first-pregnancy-gp-appointment.html": ["doctors/dr-mary-abadir.html"],
  "knowledge/articles/back-pain-when-should-i-see-a-gp.html": [
    "doctors/dr-steven-chang.html",
    "doctors/mr-samuel-stafford.html",
  ],
  "knowledge/articles/understanding-neck-pain.html": [
    "doctors/dr-steven-chang.html",
    "doctors/mr-samuel-stafford.html",
  ],
  "knowledge/articles/understanding-muscle-and-joint-pain.html": [
    "doctors/dr-steven-chang.html",
    "doctors/mr-samuel-stafford.html",
  ],
  "knowledge/womens-health.html": ["services/womens-health.html"],
  "knowledge/mens-health.html": ["services/mens-health.html"],
  "knowledge/childrens-health.html": ["services/childrens-health.html"],
  "knowledge/mental-health.html": ["services/mental-health.html"],
  "knowledge/pregnancy.html": ["services/antenatal-postnatal-care.html", "services/pre-pregnancy-care.html"],
  "knowledge/skin-health-skin-cancer.html": ["services/skin-cancer-care.html"],
  "services/womens-health.html": ["knowledge/womens-health.html"],
  "services/mens-health.html": ["knowledge/mens-health.html"],
  "services/childrens-health.html": ["knowledge/childrens-health.html"],
  "services/mental-health.html": ["knowledge/mental-health.html"],
  "services/antenatal-postnatal-care.html": ["knowledge/pregnancy.html"],
  "services/pre-pregnancy-care.html": ["knowledge/pregnancy.html"],
  "services/skin-cancer-care.html": ["knowledge/skin-health-skin-cancer.html"],
};

const shardFiles = fs.readdirSync(indexDir).filter((n) => n.endsWith(".json") && n !== "manifest.json");
const byUrl = new Map();
for (const shard of shardFiles) {
  const data = JSON.parse(fs.readFileSync(path.join(indexDir, shard), "utf8"));
  for (const entry of data) byUrl.set(entry.url, { shard, entry });
}

const dirty = new Set();
let changed = 0;
for (const [url, urls] of Object.entries(additions)) {
  const hit = byUrl.get(url);
  if (!hit) {
    console.log("missing", url);
    continue;
  }
  const related = [...(hit.entry.related || [])];
  const added = [];
  for (const add of urls) {
    if (related.includes(add)) continue;
    related.push(add);
    added.push(add);
  }
  if (!added.length) continue;
  hit.entry.related = related;
  dirty.add(hit.shard);
  changed += 1;
  console.log("patched", url, "+", added.join(", "));
}

for (const shard of dirty) {
  const data = JSON.parse(fs.readFileSync(path.join(indexDir, shard), "utf8"));
  for (const entry of data) {
    const hit = byUrl.get(entry.url);
    if (hit) entry.related = hit.entry.related;
  }
  fs.writeFileSync(path.join(indexDir, shard), JSON.stringify(data));
}
console.log("entries changed:", changed, "shards:", dirty.size);
