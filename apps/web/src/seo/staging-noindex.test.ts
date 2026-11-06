import assert from "node:assert/strict";
import test from "node:test";
import {
  STAGING_ROBOTS_DIRECTIVE,
  applyStagingNoIndexMeta,
  isStagingNoIndexHost,
  stagingRobotsTxt,
  stagingSitemapXml,
} from "./staging-noindex";

const previous = {
  staging: process.env.STAGING_NOINDEX,
  uat: process.env.UAT_QUICK_TUNNEL,
};

test.afterEach(() => {
  if (previous.staging === undefined) delete process.env.STAGING_NOINDEX;
  else process.env.STAGING_NOINDEX = previous.staging;
  if (previous.uat === undefined) delete process.env.UAT_QUICK_TUNNEL;
  else process.env.UAT_QUICK_TUNNEL = previous.uat;
});

test("hostingersite.com and STAGING_NOINDEX force staging noindex", () => {
  delete process.env.STAGING_NOINDEX;
  delete process.env.UAT_QUICK_TUNNEL;
  assert.equal(isStagingNoIndexHost("mediumslateblue-eagle-960503.hostingersite.com"), true);
  assert.equal(isStagingNoIndexHost("gabbamedicalcentre.com.au"), false);
  assert.equal(isStagingNoIndexHost("www.gabbamedicalcentre.com.au"), false);
  process.env.STAGING_NOINDEX = "true";
  assert.equal(isStagingNoIndexHost("gabbamedicalcentre.com.au"), true);
});

test("staging robots.txt disallows all and omits sitemap", () => {
  const body = stagingRobotsTxt();
  assert.match(body, /Disallow:\s*\//);
  assert.equal(body.includes("Sitemap:"), false);
  assert.equal(body.includes("Allow:"), false);
});

test("staging sitemap is an empty urlset", () => {
  assert.match(stagingSitemapXml(), /<urlset[\s\S]*>\s*<\/urlset>/);
  assert.equal(stagingSitemapXml().includes("<loc>"), false);
});

test("applyStagingNoIndexMeta rewrites index,follow and preserves canonical", () => {
  const html = `<!doctype html><html><head>
<link rel="canonical" href="https://gabbamedicalcentre.com.au/services.html"/>
<meta name="robots" content="index,follow,max-image-preview:large"/>
</head><body></body></html>`;
  const next = applyStagingNoIndexMeta(html);
  assert.match(next, new RegExp(`content="${STAGING_ROBOTS_DIRECTIVE}"`));
  assert.match(next, /name="googlebot"/);
  assert.match(next, /rel="canonical" href="https:\/\/gabbamedicalcentre\.com\.au\/services\.html"/);
  assert.equal(next.includes("index,follow"), false);
  assert.equal(applyStagingNoIndexMeta(next), next);
});
