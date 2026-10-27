import assert from "node:assert/strict";
import type { MembershipRole } from "@prisma/client";
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
import { CMS_MODULES, visibleModules, visibleNavGroups, type CmsModule } from "../cms/modules";
import { roleAllows, type CmsAction } from "../auth/permissions";
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

/** Approved navigation contract: literal expectations independent of CMS_MODULES. */
const APPROVED_MODULES = [
  { href: "/admin/pages", label: "Pages", action: "edit", group: "content" },
  { href: "/admin/practitioners", label: "Practitioners", action: "edit", group: "content" },
  { href: "/admin/services", label: "Services", action: "edit", group: "content" },
  { href: "/admin", label: "Practice briefing", action: "manage_settings", group: "insights" },
  { href: "/admin/executive", label: "Website overview", action: "manage_settings", group: "insights" },
  { href: "/admin/digital-reception", label: "Online search", action: "manage_settings", group: "insights" },
  { href: "/admin/practitioner-authority", label: "Doctor profiles", action: "manage_settings", group: "insights" },
  { href: "/admin/service-authority", label: "Service pages", action: "manage_settings", group: "insights" },
  { href: "/admin/conversion-intelligence", label: "Booking journey", action: "manage_settings", group: "insights" },
  { href: "/admin/governance", label: "Content reviews", action: "clinical_signoff", group: "governance" },
  { href: "/admin/governance/management", label: "Review board", action: "clinical_signoff", group: "governance" },
  { href: "/admin/governance/expiry", label: "Review due dates", action: "clinical_signoff", group: "governance" },
  { href: "/admin/image-governance", label: "Image reviews", action: "clinical_signoff", group: "governance" },
] as const satisfies readonly CmsModule[];

const CONTENT_MODULES = APPROVED_MODULES.filter((item) => item.group === "content");
const INSIGHTS_MODULES = APPROVED_MODULES.filter((item) => item.group === "insights");
const GOVERNANCE_MODULES = APPROVED_MODULES.filter((item) => item.group === "governance");

const ALL_ACTIONS: readonly CmsAction[] = [
  "edit", "submit_for_review", "clinical_signoff", "practice_approve",
  "publish", "manage_settings", "create_users", "rollback", "switch_clinic",
];
const EDITOR_ACTIONS: readonly CmsAction[] = ["edit", "submit_for_review"];
const CLINIC_ADMIN_ACTIONS: readonly CmsAction[] = [
  "edit", "submit_for_review", "clinical_signoff", "practice_approve",
  "publish", "manage_settings", "rollback",
];

describe("role menus", () => {
  it("pins the approved labels, hrefs, required actions, and navigation groups", () => {
    assert.deepEqual(CMS_MODULES, APPROVED_MODULES);
    assert.equal(new Set(CMS_MODULES.map((item) => item.href)).size, APPROVED_MODULES.length);
    assert.equal(new Set(CMS_MODULES.map((item) => item.label)).size, APPROVED_MODULES.length);
    assert.equal(CMS_MODULES.every((item) => item.href.startsWith("/admin")), true);
    assert.equal(CMS_MODULES.some((item) => item.href === "/admin/settings"), false);
  });

  it("verifies the roleAllows action matrix independently of module labels", () => {
    const cases: ReadonlyArray<{ role: MembershipRole; allowed: readonly CmsAction[] }> = [
      { role: "super_admin", allowed: ALL_ACTIONS },
      { role: "network_admin", allowed: ALL_ACTIONS },
      { role: "clinic_admin", allowed: CLINIC_ADMIN_ACTIONS },
      { role: "content_editor", allowed: EDITOR_ACTIONS },
      { role: "editor", allowed: EDITOR_ACTIONS },
      { role: "clinical_reviewer", allowed: [] },
      { role: "practice_approver", allowed: [] },
      { role: "publisher", allowed: [] },
    ];
    for (const item of cases) {
      for (const action of ALL_ACTIONS) {
        assert.equal(roleAllows(item.role, action), item.allowed.includes(action), item.role + ": " + action);
      }
    }
    assert.equal(roleAllows("content_editor", "clinical_signoff"), false);
    assert.equal(roleAllows("content_editor", "manage_settings"), false);
    assert.equal(roleAllows("clinic_admin", "create_users"), false);
    assert.equal(roleAllows("super_admin", "create_users"), true);
  });

  it("verifies exact visible href/action contracts for every supported role", () => {
    const cases: ReadonlyArray<{ role: MembershipRole | null; expected: readonly CmsModule[] }> = [
      { role: "super_admin", expected: APPROVED_MODULES },
      { role: "network_admin", expected: APPROVED_MODULES },
      { role: "clinic_admin", expected: APPROVED_MODULES },
      { role: "content_editor", expected: CONTENT_MODULES },
      { role: "editor", expected: CONTENT_MODULES },
      { role: "clinical_reviewer", expected: [] },
      { role: "practice_approver", expected: [] },
      { role: "publisher", expected: [] },
      { role: null, expected: [] },
    ];
    for (const item of cases) {
      const visible = visibleModules(item.role);
      assert.deepEqual(visible, item.expected, "visibleModules(" + item.role + ")");
      if (item.role !== null) {
        for (const module of visible) {
          assert.equal(roleAllows(item.role, module.action), true, item.role + ": " + module.href);
        }
      }
    }
    assert.equal(visibleModules("content_editor").every((item) => item.group === "content"), true);
    assert.equal(visibleModules("clinic_admin").some((item) => item.href === "/admin/image-governance"), true);
  });

  it("preserves content, insights, and governance grouping and restrictions", () => {
    assert.deepEqual(visibleNavGroups("clinic_admin"), [
      { id: "content", label: "Content", modules: CONTENT_MODULES },
      { id: "insights", label: "Insights", modules: INSIGHTS_MODULES },
      { id: "governance", label: "Governance", modules: GOVERNANCE_MODULES },
    ]);
    assert.deepEqual(visibleNavGroups("content_editor"), [
      { id: "content", label: "Content", modules: CONTENT_MODULES },
    ]);
    assert.deepEqual(visibleNavGroups("editor"), visibleNavGroups("content_editor"));
    assert.deepEqual(visibleNavGroups("super_admin"), visibleNavGroups("clinic_admin"));
    assert.deepEqual(visibleNavGroups("network_admin"), visibleNavGroups("clinic_admin"));
    assert.deepEqual(visibleNavGroups("clinical_reviewer"), []);
    assert.deepEqual(visibleNavGroups(null), []);
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
