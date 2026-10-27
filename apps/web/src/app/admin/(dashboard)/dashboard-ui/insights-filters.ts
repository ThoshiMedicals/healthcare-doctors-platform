import {
  isAuthorityTier,
  type AuthorityTier,
} from "@/measurement/authority-tier";
import {
  parseInsightsDataMode,
  type InsightsDataMode,
} from "@/measurement/insights-data-mode";
import { isPlatformHealthDomainId } from "@/measurement/platform-health-investigation";
import type { PlatformHealthDomainId } from "@/measurement/platform-health-score";
import { isExecutiveRange, type ExecutiveRange } from "@/measurement/ranges";
import {
  isInvestigationSource,
  type InvestigationSource,
} from "./investigation-source";
import type { GovernanceQueue } from "./links";
import {
  INSIGHTS_FOCUS_KEYS,
  insightsDashboardRoute,
  insightsFiltersForDestination,
  type InsightsNavigationIntent,
  type InsightsFocusKey,
} from "./filter-policy";

export const INSIGHTS_FILTERS_COOKIE = "wmc_insights_filters";
export const INSIGHTS_FILTERS_COOKIE_MAX_AGE = 60 * 60 * 8; // 8 hours

/** Persistent investigation filters shared across Insights dashboards (C5–D6). */
export type InsightsFilters = {
  range?: ExecutiveRange;
  practitioner?: string;
  service?: string;
  queue?: GovernanceQueue;
  /** Live · Demo · Empty (C9). */
  data?: InsightsDataMode;
  /** Authority tier investigation (D2) — Hub / Developing / Thin. */
  tier?: AuthorityTier;
  /** Platform health domain focus (D3) — search / governance / conversion / … */
  health?: PlatformHealthDomainId;
  /** Digital Reception intent investigation (D4). */
  intent?: string;
  /** Investigation entry source (D6) — kpi / recommendation / chart / health / queue. */
  from?: InvestigationSource;
};

const QUEUES: GovernanceQueue[] = ["awaiting_review", "due_soon", "expired", "missing_ownership"];

export function isGovernanceQueue(value: string | null | undefined): value is GovernanceQueue {
  return !!value && (QUEUES as string[]).includes(value);
}

function cleanSlug(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

/** Parse filters from dashboard search params (supports legacy `focus` on PA/SA). */
export function parseInsightsFilters(params: {
  range?: string;
  practitioner?: string;
  service?: string;
  queue?: string;
  focus?: string;
  data?: string;
  tier?: string;
  health?: string;
  intent?: string;
  from?: string;
  /** Which legacy focus axis to treat `focus` as when practitioner/service unset. */
  focusAs?: "practitioner" | "service";
}): InsightsFilters {
  const filters: InsightsFilters = {};
  if (isExecutiveRange(params.range)) filters.range = params.range;
  const practitioner = cleanSlug(params.practitioner);
  const service = cleanSlug(params.service);
  const focus = cleanSlug(params.focus);
  const intent = cleanSlug(params.intent);
  if (practitioner) filters.practitioner = practitioner;
  else if (focus && params.focusAs === "practitioner") filters.practitioner = focus;
  if (service) filters.service = service;
  else if (focus && params.focusAs === "service") filters.service = focus;
  if (isGovernanceQueue(params.queue)) filters.queue = params.queue;
  const data = parseInsightsDataMode(params.data);
  if (data) filters.data = data;
  if (isAuthorityTier(params.tier)) filters.tier = params.tier;
  if (isPlatformHealthDomainId(params.health)) filters.health = params.health;
  if (intent) filters.intent = intent;
  if (isInvestigationSource(params.from)) filters.from = params.from;
  return filters;
}

export function parseInsightsFiltersCookie(raw: string | null | undefined): InsightsFilters {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(decodeURIComponent(raw)) as Record<string, unknown>;
    return parseInsightsFilters({
      range: typeof parsed.range === "string" ? parsed.range : undefined,
      practitioner: typeof parsed.practitioner === "string" ? parsed.practitioner : undefined,
      service: typeof parsed.service === "string" ? parsed.service : undefined,
      queue: typeof parsed.queue === "string" ? parsed.queue : undefined,
      data: typeof parsed.data === "string" ? parsed.data : undefined,
      tier: typeof parsed.tier === "string" ? parsed.tier : undefined,
      health: typeof parsed.health === "string" ? parsed.health : undefined,
      intent: typeof parsed.intent === "string" ? parsed.intent : undefined,
      from: typeof parsed.from === "string" ? parsed.from : undefined,
    });
  } catch {
    return {};
  }
}

