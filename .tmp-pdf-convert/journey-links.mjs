import fs from "fs";
import path from "path";

const root = "C:/Users/RoshanSamarawickrema/Desktop/WMC-Master-Project/apps/web/public/search-index";
const manifest = JSON.parse(fs.readFileSync(path.join(root, "manifest.json"), "utf8"));
const byUrl = new Map();
for (const name of manifest.shards) {
  const rows = JSON.parse(fs.readFileSync(path.join(root, name + ".json"), "utf8"));
  for (const row of rows) byUrl.set(row.url, row);
}

const urls = [
  "new-patients.html",
  "new-patient-prescribing-policy.html",
  "patient-forms.html",
  "repeat-scripts.html",
  "referrals.html",
  "test-results.html",
  "services/pathology.html",
  "services/skin-checks.html",
  "services/skin-cancer-care.html",
  "knowledge/skin-health-skin-cancer.html",
  "knowledge/articles/when-should-i-book-a-skin-check.html",
  "telehealth.html",
  "services/telehealth.html",
  "knowledge/telehealth-access-to-care.html",
  "knowledge/articles/when-can-i-use-telehealth.html",
  "knowledge/articles/how-telehealth-works.html",
  "knowledge/diabetes.html",
  "knowledge/articles/living-with-diabetes.html",
  "knowledge/articles/diabetes-care-plans-explained.html",
  "services/chronic-disease-care.html",
  "knowledge/chronic-disease-management.html",
  "services/vaccinations.html",
  "knowledge/vaccinations.html",
  "knowledge/articles/vaccinations-for-adults.html",
  "knowledge/articles/childhood-vaccinations-explained.html",
  "knowledge/articles/influenza-vaccination-who-should-consider-it.html",
  "services/mental-health.html",
  "knowledge/articles/what-happens-during-a-mental-health-care-plan.html",
  "knowledge/articles/when-should-i-speak-to-a-gp-about-anxiety.html",
  "services/womens-health.html",
  "knowledge/articles/womens-health-checks-at-different-stages-of-life.html",
  "knowledge/articles/when-should-i-have-a-cervical-screening-test.html",
  "services/pap-smear-cervical-screening.html",
  "book-appointment.html",
  "team-general-practitioners.html",
];

for (const url of urls) {
  const row = byUrl.get(url);
  if (!row) {
    console.log("\nMISSING", url);
    continue;
  }
  const related = row.related || [];
  console.log("\n==", row.title, "|", url, "|", row.category);
  console.log("related:");
  for (const rel of related) {
    const target = byUrl.get(rel);
    console.log("  -", rel, target ? `(${target.category}: ${target.title})` : "(NOT IN INDEX)");
  }
}
