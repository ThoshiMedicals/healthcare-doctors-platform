import fs from "fs";
import path from "path";

const indexRoot = "C:/Users/RoshanSamarawickrema/Desktop/WMC-Master-Project/apps/web/public/search-index";
const htmlRoot = "C:/Users/RoshanSamarawickrema/Desktop/WMC-Master-Project/old-html";
const manifest = JSON.parse(fs.readFileSync(path.join(indexRoot, "manifest.json"), "utf8"));
const byUrl = new Map();
for (const name of manifest.shards) {
  for (const row of JSON.parse(fs.readFileSync(path.join(indexRoot, name + ".json"), "utf8"))) byUrl.set(row.url, row);
}

const services = [...byUrl.values()].filter(r => r.url.startsWith("services/") && r.url !== "services.html");
services.sort((a, b) => a.title.localeCompare(b.title));

function bodySignals(url) {
  const file = path.join(htmlRoot, url);
  if (!fs.existsSync(file)) return { exists: false, books: [], hotdocKind: "missing" };
  const html = fs.readFileSync(file, "utf8");
  const hrefs = [...html.matchAll(/href="(https:\/\/www\.hotdoc\.com\.au[^"]+|tel:\+61732173344)"/g)].map(m => m[1]);
  const unique = [...new Set(hrefs)];
  const named = unique.filter(h => /\/doctors\/[^?]+/.test(h) && !/\/doctors\/?\?/.test(h) && !/\/doctors\?/.test(h));
  const clinic = unique.filter(h => /\/doctors\?/.test(h) || /\/doctors\/?\?wp=/.test(h));
  const phone = unique.filter(h => h.startsWith("tel:"));
  let kind = "none";
  if (named.length && clinic.length) kind = "named-and-clinic";
  else if (named.length) kind = "named";
  else if (clinic.length) kind = "clinic";
  else if (phone.length) kind = "phone";
  return { exists: true, books: unique.map(h => h.replace("https://www.hotdoc.com.au/medical-centres/woolloongabba-QLD-4102/t-medicals-woolloongabba-medical-centre/", "")), kind, named: named.length, clinic: clinic.length, phone: phone.length };
}

const out = [];
for (const svc of services) {
  const related = svc.related || [];
  const grouped = { doctors: [], knowledge: [], patient: [], services: [], other: [] };
  for (const url of related) {
    const t = byUrl.get(url);
    const item = { url, title: t ? t.title : "MISSING", category: t ? t.category : "MISSING" };
    if (item.category === "Doctor") grouped.doctors.push(item);
    else if (item.category === "Knowledge Centre") grouped.knowledge.push(item);
    else if (item.category === "Patient Information") grouped.patient.push(item);
    else if (item.category === "Service") grouped.services.push(item);
    else grouped.other.push(item);
  }
  const inbound = { doctors: [], knowledge: [], patient: [], services: [], other: [] };
  for (const row of byUrl.values()) {
    if (!(row.related || []).includes(svc.url)) continue;
    const item = { url: row.url, title: row.title, category: row.category };
    if (row.category === "Doctor") inbound.doctors.push(item);
    else if (row.category === "Knowledge Centre") inbound.knowledge.push(item);
    else if (row.category === "Patient Information") inbound.patient.push(item);
    else if (row.category === "Service") inbound.services.push(item);
    else inbound.other.push(item);
  }
  const book = bodySignals(svc.url);
  out.push({
    title: svc.title,
    url: svc.url,
    out: {
      doctors: grouped.doctors.map(d => d.title),
      articles: grouped.knowledge.filter(k => k.url.includes("/articles/")).map(k => k.title),
      hubs: grouped.knowledge.filter(k => !k.url.includes("/articles/")).map(k => k.title),
      patient: grouped.patient.map(p => p.title),
      services: grouped.services.map(s => s.title),
      other: grouped.other.map(o => o.category + ": " + o.title),
    },
    inbound: {
      doctors: inbound.doctors.map(d => d.title),
      knowledge: inbound.knowledge.length,
      patient: inbound.patient.map(p => p.title),
      services: inbound.services.map(s => s.title),
    },
    book,
  });
}

fs.writeFileSync("C:/Users/RoshanSamarawickrema/Desktop/WMC-Master-Project/.tmp-pdf-convert/service-authority.json", JSON.stringify(out, null, 2));
console.log("services", out.length);
for (const s of out) {
  console.log("\n## " + s.title + " | " + s.url + " | book=" + s.book.kind);
  console.log(" doctors:", s.out.doctors.join(", ") || "-");
  console.log(" hubs:", s.out.hubs.join(", ") || "-");
  console.log(" articles:", s.out.articles.length, s.out.articles.slice(0, 8).join(" | "));
  console.log(" patient:", s.out.patient.join(", ") || "-");
  console.log(" sibling services:", s.out.services.join(", ") || "-");
  console.log(" inbound doctors:", s.inbound.doctors.join(", ") || "-", "| K", s.inbound.knowledge, "| P", s.inbound.patient.join(", ") || "-", "| S", s.inbound.services.join(", ") || "-");
}
