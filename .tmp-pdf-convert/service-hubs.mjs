import fs from "fs";
import path from "path";
const dir = "C:/Users/RoshanSamarawickrema/Desktop/WMC-Master-Project/old-html/services";
const hubs = [
  "knowledge/womens-health.html",
  "knowledge/mens-health.html",
  "knowledge/childrens-health.html",
  "knowledge/mental-health.html",
  "knowledge/skin-health-skin-cancer.html",
  "knowledge/telehealth-access-to-care.html",
  "knowledge/vaccinations.html",
  "knowledge/diabetes.html",
  "knowledge/chronic-disease-management.html",
  "knowledge/pregnancy.html",
  "telehealth.html",
  "test-results.html",
  "repeat-scripts.html",
  "referrals.html",
  "new-patients.html",
  "fees-billing.html",
  "book-appointment.html",
];
for (const file of fs.readdirSync(dir).filter(f => f.endsWith(".html"))) {
  const html = fs.readFileSync(path.join(dir, file), "utf8");
  const found = hubs.filter(h => html.includes(h));
  const way = html.includes("topic-wayfinding");
  const clinic = (html.match(/doctors\?wp=w_lightbox/g) || []).length;
  const named = (html.match(/\/doctors\/[a-z0-9-]+\?wp=w_lightbox/g) || []).length;
  console.log(file, "way=" + way, "clinic=" + clinic, "named=" + named, "hubs=" + (found.join(", ") || "-"));
}
