import fs from "node:fs";
import path from "node:path";

const dir = path.resolve("old-html/doctors");
const files = fs.readdirSync(dir).filter((f) => f.endsWith(".html")).sort();

const checks = {
  doctorPageHero: /doctor-page-hero|doctor-profile-hero/,
  careHighlights: /practitioner-care-highlights/,
  expertiseCaption: /Published areas of care/,
  bookHotdoc: /wmc-book-appointment/,
  midBookBand: /Ready to book with/,
  relatedServices: /Related Services|id="related-services"/,
  peerBand: /Other practitioners in related care areas|practitioner-peers/,
  relatedKnowledge: /Patient guides|Healthcare Knowledge|knowledge\/articles/,
  trustStrip: /trust-strip|footer-trust|agpal-mark|wmc-trust/,
  profileImage: /data-practitioner-image|doctor-profile-photo/,
  persistentDock: /persistent-care-actions|has-persistent-care-actions/,
  digitalReception: /digital-reception\.js/,
  callAction: /tel:\+61732173344/,
  onThisPage: /On this page|page-toc|journey-nav/,
  faq: /Frequently Asked Questions/,
  planningVisit: /Planning your visit/,
  doctorRole: /doctor-role/,
  qualifications: /Qualifications/,
};

const rows = files.map((f) => {
  const html = fs.readFileSync(path.join(dir, f), "utf8");
  const result = { file: f, bookCount: (html.match(/wmc-book-appointment/g) || []).length };
  for (const [k, re] of Object.entries(checks)) result[k] = re.test(html);
  // HotDoc deep-link vs clinic-level
  const hotdoc = [...html.matchAll(/hotdoc\.com\.au[^"'\s]+/g)].map((m) => m[0]);
  result.hotdocUnique = [...new Set(hotdoc)];
  result.practitionerDeepLink = hotdoc.some((u) => /\/doctors\//.test(u));
  return result;
});

const summary = {};
for (const k of Object.keys(checks)) {
  const miss = rows.filter((r) => !r[k]).map((r) => r.file);
  summary[k] = { ok: rows.length - miss.length, missing: miss };
}

const deepLinkMiss = rows.filter((r) => !r.practitionerDeepLink).map((r) => r.file);

console.log(
  JSON.stringify(
    {
      count: rows.length,
      summary,
      deepLinkMiss,
      bookCounts: rows.map((r) => ({ file: r.file, bookCount: r.bookCount, deep: r.practitionerDeepLink })),
    },
    null,
    2,
  ),
);
