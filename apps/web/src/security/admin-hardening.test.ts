import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { acceptedImage } from "../cms/image-signature";
import {
  ACCOUNT_LOCK_AFTER,
  backoffMs,
  loginLockMessage,
  nextFailureState,
  throttleDecision,
} from "../auth/login-guard";
import { foreignOrigin } from "../auth/same-origin";
import { SESSION_IDLE_MS, SESSION_MAX_AGE_SECONDS, idleExpired } from "../auth/session-policy";
import { visibleModules } from "../cms/modules";
import { fingerprintContent } from "../governance/fingerprint";
import {
  governanceCompletionGaps,
  governanceStatusForRestore,
  parseGovernanceStatus,
} from "../governance/status";

describe("media signatures", () => {
  it("accepts JPEG, PNG, and WebP signatures", () => {
    const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);
    const webp = Buffer.concat([Buffer.from("RIFF"), Buffer.from([0, 0, 0, 0]), Buffer.from("WEBP")]);
    assert.equal(acceptedImage("photo.jpg", jpeg).ok, true);
    assert.equal(acceptedImage("photo.jpeg", jpeg).ok, true);
    assert.equal(acceptedImage("photo.png", png).ok, true);
    assert.equal(acceptedImage("photo.webp", webp).ok, true);
  });

  it("blocks SVG, GIF, BMP, TIFF, and mismatched signatures", () => {
    const svg = Buffer.from("<svg xmlns='http://www.w3.org/2000/svg'><script>alert(1)</script></svg>");
    const gif = Buffer.from("GIF89a");
    const bmp = Buffer.from([0x42, 0x4d, 0x00, 0x00]);
    const tiff = Buffer.from([0x49, 0x49, 0x2a, 0x00]);
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    assert.equal(acceptedImage("icon.svg", svg).ok, false);
    assert.equal(acceptedImage("icon.png", svg).ok, false);
    assert.equal(acceptedImage("anim.gif", gif).ok, false);
    assert.equal(acceptedImage("scan.bmp", bmp).ok, false);
    assert.equal(acceptedImage("scan.tiff", tiff).ok, false);
    assert.equal(acceptedImage("renamed.jpg", png).ok, false);
  });
});

describe("governance completion", () => {
  const fingerprint = fingerprintContent("approved page");

  it("allows only the five governance statuses", () => {
    for (const status of ["draft", "under_review", "approved", "published", "review_due"]) {
      assert.equal(parseGovernanceStatus(status), status);
    }
    assert.equal(parseGovernanceStatus("superseded"), null);
    assert.equal(parseGovernanceStatus("awaiting_review"), null);
    assert.equal(parseGovernanceStatus("anything-else"), null);
  });

  it("requires reviewer, approver, date, fingerprint, and evidence before completion", () => {
    const gaps = governanceCompletionGaps({
      reviewedBy: "",
      approvedBy: null,
      approvedAt: null,
      evidenceReference: "  ",
      fingerprint: "not-a-fingerprint",
    });
    assert.deepEqual(gaps, [
      "Reviewer is required.",
      "Approver is required.",
      "Approval date is required.",
      "Fingerprint is required.",
      "Evidence reference is required.",
    ]);
    assert.deepEqual(
      governanceCompletionGaps({
        reviewedBy: "Dr Lee",
        approvedBy: "Practice Manager",
        approvedAt: new Date("2026-10-13T00:00:00.000Z"),
        evidenceReference: "EV-100",
        fingerprint,
      }),
      [],
    );
  });

  it("does not restore a completed status that is missing evidence", () => {
    assert.equal(
      governanceStatusForRestore("approved", "draft", {
        reviewedBy: "Dr Lee",
        approvedBy: null,
        approvedAt: null,
        evidenceReference: null,
        fingerprint: null,
      }),
      "under_review",
    );
    assert.equal(governanceStatusForRestore("in_review", "draft", emptyEvidence()), "under_review");
  });
});

describe("admin session and request checks", () => {
  it("keeps the session shorter than a day and expires idle sessions", () => {
    assert.ok(SESSION_MAX_AGE_SECONDS <= 8 * 60 * 60);
    assert.equal(idleExpired(Date.now() - SESSION_IDLE_MS - 1, Date.now()), true);
    assert.equal(idleExpired(Date.now(), Date.now()), false);
    assert.equal(idleExpired(null, Date.now()), true);
  });

  it("treats a foreign origin as forbidden", () => {
    assert.equal(foreignOrigin("POST", "https://evil.example", "localhost:3000"), true);
    assert.equal(foreignOrigin("POST", "http://localhost:3000", "localhost:3000"), false);
    assert.equal(foreignOrigin("GET", "https://evil.example", "localhost:3000"), false);
  });
});

describe("login throttle", () => {
  it("backs off after repeated failures and locks the account", () => {
    assert.equal(backoffMs(2), 0);
    assert.equal(backoffMs(3), 1000);
    assert.equal(backoffMs(4), 2000);
    assert.equal(backoffMs(8), 4000);
    const now = 1_000_000;
    let state = null;
    for (let attempt = 0; attempt < ACCOUNT_LOCK_AFTER; attempt += 1) {
      state = nextFailureState(state, now + attempt, ACCOUNT_LOCK_AFTER);
    }
    assert.ok(state);
    const decision = throttleDecision({ now: now + ACCOUNT_LOCK_AFTER, account: state, network: null });
    assert.equal(decision.allowed, false);
    assert.match(loginLockMessage(), /15 minutes/);
  });
});

describe("role menus", () => {
  it("hides settings, governance, and staff-only links from a content editor", () => {
    const labels = visibleModules("content_editor").map((module) => module.label);
    assert.equal(labels.includes("Practitioners"), true);
    assert.equal(labels.includes("Media Library"), false);
    assert.equal(labels.includes("Clinic Settings"), false);
    assert.equal(labels.includes("Governance Review"), false);
    assert.equal(labels.includes("Image governance"), false);
    assert.equal(visibleModules("clinic_admin").some((module) => module.label === "Image governance"), true);
    assert.equal(visibleModules(null).length, 0);
    assert.equal(visibleModules("clinic_admin").some((module) => module.label === "Governance Review"), true);
    assert.equal(visibleModules("clinic_admin").some((module) => module.label === "Clinic Settings"), true);
  });
});

function emptyEvidence() {
  return {
    reviewedBy: null,
    approvedBy: null,
    approvedAt: null,
    evidenceReference: null,
    fingerprint: null,
  };
}
