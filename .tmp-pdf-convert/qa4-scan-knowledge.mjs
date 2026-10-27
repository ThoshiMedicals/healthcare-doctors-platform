import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const knowledgeRoot = path.join(repoRoot, "old-html", "knowledge");

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (entry.name.endsWith(".html")) out.push(full);
  }
  return out;
}

const files = walk(knowledgeRoot).sort();

const checks = {
  h1: /<h1[\s>]/,
  articleShell: /class="[^"]*\barticle\b|knowledge-article|article-body/,
  byline: /knowledge-byline|article-byline|class="[^"]*byline/,
  authorName: /Reviewed by|Written by|Author:|data-author|clinical-author|Dr\s+[A-Z]/i,
  governanceHost: /data-governance-review|governance-review/,
  lastReviewed: /last.?reviewed|Last reviewed|data-last-reviewed/i,
  nextReview: /next.?review|Next review/i,
  contentOwner: /content.?owner|Content owner/i,
  conversionBand: /conversion-band|critical-action|Ready to book|Book an appointment|Book Appointment/i,
  bookHotdoc: /wmc-book-appointment/,
  relatedKnowledge: /Related Guides|related-guides|More on this topic|knowledge\/articles|Continue reading/i,
  relatedServices: /Related Services|related-services|services\/[^"']+\.html/i,
  relatedPractitioners: /Related Practitioners|doctors\/[^"']+\.html|Meet Our Team/i,
  callAction: /tel:\+61732173344/,
  siteJs: /site\.js/,
  digitalReception: /digital-reception\.js/,
  persistentDock: /persistent-care-actions|has-persistent-care-actions/,
  onThisPage: /On this page|page-toc|journey-nav|long-page-navigation/,
  readabilityAids: /reading-time|estimated read|key.?takeaway|summary-box|tl;dr|at.?a.?glance/i,
  typographyClasses: /prose|article-body|knowledge-content|long-form|type-/,
  trustStrip: /trust-strip|footer-trust|agpal-mark/,
};

const rows = files.map((full) => {
  const rel = path.relative(knowledgeRoot, full).replace(/\\/g, "/");
  const html = fs.readFileSync(full, "utf8");
  const kind = rel.startsWith("articles/") ? "article" : rel.includes("/") ? "nested" : "topic";
  const result = {
    file: rel,
    kind,
    bytes: html.length,
    wordsApprox: html.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length,
    doctorLinks: (html.match(/href="[^"]*doctors\/[^"]+\.html"/g) || []).length,
    serviceLinks: (html.match(/href="[^"]*services\/[^"]+\.html"/g) || []).length,
    knowledgeLinks: (html.match(/href="[^"]*knowledge\/[^"]+\.html"/g) || []).length,
    bookCount: (html.match(/wmc-book-appointment/g) || []).length,
  };
  for (const [k, re] of Object.entries(checks)) result[k] = re.test(html);
  return result;
});

const summary = {};
for (const k of Object.keys(checks)) {
  const miss = rows.filter((r) => !r[k]).map((r) => r.file);
  summary[k] = { ok: rows.length - miss.length, missingCount: miss.length, missingSample: miss.slice(0, 12) };
}

const byKind = {};
for (const r of rows) {
  byKind[r.kind] = byKind[r.kind] || { count: 0, noGov: 0, noByline: 0, noBook: 0, thinLinks: 0 };
  byKind[r.kind].count += 1;
  if (!r.governanceHost) byKind[r.kind].noGov += 1;
  if (!r.byline) byKind[r.kind].noByline += 1;
  if (!r.bookHotdoc) byKind[r.kind].noBook += 1;
  if (r.knowledgeLinks < 2 && r.serviceLinks < 2) byKind[r.kind].thinLinks += 1;
}

const thin = rows
  .filter((r) => r.knowledgeLinks < 2 || (!r.governanceHost && !r.byline))
  .slice(0, 40)
  .map((r) => ({
    file: r.file,
    kind: r.kind,
    gov: r.governanceHost,
    byline: r.byline,
    knowledge: r.knowledgeLinks,
    services: r.serviceLinks,
    doctors: r.doctorLinks,
    books: r.bookCount,
  }));

console.log(
  JSON.stringify(
    {
      count: rows.length,
      byKind,
      summary,
      thin,
      articles: rows.filter((r) => r.kind === "article").length,
      topics: rows.filter((r) => r.kind === "topic").length,
    },
    null,
    2,
  ),
);
