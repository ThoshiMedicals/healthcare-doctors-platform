/**
 * Patient Hub ↔ Digital Reception — integration only (no DR runtime changes).
 *
 * Pattern: any control with `[data-open-digital-reception]` proxy-clicks the
 * single `.digital-reception-launcher` that public-ux injects into the care dock.
 * Homepage hero and PWA quicknav (`patient-pwa-nav.js` on layout-release) use the same contract.
 */

export const DIGITAL_RECEPTION_OPEN_DELEGATE_SCRIPT_ID = "wmc-digital-reception-open-delegate";

/** Matches care-dock / PWA quicknav accessible name (A11Y-002). */
export const DIGITAL_RECEPTION_OPEN_ARIA_LABEL =
  "Open Digital Reception — ask for the next step";

const DELEGATE_INNER = `document.addEventListener("click",function(event){
  var trigger=event.target&&event.target.closest&&event.target.closest("[data-open-digital-reception]");
  if(!trigger)return;
  event.preventDefault();
  var launcher=document.querySelector(".digital-reception-launcher");
  if(launcher)launcher.click();
});`;

/**
 * Ensure hub/practice `[data-open-digital-reception]` controls carry the dock-equivalent aria-label.
 * Idempotent; does not change visible label text. Scoped to Patient App hubs (A11Y-002) so
 * golden homepage / sitewide hero DR controls stay unchanged.
 */
export function ensureDigitalReceptionOpenAriaLabels(
  html: string,
  pagePath?: string,
): string {
  if (!/data-open-digital-reception/i.test(html)) return html;
  if (pagePath) {
    const path = pagePath.replace(/^\//, "").toLowerCase();
    if (path !== "patient-hub.html" && path !== "practice-information-hub.html") {
      return html;
    }
  }
  const label = DIGITAL_RECEPTION_OPEN_ARIA_LABEL.replace(/"/g, "&quot;");
  return html.replace(
    /<(button|a)\b([^>]*\bdata-open-digital-reception\b[^>]*)>/gi,
    (full, tag: string, attrs: string) => {
      if (/\baria-label\s*=/i.test(attrs)) return full;
      return `<${tag}${attrs} aria-label="${label}">`;
    },
  );
}

export function digitalReceptionOpenDelegateScript(
  scriptId: string = DIGITAL_RECEPTION_OPEN_DELEGATE_SCRIPT_ID,
): string {
  return `<script id="${scriptId}">${DELEGATE_INNER}</script>`;
}

/** Idempotent: inject delegate once when the page exposes DR open triggers. */
export function ensureDigitalReceptionOpenDelegate(html: string): string {
  if (!/data-open-digital-reception/i.test(html)) return html;
  if (
    new RegExp(
      `<script\\b[^>]*id="${DIGITAL_RECEPTION_OPEN_DELEGATE_SCRIPT_ID}"`,
      "i",
    ).test(html) ||
    /<script id="wmc-hero-authority-actions">/i.test(html)
  ) {
    return html;
  }
  return html.replace(/<\/body>/i, `${digitalReceptionOpenDelegateScript()}</body>`);
}

export const PATIENT_HUB_DR_HASH_SCRIPT_ID = "wmc-patient-hub-dr-hash";

const PATIENT_HUB_DR_HASH_SCRIPT = `<script id="${PATIENT_HUB_DR_HASH_SCRIPT_ID}">
(function(){
  function openFromHash(){
    var token=String(location.hash||"").replace(/^#/,"").toLowerCase();
    if(token!=="digital-reception"&&token!=="digital-reception-panel")return;
    var launcher=document.querySelector(".digital-reception-launcher");
    if(launcher){launcher.click();return;}
    if(window.WMCDigitalReception&&typeof window.WMCDigitalReception.open==="function"){
      window.WMCDigitalReception.open("");
    }
  }
  function ready(fn){
    if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",fn,{once:true});
    else fn();
  }
  ready(openFromHash);
  window.addEventListener("hashchange",openFromHash);
})();
</script>`;

const PATIENT_HUB_DR_PRIMARY =
  `<a class="patient-hub-dr-primary" data-open-digital-reception="" href="#digital-reception" id="digital-reception" aria-label="${DIGITAL_RECEPTION_OPEN_ARIA_LABEL}">` +
  "<strong>Digital Reception</strong>" +
  "<span>Search the site or ask for the next step.</span></a>";
/**
 * Patient dashboard (`patient-hub.html`): primary DR action in the task grid + hash entry for PWA shortcuts.
 */
export function ensureDigitalReceptionHubShortcut(html: string, pagePath: string): string {
  if (!/^patient-hub\.html$/i.test(pagePath)) return html;

  let next = html;

  if (!/patient-hub-dr-primary/i.test(next) && /class="patient-hub-task-grid"/i.test(next)) {
    next = next.replace(
      /(<div class="patient-hub-task-grid"[^>]*>)/i,
      `$1${PATIENT_HUB_DR_PRIMARY}`,
    );
  } else if (!/patient-hub-dr-primary/i.test(next) && /id="common-patient-tasks"/i.test(next)) {
    next = next.replace(
      /(<section\b[^>]*\bid="common-patient-tasks"[^>]*>[\s\S]*?<div class="shell">[\s\S]*?<\/p>)/i,
      `$1<div class="patient-hub-task-grid">${PATIENT_HUB_DR_PRIMARY}</div>`,
    );
  }

  if (!new RegExp(`<script\\b[^>]*id="${PATIENT_HUB_DR_HASH_SCRIPT_ID}"`, "i").test(next)) {
    next = next.replace(/<\/body>/i, `${PATIENT_HUB_DR_HASH_SCRIPT}</body>`);
  }

  return next;
}

/** Apply Patient Hub DR integration + shared open delegate for any page with triggers. */
export function applyPatientHubDigitalReception(html: string, pagePath: string): string {
  let next = ensureDigitalReceptionHubShortcut(html, pagePath);
  next = ensureDigitalReceptionOpenAriaLabels(next, pagePath);
  next = ensureDigitalReceptionOpenDelegate(next);
  return next;
}