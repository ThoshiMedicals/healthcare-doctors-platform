import type { PracticeDigitalReceptionDashboard } from "@/measurement/digital-reception-report";
import type { PracticePractitionerAuthorityDashboard } from "@/measurement/practitioner-authority-report";
import type { PracticeServiceAuthorityDashboard } from "@/measurement/service-authority-report";
import type { PracticeGovernanceManagementReport } from "@/governance/management-report";

export type ActionPriority = "p0" | "p1" | "p2";
export type ActionImpact = "high" | "medium" | "low";
export type RecommendedActionSource =
  | "digital_reception"
  | "service_authority"
  | "practitioner_authority"
  | "governance";

export type RecommendedActionLink = {
  href: string;
  label: string;
};

export type RecommendedAction = {
  id: string;
  title: string;
  /** Concrete next step for a practice manager. */
  action: string;
  priority: ActionPriority;
  impact: ActionImpact;
  reason: string;
  source: RecommendedActionSource;
  entityKey?: string;
  /** Affected items / remediation queue (never a dashboard homepage). */
  fixList: RecommendedActionLink;
  /** Filtered investigation with entry context. */
  investigation: RecommendedActionLink;
  /** Sibling dashboard carrying the same focus. */
  relatedDashboard: RecommendedActionLink;
  /**
   * @deprecated Prefer investigation — kept as the primary deep link for older callers.
   */
  href: string;
  /** @deprecated Prefer investigation.label */
  hrefLabel: string;
};

export const ACTION_PRIORITY_LABEL: Record<ActionPriority, string> = {
  p0: "P0 · Fix now",
  p1: "P1 · This week",
  p2: "P2 · Plan next",
};

export const ACTION_IMPACT_LABEL: Record<ActionImpact, string> = {
  high: "High impact",
  medium: "Medium impact",
  low: "Low impact",
};

const PRIORITY_RANK: Record<ActionPriority, number> = { p0: 0, p1: 1, p2: 2 };
const IMPACT_RANK: Record<ActionImpact, number> = { high: 0, medium: 1, low: 2 };

/** Hub dashboards that require a focus / queue / intent to count as actionable. */
const DASHBOARD_HOMEPAGES = new Set([
  "/admin",
  "/admin/executive",
  "/admin/digital-reception",
  "/admin/practitioner-authority",
  "/admin/service-authority",
  "/admin/conversion-intelligence",
  "/admin/governance",
  "/admin/governance/management",
]);

/** Single-purpose reports that are already a focused work surface. */
const FOCUSED_SURFACES = new Set(["/admin/governance/expiry"]);

/**
 * True when an href carries a focus / queue / intent (or hash target) — not a bare dashboard home.
 */
export function isActionableRecommendationHref(href: string): boolean {
  try {
    const url = new URL(href, "http://local.invalid");
    const path = url.pathname.replace(/\/+$/, "") || "/";
    if (FOCUSED_SURFACES.has(path)) return true;
    if (!DASHBOARD_HOMEPAGES.has(path)) {
      return path.startsWith("/admin/") && (href.includes("?") || href.includes("#"));
    }
    if (url.hash && url.hash.length > 1) return true;
    const keys = [...url.searchParams.keys()].filter((k) => k !== "range" && k !== "data" && k !== "from");
    return keys.some((k) =>
      ["focus", "service", "practitioner", "intent", "queue", "tier", "health"].includes(k),
    );
  } catch {
    return false;
  }
}

function formatIntent(key: string): string {
  return key.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function median(values: number[]): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2;
}

function withLinks(
  partial: Omit<RecommendedAction, "href" | "hrefLabel"> & {
    fixList: RecommendedActionLink;
    investigation: RecommendedActionLink;
    relatedDashboard: RecommendedActionLink;
  },
): RecommendedAction {
  return {
    ...partial,
    href: partial.investigation.href,
    hrefLabel: partial.investigation.label,
  };
}

