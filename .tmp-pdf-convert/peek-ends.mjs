import fs from "fs";
import path from "path";
const root = "C:/Users/RoshanSamarawickrema/Desktop/WMC-Master-Project/old-html";

function show(file, needle, before = 200, after = 700) {
  const html = fs.readFileSync(path.join(root, file), "utf8");
  const at = html.indexOf(needle);
  console.log("\n==== " + file + " " + needle + " @" + at);
  if (at < 0) return;
  console.log(html.slice(at, at + after));
}

show("services/pathology.html", 'id="related-services"');
show("services/pre-pregnancy-care.html", 'id="related-services"');
show("services/pap-smear-cervical-screening.html", 'id="related-services"');
show("knowledge/pregnancy.html", "practitioner-knowledge-link");
show("knowledge/articles/understanding-neck-pain.html", 'id="related-practitioners"');
show("doctors/dr-tanya-goodwill.html", 'id="patient-guides"');
show("services/skin-checks.html", 'class="topic-wayfinding"');
