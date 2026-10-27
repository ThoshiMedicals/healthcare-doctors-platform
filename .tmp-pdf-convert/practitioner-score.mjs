import fs from "fs";
const data = JSON.parse(fs.readFileSync("C:/Users/RoshanSamarawickrema/Desktop/WMC-Master-Project/.tmp-pdf-convert/practitioner-authority.json", "utf8"));
for (const p of data) {
  const know = p.related.filter(r => r.category === "Knowledge Centre" && !r.url.endsWith("/index.html") && r.url !== "knowledge/index.html");
  const hubs = p.related.filter(r => r.category === "Knowledge Centre" && (r.url.endsWith("/index.html") || !r.url.includes("/articles/") && r.category === "Knowledge Centre"));
  const articles = p.related.filter(r => r.url.includes("/articles/"));
  const topicHubs = p.related.filter(r => r.category === "Knowledge Centre" && !r.url.includes("/articles/") && r.url !== "knowledge/index.html");
  console.log("\n" + p.title);
  console.log(" books:");
  for (const b of p.bookingHrefs) console.log("  " + b.replace("https://www.hotdoc.com.au/medical-centres/woolloongabba-QLD-4102/t-medicals-woolloongabba-medical-centre/", ""));
  console.log(" prof hrefs:", p.professional.map(a => a.label + " -> " + a.href).join(" | ") || "-");
  console.log(" articles", articles.length, "topic hubs", topicHubs.map(t => t.title).join(", ") || "-", "index", p.related.some(r => r.url === "knowledge/index.html"));
  console.log(" patient:", p.related.filter(r => r.category === "Patient Information").map(r => r.title).join(", "));
  console.log(" services:", p.related.filter(r => r.category === "Service").map(r => r.title).join(", "));
}
