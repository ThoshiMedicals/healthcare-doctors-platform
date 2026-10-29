import assert from "node:assert/strict";
import test from "node:test";
import { applyFaviconLinks, FAVICON_TAGS } from "./favicon";

const approved = [
  '<link rel="icon" href="/favicon.ico?v=hd-symbol-20261029b" sizes="any">',
  '<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png?v=hd-symbol-20261029b">',
  '<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png?v=hd-symbol-20261029b">',
  '<link rel="apple-touch-icon" href="/apple-touch-icon.png?v=hd-symbol-20261029b">',
].join("\n");

test("serve exactly the requested standard favicon links", () => {
  assert.equal(FAVICON_TAGS, approved);
  const html = [
    '<!DOCTYPE html><html><head>',
    '<link href="assets/brand/wmc-brand-mark.webp" rel="icon"/>',
    '<link href="assets/brand/wmc-brand-mark.webp" rel="apple-touch-icon"/>',
    '<title>Woolloongabba Medical Centre</title>',
    '<link href="styles.css" rel="stylesheet"/>',
    '</head><body>Patient information</body></html>',
  ].join("\n");
  const output = applyFaviconLinks(html);
  assert.ok(!output.includes('wmc-brand-mark.webp'));
  assert.ok(output.includes("v=hd-symbol-20261029b"));
  assert.equal((output.match(/<link rel="icon"/g) || []).length, 3);
  assert.equal((output.match(/rel="apple-touch-icon"/g) || []).length, 1);
  assert.ok(output.includes(approved));
  assert.ok(output.includes('<title>Woolloongabba Medical Centre</title>'));
  assert.ok(output.includes('<link href="styles.css" rel="stylesheet"/>'));
  assert.ok(output.includes('<body>Patient information</body>'));
});

test("replace previous versioned favicon links on nested public pages", () => {
  const source = '<html><head><link rel="icon" href="/favicon.ico?v=hd-symbol-20261029b"><link rel="apple-touch-icon" href="/apple-touch-icon.png?v=hd-symbol-20261029b"></head><body></body></html>';
  const result = applyFaviconLinks(source);
  assert.ok(!result.includes("wmc-1"));
  assert.ok(result.includes(approved));
  assert.equal(applyFaviconLinks(result), result);
});

test("unrelated markup is not changed", () => {
  assert.equal(applyFaviconLinks("<p>Sample</p>"), "<p>Sample</p>");
});
