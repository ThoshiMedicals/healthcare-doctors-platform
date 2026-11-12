/**
 * Patient PWA install prompt — shared intelligence (Phase 3B).
 *
 * Pure helpers are tested in Node; runtime behaviour lives in
 * `apps/web/public/patient-install-prompt.js` (loaded from the SSR tip block).
 */

export const PATIENT_INSTALL_STORAGE = {
  dismissedAt: "wmc.patientInstall.v1.dismissedAt",
  installed: "wmc.patientInstall.v1.installed",
} as const;

/** Legacy Phase 3A session dismiss — read once, then cleared client-side. */
export const LEGACY_SESSION_DISMISS_KEY = "wmcPwaInstallTipDismissed";

/** Honour "Not now" for 14 days before offering again. */
export const DEFAULT_INSTALL_PROMPT_COOLDOWN_MS = 14 * 24 * 60 * 60 * 1000;

export const INSTALL_TIP_SCRIPT_VERSION = "wmc-patient-install-prompt-20261112a";

export const INSTALL_TIP_ID = "wmc-pwa-install-tip";

export const INSTALL_TIP_COPY = {
  default:
    "Install Gabba Medical for quick access: book appointments, your Preferred GP, Digital Reception, and call reception.",
  ios: 'Install Gabba Medical: tap Share, then "Add to Home Screen" for booking, Preferred GP, Digital Reception, and call.',
} as const;

export type ShouldShowInstallPromptInput = {
  now: number;
  dismissedAt: number | null;
  installed: boolean;
  standalone: boolean;
  cooldownMs: number;
};

export type StandaloneHints = {
  displayModeStandalone?: boolean;
  navigatorStandalone?: boolean;
};

/** Parse ISO or epoch millis from localStorage. */
export function parseDismissedAt(raw: string | null | undefined): number | null {
  if (raw == null || raw === "") return null;
  const trimmed = String(raw).trim();
  if (/^\d+$/.test(trimmed)) {
    const epoch = Number(trimmed);
    return Number.isFinite(epoch) && epoch > 0 ? epoch : null;
  }
  const parsed = Date.parse(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

export function isWithinInstallPromptCooldown(
  dismissedAtMs: number,
  now: number,
  cooldownMs: number,
): boolean {
  if (cooldownMs <= 0) return false;
  return now - dismissedAtMs < cooldownMs;
}

/**
 * Whether the bottom install note should be offered (browser tab only).
 * Does not consider platform capability — callers gate iOS/Android separately.
 */
export function shouldShowInstallPrompt(input: ShouldShowInstallPromptInput): boolean {
  const { now, dismissedAt, installed, standalone, cooldownMs } = input;
  if (standalone) return false;
  if (installed) return false;
  if (dismissedAt == null) return true;
  return !isWithinInstallPromptCooldown(dismissedAt, now, cooldownMs);
}

/** Testable standalone detection (client also checks matchMedia). */
export function isStandaloneDisplay(hints: StandaloneHints = {}): boolean {
  return !!(hints.displayModeStandalone || hints.navigatorStandalone);
}

export function serializeDismissedAt(now: number): string {
  return new Date(now).toISOString();
}

const INSTALL_TIP_PATTERN = new RegExp(
  `<!--\\s*${INSTALL_TIP_ID}:start\\s*-->[\\s\\S]*?<!--\\s*${INSTALL_TIP_ID}:end\\s*-->\\s*`,
  "i",
);

/** HTML + external script for applyPwaInstallTip (pwa-meta.ts). */
export function buildPatientInstallTipBlock(): string {
  const scriptSrc = `/patient-install-prompt.js?v=${INSTALL_TIP_SCRIPT_VERSION}`;
  return `<!-- ${INSTALL_TIP_ID}:start -->
<style id="${INSTALL_TIP_ID}-style">
#${INSTALL_TIP_ID}{position:fixed;left:14px;right:14px;bottom:calc(14px + env(safe-area-inset-bottom,0px) + var(--action-dock-height,0px));z-index:130;display:flex;align-items:center;justify-content:space-between;gap:12px;max-width:420px;margin:0 auto;padding:12px 14px;border-radius:14px;background:#163f62;color:#fff;font:13px/1.4 inherit;box-shadow:0 14px 34px rgba(16,38,58,.28)}
#${INSTALL_TIP_ID}[hidden]{display:none!important}
#${INSTALL_TIP_ID} p{margin:0}
#${INSTALL_TIP_ID}-actions{display:flex;flex-shrink:0;gap:8px}
#${INSTALL_TIP_ID} button{border:0;border-radius:999px;padding:7px 12px;font-size:12.5px;font-weight:600;cursor:pointer}
#${INSTALL_TIP_ID}-install{background:#fff;color:#163f62}
#${INSTALL_TIP_ID}-dismiss{background:rgba(255,255,255,.16);color:#fff}
@media (prefers-reduced-motion:no-preference){#${INSTALL_TIP_ID}{transition:opacity .25s ease}}
</style>
<div id="${INSTALL_TIP_ID}" class="${INSTALL_TIP_ID}" hidden role="note" aria-live="polite">
<p id="${INSTALL_TIP_ID}-text">${INSTALL_TIP_COPY.default}</p>
<div id="${INSTALL_TIP_ID}-actions">
<button type="button" id="${INSTALL_TIP_ID}-install" hidden>Install</button>
<button type="button" id="${INSTALL_TIP_ID}-dismiss" aria-label="Dismiss install tip">Not now</button>
</div>
</div>
<script src="${scriptSrc}" defer data-wmc-install-tip="${INSTALL_TIP_ID}"></script>
<!-- ${INSTALL_TIP_ID}:end -->
`;
}

export function applyPatientInstallTip(html: string): string {
  if (!/<\/body>/i.test(html)) return html;
  const withoutExisting = html.replace(INSTALL_TIP_PATTERN, "");
  return withoutExisting.replace(/<\/body>/i, `${buildPatientInstallTipBlock()}</body>`);
}
