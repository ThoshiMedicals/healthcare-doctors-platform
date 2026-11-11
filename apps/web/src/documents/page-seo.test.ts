import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  applyPageSeoToHtml,
  mergeSeoDraftOntoPage,
  validateCanonicalPath,
  validateSeoDraft,
} from "./page-seo";

describe("page SEO administration", () => {
  it("rejects absolute URLs and contradictory robots", () => {
    assert.equal(validateCanonicalPath("https://evil.example/x", "about-us.html").ok, false);
    assert.equal(validateCanonicalPath("about-us.html", "about-us.html").ok, true);
    assert.ok(
      validateSeoDraft(
        { robots: "index,follow,noindex" },
        "about-us.html",
      ).some((problem) => /index and noindex/i.test(problem)),
    );
  });

  it("injects published SEO into HTML head without leaving duplicate titles", () => {
    const html = `<!doctype html><html><head>
<title>Old</title>
<meta name="description" content="Old desc">
<link rel="canonical" href="/old.html">
<meta name="robots" content="index,follow">
</head><body><h1>Hi</h1></body></html>`;
    const next = applyPageSeoToHtml(html, {
      title: "Published Title",
      description: "Published description for patients.",
      canonicalPath: "about-us.html",
      robots: "index,follow,max-image-preview:large",
      indexable: true,
      openGraph: { title: "OG Title", description: "OG Description" },
    });
    assert.equal((next.match(/<title>/gi) ?? []).length, 1);
    assert.match(next, /<title>Published Title<\/title>/);
    assert.match(next, /content="Published description for patients."/);
    assert.match(next, /rel="canonical" href="\/about-us.html"/);
    assert.match(next, /property="og:title" content="OG Title"/);
    assert.match(next, /property="og:description" content="OG Description"/);
  });

  it("forces noindex when page is not indexable", () => {
    const html = `<html><head><title>A</title></head><body></body></html>`;
    const next = applyPageSeoToHtml(html, {
      title: "A",
      description: "B",
      canonicalPath: "x.html",
      robots: "index,follow",
      indexable: false,
      openGraph: null,
    });
    assert.match(next, /name="robots" content="noindex,follow"/);
  });

  it("keeps live SEO until draft is merged for publish", () => {
    const live = {
      title: "Live",
      description: "Live desc",
      canonicalPath: "live.html",
      robots: "index,follow",
      indexable: true,
      openGraph: { title: "Live OG", description: "Live OG desc" },
    };
    const merged = mergeSeoDraftOntoPage(live, {
      title: "Draft Title",
      description: "Draft desc",
      ogTitle: "Draft OG",
    });
    assert.equal(merged.title, "Draft Title");
    assert.equal(merged.description, "Draft desc");
    assert.equal((merged.openGraph as { title: string }).title, "Draft OG");
    assert.equal(live.title, "Live");
  });
});
