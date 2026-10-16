import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, before, describe, it } from "node:test";
import { revisionChanges } from "./revision-summary";
import { pngSize, prepareReplacement, replacementProblems, replacementTarget, replacementTransition, webpSize } from "./image-replacement";
import { readServedBytes, restoreServed, servedSha, writeLive } from "./image-store";

const logo = "assets/brand/healthcare-doctors-woolloongabba-logo.png";
const hero = "assets/hero-final-desktop.webp";
const exterior = "assets/institutional-exterior-consistent.webp";
const publicRoot = path.join(process.cwd(), "public");
let store = "";

before(() => {
  store = fs.mkdtempSync(path.join(os.tmpdir(), "wmc-images-"));
  process.env.IMAGE_STORE_DIR = store;
});

after(() => {
  delete process.env.IMAGE_STORE_DIR;
  if (store) fs.rmSync(store, { recursive: true, force: true });
});

describe("replaceable images", () => {
  it("allows only the logo, hero, exterior, and an existing portrait", () => {
    assert.equal(replacementTarget(logo)?.kind, "logo");
    assert.equal(replacementTarget(hero)?.kind, "hero");
    assert.equal(replacementTarget(exterior)?.kind, "exterior");
    assert.equal(replacementTarget("assets/team/dr-tanya-goodwill.webp")?.thumbPath, "assets/team/dr-tanya-goodwill-640.webp");
    assert.equal(replacementTarget("assets/team/dr-tanya-goodwill-640.webp"), null);
    assert.equal(replacementTarget("assets/brand/agpal-mark.webp"), null);
    assert.equal(replacementTarget("assets/brand/bulk-billing-practice.png"), null);
    assert.equal(replacementTarget("assets/knowledge/article.webp"), null);
  });

  it("rejects a logo that is not the current PNG size", () => {
    const current = fs.readFileSync(path.join(publicRoot, logo));
    const target = replacementTarget(logo);
    assert.ok(target);
    assert.deepEqual(replacementProblems(target, current), []);
    const wrong = Buffer.from(current);
    wrong.writeUInt32BE(10, 16);
    assert.equal(replacementProblems(target, wrong)[0]?.includes("475 by 71"), true);
    assert.equal(pngSize(current)?.width, 475);
  });

  it("rejects a hero that is not the current WebP size", () => {
    const current = fs.readFileSync(path.join(publicRoot, hero));
    const target = replacementTarget(hero);
    assert.ok(target);
    assert.deepEqual(replacementProblems(target, current), []);
    assert.equal(replacementProblems(target, fs.readFileSync(path.join(publicRoot, logo))).length > 0, true);
    assert.equal(webpSize(current)?.width, 1672);
  });

  it("keeps the published file off the original until publish, then rollback restores it", () => {
    const relative = logo;
    const original = fs.readFileSync(path.join(publicRoot, relative));
    const originalSha = servedSha(relative);
    const replacement = Buffer.from(original);
    replacement[replacement.length - 1] ^= 0xff;
    assert.equal(fs.readFileSync(path.join(publicRoot, relative)).equals(original), true);
    const publishedSha = writeLive(relative, replacement);
    assert.equal(servedSha(relative), publishedSha);
    assert.equal(fs.readFileSync(path.join(publicRoot, relative)).equals(original), true);
    assert.equal(readServedBytes(relative).equals(replacement), true);
    restoreServed(relative, originalSha);
    assert.equal(readServedBytes(relative).equals(original), true);
    assert.equal(fs.existsSync(path.join(store, "live", relative)), false);
  });

  it("generates the smaller portrait at the current card size", async () => {
    const target = replacementTarget("assets/team/dr-tanya-goodwill.webp");
    assert.ok(target);
    const full = fs.readFileSync(path.join(publicRoot, "assets/team/dr-tanya-goodwill.webp"));
    const prepared = await prepareReplacement(target, full);
    assert.deepEqual(prepared.problems, []);
    assert.equal(webpSize(prepared.thumb ?? Buffer.alloc(0))?.width, 640);
    assert.equal(webpSize(prepared.thumb ?? Buffer.alloc(0))?.height, 800);
    assert.equal(fs.readFileSync(path.join(publicRoot, "assets/team/dr-tanya-goodwill-640.webp")).equals(prepared.thumb ?? Buffer.alloc(0)), false);
  });

  it("requires draft, review, and approval before publish", () => {
    assert.equal(replacementTransition(null, "publish"), null);
    assert.equal(replacementTransition("drafting", "publish"), null);
    assert.equal(replacementTransition("drafting", "submit"), "clinical_review");
    assert.equal(replacementTransition("clinical_review", "approve"), "approved");
    assert.equal(replacementTransition("approved", "publish"), "published");
  });

  it("describes an image workflow change without a file hash", () => {
    const lines = revisionChanges(
      { replacementStatus: "drafting", proposalSha256: "a".repeat(64), liveSha256: "b".repeat(64) },
      { replacementStatus: "published", proposalSha256: null, liveSha256: "c".repeat(64) },
    );
    assert.equal(lines.some((line) => line.includes("a".repeat(64))), false);
    assert.equal(lines.includes("Image workflow: Draft → Published"), true);
    assert.equal(lines.includes("Published image file changed."), true);
  });
});
