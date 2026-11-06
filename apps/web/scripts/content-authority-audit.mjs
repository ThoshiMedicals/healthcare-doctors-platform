/**
 * Content / Service / Knowledge authority audit — evidence from UAT HTML + sitemap.
 * Read-only; does not invent clinical offerings.
 */
import { writeFileSync } from "node:fs";

const base = process.env.SEO_AUDIT_BASE || "http://127.0.0.1:3100";

const DOCTORS = [
  ["Tanya", "/doctors/dr-tanya-goodwill.html"],
  ["Debra", "/doctors/dr-debra-larkins.html"],
  ["Anand", "/doctors/dr-anand-singh.html"],
  ["Sumita", "/doctors/dr-sumita-singh.html"],
  ["Golnar", "/doctors/dr-golnar-mortezaei.html"],
  ["James", "/doctors/dr-james.html"],
  ["Yamesha", "/doctors/dr-yamesha-ranatunga.html"],
];

const INTENT_SERVICES = [
  ["Family Medicine", "/services/family-health.html"],
  ["Women's Health", "/services/womens-health.html"],
  ["Men's Health", "/services/mens-health.html"],
  ["Mental Health", "/services/mental-health.html"],
  ["Chronic Disease", "/services/chronic-disease-care.html"],
  ["Skin Checks", "/services/skin-checks.html"],
  ["Vaccinations", "/services/vaccinations.html"],
  ["Children's Health", "/services/childrens-health.html"],
  ["Travel Medicine", null],
  ["Sexual Health", null],
  ["Preventive Health", "/services/preventive-healthcare.html"],
];

const LOCAL = [
  "Woolloongabba",
  "South Brisbane",
  "Kangaroo Point",
  "East Brisbane",
  "Highgate Hill",
  "Dutton Park",
];

function strip(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function abs(href, page) {
  if (!href) return "";
  if (href.startsWith("http")) {
    try {
      return new URL(href).pathname;
    } catch {
      return href;
    }
  }
  if (href.startsWith("/")) return href;
  if (href.startsWith("#") || href.startsWith("tel:") || href.startsWith("mailto:")) return href;
  return new URL(href, base + page).pathname;
}

function links(html, page, prefix) {
  return [
    ...new Set(
      [...html.matchAll(/href="([^"]+)"/g)]
        .map((m) => abs(m[1], page))
        .filter((p) => p.includes(prefix)),
    ),
  ];
}

function careHighlights(html) {
  const block = html.match(/practitioner-care-highlights[\s\S]*?<\/ul>/i);
  if (!block) return [];
  return [...block[0].matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)].map((m) =>
    m[1].replace(/<[^>]+>/g, "").trim(),
  );
}

function titleOf(html) {
  return (html.match(/<title>([^<]+)/i) || [])[1] || "";
}

function h1Of(html) {
  return ((html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || [])[1] || "").replace(/<[^>]+>/g, "").trim();
}

function metaDesc(html) {
  return (
    (html.match(/name="description"\s+content="([^"]*)"/i) ||
      html.match(/content="([^"]*)"\s+name="description"/i) ||
      [])[1] || ""
  );
}

async function get(path) {
  const res = await fetch(base + path, { redirect: "manual" });
  const html = res.status === 200 ? await res.text() : "";
  return { status: res.status, html };
}

// Sitemap service + knowledge inventory
const sm = await (await fetch(base + "/sitemap.xml")).text();
const sitemapUrls = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => {
  try {
    return new URL(m[1]).pathname;
  } catch {
    return m[1];
  }
});

const servicePages = sitemapUrls.filter((u) => u.startsWith("/services/") && u.endsWith(".html") && u !== "/services.html");
const knowledgeArticles = sitemapUrls.filter((u) => u.includes("/knowledge/articles/"));
const knowledgeHubs = sitemapUrls.filter(
  (u) => u.startsWith("/knowledge/") && !u.includes("/articles/") && u.endsWith(".html"),
);
const updates = sitemapUrls.filter((u) => u.startsWith("/updates/") && u.endsWith(".html") && !u.endsWith("/index.html"));

