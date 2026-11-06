import type { AttractionDocumentKind, Prisma } from "@prisma/client";
import { ruleSetForKind } from "./schema-rules";

export type SchemaValidationResult = {
  passed: boolean;
  violations: string[];
  ruleSetKey: string;
};

type BodyShape = {
  schemaTypes?: string[];
  metaTitle?: string;
  faqs?: Array<{ question: string; answer: string }>;
  faqPageAnswers?: Array<{ question: string; acceptedAnswer: string }>;
  honestyLine?: string;
  copy?: string;
  consentOnFile?: boolean;
  namedPeople?: boolean;
  assetIds?: string[];
};

function asBody(body: Prisma.JsonValue): BodyShape {
  if (!body || typeof body !== "object" || Array.isArray(body)) return {};
  return body as BodyShape;
}

/**
 * Schema validation hooks for AttractionRevision body JSON.
 * Fail-closed: violations block approve / publish-intent.
 */
export function validateAttractionBody(
  kind: AttractionDocumentKind,
  body: Prisma.JsonValue,
): SchemaValidationResult {
  const rules = ruleSetForKind(kind);
  const data = asBody(body);
  const violations: string[] = [];

  const types = data.schemaTypes ?? [];
  for (const type of types) {
    if (rules.forbiddenTypes.includes(type)) {
      violations.push(`Forbidden schema type: ${type}`);
    }
  }
  if (types.includes("JobPosting") && rules.jobPostingPolicy === "never") {
    violations.push("JobPosting is not allowed on this attraction surface");
  }

  if (data.metaTitle) {
    for (const pattern of rules.metaTitleMustNotMatch) {
      if (pattern.test(data.metaTitle)) {
        violations.push(`Meta title matches forbidden pattern: ${pattern}`);
      }
    }
  }

  if (rules.faqSyncRequired && data.faqs?.length) {
    const schemaAnswers = data.faqPageAnswers ?? [];
    for (const faq of data.faqs) {
      const match = schemaAnswers.find((s) => s.question === faq.question);
      if (!match) {
        violations.push(`FAQPage missing question: ${faq.question}`);
      } else if (match.acceptedAnswer !== faq.answer) {
        violations.push(`FAQ DOM/schema mismatch for: ${faq.question}`);
      }
    }
  }

  const blob = `${data.honestyLine ?? ""} ${data.copy ?? ""}`.toLowerCase();
  for (const hint of rules.requiredHonestyHints) {
    if (hint && !blob.includes(hint.toLowerCase())) {
      // Soft for Phase 1 drafting — only enforce when honestyLine/copy present
      if (data.honestyLine || data.copy) {
        violations.push(`Missing required honesty hint: "${hint}"`);
      }
    }
  }

  if (rules.personVideoPolicy === "consented_optional" && data.namedPeople && !data.consentOnFile) {
    violations.push("Named people require consentOnFile=true (story-capture / asset library)");
  }

  const hiringTone = [
    /talent (community|pipeline|pool)/i,
    /we'?re hiring/i,
    /employer of choice/i,
    /apply now/i,
  ];
  const scan = `${data.metaTitle ?? ""} ${data.copy ?? ""} ${data.honestyLine ?? ""}`;
  for (const re of hiringTone) {
    if (re.test(scan)) violations.push(`Hiring-agency tone detected: ${re}`);
  }

  return {
    passed: violations.length === 0,
    violations,
    ruleSetKey: rules.key,
  };
}
