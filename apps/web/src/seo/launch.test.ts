import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { goldenHtmlRoot, listHtmlFiles, webRoot } from "@/importer/golden-root";
import { toStoragePath } from "@/documents/paths";

test("production URLs keep the approved paths and the 404 document", () => {
  assert.equal(toStoragePath(undefined), "index.html");
  assert.equal(toStoragePath(["index.html"]), "index.html");
  assert.equal(toStoragePath(["doctors", "dr-anand-singh.html"]), "doctors/dr-anand-singh.html");
  assert.equal(toStoragePath(["missing.html"]), "missing.html");
});

test("approved sitemap and robots are served unchanged", () => {
  const root = goldenHtmlRoot();
  const published = webRoot();
  for (const file of ["robots.txt", "sitemap.xml"]) {
    const approved = fs.readFileSync(path.join(root, file));
    const served = fs.readFileSync(path.join(published, "public", file));
    assert.equal(approved.equals(served), true, file);
  }
  const robots = fs.readFileSync(path.join(root, "robots.txt"), "utf8");
  assert.equal(robots.includes("Allow: /"), true);
  assert.equal(robots.includes("Sitemap: https://gabbamedicalcentre.com.au/sitemap.xml"), true);
  const sitemap = fs.readFileSync(path.join(root, "sitemap.xml"), "utf8");
  assert.equal(sitemap.includes("404.html"), false);
  assert.equal(sitemap.includes("https://gabbamedicalcentre.com.au/"), true);
  const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  const html = new Set(listHtmlFiles(root).filter((file) => file !== "404.html"));
  const listed = new Set(
    locs.map((url) => {
      const relative = url.replace("https://gabbamedicalcentre.com.au/", "");
      return relative === "" ? "index.html" : relative;
    }),
  );
  const missing = [...html].filter((file) => !listed.has(file)).sort();
  const extra = [...listed].filter((file) => !html.has(file)).sort();
  assert.deepEqual(missing, ["updates/article.html"]);
  assert.deepEqual(extra, []);
});

test("approved pages keep canonicals on the production host, and the 404 page stays out of the index", () => {
  const root = goldenHtmlRoot();
  const missing: string[] = [];
  const offHost: string[] = [];
  for (const file of listHtmlFiles(root)) {
    const html = fs.readFileSync(path.join(root, file), "utf8");
    const canonical = html.match(/<link\b[^>]*rel="canonical"[^>]*>/i)?.[0] ?? "";
    if (!canonical) {
      missing.push(file);
      continue;
    }
    if (!canonical.includes("https://gabbamedicalcentre.com.au/")) offHost.push(file);
  }
  assert.deepEqual(missing, ["404.html"]);
  assert.deepEqual(offHost, []);
  const notFound = fs.readFileSync(path.join(root, "404.html"), "utf8");
  assert.equal(notFound.includes('content="noindex,follow"'), true);
});