const serviceInventory = [];
for (const path of servicePages) {
  const { status, html } = await get(path);
  if (status !== 200) {
    serviceInventory.push({ path, status, error: true });
    continue;
  }
  const text = strip(html);
  const doctors = links(html, path, "/doctors/");
  const knowledge = [
    ...links(html, path, "/knowledge/"),
    ...links(html, path, "/knowledge/articles/"),
  ];
  const book =
    /hotdoc\.com/i.test(html) || /book-appointment/i.test(html) || /wmc-book-appointment/i.test(html);
  const localHits = LOCAL.filter((t) => text.includes(t));
  serviceInventory.push({
    path,
    status,
    title: titleOf(html),
    h1: h1Of(html),
    descriptionLen: metaDesc(html).length,
    wordCount: text.split(/\s+/).length,
    doctorLinks: [...new Set(doctors)],
    knowledgeLinks: [...new Set(knowledge)],
    hasBookCta: book,
    localHits,
    relatedPractitionersSection: /id="related-practitioners"/i.test(html),
  });
}

const intentCoverage = [];
for (const [intent, path] of INTENT_SERVICES) {
  if (!path) {
    intentCoverage.push({ intent, path: null, status: "MISSING", depth: "missing" });
    continue;
  }
  const row = serviceInventory.find((s) => s.path === path);
  if (!row || row.error) {
    intentCoverage.push({ intent, path, status: "ERROR", depth: "missing" });
    continue;
  }
  let depth = "strong";
  if (row.wordCount < 700) depth = "thin";
  else if (row.wordCount < 1100 || row.doctorLinks.length < 2) depth = "underdeveloped";
  if (row.doctorLinks.length === 0) depth = depth === "strong" ? "underdeveloped" : depth;
  intentCoverage.push({
    intent,
    path,
    status: 200,
    depth,
    wordCount: row.wordCount,
    doctors: row.doctorLinks.length,
    knowledge: row.knowledgeLinks.length,
    book: row.hasBookCta,
  });
}

const practitionerAudit = [];
for (const [name, path] of DOCTORS) {
  const { status, html } = await get(path);
  if (status !== 200) {
    practitionerAudit.push({ name, path, status, error: true });
    continue;
  }
  const highlights = careHighlights(html);
  const services = links(html, path, "/services/");
  const knowledge = links(html, path, "/knowledge/");
  const updatesLinks = links(html, path, "/updates/");
  const book = /hotdoc\.com/i.test(html) || /href="tel:/i.test(html);
  practitionerAudit.push({
    name,
    path,
    status,
    title: titleOf(html),
    highlights,
    serviceLinks: [...new Set(services)],
    knowledgeLinks: [...new Set(knowledge)],
    updateLinks: [...new Set(updatesLinks)],
    hasBook: book,
    wordCount: strip(html).split(/\s+/).length,
  });
}

// Sample knowledge articles for outbound links
const knowledgeSample = [];
for (const path of knowledgeArticles.slice(0, 25)) {
  const { status, html } = await get(path);
  if (status !== 200) continue;
  knowledgeSample.push({
    path,
    title: titleOf(html),
    serviceLinks: links(html, path, "/services/"),
    doctorLinks: links(html, path, "/doctors/"),
    book: /hotdoc|book-appointment|wmc-book-appointment/i.test(html),
    wordCount: strip(html).split(/\s+/).length,
  });
}

const updatesIndex = await get("/updates/index.html");
const updateCards = [
  ...new Set(
    [...(updatesIndex.html || "").matchAll(/href="([^"]+\.html)"/g)]
      .map((m) => abs(m[1], "/updates/index.html"))
      .filter((p) => p.includes("/updates/") && !p.endsWith("/index.html")),
  ),
];

const report = {
  generatedAt: new Date().toISOString(),
  base,
  inventory: {
    servicePages: servicePages.length,
    knowledgeArticles: knowledgeArticles.length,
    knowledgeHubs: knowledgeHubs.length,
    updatesInSitemap: updates.length,
    updatesListedOnIndex: updateCards.length,
    servicePaths: servicePages,
    knowledgeHubPaths: knowledgeHubs,
  },
  intentCoverage,
  serviceInventory,
  practitionerAudit,
  knowledgeSample,
  updateCards,
};

const out = new URL("../../../docs/WMC-CONTENT-AUTHORITY-AUDIT-EVIDENCE.json", import.meta.url);
writeFileSync(out, JSON.stringify(report, null, 2));
console.log(
  JSON.stringify(
    {
      ok: true,
      out: out.pathname,
      services: servicePages.length,
      articles: knowledgeArticles.length,
      intents: intentCoverage.length,
    },
    null,
    2,
  ),
);
