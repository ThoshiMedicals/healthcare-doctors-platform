/**
 * Machine-checkable schema rules for GP Attraction CMS Phase 1 surfaces.
 * Aligned to docs/proposals/gp-attraction-content-governance/governance.json
 */

import type { AttractionDocumentKind } from "@prisma/client";

export type AttractionSchemaRuleSet = {
  key: string;
  kind: AttractionDocumentKind;
  surfaceLabel: string;
  allowedTypes: string[];
  forbiddenTypes: string[];
  jobPostingPolicy: "never" | "join_our_team_vacancy_only";
  faqSyncRequired: boolean;
  personVideoPolicy: "none" | "consented_optional";
  metaTitleMustNotMatch: RegExp[];
  requiredHonestyHints: string[];
};

export const ATTRACTION_SCHEMA_RULE_SETS: Record<string, AttractionSchemaRuleSet> = {
  opportunities: {
    key: "opportunities",
    kind: "opportunities",
    surfaceLabel: "GP Opportunities",
    allowedTypes: ["WebPage", "BreadcrumbList", "MedicalClinic", "FAQPage"],
    forbiddenTypes: ["JobPosting", "JobBoard", "EmploymentAgency", "Occupation", "AggregateRating"],
    jobPostingPolicy: "never",
    faqSyncRequired: true,
    personVideoPolicy: "none",
    metaTitleMustNotMatch: [/apply now/i, /we'?re hiring/i, /job board/i],
    requiredHonestyHints: ["suitability", "practice"],
  },
  faq: {
    key: "faq",
    kind: "faq",
    surfaceLabel: "GP FAQ",
    allowedTypes: ["FAQPage", "WebPage", "MedicalClinic", "BreadcrumbList"],
    forbiddenTypes: ["JobPosting", "JobBoard", "EmploymentAgency", "Occupation"],
    jobPostingPolicy: "never",
    faqSyncRequired: true,
    personVideoPolicy: "none",
    metaTitleMustNotMatch: [/apply now/i, /talent pipeline/i],
    requiredHonestyHints: [],
  },
  practice_experience: {
    key: "practice_experience",
    kind: "practice_experience",
    surfaceLabel: "Practice Experience Hub",
    allowedTypes: ["WebPage", "BreadcrumbList", "MedicalClinic", "VideoObject", "Person"],
    forbiddenTypes: ["JobPosting", "JobBoard", "EmploymentAgency", "Occupation", "AggregateRating", "Review"],
    jobPostingPolicy: "never",
    faqSyncRequired: false,
    personVideoPolicy: "consented_optional",
    metaTitleMustNotMatch: [/we'?re hiring/i, /apply now/i],
    requiredHonestyHints: ["not job advertisements", "practice experience"],
  },
  registrar_pathway: {
    key: "registrar_pathway",
    kind: "registrar_pathway",
    surfaceLabel: "Registrar & Early Career Pathway",
    allowedTypes: ["WebPage", "BreadcrumbList", "MedicalClinic", "FAQPage"],
    forbiddenTypes: ["JobPosting", "JobBoard", "EmploymentAgency", "Occupation"],
    jobPostingPolicy: "never",
    faqSyncRequired: true,
    personVideoPolicy: "none",
    metaTitleMustNotMatch: [/always.open/i, /guaranteed placement/i],
    requiredHonestyHints: ["capacity", "Services Australia"],
  },
  story: {
    key: "story",
    kind: "story",
    surfaceLabel: "GP Story / Testimonial",
    allowedTypes: ["WebPage", "Person", "VideoObject", "MedicalClinic"],
    forbiddenTypes: ["JobPosting", "JobBoard", "EmploymentAgency", "AggregateRating", "Review"],
    jobPostingPolicy: "never",
    faqSyncRequired: false,
    personVideoPolicy: "consented_optional",
    metaTitleMustNotMatch: [/best workplace/i, /employer of choice/i],
    requiredHonestyHints: [],
  },
  catchment_analysis: {
    key: "catchment_analysis",
    kind: "catchment_analysis",
    surfaceLabel: "Catchment Analysis",
    allowedTypes: ["WebPage", "BreadcrumbList", "MedicalClinic"],
    forbiddenTypes: ["JobPosting", "JobBoard", "EmploymentAgency", "Occupation", "AggregateRating", "Review"],
    jobPostingPolicy: "never",
    faqSyncRequired: false,
    personVideoPolicy: "none",
    metaTitleMustNotMatch: [/we'?re hiring/i, /apply now/i, /#1 catchment/i],
    requiredHonestyHints: ["qualitative", "fabricated"],
  },
  continuity_network: {
    key: "continuity_network",
    kind: "continuity_network",
    surfaceLabel: "Continuity Network",
    allowedTypes: ["WebPage", "BreadcrumbList", "MedicalClinic"],
    forbiddenTypes: ["JobPosting", "JobBoard", "EmploymentAgency", "Occupation", "AggregateRating", "Review"],
    jobPostingPolicy: "never",
    faqSyncRequired: false,
    personVideoPolicy: "none",
    metaTitleMustNotMatch: [/we'?re hiring/i, /preferred provider/i],
    requiredHonestyHints: ["continuity", "marketplace"],
  },
  clinical_interests: {
    key: "clinical_interests",
    kind: "clinical_interests",
    surfaceLabel: "Clinical Interests Framework",
    allowedTypes: ["WebPage", "BreadcrumbList", "MedicalClinic"],
    forbiddenTypes: ["JobPosting", "JobBoard", "EmploymentAgency", "Occupation", "AggregateRating", "Review"],
    jobPostingPolicy: "never",
    faqSyncRequired: false,
    personVideoPolicy: "none",
    metaTitleMustNotMatch: [/we'?re hiring/i, /specialty clinic franchise/i],
    requiredHonestyHints: ["general practice", "marketplace"],
  },
};

export function ruleSetForKind(kind: AttractionDocumentKind): AttractionSchemaRuleSet {
  const set = ATTRACTION_SCHEMA_RULE_SETS[kind];
  if (!set) throw new Error(`No schema rule set for kind: ${kind}`);
  return set;
}

export const FORBIDDEN_AUTO_APPROVER_IDS = new Set([
  "system",
  "auto",
  "bot",
  "automation",
  "ci",
  "n/a",
  "na",
]);

export function isHumanReviewerId(reviewerId: string): boolean {
  const normalized = reviewerId.trim().toLowerCase();
  if (!normalized) return false;
  if (FORBIDDEN_AUTO_APPROVER_IDS.has(normalized)) return false;
  return true;
}
