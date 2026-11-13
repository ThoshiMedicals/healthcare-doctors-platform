/**
 * Patient Hub — iPhone Safari "Add to Home Screen" guide (Phase 3B / B1).
 *
 * Injects a dismissible, patient-friendly panel on `patient-hub.html` only.
 * Runtime visibility is handled by `patient-install-ios.js` (iOS Safari +
 * not already standalone + dismiss/cooldown gates).
 *
 * D2 (2026-11-12): in-flow under the hub hero — never a fixed overlay that
 * covers H1 / Preferred GP / booking actions.
 */

import {
  PATIENT_INSTALL_COOLDOWN_MS,
  PATIENT_INSTALL_DISMISS_STORAGE_KEY,
  PATIENT_INSTALL_IOS_GUIDE_DISMISS_KEY,
} from "@/documents/patient-install-dismiss";

export const IOS_INSTALL_PANEL_ID = "wmc-ios-install";
export const IOS_INSTALL_BLOCK_MARKER = "wmc-ios-install-guide";

export const PATIENT_INSTALL_STORAGE_DISMISSED = PATIENT_INSTALL_DISMISS_STORAGE_KEY;
export const PATIENT_INSTALL_STORAGE_IOS_GUIDE_DISMISSED = PATIENT_INSTALL_IOS_GUIDE_DISMISS_KEY;

/** Canonical cooldown — aligned with install tip / Android. */
export const PATIENT_INSTALL_IOS_DISMISS_COOLDOWN_MS = PATIENT_INSTALL_COOLDOWN_MS;

export const PATIENT_INSTALL_IOS_SCRIPT_VERSION = "wmc-ios-install-v3-20261113b";

const INSTALL_BLOCK_PATTERN = new RegExp(
  `<!--\\s*${IOS_INSTALL_BLOCK_MARKER}:start\\s*-->[\\s\\S]*?<!--\\s*${IOS_INSTALL_BLOCK_MARKER}:end\\s*-->\\s*`,
  "i",
);

