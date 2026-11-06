import assert from "node:assert/strict";
import test from "node:test";
import { isHumanReviewerId } from "./schema-rules";
import { validateAttractionBody } from "./validate-schema";
import { PRODUCTION_PUBLISH_BLOCKED } from "./documents";
import { publishAttractionDocumentToProduction } from "./approvals";

test("rejects JobPosting on practice experience body", () => {
  const result = validateAttractionBody("practice_experience", {
    schemaTypes: ["WebPage", "MedicalClinic", "JobPosting"],
    honestyLine: "These accounts describe practice experience. They are not job advertisements.",
    copy: "Practice experience at the clinic.",
  });
  assert.equal(result.passed, false);
  assert.ok(result.violations.some((v) => /JobPosting/i.test(v)));
});

test("FAQ DOM must match FAQPage answers", () => {
  const result = validateAttractionBody("faq", {
    schemaTypes: ["FAQPage"],
    faqs: [{ question: "Q?", answer: "A1" }],
    faqPageAnswers: [{ question: "Q?", acceptedAnswer: "A2" }],
  });
  assert.equal(result.passed, false);
  assert.ok(result.violations.some((v) => /mismatch/i.test(v)));
});

test("human reviewer gate forbids system/auto ids", () => {
  assert.equal(isHumanReviewerId("system"), false);
  assert.equal(isHumanReviewerId("auto"), false);
  assert.equal(isHumanReviewerId("user_abc"), true);
});

test("production publish helper always throws Phase 1 block", async () => {
  await assert.rejects(
    () => publishAttractionDocumentToProduction(),
    (err: Error) => err.message === PRODUCTION_PUBLISH_BLOCKED,
  );
});
