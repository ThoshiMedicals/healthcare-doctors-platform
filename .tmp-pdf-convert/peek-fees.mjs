import fs from "fs";
import path from "path";
const root = "C:/Users/RoshanSamarawickrema/Desktop/WMC-Master-Project/old-html";
for (const file of ["services/pathology.html", "services/pre-pregnancy-care.html", "services/pap-smear-cervical-screening.html", "services/allied-health.html"]) {
  const html = fs.readFileSync(path.join(root, file), "utf8");
  const ids = [...html.matchAll(/id="([^"]+)"/g)].map(m => m[1]);
  console.log("\n##", file);
  console.log(ids.filter(id => /related|practical|guide|team|faq|more/.test(id)).join(", "));
  const at = html.indexOf("fees-billing.html");
  console.log(html.slice(Math.max(0, at - 250), at + 280).replace(/\n/g, " "));
}
