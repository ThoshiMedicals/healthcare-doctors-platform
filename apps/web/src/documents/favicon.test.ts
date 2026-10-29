import assert from "node:assert/strict";
import test from "node:test";
import { applyFaviconLinks } from "./favicon";

test("replace old Healthcare Doctors favicon references with four standard root icons", () => {
  const html = [
    "<!DOCTYPE html><html><head>",
    '<link href="assets/brand/wmc-brand-mark.webp" rel="icon"/>',
    '<link href="assets/brand/wmc-brand-mark.webp" rel="apple-touch-icon"/>',
    '<title>Woolloongabba Medical Centre</title>',
    '<link href="styles.css" rel="stylesheet"/>',
    "</head><body>Patient information</body></html>",
  ].join("\n");

  const output = applyFaviconLinks(html);
  assert.ok(!output.includes("wmc-brand-mark.webp"));
  assert.equal((output.match(/rel="icon"/g) || []).length, 3);
  assert.equal((output.match(/rel="apple-touch-icon"/g) || []).length, 1);
  for (const filename of ["favicon.ico", "favicon-16x16.png", "favicon-32x32.png", "apple-touch-icon.png"]) {
    assert.ok(output.includes(`href="/${filename}?v=wmc-1"`));
  }
  assert.ok(output.includes("<title>Woolloongabba Medical Centre</title>"));
  assert.ok(output.includes('<link href="styles.css" rel="stylesheet"/>'));
  assert.ok(output.includes("<body>Patient information</body>"));
});

test("favicon transform is idempotent and supports pages in nested routes", () => {
  const original = '<html><head><link rel="icon" href="../../assets/brand/wmc-brand-mark.webp"></head><body></body></html>';
  const first = applyFaviconLinks(original);
  assert.equal(applyFaviconLinks(first), first);
  assert.ok(first.includes('href="/favicon.ico?v=wmc-1"'));
  assert.ok(!first.includes("wmc-brand-mark.webp"));
});

test("favicon transform leaves non-document input intact", () => {
  assert.equal(applyFaviconLinks("<p>Sample</p>"), "<p>Sample</p>");
});
