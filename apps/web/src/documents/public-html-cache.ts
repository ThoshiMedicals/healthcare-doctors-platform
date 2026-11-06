/**
 * In-process cache for fully rendered public HTML (clinic + path).
 *
 * - Never used for auth/admin/private/personalised responses.
 * - Invalidated on CMS publish, vacancy changes, practitioner publish, EV promote.
 * - TTL is a safety net only; publish hooks are the primary freshness path.
 * - Generation bump clears all entries for a clinic without scanning keys.
 */

export type CachedPublicHtml = {
  status: number;
  html: string;
  path: string;
  cachedAt: number;
  generation: number;
};

type CacheEntry = CachedPublicHtml;

const DEFAULT_TTL_MS = 5 * 60 * 1000;
const MAX_ENTRIES = 400;

const generations = new Map<string, number>();
const entries = new Map<string, CacheEntry>();
const repeatsCache = new Map<string, { generation: number; value: unknown; at: number }>();
const clinicHostCache = new Map<string, { at: number; value: unknown }>();

function ttlMs(): number {
  const raw = process.env.WMC_PUBLIC_HTML_CACHE_TTL_MS?.trim();
  if (!raw) return DEFAULT_TTL_MS;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n >= 0 ? n : DEFAULT_TTL_MS;
}

function clinicGeneration(clinicId: string): number {
  return generations.get(clinicId) ?? 0;
}

function entryKey(clinicId: string, path: string): string {
  return `${clinicId}\0${path}`;
}

function pruneIfNeeded(): void {
  if (entries.size <= MAX_ENTRIES) return;
  const overflow = entries.size - MAX_ENTRIES;
  const keys = entries.keys();
  for (let i = 0; i < overflow; i += 1) {
    const next = keys.next();
    if (next.done) break;
    entries.delete(next.value);
  }
}

export function getPublicHtmlCache(clinicId: string, path: string): CachedPublicHtml | null {
  const key = entryKey(clinicId, path);
  const hit = entries.get(key);
  if (!hit) return null;
  const gen = clinicGeneration(clinicId);
  if (hit.generation !== gen) {
    entries.delete(key);
    return null;
  }
  if (Date.now() - hit.cachedAt > ttlMs()) {
    entries.delete(key);
    return null;
  }
  return hit;
}

export function setPublicHtmlCache(
  clinicId: string,
  path: string,
  value: { status: number; html: string; path: string },
): void {
  const key = entryKey(clinicId, path);
  entries.set(key, {
    status: value.status,
    html: value.html,
    path: value.path,
    cachedAt: Date.now(),
    generation: clinicGeneration(clinicId),
  });
  pruneIfNeeded();
}

/** Bump clinic generation and drop derived caches. Safe to call from any publish path. */
export function invalidatePublicHtmlCache(clinicId: string): void {
  if (!clinicId) return;
  generations.set(clinicId, clinicGeneration(clinicId) + 1);
  repeatsCache.delete(clinicId);
  // Host cache is hostname-keyed; clear all on any clinic invalidation (tiny map).
  clinicHostCache.clear();
}

export function invalidateAllPublicHtmlCaches(): void {
  for (const clinicId of generations.keys()) {
    generations.set(clinicId, clinicGeneration(clinicId) + 1);
  }
  // Also bump unknown clinics by clearing entries.
  entries.clear();
  repeatsCache.clear();
  clinicHostCache.clear();
}

export function getCachedPublishedRepeats<T>(clinicId: string): T | null {
  const hit = repeatsCache.get(clinicId);
  if (!hit) return null;
  if (hit.generation !== clinicGeneration(clinicId)) {
    repeatsCache.delete(clinicId);
    return null;
  }
  if (Date.now() - hit.at > ttlMs()) {
    repeatsCache.delete(clinicId);
    return null;
  }
  return hit.value as T;
}

export function setCachedPublishedRepeats(clinicId: string, value: unknown): void {
  repeatsCache.set(clinicId, {
    generation: clinicGeneration(clinicId),
    value,
    at: Date.now(),
  });
}

const CLINIC_HOST_TTL_MS = 30_000;

export function getCachedClinicByHost<T>(hostname: string): T | null | undefined {
  const hit = clinicHostCache.get(hostname);
  if (!hit) return undefined;
  if (Date.now() - hit.at > CLINIC_HOST_TTL_MS) {
    clinicHostCache.delete(hostname);
    return undefined;
  }
  return hit.value as T | null;
}

export function setCachedClinicByHost(hostname: string, value: unknown): void {
  clinicHostCache.set(hostname, { at: Date.now(), value });
}

/** Test helper — clears all cache state. */
export function resetPublicHtmlCacheForTests(): void {
  generations.clear();
  entries.clear();
  repeatsCache.clear();
  clinicHostCache.clear();
}

export function publicHtmlCacheStats(): {
  entries: number;
  clinics: number;
  generations: Record<string, number>;
} {
  const gens: Record<string, number> = {};
  for (const [id, gen] of generations) gens[id] = gen;
  return { entries: entries.size, clinics: generations.size, generations: gens };
}
