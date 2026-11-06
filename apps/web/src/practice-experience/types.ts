/**
 * Practice Experience Hub — CMS content models.
 * Derived from docs/proposals/practice-experience-content-pack (approved modules only).
 */

export const PRACTICE_EXPERIENCE_PATH = "about-us/practice-experience.html" as const;

export const PRACTICE_EXPERIENCE_MODULE_IDS = [
  "typical_day",
  "nursing",
  "reception",
  "team_interactions",
  "community",
  "continuity",
  "flexible_sessions",
] as const;

export type PracticeExperienceModuleId = (typeof PRACTICE_EXPERIENCE_MODULE_IDS)[number];

export type PracticeExperienceBlockType =
  | "timeline"
  | "bullets"
  | "callout"
  | "vignette"
  | "example"
  | "media_slot";

export type PracticeExperienceBlock = {
  id: string;
  type: PracticeExperienceBlockType;
  heading: string;
  points: string[];
};

export type PracticeExperienceMedia = {
  src: string;
  alt: string;
  /** AI placeholder | consented still | pending shoot */
  kind: "ai_placeholder" | "consented_still" | "pending";
  assetRef?: string;
  caption?: string;
};

export type PracticeExperiencePullQuote = {
  id: string;
  text: string;
  attribution: string;
  /** Testimonial framework: composite vs consented voice */
  voice: "composite_placeholder" | "consented";
};

export type PracticeExperienceModule = {
  id: PracticeExperienceModuleId;
  label: string;
  hubTitle: string;
  order: number;
  anchor: string;
  lede: string;
  blocks: PracticeExperienceBlock[];
  media: PracticeExperienceMedia;
  pullQuote: PracticeExperiencePullQuote;
  internalLinks: ReadonlyArray<{ href: string; label: string }>;
};

export type PracticeExperienceHubContent = {
  id: "wmc-practice-experience-hub";
  version: string;
  path: typeof PRACTICE_EXPERIENCE_PATH;
  title: string;
  metaDescription: string;
  h1: string;
  lede: string;
  honestyLine: string;
  modules: PracticeExperienceModule[];
};
