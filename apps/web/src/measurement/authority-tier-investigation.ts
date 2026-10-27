import {
  AUTHORITY_TIER_FRIENDLY,
  AUTHORITY_TIER_SCORE_BAND,
  type AuthorityTier,
} from "@/measurement/authority-framework";
import type { PractitionerAuthorityRow } from "@/measurement/practitioner-authority-report";
import type { ServiceAuthorityRow } from "@/measurement/service-authority-report";

export { AUTHORITY_TIER_FRIENDLY, AUTHORITY_TIER_SCORE_BAND, isAuthorityTier } from "@/measurement/authority-framework";

export type AuthorityRecommendationId =
  | "add_links"
  | "add_services"
  | "add_knowledge_articles"
  | "add_practitioners"
  | "improve_connections";

export type AuthorityRecommendation = {
  id: AuthorityRecommendationId;
  label: string;
  detail: string;
};

export type AuthorityTierInvestigation = {
  tier: AuthorityTier;
  friendlyLabel: string;
  scoreBand: string;
  why: string;
  recommendations: AuthorityRecommendation[];
};

const REC_COPY: Record<AuthorityRecommendationId, { label: string; detail: string }> = {
  add_links: {
    label: "Add links",
    detail: "Add clearer related links from this page to connected care journeys.",
  },
  add_services: {
    label: "Add services",
    detail: "Connect this page to relevant clinic services so patients can continue their journey.",
  },
  add_knowledge_articles: {
    label: "Add knowledge articles",
    detail: "Link advice articles to this page (and from this page) to build inbound authority.",
  },
  add_practitioners: {
    label: "Add practitioners",
    detail: "Link doctors who deliver this service so patients can choose a clinician.",
  },
  improve_connections: {
    label: "Improve connections",
    detail: "Strengthen two-way links across services, doctors, and advice so this page is easier to discover.",
  },
};

function pushRec(list: AuthorityRecommendation[], id: AuthorityRecommendationId) {
  if (list.some((item) => item.id === id)) return;
  list.push({ id, ...REC_COPY[id] });
}

/** Explain why a doctor profile sits in its authority tier + what to improve. */
export function investigatePractitionerTier(row: PractitionerAuthorityRow): AuthorityTierInvestigation {
  const { practitioner_links, inbound_article_links, related_services } = row.signals;
  const recommendations: AuthorityRecommendation[] = [];
  const gaps: string[] = [];

  if (inbound_article_links < 2) {
    gaps.push(`only ${inbound_article_links} advice article${inbound_article_links === 1 ? "" : "s"} link here`);
    pushRec(recommendations, "add_knowledge_articles");
  }
  if (related_services < 2) {
    gaps.push(`only ${related_services} related service${related_services === 1 ? "" : "s"}`);
    pushRec(recommendations, "add_services");
  }
  if (practitioner_links < 3) {
    gaps.push(`few outbound profile links (${practitioner_links})`);
    pushRec(recommendations, "add_links");
  }
  if (row.tier !== "Hub") {
    pushRec(recommendations, "improve_connections");
  }
  if (recommendations.length === 0) {
    pushRec(recommendations, "improve_connections");
  }

  const why =
    row.tier === "Hub"
      ? `Score ${row.authority_score} — well linked across advice articles (${inbound_article_links}), services (${related_services}), and profile links (${practitioner_links}).`
      : `Score ${row.authority_score} places this profile in ${AUTHORITY_TIER_FRIENDLY[row.tier]} because ${gaps.join("; ") || "link strength is still building"}.`;

  return {
    tier: row.tier,
    friendlyLabel: AUTHORITY_TIER_FRIENDLY[row.tier],
    scoreBand: AUTHORITY_TIER_SCORE_BAND[row.tier],
    why,
    recommendations,
  };
}

/** Explain why a service page sits in its authority tier + what to improve. */
export function investigateServiceTier(row: ServiceAuthorityRow): AuthorityTierInvestigation {
  const {
    related_practitioners,
    related_knowledge,
    related_services,
    inbound_article_links,
    inbound_practitioner_links,
  } = row.signals;
  const recommendations: AuthorityRecommendation[] = [];
  const gaps: string[] = [];

  if (inbound_article_links < 2) {
    gaps.push(`only ${inbound_article_links} inbound advice article${inbound_article_links === 1 ? "" : "s"}`);
    pushRec(recommendations, "add_knowledge_articles");
  }
  if (related_knowledge < 2) {
    gaps.push(`few outbound knowledge links (${related_knowledge})`);
    pushRec(recommendations, "add_knowledge_articles");
  }
  if (related_practitioners < 2 && inbound_practitioner_links < 2) {
    gaps.push(`weak doctor connections (out ${related_practitioners} / in ${inbound_practitioner_links})`);
    pushRec(recommendations, "add_practitioners");
  }
  if (related_services < 1) {
    gaps.push("no sibling service links");
    pushRec(recommendations, "add_services");
  }
  if (row.tier !== "Hub") {
    pushRec(recommendations, "improve_connections");
    pushRec(recommendations, "add_links");
  }
  if (recommendations.length === 0) {
    pushRec(recommendations, "improve_connections");
  }

  const why =
    row.tier === "Hub"
      ? `Score ${row.authority_score} — strong service graph with doctors, knowledge, and inbound articles.`
      : `Score ${row.authority_score} places this service in ${AUTHORITY_TIER_FRIENDLY[row.tier]} because ${gaps.join("; ") || "link strength is still building"}.`;

  return {
    tier: row.tier,
    friendlyLabel: AUTHORITY_TIER_FRIENDLY[row.tier],
    scoreBand: AUTHORITY_TIER_SCORE_BAND[row.tier],
    why,
    recommendations,
  };
}

export function filterRowsByTier<T extends { tier: AuthorityTier }>(
  rows: T[],
  tier: AuthorityTier | null | undefined,
): T[] {
  if (!tier) return rows;
  return rows.filter((row) => row.tier === tier);
}
