import type { AttractionDocumentKind, Prisma } from "@prisma/client";
import { PRACTICE_EXPERIENCE_HUB_CONTENT } from "@/practice-experience/hub-content";
import { createAttractionDocument, listAttractionDocuments } from "./documents";

type SeedSpec = {
  kind: AttractionDocumentKind;
  slug: string;
  title: string;
  summary: string;
  surfacePath?: string;
  draftBody: Prisma.InputJsonValue;
  storyCaptureRef?: string;
};

const PHASE1_SEEDS: SeedSpec[] = [
  {
    kind: "opportunities",
    slug: "gp-opportunities",
    title: "GP Opportunities",
    summary: "Employer-brand decision page for GP fit — not a job board.",
    surfacePath: "join-our-team.html#gp-opportunities",
    draftBody: {
      schemaTypes: ["WebPage", "BreadcrumbList", "MedicalClinic"],
      metaTitle: "GP Opportunities | Woolloongabba Medical Centre",
      honestyLine: "Help GPs decide suitability — not a recruitment advertisement.",
      copy: "Practice experience and fit at Woolloongabba Medical Centre.",
      sections: ["decision-hero", "suitability", "decision-faq"],
    },
  },
  {
    kind: "faq",
    slug: "gp-faq",
    title: "GP FAQ",
    summary: "High-intent GP questions synced to FAQPage when published.",
    surfacePath: "join-our-team.html#gp-faq",
    draftBody: {
      schemaTypes: ["FAQPage", "WebPage", "MedicalClinic"],
      metaTitle: "GP FAQ | Woolloongabba Medical Centre",
      faqs: [
        {
          question: "What billing model do GPs work under at Woolloongabba Medical Centre?",
          answer:
            "Commercial arrangements are discussed privately with suitable doctors. We do not publish a public rate card.",
        },
      ],
      faqPageAnswers: [
        {
          question: "What billing model do GPs work under at Woolloongabba Medical Centre?",
          acceptedAnswer:
            "Commercial arrangements are discussed privately with suitable doctors. We do not publish a public rate card.",
        },
      ],
    },
  },
  {
    kind: "practice_experience",
    slug: "hub",
    title: "Practice Experience Hub",
    summary: PRACTICE_EXPERIENCE_HUB_CONTENT.lede,
    surfacePath: PRACTICE_EXPERIENCE_HUB_CONTENT.path,
    draftBody: {
      schemaTypes: ["WebPage", "MedicalClinic", "BreadcrumbList"],
      metaTitle: PRACTICE_EXPERIENCE_HUB_CONTENT.title,
      honestyLine: PRACTICE_EXPERIENCE_HUB_CONTENT.honestyLine,
      copy: PRACTICE_EXPERIENCE_HUB_CONTENT.lede,
      modules: PRACTICE_EXPERIENCE_HUB_CONTENT.modules.map((m) => m.id),
      assetIds: PRACTICE_EXPERIENCE_HUB_CONTENT.modules.map((m) => m.media.assetRef ?? m.id),
    },
  },
  {
    kind: "registrar_pathway",
    slug: "registrar-early-career",
    title: "Registrar & Early Career Pathway",
    summary: "Capacity-based registrar and early-career pathway — not always-open intake.",
    surfacePath: "join-our-team/registrar-early-career-pathway.html",
    draftBody: {
      schemaTypes: ["WebPage", "MedicalClinic", "BreadcrumbList"],
      metaTitle: "Registrar and early-career pathways | Woolloongabba Medical Centre",
      honestyLine:
        "Placements depend on supervisor capacity, rooms and nursing cover. Medicare provider numbers are issued by Services Australia.",
      copy: "Capacity-based pathway honesty for registrars and early-career GPs.",
    },
  },
  {
    kind: "story",
    slug: "inventory-placeholder",
    title: "Story inventory placeholder",
    summary: "Links to Story Capture System — human consent gates required before public reuse.",
    draftBody: {
      schemaTypes: ["Person"],
      metaTitle: "GP practice story (draft)",
      consentOnFile: false,
      namedPeople: false,
      copy: "Placeholder story document — replace via story-capture inventory.",
      format: "pull_quote",
    },
    storyCaptureRef: "gp-story-capture:inventory",
  },
];

/** Idempotent Phase 1 seed — creates missing documents only. */
export async function seedAttractionCmsDefaults(clinicId: string, authorId?: string) {
  const existing = await listAttractionDocuments(clinicId);
  const existingKeys = new Set(existing.map((d) => `${d.kind}:${d.slug}`));
  const created = [];

  for (const spec of PHASE1_SEEDS) {
    const key = `${spec.kind}:${spec.slug}`;
    if (existingKeys.has(key)) continue;
    created.push(
      await createAttractionDocument({
        clinicId,
        kind: spec.kind,
        slug: spec.slug,
        title: spec.title,
        summary: spec.summary,
        surfacePath: spec.surfacePath,
        draftBody: spec.draftBody,
        storyCaptureRef: spec.storyCaptureRef,
        authorId,
      }),
    );
  }

  return { createdCount: created.length, created };
}
