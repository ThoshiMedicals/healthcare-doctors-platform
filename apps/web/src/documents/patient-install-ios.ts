/**
 * Patient Hub — iPhone Safari "Add to Home Screen" guide (Phase 3B).
 *
 * Injects a dismissible, patient-friendly panel on `patient-hub.html` only.
 * Runtime visibility is handled by `patient-install-ios.js` (iOS Safari +
 * not already standalone + dismiss/cooldown gates). Does not modify PWA meta,
 * global install tips, or public-ux wiring (Lead merges later).
 */

export const IOS_INSTALL_PANEL_ID = "wmc-ios-install";
export const IOS_INSTALL_BLOCK_MARKER = "wmc-ios-install-guide";

export const PATIENT_INSTALL_STORAGE_DISMISSED = "wmc.patientInstall.v1.dismissedAt";
export const PATIENT_INSTALL_STORAGE_IOS_GUIDE_DISMISSED =
  "wmc.patientInstall.v1.iosGuideDismissedAt";

/** Shared with Agent 4 prompt intelligence — honour dismiss for 7 days. */
/** Canonical cooldown — aligned with Agent 4 `DEFAULT_INSTALL_PROMPT_COOLDOWN_MS`. */
export const PATIENT_INSTALL_IOS_DISMISS_COOLDOWN_MS = 14 * 24 * 60 * 60 * 1000;

export const PATIENT_INSTALL_IOS_SCRIPT_VERSION = "wmc-ios-install-v1-20261112";

const INSTALL_BLOCK_PATTERN = new RegExp(
  `<!--\\s*${IOS_INSTALL_BLOCK_MARKER}:start\\s*-->[\\s\\S]*?<!--\\s*${IOS_INSTALL_BLOCK_MARKER}:end\\s*-->\\s*`,
  "i",
);

const IOS_INSTALL_BLOCK = `<!-- ${IOS_INSTALL_BLOCK_MARKER}:start -->
<style id="${IOS_INSTALL_PANEL_ID}-style">
#${IOS_INSTALL_PANEL_ID}{
  position:fixed;
  left:14px;
  right:14px;
  bottom:calc(14px + env(safe-area-inset-bottom,0px) + var(--action-dock-height,0px));
  z-index:125;
  max-width:420px;
  margin:0 auto;
  padding:16px 16px 14px;
  border-radius:16px;
  background:#163f62;
  color:#fff;
  box-shadow:0 16px 40px rgba(16,38,58,.32);
  font-size:14px;
  line-height:1.45;
}
#${IOS_INSTALL_PANEL_ID}[hidden]{display:none!important}
#${IOS_INSTALL_PANEL_ID} h2{
  margin:0 0 6px;
  font-size:16px;
  font-weight:700;
  line-height:1.25;
}
#${IOS_INSTALL_PANEL_ID} p{margin:0 0 10px}
#${IOS_INSTALL_PANEL_ID} ol{
  margin:0 0 12px 1.1em;
  padding:0;
}
#${IOS_INSTALL_PANEL_ID} li{margin:0 0 6px}
#${IOS_INSTALL_PANEL_ID} ul{
  margin:0 0 12px 1.1em;
  padding:0;
}
#${IOS_INSTALL_PANEL_ID} .wmc-ios-install-actions{
  display:flex;
  flex-wrap:wrap;
  gap:8px;
  justify-content:flex-end;
}
#${IOS_INSTALL_PANEL_ID} .button{margin:0}
#${IOS_INSTALL_PANEL_ID} .button-secondary{
  background:rgba(255,255,255,.14);
  color:#fff;
  border-color:rgba(255,255,255,.35);
}
#${IOS_INSTALL_PANEL_ID} .button-secondary:hover,
#${IOS_INSTALL_PANEL_ID} .button-secondary:focus-visible{
  background:rgba(255,255,255,.22);
}
@media (prefers-reduced-motion:no-preference){
  #${IOS_INSTALL_PANEL_ID}{transition:opacity .25s ease,transform .25s ease}
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
>
  <h2 id="${IOS_INSTALL_PANEL_ID}-title">Save the Patient Hub on your iPhone</h2>
  <p>
    Safari does not show an automatic install button. You add this page yourself —
    it only takes a moment.
  </p>
  <ol>
    <li>Stay in <strong>Safari</strong> on this page.</li>
    <li>Tap <strong>Share</strong> (the square with an arrow pointing up).</li>
    <li>Scroll the menu and tap <strong>Add to Home Screen</strong>.</li>
    <li>Tap <strong>Add</strong>, then open the new icon on your Home Screen.</li>
    <li>
      If you see <strong>Open as Web App</strong> when adding, turn it on for a fuller
      screen experience (not on every iPhone).
    </li>
  </ol>
  <p><strong>Why save it?</strong></p>
  <ul>
    <li>Book appointments</li>
    <li>Your Preferred GP</li>
    <li>Digital Reception</li>
    <li>Call the clinic</li>
    <li>Practice information</li>
  </ul>
  <div class="wmc-ios-install-actions">
    <button type="button" class="button button-secondary" data-wmc-ios-install-dismiss="" aria-label="Not now, hide install guide">
      Not now
    </button>
  </div>
</section>
<script defer src="/patient-install-ios.js?v=${PATIENT_INSTALL_IOS_SCRIPT_VERSION}"></script>
<!-- ${IOS_INSTALL_BLOCK_MARKER}:end -->
`;

/**
 * SSR helper for `patient-hub.html`. Idempotent; no-op on other paths.
 */
export function injectPatientInstallIos(html: string, pagePath: string): string {
  if (!/^patient-hub\.html$/i.test(pagePath)) return html;
  if (!/<\/body>/i.test(html)) return html;
  const withoutExisting = html.replace(INSTALL_BLOCK_PATTERN, "");
  return withoutExisting.replace(/<\/body>/i, `${IOS_INSTALL_BLOCK}</body>`);
}
