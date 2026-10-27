import fs from "fs";
import path from "path";

const root = "C:/Users/RoshanSamarawickrema/Desktop/WMC-Master-Project/old-html";
const indexDir = "C:/Users/RoshanSamarawickrema/Desktop/WMC-Master-Project/apps/web/public/search-index";
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");
const gaps = [];

const checkHtml = (file, needle, label) => {
  if (!read(file).includes(needle)) gaps.push(`HTML ${file}: ${label}`);
};

const checkWay = (file, href) => {
  const html = read(file);
  if (!html.includes('class="topic-wayfinding"') || !html.includes(`href="${href}"`)) {
    gaps.push(`WAY ${file}: ${href}`);
  }
};

// Reciprocals
checkHtml("new-patients.html", 'href="patient-forms.html"', "→ Patient Forms");
checkHtml("patient-forms.html", 'href="new-patients.html"', "→ New Patients");
checkHtml("repeat-scripts.html", 'href="new-patient-prescribing-policy.html"', "→ New Patient Prescribing");
checkHtml("new-patient-prescribing-policy.html", 'href="repeat-scripts.html"', "→ Repeat Scripts");
checkHtml("test-results.html", 'href="services/pathology.html"', "→ Pathology");
checkHtml("services/pathology.html", 'href="../test-results.html"', "→ Test Results");
checkHtml("telehealth.html", 'href="knowledge/articles/when-can-i-use-telehealth.html"', "→ When Can I Use Telehealth");
checkHtml("knowledge/articles/when-can-i-use-telehealth.html", 'href="../../telehealth.html"', "→ Telehealth Information");

// Practitioner content
for (const href of [
  "../knowledge/articles/planning-a-pregnancy.html",
  "../knowledge/articles/what-happens-during-antenatal-care.html",
  "../knowledge/articles/your-first-pregnancy-gp-appointment.html",
  "../knowledge/pregnancy.html",
  "../services/pre-pregnancy-care.html",
  "../knowledge/articles/when-should-i-have-a-cervical-screening-test.html",
]) checkHtml("doctors/dr-mary-abadir.html", `href="${href}"`, href);

for (const href of [
  "../knowledge/articles/when-should-i-book-a-skin-check.html",
  "../knowledge/articles/why-skin-checks-matter-in-australia.html",
  "../knowledge/articles/understanding-skin-cancer-risks.html",
  "../knowledge/articles/when-should-i-speak-to-a-gp-about-weight.html",
  "../knowledge/articles/healthy-weight-management.html",
  "../knowledge/weight.html",
]) checkHtml("doctors/dr-tanya-goodwill.html", `href="${href}"`, href);

for (const file of [
  "knowledge/articles/back-pain-when-should-i-see-a-gp.html",
  "knowledge/articles/understanding-neck-pain.html",
  "knowledge/articles/understanding-muscle-and-joint-pain.html",
]) {
  checkHtml(file, 'href="../../doctors/dr-steven-chang.html"', "← Chang");
  checkHtml(file, 'href="../../doctors/mr-samuel-stafford.html"', "← Stafford");
}

// Hubs
checkWay("knowledge/womens-health.html", "../services/womens-health.html");
checkWay("services/womens-health.html", "../knowledge/womens-health.html");
checkWay("knowledge/mens-health.html", "../services/mens-health.html");
checkWay("services/mens-health.html", "../knowledge/mens-health.html");
checkWay("knowledge/childrens-health.html", "../services/childrens-health.html");
checkWay("services/childrens-health.html", "../knowledge/childrens-health.html");
checkWay("knowledge/mental-health.html", "../services/mental-health.html");
checkWay("services/mental-health.html", "../knowledge/mental-health.html");
checkWay("knowledge/pregnancy.html", "../services/antenatal-postnatal-care.html");
checkWay("services/antenatal-postnatal-care.html", "../knowledge/pregnancy.html");
checkWay("services/pre-pregnancy-care.html", "../knowledge/pregnancy.html");
checkWay("services/skin-cancer-care.html", "../knowledge/skin-health-skin-cancer.html");
checkWay("knowledge/skin-health-skin-cancer.html", "../services/skin-cancer-care.html");

// Search index related
const by = new Map();
for (const f of fs.readdirSync(indexDir).filter((n) => n.endsWith(".json") && n !== "manifest.json")) {
  for (const e of JSON.parse(fs.readFileSync(path.join(indexDir, f), "utf8"))) by.set(e.url, e);
}
const indexNeed = {
  "new-patients.html": ["patient-forms.html"],
  "patient-forms.html": ["new-patients.html"],
  "repeat-scripts.html": ["new-patient-prescribing-policy.html"],
  "new-patient-prescribing-policy.html": ["repeat-scripts.html"],
  "test-results.html": ["services/pathology.html"],
  "services/pathology.html": ["test-results.html"],
  "telehealth.html": ["knowledge/articles/when-can-i-use-telehealth.html"],
  "knowledge/articles/when-can-i-use-telehealth.html": ["telehealth.html"],
  "doctors/dr-mary-abadir.html": [
    "knowledge/articles/planning-a-pregnancy.html",
    "knowledge/pregnancy.html",
    "services/pre-pregnancy-care.html",
    "knowledge/articles/when-should-i-have-a-cervical-screening-test.html",
  ],
  "doctors/dr-tanya-goodwill.html": [
    "knowledge/articles/when-should-i-book-a-skin-check.html",
    "knowledge/articles/healthy-weight-management.html",
    "knowledge/weight.html",
  ],
  "knowledge/articles/back-pain-when-should-i-see-a-gp.html": [
    "doctors/dr-steven-chang.html",
    "doctors/mr-samuel-stafford.html",
  ],
  "services/skin-cancer-care.html": ["knowledge/skin-health-skin-cancer.html"],
  "knowledge/womens-health.html": ["services/womens-health.html"],
  "services/womens-health.html": ["knowledge/womens-health.html"],
};
for (const [url, rels] of Object.entries(indexNeed)) {
  const e = by.get(url);
  if (!e) {
    gaps.push(`INDEX missing entry ${url}`);
    continue;
  }
  for (const r of rels) {
    if (!(e.related || []).includes(r)) gaps.push(`INDEX ${url} missing ${r}`);
  }
}

if (gaps.length) {
  console.error("VERIFY_2D_FAIL");
  for (const g of gaps) console.error("-", g);
  process.exit(1);
}
console.log("VERIFY_2D_OK");
