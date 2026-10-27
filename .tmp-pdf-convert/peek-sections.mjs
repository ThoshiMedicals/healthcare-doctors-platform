import fs from "fs";
import path from "path";
const root = "C:/Users/RoshanSamarawickrema/Desktop/WMC-Master-Project/old-html";

function section(file, id) {
  const html = fs.readFileSync(path.join(root, file), "utf8");
  const re = new RegExp(`<section[^>]*id="${id}"[\\s\\S]*?</section>`);
  const m = html.match(re);
  console.log("\n==== " + file + " #" + id + " " + (m ? m[0].length : "MISSING"));
  if (m) console.log(m[0].slice(0, 1800));
}

section("knowledge/articles/back-pain-when-should-i-see-a-gp.html", "related-practitioners");
section("knowledge/articles/planning-a-pregnancy.html", "related-practitioners");
section("knowledge/articles/when-should-i-book-a-skin-check.html", "related-practitioners");
section("knowledge/articles/healthy-weight-management.html", "related-practitioners");
section("knowledge/articles/when-should-i-speak-to-a-gp-about-weight.html", "related-practitioners");
section("services/pre-pregnancy-care.html", "related-practitioners");
section("services/pap-smear-cervical-screening.html", "related-practitioners");
section("services/womens-health.html", "related-practitioners");
section("services/pathology.html", "practical-information");
section("knowledge/pregnancy.html", "related-practitioners");
