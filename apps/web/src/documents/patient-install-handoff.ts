/**
 * Host-aware Patient App install handoff URL (Phase B1).
 * Staging hosts resolve to themselves; production apex preserved for cutover.
 */

export const INSTALL_HANDOFF_PATH = "/install-wmc-app.html?source=desktop-qr";

export const PRODUCTION_INSTALL_HOST = "gabbamedicalcentre.com.au";

/** Hosts with precomputed QR bitmaps in public/patient-install-qr.js */
export const KNOWN_INSTALL_HANDOFF_HOSTS = [
  "gabbamedicalcentre.com.au",
  "staging.gabbamedicalcentre.com.au",
  "mediumslateblue-eagle-960503.hostingersite.com",
] as const;

export function normalizeInstallHandoffHost(hostname: string): string {
  const h = String(hostname || "")
    .toLowerCase()
    .replace(/:\d+$/, "");
  if (h === "www.gabbamedicalcentre.com.au") return PRODUCTION_INSTALL_HOST;
  return h;
}

export function resolveInstallHandoffUrl(input: {
  hostname?: string | null;
  origin?: string | null;
  protocol?: string | null;
  host?: string | null;
}): string {
  const hostname = normalizeInstallHandoffHost(input.hostname || "");
  if (!hostname) {
    return `https://${PRODUCTION_INSTALL_HOST}${INSTALL_HANDOFF_PATH}`;
  }
  if ((KNOWN_INSTALL_HANDOFF_HOSTS as readonly string[]).includes(hostname)) {
    return `https://${hostname}${INSTALL_HANDOFF_PATH}`;
  }
  const origin =
    input.origin ||
    (input.protocol && input.host ? `${input.protocol}//${input.host}` : null);
  if (origin) {
    return `${String(origin).replace(/\/$/, "")}${INSTALL_HANDOFF_PATH}`;
  }
  return `https://${hostname}${INSTALL_HANDOFF_PATH}`;
}