export function serializeInsightsFiltersCookie(filters: InsightsFilters): string {
  const payload: Record<string, string> = {};
  if (filters.range) payload.range = filters.range;
  if (filters.practitioner) payload.practitioner = filters.practitioner;
  if (filters.service) payload.service = filters.service;
  if (filters.queue) payload.queue = filters.queue;
  if (filters.data) payload.data = filters.data;
  if (filters.tier) payload.tier = filters.tier;
  if (filters.health) payload.health = filters.health;
  if (filters.intent) payload.intent = filters.intent;
  if (filters.from) payload.from = filters.from;
  return encodeURIComponent(JSON.stringify(payload));
}

/** URL values win over cookie values so explicit navigation stays authoritative. */
export function mergeInsightsFilters(
  cookie: InsightsFilters,
  url: InsightsFilters,
): InsightsFilters {
  return {
    range: url.range ?? cookie.range,
    practitioner: url.practitioner ?? cookie.practitioner,
    service: url.service ?? cookie.service,
    queue: url.queue ?? cookie.queue,
    data: url.data ?? cookie.data,
    tier: url.tier ?? cookie.tier,
    health: url.health ?? cookie.health,
    intent: url.intent ?? cookie.intent,
    from: url.from ?? cookie.from,
  };
}

export function insightsFiltersActive(filters: InsightsFilters): boolean {
  return Boolean(
    filters.practitioner ||
      filters.service ||
      filters.queue ||
      filters.tier ||
      filters.health ||
      filters.intent,
  );
}

export function insightsFiltersLabel(filters: InsightsFilters): string {
  const parts: string[] = [];
  if (filters.practitioner) parts.push(`Practitioner · ${filters.practitioner}`);
  if (filters.service) parts.push(`Service · ${filters.service}`);
  if (filters.queue) {
    const queueLabel: Record<GovernanceQueue, string> = {
      awaiting_review: "Awaiting review",
      due_soon: "Due soon",
      expired: "Expired",
      missing_ownership: "Missing Owner",
    };
    parts.push(`Governance · ${queueLabel[filters.queue]}`);
  }
  if (filters.tier) {
    const tierLabel: Record<AuthorityTier, string> = {
      Hub: "Well connected",
      Developing: "Building links",
      Thin: "Needs more links",
    };
    parts.push(`Link strength · ${tierLabel[filters.tier]}`);
  }
  if (filters.health) {
    const healthLabel: Record<PlatformHealthDomainId, string> = {
      search: "Search",
      digital_reception: "Digital Reception",
      governance: "Governance",
      analytics: "Analytics",
      conversion: "Conversion",
      authority: "Authority",
      accessibility: "Accessibility",
    };
    parts.push(`Health · ${healthLabel[filters.health]}`);
  }
  if (filters.intent) parts.push(`Intent · ${filters.intent}`);
  return parts.join(" · ") || "No active focus";
}

/** Append shared filter params onto a query string builder. */
export function appendInsightsFilters(
  params: URLSearchParams,
  filters?: InsightsFilters | null,
  opts?: { includeRange?: boolean; practitionerAsFocus?: boolean; serviceAsFocus?: boolean },
): void {
  if (!filters) return;
  if (opts?.includeRange !== false && filters.range) params.set("range", filters.range);
  if (filters.practitioner) {
    if (opts?.practitionerAsFocus) params.set("focus", filters.practitioner);
    else params.set("practitioner", filters.practitioner);
  }
  if (filters.service) {
    if (opts?.serviceAsFocus) params.set("focus", filters.service);
    else params.set("service", filters.service);
  }
  if (filters.queue) params.set("queue", filters.queue);
  if (filters.data) params.set("data", filters.data);
  if (filters.tier) params.set("tier", filters.tier);
  if (filters.health) params.set("health", filters.health);
  if (filters.intent) params.set("intent", filters.intent);
  if (filters.from) params.set("from", filters.from);
}

