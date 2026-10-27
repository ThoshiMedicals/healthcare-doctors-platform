import fs from "fs";
import path from "path";

const root = "C:/Users/RoshanSamarawickrema/Desktop/WMC-Master-Project/old-html";
const jobs = [
  ["doctors/dr-mary-abadir.html", "Understanding Menopause"],
  ["doctors/dr-tanya-goodwill.html", "Skin Checks"],
  ["services/pre-pregnancy-care.html", "related-practitioner"],
  ["services/pap-smear-cervical-screening.html", "related-practitioner"],
  ["services/pathology.html", "resource-links"],
  ["test-results.html", "Related information"],
  ["new-patients.html", "Related information"],
  ["repeat-scripts.html", "Related information"],
  ["knowledge/articles/back-pain-when-should-i-see-a-gp.html", "related-practitioner"],
  ["knowledge/articles/planning-a-pregnancy.html", "related-practitioner"],
  ["knowledge/articles/when-should-i-book-a-skin-check.html", "related-practitioner"],
  ["knowledge/articles/healthy-weight-management.html", "related-practitioner"],
  ["services/womens-health.html", "breadcrumb-bar"],
  ["services/skin-cancer-care.html", "breadcrumb-bar"],
  ["services/antenatal-postnatal-care.html", "breadcrumb-bar"],
  ["services/mental-health.html", "breadcrumb-bar"],
];

for (const [file, needle] of jobs) {
  const html = fs.readFileSync(path.join(root, file), "utf8");
  const at = html.indexOf(needle);
  console.log("\n==== " + file + " @" + at);
  if (at < 0) continue;
  console.log(html.slice(Math.max(0, at - 180), at + 420).replace(/\n/g, " "));
}
