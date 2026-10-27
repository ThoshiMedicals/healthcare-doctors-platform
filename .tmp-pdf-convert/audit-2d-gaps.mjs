import fs from "fs";
import path from "path";

const root = "C:/Users/RoshanSamarawickrema/Desktop/WMC-Master-Project/old-html";
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");
const has = (html, needle) => html.includes(needle);
const gaps = [];

function check(file, needle, label) {
  const html = read(file);
  if (!has(html, needle)) gaps.push({ file, label, needle });
}

// Reciprocals
check("new-patients.html", 'href="patient-forms.html"', "New Patients → Patient Forms");
check("patient-forms.html", 'href="new-patients.html"', "Patient Forms → New Patients");
check("repeat-scripts.html", 'href="new-patient-prescribing-policy.html"', "Repeat Scripts → New Patient Prescribing");
check("new-patient-prescribing-policy.html", 'href="repeat-scripts.html"', "New Patient Prescribing → Repeat Scripts");
check("test-results.html", 'href="services/pathology.html"', "Test Results → Pathology");
check("services/pathology.html", 'href="../test-results.html"', "Pathology → Test Results");
check("telehealth.html", 'href="knowledge/articles/when-can-i-use-telehealth.html"', "Telehealth → When Can I Use Telehealth");
check("knowledge/articles/when-can-i-use-telehealth.html", 'href="../../telehealth.html"', "When Can I Use Telehealth → Telehealth");

// Abadir
for (const [href, label] of [
  ["../knowledge/articles/planning-a-pregnancy.html", "planning"],
  ["../knowledge/articles/what-happens-during-antenatal-care.html", "antenatal"],
  ["../knowledge/articles/your-first-pregnancy-gp-appointment.html", "first pregnancy"],
  ["../knowledge/pregnancy.html", "pregnancy hub"],
  ["../services/pre-pregnancy-care.html", "pre-pregnancy"],
  ["../knowledge/articles/when-should-i-have-a-cervical-screening-test.html", "cervical"],
]) {
  check("doctors/dr-mary-abadir.html", `href="${href}"`, `Abadir → ${label}`);
}

// Goodwill
for (const [href, label] of [
  ["../knowledge/articles/when-should-i-book-a-skin-check.html", "skin book"],
  ["../knowledge/articles/why-skin-checks-matter-in-australia.html", "skin why"],
  ["../knowledge/articles/understanding-skin-cancer-risks.html", "skin risks"],
  ["../knowledge/articles/when-should-i-speak-to-a-gp-about-weight.html", "weight gp"],
  ["../knowledge/articles/healthy-weight-management.html", "weight mgmt"],
  ["../knowledge/weight.html", "weight hub"],
]) {
  check("doctors/dr-tanya-goodwill.html", `href="${href}"`, `Goodwill → ${label}`);
}

// Back pain ← Chang / Stafford
for (const file of [
  "knowledge/articles/back-pain-when-should-i-see-a-gp.html",
  "knowledge/articles/understanding-neck-pain.html",
  "knowledge/articles/understanding-muscle-and-joint-pain.html",
]) {
  check(file, 'href="../../doctors/dr-steven-chang.html"', `${file} ← Chang`);
  check(file, 'href="../../doctors/mr-samuel-stafford.html"', `${file} ← Stafford`);
}

// Hub wayfinding
const hubs = [
  ["knowledge/womens-health.html", "../services/womens-health.html"],
  ["services/womens-health.html", "../knowledge/womens-health.html"],
  ["knowledge/mens-health.html", "../services/mens-health.html"],
  ["services/mens-health.html", "../knowledge/mens-health.html"],
  ["knowledge/childrens-health.html", "../services/childrens-health.html"],
  ["services/childrens-health.html", "../knowledge/childrens-health.html"],
  ["knowledge/mental-health.html", "../services/mental-health.html"],
  ["services/mental-health.html", "../knowledge/mental-health.html"],
  ["knowledge/pregnancy.html", "../services/antenatal-postnatal-care.html"],
  ["services/antenatal-postnatal-care.html", "../knowledge/pregnancy.html"],
  ["services/pre-pregnancy-care.html", "../knowledge/pregnancy.html"],
  ["services/skin-cancer-care.html", "../knowledge/skin-health-skin-cancer.html"],
  ["knowledge/skin-health-skin-cancer.html", "../services/skin-cancer-care.html"],
];
for (const [file, href] of hubs) {
  const html = read(file);
  const hasWay = html.includes('class="topic-wayfinding"');
  const hasHref = html.includes(`href="${href}"`);
  if (!hasWay || !hasHref) gaps.push({ file, label: `hub wayfinding ${href}`, needle: hasWay ? href : "topic-wayfinding" });
}

console.log(gaps.length ? "GAPS " + gaps.length : "NO_GAPS");
for (const g of gaps) console.log("-", g.file, "::", g.label);
