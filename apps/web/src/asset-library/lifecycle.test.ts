import { describe, expect, it } from "vitest";
import { LIFECYCLE_TRANSITIONS, publishBlockedReasons } from "./lifecycle";

describe("asset library lifecycle", () => {
  it("allows submit_for_review from catalogued", () => {
    expect(LIFECYCLE_TRANSITIONS.submit_for_review.from).toContain("catalogued");
    expect(LIFECYCLE_TRANSITIONS.submit_for_review.to).toBe("in_review");
  });

  it("blocks publish without alt for images", () => {
    const reasons = publishBlockedReasons({
      rightsClass: "ai_placeholder",
      consentRecordId: null,
      altText: "",
      caption: "cap",
      kind: "image",
    });
    expect(reasons).toContain("altText required for images");
  });

  it("requires consent for consented_staff", () => {
    const reasons = publishBlockedReasons({
      rightsClass: "consented_staff",
      consentRecordId: null,
      altText: "ok",
      caption: "cap",
      kind: "image",
    });
    expect(reasons.some((r) => r.includes("consentRecordId"))).toBe(true);
  });

  it("requires quoteText for quote kind", () => {
    const reasons = publishBlockedReasons({
      rightsClass: "composite_labelled",
      consentRecordId: null,
      altText: "q",
      caption: "cap",
      kind: "quote",
      quoteText: "",
    });
    expect(reasons).toContain("quoteText required for quote assets");
  });
});
