import fs from "fs";
import path from "path";

const root = "old-html/services";
const pages = [
  "chronic-disease-care.html",
  "mental-health.html",
  "skin-checks.html",
  "womens-health.html",
  "antenatal-postnatal-care.html",
  "allied-health.html",
];

for (const page of pages) {
  const html = fs.readFileSync(path.join(root, page), "utf8");
  const book = html.indexOf('id="book"');
  const pract = html.indexOf("related-practitioners");
  console.log("\n====", page);
  console.log("BOOK", book >= 0 ? html.slice(book, book + 700).replace(/\s+/g, " ") : "none");
  console.log(
    "PRACT",
    pract >= 0 ? html.slice(pract, pract + 900).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").slice(0, 500) : "none"
  );
}

// HotDoc URLs from digital-reception PRACTITIONERS
const js = fs.readFileSync("old-html/digital-reception.js", "utf8");
for (const id of ["wasantha", "sumita", "anand", "mary", "steven", "samuel"]) {
  const re = new RegExp(`id:'${id}'[\\s\\S]*?bookingUrl:'([^']+)'`);
  const m = js.match(re);
  console.log(id, m ? m[1] : "missing");
}
