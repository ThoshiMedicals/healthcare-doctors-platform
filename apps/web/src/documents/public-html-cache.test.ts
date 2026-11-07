import assert from "node:assert/strict";
import { test } from "node:test";
import {
  clearMemoryPublicHtmlCacheForTests,
  getCachedClinicByHost,
  getCachedPublishedRepeats,
  getPublicHtmlCache,
  invalidatePublicHtmlCache,
  peekPublicHtmlGeneration,
  resetPublicHtmlCacheForTests,
  setCachedClinicByHost,
  setCachedPublishedRepeats,
  setPublicHtmlCache,
  setPublicHtmlCacheIfGeneration,
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
  assert.equal(hit?.source, "memory");

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

test("durable disk snapshot promotes after memory clear", () => {
  resetPublicHtmlCacheForTests();
  setPublicHtmlCache("clinic-disk", "index.html", {
    status: 200,
    html: "<html>durable</html>",
    path: "index.html",
  });
  clearMemoryPublicHtmlCacheForTests();
  const hit = getPublicHtmlCache("clinic-disk", "index.html");
  assert.equal(hit?.source, "disk");
  assert.equal(hit?.html, "<html>durable</html>");
  // Second read should be memory after promotion.
  assert.equal(getPublicHtmlCache("clinic-disk", "index.html")?.source, "memory");
});

test("host clinic cache is durable and cleared on invalidation", () => {
  resetPublicHtmlCacheForTests();
  setCachedClinicByHost("staging.example", { id: "clinic-disk", slug: "woolloongabba" });
  clearMemoryPublicHtmlCacheForTests();
  assert.deepEqual(getCachedClinicByHost("staging.example"), {
    id: "clinic-disk",
    slug: "woolloongabba",
  });
  invalidatePublicHtmlCache("clinic-disk");
  assert.equal(getCachedClinicByHost("staging.example"), undefined);
});

test("in-flight render cannot restore HTML after invalidation", () => {
  resetPublicHtmlCacheForTests();
  const gen = peekPublicHtmlGeneration("clinic-race");
  setPublicHtmlCache("clinic-race", "index.html", {
    status: 200,
    html: "<html>old</html>",
    path: "index.html",
  });
  invalidatePublicHtmlCache("clinic-race");
  const wrote = setPublicHtmlCacheIfGeneration(
    "clinic-race",
    "index.html",
    { status: 200, html: "<html>stale-inflight</html>", path: "index.html" },
    gen,
  );
  assert.equal(wrote, false);
  assert.equal(getPublicHtmlCache("clinic-race", "index.html"), null);
});

test("durable TTL expiry rejects disk snapshots", async () => {
  resetPublicHtmlCacheForTests();
  const prev = process.env.WMC_PUBLIC_HTML_CACHE_TTL_MS;
  process.env.WMC_PUBLIC_HTML_CACHE_TTL_MS = "30";
  try {
    setPublicHtmlCache("clinic-ttl", "index.html", {
      status: 200,
      html: "<html>ttl</html>",
      path: "index.html",
    });
    clearMemoryPublicHtmlCacheForTests();
    await new Promise((r) => setTimeout(r, 50));
    assert.equal(getPublicHtmlCache("clinic-ttl", "index.html"), null);
  } finally {
    if (prev === undefined) delete process.env.WMC_PUBLIC_HTML_CACHE_TTL_MS;
    else process.env.WMC_PUBLIC_HTML_CACHE_TTL_MS = prev;
    resetPublicHtmlCacheForTests();
  }
});
