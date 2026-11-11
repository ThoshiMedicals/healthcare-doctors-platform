/* Woolloongabba Medical Centre — PWA service worker.

   SECURITY CONTRACT (fail-closed):
   This service worker intercepts (calls event.respondWith) ONLY a GET,
   same-origin request whose pathname is in SHELL_ALLOWLIST below — a small
   set of static, non-personalised app-shell assets (icons, manifest, the
   offline fallback page). Every other request — every `/admin/*` page
   (dashboard, login, draft preview tokens, session-end), every
   `/api/auth/*` NextAuth endpoint, every `/api/admin/*` API, every clinic
   form/EOI/readiness/career submission API, any non-GET method, and every
   ordinary public CMS page — is left completely untouched: this file does
   not call event.respondWith() for them, so the browser performs its normal
   network fetch exactly as if this service worker did not exist. That means
   publish/invalidation, the HTML durable cache (`x-wmc-cache`,
   `publicCacheEpoch`), and ETag revalidation (see
   src/documents/public-html-cache.ts and src/app/(public)/[[...path]]/route.ts)
   are never touched or shadowed by this worker.

   This worker never caches Set-Cookie or Authorization responses, never
   caches a non-GET request/response, and never caches `/admin/*` or
   `/api/auth|admin/*` or any clinic submission endpoint, even if a future
   edit accidentally widens SHELL_ALLOWLIST — isCacheEligible() re-checks the
   deny list independently of the allow list, and responseIsCacheSafe() is a
   second, independent check applied before every cache.put().

   Source of truth: apps/web/src/pwa/cache-policy.ts. Keep the three constants
   between the CACHE_POLICY_MIRROR markers below byte-for-byte identical to
   that module's NEVER_CACHE_PREFIXES / NEVER_CACHE_PATTERNS / SHELL_ALLOWLIST
   (a classic service worker script cannot `import` a TypeScript module at
   runtime). apps/web/src/pwa/sw-contract.test.ts extracts this exact block,
   asserts it matches cache-policy.ts, and then runs this file's real
   install/activate/fetch logic against fake Cache/fetch/event objects to
   confirm the behaviour described above actually holds.

   Lifecycle: skipWaiting() on install and clients.claim() on activate let a
   new build take over promptly. Neither call affects server-side cache
   freshness (that is governed entirely by publicCacheEpoch / ETag / the
   `/site.js` no-cache header in next.config.ts) — they only control how
   quickly this tiny static-shell cache layer updates. */
'use strict';

const CACHE_VERSION = 'v1';
const CACHE_NAME = 'wmc-shell-' + CACHE_VERSION;

// --- BEGIN CACHE_POLICY_MIRROR (keep byte-identical to src/pwa/cache-policy.ts) ---
const NEVER_CACHE_PREFIXES = ["/admin", "/api/auth", "/api/admin"];
const NEVER_CACHE_PATTERNS = [
  /^\/api\/clinics\/[^/]+\/(form-requests|career-applications|gp-pipeline\/(eoi|readiness|readiness-package|session-match))(?:\/|$)/,
  /^\/api\/clinics\/[^/]+\//,
];
const OFFLINE_FALLBACK_PATH = "/offline.html";
const SHELL_ALLOWLIST = [
  OFFLINE_FALLBACK_PATH,
  "/favicon.ico",
  "/favicon-16x16.png",
  "/favicon-32x32.png",
  "/apple-touch-icon.png",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];
// --- END CACHE_POLICY_MIRROR ---

function isNetworkOnlyPath(pathname) {
  var prefixHit = NEVER_CACHE_PREFIXES.some(function (prefix) {
    return pathname === prefix || pathname.indexOf(prefix + '/') === 0;
  });
  if (prefixHit) return true;
  return NEVER_CACHE_PATTERNS.some(function (pattern) {
    return pattern.test(pathname);
  });
}

/** The only gate that may ever lead to event.respondWith() being called. */
function isCacheEligible(request) {
  if (request.method !== 'GET') return false;
  var url;
  try {
    url = new URL(request.url);
  } catch (err) {
    return false;
  }
  if (url.origin !== self.location.origin) return false; // never touch cross-origin (HotDoc, analytics, fonts)
  if (isNetworkOnlyPath(url.pathname)) return false; // fail-closed, independent of the allow list below
  return SHELL_ALLOWLIST.indexOf(url.pathname) !== -1;
}

/** Defense in depth, re-checked immediately before every cache.put(). */
function responseIsCacheSafe(response) {
  if (!response || response.status !== 200) return false;
  if (response.type && response.type !== 'basic' && response.type !== 'default') return false;
  if (response.headers.has('set-cookie')) return false;
  if (response.headers.has('authorization')) return false;
  var cacheControl = response.headers.get('cache-control') || '';
  if (/\b(no-store|private)\b/i.test(cacheControl)) return false;
  return true;
}

self.addEventListener('install', function (event) {
  // Take over as soon as this build is installed. Only affects this tiny
  // static-shell cache; server-rendered pages are unaffected (see header
  // comment above).
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return Promise.all(
        SHELL_ALLOWLIST.map(function (shellPath) {
          // An optional shell asset (e.g. manifest.json before the platform
          // agent lands it) failing to fetch must not fail SW install.
          return cache.add(shellPath).catch(function () {});
        }),
      );
    }),
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches
      .keys()
      .then(function (keys) {
        return Promise.all(
          keys
            .filter(function (key) {
              return key !== CACHE_NAME && key.indexOf('wmc-shell-') === 0;
            })
            .map(function (key) {
              return caches.delete(key);
            }),
        );
      })
      .then(function () {
        return self.clients.claim();
      }),
  );
});

// Lets a page force an already-waiting worker to activate immediately
// (e.g. an in-app "update available" prompt), without changing fetch policy.
self.addEventListener('message', function (event) {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', function (event) {
  var request = event.request;
  // Fail closed: anything not explicitly cache-eligible is left untouched.
  // Not calling respondWith() here means the browser's normal network fetch
  // runs exactly as if this service worker were absent — this is how
  // /admin/*, /api/auth/*, /api/admin/*, every clinic submission API, every
  // non-GET request, and every ordinary CMS page stay network-only.
  if (!isCacheEligible(request)) return;

  event.respondWith(
    fetch(request)
      .then(function (networkResponse) {
        if (responseIsCacheSafe(networkResponse)) {
          var toCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(function (cache) {
            cache.put(request, toCache);
          });
        }
        return networkResponse;
      })
      .catch(function () {
        return caches.match(request).then(function (cached) {
          if (cached) return cached;
          // Only ever substitute the generic static offline page for a
          // navigation request to the offline page itself failing while
          // uncached — every other shell asset simply fails as a normal
          // network error when offline and not yet cached.
          if (request.mode === 'navigate') return caches.match(OFFLINE_FALLBACK_PATH);
          return undefined;
        });
      }),
  );
});
