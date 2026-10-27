import type { MembershipRole } from "@prisma/client";

/**
 * Insights Home presentation personas (C4).
 * Presentation / prioritisation only — does not grant or revoke CMS actions.
 */
export type InsightsPersona =
  | "practice_owner"
  | "practice_manager"
  | "governance_lead"
  | "marketing_growth";

export type CommandCentreSectionId = "guidance" | "health" | "trends" | "leaders" | "alerts";
export type HealthCardId = "website_health" | "launch_readiness";
export type TrendKpiId = "booking" | "call" | "contact";
export type LeaderCardId = "search_intents" | "top_practitioner" | "top_service";
export type AlertPanelId = "governance" | "digital_reception" | "conversion";

export const INSIGHTS_PERSONAS: readonly InsightsPersona[] = [
  "practice_owner",
  "practice_manager",
  "governance_lead",
  "marketing_growth",
] as const;

export const INSIGHTS_PERSONA_LABEL: Record<InsightsPersona, string> = {
  practice_owner: "Practice Owner",
  practice_manager: "Practice Manager",
  governance_lead: "Governance Lead",
  marketing_growth: "Marketing / Growth",
};

export type InsightsHomeLayout = {
  persona: InsightsPersona;
  label: string;
  blurb: string;
  sections: CommandCentreSectionId[];
  healthCards: HealthCardId[];
  trendKpis: TrendKpiId[];
  leaderCards: LeaderCardId[];
  alertPanels: AlertPanelId[];
};

/** Map membership role → default Insights Home persona (permissions unchanged). */
export function insightsPersonaFromRole(role: MembershipRole | null | undefined): InsightsPersona {
  if (!role) return "practice_manager";
  if (role === "super_admin" || role === "network_admin") return "practice_owner";
  if (role === "clinical_reviewer" || role === "practice_approver") return "governance_lead";
  if (role === "content_editor" || role === "editor" || role === "publisher") {
    return "marketing_growth";
  }
  return "practice_manager";
}

export function isInsightsPersona(value: string | null | undefined): value is InsightsPersona {
  return !!value && (INSIGHTS_PERSONAS as readonly string[]).includes(value);
}

/**
 * Resolve persona for Insights Home.
 * Optional `persona` query is presentation-only and never changes access.
 */
export function resolveInsightsPersona(
  role: MembershipRole | null | undefined,
  requested?: string | null,
): InsightsPersona {
  if (isInsightsPersona(requested)) return requested;
  return insightsPersonaFromRole(role);
}

export function insightsHomeLayout(persona: InsightsPersona): InsightsHomeLayout {
  const label = INSIGHTS_PERSONA_LABEL[persona];
  switch (persona) {
    case "practice_owner":
      return {
        persona,
        label,
        blurb: "Strategic health and recommended fixes first — then queues that need ownership attention.",
        sections: ["health", "guidance", "alerts", "trends", "leaders"],
        healthCards: ["website_health", "launch_readiness"],
        trendKpis: ["contact", "booking", "call"],
        leaderCards: ["top_practitioner", "top_service", "search_intents"],
        alertPanels: ["governance", "conversion", "digital_reception"],
      };
    case "governance_lead":
      return {
        persona,
        label,
        blurb: "Recommended governance fixes and review queues first — then overall site health.",
        sections: ["guidance", "alerts", "health", "leaders", "trends"],
        healthCards: ["website_health", "launch_readiness"],
        trendKpis: ["contact", "call", "booking"],
        leaderCards: ["search_intents", "top_service", "top_practitioner"],
        alertPanels: ["governance", "digital_reception", "conversion"],
      };
    case "marketing_growth":
      return {
        persona,
        label,
        blurb: "Recommended growth fixes and patient demand first — grow the journeys that convert.",
        sections: ["guidance", "leaders", "trends", "alerts", "health"],
        healthCards: ["website_health", "launch_readiness"],
        trendKpis: ["booking", "contact", "call"],
        leaderCards: ["search_intents", "top_service", "top_practitioner"],
        alertPanels: ["conversion", "digital_reception", "governance"],
      };
    case "practice_manager":
    default:
      return {
        persona: "practice_manager",
        label: INSIGHTS_PERSONA_LABEL.practice_manager,
        blurb: "Recommended actions first — then open queues and demand trends.",
        sections: ["guidance", "alerts", "trends", "health", "leaders"],
        healthCards: ["website_health", "launch_readiness"],
        trendKpis: ["booking", "call", "contact"],
        leaderCards: ["search_intents", "top_practitioner", "top_service"],
        alertPanels: ["governance", "digital_reception", "conversion"],
      };
  }
}
