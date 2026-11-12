/**
 * Patient Hub — owner-approved mobile dashboard presentation (code-only).
 * Reshapes request-time HTML via public-ux; does not rewrite CMS revisions.
 * Preserves Preferred GP mount, Digital Reception contracts, dock, install guides.
 */

import { DIGITAL_RECEPTION_OPEN_ARIA_LABEL } from "@/documents/patient-hub-digital-reception";

export const PATIENT_HUB_MOBILE_DASHBOARD_MARKER = "wmc-patient-hub-dashboard-v1";
export const PATIENT_HUB_MOBILE_DASHBOARD_STYLE_ID = "wmc-patient-hub-mobile-dashboard";

const STYLE = `<style id="${PATIENT_HUB_MOBILE_DASHBOARD_STYLE_ID}">
body.patient-hub-page{--patient-hub-navy:#123B5D;--patient-hub-teal:#1E8C8C;--patient-hub-aqua:#E8F6F6}
body.patient-hub-page .patient-hub-hero{
  padding:20px 0 12px!important;background:linear-gradient(180deg,var(--patient-hub-aqua) 0%,#fff 88%)
}
body.patient-hub-page .patient-hub-hero .page-hero-inner{max-width:40rem}
body.patient-hub-page .patient-hub-hero .eyebrow{margin:0 0 .25rem;font-size:.72rem;letter-spacing:.06em;color:var(--patient-hub-teal)}
body.patient-hub-page .patient-hub-hero h1{
  margin:0 0 .35rem;font-size:clamp(1.45rem,4.2vw,1.85rem);line-height:1.2;color:var(--patient-hub-navy)
}
body.patient-hub-page .patient-hub-hero .lede{
  margin:0;font-size:.95rem;line-height:1.45;color:#3d5160;max-width:34rem
}
body.patient-hub-page .breadcrumb-bar{display:none}
body.patient-hub-page .patient-hub-tasks,
body.patient-hub-page .patient-hub-dashboard{
  padding:12px 0 8px!important;background:transparent!important;border:0
}
body.patient-hub-page .patient-hub-tasks h2::before,
body.patient-hub-page .patient-hub-dashboard h2::before{content:none!important;display:none!important}
body.patient-hub-page .patient-hub-dashboard-actions-title{
  margin:1rem 0 .55rem;font-size:1.05rem;color:var(--patient-hub-navy)
}
body.patient-hub-page .patient-hub-dashboard-actions{
  display:grid!important;grid-template-columns:1fr 1fr;gap:10px;margin:0
}
body.patient-hub-page .patient-hub-dashboard-actions a{
  display:flex;flex-direction:column;justify-content:center;gap:.2rem;
  min-height:88px;padding:14px 14px;border-radius:14px;border:1px solid rgba(18,59,93,.12);
  background:#fff;box-shadow:0 6px 18px rgba(18,59,93,.06);text-decoration:none;color:inherit
}
body.patient-hub-page .patient-hub-dashboard-actions a:hover,
body.patient-hub-page .patient-hub-dashboard-actions a:focus-visible{
  border-color:rgba(30,140,140,.45);box-shadow:0 8px 22px rgba(18,59,93,.1)
}
body.patient-hub-page .patient-hub-dashboard-actions a:focus-visible{outline:2px solid var(--patient-hub-teal);outline-offset:2px}
body.patient-hub-page .patient-hub-dashboard-actions strong{
  font-size:.95rem;color:var(--patient-hub-navy);line-height:1.25
}
body.patient-hub-page .patient-hub-dashboard-actions span{
  font-size:.8rem;line-height:1.35;color:#4a5d6c
}
body.patient-hub-page .patient-dashboard-reception-row{display:none!important}
body.patient-hub-page #preferred-gp-panel.patient-dashboard-preferred-gp-mount,
body.patient-hub-page .patient-dashboard-preferred-gp-mount{
  margin:0 0 .35rem;padding:16px;border:1px solid rgba(30,140,140,.28);
  border-radius:16px;background:linear-gradient(165deg,#fff 0%,var(--patient-hub-aqua) 120%);
  box-shadow:0 10px 28px rgba(18,59,93,.08)
}
body.patient-hub-page .patient-dashboard-preferred-gp-mount:empty{min-height:96px}
body.patient-hub-page .patient-preferred-gp-panel{display:grid;gap:.65rem}
body.patient-hub-page .patient-preferred-gp-label{
  margin:0;font-size:.72rem;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:var(--patient-hub-teal)
}
body.patient-hub-page .patient-preferred-gp-name{margin:0;font-size:1.15rem;color:var(--patient-hub-navy)}
body.patient-hub-page .patient-preferred-gp-actions{gap:10px}
body.patient-hub-page .patient-preferred-gp-actions .button,
body.patient-hub-page .patient-preferred-gp-actions a.button{min-height:44px}
body.patient-hub-page .patient-hub-install-card{
  margin:12px 0 4px;padding:14px 16px;border-radius:14px;border:1px dashed rgba(18,59,93,.2);
  background:#f7fbfb;display:grid;gap:.35rem
}
body.patient-hub-page .patient-hub-install-card[hidden]{display:none!important}
body.patient-hub-page .patient-hub-install-card strong{color:var(--patient-hub-navy);font-size:.95rem}
body.patient-hub-page .patient-hub-install-card p{margin:0;font-size:.86rem;line-height:1.4;color:#4a5d6c}
body.patient-hub-page .patient-hub-install-card a{
  min-height:44px;display:inline-flex;align-items:center;font-weight:650;color:var(--patient-hub-teal)
}
body.patient-hub-page #patient-dashboard-secondary{display:none!important}
body.patient-hub-page .page-main{padding:8px 0 0!important}
body.patient-hub-page .page-layout{max-width:72rem}
body.patient-hub-page #practice-info-strip.patient-dashboard-practice{
  margin:0 0 calc(18px + env(safe-area-inset-bottom,0px) + var(--action-dock-height,72px));
  padding:0;border:0;background:transparent
}
body.patient-hub-page .patient-hub-practice-details{
  border:1px solid rgba(18,59,93,.12);border-radius:14px;background:#fff;overflow:hidden
}
body.patient-hub-page .patient-hub-practice-details>summary{
  list-style:none;cursor:pointer;padding:14px 16px;font-weight:700;color:var(--patient-hub-navy);
  min-height:44px;display:flex;align-items:center;justify-content:space-between;gap:12px
}
body.patient-hub-page .patient-hub-practice-details>summary::-webkit-details-marker{display:none}
body.patient-hub-page .patient-hub-practice-details>summary::after{content:"+";font-weight:700;color:var(--patient-hub-teal)}
body.patient-hub-page .patient-hub-practice-details[open]>summary::after{content:"–"}
body.patient-hub-page .patient-hub-practice-details .patient-dashboard-practice-grid{
  padding:0 16px 16px;display:grid;gap:12px
}
body.patient-hub-page .patient-hub-practice-details .patient-dashboard-practice-grid address{font-style:normal}
@media (min-width:768px){
  body.patient-hub-page .patient-hub-hero{padding-top:36px!important;padding-bottom:20px!important}
  body.patient-hub-page .patient-hub-dashboard-actions{grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}
  body.patient-hub-page .patient-hub-practice-details .patient-dashboard-practice-grid{
    grid-template-columns:1.1fr 1fr 1fr
  }
  body.patient-hub-page .breadcrumb-bar{display:block}
}
/* Compact hub footer: keep required links, cut repeated hours/contact on small screens */
@media (max-width:767px){
  body.patient-hub-page footer .footer-hours,
  body.patient-hub-page footer .footer-contact{display:none}
  body.patient-hub-page footer .footer-identity>p{display:none}
  body.patient-hub-page footer .footer-grid{gap:1rem}
  body.patient-hub-page footer .footer-accordion-native{border-top:1px solid rgba(18,59,93,.08)}
  body.patient-hub-page .persistent-care-actions{
    padding-bottom:calc(8px + env(safe-area-inset-bottom,0px))
  }
}
@media (display-mode:standalone){
  body.patient-hub-page .patient-hub-install-card{display:none!important}
}
</style>`;

