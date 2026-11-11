/**
 * Add James / Yamesha / Golnar into public search-index doctors shard + manifest
 * so Digital Reception and peer discovery can resolve the published profiles.
 * Expertise/related services taken from live Hostinger profile service links (2026-11-11).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const webRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const doctorsPath = path.join(webRoot, "public", "search-index", "doctors.json");
const manifestPath = path.join(webRoot, "public", "search-index", "manifest.json");

const additions = [
  {
    title: "Dr James Chanaka",
    h1: "Dr James Chanaka",
    category: "Doctor",
    description:
      "Meet Dr James Chanaka at Woolloongabba Medical Centre. Explore family health, children’s health, mental health, telehealth and booking options.",
    headings: [
      "How Dr James Chanaka helps patients",
      "About Dr James Chanaka",
      "Related Services",
      "Frequently Asked Questions",
    ],
    keywords: [
      "doctor",
      "dr",
      "gp",
      "practitioner",
      "dr james chanaka",
      "book with Dr James Chanaka",
    ],
    related: [
      "services/family-health.html",
      "services/childrens-health.html",
      "services/mental-health.html",
      "services/preventive-healthcare.html",
      "services/telehealth.html",
      "team-general-practitioners.html",
      "knowledge/index.html",
      "new-patients.html",
      "practice-information.html",
      "faqs.html",
    ],
    text: "Dr James Chanaka General Practitioner Family health Children’s health Mental health Preventive healthcare Telehealth Book with Dr James Chanaka",
    url: "doctors/dr-james.html",
  },
  {
    title: "Dr Yamesha Ranatunga",
    h1: "Dr Yamesha Ranatunga",
    category: "Doctor",
    description:
      "Meet Dr Yamesha Ranatunga at Woolloongabba Medical Centre. Explore women’s health, chronic disease care, family health, telehealth and booking options.",
    headings: [
      "How Dr Yamesha Ranatunga helps patients",
      "About Dr Yamesha Ranatunga",
      "Related Services",
      "Frequently Asked Questions",
    ],
    keywords: [
      "doctor",
      "dr",
      "gp",
      "practitioner",
      "dr yamesha ranatunga",
      "book with Dr Yamesha Ranatunga",
    ],
    related: [
      "services/womens-health.html",
      "services/chronic-disease-care.html",
      "services/family-health.html",
      "services/preventive-healthcare.html",
      "services/telehealth.html",
      "team-general-practitioners.html",
      "knowledge/index.html",
      "new-patients.html",
      "practice-information.html",
      "faqs.html",
    ],
    text: "Dr Yamesha Ranatunga General Practitioner Women’s health Chronic disease care Family health Preventive healthcare Telehealth Book with Dr Yamesha Ranatunga",
    url: "doctors/dr-yamesha-ranatunga.html",
  },
  {
    title: "Dr Golnar Mortezaei",
    h1: "Dr Golnar Mortezaei",
    category: "Doctor",
    description:
      "Meet Dr Golnar Mortezaei at Woolloongabba Medical Centre. Explore family health, mental health, chronic disease care, telehealth and booking options.",
    headings: [
      "How Dr Golnar Mortezaei helps patients",
      "About Dr Golnar Mortezaei",
      "Related Services",
      "Frequently Asked Questions",
    ],
    keywords: [
      "doctor",
      "dr",
      "gp",
      "practitioner",
      "dr golnar mortezaei",
      "book with Dr Golnar Mortezaei",
    ],
    related: [
      "services/family-health.html",
      "services/mental-health.html",
      "services/chronic-disease-care.html",
      "services/preventive-healthcare.html",
      "services/telehealth.html",
      "team-general-practitioners.html",
      "knowledge/index.html",
      "new-patients.html",
      "practice-information.html",
      "faqs.html",
    ],
    text: "Dr Golnar Mortezaei General Practitioner Family health Mental health Chronic disease care Preventive healthcare Telehealth Book with Dr Golnar Mortezaei",
    url: "doctors/dr-golnar-mortezaei.html",
  },
];

const doctors = JSON.parse(fs.readFileSync(doctorsPath, "utf8"));
const byUrl = new Map();
let droppedNull = 0;
for (const d of doctors) {
  if (!d || typeof d.url !== "string" || !d.url.trim()) {
    droppedNull += 1;
    continue;
  }
  byUrl.set(d.url, d);
}
for (const row of additions) {
  byUrl.set(row.url, row);
}
const nextDoctors = [...byUrl.values()].sort((a, b) => a.url.localeCompare(b.url));
fs.writeFileSync(doctorsPath, `${JSON.stringify(nextDoctors, null, 2)}\n`, "utf8");
if (droppedNull) console.log(`dropped null/invalid doctor rows: ${droppedNull}`);

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
for (const row of additions) {
  manifest.routes[row.url] = "doctors";
  const catalogIdx = (manifest.catalog || []).findIndex((c) => c.url === row.url);
  const catalogRow = {
    url: row.url,
    title: row.title,
    h1: row.h1,
    category: row.category,
    description: row.description,
    related: row.related.slice(0, 8),
  };
  if (catalogIdx >= 0) manifest.catalog[catalogIdx] = catalogRow;
  else manifest.catalog.push(catalogRow);
}
manifest.count = Object.keys(manifest.routes).length;
fs.writeFileSync(manifestPath, `${JSON.stringify(manifest)}\n`, "utf8");

console.log(`doctors.json=${nextDoctors.length} manifest.count=${manifest.count}`);
for (const row of additions) console.log(`  + ${row.url}`);
