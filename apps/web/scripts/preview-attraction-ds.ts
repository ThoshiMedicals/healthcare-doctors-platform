/**
 * Local DS preview HTML (no PageRevision promote).
 *   npx tsx scripts/preview-attraction-ds.ts
 */
import { mkdirSync, writeFileSync, copyFileSync, existsSync, cpSync } from "node:fs";
import { join } from "node:path";
import {
  renderCatchmentHtml,
  renderClinicalInterestsHtml,
  renderContinuityHtml,
  renderFaqHtml,
  renderOpportunitiesHtml,
} from "../src/attraction-cms/render/pack-pages";
import {
  renderDoctorReadinessHtml,
  renderExpressInterestHtml,
  renderJoinOurTeamHubHtml,
  renderOpportunityPackHtml,
} from "../src/attraction-cms/render/tool-pages";
import { EV_BANNER_STYLE, JOIN_ATTRACTION_NAV, renderRecommendedNextBand, renderStoryFigure } from "../src/attraction-cms/ev-shell";

const outRoot = join(process.cwd(), ".tmp-attraction-ds");
mkdirSync(outRoot, { recursive: true });
mkdirSync(join(outRoot, "join-our-team"), { recursive: true });
mkdirSync(join(outRoot, "about-us"), { recursive: true });

const publicDir = join(process.cwd(), "public");
for (const asset of ["styles.css", "site.js"]) {
  const src = join(publicDir, asset);
  if (existsSync(src)) copyFileSync(src, join(outRoot, asset));
}
const assetsSrc = join(publicDir, "assets");
if (existsSync(assetsSrc)) {
  cpSync(assetsSrc, join(outRoot, "assets"), { recursive: true });
}

function rewriteAssetPaths(html: string, depth: 0 | 1): string {
  if (depth === 0) return html;
  // Nested pages already use ../ for assets from renderers — OK for about-us/ and join-our-team/
  return html;
}

const peStub = `<!DOCTYPE html><html lang="en-AU" data-ev-surface="true"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>Practice Experience | DS Preview</title><link href="../styles.css" rel="stylesheet"/>${EV_BANNER_STYLE}</head><body class="has-persistent-care-actions ev-pe-page ev-type-story" data-ev="true" data-attraction-type="story"><main id="main"><section class="page-hero page-hero--story"><div class="shell page-hero-inner"><p class="eyebrow">GP Attraction · Experience Validation</p><h1>Practice Experience</h1><p class="lede">See how the day runs — nursing support, continuity and quiet systems.</p></div></section><section class="page-main"><div class="shell page-layout">${JOIN_ATTRACTION_NAV("practice-experience.html")}<article class="article pe-article"><div class="attraction-story-feature">${renderStoryFigure({ src: "../assets/attraction/placeholders/PE-TD-01__consulting-room__2026-11.jpg", alt: "Consulting room", caption: "Synthetic placeholder — consulting room atmosphere." })}<div><p class="eyebrow">Practice atmosphere</p><h2>How the day feels</h2><p>Continuity and nursing handoffs that keep consulting coherent.</p></div></div><section class="article-section"><h2>Day structure</h2><p>Familiar faces, unfinished stories, and rooms that support longer conversations.</p></section>${renderRecommendedNextBand("about-us/practice-experience.html")}</article></div></section></main></body></html>`;

const pages: Array<{ path: string; html: string }> = [
  { path: "join-our-team.html", html: renderJoinOurTeamHubHtml() },
  { path: "join-our-team/express-interest.html", html: renderExpressInterestHtml("woolloongabba") },
  { path: "join-our-team/opportunity-pack.html", html: renderOpportunityPackHtml() },
  {
    path: "join-our-team/gp-opportunities.html",
    html: renderOpportunitiesHtml({
      h1: "GP Opportunities",
      lede: "Suitability and practice fit for doctors considering Woolloongabba Medical Centre.",
      honestyLine: "Not a job advertisement or earnings claim.",
      sections: [
        {
          id: "suitability",
          heading: "Suitability & practice fit",
          body: "A continuity-focused consulting home — explore fit before you express interest.",
        },
      ],
    }),
  },
  {
    path: "join-our-team/gp-faq.html",
    html: renderFaqHtml({
      h1: "GP FAQ",
      lede: "High-intent questions doctors ask before expressing interest.",
      faqs: [
        { id: "sessions", question: "How are sessions agreed?", answer: "Human conversation — capacity and mutual fit decide timing." },
        { id: "provider", question: "Do you issue provider numbers?", answer: "No. Services Australia issues numbers; we clarify boundaries only." },
      ],
    }),
  },
  { path: "join-our-team/doctor-readiness.html", html: renderDoctorReadinessHtml("woolloongabba") },
  {
    path: "about-us/community-catchment.html",
    html: renderCatchmentHtml({
      h1: "Community & Catchment",
      lede: "Who we serve across the inner south — qualitative context for GPs.",
      sections: [{ id: "who", heading: "Who presents here", body: "Families, workers and longer-term patients across neighbouring suburbs." }],
    }),
  },
  {
    path: "about-us/continuity-in-practice.html",
    html: renderContinuityHtml({
      h1: "Continuity in Practice",
      lede: "How relationships and unfinished stories return across the week.",
      sections: [{ id: "craft", heading: "Continuity as craft", body: "Handoffs, recall and familiar faces — not slogans." }],
      network: { nodes: [{ label: "Nursing", role: "Treatment-room and preventive pathway support" }, { label: "Reception", role: "Booking and flow that protect consulting time" }] },
    }),
  },
  {
    path: "about-us/clinical-interests.html",
    html: renderClinicalInterestsHtml({
      h1: "Clinical Interests",
      lede: "Special interests inside generalist continuity.",
      interests: [
        { title: "Women's health", body: "Held inside ongoing GP relationships." },
        { title: "Skin", body: "Procedure days supported by nursing cover where agreed." },
      ],
    }),
  },
  { path: "about-us/practice-experience.html", html: peStub },
];

for (const page of pages) {
  const full = join(outRoot, page.path);
  mkdirSync(join(full, ".."), { recursive: true });
  writeFileSync(full, rewriteAssetPaths(page.html, page.path.includes("/") ? 1 : 0), "utf8");
  console.log("wrote", page.path);
}

console.log(JSON.stringify({ outRoot, count: pages.length }, null, 2));