const INSTALL_CARD_SCRIPT = `<script id="wmc-patient-hub-install-card-runtime">(function(){
try{
  var card=document.querySelector("[data-wmc-hub-install-card]");
  if(!card)return;
  var standalone=false;
  try{
    if(window.matchMedia&&window.matchMedia("(display-mode: standalone)").matches)standalone=true;
    if(window.navigator&&window.navigator.standalone===true)standalone=true;
  }catch(e){}
  card.hidden=!!standalone;
}catch(e){}
})();</script>`;

function escapeAttr(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function dashboardPrimaryHtml(): string {
  const drLabel = escapeAttr(DIGITAL_RECEPTION_OPEN_ARIA_LABEL);
  return (
    `<!--${PATIENT_HUB_MOBILE_DASHBOARD_MARKER}:start-->` +
    `<section class="patient-hub-tasks patient-hub-dashboard" id="patient-dashboard-primary" aria-labelledby="patient-dashboard-primary-title" data-wmc-hub-dashboard="1">` +
    `<div class="shell">` +
    `<div id="preferred-gp-panel" class="patient-dashboard-preferred-gp-mount" data-preferred-gp-panel="" data-preferred-gp-slot="summary" data-preferred-gp-storage-hook="wmc.preferredGp.v1" role="region" aria-label="My preferred GP" aria-live="polite"></div>` +
    `<h2 id="patient-dashboard-primary-title" class="patient-hub-dashboard-actions-title">Quick actions</h2>` +
    `<div class="patient-hub-task-grid patient-hub-dashboard-actions">` +
    `<a class="wmc-book-appointment" data-hotdoc-button="" data-hotdoc-widget="lightbox" href="https://www.hotdoc.com.au/medical-centres/woolloongabba-QLD-4102/t-medicals-woolloongabba-medical-centre/doctors?wp=w_lightbox"><strong>Book Appointment</strong><span>Book online with HotDoc.</span></a>` +
    `<a class="patient-hub-dr-primary" data-open-digital-reception="" href="#digital-reception" id="digital-reception" aria-label="${drLabel}"><strong>Digital Reception</strong><span>Ask for the next step.</span></a>` +
    `<a href="team.html"><strong>Find a Doctor</strong><span>Meet our GPs and team.</span></a>` +
    `<a href="knowledge/index.html"><strong>Health Information</strong><span>Trusted health advice.</span></a>` +
    `</div>` +
    `<aside class="patient-hub-install-card" data-wmc-hub-install-card="">` +
    `<strong>Install WMC App</strong>` +
    `<p>Add a Home Screen shortcut for quicker access to booking, your preferred GP, and reception.</p>` +
    `<a href="install-wmc-app.html">Open installation guide</a>` +
    `</aside>` +
    `</div></section>` +
    `<!--${PATIENT_HUB_MOBILE_DASHBOARD_MARKER}:end-->`
  );
}

function practiceDetailsHtml(innerGridHtml: string): string {
  return (
    `<section class="article-section patient-dashboard-practice" id="practice-info-strip" aria-label="Practice details">` +
    `<details class="patient-hub-practice-details">` +
    `<summary>Practice information</summary>` +
    innerGridHtml +
    `</details></section>`
  );
}

/**
 * Idempotent Patient Hub mobile dashboard reshape. No-op off patient-hub.html.
 */
export function refinePatientHubMobileDashboard(html: string, pagePath: string): string {
  if (pagePath !== "patient-hub.html") return html;
  let next = html;

  if (!/\bpatient-hub-page\b/i.test(next)) {
    next = next.replace(/<body\b([^>]*)>/i, (tag, attrs: string) => {
      if (/\bclass="/i.test(attrs)) {
        return `<body${attrs.replace(/\bclass="/i, 'class="patient-hub-page ')}>`;
      }
      return `<body class="patient-hub-page"${attrs}>`;
    });
  }

  next = next.replace(
    new RegExp(
      `<style\\b[^>]*id="${PATIENT_HUB_MOBILE_DASHBOARD_STYLE_ID}"[\\s\\S]*?<\\/style>\\s*`,
      "i",
    ),
    "",
  );
  next = next.includes("</head>")
    ? next.replace(/<\/head>/i, `${STYLE}</head>`)
    : `${STYLE}${next}`;

  // Compact welcome copy
  next = next.replace(
    /(<section\b[^>]*\bpatient-hub-hero\b[^>]*>[\s\S]*?<h1>)([\s\S]*?)(<\/h1>)/i,
    `$1Your care, made easier.$3`,
  );
  next = next.replace(
    /(<section\b[^>]*\bpatient-hub-hero\b[^>]*>[\s\S]*?<p class="lede")([^>]*)(>)([\s\S]*?)(<\/p>)/i,
    (_m, open: string, attrs: string, close: string, _content: string, end: string) => {
      const cleaned = attrs.replace(/\s*data-wmc-hub-lede-refined=["']1["']/gi, "");
      return `${open}${cleaned} data-wmc-hub-lede-refined="1"${close}Save a preferred GP, book, open Digital Reception, and find practice information — in one place.${end}`;
    },
  );

  // Replace primary + secondary dashboard bands with approved layout (idempotent).
  const markerPattern = new RegExp(
    `<!--\\s*${PATIENT_HUB_MOBILE_DASHBOARD_MARKER}:start\\s*-->[\\s\\S]*?<!--\\s*${PATIENT_HUB_MOBILE_DASHBOARD_MARKER}:end\\s*-->\\s*`,
    "i",
  );
  if (markerPattern.test(next)) {
    next = next.replace(markerPattern, dashboardPrimaryHtml());
  } else {
    const primarySecondary =
      /<section\b[^>]*\bid="patient-dashboard-primary"[^>]*>[\s\S]*?<\/section>\s*<section\b[^>]*\bid="patient-dashboard-secondary"[^>]*>[\s\S]*?<\/section>/i;
    if (primarySecondary.test(next)) {
      next = next.replace(primarySecondary, dashboardPrimaryHtml());
    } else if (/id="patient-dashboard-primary"/i.test(next)) {
      next = next.replace(
        /<section\b[^>]*\bid="patient-dashboard-primary"[^>]*>[\s\S]*?<\/section>/i,
        dashboardPrimaryHtml(),
      );
      next = next.replace(
        /<section\b[^>]*\bid="patient-dashboard-secondary"[^>]*>[\s\S]*?<\/section>/i,
        "",
      );
    }
  }

  // Wrap practice strip grid in expandable details (preserve existing branded strip content)
  if (
    /id="practice-info-strip"/i.test(next) &&
    !/<details\b[^>]*\bpatient-hub-practice-details\b/i.test(next)
  ) {
    next = next.replace(
      /(<section\b[^>]*\bid="practice-info-strip"[^>]*>)([\s\S]*?)(<\/section>)/i,
      (_m, _open: string, inner: string) => {
        const trimmed = inner.trim();
        const grid = /patient-dashboard-practice-grid/i.test(trimmed)
          ? trimmed
          : `<div class="patient-dashboard-practice-grid">${trimmed}</div>`;
        return practiceDetailsHtml(grid);
      },
    );
  }

  if (!/id="wmc-patient-hub-install-card-runtime"/i.test(next)) {
    next = next.replace(/<\/body>/i, `${INSTALL_CARD_SCRIPT}</body>`);
  }

  return next;
}
