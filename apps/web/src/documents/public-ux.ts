/**
 * Public-facing HTML presentation only.
 * Leave frozen golden pages, canonical URLs, classification and schema intact.
 * Branding strings come from ClinicProfile (via ClinicBranding); defaults preserve WMC.
 */
import { ensureInsuranceBookingNoticesInHtml } from "./booking-restriction-notice";
import {
  DEFAULT_CLINIC_BRANDING,
  escapeHtmlAttr,
  type ClinicBranding,
} from "@/clinics/branding";
import { injectAttractionNavigation } from "@/attraction-cms/inject-nav";
import { injectPracticeExperienceAboutLinks } from "@/practice-experience/inject-about";

export type PublicUxOptions = {
  clinicSlug?: string;
  branding?: Partial<ClinicBranding>;
};

function resolveBranding(options?: PublicUxOptions | string): ClinicBranding {
  if (typeof options === "string" || options == null) {
    const slug = typeof options === "string" ? options : DEFAULT_CLINIC_BRANDING.clinicSlug;
    return { ...DEFAULT_CLINIC_BRANDING, clinicSlug: slug };
  }
  const slug =
    options.branding?.clinicSlug || options.clinicSlug || DEFAULT_CLINIC_BRANDING.clinicSlug;
  return {
    ...DEFAULT_CLINIC_BRANDING,
    ...options.branding,
    clinicSlug: slug,
  };
}

function injectClinicDataAttrs(html: string, branding: ClinicBranding): string {
  const attrs = [
    `data-clinic-slug="${escapeHtmlAttr(branding.clinicSlug)}"`,
    `data-practice-name="${escapeHtmlAttr(branding.practiceName)}"`,
    `data-practice-phone="${escapeHtmlAttr(branding.phoneDisplay)}"`,
    `data-practice-phone-tel="${escapeHtmlAttr(branding.phoneTel)}"`,
    `data-practice-email="${escapeHtmlAttr(branding.email)}"`,
    branding.hotdocUrl ? `data-hotdoc-url="${escapeHtmlAttr(branding.hotdocUrl)}"` : "",
    branding.logoPath ? `data-clinic-logo="${escapeHtmlAttr(branding.logoPath)}"` : "",
  ]
    .filter(Boolean)
    .join(" ");

  return html.replace(/<html\b([^>]*)>/i, (_match, rest: string) => {
    const cleaned = String(rest)
      .replace(/\sdata-clinic-slug="[^"]*"/g, "")
      .replace(/\sdata-practice-name="[^"]*"/g, "")
      .replace(/\sdata-practice-phone="[^"]*"/g, "")
      .replace(/\sdata-practice-phone-tel="[^"]*"/g, "")
      .replace(/\sdata-practice-email="[^"]*"/g, "")
      .replace(/\sdata-hotdoc-url="[^"]*"/g, "")
      .replace(/\sdata-clinic-logo="[^"]*"/g, "");
    return `<html${cleaned} ${attrs}>`;
  });
}

/**
 * Philosophy / Story “Quality and safety” blocks shipped with a thin one-liner
 * and an AGPAL mark whose HTML height attrs inflate the section. Enrich copy +
 * link, and normalize the mark size — without editing golden-master HTML files.
 */
function enrichQualitySafetySections(html: string, pagePath: string): string {
  if (!/philosophy-of-care\.html$|story\.html$/i.test(pagePath)) return html;
  const agpalHref = pagePath.includes("/") ? "../agpal-accreditation.html" : "agpal-accreditation.html";
  const markSrc = pagePath.includes("/") ? "../assets/brand/agpal-mark.webp" : "assets/brand/agpal-mark.webp";
  return html.replace(
    /<section class="article-section">\s*<h2>Quality and safety\.?<\/h2>\s*<div class="logo-lockup-page">[\s\S]*?<\/div>(?:\s*<p>\s*<a class="text-link"[^>]*>[\s\S]*?<\/a>\s*<\/p>)?\s*<\/section>/i,
    `<section class="article-section"><h2>Quality and safety</h2><div class="logo-lockup-page"><img alt="Accredited General Practice" data-local-asset="agpal-mark" src="${markSrc}" width="92" height="92"/><div><p>AGPAL accreditation provides independent recognition that our practice meets applicable national general practice standards. It supports a structured approach to safety, governance, privacy, infection prevention and continuous improvement.</p><p><a class="text-link" href="${agpalHref}">Why accreditation matters →</a></p></div></div></section>`,
  );
}

