/**
 * WMC PWA cache security policy — single source of truth.
 *
 * Fail-closed contract: a request may be read from or written to a Cache
 * Storage cache ONLY if it is GET, same-origin, and its pathname is in
 * `SHELL_ALLOWLIST` (a tiny set of static, non-personalised app-shell assets).
 * Everything else — `/admin/*` (dashboard, login, preview tokens, session-end),
 * `/api/auth/*` (NextAuth), `/api/admin/*`, every clinic-scoped form/EOI/
 * readiness/career submission API, and any non-GET method — is network-only
 * and must never be cached or served from a service worker cache.
 *
 * `apps/web/public/sw.js` cannot `import` this TypeScript module at runtime
 * (classic service worker script, no bundler step). It embeds a byte-for-byte
 * literal mirror of the arrays below between `CACHE_POLICY_MIRROR` markers.
 * `sw-contract.test.ts` extracts that mirror and asserts it matches this
 * module exactly, then exercises the live service worker logic against fake
 * Cache/fetch/event objects so policy and implementation cannot drift apart.
 *
 * This module never caches personal patient info, booking submissions,
 * authenticated responses, or Digital Reception interactions — see the
 * exclusion matrix in `cache-policy.test.ts`.
 */

/** Exact path or path-prefix matches. Anything starting with one of these is network-only. */
export const NEVER_CACHE_PREFIXES: readonly string[] = [
  // Whole admin app: dashboard, login, forgot-password, session-end, draft
  // preview tokens (/admin/preview/:token). CMS preview auth and admin
  // session rules must never be weakened by a cache layer.
  "/admin",
  // NextAuth sign-in/out/session/csrf/callback endpoints.
  "/api/auth",
  // All admin-only JSON APIs (exports, gp-pipeline ops, story-capture, etc.).
  "/api/admin",
];

/**
 * Regex matches for public (unauthenticated) endpoints that still must never
 * be cached: clinic-scoped submission/mutation APIs for patients or
 * applicants. Stale or replayed-from-cache responses here could show a
 * patient a false "submitted" state, or let recruitment workflows appear to
 * succeed while the recruitment HOLD is active.
 */
export const NEVER_CACHE_PATTERNS: readonly RegExp[] = [
  // /api/clinics/<slug>/form-requests
  // /api/clinics/<slug>/career-applications
  // /api/clinics/<slug>/gp-pipeline/eoi|readiness|readiness-package|session-match
  /^\/api\/clinics\/[^/]+\/(form-requests|career-applications|gp-pipeline\/(eoi|readiness|readiness-package|session-match))(?:\/|$)/,
  // Catch-all: every clinic-scoped API is request/response data for a specific
  // visitor/session context (readiness results, search signals, etc.), never
  // static shell. Keep this broader than the named list above fail-closed.
  /^\/api\/clinics\/[^/]+\//,
];

/** Static offline fallback page. A generic static shell asset — never a cached copy of real content. */
export const OFFLINE_FALLBACK_PATH = "/offline.html";

/**
 * Conservative precache allow-list: static, non-personalised, publicly
 * cacheable shell assets only. Deliberately excludes `/` and every CMS page —
 * those are server-rendered, per-clinic, durable-cache-controlled HTML (see
 * `src/documents/public-html-cache.ts`, `x-wmc-cache`, `publicCacheEpoch`) and
 * must keep flowing straight through to the network, untouched by this
 * service worker, so publish/invalidation and ETag revalidation keep working.
 */
export const SHELL_ALLOWLIST: readonly string[] = [
  OFFLINE_FALLBACK_PATH,
  "/favicon.ico",
  "/favicon-16x16.png",
  "/favicon-32x32.png",
  "/apple-touch-icon.png",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

const POLICY_ORIGIN = "https://wmc-policy.invalid";

function normalizedPathname(pathOrUrl: string): string {
  if (!pathOrUrl) return "";
  try {
    const url = pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")
      ? new URL(pathOrUrl)
      : new URL(pathOrUrl, POLICY_ORIGIN);
    return url.pathname;
  } catch {
    return pathOrUrl.split("?")[0]?.split("#")[0] ?? pathOrUrl;
  }
}

/**
 * True when a path must never be read from or written to a Cache Storage
 * cache under any circumstance (admin, auth, admin APIs, clinic submission
 * APIs). This is the fail-closed deny list; it is independent of method,
 * because a defensive caller should treat even a hypothetical GET to these
 * paths as unsafe to cache.
 */
export function isNetworkOnlyPath(pathOrUrl: string): boolean {
  const pathname = normalizedPathname(pathOrUrl);
  if (!pathname) return true;
  const prefixHit = NEVER_CACHE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  if (prefixHit) return true;
  return NEVER_CACHE_PATTERNS.some((pattern) => pattern.test(pathname));
}

/** True when `pathname` is an explicitly approved static app-shell asset. */
export function isShellAssetPath(pathOrUrl: string): boolean {
  const pathname = normalizedPathname(pathOrUrl);
  return SHELL_ALLOWLIST.includes(pathname);
}

/**
 * The actual gate a service worker (or any cache layer) must use before
 * reading/writing Cache Storage for a request: GET, same-origin (checked by
 * the caller, which knows `self.location.origin`), not on the deny list, and
 * on the shell allow-list. Ordinary public CMS pages are intentionally
 * neither "network-only" (their freshness is governed by server headers, not
 * this policy) nor "cache-eligible" (the service worker must never touch
 * them) — both flags matter for different callers, so they are exposed
 * separately rather than collapsed into one boolean.
 */
export function isCacheEligibleRequest(method: string, pathOrUrl: string): boolean {
  if (method.toUpperCase() !== "GET") return false;
  const pathname = normalizedPathname(pathOrUrl);
  if (isNetworkOnlyPath(pathname)) return false;
  return isShellAssetPath(pathname);
}

type HeaderLike =
  | Headers
  | Record<string, string | undefined>
  | ReadonlyArray<readonly [string, string]>;

function headerValue(headers: HeaderLike, name: string): string | null {
  const lower = name.toLowerCase();
  if (typeof (headers as Headers).get === "function") {
    return (headers as Headers).get(name);
  }
  if (Array.isArray(headers)) {
    for (const [key, value] of headers as ReadonlyArray<readonly [string, string]>) {
      if (key.toLowerCase() === lower) return value;
    }
    return null;
  }
  for (const [key, value] of Object.entries(headers as Record<string, string | undefined>)) {
    if (key.toLowerCase() === lower && value != null) return value;
  }
  return null;
}

/**
 * Defense in depth for any response a cache layer is considering storing:
 * never persist a response that carries a Set-Cookie or Authorization header,
 * and never persist one whose own Cache-Control says `no-store`/`private`.
 * This must hold even for allow-listed shell paths, in case a future change
 * ever serves something unexpected from one of those URLs.
 */
export function responseHeadersAreCacheSafe(status: number, headers: HeaderLike): boolean {
  if (status !== 200) return false;
  if (headerValue(headers, "set-cookie") != null) return false;
  if (headerValue(headers, "authorization") != null) return false;
  const cacheControl = headerValue(headers, "cache-control") ?? "";
  if (/\b(no-store|private)\b/i.test(cacheControl)) return false;
  return true;
}
