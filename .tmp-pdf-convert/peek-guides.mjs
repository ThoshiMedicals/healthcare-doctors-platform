import fs from "fs";
import path from "path";
const root = "C:/Users/RoshanSamarawickrema/Desktop/WMC-Master-Project/old-html";
function section(file, id) {
  const html = fs.readFileSync(path.join(root, file), "utf8");
  const re = new RegExp(`<section[^>]*id="${id}"[\\s\\S]*?</section>`);
  const m = html.match(re);
  console.log("\n==== " + file + " #" + id);
  console.log(m ? m[0].slice(0, 1400) : "MISSING");
}
section("services/pathology.html", "patient-guides");
section("services/pre-pregnancy-care.html", "patient-guides");
section("services/pap-smear-cervical-screening.html", "patient-guides");
section("services/allied-health.html", "related-practitioners");
section("knowledge/articles/understanding-muscle-and-joint-pain.html", "related-practitioners");
