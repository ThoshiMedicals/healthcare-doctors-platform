import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dir = path.join(repoRoot, "old-html", "services");
const files = fs.readdirSync(dir).filter((f) => f.endsWith(".html")).sort();

const checks = {
  pageHero: /page-hero|service-page-hero|service-hero/,
  h1: /<h1[\s>]/,
  bookHotdoc: /wmc-book-appointment/,
  conversionBand: /conversion-band|Ready to book|Book this service|critical-action/,
  trustStripStatic: /trust-strip|footer-trust|agpal-mark/,
  relatedPractitioners: /related-practitioners|Related Practitioners|authority-related-practitioners/,
  relatedKnowledge: /knowledge\/articles|Related Guides|Patient guides|Healthcare Knowledge/,
  relatedServices: /Related Services|related-services/,
  callAction: /tel:\+61732173344/,
  persistentDock: /persistent-care-actions|has-persistent-care-actions/,
  digitalReception: /digital-reception\.js/,
  siteJs: /site\.js/,
  onThisPage: /On this page|page-toc|journey-nav|long-page-navigation/,
  internalDoctors: /href="[^"]*doctors\/[^"]+\.html"/,
  internalServices: /href="[^"]*services\/[^"]+\.html"/,
  internalKnowledge: /href="[^"]*knowledge\/[^"]+\.html"/,
};

const rows = files.map((f) => {
  const html = fs.readFileSync(path.join(dir, f), "utf8");
  const result = {
    file: f,
    bytes: html.length,
    bookCount: (html.match(/wmc-book-appointment/g) || []).length,
    doctorLinks: (html.match(/href="[^"]*doctors\/[^"]+\.html"/g) || []).length,
    serviceLinks: (html.match(/href="[^"]*services\/[^"]+\.html"/g) || []).length,
    knowledgeLinks: (html.match(/href="[^"]*knowledge\/[^"]+\.html"/g) || []).length,
  };
  for (const [k, re] of Object.entries(checks)) result[k] = re.test(html);
  return result;
});

const summary = {};
for (const k of Object.keys(checks)) {
  const miss = rows.filter((r) => !r[k]).map((r) => r.file);
  summary[k] = { ok: rows.length - miss.length, missing: miss };
}

const noDoctors = rows.filter((r) => r.doctorLinks === 0).map((r) => r.file);
const noKnowledge = rows.filter((r) => r.knowledgeLinks === 0).map((r) => r.file);
const noServices = rows.filter((r) => r.serviceLinks === 0).map((r) => r.file);
const thin = rows
  .filter((r) => r.doctorLinks < 2 || r.knowledgeLinks < 2)
  .map((r) => ({ file: r.file, doctors: r.doctorLinks, knowledge: r.knowledgeLinks, services: r.serviceLinks, books: r.bookCount }));

console.log(
  JSON.stringify(
    {
      count: rows.length,
      summary,
      missingConnections: { noDoctors, noKnowledge, noServices },
      thinAuthority: thin,
      bookCounts: rows.map((r) => ({ file: r.file, books: r.bookCount })),
    },
    null,
    2,
  ),
);
