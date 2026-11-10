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
import {
  refineExpressInterestFriction,
  refineJoinOurTeamRecruitment,
} from "@/documents/join-our-team-recruitment";
import { alignPhoneOnlyPractitionerChrome } from "@/documents/phone-only-booking";
import {
  eoiHrefForPage,
  renderConfidentialityPanelHtml,
  renderRecruitmentContactHtml,
  resolveRecruitmentContact,
} from "@/recruitment";
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

const GP_VISIBLE_CARE_AREA_COUNT = 3;

/**
 * Preserve every clinical-interest pill; collapse the 4th+ behind an accessible
 * disclosure so unusually long lists do not dominate card height.
 */
export function wrapExcessGpDiscoveryAreas(html: string): string {
  if (!/\bgp-discovery-areas\b/i.test(html)) return html;
  return html.replace(
    /(<ul\b[^>]*\bgp-discovery-areas\b[^>]*>)([\s\S]*?)(<\/ul>)/gi,
    (full, open: string, inner: string, close: string) => {
      if (/\bgp-discovery-areas-disclosure\b/i.test(inner)) return full;
      const items = [...inner.matchAll(/<li\b[^>]*>[\s\S]*?<\/li>/gi)].map((m) => m[0]);
      if (items.length <= GP_VISIBLE_CARE_AREA_COUNT) return full;
      const visible = items.slice(0, GP_VISIBLE_CARE_AREA_COUNT).join("");
      const rest = items.slice(GP_VISIBLE_CARE_AREA_COUNT);
      const moreLabel =
        rest.length === 1 ? "1 more clinical interest" : `${rest.length} more clinical interests`;
      return `${open}${visible}<li class="gp-discovery-areas-more"><details class="gp-discovery-areas-disclosure"><summary>${moreLabel}</summary><ul class="gp-discovery-areas-extra">${rest.join("")}</ul></details></li>${close}`;
    },
  );
}

/**
 * Prevent sticky-dock CLS: first paint must already use the final has-action-dock
 * full-width layout, with the Digital Reception launcher in place. digital-reception.js
 * then binds behaviour without changing dock geometry.
 */
