export const CLINIC_HOST_HEADER = "x-clinic-host";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);
const QUICK_TUNNEL_HOST = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.trycloudflare\.com$/;

export function hostnameFromHostHeader(value: string | null | undefined): string {
  if (!value) return "";
  return value.split(",")[0]?.trim().split(":")[0]?.toLowerCase() ?? "";
}

function isPrivateIPv4(hostname: string): boolean {
  const match = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(hostname);
  if (!match) return false;
  const octets = match.slice(1).map(Number);
  if (octets.some((octet) => octet > 255)) return false;
  const [first, second] = octets;
  if (first === 10) return true;
  if (first === 192 && second === 168) return true;
  return first === 172 && second >= 16 && second <= 31;
}

export function isLocalHost(hostname: string): boolean {
  if (LOCAL_HOSTS.has(hostname)) return true;
  return process.env.NODE_ENV !== "production" && isPrivateIPv4(hostname);
}

/** A Cloudflare Quick Tunnel name. Ignored unless the UAT process sets UAT_QUICK_TUNNEL=true. */
export function isQuickTunnelHost(hostname: string): boolean {
  if (process.env.UAT_QUICK_TUNNEL !== "true") return false;
  return QUICK_TUNNEL_HOST.test(hostnameFromHostHeader(hostname));
}

/** Secure cookies when the browser is on HTTPS, including a tunnel that forwards proto https to local HTTP. */
export function prefersSecureCookie(protocol: string, forwardedProto: string | null | undefined): boolean {
  if (protocol === "https:") return true;
  const forwarded = forwardedProto?.split(",")[0]?.trim().toLowerCase().replace(/:$/, "");
  return forwarded === "https";
}

/** Origin of a local or LAN request. Production keeps the configured public origin. */
export function developmentRequestOrigin(
  hostHeader: string | null | undefined,
  protocol: string | null | undefined,
): string | null {
  if (process.env.NODE_ENV === "production") return null;
  const hostname = hostnameFromHostHeader(hostHeader);
  const host = hostHeader?.split(",")[0]?.trim();
  if (!host || !isLocalHost(hostname)) return null;
  const proto = protocol?.split(",")[0]?.trim() === "https" ? "https" : "http";
  return `${proto}://${host}`;
}