export type RecommendedActionLinkBuilders = {
  /** Affected intent results on Digital Reception (fix list). */
  digitalReceptionIntent: (intent: string) => string;
  /** Same intent with investigation entry context. */
  digitalReceptionIntentInvestigation: (intent: string) => string;
  /** Affected service on Service Authority (fix list). */
  serviceAuthority: (slug: string) => string;
  /** Service focus with investigation entry context. */
  serviceAuthorityInvestigation: (slug: string) => string;
  /** Affected doctor profile (fix list). */
  practitionerAuthority: (slug: string) => string;
  /** Practitioner focus with investigation entry context. */
  practitionerAuthorityInvestigation: (slug: string) => string;
  /** Conversion carrying a service focus. */
  conversionService: (slug: string) => string;
  /** Conversion carrying a practitioner focus. */
  conversionPractitioner: (slug: string) => string;
  /** Conversion carrying an intent (search → convert). */
  conversionIntent: (intent: string) => string;
  /** Content review list filtered to a queue (affected reviews). */
  governanceReview: (queue: "due_soon" | "expired") => string;
  /** Governance board remediation for a queue. */
  governanceManagement: (queue: "due_soon" | "expired") => string;
  /** Expiry report (related governance surface). */
  governanceExpiry: string;
};

/**
 * Turn measurement + governance reports into ranked recommended-action cards (C6 + D7).
 * Every card deep-links into a fix list, investigation, and related dashboard — never a homepage.
 */
