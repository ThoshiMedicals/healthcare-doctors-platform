import fs from "fs";
import path from "path";
const dir = "C:/Users/RoshanSamarawickrema/Desktop/WMC-Master-Project/old-html/services";
const targets = [
  ["women hub", "knowledge/womens-health.html"],
  ["men hub", "knowledge/mens-health.html"],
  ["child hub", "knowledge/childrens-health.html"],
  ["mental hub", "knowledge/mental-health.html"],
  ["skin hub", "knowledge/skin-health-skin-cancer.html"],
  ["tele hub", "knowledge/telehealth-access-to-care.html"],
  ["vax hub", "knowledge/vaccinations.html"],
  ["diabetes hub", "knowledge/diabetes.html"],
  ["chronic hub", "knowledge/chronic-disease-management.html"],
  ["pregnancy hub", "knowledge/pregnancy.html"],
  ["patient telehealth", "../telehealth.html"],
  ["test results", "../test-results.html"],
  ["scripts", "../repeat-scripts.html"],
  ["referrals", "../referrals.html"],
  ["new patients", "../new-patients.html"],
  ["fees", "../fees-billing.html"],
  ["book page", "../book-appointment.html"],
];
function article(html) {
  const start = html.indexOf('class="article');
  const end = html.indexOf("<footer");
  let body = html.slice(start < 0 ? 0 : start, end < 0 ? html.length : end);
  body = body.replace(/<aside[\s\S]*?<\/aside>/gi, " ");
  body = body.replace(/<nav[\s\S]*?<\/nav>/gi, " ");
  return body;
}
for (const file of fs.readdirSync(dir).filter(f => f.endsWith(".html"))) {
  const html = fs.readFileSync(path.join(dir, file), "utf8");
  const body = article(html);
  const hits = targets.filter(([, href]) => body.includes(href)).map(([name]) => name);
  const way = html.includes("topic-wayfinding") ? "wayfinding" : "";
  if (hits.length || way) console.log(file, way, hits.join(", ") || "-");
  else console.log(file, "no curated patient or hub links in the article");
}
