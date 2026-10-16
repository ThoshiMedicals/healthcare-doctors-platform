import type { ContentCollection, PageTemplate } from "@prisma/client";

export type CmsCollectionKey =
  | "pages"
  | "practitioners"
  | "services"
  | "knowledge"
  | "updates"
  | "faqs"
  | "practice-pages"
  | "media"
  | "navigation"
  | "governance"
  | "editorial"
  | "network";

export type CmsCollection = {
  key: CmsCollectionKey;
  label: string;
  description: string;
  collection: ContentCollection | null;
  template: PageTemplate | null;
  fields: readonly string[];
};

/**
 * CMS collections follow the approved content model.
 * Editors change these fields. The compiler, when enabled, writes them back
 * into the approved templates. Layout is not an editable field.
 */
export const CMS_COLLECTIONS: readonly CmsCollection[] = [
  {
    key: "pages",
    label: "Pages",
    description: "Document records for published HTML. Empty until content migration.",
    collection: null,
    template: null,
    fields: ["path", "template", "title", "description", "robots", "indexable", "status"],
  },
  {
    key: "practitioners",
    label: "Practitioners",
    description: "Team profiles: name, role, biography, qualifications, languages, booking URL, portrait.",
    collection: "practitioner",
    template: "practitioner",
    fields: [
      "name",
      "role",
      "biography",
      "qualifications",
      "languages",
      "areasOfCare",
      "professionalInterests",
      "relatedServices",
      "bookingUrl",
      "portrait",
      "status",
    ],
  },
  {
    key: "services",
    label: "Services",
    description: "Service pages with education sections, FAQs, related practitioners, and review status.",
    collection: "service",
    template: "service",
    fields: [
      "title",
      "summary",
      "patientEducation",
      "whyItMatters",
      "howWeHelp",
      "nextStep",
      "faqs",
      "relatedPractitioners",
      "relatedServices",
      "contentOwner",
      "status",
    ],
  },
  {
    key: "knowledge",
    label: "Knowledge Centre",
    description: "Healthcare authority articles and topic hubs. Not a blog.",
    collection: "knowledge_article",
    template: "knowledge_article",
    fields: [
      "title",
      "category",
      "summary",
      "educationalContent",
      "whenToSeekMedicalAdvice",
      "howGpCanHelp",
      "relatedServices",
      "relatedPractitioners",
      "faqs",
      "trustedSources",
      "seo",
      "contentOwner",
      "status",
    ],
  },
  {
    key: "updates",
    label: "Updates",
    description: "Practice updates across the approved categories.",
    collection: "update",
    template: "update",
    fields: ["title", "category", "summary", "image", "imageAlt", "author", "sections", "audience", "status"],
  },
  {
    key: "faqs",
    label: "FAQs",
    description: "Question and answer records used by FAQ schema.",
    collection: "faq",
    template: null,
    fields: ["category", "question", "answer", "relatedPage", "status"],
  },
  {
    key: "practice-pages",
    label: "Practice information",
    description: "Patient information, about, and governance pages.",
    collection: "practice_information",
    template: "practice_page",
    fields: ["title", "summary", "sections", "relatedPages", "contentOwner", "status"],
  },
  {
    key: "media",
    label: "Media",
    description: "Asset register. Photography approval evidence stays outside the web root.",
    collection: "media",
    template: null,
    fields: ["filename", "assetType", "altText", "subject", "source", "authenticityStatus", "usage"],
  },
  {
    key: "navigation",
    label: "Navigation",
    description: "Primary navigation labels and per-page ownership breadcrumbs.",
    collection: "navigation",
    template: null,
    fields: ["sectionKey", "label", "href", "sortOrder"],
  },
  {
    key: "governance",
    label: "Clinical governance",
    description: "Sign-off records. Only four public fields can ever be rendered.",
    collection: null,
    template: null,
    fields: ["reviewType", "status", "reviewedBy", "contentOwner", "lastReviewed", "nextReview"],
  },
  {
    key: "editorial",
    label: "Editorial calendar",
    description: "Planning records. A calendar row does not publish a page.",
    collection: null,
    template: null,
    fields: ["year", "month", "theme", "primaryCategory", "contentOwner", "dueDate", "status"],
  },
  {
    key: "network",
    label: "Network locations",
    description: "Sibling clinics. External locations stay on their own websites until an approved HTML corpus exists.",
    collection: "network_location",
    template: "network",
    fields: ["clinicName", "suburb", "description", "website", "bookingUrl", "status"],
  },
] as const;

export function getCollection(key: string): CmsCollection | undefined {
  return CMS_COLLECTIONS.find((collection) => collection.key === key);
}
