import fs from "fs";
import path from "path";

const root = "C:/Users/RoshanSamarawickrema/Desktop/WMC-Master-Project/old-html";

function chunk(rel, id, len = 2200) {
  const html = fs.readFileSync(path.join(root, rel), "utf8");
  const at = html.indexOf(`id="${id}"`);
  if (at < 0) return `MISSING ${id}`;
  return html.slice(at, at + len);
}

for (const [f, id] of [
  ["doctors/dr-mary-abadir.html", "patient-guides"],
  ["doctors/dr-tanya-goodwill.html", "patient-guides"],
  ["doctors/dr-steven-chang.html", "patient-guides"],
  ["doctors/mr-samuel-stafford.html", "patient-guides"],
  ["services/pathology.html", "related-patient-information"],
  ["services/pathology.html", "related-reading"],
  ["services/pathology.html", "practical-next-steps"],
]) {
  console.log("\n====", f, id);
  console.log(chunk(f, id, 1800));
}

const patho = fs.readFileSync(path.join(root, "services/pathology.html"), "utf8");
const ids = [...patho.matchAll(/id="([^"]+)"/g)].map((m) => m[1]);
console.log("\npathology ids:", ids.join(", "));
const resourceBlocks = [...patho.matchAll(/class="resource-links">([\s\S]*?)<\/div>/g)];
console.log("resource blocks:", resourceBlocks.length);
resourceBlocks.forEach((b, i) => console.log(i, b[0].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").slice(0, 300)));

// antenatal / pregnancy articles for Abadir
for (const a of [
  "knowledge/articles/what-happens-during-antenatal-care.html",
  "knowledge/articles/your-first-pregnancy-gp-appointment.html",
  "knowledge/articles/planning-a-pregnancy.html",
]) {
  const html = fs.readFileSync(path.join(root, a), "utf8");
  const docs = [...html.matchAll(/href="([^"]*doctors[^"]*)"/g)].map((m) => m[1]);
  console.log(a, docs.join(" | "));
}

// weight articles
const weightHub = fs.readFileSync(path.join(root, "knowledge/weight.html"), "utf8");
const weightArticles = [...weightHub.matchAll(/href="(articles\/[^"]+)"/g)].map((m) => m[1]);
console.log("\nweight hub articles:", weightArticles.join(" | "));
