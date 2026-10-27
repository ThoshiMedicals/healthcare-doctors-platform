import fs from "fs";
const files = [
  "old-html/services/telehealth.html",
  "old-html/services/skin-checks.html",
  "old-html/services/vaccinations.html",
  "old-html/services/chronic-disease-care.html",
  "old-html/knowledge/diabetes.html",
];
for (const f of files) {
  const t = fs.readFileSync(f, "utf8");
  const start = t.indexOf("wmc-reciprocal-guides");
  const related = t.indexOf('id="related-care');
  const text = (chunk) => chunk.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").slice(0, 420);
  console.log("\n==== " + f);
  console.log(start >= 0 ? text(t.slice(start, start + 1200)) : "no reciprocal");
  console.log("RELATED", related >= 0 ? text(t.slice(related, related + 800)) : "none");
}