const IOS_INSTALL_BLOCK = `<!-- ${IOS_INSTALL_BLOCK_MARKER}:start -->
<style id="${IOS_INSTALL_PANEL_ID}-style">
#${IOS_INSTALL_PANEL_ID}{
  position:static;
  display:block;
  margin:0;
  padding:0;
  z-index:auto;
  max-width:none;
  background:#eef6f8;
  color:#163f62;
  border-bottom:1px solid rgba(22,63,98,.12);
  box-shadow:none;
  font-size:1.05rem;
  line-height:1.55;
}
#${IOS_INSTALL_PANEL_ID}[hidden]{display:none!important}
#${IOS_INSTALL_PANEL_ID} .wmc-ios-install-inner{
  max-width:72rem;
  margin:0 auto;
  padding:16px 1.25rem calc(22px + env(safe-area-inset-bottom,0px) + var(--action-dock-height,72px));
}
#${IOS_INSTALL_PANEL_ID} h2{
  margin:0 0 8px;
  font-size:1.25rem;
  font-weight:700;
  line-height:1.3;
  color:#163d68;
}
#${IOS_INSTALL_PANEL_ID} p{margin:0 0 12px;color:#2a4050}
#${IOS_INSTALL_PANEL_ID} ol{
  margin:0 0 14px 1.15em;
  padding:0;
  color:#2a4050;
}
#${IOS_INSTALL_PANEL_ID} li{margin:0 0 10px}
#${IOS_INSTALL_PANEL_ID} ul{
  margin:0 0 14px 1.15em;
  padding:0;
  color:#2a4050;
}
#${IOS_INSTALL_PANEL_ID} .wmc-ios-install-help{
  margin:0 0 14px;padding:12px 14px;border-radius:12px;background:#fff;
  border:1px solid rgba(22,61,104,.14);font-size:1.05rem
}
#${IOS_INSTALL_PANEL_ID} .wmc-ios-install-actions{
  display:flex;
  flex-wrap:wrap;
  gap:10px;
  align-items:center;
}
#${IOS_INSTALL_PANEL_ID} .button{margin:0;min-height:48px;font-size:1rem}
#${IOS_INSTALL_PANEL_ID} .button-secondary{
  background:#fff;
  color:#163d68;
  border:1px solid rgba(22,61,104,.22);
}
#${IOS_INSTALL_PANEL_ID} .button-secondary:hover,
#${IOS_INSTALL_PANEL_ID} .button-secondary:focus-visible{
  background:#f5f8fc;
}
#${IOS_INSTALL_PANEL_ID} a.text-link{
  font-weight:650;
  color:#007a87;
  min-height:48px;
  display:inline-flex;
  align-items:center;
}
@media (prefers-reduced-motion:no-preference){
  #${IOS_INSTALL_PANEL_ID}{transition:opacity .25s ease}
}
</style>
<section
  id="${IOS_INSTALL_PANEL_ID}"
  class="${IOS_INSTALL_PANEL_ID}"
  hidden
  role="region"
  aria-labelledby="${IOS_INSTALL_PANEL_ID}-title"
  aria-live="polite"
  data-patient-install-ios=""
  data-wmc-ios-install-inline="1"
>
  <div class="wmc-ios-install-inner">
  <h2 id="${IOS_INSTALL_PANEL_ID}-title">Save this page on your iPhone</h2>
  <p>
    Apple does not show an automatic Install button in Safari. Follow these three steps.
    Your dashboard stays visible above this guide.
  </p>
  <ol>
    <li>Stay in the <strong>Safari</strong> app (not Chrome or another browser).</li>
    <li>Tap <strong>Share</strong> — the square with an arrow pointing up.</li>
    <li>Tap <strong>Add to Home Screen</strong>, then tap <strong>Add</strong>.</li>
  </ol>
  <p>
    Optional: if you see <strong>Open as Web App</strong>, turn it on for a fuller screen.
  </p>
  <p class="wmc-ios-install-help">
    Prefer help in person? Ask reception, or call
    <a href="tel:+61732173344">(07) 3217 3344</a>.
  </p>
  <p><strong>Why save it?</strong></p>
  <ul>
    <li>Book appointments (HotDoc)</li>
    <li>Your Preferred GP on this phone</li>
    <li>Digital Reception for common practice questions</li>
    <li>Call the clinic</li>
    <li>Practice information</li>
  </ul>
  <div class="wmc-ios-install-actions">
    <a class="text-link" href="install-wmc-app.html">Full installation guide</a>
    <button type="button" class="button button-secondary" data-wmc-ios-install-dismiss="" aria-label="Not now, hide install guide">
      Not now
    </button>
  </div>
  </div>
</section>
<script defer src="/patient-install-ios.js?v=${PATIENT_INSTALL_IOS_SCRIPT_VERSION}"></script>
<!-- ${IOS_INSTALL_BLOCK_MARKER}:end -->
`;

/**
 * SSR helper for `patient-hub.html`. Idempotent; no-op on other paths.
 * Prefers after the compact install card / primary dashboard so the hero and
 * Preferred GP stay unobstructed; falls back to after `.patient-hub-hero`.
 */
export function injectPatientInstallIos(html: string, pagePath: string): string {
  if (!/^patient-hub\.html$/i.test(pagePath)) return html;
  const withoutExisting = html.replace(INSTALL_BLOCK_PATTERN, "");
  if (/data-wmc-hub-install-card/i.test(withoutExisting)) {
    return withoutExisting.replace(
      /(<aside\b[^>]*\bdata-wmc-hub-install-card\b[^>]*>[\s\S]*?<\/aside>)/i,
      `$1${IOS_INSTALL_BLOCK}`,
    );
  }
  if (/id=["']patient-dashboard-primary["']/i.test(withoutExisting)) {
    return withoutExisting.replace(
      /(<section\b[^>]*\bid=["']patient-dashboard-primary["'][^>]*>[\s\S]*?<\/section>)/i,
      `$1${IOS_INSTALL_BLOCK}`,
    );
  }
  if (/<section\b[^>]*\bpatient-hub-hero\b[^>]*>[\s\S]*?<\/section>/i.test(withoutExisting)) {
    return withoutExisting.replace(
      /(<section\b[^>]*\bpatient-hub-hero\b[^>]*>[\s\S]*?<\/section>)/i,
      `$1${IOS_INSTALL_BLOCK}`,
    );
  }
  if (!/<\/body>/i.test(withoutExisting)) return withoutExisting;
  return withoutExisting.replace(/<\/body>/i, `${IOS_INSTALL_BLOCK}</body>`);
}
