/**
 * Shared Patient App install dismiss / cooldown helpers (Phase B1).
 * Accepts both ISO timestamps and epoch millis for backward compatibility.
 */

export const PATIENT_INSTALL_DISMISS_STORAGE_KEY = "wmc.patientInstall.v1.dismissedAt";
export const PATIENT_INSTALL_INSTALLED_STORAGE_KEY = "wmc.patientInstall.v1.installed";
export const PATIENT_INSTALL_IOS_GUIDE_DISMISS_KEY = "wmc.patientInstall.v1.iosGuideDismissedAt";

/** Honour "Not now" for 14 days before offering again. */
export const PATIENT_INSTALL_COOLDOWN_MS = 14 * 24 * 60 * 60 * 1000;

/** Parse ISO or epoch millis from localStorage (legacy + current writers). */
export function parseInstallDismissedAt(raw: string | null | undefined): number | null {
  if (raw == null || raw === "") return null;
  const trimmed = String(raw).trim();
  if (/^\d+$/.test(trimmed)) {
    const epoch = Number(trimmed);
    return Number.isFinite(epoch) && epoch > 0 ? epoch : null;
  }
  const parsed = Date.parse(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

/** Prefer ISO for new writes; parsers still accept epoch. */
export function serializeInstallDismissedAt(nowMs: number = Date.now()): string {
  return new Date(nowMs).toISOString();
}

export function isInstallDismissCooldownActive(
  dismissedAtMs: number | null,
  nowMs: number,
  cooldownMs: number = PATIENT_INSTALL_COOLDOWN_MS,
): boolean {
  if (dismissedAtMs == null) return false;
  if (cooldownMs <= 0) return false;
  return nowMs - dismissedAtMs < cooldownMs;
}
