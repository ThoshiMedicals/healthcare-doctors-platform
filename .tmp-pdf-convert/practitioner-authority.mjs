import fs from "fs";
import path from "path";

const root = "C:/Users/RoshanSamarawickrema/Desktop/WMC-Master-Project/apps/web/public/search-index";
const manifest = JSON.parse(fs.readFileSync(path.join(root, "manifest.json"), "utf8"));
const byUrl = new Map();
for (const name of manifest.shards) {
  for (const row of JSON.parse(fs.readFileSync(path.join(root, name + ".json"), "utf8"))) byUrl.set(row.url, row);
}

const doctors = [...byUrl.values()].filter(r => r.category === "Doctor" || (r.url || "").startsWith("doctors/"));
doctors.sort((a, b) => a.title.localeCompare(b.title));

const htmlRoot = "C:/Users/RoshanSamarawickrema/Desktop/WMC-Master-Project/old-html";

function interests(html) {
  const areas = [];
  const m = html.match(/id="areas-of-care"[\s\S]*?<ul class="service-care-list">([\s\S]*?)<\/ul>/);
  if (m) {
    const re = /<a[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>/g;
    let x;
    while ((x = re.exec(m[1]))) areas.push({ href: x[1].replace(/^\.\.\//, ""), label: x[2].replace(/&amp;/g, "&") });
  }
  const prof = [];
  const p = html.match(/id="professional-interests"[\s\S]*?<ul class="service-care-list">([\s\S]*?)<\/ul>/);
  if (p) {
    const re = /<a[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>/g;
    let x;
    while ((x = re.exec(p[1]))) prof.push({ href: x[1].replace(/^\.\.\//, ""), label: x[2].replace(/&amp;/g, "&") });
  }
  const books = [];
  const br = /href="(https:\/\/www\.hotdoc\.com\.au[^"]+|tel:\+61732173344)"/g;
  let b;
  const seen = new Set();
  while ((b = br.exec(html))) {
    if (!seen.has(b[1])) { seen.add(b[1]); books.push(b[1]); }
  }
  return { areas, prof, books };
}

const out = [];
for (const doc of doctors) {
  const file = path.join(htmlRoot, doc.url);
  const html = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
  const local = html ? interests(html) : { areas: [], prof: [], books: [] };
  const related = (doc.related || []).map(url => {
    const t = byUrl.get(url);
    return { url, title: t ? t.title : "MISSING", category: t ? t.category : "MISSING" };
  });
  const inbound = [];
  for (const row of byUrl.values()) {
    if ((row.related || []).includes(doc.url)) inbound.push({ url: row.url, title: row.title, category: row.category });
  }
  out.push({
    title: doc.title,
    url: doc.url,
    h1: doc.h1,
    description: doc.description,
    headings: doc.headings,
    areas: local.areas,
    professional: local.prof,
    bookingHrefs: local.books,
    related,
    inboundCount: inbound.length,
    inboundServices: inbound.filter(i => i.category === "Service").map(i => i.title),
    inboundKnowledge: inbound.filter(i => i.category === "Knowledge Centre").map(i => i.title),
    inboundPatient: inbound.filter(i => i.category === "Patient Information").map(i => i.title),
  });
}
fs.writeFileSync("C:/Users/RoshanSamarawickrema/Desktop/WMC-Master-Project/.tmp-pdf-convert/practitioner-authority.json", JSON.stringify(out, null, 2));
console.log("profiles", out.length);
for (const p of out) {
  const svc = p.related.filter(r => r.category === "Service");
  const know = p.related.filter(r => r.category === "Knowledge Centre");
  const pat = p.related.filter(r => r.category === "Patient Information");
  console.log("\n## " + p.title);
  console.log(" areas:", p.areas.map(a => a.label + " -> " + a.href).join(" | ") || "-");
  console.log(" interests:", p.professional.map(a => a.label).join(" | ") || "-");
  console.log(" services out:", svc.map(s => s.title).join(" | ") || "-");
  console.log(" knowledge out:", know.map(s => s.title).join(" | ") || "-");
  console.log(" patient out:", pat.map(s => s.title).join(" | ") || "-");
  console.log(" other out:", p.related.filter(r => !["Service","Knowledge Centre","Patient Information"].includes(r.category)).map(s => s.category + ":" + s.title).join(" | ") || "-");
  console.log(" inbound S", p.inboundServices.length, "K", p.inboundKnowledge.length, "P", p.inboundPatient.length, "total", p.inboundCount);
  console.log(" books:", p.bookingHrefs.length);
}