export function applyPublicUxRefinements(
  html: string,
  pagePath: string,
  clinicSlugOrOptions: string | PublicUxOptions = "woolloongabba",
): string {
  const branding = resolveBranding(clinicSlugOrOptions);
  const clinicSlug = branding.clinicSlug;
  let next = html;
  // Topic cross-link bar under the hero (for example "Need ongoing diabetes care?").
  next = next.replace(/<nav\b[^>]*\bclass="topic-wayfinding"[^>]*>[\s\S]*?<\/nav>/gi, "");
  // A new URL bypasses stale browser/Cloudflare CSS after visual-polish deployment.
  next = next.replace(/styles\.css(?=")/g, "styles.css?v=wmc-hero-authority-v6f-20261105");
  // site.js is otherwise cached for hours (CDN max-age); bust so mobile-nav fixes ship.
  next = next.replace(/site\.js(?=")/g, "site.js?v=wmc-hero-authority-v6f-20261105");
  // Digital Reception demand capture script — bust when search-signal posting changes.
  next = next.replace(
    /digital-reception\.js(?:\?[^"]*)?(?=")/g,
    "digital-reception.js?v=wmc-search-signals-20261103",
  );
  // Clinic identity for public APIs and client measurement (careers, forms, search signals).
  next = injectClinicDataAttrs(next, branding);
  // Patient forms → operations inbox (keep golden HTML, update handoff + endpoint at render).
  if (next.includes("data-patient-form-request")) {
    next = next.replace(
      /(<form\b[^>]*\bdata-patient-form-request(?:="")?[^>]*)(>)/i,
      (_match, open: string, close: string) => {
        let tag = open;
        if (!/\bmethod=/.test(tag)) tag += ` method="post"`;
        if (!/\baction=/.test(tag)) tag += ` action="/api/clinics/${clinicSlug}/form-requests"`;
        else tag = tag.replace(/\baction="[^"]*"/, `action="/api/clinics/${clinicSlug}/form-requests"`);
        if (!/\bdata-clinic-slug=/.test(tag)) tag += ` data-clinic-slug="${clinicSlug}"`;
        return `${tag}${close}`;
      },
    );
    next = next.replace(
      /<p class="form-email-handoff">[\s\S]*?<\/p>/i,
      `<p class="form-email-handoff"><strong>How this works: </strong>Submit this form to send an administrative request to ${branding.practiceName}. Do not include clinical or sensitive health information.</p>`,
    );
  }

  // Insurance bulk-bill notes follow HotDoc practitioner slugs (not hand-authored per page).
  next = ensureInsuranceBookingNoticesInHtml(next);

  // Philosophy / Story: fill sparse Quality & safety lockup (copy + sized AGPAL mark).
  next = enrichQualitySafetySections(next, pagePath);

  // Practice Experience Hub — About Us card + side-nav (CMS page; not golden-master edit).
  next = injectPracticeExperienceAboutLinks(next, pagePath);
  // GP Attraction IA — About + Join Our Team side-nav links (EV surfaces).
  next = injectAttractionNavigation(next, pagePath);

  // Recruitment surfaces: demote patient HotDoc sticky → Express Interest + call.
  const isRecruitmentSurface =
    pagePath === "join-our-team.html" ||
    pagePath.startsWith("join-our-team/") ||
    /^(about-us\/)?(practice-experience|community-catchment|continuity-in-practice|clinical-interests)\.html$/i.test(
      pagePath,
    );
  if (isRecruitmentSurface && /persistent-care-actions/i.test(next)) {
    const eoiHref = pagePath.startsWith("join-our-team/")
      ? "express-interest.html"
      : pagePath.startsWith("about-us/")
        ? "../join-our-team/express-interest.html"
        : "join-our-team/express-interest.html";
    const isExpressInterestPage = /express-interest\.html$/i.test(pagePath);
    const stickyEoiHref = isExpressInterestPage ? "#eoi-form" : eoiHref;
    const stickyHtml = `<nav aria-label="GP recruitment actions" class="persistent-care-actions persistent-care-actions--recruitment" data-audience="gp-attraction"><div class="persistent-care-actions-inner"><a class="persistent-care-book" href="${stickyEoiHref}">Express Interest</a><a aria-label="Call Woolloongabba Medical Centre about joining on (07) 3217 3344" class="persistent-care-call" href="tel:+61732173344">Call about joining</a></div></nav>`;
    next = next.replace(
      /<nav\b[^>]*class="[^"]*persistent-care-actions[^"]*"[^>]*>[\s\S]*?<\/nav>/i,
      stickyHtml,
    );
  }
  // P0-2 marker for Attraction chrome demotion (header Book outline; sticky dominant).
  if (isRecruitmentSurface) {
    if (!/data-attraction-surface=/i.test(next)) {
      next = next.replace(/<body\b/i, '<body data-attraction-surface="true"');
    }
    if (!/\bdata-ev="true"/i.test(next) && /data-ev-surface|attraction-experience-validation|data-attraction-type/i.test(next)) {
      next = next.replace(/<body\b([^>]*)>/i, '<body$1 data-ev="true">');
    }
  }

  // Attraction analytics beacon (anonymous) — all EV attraction surfaces.
  if (
    /practice-experience|join-our-team|community-catchment|continuity-in-practice|clinical-interests|gp-opportunities|gp-faq|doctor-readiness|opportunity-pack|express-interest|dpa-navigator|session-planner|provider-number|registrar-pathway|practice-support/i.test(
      pagePath,
    ) &&
    !/attraction-track\.js/i.test(next)
  ) {
    next = next.replace(
      /<\/body>/i,
      `<script src="/attraction-track.js?v=wmc-attr-opp-20261105b" defer></script></body>`,
    );
  }

  // Add Join Our Team in every public primary navigation using the Updates
  // link's existing relative prefix (works for nested services/knowledge pages).
  next = next.replace(/<nav\b[^>]*\bid="primary-nav"[^>]*>[\s\S]*?<\/nav>/i, (nav) => {
    if (nav.includes('data-nav-key="join-team"')) return nav;

    // Use Contact as the stable anchor even if the Updates link markup changes.
    const contact = nav.match(/<a\b(?=[^>]*\bdata-nav-key="contact")[^>]*>[\s\S]*?<\/a>/i)?.[0];
    const contactHref = contact?.match(/\bhref="([^"]*contact\.html)"/i)?.[1];
    if (!contact || !contactHref) return nav;
    const joinHref = contactHref.replace(/contact\.html$/i, "join-our-team.html");
    const onJoinPage = pagePath === "join-our-team.html";
    let updatedNav = nav.replace(
      contact,
      `<a href="${joinHref}" data-nav-key="join-team"${onJoinPage ? ' aria-current="page"' : ""}>Join Our Team</a>${contact}`,
    );

    if (onJoinPage) {
      // Preserve page-level active state in the existing site.js nav enhancer.
      updatedNav = updatedNav.replace('data-nav-is-hub="false"', 'data-nav-is-hub="true"');
      // Only the primary-nav active section changes; the page's internal
      // About Us taxonomy and breadcrumbs remain untouched.
      updatedNav = updatedNav.replace('data-nav-owner="about"', 'data-nav-owner="join-team"');
      updatedNav = updatedNav.replace(
        /(<a\b[^>]*data-nav-key="about"[^>]*?)\saria-current="location"/,
        "$1",
      );
    }
    return updatedNav;
  });

  if (pagePath !== "index.html") return next;

  // Keep After Hours Care beside View all hours when the golden hours block is present.
  // The authority hero rewrite embeds the same pair; this covers fixture/partial HTML.
  const hoursLink =
    '<a class="hero-hours-link" href="contact.html">View all hours <span aria-hidden="true">→</span></a>';
  if (!next.includes('class="hero-hours-actions"') && next.includes(hoursLink)) {
    next = next.replace(
      hoursLink,
      '<div class="hero-hours-actions">' +
        hoursLink +
        '<a class="hero-hours-link hero-hours-after-care-link" href="after-hours-care.html">After Hours Care <span aria-hidden="true">→</span></a>' +
        "</div>",
    );
  }

  next = refineHomepageHeroAuthority(next, branding);
  // Trust strip under the hero replaces the large homepage Our Team carousel.
  next = next.replace(/<section\b[^>]*\bid="team"[^>]*>[\s\S]*?<\/section>/i, "");

  return next;
}

const DEFAULT_HOTDOC_BOOKING_URL =
  "https://www.hotdoc.com.au/medical-centres/woolloongabba-QLD-4102/t-medicals-woolloongabba-medical-centre/doctors?wp=w_lightbox";

/**
 * FROZEN (2026-11-05) — homepage authority hero + landing presentation.
 * Do not redesign the hero, practitioner strip, stats bar, or homepage HotDoc
 * benefit cards without an explicit operator request. Presentation stays in
 * public-ux (not golden-master). Selectors include #home so they beat styles.css.
 *
 * Locked shape: V4 split + building visual, trust pills / CTA hierarchy,
 * full-width practitioner trust strip (homepage #team carousel removed).
 */
function refineHomepageHeroAuthority(html: string, branding: ClinicBranding): string {
  if (!/<section\b[^>]*\bid="home"[^>]*>/i.test(html)) {
    return html;
  }

  const hotdoc =
    branding.hotdocUrl ||
    html.match(/href="(https:\/\/www\.hotdoc\.com\.au[^"]+)"/i)?.[1] ||
    DEFAULT_HOTDOC_BOOKING_URL;
  const phoneDisplay = branding.phoneDisplay || "(07) 3217 3344";
  const rawTel = (branding.phoneTel || "0732173344").replace(/[^\d+]/g, "");
  const phoneTelHref = rawTel.startsWith("+")
    ? rawTel
    : rawTel.startsWith("0")
      ? `+61${rawTel.slice(1)}`
      : rawTel.startsWith("61")
        ? `+${rawTel}`
        : rawTel;
  const hotdocAttr = escapeHtmlAttr(hotdoc);
  const phoneDisplayAttr = escapeHtmlAttr(phoneDisplay);
  const phoneTelAttr = escapeHtmlAttr(phoneTelHref);

  const hero = `<section class="hero hero--authority-v6" id="home">
<div class="shell hero-grid">
<div class="hero-copy">
<div class="hero-content-panel">
<p class="hero-eyebrow">Woolloongabba Medical Centre</p>
<h1>Your trusted local doctors<span class="hero-headline-break"> in Woolloongabba.</span></h1>
<p class="hero-lede">Comprehensive healthcare for individuals and families, delivered by experienced doctors who take the time to understand your health journey.</p>
<ul class="hero-trust-badges" aria-label="Practice trust marks">
<li><a class="hero-trust-badge" href="agpal-accreditation.html"><span class="hero-trust-check" aria-hidden="true">✓</span><span>AGPAL Accredited</span></a></li>
<li><a class="hero-trust-badge" href="contact.html"><span class="hero-trust-check" aria-hidden="true">◷</span><span>Open 7 Days</span></a></li>
<li><a class="hero-trust-badge" href="bulk-billing.html"><span class="hero-trust-check" aria-hidden="true">$</span><span>Bulk Billing Available</span></a></li>
<li><a class="hero-trust-badge" href="team.html"><span class="hero-trust-check" aria-hidden="true">✚</span><span>Experienced GP Team</span></a></li>
</ul>
<div class="hero-actions-polished">
<a class="button wmc-book-appointment" data-hotdoc-button="" data-hotdoc-widget="lightbox" href="${hotdocAttr}">Book Appointment</a>
<a aria-label="Call Woolloongabba Medical Centre on ${phoneDisplayAttr}" class="button button-call-polished" href="tel:${phoneTelAttr}">Call ${phoneDisplayAttr}</a>
<a class="hero-tertiary-link" href="team.html">Meet Our Doctors</a>
</div>
<div class="hero-supporting-info">
<div role="group" aria-label="Opening hours" class="hero-hours-refined">
<span><strong>Mon–Thu</strong><em>7am–7pm</em></span>
<span><strong>Fri</strong><em>8am–5pm</em></span>
<span><strong>Sat</strong><em>9am–5pm</em></span>
<span><strong>Sun</strong><em>9am–3pm</em></span>
<div class="hero-hours-actions"><a class="hero-hours-link" href="contact.html">View all hours <span aria-hidden="true">→</span></a><a class="hero-hours-link hero-hours-after-care-link" href="after-hours-care.html">After Hours Care <span aria-hidden="true">→</span></a></div>
</div>
</div>
</div>
</div>
<div class="hero-visual">
<picture class="hero-picture"><source media="(max-width: 700px)" srcset="assets/hero-final-mobile.webp"/><source media="(max-width: 1024px)" srcset="assets/hero-final-tablet.webp"/><img alt="Woolloongabba Medical Centre on Vulture Street — established local general practice" class="hero-photo" decoding="async" fetchpriority="high" height="941" src="assets/hero-final-desktop.webp" width="1672"/></picture>
</div>
</div>
<div class="hero-practitioner-strip">
<div class="shell hero-practitioner-inner">
<div class="hero-practitioner-heading">
<p class="hero-practitioner-caption">Doctors who take the time to know you</p>
<a class="hero-practitioner-more" href="team.html">View full team</a>
</div>
<ul class="hero-practitioner-faces" aria-label="Our doctors">
<li><a class="hero-practitioner-face" href="doctors/dr-tanya-goodwill.html"><img alt="" class="hero-practitioner-avatar" decoding="async" height="96" loading="lazy" src="assets/team/dr-tanya-goodwill-640.webp" width="96"/><span>Dr Tanya Goodwill</span></a></li>
<li><a class="hero-practitioner-face" href="doctors/dr-sumita-singh.html"><img alt="" class="hero-practitioner-avatar" decoding="async" height="96" loading="lazy" src="assets/team/dr-sumita-singh-640.webp" width="96"/><span>Dr Sumita Singh</span></a></li>
<li><a class="hero-practitioner-face" href="doctors/dr-wasantha-hettiarchchi.html"><img alt="" class="hero-practitioner-avatar" decoding="async" height="96" loading="lazy" src="assets/team/dr-wasantha-hettiarchchi-640.webp" width="96"/><span>Dr Wasantha Hettiarchchi</span></a></li>
<li><a class="hero-practitioner-face" href="doctors/dr-anand-singh.html"><img alt="" class="hero-practitioner-avatar" decoding="async" height="96" loading="lazy" src="assets/team/dr-anand-singh-640.webp" width="96"/><span>Dr Anand Singh</span></a></li>
<li><a class="hero-practitioner-face" href="doctors/dr-debra-larkins.html"><img alt="" class="hero-practitioner-avatar" decoding="async" height="96" loading="lazy" src="assets/team/dr-debra-larkins-640.webp" width="96"/><span>Dr Debra Larkins</span></a></li>
<li><a class="hero-practitioner-face" href="doctors/dr-kooshyar-karimi.html"><img alt="" class="hero-practitioner-avatar" decoding="async" height="96" loading="lazy" src="assets/team/dr-kooshyar-karimi-640.webp" width="96"/><span>Dr Kooshyar Karimi</span></a></li>
<li><a class="hero-practitioner-face" href="doctors/dr-sambo-luon.html"><img alt="" class="hero-practitioner-avatar" decoding="async" height="96" loading="lazy" src="assets/team/dr-sambo-luon-640.webp" width="96"/><span>Dr Sambo Luon</span></a></li>
<li><a class="hero-practitioner-face" href="doctors/dr-usman-gul.html"><img alt="" class="hero-practitioner-avatar" decoding="async" height="96" loading="lazy" src="assets/team/dr-usman-gul-640.webp" width="96"/><span>Dr Usman Gul</span></a></li>
<li><a class="hero-practitioner-face" href="doctors/dr-mary-abadir.html"><img alt="" class="hero-practitioner-avatar" decoding="async" height="96" loading="lazy" src="assets/team/dr-mary-abadir-640.webp" width="96"/><span>Dr Mary Abadir</span></a></li>
<li><a class="hero-practitioner-face" href="doctors/dr-steven-chang.html"><img alt="" class="hero-practitioner-avatar" decoding="async" height="96" loading="lazy" src="assets/team/dr-steven-chang-640.webp" width="96"/><span>Dr Steven Chang</span></a></li>
</ul>
</div>
</div>
<div class="hero-stats-bar" role="group" aria-label="Practice highlights">
<div class="shell hero-stats-inner">
<a class="hero-stat" href="#continuity"><span class="hero-stat-icon" aria-hidden="true">◎</span><span class="hero-stat-label">Continuity of Care</span></a>
<a class="hero-stat" href="contact.html"><span class="hero-stat-icon" aria-hidden="true">◷</span><span class="hero-stat-label">Open 7 Days</span></a>
<a class="hero-stat" href="agpal-accreditation.html"><span class="hero-stat-icon" aria-hidden="true">★</span><span class="hero-stat-label">AGPAL Accredited</span></a>
<a class="hero-stat" href="team.html"><span class="hero-stat-icon" aria-hidden="true">✚</span><span class="hero-stat-label">Experienced GP Team</span></a>
<button class="hero-stat" data-open-digital-reception="" type="button"><span class="hero-stat-icon" aria-hidden="true">⌕</span><span class="hero-stat-label">Digital Reception</span></button>
</div>
</div>
</section>`;

  let next = html.replace(/<section\b[^>]*\bid="home"[^>]*>[\s\S]*?<\/section>/i, hero);
  next = next.replace(/<style id="wmc-hero-desktop-split">[\s\S]*?<\/style>/i, "");
  next = next.replace(/<style id="wmc-hero-authority-v[345]">[\s\S]*?<\/style>/i, "");

  if (next.includes('id="wmc-hero-authority-v6"')) {
    next = next.replace(
      /<style id="wmc-hero-authority-v6">[\s\S]*?<\/style>/i,
      HOMEPAGE_HERO_AUTHORITY_STYLE,
    );
  } else {
    next = next.replace(/<\/head>/i, `${HOMEPAGE_HERO_AUTHORITY_STYLE}</head>`);
  }

  next = next.replace(/<script id="wmc-hero-authority-actions">[\s\S]*?<\/script>/i, "");
  next = next.replace(/<\/body>/i, `${HOMEPAGE_HERO_AUTHORITY_SCRIPT}</body>`);

  return next;
}

const HOMEPAGE_HERO_AUTHORITY_SCRIPT = `<script id="wmc-hero-authority-actions">
document.addEventListener("click",function(event){
  var trigger=event.target&&event.target.closest&&event.target.closest("[data-open-digital-reception]");
  if(!trigger)return;
  event.preventDefault();
  var launcher=document.querySelector(".digital-reception-launcher");
  if(launcher)launcher.click();
});
</script>`;

const HOMEPAGE_HERO_AUTHORITY_STYLE = `<style id="wmc-hero-authority-v6">
.home-page #home.hero.hero--authority-v6,
.home-page #home.hero.hero--authority-v6 .shell.hero-grid,
.home-page #home.hero.hero--authority-v6 .hero-copy{
  min-height:0!important;
  max-height:none!important;
  height:auto!important;
}
.home-page #home.hero.hero--authority-v6{
  --hero-navy:#163D68;
  --hero-teal:#007A87;
  --hero-green:#008B6D;
  --hero-bg:#F7F9FA;
  position:relative!important;
  z-index:1!important;
  isolation:isolate!important;
  display:block!important;
  flex-direction:unset!important;
  padding:24px 16px 0!important;
  overflow:visible!important;
  background:linear-gradient(165deg,#f8f4ef 0%,var(--hero-bg) 42%,#eef4f6 100%)!important;
  color:var(--hero-navy)!important;
}
.home-page #home.hero.hero--authority-v6 .shell.hero-grid{
  position:relative!important;
  inset:auto!important;
  display:grid!important;
  flex:none!important;
  grid-template-columns:1fr!important;
  align-items:stretch!important;
  gap:20px!important;
  width:100%!important;
  max-width:var(--max,1320px)!important;
  margin:0 auto!important;
  padding:0!important;
  overflow:visible!important;
  box-sizing:border-box!important;
}
.home-page #home.hero.hero--authority-v6 .hero-copy{
  position:relative!important;
  inset:auto!important;
  z-index:2!important;
  order:2!important;
  display:flex!important;
  flex-direction:column!important;
  justify-content:flex-start!important;
  align-items:stretch!important;
  width:100%!important;
  max-width:none!important;
  margin:0!important;
  padding:0!important;
  color:var(--hero-navy)!important;
}
.home-page #home.hero.hero--authority-v6 .hero-content-panel{
  width:100%;
  max-width:520px;
  margin:0 auto;
  padding:1.35rem 1.25rem 1.2rem;
  text-align:center;
  border:1px solid rgba(22,61,104,.12);
  border-radius:24px;
  background:rgba(255,255,255,.92);
  box-shadow:0 10px 28px rgba(22,61,104,.1);
  backdrop-filter:blur(14px) saturate(1.15);
  -webkit-backdrop-filter:blur(14px) saturate(1.15);
  box-sizing:border-box;
}
.home-page #home.hero.hero--authority-v6 .hero-eyebrow{
  margin:0 0 .55rem!important;
  color:var(--hero-teal)!important;
  font-size:.72rem!important;
  font-weight:700!important;
  letter-spacing:.08em!important;
  line-height:1.3!important;
  text-transform:uppercase!important;
}
.home-page #home.hero.hero--authority-v6 .hero-content-panel>h1{
  max-width:14ch!important;
  margin:0 auto .7rem!important;
  color:var(--hero-navy)!important;
  font-size:clamp(1.7rem,5.4vw,2.2rem)!important;
  line-height:1.14!important;
  letter-spacing:-.028em!important;
  text-align:center!important;
  text-wrap:balance!important;
  text-shadow:none!important;
}
.home-page #home.hero.hero--authority-v6 .hero-headline-break{
  display:inline!important;
}
.home-page #home.hero.hero--authority-v6 .hero-lede{
  max-width:36ch!important;
  margin:0 auto 1.05rem!important;
  color:#4a5d6c!important;
  font-size:.96rem!important;
  line-height:1.58!important;
  text-align:center!important;
  text-shadow:none!important;
}
.home-page #home.hero.hero--authority-v6 .hero-actions-polished{
  justify-content:center!important;
}
.home-page #home.hero.hero--authority-v6 .hero-tertiary-link{
  width:100%!important;
  text-align:center!important;
}
.home-page #home.hero.hero--authority-v6 .hero-trust-badges{
  display:grid!important;
  grid-template-columns:1fr 1fr!important;
  gap:8px!important;
  list-style:none!important;
  margin:0 0 1.15rem!important;
  padding:0!important;
}
.home-page #home.hero.hero--authority-v6 .hero-trust-badge{
  display:inline-flex!important;
  align-items:center!important;
  gap:.45rem!important;
  min-height:40px!important;
  padding:.45rem .7rem .45rem .5rem!important;
  border:1px solid rgba(0,122,135,.22)!important;
  border-radius:999px!important;
  background:linear-gradient(180deg,#fff 0%,#f3fafb 100%)!important;
  box-shadow:0 2px 8px rgba(22,61,104,.06)!important;
  color:var(--hero-navy)!important;
  font-size:.74rem!important;
  font-weight:700!important;
  line-height:1.25!important;
  text-decoration:none!important;
}
.home-page #home.hero.hero--authority-v6 .hero-trust-badge:hover,
.home-page #home.hero.hero--authority-v6 .hero-trust-badge:focus-visible{
  border-color:rgba(0,122,135,.45)!important;
  background:#eaf6f7!important;
  color:var(--hero-navy)!important;
  outline:none!important;
}
.home-page #home.hero.hero--authority-v6 .hero-trust-badge:focus-visible{
  outline:2px solid var(--hero-teal)!important;
  outline-offset:2px!important;
}
.home-page #home.hero.hero--authority-v6 .hero-trust-check{
  display:inline-flex!important;
  flex:0 0 auto;
  justify-content:center!important;
  align-items:center!important;
  width:1.45rem!important;
  height:1.45rem!important;
  border-radius:999px!important;
  background:var(--hero-green)!important;
  color:#fff!important;
  font-size:.72rem!important;
  font-weight:700!important;
  line-height:1!important;
}
.home-page #home.hero.hero--authority-v6 .hero-actions-polished{
  display:flex!important;
  flex-direction:column!important;
  flex-wrap:nowrap!important;
  gap:10px!important;
  margin:0 0 .85rem!important;
}
.home-page #home.hero.hero--authority-v6 .hero-actions-polished .button{
  display:inline-flex!important;
  justify-content:center!important;
  align-items:center!important;
  width:100%!important;
  min-width:0!important;
  min-height:50px!important;
  padding:13px 18px!important;
  border:0!important;
  border-radius:12px!important;
  background:var(--hero-navy)!important;
  color:#fff!important;
  font-weight:700!important;
  box-shadow:0 6px 16px rgba(22,61,104,.22)!important;
  text-align:center!important;
}
.home-page #home.hero.hero--authority-v6 .hero-actions-polished .button:hover,
.home-page #home.hero.hero--authority-v6 .hero-actions-polished .button:focus-visible{
  background:#123552!important;
  outline:2px solid #123552!important;
  outline-offset:2px!important;
}
.home-page #home.hero.hero--authority-v6 .button-call-polished{
  background:#fff!important;
  border:1.5px solid var(--hero-navy)!important;
  color:var(--hero-navy)!important;
  box-shadow:none!important;
}
.home-page #home.hero.hero--authority-v6 .button-call-polished:hover,
.home-page #home.hero.hero--authority-v6 .button-call-polished:focus-visible{
  background:rgba(22,61,104,.05)!important;
  color:var(--hero-navy)!important;
  outline:2px solid var(--hero-navy)!important;
  outline-offset:2px!important;
}
.home-page #home.hero.hero--authority-v6 .hero-tertiary-link{
  display:inline-flex!important;
  justify-content:center!important;
  align-items:center!important;
  min-height:44px!important;
  color:var(--hero-teal)!important;
  font-size:.92rem!important;
  font-weight:650!important;
  text-decoration:underline!important;
  text-underline-offset:3px!important;
}
.home-page #home.hero.hero--authority-v6 .hero-tertiary-link:hover,
.home-page #home.hero.hero--authority-v6 .hero-tertiary-link:focus-visible{
  color:var(--hero-navy)!important;
  outline:2px solid var(--hero-teal)!important;
  outline-offset:3px!important;
  border-radius:4px!important;
}
.home-page #home.hero.hero--authority-v6 .hero-supporting-info{
  display:block!important;
  width:100%!important;
  max-width:none!important;
  margin:0!important;
  padding:0!important;
  gap:0!important;
}
.home-page #home.hero.hero--authority-v6 .hero-hours-refined{
  display:grid!important;
  grid-template-columns:1fr 1fr!important;
  gap:6px 12px!important;
  margin:0!important;
  padding:.85rem 0 0!important;
  border:0!important;
  border-top:1px solid rgba(219,228,233,.95)!important;
  color:#4a5d6c!important;
  background:transparent!important;
  font-size:.78rem!important;
  text-shadow:none!important;
}
.home-page #home.hero.hero--authority-v6 .hero-hours-refined>span{
  display:flex!important;
  justify-content:space-between!important;
  gap:.5rem!important;
}
.home-page #home.hero.hero--authority-v6 .hero-hours-refined strong{color:var(--hero-navy)!important;font-weight:650!important}
.home-page #home.hero.hero--authority-v6 .hero-hours-refined em{font-style:normal!important;color:#596b78!important}
.home-page #home.hero.hero--authority-v6 .hero-hours-actions{
  grid-column:1 / -1!important;
  display:flex!important;
  flex-wrap:wrap!important;
  gap:8px 14px!important;
  margin-top:.25rem!important;
}
.home-page #home.hero.hero--authority-v6 .hero-hours-link{
  color:var(--hero-teal)!important;
  font-weight:600!important;
  text-decoration:none!important;
}
.home-page #home.hero.hero--authority-v6 .hero-hours-link:hover,
.home-page #home.hero.hero--authority-v6 .hero-hours-link:focus-visible{
  text-decoration:underline!important;
  outline:2px solid var(--hero-teal)!important;
  outline-offset:2px!important;
}
.home-page #home.hero.hero--authority-v6 .hero-visual{
  position:relative!important;
  inset:auto!important;
  top:auto!important;
  right:auto!important;
  bottom:auto!important;
  left:auto!important;
  z-index:1!important;
  order:1!important;
  display:block!important;
  width:100%!important;
  height:auto!important;
  min-height:0!important;
  margin:0!important;
  overflow:hidden!important;
  border-radius:20px!important;
  background:#d5dee4!important;
  box-shadow:0 10px 28px rgba(22,61,104,.1)!important;
}
.home-page #home.hero.hero--authority-v6 .hero-visual::before{
  content:""!important;
  display:block!important;
  position:absolute!important;
  inset:0!important;
  z-index:2!important;
  background:linear-gradient(180deg,rgba(22,61,104,.1) 0%,rgba(22,61,104,.03) 36%,transparent 68%)!important;
  pointer-events:none!important;
}
.home-page #home.hero.hero--authority-v6 .hero-visual::after{display:none!important;content:none!important}
.home-page #home.hero.hero--authority-v6 .hero-picture{
  display:block!important;
  width:100%!important;
  height:auto!important;
  min-height:0!important;
}
.home-page #home.hero.hero--authority-v6 .hero-picture .hero-photo{
  display:block!important;
  width:100%!important;
  height:auto!important;
  min-height:0!important;
  max-height:none!important;
  object-fit:contain!important;
  object-position:center center!important;
  filter:none!important;
  transform:none!important;
}
.home-page #home.hero.hero--authority-v6 .bulk-art-hero,
.home-page #home.hero.hero--authority-v6 .hero-visual-caption{display:none!important}
.home-page #home.hero.hero--authority-v6 .hero-practitioner-strip{
  margin:20px 0 0!important;
  padding:18px 0 8px!important;
  border-top:1px solid rgba(219,228,233,.9)!important;
  background:rgba(255,255,255,.55)!important;
}
.home-page #home.hero.hero--authority-v6 .hero-practitioner-inner{
  display:flex!important;
  flex-direction:column!important;
  align-items:stretch!important;
  gap:14px!important;
  width:100%!important;
  max-width:var(--max,1320px)!important;
  margin:0 auto!important;
  padding:0!important;
}
.home-page #home.hero.hero--authority-v6 .hero-practitioner-heading{
  display:flex!important;
  flex-wrap:wrap!important;
  justify-content:space-between!important;
  align-items:baseline!important;
  gap:8px 16px!important;
  width:100%!important;
}
.home-page #home.hero.hero--authority-v6 .hero-practitioner-caption{
  margin:0!important;
  color:var(--hero-navy)!important;
  font-size:.98rem!important;
  font-weight:650!important;
  letter-spacing:.01em!important;
}
.home-page #home.hero.hero--authority-v6 .hero-practitioner-more{
  color:var(--hero-teal)!important;
  font-size:.86rem!important;
  font-weight:650!important;
  text-decoration:underline!important;
  text-underline-offset:3px!important;
  white-space:nowrap!important;
}
.home-page #home.hero.hero--authority-v6 .hero-practitioner-more:hover,
.home-page #home.hero.hero--authority-v6 .hero-practitioner-more:focus-visible{
  color:var(--hero-navy)!important;
  outline:2px solid var(--hero-teal)!important;
  outline-offset:3px!important;
  border-radius:4px!important;
}
.home-page #home.hero.hero--authority-v6 .hero-practitioner-faces{
  display:flex!important;
  flex-wrap:nowrap!important;
  justify-content:flex-start!important;
  gap:10px!important;
  width:100%!important;
  margin:0!important;
  padding:2px 2px 6px!important;
  list-style:none!important;
  overflow-x:auto!important;
  -webkit-overflow-scrolling:touch!important;
  scrollbar-width:thin!important;
}
.home-page #home.hero.hero--authority-v6 .hero-practitioner-face{
  display:flex!important;
  flex:0 0 auto!important;
  flex-direction:column!important;
  align-items:center!important;
  gap:.35rem!important;
  width:84px!important;
  color:var(--hero-navy)!important;
  text-decoration:none!important;
  text-align:center!important;
}
.home-page #home.hero.hero--authority-v6 .hero-practitioner-face:hover,
.home-page #home.hero.hero--authority-v6 .hero-practitioner-face:focus-visible{
  color:var(--hero-teal)!important;
  outline:none!important;
}
.home-page #home.hero.hero--authority-v6 .hero-practitioner-face:focus-visible .hero-practitioner-avatar{
  outline:2px solid var(--hero-teal)!important;
  outline-offset:2px!important;
}
.home-page #home.hero.hero--authority-v6 .hero-practitioner-avatar{
  width:64px!important;
  height:64px!important;
  border:2px solid #fff!important;
  border-radius:999px!important;
  object-fit:cover!important;
  object-position:center 18%!important;
  box-shadow:0 4px 14px rgba(22,61,104,.14)!important;
  background:#d7e0e6!important;
}
.home-page #home.hero.hero--authority-v6 .hero-practitioner-face span{
  display:block!important;
  max-width:84px!important;
  font-size:.62rem!important;
  font-weight:650!important;
  line-height:1.25!important;
}
.home-page #home.hero.hero--authority-v6 .hero-stats-bar{
  margin:14px 0 0!important;
  padding:16px 0 20px!important;
  border-top:1px solid rgba(219,228,233,.9)!important;
  background:rgba(255,255,255,.72)!important;
}
.home-page #home.hero.hero--authority-v6 .hero-stats-inner{
  display:grid!important;
  grid-template-columns:1fr 1fr!important;
  justify-items:stretch!important;
  gap:12px 14px!important;
  width:100%!important;
  max-width:var(--max,1320px)!important;
  margin:0 auto!important;
  padding:0!important;
}
.home-page #home.hero.hero--authority-v6 .hero-stat:last-child{
  grid-column:1 / -1!important;
  justify-self:center!important;
  width:max-content!important;
  max-width:100%!important;
}
.home-page #home.hero.hero--authority-v6 .hero-stat{
  display:flex!important;
  align-items:center!important;
  gap:.65rem!important;
  min-height:44px!important;
  margin:0!important;
  padding:.4rem .15rem!important;
  border:0!important;
  background:transparent!important;
  color:var(--hero-navy)!important;
  font:inherit!important;
  text-align:left!important;
  text-decoration:none!important;
  cursor:pointer!important;
  appearance:none!important;
  -webkit-appearance:none!important;
}
.home-page #home.hero.hero--authority-v6 a.hero-stat:hover,
.home-page #home.hero.hero--authority-v6 a.hero-stat:focus-visible,
.home-page #home.hero.hero--authority-v6 button.hero-stat:hover,
.home-page #home.hero.hero--authority-v6 button.hero-stat:focus-visible{
  color:var(--hero-teal)!important;
  outline:none!important;
}
.home-page #home.hero.hero--authority-v6 a.hero-stat:focus-visible,
.home-page #home.hero.hero--authority-v6 button.hero-stat:focus-visible{
  outline:2px solid var(--hero-teal)!important;
  outline-offset:3px!important;
  border-radius:8px!important;
}
.home-page #home.hero.hero--authority-v6 a.hero-stat:hover .hero-stat-icon,
.home-page #home.hero.hero--authority-v6 a.hero-stat:focus-visible .hero-stat-icon,
.home-page #home.hero.hero--authority-v6 button.hero-stat:hover .hero-stat-icon,
.home-page #home.hero.hero--authority-v6 button.hero-stat:focus-visible .hero-stat-icon{
  background:rgba(0,122,135,.18)!important;
}
.home-page #home.hero.hero--authority-v6 .hero-stat-icon{
  display:inline-flex!important;
  justify-content:center!important;
  align-items:center!important;
  flex:0 0 auto!important;
  width:1.85rem!important;
  height:1.85rem!important;
  border-radius:999px!important;
  background:rgba(0,122,135,.1)!important;
  color:var(--hero-teal)!important;
  font-size:.9rem!important;
  line-height:1!important;
  transition:background .15s ease!important;
}
.home-page #home.hero.hero--authority-v6 .hero-stat-label{
  font-size:.95rem!important;
  font-weight:650!important;
  line-height:1.35!important;
}
@media (min-width:701px){
.home-page #home.hero.hero--authority-v6{padding:28px 24px 0!important}
.home-page #home.hero.hero--authority-v6 .shell.hero-grid{gap:24px!important}
.home-page #home.hero.hero--authority-v6 .hero-content-panel{
  margin:0;
  padding:1.55rem 1.5rem 1.35rem;
  text-align:left;
}
.home-page #home.hero.hero--authority-v6 .hero-content-panel>h1{
  max-width:12ch!important;
  margin-left:0!important;
  margin-right:0!important;
  font-size:clamp(1.9rem,3vw,2.35rem)!important;
  text-align:left!important;
}
.home-page #home.hero.hero--authority-v6 .hero-lede{
  margin-left:0!important;
  margin-right:0!important;
  text-align:left!important;
}
.home-page #home.hero.hero--authority-v6 .hero-actions-polished{justify-content:flex-start!important}
.home-page #home.hero.hero--authority-v6 .hero-tertiary-link{
  width:auto!important;
  text-align:left!important;
}
.home-page #home.hero.hero--authority-v6 .hero-actions-polished{
  flex-direction:row!important;
  flex-wrap:wrap!important;
  align-items:center!important;
}
.home-page #home.hero.hero--authority-v6 .hero-actions-polished .button{
  width:auto!important;
  min-width:168px!important;
}
.home-page #home.hero.hero--authority-v6 .hero-tertiary-link{margin-left:.15rem!important}
.home-page #home.hero.hero--authority-v6 .hero-practitioner-faces{
  justify-content:space-between!important;
  gap:8px!important;
  overflow:visible!important;
  padding-bottom:0!important;
}
.home-page #home.hero.hero--authority-v6 .hero-practitioner-face{
  flex:1 1 0!important;
  width:auto!important;
  min-width:0!important;
  max-width:118px!important;
}
.home-page #home.hero.hero--authority-v6 .hero-practitioner-avatar{
  width:68px!important;
  height:68px!important;
}
.home-page #home.hero.hero--authority-v6 .hero-practitioner-face span{
  max-width:100%!important;
  font-size:.64rem!important;
}
.home-page #home.hero.hero--authority-v6 .hero-trust-badge{font-size:.78rem!important;padding:.5rem .8rem .5rem .55rem!important}
.home-page #home.hero.hero--authority-v6 .hero-stats-inner{
  grid-template-columns:repeat(3,minmax(0,1fr))!important;
}
.home-page #home.hero.hero--authority-v6 .hero-stat:last-child{
  grid-column:1 / -1!important;
  justify-self:center!important;
}
.home-page #home.hero.hero--authority-v6 .hero-stat-label{font-size:1rem!important}
}
.home-page #hotdoc-app .hotdoc-benefits{
  display:flex!important;
  flex-direction:column!important;
  gap:10px!important;
  margin:0!important;
  padding:0!important;
  list-style:none!important;
}
.home-page #hotdoc-app .hotdoc-benefits>li{
  margin:0!important;
  padding:0!important;
  border:0!important;
  list-style:none!important;
}
.home-page #hotdoc-app .hotdoc-benefits>li::before,
.home-page #hotdoc-app .hotdoc-benefits>li::marker{display:none!important;content:none!important}
.home-page #hotdoc-app .hotdoc-benefits a{
  display:flex!important;
  align-items:center!important;
  gap:.7rem!important;
  width:100%!important;
  min-height:48px!important;
  margin:0!important;
  padding:.75rem 1rem!important;
  border:1px solid rgba(0,122,135,.2)!important;
  border-radius:12px!important;
  background:linear-gradient(180deg,#fff 0%,#f3fafb 100%)!important;
  box-shadow:0 2px 8px rgba(22,61,104,.06)!important;
  color:#163D68!important;
  font-size:.95rem!important;
  font-weight:650!important;
  line-height:1.3!important;
  text-decoration:none!important;
  transition:border-color .15s ease,background .15s ease,box-shadow .15s ease,transform .15s ease!important;
}
.home-page #hotdoc-app .hotdoc-benefits a::before{
  content:""!important;
  display:inline-block!important;
  flex:0 0 auto!important;
  width:.55rem!important;
  height:.55rem!important;
  border-radius:999px!important;
  background:#008B6D!important;
  box-shadow:0 0 0 4px rgba(0,139,109,.12)!important;
}
.home-page #hotdoc-app .hotdoc-benefits a::after{
  content:"→"!important;
  margin-left:auto!important;
  color:#007A87!important;
  font-weight:700!important;
  opacity:.85!important;
}
.home-page #hotdoc-app .hotdoc-benefits a:hover,
.home-page #hotdoc-app .hotdoc-benefits a:focus-visible{
  border-color:rgba(0,122,135,.45)!important;
  background:#eaf6f7!important;
  box-shadow:0 4px 14px rgba(22,61,104,.1)!important;
  color:#163D68!important;
  text-decoration:none!important;
  outline:2px solid #007A87!important;
  outline-offset:2px!important;
  transform:translateY(-1px)!important;
}
@media (min-width:1025px){
.home-page #home.hero.hero--authority-v6{
  padding:36px 28px 0!important;
}
.home-page #home.hero.hero--authority-v6 .shell.hero-grid{
  display:grid!important;
  grid-template-columns:minmax(280px,520px) minmax(0,1fr)!important;
  align-items:center!important;
  gap:28px 32px!important;
  width:100%!important;
  max-width:var(--max,1320px)!important;
  min-height:0!important;
  height:auto!important;
  margin:0 auto!important;
  overflow:visible!important;
}
.home-page #home.hero.hero--authority-v6 .hero-copy{
  align-items:stretch!important;
  justify-content:center!important;
  width:100%!important;
  min-height:0!important;
  height:auto!important;
}
.home-page #home.hero.hero--authority-v6 .hero-content-panel{
  max-width:520px;
  width:100%;
  margin:0 0 0 auto;
  padding:1.85rem 1.75rem 1.55rem;
}
.home-page #home.hero.hero--authority-v6 .hero-content-panel>h1{
  max-width:11.5ch!important;
  font-size:clamp(2rem,2.35vw,2.4rem)!important;
}
.home-page #home.hero.hero--authority-v6 .hero-lede{font-size:1.02rem!important}
.home-page #home.hero.hero--authority-v6 .hero-trust-badges{
  grid-template-columns:1fr 1fr!important;
  gap:10px!important;
  margin:0 0 1.25rem!important;
}
.home-page #home.hero.hero--authority-v6 .hero-trust-badge{
  font-size:.8rem!important;
  min-height:42px!important;
}
.home-page #home.hero.hero--authority-v6 .hero-supporting-info,
.home-page #home.hero.hero--authority-v6 .hero-hours-refined{
  display:none!important;
  margin:0!important;
  padding:0!important;
  height:0!important;
  overflow:hidden!important;
  border:0!important;
}
.home-page #home.hero.hero--authority-v6 .hero-actions-polished{margin-bottom:0!important}
.home-page #home.hero.hero--authority-v6 .hero-copy{order:1!important}
.home-page #home.hero.hero--authority-v6 .hero-visual{
  position:relative!important;
  inset:auto!important;
  top:auto!important;
  right:auto!important;
  bottom:auto!important;
  left:auto!important;
  order:2!important;
  width:100%!important;
  height:auto!important;
  min-height:0!important;
  border-radius:24px!important;
}
.home-page #home.hero.hero--authority-v6 .hero-picture,
.home-page #home.hero.hero--authority-v6 .hero-picture .hero-photo{
  min-height:0!important;
  max-height:none!important;
  height:auto!important;
  object-fit:contain!important;
  object-position:center center!important;
}
.home-page #home.hero.hero--authority-v6 .hero-practitioner-strip{
  margin:26px 0 0!important;
  padding:22px 0 10px!important;
}
.home-page #home.hero.hero--authority-v6 .hero-practitioner-caption{font-size:1.02rem!important}
.home-page #home.hero.hero--authority-v6 .hero-practitioner-avatar{
  width:76px!important;
  height:76px!important;
}
.home-page #home.hero.hero--authority-v6 .hero-practitioner-face span{font-size:.68rem!important}
.home-page #home.hero.hero--authority-v6 .hero-stats-bar{
  margin:18px 0 0!important;
  padding:18px 0 22px!important;
}
.home-page #home.hero.hero--authority-v6 .hero-stats-inner{
  grid-template-columns:repeat(5,minmax(0,1fr))!important;
  gap:10px 20px!important;
  width:100%!important;
  max-width:var(--max,1320px)!important;
}
.home-page #home.hero.hero--authority-v6 .hero-stat:last-child{grid-column:auto!important}
.home-page #home.hero.hero--authority-v6 .hero-stat-icon{
  width:2.05rem!important;
  height:2.05rem!important;
  font-size:1rem!important;
}
.home-page #home.hero.hero--authority-v6 .hero-stat-label{
  font-size:1.05rem!important;
  letter-spacing:.01em!important;
}
}
</style>`;


