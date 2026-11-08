import assert from "node:assert/strict";
import test from "node:test";
import {
  canOperateRecruitmentPublicWorkflows,
  canServeRecruitmentPathPublicly,
  isRecruitmentHoldActive,
  mustNoIndexRecruitmentPath,
} from "@/importer/recruitment-hold";

test("HOLD is active by default", () => {
  assert.equal(isRecruitmentHoldActive({}), true);
  assert.equal(isRecruitmentHoldActive({ RECRUITMENT_HOLD_LIFTED: "true" }), false);
});

test("Attraction child pages are not publicly served under HOLD", () => {
  assert.equal(canServeRecruitmentPathPublicly("join-our-team/express-interest.html", {}), false);
  assert.equal(canServeRecruitmentPathPublicly("join-our-team/gp-opportunities.html", {}), false);
  assert.equal(canServeRecruitmentPathPublicly("join-our-team.html", {}), true);
  assert.equal(canServeRecruitmentPathPublicly("index.html", {}), true);
});

test("join hub must be noindex under HOLD", () => {
  assert.equal(mustNoIndexRecruitmentPath("join-our-team.html", {}), true);
  assert.equal(mustNoIndexRecruitmentPath("index.html", {}), false);
});

test("public recruitment workflows are blocked under HOLD", () => {
  assert.equal(canOperateRecruitmentPublicWorkflows({}), false);
  assert.equal(canOperateRecruitmentPublicWorkflows({ RECRUITMENT_HOLD_LIFTED: "true" }), true);
});

test("lifting HOLD restores serve and index defaults for classified paths", () => {
  const env = { RECRUITMENT_HOLD_LIFTED: "true" };
  assert.equal(canServeRecruitmentPathPublicly("join-our-team/express-interest.html", env), true);
  assert.equal(mustNoIndexRecruitmentPath("join-our-team.html", env), false);
});
