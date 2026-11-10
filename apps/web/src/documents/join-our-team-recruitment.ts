import type { ClinicBranding } from "@/clinics/branding";
import {
  WMC_RECRUITMENT_CONTACT,
  WMC_RECRUITMENT_OFFER,
  offerCommercialFaqItems,
  offerHourlyMinimumLine,
  renderConfidentialityPanelHtml,
  renderRecruitmentContactHtml,
  renderRecruitmentEvidencePanelHtml,
  resolveRecruitmentContact,
} from "@/recruitment";

const EOI_HREF = "join-our-team/express-interest.html";
const STYLE_BUST = "wmc-gp-recruit-20261106b";
const PORTAL_SCRIPT_BUST = "wmc-gp-readiness-20261110a";
const READINESS_HASH = "#gp-readiness-portal";
const OFFER = WMC_RECRUITMENT_OFFER;
const HOURLY_MINIMUM = offerHourlyMinimumLine(OFFER);

function readinessPortalShell(clinicSlug: string): string {
  return `<!--gp-readiness-portal:start-->
<div id="gp-readiness-portal" class="grp-portal" hidden aria-hidden="true" data-clinic-slug="${escapeHtmlAttr(clinicSlug)}" role="dialog" aria-modal="true" aria-labelledby="grp-title">
<div class="grp-backdrop" id="grp-backdrop"></div>
<div class="grp-dialog" role="document">
<header class="grp-header">
<div>
<p class="grp-eyebrow">Workforce onboarding</p>
<h2 id="grp-title">GP Readiness &amp; Onboarding Portal</h2>
<p class="grp-sub">Prepare suitability, provider-number readiness, website profile content and onboarding information — separate from a confidential discussion request.</p>
</div>
<button type="button" class="grp-close" id="grp-close" aria-label="Close portal">×</button>
</header>
<div class="grp-body" id="grp-body"></div>
</div>
</div>
<!--gp-readiness-portal:end-->`;
}

function renderCommercialFaqHtml(): string {
  const items = offerCommercialFaqItems(OFFER)
    .map(
      (item) => `<details class="gp-recruit-faq-item" id="faq-${escapeHtmlAttr(item.id)}" data-faq-id="${escapeHtmlAttr(item.id)}">
<summary><strong>${escapeHtml(item.question)}</strong></summary>
<p>${escapeHtml(item.answer)}</p>
</details>`,
    )
    .join("");
  return `<section class="gp-recruit-section gp-recruit-commercial-faq" id="understanding-the-opportunity" aria-labelledby="commercial-faq-heading">
<p class="gp-recruit-eyebrow">Commercial FAQ</p>
<h2 id="commercial-faq-heading">Understanding the Opportunity</h2>
<p class="gp-recruit-section-lede">Straight answers to the questions GPs ask before calling. Detailed commercial terms are still confirmed privately with suitable doctors.</p>
<div class="gp-recruit-faq-list">${items}</div>
<p class="gp-recruit-faq-more"><a class="text-link" href="join-our-team/gp-faq.html">See the full GP FAQ →</a></p>
</section>`;
}

function escapeHtmlAttr(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function trustPanel(variant: "light" | "dark" = "light"): string {
  return renderConfidentialityPanelHtml(variant);
}

/**
 * GP recruitment prospectus for join-our-team.html (presentation layer only).
 * Primary conversion: confidential discussion / express interest.
 */
export function refineJoinOurTeamRecruitment(html: string, _branding: ClinicBranding): string {
  const alreadyRefined =
    /data-gp-recruit-layout="true"/i.test(html) || /class="[^"]*\bgp-recruit-hero\b/i.test(html);
  const hasLegacyHero = /class="[^"]*\bcareers-page-hero\b/i.test(html);
  if (!alreadyRefined && !hasLegacyHero) return html;

  const eoiAttr = escapeHtmlAttr(EOI_HREF);

  let next = html;

  if (hasLegacyHero && !alreadyRefined) {
    const landing = buildLandingHtml(eoiAttr);
    next = next.replace(
      /<section\b[^>]*class="[^"]*careers-page-hero[\s\S]*?<\/main>/i,
      `${landing}</main>`,
    );
  } else if (alreadyRefined) {
    // Rebuild landing on re-apply so conversion copy stays current.
    const landing = buildLandingHtml(eoiAttr);
    if (/data-gp-recruit-layout="true"/i.test(next)) {
      next = next.replace(
        /<div\b[^>]*data-gp-recruit-layout="true"[^>]*>[\s\S]*?<\/main>/i,
        `${landing}</main>`,
      );
    } else {
      next = next.replace(
        /<section\b[^>]*class="[^"]*\bgp-recruit-hero\b[\s\S]*?<\/main>/i,
        `${landing}</main>`,
      );
    }
  }

  next = next.replace(/<style\b[^>]*id="wmc-gp-recruitment"[\s\S]*?<\/style>/i, "");
  next = next.replace(/<\/head>/i, `${JOIN_OUR_TEAM_RECRUIT_STYLE}</head>`);

  // styles.min.css via /wmc-cache so Hostinger applies immutable Cache-Control (not static short-circuit).
  next = next.replace(
    /(?:\/wmc-cache\/)?(?:\.\.\/)*styles(?:\.min)?\.css(?:\?[^"]*)?(?=")/g,
    `/wmc-cache/styles.min.css?v=${STYLE_BUST}`,
  );

  // Evidence panel replaces page-directory / journey / on-this-page chrome.
  next = next.replace(/<div\b[^>]*class="[^"]*\bbreadcrumb-bar\b[^"]*"[^>]*>[\s\S]*?<\/div>\s*/i, "");
  next = next.replace(/<div\b[^>]*class="[^"]*\bon-this-page-shell\b[^"]*"[^>]*>[\s\S]*?<\/div>\s*/i, "");
  next = next.replace(
    /<aside\b[^>]*(?:id="related-pages"|class="[^"]*\bpage-nav\b[^"]*"|data-ev-journey-nav="true")[^>]*>[\s\S]*?<\/aside>/gi,
    "",
  );

  next = next.replace(
    /(<a class="persistent-care-book"[^>]*>)(?:Express Interest|Request a Confidential Discussion|Discuss Confidentially|Discuss)(<\/a>)/i,
    `$1Discuss$2`,
  );
  next = next.replace(
    /(<a class="persistent-care-call"[^>]*>)(?:Call about joining|Call Recruitment Contact|Call Roshan Samarawickrema)(<\/a>)/i,
    `$1Call about joining$2`,
  );

  // Keep AGPAL + bulk-billing marks in footer trust (patient-info scale).
  next = next.replace(
    /<div\b[^>]*class="[^"]*\bfooter-trust\b[^"]*"[^>]*>[\s\S]*?<\/div>/i,
    `<div class="footer-trust">
<a href="agpal-accreditation.html"><img alt="Accredited General Practice" data-local-asset="agpal-mark" decoding="async" height="112" loading="lazy" src="assets/brand/agpal-mark.webp?v=20261106a" width="112"/></a>
<a href="bulk-billing.html"><img alt="Medicare Bulk Billing Practice" decoding="async" height="112" loading="lazy" src="assets/brand/bulk-billing-practice.png" width="112"/></a>
</div>`,
  );

  const clinicSlug = escapeHtmlAttr(_branding.clinicSlug || "woolloongabba");
  next = next.replace(/<!--gp-readiness-portal:start-->[\s\S]*?<!--gp-readiness-portal:end-->\s*/i, "");
  next = next.replace(
    /\s*<script\b[^>]*src="[^"]*attraction-tools\/gp-readiness-portal\.js[^"]*"[^>]*>\s*<\/script>\s*/gi,
    "",
  );
  next = next.replace(
    /\s*<\/body>/i,
    `\n${readinessPortalShell(clinicSlug)}
<script src="attraction-tools/gp-readiness-portal.js?v=${PORTAL_SCRIPT_BUST}" defer data-clinic-slug="${clinicSlug}"></script>
</body>`,
  );

  return next;
}

const EOI_FOCUS_STYLE = `<style id="wmc-eoi-focus">
body[data-eoi-focus="true"] .page-layout{display:block;max-width:40rem;margin:0 auto}
body[data-eoi-focus="true"] .page-nav,
body[data-eoi-focus="true"] #related-pages,
body[data-eoi-focus="true"] .on-this-page-shell,
body[data-eoi-focus="true"] .attraction-next-step,
body[data-eoi-focus="true"] .footer-nav-explore,
body[data-eoi-focus="true"] .persistent-care-actions{display:none!important}
body[data-eoi-focus="true"] .eoi-focus-hero{padding:1.75rem 0 1rem}
body[data-eoi-focus="true"] .eoi-focus-hero .lede{display:none}
body[data-eoi-focus="true"] .eoi-focus-stack{display:grid;gap:1.25rem}
body[data-eoi-focus="true"] .eoi-focus-stack .gp-recruit-contact-card,
body[data-eoi-focus="true"] .eoi-focus-stack .gp-recruit-trust-panel{
  margin:0;padding:1.15rem 1.2rem;border:1px solid rgba(22,61,104,.12);border-radius:16px;background:#f7fbfb
}
body[data-eoi-focus="true"] #eoi-form{margin:0}
body[data-eoi-focus="true"] .attraction-eoi-climax,
body[data-eoi-focus="true"] .join-journey-band--climax{all:unset;display:contents}
</style>`;

/**
 * Express Interest enquiry stage only:
 * Named contact → Confidentiality → Form → Submit.
 * Strip journey maze, explore rails, readiness links, and next-step reading.
 */
