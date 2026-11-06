import type {
  PracticeExperienceBlock,
  PracticeExperienceHubContent,
  PracticeExperienceModule,
} from "./types";
import {
  cleanPublicHeading,
  filterPublicPoints,
  isStakeholderSafeText,
} from "@/attraction-cms/stakeholder-integrity";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderBlock(block: PracticeExperienceBlock): string {
  const headingRaw = cleanPublicHeading(block.heading);
  if (!headingRaw || !isStakeholderSafeText(headingRaw)) return "";
  const heading = escapeHtml(headingRaw);
  const points = filterPublicPoints(block.points);
  if (!points.length) return "";
  const items = points.map((p) => `<li>${escapeHtml(p)}</li>`).join("");
  if (block.type === "callout") {
    return `<aside class="pe-callout" role="note"><h3>${heading}</h3><ul>${items}</ul></aside>`;
  }
  if (block.type === "timeline") {
    return `<div class="pe-timeline"><h3>${heading}</h3><ol class="pe-timeline-list">${items}</ol></div>`;
  }
  if (block.type === "vignette" || block.type === "example") {
    return `<div class="pe-vignette"><h3>${heading}</h3><ul>${items}</ul></div>`;
  }
  return `<div class="pe-bullets"><h3>${heading}</h3><ul>${items}</ul></div>`;
}

function renderModule(module: PracticeExperienceModule): string {
  const blocks = module.blocks
    .filter((b) => b.type !== "media_slot")
    .map(renderBlock)
    .filter(Boolean)
    .join("\n");

  // Temporary concept photography is allowed (kind: pending). Hide legacy AI slots.
  // Temporary concept photography. Replace with approved WMC photography when available.
  const mediaHtml =
    module.media.kind === "ai_placeholder" ||
    (module.media.caption && !isStakeholderSafeText(module.media.caption))
      ? ""
      : `<!-- Temporary concept photography. Replace with approved WMC photography when available. -->
<figure class="pe-media pe-media--chapter">
<img src="${escapeHtml(module.media.src)}" alt="${escapeHtml(module.media.alt)}" width="1200" height="675" loading="lazy" decoding="async"/>
</figure>`;

  // Suppress composite testimonial treatments until approved.
  const quoteHtml =
    module.pullQuote.voice === "composite_placeholder" ||
    !isStakeholderSafeText(module.pullQuote.attribution) ||
    !isStakeholderSafeText(module.pullQuote.text)
      ? ""
      : `<blockquote class="pe-pull-quote" cite="#${escapeHtml(module.anchor)}">
<p>${escapeHtml(module.pullQuote.text)}</p>
<footer><cite>${escapeHtml(module.pullQuote.attribution)}</cite></footer>
</blockquote>`;

  const ledeRaw = cleanPublicHeading(module.lede);
  const ledeHtml =
    ledeRaw && isStakeholderSafeText(ledeRaw) ? `<p>${escapeHtml(ledeRaw)}</p>` : "";

  return `<section class="article-section pe-module" id="${escapeHtml(module.anchor)}" data-pe-module="${escapeHtml(module.id)}">
<p class="eyebrow">${escapeHtml(module.label)}</p>
<h2>${escapeHtml(module.hubTitle)}</h2>
${ledeHtml}
${mediaHtml}
${blocks}
${quoteHtml}
</section>`;
}

/**
 * Renders Practice Experience Hub HTML using WMC shell patterns (nested about-us path).
 * Schema: MedicalClinic + WebPage + BreadcrumbList only — no JobPosting.
 */
export function renderPracticeExperienceHubHtml(
  content: PracticeExperienceHubContent,
  options?: { origin?: string },
): string {
  const origin = options?.origin ?? "https://gabbamedicalcentre.com.au";
  const pageUrl = `${origin}/${content.path}`;
  const modules = [...content.modules].sort((a, b) => a.order - b.order);
  const onThisPage = modules
    .map((m) => `<a href="#${escapeHtml(m.anchor)}">${escapeHtml(m.label)}</a>`)
    .join("");
  const moduleHtml = modules.map(renderModule).join("\n");

  const medicalClinic = {
    "@type": ["MedicalClinic", "MedicalOrganization"],
    "@id": `${origin}/#medical-clinic`,
    name: "Woolloongabba Medical Centre",
    url: `${origin}/`,
    telephone: "+61 7 3217 3344",
    email: "reception@gabbamedicalcentre.com.au",
    address: {
      "@type": "PostalAddress",
      streetAddress: "468 Vulture Street",
      addressLocality: "Woolloongabba",
      addressRegion: "QLD",
      postalCode: "4102",
      addressCountry: "AU",
    },
  };

  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      medicalClinic,
      {
        "@type": "WebPage",
        "@id": `${pageUrl}#webpage`,
        url: pageUrl,
        name: content.title,
        description: content.metaDescription,
        inLanguage: "en-AU",
        isPartOf: { "@id": `${origin}/#website` },
        about: { "@id": `${origin}/#medical-clinic` },
        provider: { "@id": `${origin}/#medical-clinic` },
      },
    ],
  };

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${origin}/` },
      { "@type": "ListItem", position: 2, name: "About Us", item: `${origin}/about-us.html` },
      { "@type": "ListItem", position: 3, name: "Practice Experience", item: pageUrl },
    ],
  };

  // Hero honesty asides removed from public surface — busy GPs do not need the disclaimer banner.
  const honesty = "";

  return `<!DOCTYPE html>
