import fs from "fs";
import path from "path";

const root = "C:/Users/RoshanSamarawickrema/Desktop/WMC-Master-Project/old-html";

function extract(rel, startMarker, endMarker) {
  const html = fs.readFileSync(path.join(root, rel), "utf8");
  const start = html.indexOf(startMarker);
  if (start < 0) return `MISSING ${startMarker}`;
  const end = html.indexOf(endMarker, start + startMarker.length);
  return html.slice(start, end > 0 ? Math.min(end, start + 2500) : start + 2500);
}

const checks = [
  ["doctors/dr-tanya-goodwill.html", 'id="areas-of-care"', 'id="professional-interests"'],
  ["doctors/dr-tanya-goodwill.html", 'id="professional-interests"', 'id="qualifications"'],
  ["doctors/dr-mary-abadir.html", 'id="areas-of-care"', 'id="professional-interests"'],
  ["doctors/dr-mary-abadir.html", 'id="professional-interests"', 'id="qualifications"'],
  ["knowledge/articles/back-pain-when-should-i-see-a-gp.html", 'id="related-practitioners"', "</section>"],
  ["knowledge/articles/planning-a-pregnancy.html", 'id="related-practitioners"', "</section>"],
  ["knowledge/articles/when-should-i-have-a-cervical-screening-test.html", 'id="related-practitioners"', "</section>"],
  ["new-patients.html", 'patient-related-links"', "</section>"],
  ["repeat-scripts.html", 'patient-related-links"', "</section>"],
  ["test-results.html", 'patient-related-links"', "</section>"],
  ["telehealth.html", 'patient-related-links"', "</section>"],
  ["services/pathology.html", 'patient-related-links"', "</section>"],
  ["services/pathology.html", 'id="related-care"', "</section>"],
  ["services/skin-cancer-care.html", "<main", '<div class="breadcrumb-bar">'],
  ["knowledge/womens-health.html", "<main", '<div class="breadcrumb-bar">'],
  ["knowledge/pregnancy.html", "<main", '<div class="breadcrumb-bar">'],
  ["services/womens-health.html", "<main", '<div class="breadcrumb-bar">'],
];

for (const [file, a, b] of checks) {
  console.log("\n====", file, a);
  console.log(extract(file, a, b));
}

// Tanya article links specifically
const tanya = fs.readFileSync(path.join(root, "doctors/dr-tanya-goodwill.html"), "utf8");
const hrefs = [...tanya.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
console.log(
  "\nTanya skin/weight hrefs:",
  hrefs.filter((h) => /skin-check|weight|healthy-lifestyle|why-skin/i.test(h)).join(" | ") || "(none)"
);
const abadir = fs.readFileSync(path.join(root, "doctors/dr-mary-abadir.html"), "utf8");
const ah = [...abadir.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
console.log(
  "\nAbadir pregnancy/cervical hrefs:",
  ah.filter((h) => /pregnan|cervical|antenatal|pre-pregnan/i.test(h)).join(" | ") || "(none)"
);

const back = fs.readFileSync(path.join(root, "knowledge/articles/back-pain-when-should-i-see-a-gp.html"), "utf8");
console.log(
  "\nBack pain doctor hrefs:",
  [...back.matchAll(/href="([^"]*doctors[^"]*)"/g)].map((m) => m[1]).join(" | ")
);