/** Destination-aware URL generation. All filter values are validated before projection.
 * Existing monthly `month` survives a mode-change URL; unrelated query keys do not.
 */
export function withInsightsQuery(
  path: string,
  filters?: InsightsFilters | null,
  opts?: {
    hash?: string;
    practitionerAsFocus?: boolean;
    serviceAsFocus?: boolean;
    includeRange?: boolean;
    navigationIntent?: InsightsNavigationIntent;
    /** Deliberately selected focus dimensions, never copied implicitly. */
    focusKeys?: readonly InsightsFocusKey[];
    month?: string;
  },
): string {
  const hashIndex = path.indexOf("#");
  const base = hashIndex === -1 ? path : path.slice(0, hashIndex);
  const existingHash = hashIndex === -1 ? "" : path.slice(hashIndex + 1);
  const queryIndex = base.indexOf("?");
  const pathname = queryIndex === -1 ? base : base.slice(0, queryIndex);
  const existingParams = new URLSearchParams(queryIndex === -1 ? "" : base.slice(queryIndex + 1));
  const route = insightsDashboardRoute(pathname);
  const params = new URLSearchParams();

  if (route === "/admin/executive/monthly") {
    const month = opts?.month ?? existingParams.get("month");
    if (month && /^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
      params.set("month", month);
    }
  }

  // Only the generated links are sanitised in Phase 2.
  // Inbound URL parsing, server merge and cookies remain unchanged.
  const validated = parseInsightsFilters(filters ?? {});
  const selected = insightsFiltersForDestination(
    pathname,
    validated,
    opts?.navigationIntent ?? "overview",
    opts?.focusKeys ?? [],
  );
  appendInsightsFilters(params, selected, opts);
  const query = params.toString();
  const fragment = opts?.hash !== undefined ? opts.hash.replace(/^#/, "") : existingHash;
  return `${pathname}${query ? `?${query}` : ""}${fragment ? `#${fragment}` : ""}`;
}

/** Same-page data-mode navigation retains active focus and an explicit monthly window.
 * Used by the shared switcher; no dashboard-specific cookie or resolver effects.
 */
export function insightsDataModeHref(
  path: string,
  filters: InsightsFilters,
  mode: InsightsDataMode,
  month?: string,
): string {
  return withInsightsQuery(path, { ...filters, data: mode }, {
    month,
    navigationIntent: "investigation",
    focusKeys: INSIGHTS_FOCUS_KEYS,
  });
}

/** Clear is preference-only: do not carry any investigation dimension or provenance.
 * Validate runtime values so only supported range/data preferences survive.
 */
export function clearInsightsFocus(filters: InsightsFilters): InsightsFilters {
  return parseInsightsFilters({ range: filters.range, data: filters.data });
}

/**
 * Clear an Insights investigation without deleting reporting preferences.
 * - Ignore all inbound investigation params, including legacy focus and from.
 * - Drop investigation fragments (e.g. #queue-expired and #intent-vaccination).
 * - Preserve a valid monthly report month, either in path or explicitly provided.
 *
 * Phase 4's v2 cookie stores range/data only, so refresh cannot resurrect focus.
 * This function does not write or modify cookies.
 */
export function clearInsightsHref(
  pathname: string,
  filters: InsightsFilters,
  options?: { month?: string },
): string {
  return withInsightsQuery(pathname, clearInsightsFocus(filters), {
    navigationIntent: "overview",
    month: options?.month,
    hash: "",
  });
}

export function matchFocusKey(key: string, focus: string): boolean {
  const a = key.trim().toLowerCase();
  const b = focus.trim().toLowerCase();
  if (!a || !b) return false;
  return a === b || a.includes(b) || b.includes(a);
}
