import fs from "fs";
const patho = fs.readFileSync("old-html/services/pathology.html", "utf8");
const more = patho.indexOf('id="more-information"');
const guides = patho.indexOf('id="patient-guides"');
console.log("MORE", patho.slice(more, more + 1200));
console.log("\nGUIDES", patho.slice(guides, guides + 900));

const art = fs.readFileSync("old-html/knowledge/articles/when-can-i-use-telehealth.html", "utf8");
const rel = art.indexOf('patient-related-links');
const rel2 = art.indexOf('id="related-services"');
const rel3 = art.indexOf('class="resource-links"');
console.log("\nTELE ARTICLE related idx", rel, rel2);
// find all resource-link blocks near end
const blocks = [...art.matchAll(/<section class="article-section[^"]*"[^>]*>([\s\S]*?)<\/section>/g)]
  .map((m) => m[0].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").slice(0, 220));
console.log(blocks.slice(-6).join("\n---\n"));

const tanya = fs.readFileSync("old-html/doctors/dr-tanya-goodwill.html", "utf8");
const pg = tanya.indexOf('id="patient-guides"');
const pgEnd = tanya.indexOf("</section>", pg);
const links = [...tanya.slice(pg, pgEnd).matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
console.log("\nTanya all patient-guide hrefs:\n", links.join("\n"));
