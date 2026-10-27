import {
  INSIGHTS_FILTERS_COOKIE,
  INSIGHTS_FILTERS_COOKIE_MAX_AGE,
  parseInsightsFilters,
  parseInsightsFiltersCookie,
  type InsightsFilters,
} from "./insights-filters";

/** Phase 4 persistent state: only non-sensitive reporting preferences. */
export const INSIGHTS_PREFERENCES_COOKIE = "wmc_insights_prefs_v2";
export const INSIGHTS_PREFERENCES_VERSION = 2 as const;
export const INSIGHTS_PREFERENCES_COOKIE_MAX_AGE = INSIGHTS_FILTERS_COOKIE_MAX_AGE;

export type InsightsPreferences = Pick<InsightsFilters, "range" | "data">;

/** Always validate the allowed preference values; never copy investigation state. */
export function pickInsightsPreferences(filters: InsightsFilters): InsightsPreferences {
  const parsed = parseInsightsFilters({
    range: filters.range,
    data: filters.data,
  });
  return {
    ...(parsed.range ? { range: parsed.range } : {}),
    ...(parsed.data ? { data: parsed.data } : {}),
  };
}

/** Preserve preferences omitted by a destination that does not own them.
 * Explicit valid values always win. Never merge investigation state.
 */
export function mergeInsightsPreferences(
  stored: InsightsPreferences,
  current: InsightsFilters,
): InsightsPreferences {
  return { ...pickInsightsPreferences(stored), ...pickInsightsPreferences(current) };
}

/** Read a cookie value from the browser's cookie header without trusting other names. */
export function insightsCookieValue(cookieHeader: string, name: string): string | undefined {
  for (const entry of cookieHeader.split(";")) {
    const item = entry.trim();
    const offset = item.indexOf("=");
    if (offset > 0 && item.slice(0, offset) === name) return item.slice(offset + 1);
  }
  return undefined;
}

/** A v2 cookie always includes a version marker, including for empty preferences. */
export function serializeInsightsPreferencesCookie(filters: InsightsFilters): string {
  return encodeURIComponent(JSON.stringify({
    version: INSIGHTS_PREFERENCES_VERSION,
    ...pickInsightsPreferences(filters),
  }));
}

/** Invalid/malformed/wrong-version v2 cookies provide no preferences. */
export function parseInsightsPreferencesCookie(raw: string | null | undefined): InsightsPreferences {
  if (!raw) return {};
  try {
    const value: unknown = JSON.parse(decodeURIComponent(raw));
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};
    const record = value as Record<string, unknown>;
    if (record.version !== INSIGHTS_PREFERENCES_VERSION) return {};
    return pickInsightsPreferences({
      range: typeof record.range === "string" ? record.range as InsightsFilters["range"] : undefined,
      data: typeof record.data === "string" ? record.data as InsightsFilters["data"] : undefined,
    });
  } catch {
    return {};
  }
}

/**
 * Presence of v2 (including a malformed/empty value) prevents legacy fallback.
 * Only when v2 is absent do validated range/data migrate from the old cookie.
 * The legacy cookie's practitioner/service/queue/tier/health/intent/from are ignored.
 */
export function resolveInsightsCookiePreferences(
  v2Raw: string | null | undefined,
  legacyRaw: string | null | undefined,
): InsightsPreferences {
  if (v2Raw !== null && v2Raw !== undefined) {
    return parseInsightsPreferencesCookie(v2Raw);
  }
  return pickInsightsPreferences(parseInsightsFiltersCookie(legacyRaw));
}

/** Retire legacy only after the newly written preference value is visible. */
export function insightsPreferencesWriteConfirmed(
  cookieHeader: string,
  filters: InsightsFilters,
): boolean {
  const expected = `${INSIGHTS_PREFERENCES_COOKIE}=${serializeInsightsPreferencesCookie(filters)}`;
  return cookieHeader.split(";").some((part) => part.trim() === expected);
}

/** Browser-safe cookie directives; write v2 before expiring the old /admin cookie. */
export function insightsPreferenceCookieWrites(
  filters: InsightsFilters,
  secure: boolean,
): readonly [writeV2: string, expireLegacy: string] {
  const writeV2 =
    `${INSIGHTS_PREFERENCES_COOKIE}=${serializeInsightsPreferencesCookie(filters)}; Path=/admin; Max-Age=${INSIGHTS_PREFERENCES_COOKIE_MAX_AGE}; SameSite=Lax${secure ? "; Secure" : ""}`;
  const expireLegacy =
    `${INSIGHTS_FILTERS_COOKIE}=; Path=/admin; Max-Age=0; SameSite=Lax${secure ? "; Secure" : ""}`;
  return [writeV2, expireLegacy];
}
