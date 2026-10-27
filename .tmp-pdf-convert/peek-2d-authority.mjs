import fs from "fs";
import path from "path";

const root = "C:/Users/RoshanSamarawickrema/Desktop/WMC-Master-Project/old-html";

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

function resourceLinks(html) {
  return [...html.matchAll(/class="resource-link"[^>]*href="([^"]+)"/g)].map((m) => m[1]);
}

function allHrefs(html) {
  return [...html.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
}

function hasHref(html, needle) {
  return allHrefs(html).some((h) => h.includes(needle));
}

function sectionSnippet(html, idOrClass, len = 900) {
  const byId = html.indexOf(`id="${idOrClass}"`);
  const byClass = html.indexOf(`class="${idOrClass}"`);
  const at = byId >= 0 ? byId : byClass;
  if (at < 0) return null;
  return html
    .slice(at, at + len)
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const pairs = [
  ["new-patients.html", "patient-forms.html"],
  ["repeat-scripts.html", "new-patient-prescribing-policy.html"],
  ["test-results.html", "services/pathology.html"],
  ["telehealth.html", "knowledge/articles/when-can-i-use-telehealth.html"],
];

console.log("=== RECIPROCAL ===");
for (const [a, b] of pairs) {
  const ha = read(a);
  const hb = read(b);
  const aName = b.split("/").pop();
  const bName = a.split("/").pop();
  console.log(`\n${a} related:`, resourceLinks(ha).join(" | "));
  console.log(`  has ${aName}? related=${resourceLinks(ha).some((h) => h.includes(aName))} any=${hasHref(ha, aName)}`);
  console.log(`${b} related:`, resourceLinks(hb).join(" | "));
  console.log(`  has ${bName}? related=${resourceLinks(hb).some((h) => h.includes(bName))} any=${hasHref(hb, bName)}`);
}

const doctors = [
  "doctors/dr-mary-abadir.html",
  "doctors/dr-tanya-goodwill.html",
  "doctors/dr-steven-chang.html",
  "doctors/mr-samuel-stafford.html",
];

console.log("\n=== DOCTOR CARE LINKS ===");
for (const d of doctors) {
  const html = read(d);
  const care = [...html.matchAll(/href="([^"]+)"/g)]
    .map((m) => m[1])
    .filter((h) => /knowledge|services\//.test(h) && !/patient-information|team\.html|doctors\//.test(h));
  console.log("\n" + d);
  console.log("  knowledge/service hrefs:", [...new Set(care)].join(" | ") || "(none)");
  console.log("  areas:", sectionSnippet(html, "areas-of-care", 700));
  console.log("  interests:", sectionSnippet(html, "professional-interests", 700));
  console.log("  related care:", sectionSnippet(html, "related-care", 700));
}

const articles = [
  "knowledge/articles/planning-a-pregnancy.html",
  "knowledge/articles/first-pregnancy-gp-appointment.html",
  "knowledge/articles/what-happens-during-antenatal-care.html",
  "knowledge/articles/cervical-screening-guide.html",
  "knowledge/articles/when-should-i-book-a-skin-check.html",
  "knowledge/articles/why-skin-checks-matter-in-australia.html",
  "knowledge/articles/when-should-i-speak-to-a-gp-about-weight.html",
  "knowledge/articles/understanding-healthy-lifestyle-changes.html",
  "knowledge/articles/back-pain-when-should-i-see-a-gp.html",
  "knowledge/articles/understanding-neck-pain.html",
  "knowledge/articles/understanding-muscle-and-joint-pain.html",
  "services/pre-pregnancy-care.html",
  "services/pap-smear-cervical-screening.html",
  "services/antenatal-postnatal-care.html",
];

console.log("\n=== ARTICLE → PRACTITIONER ===");
for (const a of articles) {
  if (!fs.existsSync(path.join(root, a))) {
    console.log(a, "MISSING FILE");
    continue;
  }
  const html = read(a);
  const docs = allHrefs(html).filter((h) => /doctors\//.test(h));
  console.log(a, "->", docs.join(" | ") || "(no doctor links)");
  console.log("  related practitioners snippet:", sectionSnippet(html, "related-practitioners", 500) || sectionSnippet(html, "related-practitioner", 500));
}

const hubs = [
  ["services/womens-health.html", "knowledge/womens-health.html"],
  ["services/mens-health.html", "knowledge/mens-health.html"],
  ["services/childrens-health.html", "knowledge/childrens-health.html"],
  ["services/mental-health.html", "knowledge/mental-health.html"],
  ["services/antenatal-postnatal-care.html", "knowledge/pregnancy.html"],
  ["services/pre-pregnancy-care.html", "knowledge/pregnancy.html"],
  ["services/skin-cancer-care.html", "knowledge/skin-health-skin-cancer.html"],
  ["services/skin-checks.html", "knowledge/skin-health-skin-cancer.html"],
];

console.log("\n=== HUB WAYFINDING ===");
for (const [svc, know] of hubs) {
  const exists = (f) => fs.existsSync(path.join(root, f));
  console.log(`\n${svc} exists=${exists(svc)} way=${exists(svc) && read(svc).includes("topic-wayfinding")}`);
  if (exists(svc)) console.log("  svc related:", resourceLinks(read(svc)).join(" | "));
  console.log(`${know} exists=${exists(know)} way=${exists(know) && read(know).includes("topic-wayfinding")}`);
  if (exists(know)) console.log("  know related:", resourceLinks(read(know)).join(" | "));
}

console.log("\n=== KNOWLEDGE HUB FILES ===");
for (const f of fs.readdirSync(path.join(root, "knowledge")).filter((n) => n.endsWith(".html"))) {
  console.log(f);
}
