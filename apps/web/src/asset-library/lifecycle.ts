import type { AttractionAssetKind, AttractionAssetStatus } from "@prisma/client";

export const REVIEW_CADENCE_DAYS: Record<AttractionAssetKind, number> = {
  image: 730, // 24 months
  video: 365,
  transcript: 365,
  quote: 365,
  testimonial_ref: 365,
  consent_document: 365,
  other: 730,
};

export type LifecycleTransition = {
  from: AttractionAssetStatus[];
  to: AttractionAssetStatus;
};

export const LIFECYCLE_TRANSITIONS: Record<string, LifecycleTransition> = {
  submit_for_review: { from: ["captured", "catalogued"], to: "in_review" },
  request_changes: { from: ["in_review", "approved"], to: "catalogued" },
  approve: { from: ["in_review", "review_due"], to: "approved" },
  publish: { from: ["approved"], to: "published" },
  mark_review_due: { from: ["published", "approved"], to: "review_due" },
  retire: { from: ["published", "review_due", "approved"], to: "retired" },
  withdraw: {
    from: ["published", "approved", "in_review", "catalogued", "review_due"],
    to: "withdrawn",
  },
  purge: { from: ["withdrawn", "retired"], to: "purged" },
  replace_placeholder: { from: ["catalogued", "approved", "published", "in_review"], to: "catalogued" },
};

export function cadenceDaysForKind(kind: AttractionAssetKind): number {
  return REVIEW_CADENCE_DAYS[kind] ?? 730;
}

export function nextReviewDate(from: Date, kind: AttractionAssetKind): Date {
  const d = new Date(from);
  d.setUTCDate(d.getUTCDate() + cadenceDaysForKind(kind));
  return d;
}

/** Publish gate: identifiable people need consent; AI placeholders use rightsClass ai_placeholder. */
export function publishBlockedReasons(input: {
  rightsClass: string;
  consentRecordId: string | null;
  altText: string;
  caption: string;
  kind: AttractionAssetKind;
  quoteText?: string | null;
}): string[] {
  const reasons: string[] = [];
  if (!input.altText.trim() && input.kind === "image") {
    reasons.push("altText required for images");
  }
  if (input.kind === "quote" && !input.quoteText?.trim()) {
    reasons.push("quoteText required for quote assets");
  }
  if (
    ["consented_staff", "consented_gp_named"].includes(input.rightsClass) &&
    !input.consentRecordId
  ) {
    reasons.push("consentRecordId required for identifiable people");
  }
  if (!input.caption.trim() && input.kind !== "consent_document") {
    reasons.push("caption required before publish");
  }
  return reasons;
}