<html lang="en-AU">
<head>
<meta charset="utf-8"/>
<meta content="width=device-width,initial-scale=1" name="viewport"/>
<title>${escapeHtml(content.title)}</title>
<meta content="${escapeHtml(content.metaDescription)}" name="description"/>
<link href="../assets/brand/wmc-brand-mark.webp" rel="icon"/>
<link href="../assets/brand/wmc-brand-mark.webp" rel="apple-touch-icon"/>
<link href="https://fonts.googleapis.com" rel="preconnect"/>
<link crossorigin="" href="https://fonts.gstatic.com" rel="preconnect"/>
<link href="https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&amp;family=Inter:wght@400;500;600&amp;display=swap" rel="stylesheet"/>
<link href="../styles.css" rel="stylesheet"/>
<link href="${pageUrl}" rel="canonical"/>
<meta content="index,follow,max-image-preview:large" name="robots"/>
<meta content="website" property="og:type"/>
<meta content="${escapeHtml(content.title)}" property="og:title"/>
<meta content="${escapeHtml(content.metaDescription)}" property="og:description"/>
<meta content="${pageUrl}" property="og:url"/>
<meta content="Woolloongabba Medical Centre" property="og:site_name"/>
<meta content="en_AU" property="og:locale"/>
<meta content="summary_large_image" name="twitter:card"/>
<meta content="${escapeHtml(content.title)}" name="twitter:title"/>
<meta content="${escapeHtml(content.metaDescription)}" name="twitter:description"/>
<script data-schema="medical-organization" type="application/ld+json">${JSON.stringify(medicalClinic)}</script>
<script data-schema="page" type="application/ld+json">${JSON.stringify(graph)}</script>
<script data-schema="navigation-breadcrumb" type="application/ld+json">${JSON.stringify(breadcrumb)}</script>
</head>
<body class="has-persistent-care-actions pe-hub-page">
<a class="skip-link" href="#main">Skip to content</a>
<header>
<div class="shell header-inner">
<a aria-label="Woolloongabba Medical Centre home" class="brand" href="../index.html"><img alt="Healthcare Doctors — Woolloongabba Medical Centre" class="institution-logo-lockup" decoding="async" height="71" src="../assets/brand/healthcare-doctors-woolloongabba-logo.png" width="475"/></a>
<div aria-label="Quick actions" class="mobile-header-actions" role="group"><a aria-label="Call Woolloongabba Medical Centre" class="mobile-header-action mobile-header-call" href="tel:+61732173344">Call</a><a aria-label="Book Appointment" class="mobile-header-action mobile-header-book wmc-book-appointment" data-hotdoc-button="" data-hotdoc-widget="lightbox" href="https://www.hotdoc.com.au/medical-centres/woolloongabba-QLD-4102/t-medicals-woolloongabba-medical-centre/doctors?wp=w_lightbox">Book Appointment</a></div>
<button aria-controls="primary-nav" aria-expanded="false" aria-label="Open navigation menu" class="menu-toggle" type="button">Menu</button>
<div class="header-cta">
<a class="header-phone" href="tel:+61732173344">(07) 3217 3344</a>
<a class="button wmc-book-appointment" data-hotdoc-button="" data-hotdoc-widget="lightbox" href="https://www.hotdoc.com.au/medical-centres/woolloongabba-QLD-4102/t-medicals-woolloongabba-medical-centre/doctors?wp=w_lightbox">Book Appointment</a>
</div>
</div>
<div class="institution-navigation-row">
<nav aria-label="Primary navigation" class="shell" id="primary-nav" data-nav-owner="about" data-nav-is-hub="false" data-nav-route="${escapeHtml(content.path)}"><a href="../services.html" data-nav-key="services">Services</a><a href="../team.html" data-nav-key="team">Our Team</a><a href="../about-us.html" data-nav-key="about" aria-current="location">About Us</a><a href="../patient-information.html" data-nav-key="patient-info">Patient Information</a><a aria-label="Health Advice" href="../knowledge/index.html" data-nav-key="knowledge">Health Advice</a><a href="../updates/index.html" data-nav-key="updates">Updates</a><a href="../contact.html" data-nav-key="contact">Contact</a></nav>
</div>
</header>
<main id="main" tabindex="-1">
<section class="page-hero pe-hero"><div class="shell page-hero-inner">
<p class="eyebrow">What is it actually like to work here?</p>
<h1>${escapeHtml(content.h1)}</h1>
<p class="lede">${escapeHtml(content.lede)}</p>
${honesty}
</div></section>
<div class="breadcrumb-bar"><div class="shell"><nav aria-label="Breadcrumb" class="visible-breadcrumbs"><ol><li><a href="../index.html">Home</a><span aria-hidden="true" class="breadcrumb-separator">›</span></li><li><a href="../about-us.html">About Us</a><span aria-hidden="true" class="breadcrumb-separator">›</span></li><li><span aria-current="page">Practice Experience</span></li></ol></nav><a class="breadcrumb-explore-link" href="#related-pages">Explore related pages</a></div></div>
<div class="shell on-this-page-shell"><nav aria-label="On this page" class="on-this-page pe-on-this-page"><div class="on-this-page-title">On This Page</div><div class="on-this-page-links">${onThisPage}</div></nav><p class="attr-chip-scroll-hint">Swipe sideways for more sections</p></div>
<section class="page-main"><div class="shell page-layout">
<aside aria-label="About Us pages" class="page-nav" id="related-pages"><div class="nav-title">About Us</div><a href="../about-us.html">About Us</a><a href="../philosophy-of-care.html">Our Philosophy</a><a href="../story.html">Our Story</a><a href="../community.html">Our Community</a><a href="../local-healthcare-access.html">Local Healthcare Access</a><a href="../agpal-accreditation.html">Quality &amp; Accreditation</a><a href="../team.html">Our Team</a><a href="../medical-centre-network.html">Medical Centre Network</a><a aria-current="page" class="active" href="practice-experience.html">Practice Experience</a><a href="../join-our-team.html">Join Our Team</a></aside>
<article class="article pe-article" aria-label="Practice experience modules" data-pe-hub="true" data-pe-version="${escapeHtml(content.version)}">
${moduleHtml}
<section class="article-section pe-next">
<h2>Would this practice suit how I want to work?</h2>
<p>You have seen how the day and the team actually work. The natural follow-on is whether that way of practising would suit you — GP Opportunities turns this picture into a fit judgement. Expressions of interest remain with the practice — not a recruitment marketplace.</p>
<p><a class="button" href="../join-our-team.html">Continue to Join Our Team</a></p>
</section>
</article>
</div></section>
</main>
<nav aria-label="Appointment actions" class="persistent-care-actions"><div class="persistent-care-actions-inner"><a class="persistent-care-book wmc-book-appointment" data-hotdoc-button="" data-hotdoc-widget="lightbox" href="https://www.hotdoc.com.au/medical-centres/woolloongabba-QLD-4102/t-medicals-woolloongabba-medical-centre/doctors?wp=w_lightbox">Book Appointment</a><a aria-label="Call Woolloongabba Medical Centre on (07) 3217 3344" class="persistent-care-call" href="tel:+61732173344">Call Clinic</a></div></nav>
<footer>
<div class="shell">
<div class="footer-grid">
<div class="footer-identity">
<div class="footer-brand"><img alt="Healthcare Doctors — Woolloongabba Medical Centre" class="institution-logo-lockup institution-logo-lockup-footer" decoding="async" height="71" loading="lazy" src="../assets/brand/healthcare-doctors-woolloongabba-logo.png" width="475"/></div>
<p>A local practice shaped by continuity, familiarity and long-term relationships.</p>
<div class="footer-contact" aria-label="Practice contact and location">
<a href="mailto:reception@gabbamedicalcentre.com.au">reception@gabbamedicalcentre.com.au</a>
<a href="tel:+61732173344">Call (07) 3217 3344</a>
<span>Fax (07) 3189 4808</span>
<address>468 Vulture Street, Woolloongabba QLD 4102</address>
<div class="footer-contact-links"><a href="../contact.html">Contact &amp; Location</a><a href="https://www.google.com/maps/dir/?api=1&amp;destination=468+Vulture+Street+Woolloongabba+QLD+4102" target="_blank" rel="noopener noreferrer">Get Directions</a></div>
</div>
</div>
<div class="footer-nav"><h3>About the Practice</h3><div class="footer-accordion-content"><a href="../about-us.html">About Us</a><a href="practice-experience.html">Practice Experience</a><a href="../join-our-team.html">Careers</a></div></div>
</div>
<div class="footer-bottom"><span>© <span id="year"></span> Woolloongabba Medical Centre</span></div>
</div>
</footer>
<script src="../site.js" defer></script>
</body>
</html>`;
}
