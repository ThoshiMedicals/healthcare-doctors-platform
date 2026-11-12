/**
 * Android-oriented PWA install CTA — SSR mount + shared contracts for Agent 4 prompt intelligence.
 *
 * Lead wires `injectPatientInstallAndroid` from public-ux on patient-hub (and optional install landing).
 * Runtime behaviour lives in `apps/web/public/patient-install-android.js`.
 */

export const PATIENT_INSTALL_DISMISSED_AT_KEY = "wmc.patientInstall.v1.dismissedAt";
export const PATIENT_INSTALL_INSTALLED_KEY = "wmc.patientInstall.v1.installed";

/** Honour dismiss across sessions; align with Phase 3B prompt intelligence (Agent 4). */
/** Canonical cooldown — aligned with Agent 4 `DEFAULT_INSTALL_PROMPT_COOLDOWN_MS`. */
export const PATIENT_INSTALL_DISMISS_COOLDOWN_MS = 14 * 24 * 60 * 60 * 1000;

export const ANDROID_INSTALL_MOUNT_ID = "wmc-android-install";
export const ANDROID_INSTALL_BLOCK_ID = "wmc-android-install";
export const ANDROID_INSTALL_SCRIPT_VERSION = "wmc-patient-install-android-20261112a";

export const ANDROID_INSTALL_SCRIPT_HREF = `/wmc-cache/patient-install-android.js?v=${ANDROID_INSTALL_SCRIPT_VERSION}`;

/** Phase 3A patient-app benefits only — no invented Medicare/records/push. */
export const PHASE3A_ANDROID_INSTALL_BENEFITS = [
  "Faster booking from your home screen",
  "Preferred GP saved on this device",
  "Digital Reception for common questions",
  "One-tap call clinic",
  "Practice info in the Patient Hub",
] as const;

export const ANDROID_INSTALL_PAGES = ["patient-hub.html", "install-wmc-app.html"] as const;

export type AndroidInstallBrowserKind = "chrome" | "samsung" | "unsupported";

export type AndroidInstallUaClassification = {
  isAndroid: boolean;
  browser: AndroidInstallBrowserKind;
  /** True when UA matches supported Android install browsers (Chrome or Samsung Internet). */
  supportedAndroidBrowser: boolean;
};

/**
 * Documented UA heuristics (client mirrors this logic):
 * - Android base: `Android` token in UA (excludes desktop Chrome devtools spoof only when absent).
 * - Samsung Internet: `SamsungBrowser/<ver>` (Chromium-based; may also include Chrome/).
 * - Chrome on Android: `Chrome/<ver>` without `SamsungBrowser`, `EdgA`, `OPR`, or `Firefox`.
 * - Excluded: iOS, desktop, in-app WebViews (`; wv)`), Edge Android, Firefox, Opera.
 */
export function classifyAndroidInstallUserAgent(userAgent: string): AndroidInstallUaClassification {
  const ua = String(userAgent || "");
  const isAndroid = /Android/i.test(ua);
  if (!isAndroid) {
    return { isAndroid: false, browser: "unsupported", supportedAndroidBrowser: false };
  }
  if (/SamsungBrowser\/\d+/i.test(ua)) {
    return { isAndroid: true, browser: "samsung", supportedAndroidBrowser: true };
  }
  const isChromeAndroid =
    /Chrome\/\d+/i.test(ua) &&
    !/SamsungBrowser/i.test(ua) &&
    !/EdgA\//i.test(ua) &&
    !/OPR\//i.test(ua) &&
    !/Firefox\//i.test(ua) &&
    !/; wv\)/i.test(ua);
  if (isChromeAndroid) {
    return { isAndroid: true, browser: "chrome", supportedAndroidBrowser: true };
  }
  return { isAndroid: true, browser: "unsupported", supportedAndroidBrowser: false };
}

export function isAndroidInstallSupportedBrowser(userAgent: string): boolean {
  return classifyAndroidInstallUserAgent(userAgent).supportedAndroidBrowser;
}

