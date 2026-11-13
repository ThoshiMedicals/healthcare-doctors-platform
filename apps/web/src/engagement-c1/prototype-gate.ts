/**
 * Phase C1 prototype gate — keep demo UI off production apex by default.
 * Enable explicitly with WMC_ENGAGEMENT_C1_PROTOTYPE=true.
 * Disable hard with WMC_ENGAGEMENT_C1_PROTOTYPE=false.
 */

import { hostnameFromHostHeader } from "@/clinics/host";
import { isStagingNoIndexHost } from "@/seo/staging-noindex";

const PRODUCTION_APEX = new Set([
  "gabbamedicalcentre.com.au",
  "www.gabbamedicalcentre.com.au",
]);

export function isProductionApexHost(hostHeader: string | null | undefined): boolean {
  const host = hostnameFromHostHeader(hostHeader || "").toLowerCase();
  return PRODUCTION_APEX.has(host);
}

/**
 * Build/nav visibility (no request host).
 * Default ON for this C1 branch so Hostinger/local production builds still expose the lab nav.
 * Request gate still blocks production apex unless explicitly enabled.
 * Set WMC_ENGAGEMENT_C1_PROTOTYPE=false to hide nav entirely.
 */
export function isEngagementC1PrototypeBuildEnabled(): boolean {
  const flag = process.env.WMC_ENGAGEMENT_C1_PROTOTYPE;
  if (flag === "false" || flag === "0") return false;
  return true;
}

/** Request-time gate for pages. */
export function isEngagementC1PrototypeRequestEnabled(
  hostHeader: string | null | undefined,
): boolean {
  const flag = process.env.WMC_ENGAGEMENT_C1_PROTOTYPE;
  if (flag === "false" || flag === "0") return false;
  if (isProductionApexHost(hostHeader) && flag !== "true" && flag !== "1") {
    return false;
  }
  if (flag === "true" || flag === "1") return true;
  if (isStagingNoIndexHost(hostHeader)) return true;
  if (process.env.NODE_ENV !== "production") return true;
  return false;
}

export const C1_DEMO_BANNER =
  "DEMONSTRATION ONLY — practice notifications are not live. No browser push permission is requested. Dummy labelled data.";
