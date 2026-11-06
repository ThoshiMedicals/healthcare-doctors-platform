import type { AttractionDocumentKind, Prisma } from "@prisma/client";
import { GP_OPPORTUNITIES_BODY } from "./gp-opportunities";
import { GP_FAQ_BODY } from "./gp-faq";
import { PRACTICE_EXPERIENCE_PACK_BODY } from "./practice-experience-pack";
import { CATCHMENT_ANALYSIS_BODY } from "./catchment-analysis";
import { CONTINUITY_NETWORK_BODY } from "./continuity-network";
import { CLINICAL_INTERESTS_BODY } from "./clinical-interests";

export type PublishReadySpec = {
  kind: AttractionDocumentKind;
  slug: string;
  title: string;
  summary: string;
  surfacePath?: string;
  draftBody: Prisma.InputJsonValue;
  storyCaptureRef?: string;
};

export const PUBLISH_READY_SPECS: PublishReadySpec[] = [
  {
    kind: "opportunities",
    slug: "gp-opportunities",
    title: "GP Opportunities",
    summary:
      "Employer-brand decision page for GP suitability — continuity, support, clinical interests; not a job board.",
    surfacePath: "join-our-team.html#gp-opportunities",
    draftBody: GP_OPPORTUNITIES_BODY,
  },
  {
    kind: "faq",
    slug: "gp-faq",
    title: "GP FAQ",
    summary:
      "High-intent GP questions with FAQPage-synced answers — commercial facts only from Recruitment Offer Config.",
    surfacePath: "join-our-team.html#gp-faq",
    draftBody: GP_FAQ_BODY,
  },
  {
    kind: "practice_experience",
    slug: "hub",
    title: "Practice Experience Content Pack",
    summary:
      "Seven-module practice experience pack with synthetic doctor stories and community narratives.",
    surfacePath: "about-us/practice-experience.html",
    draftBody: PRACTICE_EXPERIENCE_PACK_BODY,
  },
  {
    kind: "catchment_analysis",
    slug: "inner-south-catchment",
    title: "Catchment Analysis",
    summary:
      "Qualitative inner-south catchment context for doctors — suburb list from published community pages; no fabricated statistics.",
    surfacePath: "about-us/practice-experience.html#community",
    draftBody: CATCHMENT_ANALYSIS_BODY,
  },
  {
    kind: "continuity_network",
    slug: "local-continuity-network",
    title: "Continuity Network",
    summary:
      "How continuity operates with nearby hospitals, specialists, allied health and community services — workflow map, not a directory.",
    surfacePath: "about-us/practice-experience.html#continuity",
    draftBody: CONTINUITY_NETWORK_BODY,
  },
  {
    kind: "clinical_interests",
    slug: "clinical-interests-framework",
    title: "Clinical Interests Framework",
    summary:
      "Women’s health, mental health, skin and chronic disease — credentials, support, nursing/room impact and growth pathway.",
    surfacePath: "join-our-team.html#clinical-interests",
    draftBody: CLINICAL_INTERESTS_BODY,
  },
];
