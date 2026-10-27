/**
 * Admin chrome width rules (C2).
 * Analytics / insights dashboards use the wider shell; CMS editors stay compact.
 */

export const ADMIN_SHELL_CMS_MAX = "max-w-6xl" as const;
export const ADMIN_SHELL_ANALYTICS_MAX = "max-w-7xl" as const;

/** Route prefixes that render inside the analytics productivity shell. */
export const ANALYTICS_ADMIN_PREFIXES = [
  "/admin/executive",
  "/admin/digital-reception",
  "/admin/practitioner-authority",
  "/admin/service-authority",
  "/admin/conversion-intelligence",
  "/admin/governance",
] as const;

export type AdminShellKind = "analytics" | "cms";

export function normalizeAdminPath(pathname: string): string {
  const bare = pathname.split("?")[0]?.split("#")[0] || "/";
  if (bare.length > 1 && bare.endsWith("/")) return bare.slice(0, -1);
  return bare || "/";
}

/** True for Command Centre + Executive / DR / Authority / Conversion / Governance. */
export function isAnalyticsAdminPath(pathname: string): boolean {
  const path = normalizeAdminPath(pathname);
  if (path === "/admin") return true;
  return ANALYTICS_ADMIN_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );
}

export function adminShellKind(pathname: string): AdminShellKind {
  return isAnalyticsAdminPath(pathname) ? "analytics" : "cms";
}

export function adminShellMaxClass(pathname: string): typeof ADMIN_SHELL_ANALYTICS_MAX | typeof ADMIN_SHELL_CMS_MAX {
  return isAnalyticsAdminPath(pathname) ? ADMIN_SHELL_ANALYTICS_MAX : ADMIN_SHELL_CMS_MAX;
}
