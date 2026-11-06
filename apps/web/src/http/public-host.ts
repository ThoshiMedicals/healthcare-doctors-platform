import { hostnameFromHostHeader, isLocalHost, prefersSecureCookie } from "@/clinics/host";

/** Preferred public apex for Woolloongabba (production cutover host). */
export const PRODUCTION_APEX_HOST = "gabbamedicalcentre.com.au";
export const PRODUCTION_WWW_HOST = `www.${PRODUCTION_APEX_HOST}`;

/**
 * Resolve whether the browser request arrived over HTTPS.
 * Cloudflare tunnels and reverse proxies set `x-forwarded-proto`.
 */
export function requestArrivedOverHttps(
  protocol: string,
  forwardedProto: string | null | undefined,
): boolean {
  return prefersSecureCookie(protocol, forwardedProto);
}

/**
 * Build a permanent redirect target for public hosts:
 * - force HTTPS off localhost
 * - collapse www → apex for the production clinic domain
 *
 * Returns null when no redirect is required (local UAT, already-correct HTTPS).
 */
export function publicHostRedirectUrl(input: {
  hostHeader: string | null | undefined;
  protocol: string;
  forwardedProto: string | null | undefined;
  pathname: string;
  search: string;
}): URL | null {
  const hostname = hostnameFromHostHeader(input.hostHeader);
  if (!hostname || isLocalHost(hostname)) return null;

  const https = requestArrivedOverHttps(input.protocol, input.forwardedProto);
  const apexPreferred = hostname === PRODUCTION_WWW_HOST;
  if (https && !apexPreferred) return null;

  const targetHost = apexPreferred ? PRODUCTION_APEX_HOST : hostname;
  const url = new URL(`https://${targetHost}${input.pathname}${input.search}`);
  return url;
}
