/**
 * Accessibility / installability checks for the one piece of PWA UI this
 * agent owns outright: the static offline fallback shell page served from
 * `public/offline.html` (see cache-policy.ts OFFLINE_FALLBACK_PATH and
 * sw.js). Platform/patient-ux agents own the manifest and any in-app install
 * or "update available" UI; this file only guards what ships here.
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { OFFLINE_FALLBACK_PATH } from "./cache-policy";

const publicDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../public");
const offlinePath = path.join(publicDir, OFFLINE_FALLBACK_PATH);
const html = readFileSync(offlinePath, "utf8");

test("offline.html exists at the exact path cache-policy.ts and sw.js expect", () => {
  assert.ok(existsSync(offlinePath));
});

test("offline.html declares a language and viewport, and has exactly one h1", () => {
  assert.match(html, /<html[^>]*\blang="en(-AU)?"/i);
  assert.match(html, /<meta[^>]*name="viewport"/i);
  const h1s = html.match(/<h1\b/gi) ?? [];
  assert.equal(h1s.length, 1);
});

test("offline.html never references a dynamic API, session, or personalised data", () => {
  assert.doesNotMatch(html, /\/api\//i);
  assert.doesNotMatch(html, /fetch\(/i);
  assert.doesNotMatch(html, /patient|appointment id|booking id/i);
});

function accessibleName(attrs: string, inner: string): string {
  const aria = attrs.match(/\baria-label="([^"]+)"/i)?.[1];
  if (aria) return aria.trim();
  return inner.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

test("every link and button on offline.html has a visible accessible name", () => {
  const anchors = [...html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)];
  const buttons = [...html.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/gi)];
  assert.ok(anchors.length > 0, "expected at least one call-to-action link");
  assert.ok(buttons.length > 0, "expected at least one retry control");
  for (const [, attrs, inner] of [...anchors, ...buttons]) {
    assert.notEqual(accessibleName(attrs, inner), "", `empty accessible name: ${attrs}`);
  }
});

test("offline.html has no focus trap: no positive tabindex, no modal/dialog role, no iframe", () => {
  assert.doesNotMatch(html, /\btabindex="[1-9][0-9]*"/i);
  assert.doesNotMatch(html, /\brole="dialog"/i);
  assert.doesNotMatch(html, /<iframe\b/i);
  assert.doesNotMatch(html, /aria-modal="true"/i);
});

test("offline.html buttons declare an explicit type (no implicit form submit)", () => {
  for (const [, attrs] of html.matchAll(/<button\b([^>]*)>/gi)) {
    assert.match(attrs, /\btype="(button|reset)"/i, attrs);
  }
});

test("offline.html is marked noindex (never meant to be indexed or treated as real content)", () => {
  assert.match(html, /<meta[^>]*name="robots"[^>]*content="[^"]*noindex/i);
});
