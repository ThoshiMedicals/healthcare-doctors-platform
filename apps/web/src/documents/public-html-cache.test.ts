import assert from "node:assert/strict";
import { test } from "node:test";
import {
  getCachedPublishedRepeats,
  getPublicHtmlCache,
  invalidatePublicHtmlCache,
  resetPublicHtmlCacheForTests,
  setCachedPublishedRepeats,
  setPublicHtmlCache,
} from "./public-html-cache";

test("public HTML cache hits until clinic invalidation", () => {
  resetPublicHtmlCacheForTests();
  setPublicHtmlCache("clinic-a", "index.html", {
    status: 200,
    html: "<html>home</html>",
    path: "index.html",
  });
  const hit = getPublicHtmlCache("clinic-a", "index.html");
  assert.equal(hit?.html, "<html>home</html>");
  assert.equal(hit?.status, 200);

  invalidatePublicHtmlCache("clinic-a");
  assert.equal(getPublicHtmlCache("clinic-a", "index.html"), null);
});

test("invalidation is clinic-scoped", () => {
  resetPublicHtmlCacheForTests();
  setPublicHtmlCache("clinic-a", "team.html", { status: 200, html: "a", path: "team.html" });
  setPublicHtmlCache("clinic-b", "team.html", { status: 200, html: "b", path: "team.html" });
  invalidatePublicHtmlCache("clinic-a");
  assert.equal(getPublicHtmlCache("clinic-a", "team.html"), null);
  assert.equal(getPublicHtmlCache("clinic-b", "team.html")?.html, "b");
});

test("published repeats share clinic generation", () => {
  resetPublicHtmlCacheForTests();
  setCachedPublishedRepeats("clinic-a", [{ pagePath: "services/x.html" }]);
  assert.deepEqual(getCachedPublishedRepeats("clinic-a"), [{ pagePath: "services/x.html" }]);
  invalidatePublicHtmlCache("clinic-a");
  assert.equal(getCachedPublishedRepeats("clinic-a"), null);
});
