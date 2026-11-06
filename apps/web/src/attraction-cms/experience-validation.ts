/**
 * Experience Validation promote — UAT PageRevision sync.
 * NEVER sets AttractionDocument to published/scheduled.
 * NEVER calls publishAttractionDocumentToProduction().
 */
import { prisma } from "@/db/prisma";
import { PRACTICE_EXPERIENCE_HUB_CONTENT } from "@/practice-experience/hub-content";
import { renderPracticeExperienceHubHtml } from "@/practice-experience/render-hub-html";
import { assertPracticeExperienceSchema } from "@/practice-experience/schema-guards";
import { PRACTICE_EXPERIENCE_PATH } from "@/practice-experience/types";
import type { StorySurfaceQuote } from "@/story-capture/integration";
import {
  getGpOpportunitiesQuotes,
  getOpportunityPackQuotes,
  getPracticeExperienceQuotes,
} from "@/story-capture/integration";
import {
  EV_BANNER_STYLE,
  JOIN_ATTRACTION_NAV,
  attractionFooterNav,
  renderRecommendedNextBand,
} from "./ev-shell";
import { promoteEvPageRevision } from "./promote-page";
import {
  renderCatchmentHtml,
  renderClinicalInterestsHtml,
  renderContinuityHtml,
  renderFaqHtml,
  renderOpportunitiesHtml,
} from "./render/pack-pages";
import {
  renderDoctorReadinessHtml,
  renderDpaNavigatorHtml,
  renderExpressInterestHtml,
  renderJoinOurTeamHubHtml,
  renderOpportunityPackHtml,
  renderPracticeSupportHtml,
  renderProviderNumberHtml,
  renderRegistrarPathwayHtml,
  renderSessionPlannerHtml,
} from "./render/tool-pages";
import { seedAttractionPublishReadyContent } from "./seed-publish-ready";
import { PUBLISH_READY_SPECS } from "./content";

export type EvPromoteResult = {
  clinicSlug: string;
  pages: Array<{ path: string; pageId: string; revisionId: string }>;
  notice: string;
  attractionDocumentsUntouched: true;
};

/** Employer Brand Integrity: suppress composite / Story Capture rails until approved. */
function renderPeStoryRail(_quotes: StorySurfaceQuote[]): string {
  return "";
}