export function refineExpressInterestFriction(
  html: string,
  branding: Partial<ClinicBranding> = {},
): string {
  if (!/<form\b[^>]*id="eoi-form"/i.test(html)) return html;

  let next = html;

  next = next.replace(/<style\b[^>]*id="wmc-eoi-focus"[\s\S]*?<\/style>\s*/i, "");
  next = next.replace(/<\/head>/i, `${EOI_FOCUS_STYLE}</head>`);

  next = next.replace(/<body\b([^>]*)>/i, (_m, attrs: string) => {
    let a = attrs;
    if (!/data-eoi-focus=/i.test(a)) a += ' data-eoi-focus="true"';
    if (!/\bclass="/i.test(a)) a += ' class="eoi-focus-page"';
    else if (!/\beoi-focus-page\b/i.test(a)) a = a.replace(/\bclass="/i, 'class="eoi-focus-page ');
    return `<body${a}>`;
  });

  next = next.replace(/<aside\b[^>]*(?:id="related-pages"|class="[^"]*\bpage-nav\b[^"]*")[^>]*>[\s\S]*?<\/aside>/gi, "");
  next = next.replace(/<div\b[^>]*class="[^"]*\bon-this-page-shell\b[^"]*"[^>]*>[\s\S]*?<\/div>/gi, "");
  next = next.replace(/<section\b[^>]*(?:class="[^"]*\battraction-next-step\b|data-attraction-next)[^>]*>[\s\S]*?<\/section>/gi, "");
  next = next.replace(/<div\b[^>]*class="[^"]*\bfooter-nav-explore\b[^"]*"[^>]*>[\s\S]*?<\/div>/gi, "");
  next = next.replace(/<nav\b[^>]*class="[^"]*\bpersistent-care-actions\b[^"]*"[^>]*>[\s\S]*?<\/nav>/gi, "");

  next = next.replace(
    /<section\b[^>]*class="[^"]*\bpage-hero\b[^"]*"[^>]*>[\s\S]*?<\/section>/i,
    `<section class="page-hero page-hero--conversion eoi-focus-hero"><div class="shell page-hero-inner">
<p class="eyebrow">Confidential GP enquiry</p>
<h1>Request a confidential discussion</h1>
</div></section>`,
  );

  const slimForm = `<form id="eoi-form" class="attraction-tool-panel" data-clinic-slug="${
    /data-clinic-slug="([^"]+)"/i.exec(next)?.[1] ?? "woolloongabba"
  }">
<div class="eoi-field-grid">
<label><span class="attr-field-label">Name</span><input name="name" required autocomplete="name"/></label>
<label><span class="attr-field-label">Mobile</span><input name="phone" type="tel" required autocomplete="tel" inputmode="tel"/></label>
<label><span class="attr-field-label">Email</span><input name="email" type="email" required autocomplete="email"/></label>
<label><span class="attr-field-label">Preferred contact method</span>
<select name="preferredContact" required>
<option value="">Select…</option>
<option value="phone">Phone call</option>
<option value="email">Email</option>
<option value="callback">Callback at a convenient time</option>
</select>
</label>
</div>
<label><span class="attr-field-label">Optional message</span><span class="ev-hint">Anything helpful — or leave blank.</span><textarea name="availabilityNotes" rows="3"></textarea></label>
<button class="button" type="submit">Request a Confidential Discussion</button>
</form>`;

  const contact = renderRecruitmentContactHtml(
    resolveRecruitmentContact(branding, "#eoi-form"),
  );
  const confidentiality = renderConfidentialityPanelHtml("light");
  const resultBlock = /<div\b[^>]*id="eoi-result"[^>]*>[\s\S]*?<\/div>/i.exec(next)?.[0] ??
    '<div id="eoi-result" hidden></div>';

  next = next.replace(/<aside\b[^>]*data-recruitment-contact="true"[^>]*>[\s\S]*?<\/aside>/gi, "");
  next = next.replace(/<aside\b[^>]*data-recruitment-confidentiality="true"[^>]*>[\s\S]*?<\/aside>/gi, "");
  next = next.replace(
    /<div\b[^>]*class="shell"[^>]*>\s*<aside\b[^>]*data-recruitment-contact="true"[\s\S]*?<\/aside>\s*<\/div>/gi,
    "",
  );

  const stack = `<section class="article-section eoi-focus-stack" id="express-interest" data-eoi-focus-stack="true">
${contact}
${confidentiality}
${slimForm}
${resultBlock}
</section>`;

  if (/<article\b[^>]*data-ev-article/i.test(next)) {
    next = next.replace(
      /(<article\b[^>]*data-ev-article[^>]*>)[\s\S]*?(<\/article>)/i,
      `$1${stack}$2`,
    );
  } else if (/<form\b[^>]*id="eoi-form"/i.test(next)) {
    next = next.replace(/<form\b[^>]*id="eoi-form"[\s\S]*?<\/form>/i, `${stack}`);
  }

  return next;
}

function buildLandingHtml(eoi: string): string {
  const recruit = resolveRecruitmentContact(undefined, eoi);
  const phoneTel = escapeHtmlAttr(recruit.phoneTel);
  const contact = renderRecruitmentContactHtml(recruit);
  const evidencePanel = renderRecruitmentEvidencePanelHtml({
    eoiHref: eoi,
    opportunityHref: "#current-opportunities",
  });
  return `<div class="shell gp-recruit-layout" data-gp-recruit-layout="true">
<div class="gp-recruit-hero-band">
<section class="gp-recruit-hero" id="top">
<div class="gp-recruit-hero-inner">
<div class="gp-recruit-hero-copy">
<p class="gp-recruit-eyebrow">GP Opportunities · Woolloongabba Medical Centre</p>
<h1>A Supported VR GP Role at an Established Inner-South Practice.</h1>
<p class="gp-recruit-lede">Join an ${OFFER.agpalAccredited ? "AGPAL-accredited" : "established"} Brisbane medical centre with HotDoc and phone booking already in place, nursing and reception support on session, and an established patient community at ${escapeHtml(OFFER.streetAddress)}.</p>
<p class="gp-recruit-confidence">No CV required for an initial discussion. All enquiries remain strictly confidential.</p>
<ul class="gp-recruit-trust" aria-label="Practice highlights">
<li><span aria-hidden="true">✓</span>${OFFER.agpalAccredited ? "AGPAL Accredited" : "Accredited Practice"}</li>
${OFFER.openSevenDays ? `<li><span aria-hidden="true">✓</span>Open 7 Days</li>` : ""}
<li><span aria-hidden="true">✓</span>HotDoc + phone booking in place</li>
<li><span aria-hidden="true">✓</span>100% Medicare Bulk Billing</li>
</ul>
<div class="gp-recruit-hero-convert">
<div class="gp-recruit-actions gp-recruit-actions--inline">
<a class="button gp-recruit-primary" href="${READINESS_HASH}" data-gp-readiness-open="true">GP Readiness &amp; Onboarding Portal</a>
<a class="button button-secondary gp-recruit-secondary" href="${eoi}">Request a Confidential Discussion</a>
<a class="button button-secondary gp-recruit-secondary" href="tel:${phoneTel}">Call About Joining</a>
</div>
</div>
</div>
<div class="gp-recruit-hero-aside">
<figure class="gp-recruit-hero-visual">
<img alt="Woolloongabba Medical Centre on Vulture Street" decoding="async" fetchpriority="high" height="941" src="assets/hero-final-desktop.webp" width="1672"/>
</figure>
</div>
</div>
</section>

<aside class="gp-recruit-hero-aside-card gp-recruit-opportunity-follow" aria-label="Hero opportunity summary">
<div class="gp-recruit-opportunity-follow-copy">
<p class="gp-recruit-eyebrow">Current opportunity</p>
<p class="gp-recruit-hero-aside-title">VR General Practitioner</p>
<ul class="gp-recruit-hero-aside-facts">
<li>Flexible consulting sessions</li>
<li>Woolloongabba · Brisbane</li>
<li>Nursing &amp; reception support</li>
<li>${OFFER.agpalAccredited ? "AGPAL Accredited" : "Accredited Practice"}</li>
</ul>
</div>
<div class="gp-recruit-hero-aside-actions">
<a class="button button-secondary gp-recruit-secondary" href="#current-opportunities">View Opportunity</a>
<a class="text-link" href="${eoi}">Request callback →</a>
</div>
</aside>
</div>
${evidencePanel}
<div class="gp-recruit-main">
<section class="gp-recruit-section gp-recruit-commercial" id="commercial-opportunity" aria-labelledby="commercial-heading">
<article class="gp-recruit-commercial-card">
<p class="gp-recruit-eyebrow">Commercial terms</p>
<h2 id="commercial-heading">Know the Model in Seconds</h2>
<div class="gp-recruit-commercial-grid" role="list">
<div role="listitem"><p class="gp-recruit-stat-value gp-recruit-stat-value--xl">${escapeHtml(OFFER.billingPercentage)}</p><p class="gp-recruit-stat-label">Billings</p></div>
${HOURLY_MINIMUM ? `<div role="listitem"><p class="gp-recruit-stat-value">${escapeHtml(OFFER.hourlyGuarantee)}</p><p class="gp-recruit-stat-label">Minimum Guarantee</p></div>` : ""}
<div role="listitem"><p class="gp-recruit-stat-value">${OFFER.negotiable ? "Negotiable" : "Fixed"}</p><p class="gp-recruit-stat-label">Arrangements</p></div>
<div role="listitem"><p class="gp-recruit-stat-value">Flexible</p><p class="gp-recruit-stat-label">Consulting sessions</p></div>
</div>
</article>
</section>

<section class="gp-recruit-section gp-recruit-snapshot" id="at-a-glance" aria-labelledby="snapshot-heading">
<p class="gp-recruit-eyebrow">Practice scale</p>
<h2 id="snapshot-heading">At a Glance</h2>
<div class="gp-recruit-stat-grid" role="list">
<article class="gp-recruit-stat" role="listitem"><p class="gp-recruit-stat-value">${escapeHtml(OFFER.activePatientFiles)}</p><p class="gp-recruit-stat-label">Active Patient Files</p></article>
<article class="gp-recruit-stat" role="listitem"><p class="gp-recruit-stat-value">${OFFER.consultRooms}</p><p class="gp-recruit-stat-label">Consult Rooms</p></article>
<article class="gp-recruit-stat" role="listitem"><p class="gp-recruit-stat-value">${OFFER.gps}</p><p class="gp-recruit-stat-label">GPs on Roster</p></article>
<article class="gp-recruit-stat" role="listitem"><p class="gp-recruit-stat-value">${OFFER.nurses}</p><p class="gp-recruit-stat-label">Nurses on Roster</p></article>
</div>
</section>

<section class="gp-recruit-section gp-recruit-demand" id="why-demand-exists" aria-labelledby="demand-heading">
<p class="gp-recruit-eyebrow">Evidence</p>
<h2 id="demand-heading">Why Demand Exists</h2>
<ul class="gp-recruit-evidence" role="list">
<li role="listitem"><strong>${OFFER.activePatientFiles} active patient files</strong> — an established patient community already on the books.</li>
<li role="listitem"><strong>Clinical mix in place</strong> — family medicine, chronic disease management, women’s health and men’s health.</li>
<li role="listitem"><strong>${OFFER.gps} GPs currently consulting</strong> within the practice roster.</li>
<li role="listitem"><strong>Appointment demand across the week</strong>${OFFER.openSevenDays ? " — including evenings and weekends (open 7 days)." : "."}</li>
<li role="listitem"><strong>Sessions without starting from zero</strong> — join an existing patient base rather than building awareness first.</li>
</ul>
</section>

<section class="gp-recruit-differentiator" id="why-different" aria-labelledby="different-heading">
<article class="gp-recruit-differentiator-card">
<div class="gp-recruit-differentiator-copy">
<p class="gp-recruit-eyebrow gp-recruit-eyebrow-light">The difference</p>
<h2 id="different-heading">Demand Is Already On The Books</h2>
<p>${escapeHtml(OFFER.clinicDisplayName)} operates with ${OFFER.activePatientFiles} active patient files, ${OFFER.gps} GPs and ${OFFER.nurses} nurses on roster across ${OFFER.consultRooms} consult rooms${OFFER.openSevenDays ? ", open seven days" : ""}.</p>
<p>Incoming GPs join HotDoc and phone booking pathways into an existing diary — not a greenfield list-building exercise.</p>
</div>
<div class="gp-recruit-differentiator-aside">
<div class="gp-recruit-differentiator-actions">
<a class="button gp-recruit-primary gp-recruit-primary-on-dark" href="${eoi}">Request a Confidential Discussion</a>
<a class="button button-secondary gp-recruit-secondary-on-dark" href="tel:${phoneTel}">Call ${escapeHtml(WMC_RECRUITMENT_CONTACT.name)}</a>
</div>
${trustPanel("dark")}
</div>
</article>
</section>

<section class="gp-recruit-section gp-recruit-vacancies" id="current-opportunities" aria-labelledby="vacancies-heading" data-gp-recruit-vacancies="true">
<p class="gp-recruit-eyebrow">Live roles</p>
<h2 id="vacancies-heading">Current Opportunities</h2>
<p class="gp-recruit-section-lede">Explore current opportunities at ${escapeHtml(OFFER.clinicDisplayName)}.<br/>If a suitable role is not listed today, we welcome confidential expressions of interest.</p>
<!--careers-vacancies:start-->
<div class="gp-recruit-vacancies-block" data-careers-vacancies-root="" data-gp-recruit-vacancies="true">
<div class="gp-recruit-vacancy-grid">
<article class="gp-recruit-vacancy-empty" data-careers-vacancies-empty="true">
<p class="gp-recruit-eyebrow">Current opportunities</p>
<h3>Expressions of Interest Welcome</h3>
<p>While a suitable role may not be advertised today, we welcome confidential enquiries from healthcare professionals interested in future opportunities.</p>
<div class="gp-recruit-vacancy-actions">
<a class="button gp-recruit-primary" href="${eoi}">Register Interest</a>
<a class="button button-secondary" href="${READINESS_HASH}" data-gp-readiness-open="true">Prepare Your Onboarding</a>
</div>
</article>
</div>
</div>
<!--careers-vacancies:end-->
</section>

${renderCommercialFaqHtml()}

<section class="gp-recruit-section" id="why-gps-choose" aria-labelledby="why-heading">
<p class="gp-recruit-eyebrow">Practice fit</p>
<h2 id="why-heading">Why GPs Choose Woolloongabba Medical Centre</h2>
<div class="gp-recruit-card-grid gp-recruit-card-grid-5" role="list">
<article class="gp-recruit-card" role="listitem"><h3>Clinical Independence</h3><p>Consulting style sits with the GP within AHPRA standards and ${OFFER.agpalAccredited ? "AGPAL-aligned" : "accredited"} practice policy.</p></article>
<article class="gp-recruit-card" role="listitem"><h3>Nursing &amp; Admin Support</h3><p>${OFFER.nurses} nurses on roster plus reception workflows that protect consulting time.</p></article>
<article class="gp-recruit-card" role="listitem"><h3>Continuity of Care</h3><p>Return bookings and continuity notes stay with the session — relationships accumulate on the same book.</p></article>
<article class="gp-recruit-card" role="listitem"><h3>Infrastructure</h3><p>${OFFER.consultRooms} consulting rooms, digital clinical systems and HotDoc online booking already in place.</p></article>
<article class="gp-recruit-card" role="listitem"><h3>Inner-South Location</h3><p>${escapeHtml(OFFER.streetAddress)} — near Mater and Princess Alexandra Hospitals, with transport and onsite parking.</p></article>
</div>
<p class="gp-recruit-section-more"><a class="text-link" href="about-us/practice-experience.html">Explore Practice Experience in detail →</a></p>
</section>

<section class="gp-recruit-section gp-recruit-support" id="support-culture" aria-labelledby="support-heading">
<p class="gp-recruit-eyebrow">Support &amp; culture</p>
<h2 id="support-heading">Focus on Patients While We Support the Rest</h2>
<div class="gp-recruit-card-grid gp-recruit-card-grid-5" role="list">
<article class="gp-recruit-card gp-recruit-icon-card" role="listitem"><span class="gp-recruit-icon" aria-hidden="true">✚</span><h3>Nursing Support</h3><p>${OFFER.nurses} nurses on roster for treatment-room pathways, recalls and session cover where appropriate.</p></article>
<article class="gp-recruit-card gp-recruit-icon-card" role="listitem"><span class="gp-recruit-icon" aria-hidden="true">◎</span><h3>Collegiate Environment</h3><p>${OFFER.gps} GPs on roster — colleagues available for clinical discussion and co-management.</p></article>
<article class="gp-recruit-card gp-recruit-icon-card" role="listitem"><span class="gp-recruit-icon" aria-hidden="true">✎</span><h3>Peer Discussion</h3><p>Clinical questions can be raised with colleagues on roster — not a formal training guarantee unless separately agreed.</p></article>
<article class="gp-recruit-card gp-recruit-icon-card" role="listitem"><span class="gp-recruit-icon" aria-hidden="true">★</span><h3>Session Patterns</h3><p>Days and sessions are confirmed against rooms and nursing cover so CPD and leave planning stay practical.</p></article>
<article class="gp-recruit-card gp-recruit-icon-card" role="listitem"><span class="gp-recruit-icon" aria-hidden="true">◇</span><h3>Autonomy</h3><p>Clinical judgement stays with the GP within Australian standards and practice policy.</p></article>
</div>
<p class="gp-recruit-section-more"><a class="text-link" href="join-our-team/practice-support.html">Explore Practice Support in detail →</a></p>
</section>

<section class="gp-recruit-section" id="location" aria-labelledby="location-heading">
<div class="gp-recruit-location">
<figure class="gp-recruit-location-visual">
<img alt="Woolloongabba Medical Centre on Vulture Street" decoding="async" height="941" loading="lazy" src="assets/hero-final-desktop.webp" width="1672"/>
</figure>
<div class="gp-recruit-location-copy">
<p class="gp-recruit-eyebrow">Location</p>
<h2 id="location-heading">Woolloongabba — Brisbane’s Inner-South Healthcare Precinct</h2>
<ul class="gp-recruit-trust gp-recruit-trust-stack" aria-label="Location highlights">
<li><span aria-hidden="true">✓</span>Next to The Gabba stadium</li>
<li><span aria-hidden="true">✓</span>Close to Mater Hospital</li>
<li><span aria-hidden="true">✓</span>Close to Princess Alexandra Hospital</li>
<li><span aria-hidden="true">✓</span>Onsite chemist &amp; radiology</li>
<li><span aria-hidden="true">✓</span>Onsite pathology</li>
<li><span aria-hidden="true">✓</span>Public transport access</li>
<li><span aria-hidden="true">✓</span>Onsite parking</li>
<li><span aria-hidden="true">✓</span>468 Vulture Street, Woolloongabba QLD 4102</li>
</ul>
</div>
</div>
</section>

<section class="gp-recruit-section gp-recruit-team" id="meet-the-team" aria-labelledby="team-heading">
<p class="gp-recruit-eyebrow">Your future colleagues</p>
<h2 id="team-heading">Meet the Team You’ll Be Working Alongside</h2>
<ul class="gp-recruit-team-trust" aria-label="Practice scale">
<li>${OFFER.gps} GPs</li>
<li>${OFFER.nurses} Nurses</li>
${OFFER.agpalAccredited ? "<li>AGPAL Accredited</li>" : ""}
<li>Established Brisbane Practice</li>
${OFFER.openSevenDays ? "<li>Open 7 Days</li>" : ""}
</ul>
<div class="gp-recruit-team-grid" role="list">
<article class="gp-recruit-team-card" role="listitem"><img alt="" class="gp-recruit-team-photo" decoding="async" height="320" loading="lazy" src="assets/team/dr-tanya-goodwill-640.webp" width="320"/><h3>Dr Tanya Goodwill</h3><p class="gp-recruit-team-role">General Practitioner</p><p class="gp-recruit-team-focus">Women’s health · Mental health · Children’s health</p><a class="gp-recruit-team-link" href="doctors/dr-tanya-goodwill.html">View profile</a></article>
<article class="gp-recruit-team-card" role="listitem"><img alt="" class="gp-recruit-team-photo" decoding="async" height="320" loading="lazy" src="assets/team/dr-debra-larkins-640.webp" width="320"/><h3>Dr Debra Larkins</h3><p class="gp-recruit-team-role">General Practitioner</p><p class="gp-recruit-team-focus">Shared antenatal care</p><a class="gp-recruit-team-link" href="doctors/dr-debra-larkins.html">View profile</a></article>
<article class="gp-recruit-team-card" role="listitem"><img alt="" class="gp-recruit-team-photo" decoding="async" height="320" loading="lazy" src="assets/team/dr-anand-singh-640.webp" width="320"/><h3>Dr Anand Singh</h3><p class="gp-recruit-team-role">General Practitioner</p><p class="gp-recruit-team-focus">Children’s health · Women’s health</p><a class="gp-recruit-team-link" href="doctors/dr-anand-singh.html">View profile</a></article>
<article class="gp-recruit-team-card" role="listitem"><img alt="" class="gp-recruit-team-photo" decoding="async" height="320" loading="lazy" src="assets/team/dr-sumita-singh-640.webp" width="320"/><h3>Dr Sumita Singh</h3><p class="gp-recruit-team-role">General Practitioner</p><p class="gp-recruit-team-focus">Women’s health · Mental health</p><a class="gp-recruit-team-link" href="doctors/dr-sumita-singh.html">View profile</a></article>
<article class="gp-recruit-team-card" role="listitem"><img alt="" class="gp-recruit-team-photo" decoding="async" height="320" loading="lazy" src="assets/team/dr-wasantha-hettiarchchi-640.webp" width="320"/><h3>Dr Wasantha Hettiarchchi</h3><p class="gp-recruit-team-role">General Practitioner</p><p class="gp-recruit-team-focus">Diabetes · Men’s health · Women’s health</p><a class="gp-recruit-team-link" href="doctors/dr-wasantha-hettiarchchi.html">View profile</a></article>
<article class="gp-recruit-team-card" role="listitem"><img alt="" class="gp-recruit-team-photo" decoding="async" height="320" loading="lazy" src="assets/team/dr-golnar-mortezaei-640.webp" width="320"/><h3>Dr Golnar Mortezaei</h3><p class="gp-recruit-team-role">General Practitioner</p><p class="gp-recruit-team-focus">Veterans’ health · Chronic disease</p><a class="gp-recruit-team-link" href="doctors/dr-golnar-mortezaei.html">View profile</a></article>
<article class="gp-recruit-team-card" role="listitem"><img alt="" class="gp-recruit-team-photo" decoding="async" height="320" loading="lazy" src="assets/team/dr-james-640.webp" width="320"/><h3>Dr James Chanaka</h3><p class="gp-recruit-team-role">General Practitioner</p><p class="gp-recruit-team-focus">Children’s health · Mental health</p><a class="gp-recruit-team-link" href="doctors/dr-james.html">View profile</a></article>
</div>
<p class="gp-recruit-team-more"><a class="text-link" href="team.html">View the full team →</a></p>
</section>

<section class="gp-recruit-section gp-recruit-voices" id="what-its-like" aria-labelledby="voices-heading">
<p class="gp-recruit-eyebrow">Practice perspectives</p>
<h2 id="voices-heading">What It’s Like Working Here</h2>
<div class="gp-recruit-voice-grid" role="list">
<article class="gp-recruit-voice-card" role="listitem">
<img alt="Dr Tanya Goodwill, General Practitioner" class="gp-recruit-voice-photo" decoding="async" height="320" loading="lazy" src="assets/team/dr-tanya-goodwill-640.webp" width="320"/>
<p class="gp-recruit-voice-role">GP perspective</p>
<blockquote>“The book mixes acute and review work. Continuity is the operating model — notes stay with the session so the next visit has context.”</blockquote>
<p class="gp-recruit-voice-attr">How consulting typically runs here</p>
</article>
<article class="gp-recruit-voice-card gp-recruit-voice-card--text" role="listitem">
<p class="gp-recruit-voice-role">Nursing support</p>
<blockquote>“Pathways prepared before the GP joins change the consult — treatment-room work and recalls that protect consulting time.”</blockquote>
<p class="gp-recruit-voice-attr">How nursing partnership works on session</p>
</article>
<article class="gp-recruit-voice-card" role="listitem">
<img alt="Woolloongabba Medical Centre storefront on Vulture Street" class="gp-recruit-voice-photo" decoding="async" height="1013" loading="lazy" src="assets/location-storefront-polished.webp" width="1800"/>
<p class="gp-recruit-voice-role">Practice operations</p>
<blockquote>“We open conversations when capacity and fit align — not to fill empty rooms.”</blockquote>
<p class="gp-recruit-voice-attr">${escapeHtml(WMC_RECRUITMENT_CONTACT.name)} · ${escapeHtml(WMC_RECRUITMENT_CONTACT.role)}</p>
</article>
</div>
</section>

<section class="gp-recruit-section" id="who-we-seek" aria-labelledby="who-heading">
<p class="gp-recruit-eyebrow">Fit check</p>
<h2 id="who-heading">Is This Opportunity Right For You?</h2>
<p class="gp-recruit-section-lede">You may be a good fit if you:</p>
<ul class="gp-recruit-who-list">
<li><span aria-hidden="true">✓</span> Value continuity of care</li>
<li><span aria-hidden="true">✓</span> Want an established patient base</li>
<li><span aria-hidden="true">✓</span> Enjoy long-term patient relationships</li>
<li><span aria-hidden="true">✓</span> Value clinical autonomy</li>
<li><span aria-hidden="true">✓</span> Prefer a collaborative team environment</li>
</ul>
</section>

<section class="gp-recruit-final" id="confidential-conversation" aria-labelledby="final-heading">
<div class="gp-recruit-final-inner">
<div class="gp-recruit-final-copy">
<p class="gp-recruit-eyebrow gp-recruit-eyebrow-light">Private invitation</p>
<h2 id="final-heading">Let’s Have a Confidential Conversation</h2>
<p class="gp-recruit-final-sub">Whether you’re actively considering a change or simply exploring future opportunities, we’d welcome a confidential discussion about practising at ${escapeHtml(OFFER.clinicDisplayName)}.</p>
<ul class="gp-recruit-final-trust" aria-label="Confidential discussion assurances">
${OFFER.agpalAccredited ? `<li><span aria-hidden="true">✓</span>AGPAL Accredited</li>` : ""}
<li><span aria-hidden="true">✓</span>No CV required</li>
<li><span aria-hidden="true">✓</span>Confidential discussion</li>
</ul>
<div class="gp-recruit-final-next">
<p class="gp-recruit-final-next-label">What happens next</p>
<ol class="gp-recruit-final-steps">
<li>Share a short confidential enquiry — no CV required.</li>
<li>${escapeHtml(WMC_RECRUITMENT_CONTACT.name)} responds personally.</li>
<li>Discuss sessions, commercial fit and start timing privately.</li>
</ol>
</div>
</div>
<div class="gp-recruit-final-aside">
${contact}
<div class="gp-recruit-actions gp-recruit-final-actions gp-recruit-actions--inline">
<a class="button gp-recruit-primary gp-recruit-primary-on-dark" href="${READINESS_HASH}" data-gp-readiness-open="true">GP Readiness &amp; Onboarding Portal</a>
<a class="button button-secondary gp-recruit-secondary-on-dark" href="${eoi}">Request a Confidential Discussion</a>
<a class="button button-secondary gp-recruit-secondary-on-dark" href="tel:${phoneTel}">Call ${escapeHtml(WMC_RECRUITMENT_CONTACT.name)}</a>
</div>
${trustPanel("dark")}
</div>
</div>
</section>
</div>
</div>`;
}

const JOIN_OUR_TEAM_RECRUIT_STYLE = `<style id="wmc-gp-recruitment">
body[data-attraction-surface] .gp-recruit-layout,
body .gp-recruit-layout{
  --gp-navy:#163D68;
  --gp-teal:#007A87;
  --gp-green:#008B6D;
  --gp-mist:#F4F7F7;
  --gp-warm:#F7F9FA;
}
.gp-recruit-layout{
  --gp-recruit-pad-x:clamp(1rem,2.8vw,1.75rem);
  display:grid;gap:18px;padding-top:18px;padding-bottom:28px;align-items:start;
  width:min(calc(100% - 32px),var(--max,1320px));max-width:100%;min-width:0;
  margin-left:auto;margin-right:auto;overflow-x:clip;box-sizing:border-box;
}
.shell.gp-recruit-layout{
  width:min(calc(100% - 32px),var(--max,1320px))!important;
  margin-left:auto;margin-right:auto;
}
.gp-recruit-hero-band,.gp-recruit-main,.gp-recruit-section,.gp-recruit-hero,.gp-recruit-evidence-panel{
  min-width:0;max-width:100%;box-sizing:border-box;
}
.gp-recruit-hero-band{display:grid;gap:0}
.gp-recruit-main{display:grid;gap:0}
.gp-recruit-section{width:100%}
.gp-recruit-evidence-panel{
  display:grid;gap:8px;margin:0;
}
.gp-recruit-evidence-block{
  padding:.75rem .85rem;border-radius:14px;border:1px solid rgba(22,61,104,.12);
  background:#fff;box-shadow:0 6px 18px rgba(22,61,104,.06);
}
.gp-recruit-evidence-block--trust{
  background:linear-gradient(180deg,#f3fbfb,#eef7f8);border-color:rgba(0,122,135,.18);
}
.gp-recruit-evidence-label{
  margin:0 0 .55rem;color:var(--gp-teal);font-size:.75rem;font-weight:700;
  letter-spacing:.06em;text-transform:uppercase;
}
.gp-recruit-evidence-facts{margin:0;padding:0;list-style:none;display:grid;gap:.35rem}
.gp-recruit-evidence-facts li{
  color:var(--gp-navy);font-size:.88rem;font-weight:650;line-height:1.3;
  padding:.2rem 0;border-bottom:1px solid rgba(22,61,104,.06);
}
.gp-recruit-evidence-facts li:last-child{border-bottom:0}
.gp-recruit-evidence-title{
  margin:0 0 .35rem;color:var(--gp-navy);font-size:1rem;font-weight:750;line-height:1.25;
}
.gp-recruit-evidence-meta{margin:0 0 .3rem;color:#4a5d6c;font-size:.86rem;line-height:1.4}
.gp-recruit-evidence-meta span{display:inline-block;min-width:4.5rem;color:#5a6d7a;font-weight:650}
.gp-recruit-evidence-channels{margin:.45rem 0 .65rem;padding:0;list-style:none;display:flex;flex-wrap:wrap;gap:.55rem}
.gp-recruit-evidence-channels a{
  color:var(--gp-teal);font-size:.86rem;font-weight:650;text-decoration:underline;text-underline-offset:3px;
}
.gp-recruit-evidence-link{
  display:inline-flex;align-items:center;margin-top:.35rem;color:var(--gp-teal);
  font-size:.86rem;font-weight:700;text-decoration:underline;text-underline-offset:3px;
}
.gp-recruit-evidence-link--accent{
  margin-top:.15rem;padding:.45rem .7rem;border-radius:10px;background:rgba(0,122,135,.1);
  text-decoration:none;color:var(--gp-teal);
}
.gp-recruit-evidence-link--accent:hover{background:rgba(0,122,135,.16)}
.gp-recruit-evidence-trust{margin:0;padding:0;list-style:none;display:grid;gap:.4rem}
.gp-recruit-evidence-trust li{
  display:flex;gap:.45rem;align-items:flex-start;color:#3f5360;font-size:.84rem;line-height:1.35;font-weight:600;
}
.gp-recruit-evidence-trust li span{color:var(--gp-green);font-weight:700;flex:0 0 auto}
body[data-attraction-surface] .gp-recruit-hero,
body .gp-recruit-hero{
  background:linear-gradient(165deg,#f8f4ef 0%,var(--gp-warm) 45%,#eef4f6 100%);
  padding:16px var(--gp-recruit-pad-x) 14px;color:var(--gp-navy);border-radius:20px;
}
.gp-recruit-hero-inner{display:grid;gap:18px;align-items:start}
.gp-recruit-eyebrow{
  margin:0 0 .45rem;color:var(--gp-teal);font-size:.75rem;font-weight:700;
  letter-spacing:.06em;text-transform:uppercase;
}
.gp-recruit-eyebrow-light{color:#9fd4d8!important}
.gp-recruit-hero h1{
  margin:0 0 .55rem;max-width:20ch;
  font-family:var(--font-display,Libre Baskerville,Georgia,serif);
  font-size:clamp(1.55rem,3.2vw,2.15rem);line-height:1.15;letter-spacing:-.02em;text-wrap:balance;
}
.gp-recruit-lede{margin:0 0 .55rem;max-width:40rem;color:#4a5d6c;font-size:.98rem;line-height:1.5}
.gp-recruit-confidence{
  margin:0 0 .75rem;max-width:36rem;padding:.55rem .75rem;border-radius:12px;
  background:rgba(0,122,135,.08);border:1px solid rgba(0,122,135,.16);
  color:var(--gp-navy);font-size:.88rem;font-weight:650;line-height:1.4;
}
.gp-recruit-trust{display:grid;gap:6px;margin:0 0 .85rem;padding:0;list-style:none}
.gp-recruit-trust li{
  display:flex;gap:.45rem;align-items:flex-start;margin:0;padding:.4rem .6rem;
  border:1px solid rgba(22,61,104,.1);border-radius:10px;background:rgba(255,255,255,.72);
  color:var(--gp-navy);font-size:.84rem;font-weight:650;line-height:1.3;
}
.gp-recruit-trust li span{color:var(--gp-green);font-weight:700}
.gp-recruit-trust-stack{max-width:28rem}
.gp-recruit-hero-convert{display:grid;gap:10px}
.gp-recruit-actions{display:flex;flex-wrap:wrap;gap:10px}
.gp-recruit-primary{
  background:var(--gp-teal)!important;border-color:var(--gp-teal)!important;color:#fff!important;
  font-weight:700!important;box-shadow:0 10px 24px rgba(0,122,135,.22);
}
.gp-recruit-primary:hover{background:#066f7a!important;border-color:#066f7a!important}
.gp-recruit-secondary{font-weight:650!important}
.gp-recruit-hero-aside{display:grid;gap:10px;align-content:start;min-width:0}
.gp-recruit-hero-visual{
  margin:0;overflow:hidden;border-radius:16px;box-shadow:0 12px 32px rgba(22,61,104,.14);
  aspect-ratio:16 / 9;background:#d7e0e6;
}
.gp-recruit-hero-visual img{
  display:block;width:100%;height:100%;object-fit:cover;object-position:50% 42%;
}
.gp-recruit-hero-aside-card{
  padding:.85rem .95rem;border-radius:14px;border:1px solid rgba(22,61,104,.12);
  background:#fff;box-shadow:0 6px 18px rgba(22,61,104,.08);display:grid;gap:.4rem;
}
.gp-recruit-hero-aside-card .gp-recruit-eyebrow{margin:0}
.gp-recruit-hero-aside-title{
  margin:0;color:var(--gp-navy);font-size:.98rem;font-weight:750;line-height:1.25;
}
.gp-recruit-hero-aside-facts{
  margin:0;padding:0;list-style:none;display:grid;grid-template-columns:1fr 1fr;gap:.25rem .65rem;
}
.gp-recruit-hero-aside-facts li{
  position:relative;padding-left:1rem;color:#3f5360;font-size:.82rem;font-weight:650;line-height:1.3;
}
.gp-recruit-hero-aside-facts li::before{
  content:"✓";position:absolute;left:0;color:var(--gp-green);font-weight:700;
}
.gp-recruit-hero-aside-actions{
  display:flex;flex-wrap:wrap;gap:.65rem;align-items:center;margin-top:.15rem;
}
.gp-recruit-hero-aside-actions .text-link{font-size:.86rem;font-weight:650}
.gp-recruit-hero-aside-actions .button{padding:.45rem .85rem;font-size:.86rem}
.gp-recruit-opportunity-follow{
  margin:12px var(--gp-recruit-pad-x) 0;display:grid;gap:.75rem;
}
.gp-recruit-opportunity-follow-copy{display:grid;gap:.4rem;min-width:0}
.gp-recruit-opportunity-follow-copy .gp-recruit-eyebrow{margin:0}
.gp-recruit-section{padding:56px var(--gp-recruit-pad-x)}
.gp-recruit-section h2{
  margin:0 0 1rem;font-family:var(--font-display,Libre Baskerville,Georgia,serif);
  font-size:clamp(1.45rem,2.8vw,2rem);line-height:1.2;color:var(--gp-navy);
}
.gp-recruit-section-lede{margin:0 0 1.35rem;max-width:40rem;color:#4a5d6c;font-size:1.02rem;line-height:1.55}
.gp-recruit-section-more{margin:1.15rem 0 0}
.gp-recruit-section-more .text-link{font-weight:650}
.gp-recruit-commercial{padding-top:20px;padding-bottom:28px}
.gp-recruit-commercial-card{
  padding:1.65rem 1.4rem;border-radius:22px;
  background:linear-gradient(145deg,#102a44 0%,#163D68 48%,#0f4a55 100%);
  color:#fff;box-shadow:0 18px 44px rgba(22,61,104,.24);
}
.gp-recruit-commercial-card .gp-recruit-eyebrow{color:#9fd4d8}
.gp-recruit-commercial-card h2{color:#fff;margin-bottom:1.25rem;font-size:clamp(1.35rem,2.4vw,1.75rem)}
.gp-recruit-commercial-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:0}
.gp-recruit-commercial-grid>div{
  padding:1.15rem 1rem;border-radius:16px;background:rgba(255,255,255,.08);
  border:1px solid rgba(255,255,255,.12);text-align:center;
}
.gp-recruit-commercial-grid .gp-recruit-stat-value{
  color:#fff;font-size:clamp(1.55rem,3vw,2.05rem);letter-spacing:-.02em;
}
.gp-recruit-commercial-grid .gp-recruit-stat-value--xl{
  font-size:clamp(2.2rem,5vw,3rem);color:#9fd4d8;
}
.gp-recruit-commercial-grid .gp-recruit-stat-label{
  color:rgba(255,255,255,.88);font-weight:650;font-size:.88rem;text-transform:uppercase;
  letter-spacing:.04em;
}
.gp-recruit-demand{padding-top:40px;padding-bottom:40px;background:#fff}
.gp-recruit-evidence{margin:0;padding:0;list-style:none;display:grid;gap:12px;max-width:48rem}
.gp-recruit-evidence li{
  padding:1rem 1.1rem;border-left:4px solid var(--gp-teal);border-radius:0 14px 14px 0;
  background:#f3fafb;color:#3f5360;font-size:.98rem;line-height:1.5;
}
.gp-recruit-evidence strong{color:var(--gp-navy)}
.gp-recruit-differentiator{
  padding:28px var(--gp-recruit-pad-x) 36px;
  background:linear-gradient(180deg,#eef5f7 0%,#e6f0f3 100%);
}
.gp-recruit-differentiator-card{
  display:grid;gap:1.35rem;
  padding:clamp(1.75rem,4vw,2.75rem);border-radius:24px;
  background:linear-gradient(155deg,#163D68 0%,#1a5570 48%,#0f5f6c 100%);
  color:#fff;box-shadow:0 18px 44px rgba(22,61,104,.2);
}
.gp-recruit-differentiator-copy{min-width:0}
.gp-recruit-differentiator-aside{min-width:0;display:grid;gap:1rem;align-content:start}
.gp-recruit-differentiator-card h2{
  margin:0 0 1rem;max-width:18ch;color:#fff;
  font-family:var(--font-display,Libre Baskerville,Georgia,serif);
  font-size:clamp(1.85rem,4.2vw,2.85rem);line-height:1.12;letter-spacing:-.02em;
}
.gp-recruit-differentiator-copy>p{
  margin:0 0 .85rem;max-width:40rem;color:rgba(255,255,255,.92);font-size:1.08rem;line-height:1.6;
}
.gp-recruit-differentiator-actions{display:flex;flex-wrap:wrap;gap:10px;margin:0}
.gp-recruit-vacancies{background:var(--gp-mist)}
.gp-recruit-commercial-faq{background:#fff}
.gp-recruit-faq-list{display:grid;gap:10px;max-width:48rem}
.gp-recruit-faq-item{
  border:1px solid rgba(22,61,104,.12);border-radius:14px;background:#f7fbfb;
  padding:0;overflow:hidden;
}
.gp-recruit-faq-item summary{
  cursor:pointer;list-style:none;padding:1rem 1.15rem;color:var(--gp-navy);
  font-size:1.02rem;line-height:1.4;font-weight:650;
}
.gp-recruit-faq-item summary::-webkit-details-marker{display:none}
.gp-recruit-faq-item summary::after{
  content:"+";float:right;color:var(--gp-teal);font-weight:700;font-size:1.15rem;line-height:1;
}
.gp-recruit-faq-item[open] summary::after{content:"–"}
.gp-recruit-faq-item p{
  margin:0;padding:0 1.15rem 1.1rem;color:#3f5360;font-size:.98rem;line-height:1.55;
}
.gp-recruit-faq-more{margin:1.1rem 0 0;font-size:.95rem}
.gp-recruit-vacancies-block{
  display:grid;gap:18px;min-width:0;
  padding-bottom:0;
}
.gp-recruit-vacancy-grid{display:grid;gap:16px;min-width:0}
.gp-recruit-vacancy-location{margin:0;color:rgba(255,255,255,.9);font-size:.95rem;font-weight:650}
.gp-recruit-vacancy-trust{
  display:grid;gap:10px;margin:0;padding:0;list-style:none;min-width:0;
}
.gp-recruit-vacancy-trust li{
  display:flex;gap:.55rem;align-items:flex-start;padding:.85rem 1rem;border-radius:12px;
  background:#fff;border:1px solid rgba(22,61,104,.1);color:var(--gp-navy);font-size:.9rem;font-weight:650;line-height:1.4;
  min-width:0;box-sizing:border-box;
}
.gp-recruit-vacancy-trust li span{color:var(--gp-green);font-weight:700;flex:0 0 auto}
.gp-recruit-vacancies-block .gp-recruit-contact-card{max-width:36rem;box-sizing:border-box}
.gp-recruit-vacancy-card{
  padding:1.45rem 1.4rem 1.5rem;border-radius:18px;border:1px solid rgba(22,61,104,.1);
  background:#fff;box-shadow:0 8px 22px rgba(22,61,104,.06);display:grid;gap:.8rem;
  min-width:0;box-sizing:border-box;overflow-wrap:anywhere;
}
.gp-recruit-vacancy-card h3{
  margin:0;font-size:1.15rem;line-height:1.3;color:var(--gp-navy);overflow-wrap:anywhere;
}
.gp-recruit-vacancy-dept{
  margin:0;color:var(--gp-teal);font-size:.76rem;font-weight:700;letter-spacing:.03em;
  text-transform:uppercase;line-height:1.35;
}
.gp-recruit-vacancy-badges{display:flex;flex-wrap:wrap;gap:8px;margin:0}
.gp-recruit-vacancy-badge{
  display:inline-flex;align-items:center;padding:.4rem .75rem;border-radius:999px;
  background:rgba(0,122,135,.1);color:var(--gp-teal);border:1px solid rgba(0,122,135,.14);
  font-size:.72rem;font-weight:700;letter-spacing:.02em;text-transform:uppercase;line-height:1.2;
  white-space:nowrap;box-sizing:border-box;
}
.gp-recruit-vacancy-meta{margin:0;padding:0;list-style:none;display:grid;gap:.5rem;min-width:0}
.gp-recruit-vacancy-meta li{
  display:grid;grid-template-columns:6.25rem minmax(0,1fr);gap:.55rem;align-items:start;
  color:#3f5360;font-size:.9rem;line-height:1.45;min-width:0;
}
.gp-recruit-vacancy-meta span{display:block;min-width:0;color:#5a6d7a;font-weight:650}
.gp-recruit-vacancy-summary{margin:0;color:#4a5d6c;font-size:.95rem;line-height:1.5;overflow-wrap:anywhere}
.gp-recruit-vacancy-cta,.gp-recruit-vacancy-card > .button{
  justify-self:start;width:auto;max-width:100%;box-sizing:border-box;
}
.gp-recruit-vacancy-card--featured{
  padding:1.75rem 1.65rem 1.7rem;background:linear-gradient(155deg,#102a44 0%,#163D68 55%,#0f4a55 100%);
  color:#fff;border:0;box-shadow:0 18px 44px rgba(22,61,104,.28);gap:.85rem;
}
.gp-recruit-vacancy-card--featured h3,.gp-recruit-vacancy-card--featured .gp-recruit-vacancy-summary{color:#fff}
.gp-recruit-vacancy-card--featured .gp-recruit-vacancy-dept{color:#9fd4d8}
.gp-recruit-vacancy-card--featured .gp-recruit-vacancy-badge{
  background:rgba(255,255,255,.12);color:#fff;border-color:rgba(255,255,255,.18);
}
.gp-recruit-vacancy-featured-label{
  margin:0;color:#9fd4d8;font-size:.72rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;
}
.gp-recruit-vacancy-featured-points{
  margin:0;padding:0;list-style:none;display:grid;gap:.45rem .9rem;
  grid-template-columns:1fr;max-width:40rem;
}
.gp-recruit-vacancy-featured-points li{
  position:relative;padding-left:1.4rem;color:rgba(255,255,255,.92);font-size:.95rem;line-height:1.45;font-weight:600;
}
.gp-recruit-vacancy-featured-points li::before{
  content:"✓";position:absolute;left:0;top:.05rem;color:#9fd4d8;font-weight:700;
}
@media (min-width:701px){
.gp-recruit-vacancy-featured-points{grid-template-columns:1fr 1fr}
}
.gp-recruit-vacancy-empty{
  padding:1.6rem 1.5rem;border-radius:20px;border:1px solid rgba(22,61,104,.12);
  background:linear-gradient(180deg,#fff,#f7fbfb);box-shadow:0 8px 22px rgba(22,61,104,.06);
  box-sizing:border-box;
}
.gp-recruit-vacancy-empty h3{margin:0 0 .65rem;color:var(--gp-navy);font-size:1.35rem}
.gp-recruit-vacancy-empty p{margin:0 0 1rem;color:#4a5d6c;line-height:1.55;max-width:40rem}
@media (min-width:701px){
.gp-recruit-vacancy-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
.gp-recruit-vacancy-card--featured,.gp-recruit-vacancy-empty{grid-column:1 / -1}
.gp-recruit-vacancy-trust{grid-template-columns:repeat(2,minmax(0,1fr))}
}
.gp-recruit-contact-card{
  padding:1.15rem 1.1rem;border-radius:18px;border:1px solid rgba(22,61,104,.12);
  background:#fff;box-shadow:0 8px 22px rgba(22,61,104,.08);
}
.gp-recruit-contact-label{
  margin:0 0 .35rem;color:var(--gp-teal);font-size:.7rem;font-weight:700;
  letter-spacing:.07em;text-transform:uppercase;
}
.gp-recruit-contact-name{margin:0;font-size:1.15rem;font-weight:750;color:var(--gp-navy);line-height:1.25}
.gp-recruit-contact-role{margin:.15rem 0 .55rem;color:#4a5d6c;font-size:.9rem;font-weight:600}
.gp-recruit-contact-note{margin:0 0 .75rem;color:#4a5d6c;font-size:.9rem;line-height:1.45}
.gp-recruit-contact-channels{margin:0;padding:0;list-style:none;display:grid;gap:.45rem}
.gp-recruit-contact-channels a{color:var(--gp-teal);font-weight:650;text-decoration:underline;text-underline-offset:3px;font-size:.92rem}
.gp-recruit-trust-panel{
  padding:1rem 1.05rem;border-radius:16px;border:1px solid rgba(0,122,135,.18);
  background:linear-gradient(180deg,#f3fbfb,#eef7f8);
}
.gp-recruit-trust-panel h3{margin:0 0 .55rem;font-size:.95rem;color:var(--gp-navy)}
.gp-recruit-trust-panel ul{margin:0;padding:0;list-style:none;display:grid;gap:.4rem}
.gp-recruit-trust-panel li{
  position:relative;padding-left:1.1rem;color:#3f5360;font-size:.88rem;line-height:1.4;
}
.gp-recruit-trust-panel li::before{content:"✓";position:absolute;left:0;color:var(--gp-green);font-weight:700}
.gp-recruit-trust-panel--dark{
  background:rgba(255,255,255,.08);border-color:rgba(255,255,255,.18);
}
.gp-recruit-trust-panel--dark h3,.gp-recruit-trust-panel--dark li{color:#fff}
.gp-recruit-trust-panel--dark li::before{color:#9fd4d8}
.gp-recruit-cta-cluster{display:grid;gap:12px}
.gp-recruit-cta-cluster--compact .gp-recruit-actions .button{width:100%;justify-content:center}
.gp-recruit-snapshot{background:var(--gp-mist)}
.gp-recruit-stat-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.gp-recruit-stat{
  padding:1.25rem 1.15rem;border:1px solid rgba(22,61,104,.1);border-radius:18px;
  background:#fff;box-shadow:0 8px 24px rgba(22,61,104,.06);
}
.gp-recruit-stat-value{
  margin:0 0 .35rem;color:var(--gp-teal);
  font-family:var(--font-display,Libre Baskerville,Georgia,serif);
  font-size:clamp(1.6rem,3vw,2.2rem);font-weight:700;line-height:1.1;
}
.gp-recruit-stat-value--demand{font-size:clamp(1.25rem,2.4vw,1.65rem);line-height:1.2}
.gp-recruit-stat--demand{grid-column:1 / -1}
.gp-recruit-stat-label{margin:0;color:#4a5d6c;font-size:.92rem;font-weight:650;line-height:1.35}
.gp-recruit-stat-label span{display:block;margin-top:.2rem;font-size:.78rem;font-weight:500}
.gp-recruit-stat--demand .gp-recruit-stat-label{font-weight:500;max-width:42rem}
.gp-recruit-card-grid{display:grid;gap:14px}
.gp-recruit-card{
  padding:1.25rem 1.2rem;border:1px solid rgba(22,61,104,.1);border-radius:18px;
  background:linear-gradient(180deg,#fff,#f7fbfb);box-shadow:0 6px 20px rgba(22,61,104,.05);
}
.gp-recruit-card h3{margin:0 0 .55rem;font-size:1.05rem;line-height:1.3}
.gp-recruit-card p{margin:0;color:#4a5d6c;font-size:.95rem;line-height:1.55}
.gp-recruit-icon-card .gp-recruit-icon{
  display:inline-flex;align-items:center;justify-content:center;width:2rem;height:2rem;
  margin-bottom:.65rem;border-radius:999px;background:rgba(0,122,135,.1);color:var(--gp-teal);font-size:.95rem;
}
.gp-recruit-clinical{background:#f8fafb}
.gp-recruit-split{display:grid;gap:22px;align-items:start}
.gp-recruit-checklist{margin:1rem 0 0;padding:0;list-style:none}
.gp-recruit-checklist li{position:relative;margin:0 0 .55rem;padding-left:1.35rem;color:#4a5d6c;line-height:1.45}
.gp-recruit-checklist li::before{content:"✓";position:absolute;left:0;color:var(--gp-green);font-weight:700}
.gp-recruit-callout{
  padding:1.5rem 1.35rem;border-radius:20px;
  background:linear-gradient(160deg,var(--gp-navy),#0f4a55);color:#fff;
  box-shadow:0 16px 40px rgba(22,61,104,.22);
}
.gp-recruit-callout-label{
  margin:0 0 .65rem;color:#9fd4d8;font-size:.72rem;font-weight:700;
  letter-spacing:.08em;text-transform:uppercase;
}
.gp-recruit-callout h3{
  margin:0 0 .75rem;font-family:var(--font-display,Libre Baskerville,Georgia,serif);
  font-size:1.35rem;line-height:1.25;color:#fff;
}
.gp-recruit-callout>p{margin:0 0 .85rem;font-size:1.02rem;line-height:1.5}
.gp-recruit-callout-list{margin:0 0 1rem;padding:0;list-style:none}
.gp-recruit-callout-list li{position:relative;margin:0 0 .4rem;padding-left:1.15rem;font-size:.95rem;line-height:1.4}
.gp-recruit-callout-list li::before{content:"✓";position:absolute;left:0;color:#9fd4d8;font-weight:700}
.gp-recruit-callout-note{
  margin:0 0 1rem!important;padding:.85rem .95rem;border-radius:12px;
  background:rgba(255,255,255,.1);font-size:.95rem!important;line-height:1.45;font-weight:600;
}
.gp-recruit-callout .gp-recruit-contact-card{display:none}
.gp-recruit-callout .gp-recruit-trust-panel--dark{margin-top:.25rem}
.gp-recruit-mini-list{margin:0;padding:0;list-style:none;color:#4a5d6c}
.gp-recruit-mini-list li{position:relative;margin:0 0 .45rem;padding-left:1.1rem;line-height:1.4}
.gp-recruit-mini-list li::before{content:"•";position:absolute;left:0;color:var(--gp-teal);font-weight:700}
.gp-recruit-support{background:var(--gp-mist)}
.gp-recruit-location{display:grid;gap:22px;align-items:center}
/* Mobile-first: storefront visual before the location heading/copy */
.gp-recruit-location-visual{margin:0;order:1;overflow:hidden;border-radius:20px;box-shadow:0 12px 32px rgba(22,61,104,.1)}
.gp-recruit-location-copy{order:2;min-width:0}
.gp-recruit-location-visual img{display:block;width:100%;height:auto;object-fit:cover}
.gp-recruit-team{background:#fff}
.gp-recruit-team-trust{
  display:flex;flex-wrap:wrap;gap:8px;margin:0 0 1.35rem;padding:0;list-style:none;
}
.gp-recruit-team-trust li{
  padding:.45rem .75rem;border-radius:999px;border:1px solid rgba(22,61,104,.12);
  background:#f3fafb;color:var(--gp-navy);font-size:.84rem;font-weight:700;
}
.gp-recruit-team-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.gp-recruit-team-card{
  display:flex;flex-direction:column;padding:1rem;border:1px solid rgba(22,61,104,.1);
  border-radius:18px;background:#fff;box-shadow:0 6px 18px rgba(22,61,104,.05);
}
.gp-recruit-team-photo{
  /* height:auto beats HTML height=320 so aspect-ratio stays square in 5-col laptop grid */
  width:100%;height:auto;aspect-ratio:1;margin-bottom:.85rem;border-radius:14px;
  object-fit:cover;object-position:center 18%;background:#d7e0e6;
}
.gp-recruit-team-card h3{margin:0 0 .25rem;font-size:1rem}
.gp-recruit-team-role{margin:0 0 .35rem;color:var(--gp-teal);font-size:.78rem;font-weight:700}
.gp-recruit-team-focus{margin:0 0 .75rem;color:#4a5d6c;font-size:.86rem;line-height:1.4;flex:1}
.gp-recruit-team-link{color:var(--gp-teal);font-size:.86rem;font-weight:650;text-decoration:underline;text-underline-offset:3px}
.gp-recruit-team-more{margin:1.25rem 0 0}
.gp-recruit-voices{background:var(--gp-mist)}
.gp-recruit-voice-grid{display:grid;gap:14px}
.gp-recruit-voice-card{
  padding:1.15rem;border-radius:18px;border:1px solid rgba(22,61,104,.1);
  background:#fff;box-shadow:0 6px 18px rgba(22,61,104,.05);
}
.gp-recruit-voice-card--text{
  display:flex;flex-direction:column;justify-content:center;
  min-height:12rem;background:linear-gradient(180deg,#fff,#f3fafb);
}
.gp-recruit-voice-photo{
  width:72px;height:72px;margin:0 0 .75rem;border-radius:999px;
  object-fit:cover;object-position:center 18%;background:#d7e0e6;
}
.gp-recruit-voice-role{margin:0 0 .45rem;color:var(--gp-teal);font-size:.72rem;font-weight:700;letter-spacing:.06em;text-transform:uppercase}
.gp-recruit-voice-card blockquote{
  margin:0 0 .65rem;color:var(--gp-navy);font-family:var(--font-display,Libre Baskerville,Georgia,serif);
  font-size:1.05rem;line-height:1.45;
}
.gp-recruit-voice-attr{margin:0;color:#5a6d7a;font-size:.84rem;font-weight:600}
.gp-recruit-who-list{display:grid;gap:10px;margin:1rem 0 0;padding:0;list-style:none;max-width:40rem}
.gp-recruit-who-list li{
  display:flex;gap:.55rem;padding:1rem 1.1rem;border-left:4px solid var(--gp-teal);
  border-radius:0 12px 12px 0;background:#f3fafb;color:var(--gp-navy);font-weight:650;line-height:1.4;
}
.gp-recruit-who-list li span{color:var(--gp-green);flex:0 0 auto}
.gp-recruit-final{
  margin:8px var(--gp-recruit-pad-x) 1.25rem;padding:clamp(1.35rem,3vw,2rem);
  padding-bottom:calc(clamp(1.35rem,3vw,2rem) + 5.75rem);
  border-radius:22px;color:#fff;
  background:linear-gradient(160deg,#163D68 0%,#1a5570 52%,#0f5f6c 100%);
  box-shadow:0 18px 44px rgba(22,61,104,.22);
  box-sizing:border-box;min-width:0;max-width:100%;overflow:hidden;
}
.gp-recruit-final-inner{display:grid;gap:1.25rem;min-width:0;max-width:100%;width:100%;box-sizing:border-box}
.gp-recruit-final-copy,.gp-recruit-final-aside{
  min-width:0;max-width:100%;display:grid;gap:1rem;align-content:start;box-sizing:border-box;
}
.gp-recruit-final .gp-recruit-eyebrow{margin-bottom:.15rem}
.gp-recruit-final h2{
  margin:0;color:#fff;max-width:18ch;text-wrap:balance;
  font-family:var(--font-display,Libre Baskerville,Georgia,serif);
  font-size:clamp(1.55rem,2.8vw,2.15rem);line-height:1.2;letter-spacing:-.015em;
}
.gp-recruit-final-sub{
  margin:0;color:rgba(255,255,255,.92);font-size:1rem;line-height:1.55;max-width:38rem;
}
.gp-recruit-final-trust{
  display:flex;flex-wrap:wrap;gap:8px;margin:0;padding:0;list-style:none;
}
.gp-recruit-final-trust li{
  padding:.4rem .65rem;border-radius:999px;background:rgba(255,255,255,.1);
  border:1px solid rgba(255,255,255,.16);font-size:.8rem;font-weight:650;line-height:1.25;
  white-space:nowrap;
}
.gp-recruit-final-next{
  margin-top:.25rem;padding:1rem 1.05rem;border-radius:14px;
  background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);
}
.gp-recruit-final-next-label{
  margin:0 0 .55rem;color:#9fd4d8;font-size:.72rem;font-weight:700;
  letter-spacing:.08em;text-transform:uppercase;
}
.gp-recruit-final-steps{
  margin:0;padding:0 0 0 1.15rem;display:grid;gap:.4rem;color:rgba(255,255,255,.9);
  font-size:.9rem;line-height:1.45;font-weight:600;
}
body[data-attraction-surface] .footer-trust,
body .footer-trust{
  display:flex!important;flex-wrap:wrap;align-items:center;gap:14px;margin-top:16px;
}
body[data-attraction-surface] .footer-trust a,
body .footer-trust a{display:inline-flex;line-height:0}
body[data-attraction-surface] .footer-trust img,
body .footer-trust img{
  width:112px!important;height:112px!important;max-width:112px!important;max-height:112px!important;
  object-fit:contain!important;background:#fff!important;border-radius:10px!important;padding:6px;box-sizing:border-box;
}
.gp-recruit-final-actions{margin-top:.15rem;width:100%;max-width:100%;min-width:0;box-sizing:border-box}
.gp-recruit-final-actions .button{justify-content:center;max-width:100%;box-sizing:border-box}
.gp-recruit-final .gp-recruit-contact-card,
.gp-recruit-final .gp-recruit-trust-panel{
  min-width:0;max-width:100%;width:100%;box-sizing:border-box;overflow-wrap:anywhere;word-break:normal;
}
.gp-recruit-final .gp-recruit-contact-card{
  background:rgba(255,255,255,.08);border-color:rgba(255,255,255,.16);color:#fff;
}
.gp-recruit-final .gp-recruit-contact-label{color:#9fd4d8}
.gp-recruit-final .gp-recruit-contact-name,.gp-recruit-final .gp-recruit-contact-role,
.gp-recruit-final .gp-recruit-contact-note{color:#fff;overflow-wrap:anywhere;max-width:100%}
.gp-recruit-final .gp-recruit-contact-channels,
.gp-recruit-final .gp-recruit-trust-panel ul,
.gp-recruit-final .gp-recruit-trust-panel li{min-width:0;max-width:100%;overflow-wrap:anywhere}
.gp-recruit-final .gp-recruit-contact-channels a{color:#9fd4d8}
.gp-recruit-final .gp-recruit-trust-panel{margin:0}
.gp-recruit-primary-on-dark{background:#fff!important;color:var(--gp-navy)!important;border-color:#fff!important}
.gp-recruit-secondary-on-dark{
  background:transparent!important;color:#fff!important;border:1.5px solid rgba(255,255,255,.7)!important;
}
@media (min-width:701px){
.gp-recruit-stat-grid{grid-template-columns:repeat(3,minmax(0,1fr))}
.gp-recruit-card-grid-3{grid-template-columns:repeat(3,minmax(0,1fr))}
.gp-recruit-card-grid-5{grid-template-columns:repeat(2,minmax(0,1fr))}
.gp-recruit-team-grid{grid-template-columns:repeat(3,minmax(0,1fr))}
.gp-recruit-commercial-grid{grid-template-columns:repeat(4,minmax(0,1fr))}
.gp-recruit-split{grid-template-columns:1.15fr .85fr;gap:28px}
.gp-recruit-location{grid-template-columns:minmax(0,1fr) minmax(0,1.1fr);gap:28px}
.gp-recruit-location-copy{order:1}
.gp-recruit-location-visual{order:2}
.gp-recruit-voice-grid{grid-template-columns:repeat(3,minmax(0,1fr))}
.gp-recruit-hero-convert{grid-template-columns:1fr;max-width:36rem}
.gp-recruit-evidence-panel{grid-template-columns:1fr 1fr;gap:10px}
.gp-recruit-evidence-block--trust{grid-column:1 / -1}
.gp-recruit-differentiator-card{grid-template-columns:minmax(0,1.15fr) minmax(0,.85fr);gap:1.75rem;align-items:start}
.gp-recruit-final-inner{grid-template-columns:minmax(0,1.05fr) minmax(0,.95fr);gap:1.75rem;align-items:start}
.gp-recruit-final-actions .button{width:100%}
}
@media (min-width:1025px){
.gp-recruit-layout{
  --gp-recruit-pad-x:clamp(1.15rem,2vw,1.85rem);
  grid-template-columns:minmax(200px,232px) minmax(0,1fr);gap:20px;padding-top:14px;
}
.gp-recruit-hero-band{grid-column:1 / -1}
.gp-recruit-evidence-panel{
  grid-column:1;grid-row:2;grid-template-columns:1fr;position:sticky;
  /* Clear sticky site header (~9.5rem on laptop) so Opportunity Snapshot stays readable */
  top:calc(10rem + env(safe-area-inset-top,0px));
  z-index:2;align-self:start;padding-bottom:.25rem;gap:8px;
  max-height:calc(100vh - 12rem - env(safe-area-inset-top,0px) - env(safe-area-inset-bottom,0px));
  overflow:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;
  scroll-margin-top:calc(10rem + env(safe-area-inset-top,0px));
  /* Keep panel scrollable; hide the visible scrollbar chrome */
  scrollbar-width:none;-ms-overflow-style:none;
}
.gp-recruit-evidence-panel::-webkit-scrollbar{width:0;height:0;display:none}
.gp-recruit-main{grid-column:2;grid-row:2}
.gp-recruit-evidence-block{padding:.65rem .75rem}
.gp-recruit-evidence-block--trust{grid-column:auto}
.gp-recruit-hero{padding:18px var(--gp-recruit-pad-x) 14px}
.gp-recruit-hero-inner{
  grid-template-columns:minmax(260px,1.05fr) minmax(0,.95fr);gap:20px;align-items:center;
}
.gp-recruit-hero-aside{gap:0}
.gp-recruit-hero-visual{
  /* Keep 16:9 when max-height binds (short laptop viewports) so fascia is not side-cropped */
  width:min(100%,calc(min(320px,42vh) * 16 / 9));
  max-width:100%;
  max-height:min(320px,42vh);
  min-height:0;
  aspect-ratio:16 / 9;
  height:auto;
  justify-self:end;
}
.gp-recruit-opportunity-follow{
  grid-template-columns:minmax(0,1.2fr) auto;gap:.75rem 1.25rem;align-items:center;margin-top:14px;
}
.gp-recruit-opportunity-follow .gp-recruit-hero-aside-facts{grid-template-columns:1fr 1fr}
.gp-recruit-opportunity-follow .gp-recruit-hero-aside-actions{
  margin-top:0;flex-direction:column;align-items:stretch;justify-content:center;
}
.gp-recruit-hero-visual img{
  width:100%;height:100%;min-height:0;object-fit:cover;object-position:50% 42%;
}
.gp-recruit-trust{grid-template-columns:1fr 1fr;max-width:34rem}
.gp-recruit-card-grid-5{grid-template-columns:repeat(5,minmax(0,1fr))}
.gp-recruit-team-grid{grid-template-columns:repeat(5,minmax(0,1fr))}
.gp-recruit-section{padding:56px var(--gp-recruit-pad-x)}
.gp-recruit-hero-convert{grid-template-columns:1fr;gap:10px}
.gp-recruit-vacancy-trust{grid-template-columns:repeat(4,minmax(0,1fr))}
}
@media (min-width:1025px) and (max-height:880px){
.gp-recruit-layout{padding-top:10px;gap:14px}
.gp-recruit-hero{padding:12px var(--gp-recruit-pad-x) 10px;border-radius:16px}
.gp-recruit-hero h1{font-size:clamp(1.35rem,2.4vw,1.75rem);margin-bottom:.4rem}
.gp-recruit-lede{font-size:.9rem;line-height:1.4;margin-bottom:.4rem}
.gp-recruit-confidence{margin-bottom:.55rem;padding:.45rem .65rem;font-size:.82rem}
.gp-recruit-trust{gap:5px;margin-bottom:.6rem}
.gp-recruit-trust li{padding:.32rem .5rem;font-size:.78rem;border-radius:8px}
.gp-recruit-hero-visual{
  width:min(100%,calc(min(260px,38vh) * 16 / 9));
  max-height:min(260px,38vh);
  aspect-ratio:16 / 9;
  height:auto;
  border-radius:12px;
}
.gp-recruit-opportunity-follow{padding:.65rem .75rem;gap:.45rem .85rem;border-radius:12px}
.gp-recruit-hero-aside-title{font-size:.92rem}
.gp-recruit-hero-aside-facts li{font-size:.78rem}
.gp-recruit-evidence-block{padding:.55rem .65rem;border-radius:12px}
.gp-recruit-evidence-label{margin-bottom:.35rem;font-size:.75rem}
.gp-recruit-evidence-facts li,.gp-recruit-evidence-meta,.gp-recruit-evidence-trust li{font-size:.78rem}
}
.gp-recruit-actions--inline{
  display:grid;gap:10px;justify-items:stretch;width:100%;max-width:100%;
}
.gp-recruit-actions--inline .button{
  width:100%;max-width:100%;justify-content:center;white-space:normal;text-align:center;
  box-sizing:border-box;
}
.gp-recruit-actions--inline .gp-recruit-primary{
  box-shadow:0 12px 28px rgba(0,122,135,.28);
}
.gp-recruit-tertiary{font-weight:650}
.gp-recruit-vacancy-actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:12px}
.gp-recruit-final-actions.gp-recruit-actions--inline{display:grid}
@media(min-width:901px){
.gp-recruit-actions--inline{
  display:flex;flex-wrap:nowrap;align-items:center;gap:10px;justify-content:flex-start;width:auto;
}
.gp-recruit-actions--inline .button{
  width:auto;white-space:nowrap;
}
.gp-recruit-actions--inline .gp-recruit-primary{flex:0 1 auto}
/* Keep final CTAs stacked so long labels never blow out the right column */
.gp-recruit-final-actions.gp-recruit-actions--inline{
  display:grid!important;width:100%!important;max-width:100%!important;gap:10px;
}
.gp-recruit-final-actions.gp-recruit-actions--inline .button{
  width:100%!important;max-width:100%!important;white-space:normal!important;
}
}
@media(max-width:1024px){
.gp-recruit-evidence-panel{
  grid-column:auto;grid-row:auto;align-self:stretch;
  /* Single-column: stay in normal flow so the rail cannot cover later sections */
  position:relative;z-index:1;top:auto;
  scroll-margin-top:calc(5.35rem + env(safe-area-inset-top,0px));
  margin-top:12px;
  max-height:none;overflow:visible;padding-bottom:2px;
}
.gp-recruit-evidence-panel > .gp-recruit-evidence-block:first-child{
  position:relative;top:auto;z-index:auto;
  background:#fff;box-shadow:none;
}
}
@media(max-width:900px){
.gp-recruit-layout,
.shell.gp-recruit-layout{
  --gp-recruit-pad-x:1rem;
  width:min(calc(100% - 32px),var(--max,1320px))!important;
  margin-left:auto;margin-right:auto;
  gap:10px;padding-top:8px;padding-bottom:16px;box-sizing:border-box;
}
.gp-recruit-hero-band{gap:12px}
body .gp-recruit-hero,
body[data-attraction-surface] .gp-recruit-hero{
  padding:10px 0 18px;border-radius:14px;margin:0;box-sizing:border-box;
}
.gp-recruit-hero-inner{grid-template-columns:1fr;gap:14px}
.gp-recruit-hero-aside{order:-1;width:100%;min-width:0}
.gp-recruit-hero-visual{
  width:100%;max-width:100%;max-height:none;aspect-ratio:16 / 9;border-radius:14px;
  box-shadow:0 8px 20px rgba(22,61,104,.12);
}
.gp-recruit-hero-visual img{
  width:100%;height:100%;object-fit:cover;object-position:center 38%;
}
.gp-recruit-hero-copy{display:grid;gap:.7rem;min-width:0}
.gp-recruit-eyebrow{margin:0;font-size:.75rem;letter-spacing:.05em}
.gp-recruit-hero h1{
  margin:0;font-size:clamp(1.3rem,5.8vw,1.55rem);line-height:1.22;max-width:none;
}
.gp-recruit-lede{margin:0;font-size:.92rem;line-height:1.5}
.gp-recruit-confidence{
  margin:0;padding:.7rem .8rem;font-size:.84rem;line-height:1.45;border-radius:12px;
}
.gp-recruit-trust{
  grid-template-columns:1fr 1fr;gap:8px;margin:0;max-width:100%;
}
.gp-recruit-trust li{
  padding:.55rem .6rem;font-size:.8rem;border-radius:10px;line-height:1.35;
  align-items:flex-start;
}
.gp-recruit-hero-convert{max-width:100%;gap:10px;margin-top:.15rem}
.gp-recruit-actions--inline{gap:10px}
.gp-recruit-actions--inline .button{min-height:44px;padding:.65rem .9rem;font-size:.9rem}
/* Sticky dock already carries Discussion + Call — keep one hero CTA on small screens */
.gp-recruit-hero-convert .gp-recruit-secondary{display:none!important}
.gp-recruit-lede,.gp-recruit-confidence,.gp-recruit-hero h1{overflow-wrap:anywhere;word-break:normal}
/* Opportunity strip duplicates evidence panel on mobile */
.gp-recruit-opportunity-follow{display:none!important}
.gp-recruit-evidence-panel{
  gap:6px;margin:12px 0 0;width:100%;box-sizing:border-box;
  scroll-margin-top:calc(5.5rem + env(safe-area-inset-top,0px));
  max-height:none;overflow:visible;
}
.gp-recruit-hero-band{margin-bottom:4px}
.gp-recruit-evidence-block{padding:.55rem .65rem;border-radius:12px;box-shadow:0 4px 12px rgba(22,61,104,.05)}
.gp-recruit-evidence-label{margin:0 0 .35rem;font-size:.75rem;letter-spacing:.05em}
.gp-recruit-evidence-facts li,.gp-recruit-evidence-meta,.gp-recruit-evidence-trust li{font-size:.82rem}
/* Mobile tap targets — keep labels, enlarge hit area */
.gp-recruit-evidence-channels{gap:8px}
.gp-recruit-evidence-channels a,
.gp-recruit-contact-channels a,
.gp-recruit-team-link,
.gp-recruit-evidence-link{
  display:inline-flex;align-items:center;min-height:44px;padding:.35rem .15rem;
  box-sizing:border-box;
}
.gp-recruit-evidence-link--accent{
  min-height:44px;padding:.65rem .85rem;justify-content:center;width:100%;
}
.gp-recruit-contact-channels{gap:4px}
.gp-recruit-contact-channels li{min-height:44px;display:flex;align-items:center}
.gp-recruit-section{
  padding:28px 0;box-sizing:border-box;
}
.gp-recruit-section h2{margin:0 0 .65rem;font-size:clamp(1.2rem,5vw,1.45rem)}
.gp-recruit-section-lede{margin:0 0 .85rem;font-size:.92rem;line-height:1.45}
.gp-recruit-commercial{padding-top:12px;padding-bottom:18px}
.gp-recruit-commercial-card{padding:1.05rem .95rem;border-radius:16px}
.gp-recruit-commercial-grid{grid-template-columns:1fr 1fr;gap:8px;margin:0}
.gp-recruit-commercial-grid>div{padding:.75rem .65rem;border-radius:12px}
.gp-recruit-commercial-grid .gp-recruit-stat-value{font-size:clamp(1.25rem,5vw,1.65rem)}
.gp-recruit-commercial-grid .gp-recruit-stat-value--xl{font-size:clamp(1.7rem,7vw,2.2rem)}
.gp-recruit-commercial-grid .gp-recruit-stat-label{font-size:.78rem}
.gp-recruit-vacancy-featured-label,.gp-recruit-voice-role,.gp-recruit-final-next-label,.gp-recruit-contact-label{
  font-size:.75rem;letter-spacing:.05em;
}
.gp-recruit-vacancy-badge{font-size:.75rem;min-height:28px;padding:.2rem .55rem}
.gp-recruit-faq-item summary{min-height:44px;padding:.85rem 1rem;font-size:.98rem}
.gp-recruit-stat-grid{gap:8px}
.gp-recruit-stat{padding:.9rem .8rem;border-radius:14px}
.gp-recruit-stat-value{font-size:clamp(1.25rem,5vw,1.7rem)}
.gp-recruit-card-grid,.gp-recruit-card-grid-5{gap:8px}
.gp-recruit-card{padding:.9rem .85rem;border-radius:14px}
.gp-recruit-card h3{margin:0 0 .35rem;font-size:.95rem}
.gp-recruit-card p{font-size:.86rem;line-height:1.4}
.gp-recruit-demand{padding-top:22px;padding-bottom:22px}
.gp-recruit-evidence{gap:8px}
.gp-recruit-evidence li{padding:.7rem .8rem;font-size:.88rem;line-height:1.4}
.gp-recruit-differentiator{
  padding:18px 0 22px;margin-left:0;margin-right:0;box-sizing:border-box;
}
.gp-recruit-differentiator-card{padding:1rem .9rem;border-radius:16px;gap:12px}
.gp-recruit-vacancies-block,.gp-recruit-vacancy-grid{min-width:0;width:100%;box-sizing:border-box}
.gp-recruit-vacancies-block{gap:12px;padding-bottom:0}
.gp-recruit-vacancies{padding-bottom:16px}
.gp-recruit-commercial-faq{padding-top:16px}
.gp-recruit-vacancy-grid{gap:10px}
.gp-recruit-vacancy-card{
  padding:1.15rem 1.05rem 1.2rem;border-radius:16px;box-sizing:border-box;
}
.gp-recruit-vacancy-card--featured{padding:1.25rem 1.1rem 1.3rem}
.gp-recruit-vacancy-actions{gap:8px}
.gp-recruit-vacancy-actions .button{flex:1 1 auto;min-width:0}
.gp-recruit-team-grid{gap:8px}
.gp-recruit-voice-grid{gap:8px}
.gp-recruit-faq-list{gap:8px}
.gp-recruit-final{
  padding:1.25rem 1.1rem calc(1.35rem + 5.25rem);margin-left:0;margin-right:0;box-sizing:border-box;
  border-radius:18px;
}
.gp-recruit-final-inner{gap:14px}
.gp-recruit-final h2{max-width:none;font-size:clamp(1.35rem,5.6vw,1.7rem)}
.gp-recruit-final-sub{font-size:.95rem;line-height:1.5}
.gp-recruit-final-trust{gap:8px}
.gp-recruit-final-trust li{white-space:normal;padding:.45rem .7rem}
.gp-recruit-final-next{padding:.95rem 1rem;border-radius:14px}
.gp-recruit-final-actions .button{min-height:44px}
.gp-recruit-callout{padding:1.05rem .95rem;border-radius:14px}
.gp-recruit-location{gap:12px}
.gp-recruit-split{gap:12px}
.gp-recruit-contact-card,.gp-recruit-trust-panel{box-sizing:border-box}
/* Footer identity — beat site 2-col logo/trust compact grid on mobile */
footer .footer-grid.attraction-footer-grid > .footer-identity,
footer .footer-grid > .footer-identity,
body[data-attraction-surface] footer .footer-grid > div:first-child,
body[data-ev="true"] footer .footer-grid > div:first-child{
  display:grid!important;
  grid-template-columns:minmax(0,1fr)!important;
  grid-template-rows:none!important;
  gap:14px!important;column-gap:14px!important;row-gap:14px!important;
  justify-items:start;align-items:start;min-width:0;box-sizing:border-box;
}
footer .footer-grid.attraction-footer-grid > .footer-identity > .footer-brand,
footer .footer-grid.attraction-footer-grid > .footer-identity > p,
footer .footer-grid.attraction-footer-grid > .footer-identity > .footer-trust,
footer .footer-grid > .footer-identity > .footer-brand,
footer .footer-grid > .footer-identity > p,
footer .footer-grid > .footer-identity > .footer-trust,
body[data-attraction-surface] footer .footer-grid > div:first-child > .footer-brand,
body[data-attraction-surface] footer .footer-grid > div:first-child > p,
body[data-attraction-surface] footer .footer-grid > div:first-child > .footer-trust,
body[data-ev="true"] footer .footer-grid > div:first-child > .footer-brand,
body[data-ev="true"] footer .footer-grid > div:first-child > p,
body[data-ev="true"] footer .footer-grid > div:first-child > .footer-trust{
  grid-column:1 / -1!important;grid-row:auto!important;width:100%;max-width:100%;
  margin:0!important;justify-self:start;align-self:start;
}
footer .footer-identity .footer-brand img,
footer .footer-identity .footer-brand .institution-logo-lockup-footer{
  display:block!important;width:auto!important;max-width:min(100%,280px)!important;height:auto!important;
}
footer .footer-identity > p{
  margin:0!important;max-width:36rem;line-height:1.5;font-size:.92rem;
}
footer .footer-identity .footer-trust{
  display:flex!important;flex-wrap:wrap;justify-content:flex-start;gap:12px!important;margin-top:0!important;
}
footer .footer-identity .footer-trust img{
  width:72px!important;height:72px!important;max-width:72px!important;max-height:72px!important;
}
}
html.grp-portal-open,html.grp-portal-open body{overflow:hidden}
.grp-portal{position:fixed;inset:0;z-index:1200;display:grid;place-items:center;padding:16px}
.grp-portal[hidden]{display:none!important}
.grp-backdrop{position:absolute;inset:0;background:rgba(10,24,40,.55)}
.grp-dialog{position:relative;z-index:1;width:min(720px,100%);max-height:min(92vh,920px);overflow:auto;background:#fff;border-radius:18px;box-shadow:0 24px 64px rgba(10,24,40,.28);display:grid;grid-template-rows:auto 1fr}
.grp-header{display:flex;justify-content:space-between;gap:16px;padding:18px 20px 12px;border-bottom:1px solid rgba(22,61,104,.1)}
.grp-eyebrow{margin:0 0 4px;font-size:.72rem;letter-spacing:.08em;text-transform:uppercase;color:var(--gp-teal,#007A87);font-weight:700}
.grp-header h2{margin:0;font-family:Georgia,serif;color:var(--gp-navy,#163D68);font-size:1.35rem;line-height:1.2}
.grp-sub{margin:.45rem 0 0;color:#445;font-size:.9rem;line-height:1.4;max-width:42rem}
.grp-close{appearance:none;border:0;background:transparent;font-size:1.6rem;line-height:1;cursor:pointer;color:#345;padding:.2rem .45rem;border-radius:8px}
.grp-close:hover{background:rgba(22,61,104,.06)}
.grp-body{padding:16px 20px 22px}
.grp-progress{display:grid;gap:8px;margin-bottom:14px}
.grp-progress-meta{display:flex;justify-content:space-between;gap:12px;font-size:.8rem;color:#456;font-weight:650}
.grp-progress-track{height:6px;border-radius:999px;background:rgba(22,61,104,.1);overflow:hidden}
.grp-progress-fill{display:block;height:100%;background:linear-gradient(90deg,var(--gp-teal,#007A87),var(--gp-green,#008B6D));border-radius:inherit}
.grp-form{display:grid;gap:12px}
.grp-step-title{margin:0;font-size:1.15rem;color:var(--gp-navy,#163D68);font-family:Georgia,serif}
.grp-field{display:grid;gap:6px}
.grp-label{font-size:.82rem;font-weight:650;color:#234}
.grp-field input,.grp-field select,.grp-field textarea{width:100%;border:1px solid rgba(22,61,104,.18);border-radius:10px;padding:.65rem .75rem;font:inherit;background:#fff}
.grp-fieldset{border:0;margin:0;padding:0;display:grid;gap:8px}
.grp-choice-row,.grp-choice-grid{display:flex;flex-wrap:wrap;gap:8px}
.grp-choice-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr))}
.grp-choice{display:flex;gap:8px;align-items:flex-start;padding:.55rem .7rem;border:1px solid rgba(22,61,104,.14);border-radius:10px;background:#f7fbfb;font-size:.88rem}
.grp-actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:8px}
.grp-note,.grp-hint,.grp-disclaimer,.grp-save-hint{margin:0;font-size:.86rem;color:#456;line-height:1.4}
.grp-disclaimer{padding:.75rem .85rem;border-radius:10px;background:#f4f7f7;border:1px solid rgba(22,61,104,.08)}
.grp-guidance,.grp-outcome,.grp-preview,.grp-summary,.grp-live-preview{padding:12px 14px;border-radius:12px;background:#f4faf9;border:1px solid rgba(0,122,135,.16)}
.grp-guidance h3,.grp-summary h3{margin:0 0 .4rem;font-size:1rem;color:var(--gp-navy,#163D68)}
.grp-preview img{width:96px;height:96px;object-fit:cover;border-radius:12px;margin-bottom:8px}
.grp-char-count{display:block;text-align:right;color:#5f707c;font-size:.75rem;margin-top:.25rem}
.grp-error{color:#9b1c1c;background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:.55rem .75rem;font-size:.85rem}
.grp-crop-row{display:grid;grid-template-columns:1.4fr 1fr;gap:12px;margin:10px 0 14px}
.grp-crop-frame{overflow:hidden;border-radius:14px;border:1px solid rgba(22,61,104,.14);background:#e9eff2}
.grp-crop-landscape{aspect-ratio:16/9}
.grp-crop-square{aspect-ratio:1}
.grp-crop-frame img{width:100%;height:100%;object-fit:cover;object-position:center 20%;display:block}
.grp-live-preview{display:grid;gap:14px;margin-top:8px}
.grp-doctor-card{display:grid;grid-template-columns:88px minmax(0,1fr);gap:14px;align-items:center;padding:14px;border-radius:16px;background:#fff;border:1px solid rgba(22,61,104,.12);box-shadow:0 8px 20px rgba(23,48,68,.05)}
.grp-card-photo{width:88px;height:88px;border-radius:14px;overflow:hidden;background:#dbe4e9}
.grp-card-photo img{width:100%;height:100%;object-fit:cover}
.grp-card-copy{display:grid;gap:4px;min-width:0}
.grp-card-copy strong{font-family:"Libre Baskerville",Georgia,serif;font-size:1.05rem;color:#163d68;font-weight:400}
.grp-card-copy span{color:#007a87;font-size:.78rem;font-weight:650}
.grp-card-copy p{margin:0;color:#4a5d6c;font-size:.86rem;line-height:1.45}
.grp-doctor-full{padding:16px;border-radius:16px;background:#fff;border:1px solid rgba(22,61,104,.12)}
.grp-full-hero{display:grid;grid-template-columns:96px minmax(0,1fr);gap:14px;align-items:center;margin-bottom:12px}
.grp-full-hero img{width:96px;height:96px;border-radius:16px;object-fit:cover}
.grp-full-hero h3{margin:.15rem 0;font-family:"Libre Baskerville",Georgia,serif;font-size:1.35rem;color:#163d68;font-weight:400}
.grp-full-bio{margin:0 0 12px;color:#4a5d6c;font-size:.92rem;line-height:1.65}
.grp-full-meta{margin:0;padding:0;list-style:none;display:grid;gap:6px;color:#4a5d6c;font-size:.86rem}
.grp-done ol{margin:.4rem 0 1rem;padding-left:1.2rem}
.grp-done li{margin:.25rem 0}
.grp-conditional{display:grid;gap:12px}
@media(max-width:900px){
.grp-portal{padding:8px;align-items:stretch}
.grp-dialog{width:100%;max-height:min(96vh,920px);border-radius:14px;margin:0}
.grp-header{padding:14px 14px 10px;gap:10px;align-items:flex-start}
.grp-eyebrow{font-size:.75rem;letter-spacing:.05em}
.grp-header h2{font-size:1.15rem}
.grp-sub{font-size:.86rem}
.grp-close{min-width:44px;min-height:44px}
.grp-body{padding:12px 14px 18px}
.grp-actions{gap:8px}
.grp-actions .button{min-height:44px;flex:1 1 auto}
.grp-choice{min-height:44px;align-items:center}
.grp-field input,.grp-field select,.grp-field textarea{min-height:44px;font-size:16px}
.grp-choice-grid{grid-template-columns:1fr}
.grp-crop-row,.grp-doctor-card,.grp-full-hero{grid-template-columns:1fr}
}
</style>`;
