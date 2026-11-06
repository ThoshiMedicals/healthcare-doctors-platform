import assert from "node:assert/strict";
import test from "node:test";
import { PRACTICE_EXPERIENCE_HUB_CONTENT } from "./hub-content";
import { renderPracticeExperienceHubHtml } from "./render-hub-html";
import {
  assertNoJobPostingSchema,
  assertPracticeExperienceSchema,
  hiringToneViolations,
} from "./schema-guards";
import { PRACTICE_EXPERIENCE_MODULE_IDS } from "./types";

test("hub content includes all seven approved modules in order", () => {
  const ids = PRACTICE_EXPERIENCE_HUB_CONTENT.modules
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((m) => m.id);
  assert.deepEqual(ids, [...PRACTICE_EXPERIENCE_MODULE_IDS]);
});

test("rendered hub emits MedicalClinic + WebPage and never JobPosting", () => {
  const html = renderPracticeExperienceHubHtml(PRACTICE_EXPERIENCE_HUB_CONTENT);
  assert.equal(assertNoJobPostingSchema(html).length, 0);
  assert.equal(assertPracticeExperienceSchema(html).length, 0);
  assert.match(html, /MedicalClinic/);
  assert.match(html, /"@type":"WebPage"/);
  assert.doesNotMatch(html, /JobPosting/);
  for (const id of PRACTICE_EXPERIENCE_MODULE_IDS) {
    assert.match(html, new RegExp(`data-pe-module="${id}"`));
  }
});

test("placeholder copy avoids hiring-agency tone", () => {
  const blob = JSON.stringify(PRACTICE_EXPERIENCE_HUB_CONTENT);
  assert.equal(hiringToneViolations(blob).length, 0);
  assert.match(blob, /not job advertisements/i);
});
