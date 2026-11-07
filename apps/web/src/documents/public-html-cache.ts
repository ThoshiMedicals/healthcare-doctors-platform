/**
 * In-process + durable (disk) cache for fully rendered public HTML (clinic + path).
 *
 * - Never used for auth/admin/private/personalised responses.
 * - Invalidated on CMS publish, vacancy changes, practitioner publish, EV promote
 *   by bumping generation (memory) and deleting the clinic's durable directory.
 * - TTL is a safety net only; publish hooks are the primary freshness path.
 * - Durable files survive Node process restart within the same deploy so cold
 *   navigations do not re-run Prisma when a snapshot already exists.
 */

import { createHash } from "crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "fs";
import path from "path";

export type CachedPublicHtml = {
  status: number;
  html: string;
  path: string;
  cachedAt: number;
  generation: number;
};

export type PublicHtmlCacheHit = CachedPublicHtml & {
  source: "memory" | "disk";
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

function entryKey(clinicId: string, pathKey: string): string {
  return `${clinicId}\0${pathKey}`;
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

function durableEnabled(): boolean {
  return process.env.WMC_PUBLIC_HTML_DURABLE_CACHE !== "0";
}

function durableRoot(): string {
  const override = process.env.WMC_PUBLIC_HTML_CACHE_DIR?.trim();
  if (override) return path.resolve(override);
  return path.join(process.cwd(), ".data", "public-html-cache");
}

function safeSegment(value: string): string {
  return createHash("sha1").update(value).digest("hex").slice(0, 32);
}

function clinicDir(clinicId: string): string {
  return path.join(durableRoot(), "clinics", safeSegment(clinicId));
}

function pageFile(clinicId: string, pagePath: string): string {
  return path.join(clinicDir(clinicId), `${safeSegment(pagePath)}.json`);
}

function hostsDir(): string {
  return path.join(durableRoot(), "hosts");
}

function hostFile(hostname: string): string {
  return path.join(hostsDir(), `${safeSegment(hostname.toLowerCase())}.json`);
}

function ensureDir(dir: string): void {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

function readJsonFile<T>(file: string): T | null {
  try {
    if (!existsSync(file)) return null;
    return JSON.parse(readFileSync(file, "utf8")) as T;
  } catch {
    return null;
  }
}

function writeJsonFile(file: string, value: unknown): void {
  try {
    ensureDir(path.dirname(file));
    writeFileSync(file, JSON.stringify(value), "utf8");
  } catch {
    // Durable cache is best-effort; memory cache remains authoritative in-process.
  }
}

function deleteClinicDurable(clinicId: string): void {
  try {
    const dir = clinicDir(clinicId);
    if (existsSync(dir)) rmSync(dir, { recursive: true, force: true });
  } catch {
    /* ignore */
  }
}

function deleteAllDurable(): void {
  try {
    const root = durableRoot();
    if (existsSync(root)) rmSync(root, { recursive: true, force: true });
  } catch {
    /* ignore */
  }
}

function readDurablePage(clinicId: string, pagePath: string): CachedPublicHtml | null {
  if (!durableEnabled()) return null;
  const raw = readJsonFile<{
    status: number;
    html: string;
    path: string;
    cachedAt: number;
  }>(pageFile(clinicId, pagePath));
  if (!raw || typeof raw.html !== "string") return null;
  if (Date.now() - raw.cachedAt > ttlMs()) return null;
  return {
    status: raw.status,
    html: raw.html,
    path: raw.path,
    cachedAt: raw.cachedAt,
    generation: clinicGeneration(clinicId),
  };
}

function writeDurablePage(
  clinicId: string,
  pagePath: string,
  value: { status: number; html: string; path: string },
): void {
  if (!durableEnabled()) return;
  writeJsonFile(pageFile(clinicId, pagePath), {
    status: value.status,
    html: value.html,
    path: value.path,
    cachedAt: Date.now(),
  });
}

export function getPublicHtmlCache(clinicId: string, pathKey: string): PublicHtmlCacheHit | null {
  const key = entryKey(clinicId, pathKey);
  const hit = entries.get(key);
  if (hit) {
    const gen = clinicGeneration(clinicId);
    if (hit.generation !== gen) {
      entries.delete(key);
    } else if (Date.now() - hit.cachedAt > ttlMs()) {
      entries.delete(key);
    } else {
      return { ...hit, source: "memory" };
    }
  }

  const durable = readDurablePage(clinicId, pathKey);
  if (!durable) return null;
  // Promote disk snapshot into memory for subsequent hits this process.
  entries.set(key, {
    ...durable,
    generation: clinicGeneration(clinicId),
  });
  pruneIfNeeded();
  return { ...durable, source: "disk", generation: clinicGeneration(clinicId) };
}

export function peekPublicHtmlGeneration(clinicId: string): number {
  return clinicGeneration(clinicId);
}

export function setPublicHtmlCache(
  clinicId: string,
  pathKey: string,
  value: { status: number; html: string; path: string },
): void {
  const key = entryKey(clinicId, pathKey);
  const entry: CacheEntry = {
    status: value.status,
    html: value.html,
    path: value.path,
    cachedAt: Date.now(),
    generation: clinicGeneration(clinicId),
  };
  entries.set(key, entry);
  pruneIfNeeded();
  writeDurablePage(clinicId, pathKey, value);
}

/**
 * Store a MISS render only if no publish/invalidation happened during rendering.
 * Prevents an in-flight pre-publish render from rewriting durable/memory cache
 * after invalidatePublicHtmlCache deleted snapshots.
 */
export function setPublicHtmlCacheIfGeneration(
  clinicId: string,
  pathKey: string,
  value: { status: number; html: string; path: string },
  generationAtStart: number,
): boolean {
  if (clinicGeneration(clinicId) !== generationAtStart) return false;
  setPublicHtmlCache(clinicId, pathKey, value);
  // Re-check after write in case invalidation raced the disk write.
  if (clinicGeneration(clinicId) !== generationAtStart) {
    entries.delete(entryKey(clinicId, pathKey));
    deleteClinicDurable(clinicId);
    return false;
  }
  return true;
}

/** Bump clinic generation and drop derived caches. Safe to call from any publish path. */
export function invalidatePublicHtmlCache(clinicId: string): void {
  if (!clinicId) return;
  generations.set(clinicId, clinicGeneration(clinicId) + 1);
  repeatsCache.delete(clinicId);
  // Host cache is hostname-keyed; clear all on any clinic invalidation (tiny map).
  clinicHostCache.clear();
  deleteClinicDurable(clinicId);
  try {
    const dir = hostsDir();
    if (existsSync(dir)) rmSync(dir, { recursive: true, force: true });
  } catch {
    /* ignore */
  }
}

export function invalidateAllPublicHtmlCaches(): void {
  for (const clinicId of generations.keys()) {
    generations.set(clinicId, clinicGeneration(clinicId) + 1);
  }
  entries.clear();
  repeatsCache.clear();
  clinicHostCache.clear();
  deleteAllDurable();
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
  if (hit) {
    if (Date.now() - hit.at > CLINIC_HOST_TTL_MS) {
      clinicHostCache.delete(hostname);
    } else {
      return hit.value as T | null;
    }
  }

  if (!durableEnabled()) return undefined;
  const raw = readJsonFile<{ at: number; value: unknown }>(hostFile(hostname));
  if (!raw) return undefined;
  if (Date.now() - raw.at > Math.max(CLINIC_HOST_TTL_MS, ttlMs())) return undefined;
  clinicHostCache.set(hostname, { at: raw.at, value: raw.value });
  return raw.value as T | null;
}

export function setCachedClinicByHost(hostname: string, value: unknown): void {
  const at = Date.now();
  clinicHostCache.set(hostname, { at, value });
  if (!durableEnabled()) return;
  writeJsonFile(hostFile(hostname), { at, value });
}

/** Test helper — clears all cache state. */
export function resetPublicHtmlCacheForTests(): void {
  generations.clear();
  entries.clear();
  repeatsCache.clear();
  clinicHostCache.clear();
  deleteAllDurable();
}

/** Test helper — drop in-memory entries only (durable files remain). */
export function clearMemoryPublicHtmlCacheForTests(): void {
  entries.clear();
  repeatsCache.clear();
  clinicHostCache.clear();
}

export function publicHtmlCacheStats(): {
  entries: number;
  clinics: number;
  generations: Record<string, number>;
  durableRoot: string;
} {
  const gens: Record<string, number> = {};
  for (const [id, gen] of generations) gens[id] = gen;
  return {
    entries: entries.size,
    clinics: generations.size,
    generations: gens,
    durableRoot: durableRoot(),
  };
}