function stabilisePersistentCareDock(html: string): string {
  if (!/<nav\b[^>]*\bpersistent-care-actions\b/i.test(html)) return html;
  let next = html;
  next = next.replace(/<body\b([^>]*)>/i, (tag, attrs: string) => {
    if (/\bhas-action-dock\b/.test(attrs)) return tag;
    if (/\bclass="/i.test(attrs)) {
      return `<body${attrs.replace(/\bclass="/i, 'class="has-action-dock ')}>`;
    }
    return `<body class="has-action-dock"${attrs}>`;
  });

  const launcherHtml =
    '<button type="button" class="digital-reception-launcher digital-reception-dock-action" aria-expanded="false" aria-controls="digital-reception-panel" aria-haspopup="dialog" aria-label="Open Digital Reception — ask for information"><span class="digital-reception-launcher-full">Digital Reception</span><span class="digital-reception-launcher-compact">Ask us</span></button>';

  if (!/\bdigital-reception-launcher\b/.test(next)) {
    next = next.replace(
      /(<div\b[^>]*\bclass="[^"]*\bpersistent-care-actions-inner\b[^"]*"[^>]*>)([\s\S]*?)(<\/div>\s*<\/nav>)/i,
      (_match, open: string, inner: string, close: string) => {
        if (/\bdigital-reception-launcher\b/.test(inner)) return `${open}${inner}${close}`;
        return `${open}${inner}${launcherHtml}${close}`;
      },
    );
  }

  // Match post-DR aria-label for patient docks only (leave GP recruitment label alone).
  next = next.replace(
    /(<nav\b(?=[^>]*\bpersistent-care-actions\b)(?![^>]*persistent-care-actions--recruitment)[^>]*\baria-label=")[^"]*(")/i,
    "$1Book, call, and reception$2",
  );

  return next;
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
  const markSrc = pagePath.includes("/")
    ? "../assets/brand/agpal-mark.webp?v=20261106a"
    : "assets/brand/agpal-mark.webp?v=20261106a";
  return html.replace(
    /<section class="article-section">\s*<h2>Quality and safety\.?<\/h2>\s*<div class="logo-lockup-page">[\s\S]*?<\/div>(?:\s*<p>\s*<a class="text-link"[^>]*>[\s\S]*?<\/a>\s*<\/p>)?\s*<\/section>/i,
    `<section class="article-section"><h2>Quality and safety</h2><div class="logo-lockup-page"><img alt="Accredited General Practice" data-local-asset="agpal-mark" src="${markSrc}" width="92" height="92"/><div><p>AGPAL accreditation provides independent recognition that our practice meets applicable national general practice standards. It supports a structured approach to safety, governance, privacy, infection prevention and continuous improvement.</p><p><a class="text-link" href="${agpalHref}">Why accreditation matters →</a></p></div></div></section>`,
  );
}

/**
 * Contact page: keep the network callout after the map (Find us), not between
 * reception details and the map — without editing golden-master HTML.
 */
function refineContactPageSections(html: string, pagePath: string): string {
  if (!/(^|\/)contact\.html$/i.test(pagePath)) return html;
  const networkRe =
    /<section\b[^>]*\bclass="[^"]*\bnetwork-authority-callout\b[^"]*"[^>]*>[\s\S]*?<\/section>/i;
  const network = html.match(networkRe)?.[0];
  if (!network) return html;
  const withoutNetwork = html.replace(networkRe, "");
  const findUsRe =
    /(<section\b[^>]*\bclass="[^"]*\barticle-section\b[^"]*"[^>]*>\s*<h2>Find us\.?<\/h2>[\s\S]*?<\/section>)/i;
  if (!findUsRe.test(withoutNetwork)) return html;
  return withoutNetwork.replace(findUsRe, `$1${network}`);
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
  // Serve CSS/JS via /wmc-cache/* (Next route) so Hostinger cannot short-circuit
  // public/*.css/*.js without Cache-Control. Absolute paths work from nested pages.
  const styleHref = "/wmc-cache/styles.min.css?v=wmc-updates-dr-mobile-20261106e";
  const siteJsHref = "/wmc-cache/site.js?v=wmc-phone-only-chrome-20261109a";
  const updatesDataHref = "/wmc-cache/updates-data.js?v=wmc-golnar-phone-only-20261109a";
  const updatesUiHref = "/wmc-cache/updates-ui.js?v=wmc-doctor-welcome-20261106a";
  // Include optional existing /wmc-cache/ prefix so re-application is idempotent.
  next = next.replace(/(?:\/wmc-cache\/)?(?:\.\.\/)*styles(?:\.min)?\.css(?:\?[^"]*)?(?=")/g, styleHref);
  // Normalise contact/footer clock meridians (7:00am → 7:00 AM) so Hostinger matches NEXT layout.
  next = next.replace(
    /(<div\b[^>]*class="(?:contact-hours-detail|footer-hours)"[^>]*>)([\s\S]*?)(<\/div>)/gi,
    (_match, open: string, inner: string, close: string) =>
      `${open}${inner.replace(/\b(\d{1,2}:\d{2})\s*([AaPp][Mm])\b/g, (_t, clock: string, mer: string) => `${clock} ${mer.toUpperCase()}`)}${close}`,
  );
  // site.js / updates scripts: immutable cache via /wmc-cache + query bust on change.
  next = next.replace(/(?:\/wmc-cache\/)?(?:\.\.\/)*site\.js(?:\?[^"]*)?(?=")/g, siteJsHref);
  next = next.replace(/(?:\/wmc-cache\/)?(?:\.\.\/)*updates-data\.js(?:\?[^"]*)?(?=")/g, updatesDataHref);
  next = next.replace(/(?:\/wmc-cache\/)?(?:\.\.\/)*updates-ui\.js(?:\?[^"]*)?(?=")/g, updatesUiHref);
  // Circular AGPAL mark: keep transparent on light cards, restore white pad on dark footers.
  next = next.replace(/<style\b[^>]*id="wmc-agpal-mark-fix"[\s\S]*?<\/style>\s*/i, "");
  next = next.replace(/<style\b[^>]*id="wmc-team-authority-list-fix"[\s\S]*?<\/style>\s*/i, "");
  next = next.replace(/<style\b[^>]*id="wmc-about-laptop-fix"[\s\S]*?<\/style>\s*/i, "");
  next = next.replace(/<style\b[^>]*id="wmc-update-tags"[\s\S]*?<\/style>\s*/i, "");
  next = next.replace(/<style\b[^>]*id="wmc-update-article-header-fix"[\s\S]*?<\/style>\s*/i, "");
  next = next.replace(/<style\b[^>]*id="wmc-team-updates-laptop"[\s\S]*?<\/style>\s*/i, "");
  next = next.replace(/<style\b[^>]*id="wmc-team-updates-mobile"[\s\S]*?<\/style>\s*/i, "");
  next = next.replace(/<style\b[^>]*id="wmc-practitioner-directory-cards"[\s\S]*?<\/style>\s*/i, "");
  next = next.replace(/<style\b[^>]*id="wmc-team-copy-fullwidth"[\s\S]*?<\/style>\s*/i, "");
  next = next.replace(/<style\b[^>]*id="wmc-digital-reception-mobile"[\s\S]*?<\/style>\s*/i, "");
  next = wrapExcessGpDiscoveryAreas(next);
  next = next.replace(
    /<\/head>/i,
    `<style id="wmc-agpal-mark-fix">
img[data-local-asset="agpal-mark"]{object-fit:contain!important;object-position:center!important}
.footer-trust img[data-local-asset="agpal-mark"],
.footer-trust a img[data-local-asset="agpal-mark"]{
  background:#fff!important;border-radius:8px!important;object-fit:contain!important;object-position:center!important
}
</style>
<style id="wmc-update-article-header-fix">
/* Global styles.css uses header{position:sticky} for site chrome only.
   Article page headers must scroll away with the document. */
header.update-article-header{
  position:static!important;
  top:auto!important;
  z-index:auto!important;
  background:transparent!important;
  border-bottom:0!important;
  backdrop-filter:none!important;
  -webkit-backdrop-filter:none!important;
}
</style>
<style id="wmc-update-tags">
.update-tags{display:flex;flex-wrap:wrap;gap:.45rem;margin:.85rem 0 0}
.update-tags span{display:inline-flex;align-items:center;padding:.28rem .62rem;border:1px solid rgba(15,61,62,.18);border-radius:999px;font-size:.78rem;line-height:1.2;color:#0f3d3e;background:#f7fbfb}
.update-article-section .service-cta-actions{display:flex;flex-wrap:wrap;gap:.75rem;align-items:center;margin-top:1rem}
</style>
<style id="wmc-team-updates-laptop">
/* Laptop (≈1025–1440): team directory + updates landing polish. No content removed. */
.team-directory-grid .credentials,
.team-directory-grid .focus,
.gp-discovery-qualifications{
  overflow-wrap:anywhere!important;
  word-break:normal!important;
}
.team-directory-grid .practitioner-meta{align-content:start!important}
.team-ecosystem-nav a{
  min-width:0!important;
  box-sizing:border-box!important;
}
.team-ecosystem-nav strong,
.team-ecosystem-nav span{
  overflow-wrap:anywhere!important;
}
/* Square doctor-welcome banners: keep full artwork readable in 16:10 frames. */
.featured-update-image img[src*="welcome-dr-"],
.health-update-image img[src*="welcome-dr-"],
.update-article-image img[src*="welcome-dr-"]{
  object-fit:contain!important;
  object-position:center!important;
  background:#eef2f3!important;
}
.featured-health-update{
  align-items:start!important;
}
@media (min-width:1025px) and (max-width:1440px){
  .team-ecosystem-nav a{padding:18px 12px!important;gap:6px!important}
  .team-ecosystem-nav strong{font-size:12.5px!important;line-height:1.3!important}
  .team-ecosystem-nav span{font-size:11px!important;line-height:1.4!important}
  .team-directory-grid{gap:36px 22px!important}
  .featured-update-copy h2{font-size:clamp(1.7rem,2.5vw,2.2rem)!important;line-height:1.18!important}
  .update-article-layout{gap:48px!important}
  .update-article-header h1{font-size:clamp(2rem,3.2vw,2.75rem)!important}
  .gp-discovery-list{gap:18px!important}
}
</style>
<style id="wmc-team-updates-mobile">
/* Phone / small tablet: team + updates polish. No content removed. */
.team-directory-grid .practitioner,
.team-directory-grid .practitioner-meta,
.team-directory-grid .credentials,
.team-directory-grid .focus,
.gp-discovery-info,
.gp-discovery-qualifications{
  min-width:0!important;
}
.team-directory-grid .credentials,
.team-directory-grid .focus,
.gp-discovery-qualifications,
nav[aria-label="Breadcrumb"],
.breadcrumb{
  overflow-wrap:anywhere!important;
  word-break:normal!important;
}
@media (max-width:700px){
  /* Override styles.css 2-col team grid (≤700) so cards are readable full-width. */
  .team-directory-grid{
    grid-template-columns:1fr!important;
    gap:28px!important;
  }
  .team-directory-grid .portrait,
  .team-directory-grid .team-authority-photo-unavailable,
  .team-directory-grid a.portrait{
    width:100%!important;
    max-width:100%!important;
  }
  .team-directory-grid .practitioner h3,
  .team-directory-grid .practitioner h3 a{
    font-size:clamp(1.15rem,5vw,1.35rem)!important;
    line-height:1.25!important;
  }
  .team-directory-grid .credentials{font-size:13px!important;line-height:1.45!important}
  .team-directory-grid .focus{font-size:14px!important;line-height:1.45!important}
  .team-authority-subpage .gp-discovery-card .gp-discovery-info{min-width:0!important}
  .team-authority-subpage .gp-discovery-qualifications{
    overflow-wrap:anywhere!important;
    word-break:normal!important;
  }
  .team-authority-subpage .gp-discovery-actions{
    grid-column:1/-1!important;
    width:100%!important;
  }
  .team-authority-subpage .gp-discovery-profile,
  .team-authority-subpage .gp-discovery-book{
    min-height:44px!important;
    font-size:12.5px!important;
    padding:10px 8px!important;
    text-align:center!important;
  }
  .featured-update-copy h2{
    font-size:clamp(1.4rem,6vw,1.85rem)!important;
    line-height:1.2!important;
  }
  .featured-health-update{gap:28px!important}
  /* Square doctor-welcome artworks: fill phone width (no side letterbox in 16:10). */
  .health-update-image:has(img[src*="welcome-dr-"]){
    aspect-ratio:1/1!important;
  }
  .featured-update-image img[src*="welcome-dr-"],
  .update-article-image img[src*="welcome-dr-"],
  .health-update-image img[src*="welcome-dr-"]{
    aspect-ratio:1/1!important;
    width:100%!important;
    height:100%!important;
    object-fit:contain!important;
    object-position:center!important;
    background:#eef2f3!important;
  }
  .updates-archive-heading h2{
    font-size:clamp(1.55rem,6.2vw,2rem)!important;
    line-height:1.18!important;
  }
  .updates-page-hero .page-hero-inner h1{
    font-size:clamp(1.55rem,6.6vw,2.05rem)!important;
    line-height:1.18!important;
  }
  .update-filters{
    flex-wrap:nowrap!important;
    overflow-x:auto!important;
    -webkit-overflow-scrolling:touch!important;
    overscroll-behavior-x:contain!important;
    gap:8px!important;
    padding-bottom:4px!important;
    margin-right:-6px!important;
    padding-right:18px!important;
    scrollbar-width:none!important;
  }
  .update-filters::-webkit-scrollbar{display:none!important;height:0!important;width:0!important}
  .update-filter{flex:0 0 auto!important;min-height:44px!important}
  .update-count{margin-bottom:22px!important}
  .updates-archive-grid{gap:28px!important}
  .updates-archive-section{padding-bottom:calc(100px + env(safe-area-inset-bottom,0px))!important}
  .health-update-copy h3{
    font-size:clamp(1.05rem,4.8vw,1.2rem)!important;
    line-height:1.3!important;
  }
  .update-article-header h1{
    font-size:clamp(1.55rem,6.4vw,2rem)!important;
    line-height:1.18!important;
  }
  .update-article-layout{gap:28px!important}
  .update-article-shell{padding-bottom:calc(92px + env(safe-area-inset-bottom,0px))!important}
  .update-article-section .service-cta-actions{
    display:flex!important;
    flex-direction:column!important;
    align-items:stretch!important;
    gap:.65rem!important;
  }
  .update-article-section .service-cta-actions a,
  .update-article-section .service-cta-actions .button{
    width:100%!important;
    max-width:100%!important;
    box-sizing:border-box!important;
    justify-content:center!important;
    text-align:center!important;
  }
  .update-tags{gap:.4rem!important}
  .update-tags span{
    max-width:100%!important;
    overflow-wrap:anywhere!important;
  }
  nav[aria-label="Breadcrumb"] li:last-child,
  .breadcrumb li:last-child{
    overflow-wrap:anywhere!important;
  }
  .doctor-profile-heading h1{
    font-size:clamp(1.7rem,7vw,2.25rem)!important;
    line-height:1.15!important;
  }
  .doctor-profile-actions{
    width:100%!important;
    flex-direction:column!important;
    align-items:stretch!important;
  }
  .doctor-profile-actions .button,
  .doctor-profile-actions a.button{
    width:100%!important;
    box-sizing:border-box!important;
    text-align:center!important;
    justify-content:center!important;
  }
  .on-this-page-links{
    max-width:100%!important;
    overscroll-behavior-x:contain!important;
  }
  /* Homepage latest-updates strip stays readable on phone. */
  .latest-health-updates .latest-health-grid{gap:22px!important}
  .latest-supporting-column .health-update-copy h3,
  .latest-supporting-column .health-update-card:first-child .health-update-copy h3{
    overflow-wrap:anywhere!important;
  }
  /* Beat home-page 15/8 photographic footprint for square welcome banners. */
  .home-page .latest-health-updates .health-update-card:first-child .health-update-image:has(img[src*="welcome-dr-"]),
  .home-page .latest-health-updates .health-update-image:has(img[src*="welcome-dr-"]),
  .home-page .latest-featured-column .health-update-image:has(img[src*="welcome-dr-"]),
  .home-page .latest-supporting-column .health-update-image:has(img[src*="welcome-dr-"]){
    aspect-ratio:1/1!important;
    height:auto!important;
    max-height:none!important;
  }
  .home-page .latest-health-updates .health-update-image img[src*="welcome-dr-"]{
    width:100%!important;
    height:100%!important;
    object-fit:contain!important;
    object-position:center!important;
  }
}
@media (max-width:390px){
  /* Keep photo + info side-by-side; CTAs stay under the info column. */
  .team-authority-subpage .gp-discovery-card{
    grid-template-columns:80px minmax(0,1fr)!important;
    grid-template-rows:auto auto auto!important;
    gap:10px 12px!important;
  }
  .team-authority-subpage .gp-discovery-card .team-authority-photo,
  .team-authority-subpage .gp-discovery-card .team-authority-photo-unavailable{
    width:80px!important;
    grid-column:1!important;
    grid-row:1/span 3!important;
  }
  .team-authority-subpage .gp-discovery-card .gp-discovery-info{
    grid-row:1!important;
    grid-column:2!important;
  }
  .team-authority-subpage .gp-discovery-card .gp-discovery-actions{
    grid-column:2!important;
    grid-row:3!important;
    grid-template-columns:1fr 1fr!important;
    gap:7px!important;
  }
}
</style>
<style id="wmc-practitioner-directory-cards">
/* Package B: content-hugging practitioner directory cards, stable photos, CTA footers,
   subdued status badges, natural page scroll, no horizontal overflow. */
.team-directory,
.team-directory-grid,
.gp-discovery-list,
.gp-discovery-card,
.practitioner-directory-card,
.gp-discovery-info,
.practitioner-meta{
  min-width:0;
  max-width:100%;
  box-sizing:border-box;
}
.team-directory-grid{
  display:grid!important;
  grid-template-columns:repeat(4,minmax(0,1fr))!important;
  grid-auto-rows:auto!important;
  align-items:start!important;
  gap:42px 28px!important;
  overflow:visible!important;
  max-height:none!important;
}
.team-directory-grid .practitioner,
.team-directory-grid .practitioner-directory-card{
  display:flex!important;
  flex-direction:column!important;
  height:auto!important;
  min-width:0!important;
  overflow:visible!important;
}
.team-directory-grid .portrait,
.team-directory-grid a.portrait,
.team-directory-grid .team-authority-photo-unavailable{
  display:block!important;
  width:100%!important;
  max-width:100%!important;
  aspect-ratio:4/5!important;
  overflow:hidden!important;
  border-radius:var(--radius-md,16px)!important;
  background:#edf1f3!important;
  flex:0 0 auto!important;
}
.team-directory-grid .portrait img{
  display:block!important;
  width:100%!important;
  height:100%!important;
  aspect-ratio:4/5!important;
  object-fit:cover!important;
  object-position:center 28%!important;
}
.team-directory-grid .practitioner-meta{
  display:flex!important;
  flex-direction:column!important;
  flex:0 1 auto!important;
  gap:.35rem!important;
  min-height:0!important;
  padding-top:14px!important;
  grid-template-rows:none!important;
}
.team-directory-grid .practitioner h3,
.team-directory-grid .practitioner h3 a{
  margin:0 0 .35rem!important;
  min-height:0!important;
  font-family:var(--font-display,"Libre Baskerville",Georgia,serif)!important;
  font-size:clamp(1.05rem,1.15vw,1.25rem)!important;
  line-height:1.28!important;
  font-weight:400!important;
  color:var(--ink,#173044)!important;
}
.team-directory-grid .credentials{
  margin:0 0 .3rem!important;
  min-height:0!important;
  color:#4f6c82!important;
  font-size:.75rem!important;
  font-weight:600!important;
  letter-spacing:.02em!important;
  line-height:1.45!important;
  overflow-wrap:anywhere!important;
}
.team-directory-grid .focus,
.team-directory-grid .role{
  margin:0 0 .35rem!important;
  color:var(--ink-soft,#596b78)!important;
  font-size:.8125rem!important;
  line-height:1.5!important;
  overflow-wrap:anywhere!important;
}
.team-directory-grid .practitioner-meta .text-link,
.team-directory-grid .practitioner-meta .gp-discovery-actions,
.team-directory-grid .practitioner-meta .button{
  margin-top:.35rem!important;
  padding-top:0!important;
}
.team-directory-grid .practitioner-meta .text-link{
  display:inline-flex!important;
  align-items:center!important;
  min-height:44px!important;
}
.team-authority-subpage .page-layout{
  align-items:start!important;
}
.team-authority-subpage .gp-discovery-list{
  display:grid!important;
  grid-template-columns:repeat(2,minmax(0,1fr))!important;
  /* Content-sized rows: avoid 1fr stretch that leaves large voids above CTAs. */
  grid-auto-rows:auto!important;
  align-items:start!important;
  gap:18px!important;
  overflow:visible!important;
  max-height:none!important;
}
.team-authority-subpage .gp-discovery-card{
  display:grid!important;
  grid-template-columns:116px minmax(0,1fr)!important;
  grid-template-rows:auto auto auto!important;
  align-items:start!important;
  align-content:start!important;
  height:auto!important;
  min-width:0!important;
  overflow-x:hidden!important;
  overflow-y:visible!important;
  padding:18px!important;
  gap:10px 16px!important;
}
/* Photo stays top-left; note + CTAs stack under the info column so short
   bios do not leave a large void above full-width actions. */
.team-authority-subpage .gp-discovery-card .team-authority-photo,
.team-authority-subpage .gp-discovery-card .team-authority-photo-unavailable{
  width:116px!important;
  max-width:100%!important;
  aspect-ratio:4/5!important;
  border-radius:12px!important;
  overflow:hidden!important;
  background:#eef3f4!important;
  grid-column:1!important;
  grid-row:1/span 3!important;
  align-self:start!important;
}
.team-authority-subpage .gp-discovery-card .gp-discovery-note{
  grid-column:2!important;
  grid-row:2!important;
  margin:0!important;
  align-self:start!important;
}
.team-authority-subpage .gp-discovery-card .team-authority-photo img{
  width:100%!important;
  height:100%!important;
  aspect-ratio:4/5!important;
  object-fit:cover!important;
  object-position:center top!important;
}
/* Defeat .team-authority-person div{display:grid;gap:22px;grid-template-columns:190px…}. */
.team-authority-subpage .gp-discovery-card .gp-discovery-info{
  display:flex!important;
  flex-direction:column!important;
  align-items:stretch!important;
  justify-content:flex-start!important;
  gap:.35rem!important;
  min-width:0!important;
  width:100%!important;
  grid-row:1!important;
  grid-column:2!important;
  align-self:start!important;
  grid-template-columns:none!important;
  grid-template-rows:none!important;
}
.team-authority-subpage .gp-discovery-name{
  margin:0!important;
  font-size:clamp(1.05rem,1.1vw,1.2rem)!important;
  line-height:1.3!important;
  font-weight:400!important;
}
.team-authority-subpage .gp-discovery-card .gp-discovery-care-label{
  margin:0!important;
  padding:0!important;
}
.team-authority-subpage .gp-discovery-card .gp-discovery-areas{
  display:flex!important;
  flex-wrap:wrap!important;
  gap:6px!important;
  margin:0!important;
  max-width:100%!important;
}
.team-authority-subpage .gp-discovery-card .gp-discovery-areas>li{
  max-width:100%!important;
  min-width:0!important;
  flex:0 1 auto!important;
  white-space:normal!important;
  overflow-wrap:break-word!important;
  word-break:normal!important;
  font-size:11px!important;
  padding:4px 8px!important;
}
@media (min-width:901px){
  .team-authority-subpage .gp-discovery-card .gp-discovery-areas>li{
    white-space:nowrap!important;
    overflow-wrap:normal!important;
  }
}
.team-authority-subpage .gp-discovery-card .gp-discovery-qualifications{
  margin:.15rem 0 0!important;
  font-size:12.5px!important;
  line-height:1.5!important;
}
.team-authority-subpage .gp-discovery-areas-more{
  list-style:none!important;
  padding:0!important;
  border:0!important;
  background:transparent!important;
  width:100%!important;
  max-width:100%!important;
}
.team-authority-subpage .gp-discovery-areas-disclosure{
  margin:0!important;
  max-width:100%!important;
}
.team-authority-subpage .gp-discovery-areas-disclosure>summary{
  cursor:pointer!important;
  list-style:none!important;
  display:inline-flex!important;
  align-items:center!important;
  min-height:32px!important;
  padding:4px 8px!important;
  border:1px dashed #c5d4ce!important;
  border-radius:8px!important;
  background:#f7faf8!important;
  color:#355247!important;
  font-size:11px!important;
  font-weight:600!important;
}
.team-authority-subpage .gp-discovery-areas-disclosure>summary::-webkit-details-marker{display:none}
.team-authority-subpage .gp-discovery-areas-extra{
  display:flex!important;
  flex-wrap:wrap!important;
  gap:5px!important;
  list-style:none!important;
  margin:.45rem 0 0!important;
  padding:0!important;
}
.team-authority-subpage .gp-discovery-areas-extra>li{
  display:inline-flex!important;
  align-items:center!important;
  max-width:100%!important;
  min-width:0!important;
  margin:0!important;
  padding:4px 8px!important;
  border:1px solid #d9e8e6!important;
  border-radius:8px!important;
  color:#244e54!important;
  background:#edf6f3!important;
  font-size:11px!important;
  line-height:1.35!important;
  overflow-wrap:anywhere!important;
}
.team-authority-subpage .gp-discovery-card .gp-discovery-actions{
  grid-column:2!important;
  grid-row:3!important;
  display:grid!important;
  grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important;
  gap:10px!important;
  align-self:start!important;
  justify-self:stretch!important;
  margin-top:0!important;
  width:100%!important;
  min-width:0!important;
}
.team-authority-subpage .gp-discovery-profile,
.team-authority-subpage .gp-discovery-book,
.team-authority-subpage .gp-discovery-card a.button.gp-discovery-book{
  min-width:0!important;
  max-width:100%!important;
  width:100%!important;
  box-sizing:border-box!important;
  min-height:44px!important;
  white-space:nowrap!important;
  text-align:center!important;
  justify-content:center!important;
  overflow-wrap:normal!important;
  line-height:1.2!important;
}
/* Defeat .team-authority-person div{display:grid;…190px 180px} on status badge wrappers. */
.team-authority-subpage .gp-discovery-card .wmc-practitioner-badges,
.team-directory-grid .wmc-practitioner-badges{
  display:flex!important;
  flex-wrap:wrap!important;
  grid-template-columns:none!important;
  grid-template-rows:none!important;
  gap:.28rem .32rem!important;
  max-width:100%!important;
  min-width:0!important;
  width:100%!important;
}
/* Directory scrolls with the document — keep nested overflow only on the sidebar nav. */
.team-directory,
.team-directory-grid,
.team-authority-subpage .gp-discovery-list,
.team-authority-subpage .article,
body.team-authority-subpage .page-main,
body.has-persistent-care-actions .team-directory{
  overflow-x:visible!important;
  overflow-y:visible!important;
  max-height:none!important;
}
body.has-persistent-care-actions .team-directory,
body.has-persistent-care-actions.team-authority-subpage .page-main,
body.has-action-dock .team-directory,
body.has-action-dock.team-authority-subpage .page-main{
  padding-bottom:calc(108px + env(safe-area-inset-bottom,0px))!important;
}
@media (min-width:1025px){
  .team-authority-subpage .page-layout{
    grid-template-columns:216px minmax(0,1fr)!important;
    gap:48px!important;
  }
}
@media (min-width:1025px) and (max-width:1210px){
  .team-authority-subpage .page-layout{
    grid-template-columns:185px minmax(0,1fr)!important;
    gap:36px!important;
  }
  .team-authority-subpage .gp-discovery-card{
    grid-template-columns:90px minmax(0,1fr)!important;
  }
  .team-authority-subpage .gp-discovery-card .team-authority-photo,
  .team-authority-subpage .gp-discovery-card .team-authority-photo-unavailable{width:90px!important}
}
@media (min-width:1025px) and (max-width:1440px){
  .team-directory-grid{gap:36px 22px!important}
}
@media (max-width:1024px){
  .team-directory-grid{grid-template-columns:repeat(3,minmax(0,1fr))!important}
}
@media (min-width:701px) and (max-width:900px){
  .team-authority-subpage .gp-discovery-list{grid-template-columns:1fr!important}
}
@media (max-width:700px){
  .team-directory-grid{
    grid-template-columns:1fr!important;
    grid-auto-rows:auto!important;
    gap:28px!important;
  }
  .team-authority-subpage .gp-discovery-list{grid-template-columns:1fr!important}
  .team-authority-subpage .gp-discovery-card{
    grid-template-columns:96px minmax(0,1fr)!important;
  }
  .team-authority-subpage .gp-discovery-card .team-authority-photo,
  .team-authority-subpage .gp-discovery-card .team-authority-photo-unavailable{width:96px!important}
  .team-authority-subpage .gp-discovery-card .gp-discovery-areas>li{
    white-space:normal!important;
    overflow-wrap:break-word!important;
  }
  .team-authority-subpage .gp-discovery-profile,
  .team-authority-subpage .gp-discovery-book{white-space:normal!important}
}
@media (max-width:365px){
  .team-authority-subpage .gp-discovery-card{
    grid-template-columns:80px minmax(0,1fr)!important;
  }
  .team-authority-subpage .gp-discovery-card .team-authority-photo,
  .team-authority-subpage .gp-discovery-card .team-authority-photo-unavailable{width:80px!important}
}
</style>
<style id="wmc-team-copy-fullwidth">
/* Team hub + team subpages: drop narrow measure so intro/hero copy uses the shell
   width and shortens vertical scroll from early wrapping. */
.shell.team-directory .team-directory-intro,
.shell.team-directory .team-directory-intro p,
.shell.team-directory .team-role-section,
.shell.team-directory .team-role-copy,
.shell.team-directory .team-role-section .team-role-copy{
  max-width:none!important;
  width:100%!important;
}
/* Operations rows were a narrow 2-col grid; stack so role copy can use the shell. */
.shell.team-directory .team-role-operations{
  display:grid!important;
  grid-template-columns:1fr!important;
  gap:16px!important;
}
body:has(.shell.team-directory) .page-hero .page-hero-inner,
body.team-authority-subpage .page-hero .page-hero-inner{
  max-width:min(100%,var(--max,1320px))!important;
  width:100%!important;
}
body:has(.shell.team-directory) .page-hero .lede,
body:has(.shell.team-directory):not(.home-page) .page-hero .lede,
body.team-authority-subpage .page-hero .lede,
body.team-authority-subpage:not(.home-page) .page-hero .lede,
body:has(.shell.team-directory) .page-hero .lede.lede,
body.team-authority-subpage .page-hero .lede.lede{
  max-width:none!important;
  width:100%!important;
}
body:has(.shell.team-directory) .on-this-page-shell,
body:has(.shell.team-directory) .on-this-page,
body:has(.shell.team-directory) .on-this-page-links,
body.team-authority-subpage .on-this-page-shell,
body.team-authority-subpage .on-this-page,
body.team-authority-subpage .on-this-page-links{
  max-width:none!important;
  width:100%!important;
}
</style>
<style id="wmc-digital-reception-mobile">
/* Digital Reception polish. No content removed. */
/* Scrim separates the dialog from the live page behind it. */
.digital-reception-backdrop{
  position:fixed!important;
  inset:0!important;
  z-index:93!important;
  margin:0!important;
  padding:0!important;
  border:0!important;
  border-radius:0!important;
  background:rgba(12,32,48,.48)!important;
  -webkit-backdrop-filter:blur(2px)!important;
  backdrop-filter:blur(2px)!important;
  opacity:0;
  visibility:hidden;
  pointer-events:none;
  cursor:pointer;
  transition:opacity .2s ease,visibility 0s linear .2s;
}
.digital-reception-backdrop.is-open{
  opacity:1!important;
  visibility:visible!important;
  pointer-events:auto!important;
  transition:opacity .2s ease,visibility 0s linear 0s;
}
body.digital-reception-open{
  overflow:hidden!important;
}
.digital-reception-panel.is-open{
  z-index:95!important;
  border-color:rgba(23,48,68,.28)!important;
  box-shadow:0 28px 80px rgba(8,28,42,.38)!important;
}
.digital-reception-result,
.digital-reception-practitioner,
.digital-reception-step,
.digital-reception-results-heading{
  min-width:0!important;
  overflow-wrap:anywhere!important;
}
.digital-reception-result span,
.digital-reception-disclosure,
.digital-reception-status,
.digital-reception-confirm{
  overflow-wrap:anywhere!important;
}
@media (prefers-reduced-motion:reduce){
  .digital-reception-backdrop,
  .digital-reception-backdrop.is-open{
    transition:none!important;
    -webkit-backdrop-filter:none!important;
    backdrop-filter:none!important;
  }
}
@media (max-width:700px){
  .digital-reception-search-row{
    align-items:stretch!important;
    gap:8px!important;
  }
  .digital-reception-input,
  .digital-reception-search{
    min-height:48px!important;
    height:48px!important;
    box-sizing:border-box!important;
  }
  .digital-reception-search{
    display:inline-flex!important;
    align-items:center!important;
    justify-content:center!important;
    padding-top:0!important;
    padding-bottom:0!important;
  }
  /* Keep last result clear of sticky Book / Call bar inside the panel. */
  .digital-reception-results,
  .digital-reception-journey{
    padding-bottom:calc(92px + env(safe-area-inset-bottom,0px))!important;
  }
  .digital-reception-results-heading{
    display:flex!important;
    flex-wrap:wrap!important;
    align-items:baseline!important;
    justify-content:space-between!important;
    gap:6px 12px!important;
  }
  .digital-reception-quick{
    grid-template-columns:repeat(2,minmax(0,1fr))!important;
  }
  .digital-reception-quick button{
    overflow-wrap:anywhere!important;
    hyphens:auto!important;
  }
  .digital-reception-actions{
    grid-template-columns:1fr 1fr!important;
  }
  .digital-reception-actions a{
    overflow-wrap:anywhere!important;
    line-height:1.25!important;
  }
  body.has-persistent-care-actions .digital-reception-panel{
    max-height:calc(100dvh - 176px)!important;
  }
  .digital-reception-panel{
    max-height:calc(100dvh - 96px)!important;
  }
  .digital-reception-head{
    gap:12px!important;
  }
  .digital-reception-title{
    font-size:clamp(1.05rem,4.6vw,1.2rem)!important;
  }
}
@media (max-width:380px){
  .digital-reception-quick{grid-template-columns:1fr!important}
  .digital-reception-actions{grid-template-columns:1fr!important}
  .digital-reception-search-row{
    grid-template-columns:minmax(0,1fr)!important;
  }
  .digital-reception-search{width:100%!important}
}
</style>
<style id="wmc-team-authority-list-fix">
/* Authority list rows without portraits must not use the 96px photo column.
   Exclude .gp-discovery-card so GP discovery keeps its 116px grid. */
.team-authority-person:has(.team-authority-photo):not(.gp-discovery-card){grid-template-columns:96px minmax(0,1fr) auto!important;gap:22px!important}
.team-authority-person:not(:has(.team-authority-photo)){grid-template-columns:minmax(0,1fr) auto!important;gap:22px!important}
.team-authority-person:not(:has(.team-authority-photo))>div{min-width:0}
.team-authority-person:not(.gp-discovery-card) small{overflow-wrap:anywhere;word-break:normal}
/* Keep empty credential spans in the DOM but collapse the blank middle column. */
.team-authority-person:not(.gp-discovery-card)>div>span:empty{display:none!important}
.team-authority-person:not(.gp-discovery-card)>div:has(>span:empty){grid-template-columns:minmax(190px,.9fr) minmax(0,1.6fr)!important}
@media(max-width:1024px){
  .team-authority-person:has(.team-authority-photo):not(.gp-discovery-card){grid-template-columns:86px minmax(0,1fr) auto!important}
}
@media(max-width:700px){
  .team-authority-person:has(.team-authority-photo):not(.gp-discovery-card){grid-template-columns:74px minmax(0,1fr)!important;align-items:start!important}
  .team-authority-person:has(.team-authority-photo):not(.gp-discovery-card)>.text-link{grid-column:2!important;justify-self:start!important}
}
</style>
<style id="wmc-about-laptop-fix">
/* Practice Experience chapter photos: avoid ultra-wide laptop crops from max-height alone. */
body.ev-pe-page .pe-media--chapter img,body.pe-hub-page .pe-media--chapter img{
  aspect-ratio:16/9!important;max-height:360px!important;width:100%!important;height:auto!important;
  object-fit:cover!important;object-position:center 28%!important
}
@media(max-width:700px){
  body.ev-pe-page .pe-media--chapter img,body.pe-hub-page .pe-media--chapter img{max-height:200px!important;object-position:center 24%!important}
}
</style></head>`,
  );
  // Digital Reception demand capture script — bust when scrim / search-signal behaviour changes.
  next = next.replace(
    /(?:\/wmc-cache\/)?(?:\.\.\/)*digital-reception\.js(?:\?[^"]*)?(?=")/g,
    "/wmc-cache/digital-reception.js?v=wmc-dr-dock-cls-20261107",
  );
  // Site-root home links must hit `/` (live public-ux), not static public/index.html.
  next = next.replace(/\bhref="(?:\.\/)*(?:\.\.\/)*index\.html"/g, 'href="/"');
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
  // Contact: network callout after map; details alignment is CSS-only.
  next = refineContactPageSections(next, pagePath);

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
  // Mark recruitment surfaces before sticky CSS so body attribute checks stay accurate.
  const isExpressInterestPage = /express-interest\.html$/i.test(pagePath);
  if (isRecruitmentSurface) {
    if (!/<body\b[^>]*\bdata-attraction-surface=/i.test(next)) {
      next = next.replace(/<body\b/i, '<body data-attraction-surface="true"');
    }
    if (!/\bdata-ev="true"/i.test(next) && /data-ev-surface|attraction-experience-validation|data-attraction-type/i.test(next)) {
      next = next.replace(/<body\b([^>]*)>/i, '<body$1 data-ev="true">');
    }
    // Strip before sticky rewrite so final inject order stays sticky → mobile.
    next = next.replace(/<style\b[^>]*id="wmc-recruit-mobile"[\s\S]*?<\/style>\s*/i, "");
  }
  // EOI removes the sticky bar — strip leftover sticky injects so re-apply stays idempotent.
  if (isExpressInterestPage) {
    next = next.replace(/<style\b[^>]*id="wmc-recruit-sticky"[\s\S]*?<\/style>\s*/i, "");
    next = next.replace(/<script\b[^>]*id="wmc-recruit-sticky-suppress"[\s\S]*?<\/script>\s*/i, "");
  }
  // Only rewrite when a sticky <nav> exists — avoid matching class names inside CSS on EOI.
  if (isRecruitmentSurface && !isExpressInterestPage && /<nav\b[^>]*persistent-care-actions/i.test(next)) {
    const eoiHref = pagePath.startsWith("join-our-team/")
      ? "express-interest.html"
      : pagePath.startsWith("about-us/")
        ? "../join-our-team/express-interest.html"
        : "join-our-team/express-interest.html";
    const stickyEoiHref = eoiHref;
    const recruitContact = resolveRecruitmentContact(undefined, eoiHref);
    const isJoinLanding = pagePath === "join-our-team.html";
    const readinessHref = isJoinLanding
      ? "#gp-readiness-portal"
      : pagePath.startsWith("join-our-team/") || pagePath.startsWith("about-us/")
        ? "../join-our-team.html#gp-readiness-portal"
        : "join-our-team.html#gp-readiness-portal";
    // Only wire modal open on the landing page (portal script lives there).
    const readinessOpenAttr = isJoinLanding ? ` data-gp-readiness-open="true"` : "";
    const stickyHtml = `<nav aria-label="GP recruitment actions" class="persistent-care-actions persistent-care-actions--recruitment" data-audience="gp-attraction"><div class="persistent-care-actions-inner"><a class="persistent-care-readiness" href="${readinessHref}"${readinessOpenAttr}>GP Portal</a><a class="persistent-care-book" href="${stickyEoiHref}">Discuss</a><a aria-label="Call ${recruitContact.name} about joining on ${recruitContact.phoneDisplay}" class="persistent-care-call" href="tel:${recruitContact.phoneTel}">Call</a></div></nav>`;
    next = next.replace(
      /<nav\b[^>]*class="[^"]*persistent-care-actions[^"]*"[^>]*>[\s\S]*?<\/nav>/i,
      stickyHtml,
    );
    // Always refresh sticky CSS/script so layout fixes are not stuck behind an older inject.
    next = next.replace(/<style\b[^>]*id="wmc-recruit-sticky"[\s\S]*?<\/style>\s*/i, "");
    next = next.replace(/<script\b[^>]*id="wmc-recruit-sticky-suppress"[\s\S]*?<\/script>\s*/i, "");
    next = next.replace(
      /<\/head>/i,
      `<style id="wmc-recruit-sticky">
body.has-persistent-care-actions:has(.persistent-care-actions--recruitment){padding-bottom:calc(96px + env(safe-area-inset-bottom,0px))!important}
.persistent-care-actions.persistent-care-actions--recruitment{
left:auto!important;right:22px!important;bottom:22px!important;width:auto!important;
max-width:calc(100vw - 28px)!important;padding:0!important
}
body[data-attraction-surface] .persistent-care-actions--recruitment .persistent-care-actions-inner,
body[data-attraction-type] .persistent-care-actions--recruitment .persistent-care-actions-inner,
body[data-ev="true"] .persistent-care-actions--recruitment .persistent-care-actions-inner,
.persistent-care-actions.persistent-care-actions--recruitment .persistent-care-actions-inner{
display:flex!important;flex-wrap:nowrap!important;align-items:center!important;justify-content:center!important;gap:8px!important;
width:auto!important;max-width:min(52rem,calc(100vw - 28px))!important;
grid-template-columns:none!important;border-radius:0!important;padding:0!important;
background:transparent!important;box-shadow:none!important;border:0!important;overflow:visible!important
}
.persistent-care-actions.persistent-care-actions--recruitment .persistent-care-readiness{
display:inline-flex!important;align-items:center!important;justify-content:center!important;min-height:42px!important;
padding:.5rem 1.05rem!important;border-radius:999px!important;font-size:.84rem!important;font-weight:700!important;
color:#fff!important;text-decoration:none!important;border:1px solid #007A87!important;background:#007A87!important;
box-shadow:0 8px 20px rgba(0,122,135,.28)!important;white-space:nowrap!important;box-sizing:border-box!important;
width:auto!important;flex:0 1 auto!important;line-height:1.2!important
}
.persistent-care-actions.persistent-care-actions--recruitment .persistent-care-readiness:hover{background:#066f7a!important;border-color:#066f7a!important}
.persistent-care-actions.persistent-care-actions--recruitment .persistent-care-book{
display:inline-flex!important;align-items:center!important;justify-content:center!important;
background:#fff!important;color:var(--navy,#163D68)!important;border:1px solid rgba(22,61,104,.22)!important;
box-shadow:0 6px 18px rgba(18,50,79,.16)!important;font-weight:650!important;white-space:nowrap!important;box-sizing:border-box!important;
width:auto!important;flex:0 1 auto!important;font-size:.82rem!important;line-height:1.2!important;min-height:42px!important;
border-radius:999px!important
}
.persistent-care-actions.persistent-care-actions--recruitment .persistent-care-call{
display:inline-flex!important;align-items:center!important;justify-content:center!important;
white-space:nowrap!important;box-sizing:border-box!important;width:auto!important;flex:0 1 auto!important;
font-size:.82rem!important;line-height:1.2!important;min-height:42px!important;padding:.5rem .9rem!important;
border-radius:999px!important;background:#fff!important;border:1px solid rgba(22,61,104,.22)!important;
box-shadow:0 6px 18px rgba(18,50,79,.16)!important;color:var(--navy,#163D68)!important;text-decoration:none!important
}
.persistent-care-actions.persistent-care-actions--recruitment .persistent-care-book::before,
.persistent-care-actions.persistent-care-actions--recruitment .persistent-care-call::before{display:none!important}
@media(max-width:767px){
body.has-persistent-care-actions:has(.persistent-care-actions--recruitment){padding-bottom:calc(88px + env(safe-area-inset-bottom,0px))!important}
.persistent-care-actions.persistent-care-actions--recruitment{
left:10px!important;right:10px!important;bottom:calc(10px + env(safe-area-inset-bottom,0px))!important;
width:auto!important;max-width:none!important;padding:0!important
}
body[data-attraction-surface] .persistent-care-actions--recruitment .persistent-care-actions-inner,
body[data-attraction-type] .persistent-care-actions--recruitment .persistent-care-actions-inner,
body[data-ev="true"] .persistent-care-actions--recruitment .persistent-care-actions-inner,
.persistent-care-actions.persistent-care-actions--recruitment .persistent-care-actions-inner{
display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:8px!important;
width:100%!important;max-width:none!important;align-items:stretch!important;justify-content:stretch!important;
border-radius:0!important;padding:0!important;background:transparent!important;box-shadow:none!important;border:0!important
}
.persistent-care-actions.persistent-care-actions--recruitment .persistent-care-readiness,
.persistent-care-actions.persistent-care-actions--recruitment .persistent-care-book,
.persistent-care-actions.persistent-care-actions--recruitment .persistent-care-call{
width:100%!important;max-width:100%!important;min-width:0!important;min-height:48px!important;
padding:.55rem .35rem!important;border-radius:12px!important;font-size:.78rem!important;line-height:1.15!important;
white-space:normal!important;text-align:center!important;justify-content:center!important;align-items:center!important;
overflow:hidden!important;flex:none!important;
box-shadow:0 6px 18px rgba(18,50,79,.18)!important
}
}
</style>
<script id="wmc-recruit-sticky-suppress">
(function(){
  function bind(){
    var bar=document.querySelector(".persistent-care-actions--recruitment");
    var heroCtas=document.querySelector(".gp-recruit-hero-convert");
    if(!bar||!heroCtas||!("IntersectionObserver" in window)) return;
    var io=new IntersectionObserver(function(entries){
      var hit=entries.some(function(e){ return e.isIntersecting && e.intersectionRatio >= 0.15; });
      bar.classList.toggle("is-suppressed", hit);
    },{threshold:[0,0.15,0.35,0.6]});
    io.observe(heroCtas);
  }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded", bind);
  else bind();
})();
</script></head>`,
    );
  }

  // Serve-time mobile polish for attraction pages baked with older EV shell CSS.
  // Injected after sticky so re-apply order stays sticky → mobile (idempotent).
  if (isRecruitmentSurface) {
    next = next.replace(
      /<\/head>/i,
      `<style id="wmc-recruit-mobile">
body[data-attraction-surface] details.attraction-tool-panel summary,
body[data-attraction-type] details.attraction-tool-panel summary,
body[data-ev="true"] details.attraction-tool-panel summary{
display:block!important;min-height:44px!important;padding:.45rem 0!important;line-height:1.35!important;
font-size:1rem!important;font-weight:650!important;cursor:pointer
}
body[data-attraction-surface] .page-nav .nav-group-title,
body[data-attraction-type] .page-nav .nav-group-title,
body[data-ev="true"] .page-nav .nav-group-title,
body[data-attraction-surface] .page-nav .nav-title,
body[data-attraction-type] .page-nav .nav-title,
body[data-ev="true"] .page-nav .nav-title,
body[data-attraction-surface] #related-pages .nav-title,
body[data-attraction-type] #related-pages .nav-title,
body[data-ev="true"] #related-pages .nav-title{font-size:.75rem!important;letter-spacing:.05em!important}
body[data-attraction-surface] .eyebrow,
body[data-attraction-type] .eyebrow,
body[data-ev="true"] .eyebrow,
body[data-attraction-type] .page-hero .eyebrow,
body[data-attraction-surface] .attraction-next-step .eyebrow,
body[data-ev="true"] .attraction-next-step .eyebrow{font-size:.75rem!important;letter-spacing:.05em!important}
/* Shared trust inject (related pages) — contact/confidentiality cards without join-hub CSS */
body[data-attraction-surface] .gp-recruit-contact-card,
body[data-ev="true"] .gp-recruit-contact-card{
padding:1.15rem 1.1rem;border-radius:18px;border:1px solid rgba(22,61,104,.12);
background:#fff;box-shadow:0 8px 22px rgba(22,61,104,.08);box-sizing:border-box;max-width:100%
}
body[data-attraction-surface] .gp-recruit-contact-label,
body[data-ev="true"] .gp-recruit-contact-label{
margin:0 0 .35rem;color:#007a87;font-size:.7rem;font-weight:700;letter-spacing:.07em;text-transform:uppercase
}
body[data-attraction-surface] .gp-recruit-contact-name,
body[data-ev="true"] .gp-recruit-contact-name{margin:0;font-size:1.15rem;font-weight:750;color:#163d68;line-height:1.25}
body[data-attraction-surface] .gp-recruit-contact-role,
body[data-ev="true"] .gp-recruit-contact-role{margin:.15rem 0 .55rem;color:#4a5d6c;font-size:.9rem;font-weight:600}
body[data-attraction-surface] .gp-recruit-contact-note,
body[data-ev="true"] .gp-recruit-contact-note{margin:0 0 .75rem;color:#4a5d6c;font-size:.9rem;line-height:1.45}
body[data-attraction-surface] .gp-recruit-contact-channels,
body[data-ev="true"] .gp-recruit-contact-channels{margin:0;padding:0;list-style:none;display:grid;gap:.45rem}
body[data-attraction-surface] .gp-recruit-contact-channels a,
body[data-ev="true"] .gp-recruit-contact-channels a{color:#007a87;font-weight:650;text-decoration:underline;text-underline-offset:3px;font-size:.92rem}
body[data-attraction-surface] .gp-recruit-trust-panel,
body[data-ev="true"] .gp-recruit-trust-panel{
padding:1rem 1.05rem;border-radius:16px;border:1px solid rgba(0,122,135,.18);
background:linear-gradient(180deg,#f3fbfb,#eef7f8);box-sizing:border-box;max-width:100%
}
body[data-attraction-surface] .gp-recruit-trust-panel h3,
body[data-ev="true"] .gp-recruit-trust-panel h3{margin:0 0 .55rem;font-size:.95rem;color:#163d68}
body[data-attraction-surface] .gp-recruit-trust-panel ul,
body[data-ev="true"] .gp-recruit-trust-panel ul{margin:0;padding:0;list-style:none;display:grid;gap:.4rem}
body[data-attraction-surface] .gp-recruit-trust-panel li,
body[data-ev="true"] .gp-recruit-trust-panel li{
position:relative;padding-left:1.1rem;color:#3f5360;font-size:.88rem;line-height:1.4
}
body[data-attraction-surface] .gp-recruit-trust-panel li::before,
body[data-ev="true"] .gp-recruit-trust-panel li::before{content:"✓";position:absolute;left:0;color:#2f7d4a;font-weight:700}
body[data-attraction-surface] .gp-recruit-shared-trust,
body[data-ev="true"] .gp-recruit-shared-trust{box-sizing:border-box;max-width:100%;min-width:0}
@media(max-width:900px){
body[data-attraction-surface] .attraction-tool-panel input:not([type=checkbox]):not([type=radio]),
body[data-attraction-surface] .attraction-tool-panel select,
body[data-attraction-surface] .attraction-tool-panel textarea{font-size:16px!important;min-height:44px}
body[data-attraction-surface] .careers-opportunity-actions .button-secondary,
body[data-attraction-surface] .careers-opportunity-actions a.button-secondary,
body[data-attraction-surface] .join-hub-cta-row .button-secondary,
body[data-attraction-surface] .join-hub-cta-row a.button-secondary{min-height:44px!important}
body[data-attraction-surface] .careers-status-badge,
body[data-attraction-type] .careers-status-badge{font-size:.75rem!important;letter-spacing:.04em!important}
body[data-attraction-surface] .on-this-page{overflow-x:auto;-webkit-overflow-scrolling:touch}
body[data-attraction-surface] .on-this-page-links{display:flex;flex-wrap:wrap;gap:.45rem}
body[data-attraction-surface] .on-this-page a,
body[data-ev="true"] .on-this-page a{min-height:44px;display:inline-flex;align-items:center;box-sizing:border-box}
body[data-attraction-surface] .page-nav a,
body[data-attraction-surface] #related-pages a,
body[data-ev="true"] .page-nav a,
body[data-ev="true"] #related-pages a{
min-height:44px;display:inline-flex;align-items:center;box-sizing:border-box
}
body[data-attraction-surface] .gp-recruit-contact-channels a,
body[data-ev="true"] .gp-recruit-contact-channels a{
display:inline-flex;align-items:center;min-height:44px;padding:.35rem .15rem;box-sizing:border-box
}
body[data-attraction-surface] .gp-recruit-contact-channels li,
body[data-ev="true"] .gp-recruit-contact-channels li{min-height:44px;display:flex;align-items:center}
body[data-attraction-surface] .gp-recruit-contact-channels,
body[data-ev="true"] .gp-recruit-contact-channels{gap:4px}
body[data-attraction-surface] .careers-opportunity-actions,
body[data-attraction-surface] .join-hub-cta-row{
display:flex;flex-wrap:wrap;gap:8px;max-width:100%;box-sizing:border-box
}
body[data-attraction-surface] .careers-opportunity-actions .button,
body[data-attraction-surface] .careers-opportunity-actions a.button,
body[data-attraction-surface] .join-hub-cta-row .button,
body[data-attraction-surface] .join-hub-cta-row a.button{
flex:1 1 auto;min-width:0;max-width:100%;box-sizing:border-box
}
/* Stack support/checklist matrices — keep all cells, avoid 3-col squeeze */
body[data-attraction-surface] .attraction-matrix,
body[data-ev="true"] .attraction-matrix{
display:block;width:100%;max-width:100%;box-sizing:border-box
}
body[data-attraction-surface] .attraction-matrix thead,
body[data-ev="true"] .attraction-matrix thead{
position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);border:0
}
body[data-attraction-surface] .attraction-matrix tbody,
body[data-attraction-surface] .attraction-matrix tr,
body[data-attraction-surface] .attraction-matrix th,
body[data-attraction-surface] .attraction-matrix td,
body[data-ev="true"] .attraction-matrix tbody,
body[data-ev="true"] .attraction-matrix tr,
body[data-ev="true"] .attraction-matrix th,
body[data-ev="true"] .attraction-matrix td{
display:block;width:100%!important;max-width:100%;box-sizing:border-box;white-space:normal!important
}
body[data-attraction-surface] .attraction-matrix tr,
body[data-ev="true"] .attraction-matrix tr{
margin:0 0 .75rem;padding:.85rem .9rem;border:1px solid rgba(22,61,104,.12);border-radius:14px;background:#fff;
box-shadow:0 4px 14px rgba(22,61,104,.06)
}
body[data-attraction-surface] .attraction-matrix th[scope=row],
body[data-ev="true"] .attraction-matrix th[scope=row]{
border:0;padding:0 0 .35rem;font-size:1rem;font-weight:700;color:#163d68
}
body[data-attraction-surface] .attraction-matrix td.matrix-means,
body[data-ev="true"] .attraction-matrix td.matrix-means{
border:0;padding:0 0 .55rem;font-size:.9rem;line-height:1.45
}
body[data-attraction-surface] .attraction-matrix td:last-child,
body[data-ev="true"] .attraction-matrix td:last-child{
border:0;padding:.35rem 0 0;width:100%!important;white-space:normal!important
}
body[data-attraction-surface] .attraction-matrix .matrix-ask,
body[data-ev="true"] .attraction-matrix .matrix-ask{
min-height:44px;width:100%;box-sizing:border-box;padding:.35rem 0;gap:.55rem;font-size:.92rem
}
body[data-attraction-surface] .attraction-matrix .matrix-ask input[type=checkbox],
body[data-ev="true"] .attraction-matrix .matrix-ask input[type=checkbox]{
width:1.15rem;height:1.15rem;min-width:1.15rem;min-height:1.15rem;max-width:none
}
body[data-attraction-surface] .attraction-matrix .matrix-ask-hint,
body[data-ev="true"] .attraction-matrix .matrix-ask-hint{max-width:none;font-size:.82rem;line-height:1.4}
body[data-attraction-surface] .attraction-tool-panel .button,
body[data-attraction-surface] .attraction-tool-panel button,
body[data-ev="true"] .attraction-tool-panel .button,
body[data-ev="true"] .attraction-tool-panel button{
min-height:44px;width:100%;max-width:100%;box-sizing:border-box
}
}
</style></head>`,
    );
  }

  // Attraction analytics beacon (anonymous) — all EV attraction surfaces.
  // Inject before Join Our Team portal shell so re-apply order stays idempotent.
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

  if (pagePath === "join-our-team.html") {
    next = refineJoinOurTeamRecruitment(next, branding);
  }
  if (/express-interest\.html$/i.test(pagePath)) {
    next = refineExpressInterestFriction(next, branding);
  }
  // Shared recruitment contact + confidentiality — identical across attraction surfaces.
  // Place after page content (end of main), never above the hero.
  // Express Interest places both in the focus stack (contact → confidentiality → form).
  if (
    /^(join-our-team\/)?(gp-opportunities|gp-faq|opportunity-pack|practice-support)\.html$/i.test(
      pagePath,
    ) &&
    !/data-recruitment-contact="true"/i.test(next)
  ) {
    const contact = renderRecruitmentContactHtml(
      resolveRecruitmentContact(branding, eoiHrefForPage(pagePath)),
    );
    const confidentiality = /data-recruitment-confidentiality="true"/i.test(next)
      ? ""
      : renderConfidentialityPanelHtml("light");
    const sharedTrust = `<div class="shell gp-recruit-shared-trust" style="padding:1.5rem 0 2rem;display:grid;gap:1rem;max-width:40rem">${contact}${confidentiality}</div>`;
    if (/<\/main>/i.test(next)) {
      next = next.replace(/<\/main>/i, `${sharedTrust}</main>`);
    } else {
      next = next.replace(/(<main\b[^>]*>)/i, `$1${sharedTrust}`);
    }
  }

  // CLS: paint sticky booking dock in final has-action-dock geometry (with DR launcher).
  next = stabilisePersistentCareDock(next);

  // Phone-only doctor profiles: TOC / header / dock must not imply HotDoc for that GP.
  next = alignPhoneOnlyPractitionerChrome(next, pagePath);

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
  next = refineHomepageInfoTrustLogos(next);

  return next;
}

/** Keep homepage AGPAL + bulk-billing marks sharp (contain, retina attrs). */
function refineHomepageInfoTrustLogos(html: string): string {
  const logos =
    '<div class="info-trust-logos">' +
    '<a href="agpal-accreditation.html"><img alt="Accredited General Practice" data-local-asset="agpal-mark" decoding="async" height="192" loading="lazy" src="assets/brand/agpal-mark.webp?v=20261106a" width="192"/></a>' +
    '<a href="bulk-billing.html"><img alt="Medicare Bulk Billing Practice" decoding="async" height="256" loading="lazy" src="assets/brand/bulk-billing-practice.png" width="256"/></a>' +
    "</div>";
  if (!/<div class="info-trust-logos">/i.test(html)) return html;
  return html.replace(/<div class="info-trust-logos">[\s\S]*?<\/div>/i, logos);
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
<picture class="hero-picture"><source media="(max-width: 700px)" srcset="assets/hero-final-mobile.webp"/><source media="(max-width: 1024px)" srcset="assets/hero-final-tablet.webp"/><img alt="Woolloongabba Medical Centre on Vulture Street — established local general practice" class="hero-photo" decoding="async" fetchpriority="high" height="941" sizes="(max-width: 700px) 100vw, (max-width: 1024px) 100vw, min(56vw, 920px)" src="assets/hero-final-desktop.webp" width="1672"/></picture>
</div>
</div>
<div class="hero-practitioner-strip">
<div class="shell hero-practitioner-inner">
<div class="hero-practitioner-heading">
<p class="hero-practitioner-caption">Doctors who take the time to know you</p>
<a class="hero-practitioner-more" href="team.html">View full team</a>
</div>
<ul class="hero-practitioner-faces" aria-label="Our doctors">
<li><a class="hero-practitioner-face" href="doctors/dr-tanya-goodwill.html"><img alt="" class="hero-practitioner-avatar" decoding="async" height="96" loading="lazy" sizes="96px" src="assets/team/dr-tanya-goodwill-96.webp" srcset="assets/team/dr-tanya-goodwill-96.webp 96w, assets/team/dr-tanya-goodwill-192.webp 192w" width="96"/><span>Dr Tanya Goodwill</span></a></li>
<li><a class="hero-practitioner-face" href="doctors/dr-sumita-singh.html"><img alt="" class="hero-practitioner-avatar" decoding="async" height="96" loading="lazy" sizes="96px" src="assets/team/dr-sumita-singh-96.webp" srcset="assets/team/dr-sumita-singh-96.webp 96w, assets/team/dr-sumita-singh-192.webp 192w" width="96"/><span>Dr Sumita Singh</span></a></li>
<li><a class="hero-practitioner-face" href="doctors/dr-wasantha-hettiarchchi.html"><img alt="" class="hero-practitioner-avatar" decoding="async" height="96" loading="lazy" sizes="96px" src="assets/team/dr-wasantha-hettiarchchi-96.webp" srcset="assets/team/dr-wasantha-hettiarchchi-96.webp 96w, assets/team/dr-wasantha-hettiarchchi-192.webp 192w" width="96"/><span>Dr Wasantha Hettiarchchi</span></a></li>
<li><a class="hero-practitioner-face" href="doctors/dr-anand-singh.html"><img alt="" class="hero-practitioner-avatar" decoding="async" height="96" loading="lazy" sizes="96px" src="assets/team/dr-anand-singh-96.webp" srcset="assets/team/dr-anand-singh-96.webp 96w, assets/team/dr-anand-singh-192.webp 192w" width="96"/><span>Dr Anand Singh</span></a></li>
<li><a class="hero-practitioner-face" href="doctors/dr-debra-larkins.html"><img alt="" class="hero-practitioner-avatar" decoding="async" height="96" loading="lazy" sizes="96px" src="assets/team/dr-debra-larkins-96.webp" srcset="assets/team/dr-debra-larkins-96.webp 96w, assets/team/dr-debra-larkins-192.webp 192w" width="96"/><span>Dr Debra Larkins</span></a></li>
<li><a class="hero-practitioner-face" href="doctors/dr-kooshyar-karimi.html"><img alt="" class="hero-practitioner-avatar" decoding="async" height="96" loading="lazy" sizes="96px" src="assets/team/dr-kooshyar-karimi-96.webp" srcset="assets/team/dr-kooshyar-karimi-96.webp 96w, assets/team/dr-kooshyar-karimi-192.webp 192w" width="96"/><span>Dr Kooshyar Karimi</span></a></li>
<li><a class="hero-practitioner-face" href="doctors/dr-sambo-luon.html"><img alt="" class="hero-practitioner-avatar" decoding="async" height="96" loading="lazy" sizes="96px" src="assets/team/dr-sambo-luon-96.webp" srcset="assets/team/dr-sambo-luon-96.webp 96w, assets/team/dr-sambo-luon-192.webp 192w" width="96"/><span>Dr Sambo Luon</span></a></li>
<li><a class="hero-practitioner-face" href="doctors/dr-usman-gul.html"><img alt="" class="hero-practitioner-avatar" decoding="async" height="96" loading="lazy" sizes="96px" src="assets/team/dr-usman-gul-96.webp" srcset="assets/team/dr-usman-gul-96.webp 96w, assets/team/dr-usman-gul-192.webp 192w" width="96"/><span>Dr Usman Gul</span></a></li>
<li><a class="hero-practitioner-face" href="doctors/dr-mary-abadir.html"><img alt="" class="hero-practitioner-avatar" decoding="async" height="96" loading="lazy" sizes="96px" src="assets/team/dr-mary-abadir-96.webp" srcset="assets/team/dr-mary-abadir-96.webp 96w, assets/team/dr-mary-abadir-192.webp 192w" width="96"/><span>Dr Mary Abadir</span></a></li>
<li><a class="hero-practitioner-face" href="doctors/dr-golnar-mortezaei.html"><img alt="" class="hero-practitioner-avatar" decoding="async" height="96" loading="lazy" sizes="96px" src="assets/team/dr-golnar-mortezaei-96.webp" srcset="assets/team/dr-golnar-mortezaei-96.webp 96w, assets/team/dr-golnar-mortezaei-192.webp 192w" width="96"/><span>Dr Golnar Mortezaei</span></a></li>
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
  // Always strip then append before </head> so a second apply keeps stable style order.
  next = next.replace(/<style id="wmc-hero-authority-v6">[\s\S]*?<\/style>\s*/i, "");
  next = next.replace(/<\/head>/i, `${HOMEPAGE_HERO_AUTHORITY_STYLE}</head>`);

  next = next.replace(/<script id="wmc-hero-authority-actions">[\s\S]*?<\/script>\s*/i, "");
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
  /* Narrow phones: one clean column — avoids cramped 2-col wraps + orphaned last chip. */
  grid-template-columns:1fr!important;
  justify-items:stretch!important;
  gap:8px!important;
  width:100%!important;
  max-width:var(--max,1320px)!important;
  margin:0 auto!important;
  padding:0!important;
}
.home-page #home.hero.hero--authority-v6 .hero-stat:last-child{
  grid-column:auto!important;
  justify-self:stretch!important;
  width:auto!important;
  max-width:none!important;
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
  /* Tablet: 3 + 2 left-aligned — no centered orphan row. */
  grid-template-columns:repeat(3,minmax(0,1fr))!important;
  gap:10px 16px!important;
}
.home-page #home.hero.hero--authority-v6 .hero-stat:last-child{
  grid-column:auto!important;
  justify-self:stretch!important;
}
.home-page #home.hero.hero--authority-v6 .hero-stat-label{font-size:.92rem!important}
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
/* Inline trust-line + border-top draws lines through wrapped accreditation copy. */
.home-page #story a.trust-line,
.home-page #story a.trust-line.trust-line-link{
  display:block!important;
  width:100%!important;
  max-width:42rem!important;
  margin-top:16px!important;
  padding-top:0!important;
  border-top:0!important;
  color:#64737f!important;
  font-size:.78rem!important;
  line-height:1.55!important;
  text-decoration:none!important;
  box-decoration-break:clone!important;
  -webkit-box-decoration-break:clone!important;
}
.home-page #story a.trust-line span,
.home-page #story a.trust-line.trust-line-link span{
  text-decoration:none!important;
}
.home-page #story a.trust-line.trust-line-link:hover span,
.home-page #story a.trust-line.trust-line-link:focus-visible span{
  color:#163D68!important;
  text-decoration:underline!important;
  text-underline-offset:3px!important;
}
/* Patient-info trust logos: undo crop/hide cascade; keep marks readable. */
.home-page #patient-information .information-note{
  display:flex!important;
  flex-direction:column!important;
  align-items:flex-start!important;
  gap:14px!important;
  margin-top:22px!important;
  padding-top:0!important;
  border-top:0!important;
}
.home-page #patient-information .info-trust-logos,
.home-page #patient-information .information-note>span{
  display:flex!important;
}
.home-page #patient-information .info-trust-logos{
  flex-wrap:wrap!important;
  align-items:center!important;
  gap:16px!important;
  margin:0!important;
}
.home-page #patient-information .info-trust-logos a{
  display:inline-flex!important;
  align-items:center!important;
  justify-content:center!important;
  box-sizing:border-box!important;
  width:136px!important;
  height:136px!important;
  min-width:136px!important;
  min-height:136px!important;
  padding:12px!important;
  border:1px solid rgba(22,61,104,.1)!important;
  border-radius:14px!important;
  background:#fff!important;
  box-shadow:0 4px 14px rgba(22,61,104,.08)!important;
  text-decoration:none!important;
}
.home-page #patient-information .info-trust-logos a:hover,
.home-page #patient-information .info-trust-logos a:focus-visible{
  border-color:rgba(0,122,135,.35)!important;
  outline:2px solid #007A87!important;
  outline-offset:2px!important;
}
.home-page #patient-information .info-trust-logos img,
.home-page #patient-information .info-trust-logos img:first-child,
.home-page #patient-information .info-trust-logos img:last-child,
.home-page #patient-information .info-trust-logos img[data-local-asset="agpal-mark"],
.home-page #patient-information .info-trust-logos a[href*="bulk-billing"] img{
  display:block!important;
  width:100%!important;
  height:100%!important;
  max-width:112px!important;
  max-height:112px!important;
  object-fit:contain!important;
  object-position:center!important;
  background:transparent!important;
  image-rendering:auto!important;
}
.home-page #patient-information .information-note>span{
  color:#667681!important;
  font-size:.82rem!important;
  line-height:1.45!important;
}
@media (min-width:1025px){
.home-page #home.hero.hero--authority-v6{
  padding:36px 28px 0!important;
}
.home-page #home.hero.hero--authority-v6 .shell.hero-grid{
  display:grid!important;
  grid-template-columns:minmax(280px,520px) minmax(0,1fr)!important;
  align-items:stretch!important;
  gap:28px 32px!important;
  width:100%!important;
  max-width:var(--max,1320px)!important;
  min-height:0!important;
  height:auto!important;
  margin:0 auto!important;
  overflow:visible!important;
}
.home-page #home.hero.hero--authority-v6 .hero-copy{
  display:flex!important;
  flex-direction:column!important;
  align-items:stretch!important;
  justify-content:stretch!important;
  width:100%!important;
  min-height:0!important;
  height:auto!important;
  align-self:stretch!important;
}
.home-page #home.hero.hero--authority-v6 .hero-content-panel{
  display:flex!important;
  flex-direction:column!important;
  justify-content:center!important;
  max-width:520px;
  width:100%;
  height:100%!important;
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
  align-self:stretch!important;
  display:block!important;
  width:100%!important;
  height:auto!important;
  min-height:100%!important;
  border-radius:24px!important;
  overflow:hidden!important;
  background:#d5dee4!important;
}
.home-page #home.hero.hero--authority-v6 .hero-picture{
  display:block!important;
  width:100%!important;
  height:100%!important;
  min-height:100%!important;
}
.home-page #home.hero.hero--authority-v6 .hero-picture .hero-photo{
  display:block!important;
  width:100%!important;
  height:100%!important;
  min-height:100%!important;
  max-height:none!important;
  /* Fill the card; centre the fascia so “Woolloongabba Medical Centre” stays in frame */
  object-fit:cover!important;
  object-position:50% 42%!important;
}
/* Story storefront: 720px tall frame was cropping the clinic banner on laptop */
.home-page #story .story-image{
  min-height:0!important;
  height:auto!important;
  max-height:none!important;
  aspect-ratio:16 / 10!important;
}
.home-page #story .story-image img{
  width:100%!important;
  height:100%!important;
  min-height:0!important;
  max-height:none!important;
  object-fit:cover!important;
  object-position:42% 48%!important;
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


