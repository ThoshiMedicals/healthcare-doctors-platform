import fs from "fs";
import path from "path";
const root = "C:/Users/RoshanSamarawickrema/Desktop/WMC-Master-Project/apps/web/public/search-index";
const manifest = JSON.parse(fs.readFileSync(path.join(root, "manifest.json"), "utf8"));
const byUrl = new Map();
for (const name of manifest.shards) {
  for (const row of JSON.parse(fs.readFileSync(path.join(root, name + ".json"), "utf8"))) byUrl.set(row.url, row);
}
const urls = [
  "knowledge/articles/when-can-i-use-telehealth.html",
  "knowledge/diabetes.html",
  "knowledge/articles/living-with-diabetes.html",
  "knowledge/articles/diabetes-care-plans-explained.html",
  "knowledge/articles/diabetes-monitoring-explained.html",
  "services/chronic-disease-care.html",
  "knowledge/chronic-disease-management.html",
  "services/vaccinations.html",
  "knowledge/vaccinations.html",
  "knowledge/articles/vaccinations-for-adults.html",
  "knowledge/articles/childhood-vaccinations-explained.html",
  "knowledge/articles/influenza-vaccination-who-should-consider-it.html",
  "services/mental-health.html",
  "knowledge/mental-health.html",
  "knowledge/womens-health.html",
];
for (const url of urls) {
  const row = byUrl.get(url);
  if (!row) { console.log("MISSING", url); continue; }
  const services = (row.related || []).filter(u => u.startsWith("services/"));
  const doctors = (row.related || []).filter(u => u.startsWith("doctors/"));
  const info = (row.related || []).filter(u => !u.startsWith("services/") && !u.startsWith("doctors/") && !u.startsWith("knowledge/"));
  console.log("\n" + row.title);
  console.log(" services:", services.join(", ") || "-");
  console.log(" doctors:", doctors.join(", ") || "-");
  console.log(" other:", info.join(", ") || "-");
}
