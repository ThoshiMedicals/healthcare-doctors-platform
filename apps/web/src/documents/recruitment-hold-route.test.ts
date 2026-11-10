import assert from "node:assert/strict";
import test from "node:test";
import {
  canServeRecruitmentPathPublicly,
  listRecruitmentHoldPolicies,
} from "@/importer/recruitment-hold";

const FORM_CHILDREN = [
  "join-our-team/doctor-readiness.html",
  "join-our-team/express-interest.html",
] as const;

const INFORMATIONAL_CHILDREN = [
  "join-our-team/dpa-navigator.html",
  "join-our-team/gp-faq.html",
  "join-our-team/gp-opportunities.html",
  "join-our-team/opportunity-pack.html",
  "join-our-team/practice-support.html",
  "join-our-team/provider-number-readiness.html",
  "join-our-team/registrar-pathway.html",
  "join-our-team/session-planner.html",
] as const;

test("UX-001: form children fail-closed while HOLD is active", () => {
  const env = {};
  assert.equal(process.env.RECRUITMENT_HOLD_LIFTED, undefined);
  for (const path of FORM_CHILDREN) {
    assert.equal(canServeRecruitmentPathPublicly(path, env), false, path);
  }
  assert.equal(canServeRecruitmentPathPublicly("join-our-team.html", env), true);
});

test("UX-001: informational Attraction children may serve under HOLD (noindex)", () => {
  const env = {};
  for (const path of INFORMATIONAL_CHILDREN) {
    assert.equal(canServeRecruitmentPathPublicly(path, env), true, path);
  }
});

test("UX-001: HOLD lift is explicit env only", () => {
  const lifted = { RECRUITMENT_HOLD_LIFTED: "true" };
  for (const path of [...FORM_CHILDREN, ...INFORMATIONAL_CHILDREN]) {
    assert.equal(canServeRecruitmentPathPublicly(path, lifted), true, path);
  }
});

test("UX-001: policy inventory covers hub + ten children", () => {
  const policies = listRecruitmentHoldPolicies();
  assert.equal(policies.length, 11);
  assert.ok(policies.every((p) => p.holdActive));
  assert.equal(
    policies.filter((p) => !p.mayServePublicly).length,
    FORM_CHILDREN.length,
  );
});
