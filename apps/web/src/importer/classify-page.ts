import type { ContentCollection, PageTemplate, UpdateCategory } from "@prisma/client";

const SECTION_HUBS = new Set([
  "services.html",
  "team.html",
  "about-us.html",
  "patient-information.html",
  "knowledge/index.html",
  "updates/index.html",
]);

export function classifyPage(relativePath: string): {
  template: PageTemplate;
  collection: ContentCollection | null;
} {
  if (relativePath === "index.html") return { template: "home", collection: null };
  if (relativePath === "404.html") return { template: "not_found", collection: null };
  if (relativePath === "contact.html") return { template: "contact", collection: "practice_information" };
  if (relativePath === "medical-centre-network.html") return { template: "network", collection: "network_location" };
  if (relativePath === "faqs.html") return { template: "practice_page", collection: "faq" };
  if (relativePath.startsWith("doctors/")) return { template: "practitioner", collection: "practitioner" };
  if (relativePath.startsWith("services/")) return { template: "service", collection: "service" };
  if (relativePath.startsWith("team-") || relativePath === "team.html") return { template: "team_hub", collection: null };
  if (relativePath.startsWith("knowledge/articles/")) return { template: "knowledge_article", collection: "knowledge_article" };
  if (relativePath === "knowledge/index.html") return { template: "section_hub", collection: "knowledge_topic" };
  if (relativePath.startsWith("knowledge/")) return { template: "knowledge_topic", collection: "knowledge_topic" };
  if (relativePath.startsWith("updates/")) return { template: "update", collection: "update" };
  if (SECTION_HUBS.has(relativePath)) return { template: "section_hub", collection: "practice_information" };
  return { template: "practice_page", collection: "practice_information" };
}

export function isSectionHub(relativePath: string): boolean {
  return SECTION_HUBS.has(relativePath) || relativePath === "contact.html";
}

const UPDATE_CATEGORIES: Record<string, UpdateCategory> = {
  "Practice Updates": "practice_updates",
  "Patient Education": "patient_education",
  "Service Information": "service_information",
  "Clinical Governance": "clinical_governance",
  "Community Health Information": "community_health_information",
};

export function toUpdateCategory(label: string): UpdateCategory | null {
  return UPDATE_CATEGORIES[label] ?? null;
}

export function textBetween(html: string, pattern: RegExp): string {
  return html.match(pattern)?.[1]?.replace(/<[^>]+>/g, "").trim() ?? "";
}
