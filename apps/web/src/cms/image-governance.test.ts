import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  assetKind,
  displayRecordDate,
  imageGovernanceSnapshot,
  imageUsesFromHtml,
  normalizeAssetPath,
  recordDateStatus,
} from "./image-governance";
import { imageRestoreLabel, imageRevisionPlaces, imageVersionResult } from "./image-revision-view";
import { revisionChanges } from "./revision-summary";

describe("image asset paths", () => {
  it("keeps clinic files as site paths and leaves other hosts intact", () => {
    assert.equal(
      normalizeAssetPath("../assets/team/dr-tanya-goodwill.webp"),
      "assets/team/dr-tanya-goodwill.webp",
    );
    assert.equal(
      normalizeAssetPath("https://gabbamedicalcentre.com.au/assets/brand/healthcare-doctors-woolloongabba-logo.png"),
      "assets/brand/healthcare-doctors-woolloongabba-logo.png",
    );
    assert.equal(
      normalizeAssetPath("https://upload.wikimedia.org/wikipedia/commons/3/3d/The_Gabba_from_Ipswich_Road_2026.jpg"),
      "https://upload.wikimedia.org/wikipedia/commons/3/3d/The_Gabba_from_Ipswich_Road_2026.jpg",
    );
    assert.equal(normalizeAssetPath("data:image/svg+xml,abc"), "");
  });

  it("reads the image, its srcset file, and the page alt text", () => {
    const html = `
      <img alt="Dr Tanya Goodwill" src="../assets/team/dr-tanya-goodwill.webp" srcset="../assets/team/dr-tanya-goodwill-640.webp 640w, ../assets/team/dr-tanya-goodwill.webp 1122w"/>
      <meta property="og:image" content="https://gabbamedicalcentre.com.au/assets/hero-final-desktop.webp"/>
      <meta property="og:image:alt" content="Woolloongabba Medical Centre, Brisbane"/>
    `;
    const uses = imageUsesFromHtml(html, "doctors/dr-tanya-goodwill.html");
    const portrait = uses.find((use) => use.assetPath.endsWith("dr-tanya-goodwill.webp"));
    const thumb = uses.find((use) => use.assetPath.endsWith("dr-tanya-goodwill-640.webp"));
    const hero = uses.find((use) => use.assetPath.endsWith("hero-final-desktop.webp"));
    assert.equal(portrait?.alt, "Dr Tanya Goodwill");
    assert.equal(portrait?.pagePath, "doctors/dr-tanya-goodwill.html");
    assert.equal(thumb?.alt, "Dr Tanya Goodwill");
    assert.equal(hero?.alt, "Woolloongabba Medical Centre, Brisbane");
    assert.equal(assetKind("assets/team/dr-tanya-goodwill.webp"), "Practitioner portrait");
  });
});

describe("image governance records", () => {
  it("stores dates as the calendar day and leaves the public page out of the snapshot", () => {
    const snapshot = imageGovernanceSnapshot({
      uploadedBy: "Reception",
      approvedAt: new Date("2026-10-15T00:00:00.000Z"),
      photographer: "Clinic photographer",
      copyrightOwner: "Woolloongabba Medical Centre",
      expiresAt: new Date("2027-10-15T00:00:00.000Z"),
      altText: "Dr Tanya Goodwill",
      usage: ["doctors/dr-tanya-goodwill.html"],
    });
    assert.equal(snapshot.approvedAt, "2026-10-15");
    assert.equal(snapshot.expiresAt, "2027-10-15");
    assert.equal("storagePath" in snapshot, false);
    assert.equal(displayRecordDate(new Date("2026-10-15T00:00:00.000Z")), "15 Oct 2026");
    assert.equal(recordDateStatus(new Date("2020-01-01T00:00:00.000Z"), new Date("2026-10-15T00:00:00.000Z")), "expired");
  });

  it("describes a copyright change without mentioning the file", () => {
    const lines = revisionChanges(
      { copyrightOwner: null, altText: "Dr Tanya Goodwill", usage: ["index.html"] },
      { copyrightOwner: "Woolloongabba Medical Centre", altText: "Dr Tanya Goodwill", usage: ["index.html"] },
    );
    assert.deepEqual(lines, ["Copyright owner: blank → Woolloongabba Medical Centre"]);
  });
});

describe("image version history labels", () => {
  const review = { replacementStatus: "clinical_review", liveSha256: "old", proposalSha256: "prop" };
  const approved = { replacementStatus: "approved", liveSha256: "old", proposalSha256: "prop" };
  const published = { replacementStatus: "published", liveSha256: "new", proposalSha256: null };

  it("marks the result in use as current and the result before it as previous", () => {
    const places = imageRevisionPlaces(published, [
      { previous: approved, next: published },
      { previous: review, next: approved },
      { previous: { replacementStatus: "drafting", liveSha256: "old", proposalSha256: "prop" }, next: review },
    ]);
    assert.deepEqual(places, ["current", "previous", "older"]);
    assert.equal(imageRestoreLabel("current"), null);
    assert.equal(imageRestoreLabel("previous"), "Return to the previous version");
    assert.equal(imageRestoreLabel("older"), "Use this older version");
  });

  it("keeps a restored result current and marks the replaced result as previous", () => {
    const places = imageRevisionPlaces(approved, [
      { previous: published, next: approved },
      { previous: approved, next: published },
      { previous: review, next: approved },
    ]);
    assert.deepEqual(places, ["current", "previous", "same"]);
    assert.equal(imageRestoreLabel("same"), null);
  });

  it("says whether choosing a version changes the published file", () => {
    assert.deepEqual(imageVersionResult(approved, published), [
      "Workflow: Approved",
      "Published file: different from the website now",
      "Proposed file: kept with this version",
    ]);
    assert.deepEqual(imageVersionResult(published, published), [
      "Workflow: Published",
      "Published file: same as the website now",
      "Proposed file: none",
    ]);
  });
});