function injectEvBannerIntoPeHtml(html: string, peQuotes: StorySurfaceQuote[] = []): string {
  let next = html;
  if (!next.includes("ev-banner-style")) {
    next = next.replace(/<\/head>/i, `${EV_BANNER_STYLE}</head>`);
  }
  // Remove EV notice banners — not needed for stakeholder review surfaces.
  next = next.replace(/<aside class="ev-banner"[^>]*>[\s\S]*?<\/aside>/gi, "");
  // Single GP Attraction journey rail (Join ownership)
  next = next.replace(
    /<aside[^>]*id="related-pages"[^>]*>[\s\S]*?<\/aside>/i,
    JOIN_ATTRACTION_NAV("practice-experience.html"),
  );
  // Primary nav: Join Our Team owns Attraction PE
  next = next.replace(/data-nav-owner="about"/i, 'data-nav-owner="join-team"');
  next = next.replace(/data-nav-is-hub="false"/i, 'data-nav-is-hub="true"');
  next = next.replace(
    /(<a href="\.\.\/about-us\.html" data-nav-key="about")[^>]*>/i,
    '$1>',
  );
  if (!next.includes('data-nav-key="join-team"')) {
    next = next.replace(
      /(<a href="\.\.\/updates\/index\.html" data-nav-key="updates">Updates<\/a>)/i,
      `$1<a href="../join-our-team.html" data-nav-key="join-team" aria-current="page">Join Our Team</a>`,
    );
  } else {
    next = next.replace(
      /(<a href="\.\.\/join-our-team\.html" data-nav-key="join-team")([^>]*)>/i,
      '$1 aria-current="page">',
    );
  }
  // Breadcrumb + eyebrow under Join Our Team
  next = next.replace(
    /About Us · Practice Experience/i,
    "GP Attraction · Practice Experience",
  );
  next = next.replace(
    /<li><a href="\.\.\/about-us\.html">About Us<\/a>/i,
    '<li><a href="../join-our-team.html">Join Our Team</a>',
  );
  next = next.replace(
    /<section class="page-hero[^"]*"/i,
    '<section class="page-hero pe-hero page-hero--story page-hero--flagship"',
  );
  // Wave 1: editorial feature plane — Concept 1 photograph (photo only, no concept sheet chrome).
  // Temporary concept photography. Replace with approved WMC photography when available.
  if (!next.includes('data-story-feature="true"')) {
    const feature = `<!-- Temporary concept photography. Replace with approved WMC photography when available. -->
<div class="attraction-story-feature" data-story-feature="true">
<figure class="attraction-story-figure pe-feature-figure">
<img src="../assets/practice-experience/feature-atmosphere.jpg" alt="Reception, waiting area and consult corridor inside a calm general practice" width="1200" height="675" decoding="async"/>
</figure>
<div class="attraction-story-feature-copy"><p class="eyebrow">Practice atmosphere</p><h2>How the day feels</h2><p>Continuity, nursing handoffs and quiet systems that keep consulting coherent — not throughput theatre.</p></div>
</div>`;
    const before = next;
    next = next.replace(
      /(<article\b[^>]*class="[^"]*\bpe-article\b[^"]*"[^>]*>)/i,
      `$1\n${feature}`,
    );
    if (next === before) {
      next = next.replace(/(<article\b[^>]*>)/i, `$1\n${feature}`);
    }
  } else if (next.includes("attraction-story-feature--copy") && !next.includes("feature-atmosphere.jpg")) {
    // Upgrade copy-only feature plane to Concept 1 photograph without changing copy.
    next = next.replace(
      /<div class="attraction-story-feature attraction-story-feature--copy" data-story-feature="true">([\s\S]*?)<\/div>/i,
      `<!-- Temporary concept photography. Replace with approved WMC photography when available. -->
<div class="attraction-story-feature" data-story-feature="true">
<figure class="attraction-story-figure pe-feature-figure">
<img src="../assets/practice-experience/feature-atmosphere.jpg" alt="Reception, waiting area and consult corridor inside a calm general practice" width="1200" height="675" decoding="async"/>
</figure>
$1
</div>`,
    );
  }
  // P1-1: strip any residual patient/About module Related strips
  next = next.replace(/<nav class="pe-module-links"[^>]*>[\s\S]*?<\/nav>/gi, "");
  // Strip legacy composite story rails; keep recommended next only
  next = next.replace(
    /<section class="article-section pe-module"[^>]*id="story-voices"[\s\S]*?<\/section>/gi,
    "",
  );
  next = next.replace(/<blockquote class="pe-pull-quote"[^>]*data-composite="true"[\s\S]*?<\/blockquote>/gi, "");
  if (!next.includes('data-attraction-next="true"')) {
    next = next.replace(
      /<section class="article-section pe-next">[\s\S]*?<\/section>/i,
      `${renderPeStoryRail(peQuotes)}${renderRecommendedNextBand("about-us/practice-experience.html")}`,
    );
  }
  // Recruitment sticky (not patient HotDoc book)
  next = next.replace(
    /<nav aria-label="Appointment actions" class="persistent-care-actions">[\s\S]*?<\/nav>/i,
    `<nav aria-label="GP recruitment actions" class="persistent-care-actions persistent-care-actions--recruitment" data-audience="gp-attraction"><div class="persistent-care-actions-inner"><a class="persistent-care-book" href="../join-our-team/express-interest.html">Express Interest</a><a aria-label="Call Woolloongabba Medical Centre about joining on (07) 3217 3344" class="persistent-care-call" href="tel:+61732173344">Call about joining</a></div></nav>`,
  );
  // Footer standard
  next = next.replace(
    /<div class="footer-nav"><h3>About the Practice<\/h3>[\s\S]*?<\/div><\/div>/i,
    attractionFooterNav("../"),
  );
  next = next.replace(/site\.js(?=["?])/g, "site.js?v=wmc-attr-p0-clear-20261104");
  if (!next.includes("attraction-track.js")) {
    next = next.replace(
      /<\/body>/i,
      `<script src="../attraction-track.js?v=wmc-attr-opp-20261105b" defer></script></body>`,
    );
  }
  next = next.replace(/<html\b/i, '<html data-ev-surface="true"');
  if (/<body\b[^>]*data-attraction-type=/i.test(next)) {
    next = next.replace(/data-attraction-type="[^"]*"/i, 'data-attraction-type="story"');
  } else {
    next = next.replace(/<body\b([^>]*)>/i, '<body$1 data-ev="true" data-attraction-type="story">');
  }
  if (!/\bev-type-story\b/.test(next)) {
    next = next.replace(/<body\b([^>]*class=")([^"]*)(")/i, '<body$1$2 ev-pe-page ev-type-story$3');
  }
  next = next.replace(
    /content="index,follow[^"]*"/i,
    'content="noindex,nofollow"',
  );
  return next;
}

async function loadPackBody(clinicId: string, kind: string, slug: string) {
  const doc = await prisma.attractionDocument.findUnique({
    where: { clinicId_kind_slug: { clinicId, kind: kind as never, slug } },
    include: { revisions: { orderBy: { versionNumber: "desc" }, take: 1 } },
  });
  if (doc?.revisions[0]?.body) return doc.revisions[0].body;
  if (doc?.draftBody) return doc.draftBody;
  const spec = PUBLISH_READY_SPECS.find((s) => s.kind === kind && s.slug === slug);
  return spec?.draftBody ?? {};
}

export async function promoteAttractionExperienceValidation(input: {
  clinicId: string;
  clinicSlug: string;
  authorId?: string;
  seedPacks?: boolean;
}): Promise<EvPromoteResult> {
  if (input.seedPacks !== false && input.authorId) {
    await seedAttractionPublishReadyContent(input.clinicId, input.authorId);
  }

  const [oppQuotes, packQuotes, peQuotes] = await Promise.all([
    getGpOpportunitiesQuotes(input.clinicId),
    getOpportunityPackQuotes(input.clinicId),
    getPracticeExperienceQuotes(input.clinicId),
  ]);

  const pages: EvPromoteResult["pages"] = [];

  const peHtml = injectEvBannerIntoPeHtml(
    renderPracticeExperienceHubHtml(PRACTICE_EXPERIENCE_HUB_CONTENT),
    peQuotes,
  );
  const peViolations = assertPracticeExperienceSchema(peHtml);
  if (peViolations.length) {
    throw new Error(`PE schema gate failed:\n${peViolations.join("\n")}`);
  }
  pages.push(
    await promoteEvPageRevision({
      clinicId: input.clinicId,
      path: PRACTICE_EXPERIENCE_PATH,
      title: PRACTICE_EXPERIENCE_HUB_CONTENT.title,
      description: PRACTICE_EXPERIENCE_HUB_CONTENT.metaDescription,
      html: peHtml,
      breadcrumb: ["Home", "Join Our Team", "Practice Experience"],
      sectionKey: "join-team",
      body: {
        source: "attraction-experience-validation",
        kind: "practice_experience",
        contentClass: "synthetic_placeholder",
      },
    }),
  );

  const packJobs: Array<{
    kind: string;
    slug: string;
    path: string;
    title: string;
    description: string;
    breadcrumb: string[];
    sectionKey: "about" | "join-team";
    html: string;
  }> = [];

  const opportunitiesBody = await loadPackBody(input.clinicId, "opportunities", "gp-opportunities");
  packJobs.push({
    kind: "opportunities",
    slug: "gp-opportunities",
    path: "join-our-team/gp-opportunities.html",
    title: "GP Opportunities | Woolloongabba Medical Centre",
    description: "Practice fit for GPs considering Woolloongabba Medical Centre.",
    breadcrumb: ["Home", "Join Our Team", "GP Opportunities"],
    sectionKey: "join-team",
    html: renderOpportunitiesHtml(opportunitiesBody, oppQuotes),
  });

  const faqBody = await loadPackBody(input.clinicId, "faq", "gp-faq");
  packJobs.push({
    kind: "faq",
    slug: "gp-faq",
    path: "join-our-team/gp-faq.html",
    title: "GP FAQ | Woolloongabba Medical Centre",
    description: "FAQ for GPs considering Woolloongabba Medical Centre.",
    breadcrumb: ["Home", "Join Our Team", "GP FAQ"],
    sectionKey: "join-team",
    html: renderFaqHtml(faqBody),
  });

  const catchmentBody = await loadPackBody(
    input.clinicId,
    "catchment_analysis",
    "inner-south-catchment",
  );
  packJobs.push({
    kind: "catchment_analysis",
    slug: "inner-south-catchment",
    path: "about-us/community-catchment.html",
    title: "Community & Catchment | Woolloongabba Medical Centre",
    description: "Qualitative catchment context for GPs.",
    breadcrumb: ["Home", "Join Our Team", "Community & Catchment"],
    sectionKey: "join-team",
    html: renderCatchmentHtml(catchmentBody),
  });

  const continuityBody = await loadPackBody(
    input.clinicId,
    "continuity_network",
    "local-continuity-network",
  );
  packJobs.push({
    kind: "continuity_network",
    slug: "local-continuity-network",
    path: "about-us/continuity-in-practice.html",
    title: "Continuity in Practice | Woolloongabba Medical Centre",
    description: "Local continuity network for GPs.",
    breadcrumb: ["Home", "Join Our Team", "Continuity in Practice"],
    sectionKey: "join-team",
    html: renderContinuityHtml(continuityBody),
  });

  const clinicalBody = await loadPackBody(
    input.clinicId,
    "clinical_interests",
    "clinical-interests-framework",
  );
  packJobs.push({
    kind: "clinical_interests",
    slug: "clinical-interests-framework",
    path: "about-us/clinical-interests.html",
    title: "Clinical Interests | Woolloongabba Medical Centre",
    description: "Clinical interests framework for community general practice.",
    breadcrumb: ["Home", "Join Our Team", "Clinical Interests"],
    sectionKey: "join-team",
    html: renderClinicalInterestsHtml(clinicalBody),
  });

  for (const job of packJobs) {
    pages.push(
      await promoteEvPageRevision({
        clinicId: input.clinicId,
        path: job.path,
        title: job.title,
        description: job.description,
        html: job.html,
        breadcrumb: job.breadcrumb,
        sectionKey: job.sectionKey,
        body: {
          source: "attraction-experience-validation",
          kind: job.kind,
          slug: job.slug,
          contentClass: "synthetic_placeholder",
        },
      }),
    );
  }

  const toolPages: Array<{
    path: string;
    title: string;
    description: string;
    breadcrumb: string[];
    html: string;
  }> = [
    {
      path: "join-our-team.html",
      title: "Join Our Team | Woolloongabba Medical Centre",
      description: "Join Woolloongabba Medical Centre — continuity-focused GP practice experience, opportunities, readiness tools and human-reviewed express interest.",
      breadcrumb: ["Home", "Join Our Team"],
      html: renderJoinOurTeamHubHtml(),
    },
    {
      path: "join-our-team/doctor-readiness.html",
      title: "Doctor Readiness | Woolloongabba Medical Centre",
      description: "Advisory doctor readiness self-check.",
      breadcrumb: ["Home", "Join Our Team", "Doctor Readiness"],
      html: renderDoctorReadinessHtml(input.clinicSlug),
    },
    {
      path: "join-our-team/provider-number-readiness.html",
      title: "Provider Number Readiness | Woolloongabba Medical Centre",
      description: "Provider number readiness orientation.",
      breadcrumb: ["Home", "Join Our Team", "Provider Number Readiness"],
      html: renderProviderNumberHtml(),
    },
    {
      path: "join-our-team/dpa-navigator.html",
      title: "DPA / 19AB Navigator | Woolloongabba Medical Centre",
      description: "Advisory DPA / 19AB navigator.",
      breadcrumb: ["Home", "Join Our Team", "DPA Navigator"],
      html: renderDpaNavigatorHtml(),
    },
    {
      path: "join-our-team/session-planner.html",
      title: "Session Planner | Woolloongabba Medical Centre",
      description: "Advisory session planner.",
      breadcrumb: ["Home", "Join Our Team", "Session Planner"],
      html: renderSessionPlannerHtml(),
    },
    {
      path: "join-our-team/practice-support.html",
      title: "Practice Support Matrix | Woolloongabba Medical Centre",
      description: "Practice support capability matrix.",
      breadcrumb: ["Home", "Join Our Team", "Practice Support"],
      html: renderPracticeSupportHtml(),
    },
    {
      path: "join-our-team/registrar-pathway.html",
      title: "Registrar Pathway | Woolloongabba Medical Centre",
      description: "Registrar and early-career pathway.",
      breadcrumb: ["Home", "Join Our Team", "Registrar Pathway"],
      html: renderRegistrarPathwayHtml(),
    },
    {
      path: "join-our-team/opportunity-pack.html",
      title: "GP Opportunity Pack | Woolloongabba Medical Centre",
      description: "Opportunity pack summary.",
      breadcrumb: ["Home", "Join Our Team", "Opportunity Pack"],
      html: renderOpportunityPackHtml(packQuotes),
    },
    {
      path: "join-our-team/express-interest.html",
      title: "Express Interest | Woolloongabba Medical Centre",
      description: "GP expression of interest.",
      breadcrumb: ["Home", "Join Our Team", "Express Interest"],
      html: renderExpressInterestHtml(input.clinicSlug),
    },
  ];

  for (const tool of toolPages) {
    pages.push(
      await promoteEvPageRevision({
        clinicId: input.clinicId,
        path: tool.path,
        title: tool.title,
        description: tool.description,
        html: tool.html,
        breadcrumb: tool.breadcrumb,
        sectionKey: "join-team",
        body: {
          source: "attraction-experience-validation",
          tool: tool.path,
          contentClass: "synthetic_placeholder",
        },
      }),
    );
  }

  return {
    clinicSlug: input.clinicSlug,
    pages: pages.map((p) => ({
      path: p.path,
      pageId: p.pageId,
      revisionId: p.revisionId,
    })),
    notice:
      "Experience Validation promote complete. AttractionDocument publish states unchanged. Production publish remains blocked.",
    attractionDocumentsUntouched: true,
  };
}