export function buildRecommendedActions(input: {
  digitalReception?: PracticeDigitalReceptionDashboard | null;
  services?: PracticeServiceAuthorityDashboard | null;
  practitioners?: PracticePractitionerAuthorityDashboard | null;
  governance?: Pick<
    PracticeGovernanceManagementReport,
    "totals" | "pages_due_within_60_days" | "pages_expired"
  > | null;
  links: RecommendedActionLinkBuilders;
  limit?: number;
}): RecommendedAction[] {
  const actions: RecommendedAction[] = [];
  const links = input.links;
  const limit = input.limit ?? 8;

  const dr = input.digitalReception;
  if (dr) {
    const candidates =
      dr.flagged_intents.length > 0
        ? dr.flagged_intents
        : dr.top_intent_buckets.filter(
            (row) => row.searches >= 5 && (row.resolution_rate === null || row.resolution_rate < 50),
          );

    for (const row of candidates.slice(0, 3)) {
      const rateLabel = row.resolution_rate === null ? "—" : `${row.resolution_rate}%`;
      const priority: ActionPriority =
        row.searches >= 15 && (row.resolution_rate ?? 0) < 40 ? "p0" : "p1";
      actions.push(
        withLinks({
          id: `dr-intent-${row.intent_bucket}`,
          title: `Fix “${formatIntent(row.intent_bucket)}” search results`,
          action: "Improve Digital Reception routing and destination pages for this intent.",
          priority,
          impact: row.searches >= 10 ? "high" : "medium",
          reason: `High-search, low-resolution intent — ${row.searches} searches at ${rateLabel} resolution (target ≥70%).`,
          source: "digital_reception",
          entityKey: row.intent_bucket,
          fixList: {
            href: links.digitalReceptionIntent(row.intent_bucket),
            label: "Open Fix List",
          },
          investigation: {
            href: links.digitalReceptionIntentInvestigation(row.intent_bucket),
            label: "Open Investigation",
          },
          relatedDashboard: {
            href: links.conversionIntent(row.intent_bucket),
            label: "Related Dashboard",
          },
        }),
      );
    }
  }

  const services = input.services?.services ?? [];
  if (services.length) {
    const viewMedian = median(services.map((row) => row.service_views).filter((n) => n > 0));
    const weak = services
      .filter(
        (row) =>
          row.service_views >= Math.max(5, viewMedian) &&
          (row.contact_rate === null || row.contact_rate <= 25),
      )
      .sort(
        (a, b) =>
          b.service_views - a.service_views ||
          (a.contact_rate ?? 0) - (b.contact_rate ?? 0),
      )
      .slice(0, 3);

    for (const row of weak) {
      const contact = row.contact_rate === null ? "—" : `${row.contact_rate}%`;
      actions.push(
        withLinks({
          id: `sa-contact-${row.slug}`,
          title: `Lift contact on ${row.title || row.slug}`,
          action: "Strengthen booking / call CTAs and related journeys on this service page.",
          priority: row.service_views >= viewMedian * 1.5 && (row.contact_rate ?? 0) <= 15 ? "p0" : "p1",
          impact: row.tier === "Hub" ? "high" : "medium",
          reason: `High-view, low-contact service — ${row.service_views} views with ${contact} contact rate (peer median views ${viewMedian}).`,
          source: "service_authority",
          entityKey: row.slug,
          fixList: {
            href: links.serviceAuthority(row.slug),
            label: "Open Fix List",
          },
          investigation: {
            href: links.serviceAuthorityInvestigation(row.slug),
            label: "Open Investigation",
          },
          relatedDashboard: {
            href: links.conversionService(row.slug),
            label: "Related Dashboard",
          },
        }),
      );
    }
  }

  const practitioners = input.practitioners?.practitioners ?? [];
  if (practitioners.length) {
    const weak = practitioners
      .filter(
        (row) =>
          (row.tier === "Hub" || row.authority_score >= 7) &&
          row.profile_views >= 3 &&
          (row.booking_intent === null || row.booking_intent <= 25),
      )
      .sort(
        (a, b) =>
          b.authority_score - a.authority_score ||
          b.profile_views - a.profile_views ||
          (a.booking_intent ?? 0) - (b.booking_intent ?? 0),
      )
      .slice(0, 3);

    for (const row of weak) {
      const booking = row.booking_intent === null ? "—" : `${row.booking_intent}%`;
      actions.push(
        withLinks({
          id: `pa-booking-${row.slug}`,
          title: `Convert authority for ${row.title || row.slug}`,
          action: "Review profile booking controls, availability messaging, and Conversion paths.",
          priority: row.tier === "Hub" && (row.booking_intent ?? 0) <= 15 ? "p0" : "p1",
          impact: "high",
          reason: `High-authority, low-booking practitioner — ${row.tier} · score ${row.authority_score} · ${row.profile_views} views · ${booking} booking intent.`,
          source: "practitioner_authority",
          entityKey: row.slug,
          fixList: {
            href: links.practitionerAuthority(row.slug),
            label: "Open Fix List",
          },
          investigation: {
            href: links.practitionerAuthorityInvestigation(row.slug),
            label: "Open Investigation",
          },
          relatedDashboard: {
            href: links.conversionPractitioner(row.slug),
            label: "Related Dashboard",
          },
        }),
      );
    }
  }

  const gov = input.governance;
  if (gov) {
    const due = gov.totals.due_within_60_days;
    const expired = gov.totals.expired;
    const cluster = due + expired;
    if (cluster >= 3 || expired >= 2) {
      const primary: "expired" | "due_soon" = expired > 0 ? "expired" : "due_soon";
      actions.push(
        withLinks({
          id: "gov-expiring-cluster",
          title: "Clear expiring governance cluster",
          action:
            expired > 0
              ? "Triage expired reviews first, then schedule the due-soon cluster."
              : "Batch-schedule reviews approaching Next Review Due within 60 days.",
          priority: expired >= 2 ? "p0" : "p1",
          impact: "high",
          reason: `Expiring governance cluster — ${expired} expired and ${due} due within 60 days (${cluster} pages needing attention).`,
          source: "governance",
          fixList: {
            href: links.governanceReview(primary),
            label: "Open Fix List",
          },
          investigation: {
            href: links.governanceManagement(primary),
            label: "Open Investigation",
          },
          relatedDashboard: {
            href: links.governanceExpiry,
            label: "Related Dashboard",
          },
        }),
      );
    } else if (expired > 0) {
      actions.push(
        withLinks({
          id: "gov-expired",
          title: "Resolve expired governance reviews",
          action: "Update evidence and Next Review Due on expired pages before public trust stamps drift.",
          priority: "p0",
          impact: "high",
          reason: `${expired} governance record${expired === 1 ? "" : "s"} past Next Review Due.`,
          source: "governance",
          fixList: {
            href: links.governanceReview("expired"),
            label: "Open Fix List",
          },
          investigation: {
            href: links.governanceManagement("expired"),
            label: "Open Investigation",
          },
          relatedDashboard: {
            href: links.governanceExpiry,
            label: "Related Dashboard",
          },
        }),
      );
    } else if (due > 0) {
      actions.push(
        withLinks({
          id: "gov-due-soon",
          title: "Schedule upcoming governance reviews",
          action: "Assign owners and book review slots for pages due inside the 60-day horizon.",
          priority: "p2",
          impact: "medium",
          reason: `${due} review${due === 1 ? "" : "s"} due within 60 days — prevent an expiry cluster.`,
          source: "governance",
          fixList: {
            href: links.governanceReview("due_soon"),
            label: "Open Fix List",
          },
          investigation: {
            href: links.governanceManagement("due_soon"),
            label: "Open Investigation",
          },
          relatedDashboard: {
            href: links.governanceExpiry,
            label: "Related Dashboard",
          },
        }),
      );
    }
  }

  return actions
    .sort(
      (a, b) =>
        PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] ||
        IMPACT_RANK[a.impact] - IMPACT_RANK[b.impact] ||
        a.title.localeCompare(b.title),
    )
    .slice(0, limit);
}
