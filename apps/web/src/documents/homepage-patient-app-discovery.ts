/**
 * Homepage Patient App discovery — code-only inject via public-ux.
 * Does not rewrite the frozen `#home` hero. Inserts a compact band after
 * HotDoc (`#hotdoc-app`) / before `#patient-information`, plus light utility links.
 */

export const HOMEPAGE_PATIENT_APP_MARKER = "wmc-homepage-patient-app";

const STYLE = `<style id="wmc-homepage-patient-app">
.wmc-home-patient-app{margin:0;padding:2.25rem 0 2.5rem;background:linear-gradient(180deg,#f4fafb 0%,#ffffff 72%);border-top:1px solid rgba(22,61,104,.08);border-bottom:1px solid rgba(22,61,104,.08)}
.wmc-home-patient-app-inner{max-width:72rem;margin:0 auto;padding:0 1.25rem;display:grid;gap:1.15rem}
@media (min-width:900px){
  .wmc-home-patient-app-inner{grid-template-columns:minmax(0,1.35fr) minmax(0,.9fr);align-items:end;gap:2rem}
}
.wmc-home-patient-app .eyebrow{margin:0 0 .35rem}
.wmc-home-patient-app h2{margin:0 0 .55rem;font-size:clamp(1.45rem,2.4vw,1.95rem);line-height:1.2;color:#163d68}
.wmc-home-patient-app .lede{margin:0 0 .85rem;max-width:38rem;color:#3d5160;font-size:1.02rem;line-height:1.55}
.wmc-home-patient-app-benefits{margin:0;padding:0;list-style:none;display:grid;gap:.4rem}
.wmc-home-patient-app-benefits li{position:relative;padding-left:1.15rem;color:#2a4050;font-size:.95rem;line-height:1.45}
.wmc-home-patient-app-benefits li::before{content:"•";position:absolute;left:0;color:#007a87;font-weight:700}
.wmc-home-patient-app-actions{display:flex;flex-wrap:wrap;gap:.65rem;margin-top:1rem;align-items:center}
.wmc-home-patient-app-actions .button{margin:0;min-height:44px}
.wmc-home-patient-app-side{display:grid;gap:.75rem;padding:1rem 1.1rem;border:1px solid rgba(22,61,104,.12);border-radius:14px;background:#fff}
.wmc-home-patient-app-side h3{margin:0;font-size:.95rem;color:#163d68}
.wmc-home-patient-app-side p{margin:0;color:#4a5d6c;font-size:.9rem;line-height:1.45}
.wmc-home-patient-app-side nav{display:flex;flex-wrap:wrap;gap:.45rem .85rem}
.wmc-home-patient-app-side a{font-weight:650;color:#163D68;text-decoration:none;min-height:44px;display:inline-flex;align-items:center}
.wmc-home-patient-app-side a:hover,.wmc-home-patient-app-side a:focus-visible{text-decoration:underline;text-underline-offset:3px}
.wmc-home-patient-app-qr{display:none}
@media (min-width:900px){
  .wmc-home-patient-app-qr{display:block;margin:0;color:#4a5d6c;font-size:.86rem;line-height:1.4}
}
</style>`;

const SECTION = `<!--${HOMEPAGE_PATIENT_APP_MARKER}:start-->
<section class="section wmc-home-patient-app" id="patient-app" aria-labelledby="wmc-home-patient-app-title" data-wmc-home-patient-app="1">
<div class="wmc-home-patient-app-inner">
<div>
<p class="eyebrow">WMC Patient App</p>
<h2 id="wmc-home-patient-app-title">Your care tools in one place.</h2>
<p class="lede">The Patient App is this clinic website, organised for everyday use — book, reach reception, save a preferred GP, and find practice information without hunting through menus.</p>
<ul class="wmc-home-patient-app-benefits">
<li>Save a preferred GP on this device and return quickly</li>
<li>Open Digital Reception and approved booking options</li>
<li>Find hours, parking, billing and practice information</li>
<li>Install on your phone for a Home Screen shortcut (separate from the HotDoc app store apps)</li>
</ul>
<div class="wmc-home-patient-app-actions">
<a class="button" href="patient-hub.html">Explore the Patient App</a>
<a class="button button-secondary" href="install-wmc-app.html">Install WMC App</a>
</div>
</div>
<aside class="wmc-home-patient-app-side" aria-label="Patient App shortcuts">
<h3>Quick access</h3>
<p>Jump straight to the tools patients use most.</p>
<nav>
<a href="patient-hub.html#preferred-gp-panel">My Preferred GP</a>
<a href="patient-hub.html#digital-reception">Digital Reception</a>
<a href="practice-information-hub.html">Practice Information</a>
<a href="install-wmc-app.html">Installation guide</a>
</nav>
<p class="wmc-home-patient-app-qr">On a computer? Open the installation page for a QR code you can scan with your phone.</p>
</aside>
</div>
</section>
<!--${HOMEPAGE_PATIENT_APP_MARKER}:end-->`;

const MARKER_PATTERN = new RegExp(
  `<!--\\s*${HOMEPAGE_PATIENT_APP_MARKER}:start\\s*-->[\\s\\S]*?<!--\\s*${HOMEPAGE_PATIENT_APP_MARKER}:end\\s*-->\\s*`,
  "i",
);

function injectUtilityLinks(html: string): string {
  let next = html;

  // Homepage information list — single Patient Hub entry if missing.
  if (
    /<div class="information-list">/i.test(next) &&
    !/<div class="information-list">[\s\S]*?href="patient-hub\.html"/i.test(next)
  ) {
    next = next.replace(
      /(<div class="information-list">)/i,
      `$1<a href="patient-hub.html"><span>Patient App</span><span aria-hidden="true">→</span></a><a href="install-wmc-app.html"><span>Install WMC App</span><span aria-hidden="true">→</span></a>`,
    );
  }

  // Footer patient column — preserve primary nav; add utility links only.
  if (
    /footer-nav-patient/i.test(next) &&
    !/footer-nav-patient[\s\S]{0,1200}?href="patient-hub\.html"/i.test(next)
  ) {
    next = next.replace(
      /(<[^>]*footer-nav-patient[^>]*>)/i,
      `$1\n<a href="patient-hub.html">Patient App</a>\n<a href="install-wmc-app.html">Install WMC App</a>`,
    );
  }

  return next;
}

/**
 * Idempotent homepage Patient App discovery. No-op off `index.html`.
 */
export function injectHomepagePatientAppDiscovery(html: string, pagePath: string): string {
  if (pagePath !== "index.html") return html;

  let next = html.replace(MARKER_PATTERN, "");
  next = next.replace(/<style\b[^>]*id="wmc-homepage-patient-app"[\s\S]*?<\/style>\s*/gi, "");
  next = next.includes("</head>")
    ? next.replace(/<\/head>/i, `${STYLE}</head>`)
    : `${STYLE}${next}`;

  if (/<section\b[^>]*\bid="patient-information"/i.test(next)) {
    next = next.replace(/(<section\b[^>]*\bid="patient-information")/i, `${SECTION}$1`);
  } else if (/<section\b[^>]*\bid="hotdoc-app"[^>]*>[\s\S]*?<\/section>/i.test(next)) {
    next = next.replace(
      /(<section\b[^>]*\bid="hotdoc-app"[^>]*>[\s\S]*?<\/section>)/i,
      `$1${SECTION}`,
    );
  } else if (/<footer\b/i.test(next)) {
    next = next.replace(/<footer\b/i, `${SECTION}<footer`);
  } else {
    next = `${next}${SECTION}`;
  }

  return injectUtilityLinks(next);
}
