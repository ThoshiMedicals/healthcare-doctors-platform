import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import {
  C1_DEMO_PREFIX,
  DEMO_ANNOUNCEMENTS,
  DEMO_PUBLISHED_INBOX,
  DEMO_PREFERENCE_TOPICS,
  findDemoAnnouncement,
} from "./dummy-data";
import {
  isEngagementC1PrototypeBuildEnabled,
  isEngagementC1PrototypeRequestEnabled,
  isProductionApexHost,
} from "./prototype-gate";

test("C1 demo announcements are labelled and include published inbox items", () => {
  assert.ok(DEMO_ANNOUNCEMENTS.length >= 4);
  for (const row of DEMO_ANNOUNCEMENTS) {
    assert.ok(row.title.includes(C1_DEMO_PREFIX), row.title);
  }
  assert.ok(DEMO_PUBLISHED_INBOX.every((row) => row.status === "published"));
  assert.ok(findDemoAnnouncement("demo-easter-hours"));
});

test("C1 preference topics cover operational and optional promo/education", () => {
  const ids = DEMO_PREFERENCE_TOPICS.map((t) => t.id);
  assert.ok(ids.includes("operational"));
  assert.ok(ids.includes("promotional"));
  assert.ok(DEMO_PREFERENCE_TOPICS.some((t) => t.requiresPromotionalConsent));
});

test("C1 prototype gate blocks production apex unless explicitly enabled", () => {
  assert.equal(isProductionApexHost("gabbamedicalcentre.com.au"), true);
  assert.equal(isProductionApexHost("staging.gabbamedicalcentre.com.au"), false);
  const prev = process.env.WMC_ENGAGEMENT_C1_PROTOTYPE;
  process.env.WMC_ENGAGEMENT_C1_PROTOTYPE = "false";
  assert.equal(isEngagementC1PrototypeRequestEnabled("localhost:3000"), false);
  process.env.WMC_ENGAGEMENT_C1_PROTOTYPE = "true";
  assert.equal(isEngagementC1PrototypeRequestEnabled("gabbamedicalcentre.com.au"), true);
  if (prev === undefined) delete process.env.WMC_ENGAGEMENT_C1_PROTOTYPE;
  else process.env.WMC_ENGAGEMENT_C1_PROTOTYPE = prev;
});

test("C1 build gate respects explicit false", () => {
  const prev = process.env.WMC_ENGAGEMENT_C1_PROTOTYPE;
  process.env.WMC_ENGAGEMENT_C1_PROTOTYPE = "false";
  assert.equal(isEngagementC1PrototypeBuildEnabled(), false);
  if (prev === undefined) delete process.env.WMC_ENGAGEMENT_C1_PROTOTYPE;
  else process.env.WMC_ENGAGEMENT_C1_PROTOTYPE = prev;
});

test("C1 patient/admin UI sources never call Notification.requestPermission or pushManager.subscribe", () => {
  const root = path.join(process.cwd(), "src");
  const files = [
    "engagement-c1/PreferencesClient.tsx",
    "engagement-c1/InboxClient.tsx",
    "engagement-c1/read-state.ts",
    "app/admin/(dashboard)/engagement-lab/announcements/new/create-form.tsx",
    "app/admin/(dashboard)/engagement-lab/announcements/[id]/workflow-actions.tsx",
  ];
  for (const rel of files) {
    const src = fs.readFileSync(path.join(root, rel), "utf8");
    assert.equal(src.includes("Notification.requestPermission"), false, rel);
    assert.equal(src.includes(".requestPermission("), false, rel);
    assert.equal(src.includes("pushManager.subscribe"), false, rel);
    assert.equal(src.includes("from \"web-push\""), false, rel);
    assert.equal(src.includes("from 'web-push'"), false, rel);
  }
});

test("C1 routes exist under isolated /dev and /admin/engagement-lab paths", () => {
  const web = process.cwd();
  for (const rel of [
    "src/app/dev/patient-engagement/inbox/page.tsx",
    "src/app/dev/patient-engagement/preferences/page.tsx",
    "src/app/dev/patient-engagement/eligibility/page.tsx",
    "src/app/admin/(dashboard)/engagement-lab/page.tsx",
    "src/app/admin/(dashboard)/engagement-lab/subscribers/page.tsx",
    "src/app/admin/(dashboard)/engagement-lab/delivery/page.tsx",
    "src/app/admin/(dashboard)/engagement-lab/costs/page.tsx",
  ]) {
    assert.ok(fs.existsSync(path.join(web, rel)), rel);
  }
});