export function shouldInjectPatientInstallAndroid(pagePath: string): boolean {
  const normalised = String(pagePath || "")
    .replace(/^\//, "")
    .split("?")[0]
    .split("#")[0];
  return (ANDROID_INSTALL_PAGES as readonly string[]).includes(normalised);
}

export function parsePatientInstallDismissedAt(raw: string | null | undefined): number | null {
  if (raw == null || raw === "") return null;
  const ms = Number(raw);
  return Number.isFinite(ms) && ms > 0 ? ms : null;
}

export function isPatientInstallDismissCooldownActive(
  dismissedAtMs: number | null,
  nowMs: number,
  cooldownMs: number = PATIENT_INSTALL_DISMISS_COOLDOWN_MS,
): boolean {
  if (dismissedAtMs == null) return false;
  return nowMs - dismissedAtMs < cooldownMs;
}

const ANDROID_INSTALL_BLOCK_PATTERN = new RegExp(
  `<!--\\s*${ANDROID_INSTALL_BLOCK_ID}:start\\s*-->[\\s\\S]*?<!--\\s*${ANDROID_INSTALL_BLOCK_ID}:end\\s*-->\\s*`,
  "i",
);

function androidInstallBenefitsMarkup(): string {
  return PHASE3A_ANDROID_INSTALL_BENEFITS.map((line) => `<li>${line}</li>`).join("");
}

function buildAndroidInstallBlock(): string {
  const benefits = androidInstallBenefitsMarkup();
  return `<!-- ${ANDROID_INSTALL_BLOCK_ID}:start -->
<style id="${ANDROID_INSTALL_MOUNT_ID}-style">
#${ANDROID_INSTALL_MOUNT_ID}[hidden]{display:none!important}
#${ANDROID_INSTALL_MOUNT_ID}{position:fixed;left:14px;right:14px;bottom:calc(14px + env(safe-area-inset-bottom,0px) + var(--action-dock-height,0px));z-index:125;max-width:440px;margin:0 auto;padding:14px 16px;border-radius:16px;background:#163f62;color:#fff;font:13px/1.45 inherit;box-shadow:0 16px 36px rgba(16,38,58,.26)}
#${ANDROID_INSTALL_MOUNT_ID} .wmc-android-install-title{margin:0 0 6px;font-size:15px;font-weight:700}
#${ANDROID_INSTALL_MOUNT_ID} .wmc-android-install-lead{margin:0 0 8px;opacity:.95}
#${ANDROID_INSTALL_MOUNT_ID} ul{margin:0 0 10px;padding-left:18px}
#${ANDROID_INSTALL_MOUNT_ID} li{margin:2px 0}
#${ANDROID_INSTALL_MOUNT_ID} .wmc-android-install-actions{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
#${ANDROID_INSTALL_MOUNT_ID} button{border:0;border-radius:999px;padding:8px 14px;font-size:13px;font-weight:600;cursor:pointer}
#${ANDROID_INSTALL_MOUNT_ID} .wmc-android-install-cta{background:#fff;color:#163f62}
#${ANDROID_INSTALL_MOUNT_ID} .wmc-android-install-dismiss{background:rgba(255,255,255,.14);color:#fff}
@media (prefers-reduced-motion:no-preference){#${ANDROID_INSTALL_MOUNT_ID}{transition:opacity .22s ease}}
</style>
<div id="${ANDROID_INSTALL_MOUNT_ID}" class="wmc-patient-install-android" hidden role="region" aria-live="polite" aria-label="Install the patient app" data-wmc-android-install-root="">
<p class="wmc-android-install-title">Install the WMC patient app</p>
<p class="wmc-android-install-lead" data-wmc-android-install-lead>Add <span data-wmc-practice-name-slot>your clinic</span> to your home screen for quick access.</p>
<ul class="wmc-android-install-benefits" aria-label="App benefits">${benefits}</ul>
<div class="wmc-android-install-actions">
<button type="button" class="wmc-android-install-cta" data-wmc-android-install-cta hidden>Install WMC App</button>
<button type="button" class="wmc-android-install-dismiss" data-wmc-android-install-dismiss>Not now</button>
</div>
</div>
<script defer src="${ANDROID_INSTALL_SCRIPT_HREF}"></script>
<!-- ${ANDROID_INSTALL_BLOCK_ID}:end -->
`;
}

/**
 * Inject mount + deferred client script for eligible page paths. Idempotent per page render.
 */
export function injectPatientInstallAndroid(html: string, pagePath: string): string {
  if (!shouldInjectPatientInstallAndroid(pagePath)) return html;
  if (!/<\/body>/i.test(html)) return html;
  const withoutExisting = html.replace(ANDROID_INSTALL_BLOCK_PATTERN, "");
  return withoutExisting.replace(/<\/body>/i, `${buildAndroidInstallBlock()}</body>`);
}
