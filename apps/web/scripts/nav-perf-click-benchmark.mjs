/**
 * Real browser click-navigation benchmark: NEXT vs Hostinger.
 * Wall-clock click → usable content (h1/main visible). Also records Navigation Timing
 * TTFB/DCL/FCP, transfer size, x-wmc-cache / Server-Timing on the document response.
 */
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "../.tmp-nav-perf");
mkdirSync(OUT, { recursive: true });

const NEXT = "https://next.gabbamedicalcentre.com.au";
const HOST = "https://mediumslateblue-eagle-960503.hostingersite.com";

const args = new Set(process.argv.slice(2));
const cold = args.has("--cold");
const hostingerOnly = args.has("--hostinger-only");
const nextOnly = args.has("--next-only");
const tag = args.has("--tag") ? process.argv[process.argv.indexOf("--tag") + 1] : cold ? "cold" : "warm";

const VIEWPORTS = {
  desktop: { width: 1440, height: 900 },
  mobile: { width: 390, height: 844, isMobile: true, hasTouch: true },
};

const JOURNEYS = [
  { id: "home-services", from: "/", click: { hrefEnds: "services.html" }, expectIncludes: "services" },
  { id: "services-service", from: "/services.html", click: { hrefIncludes: "services/" }, expectIncludes: "/services/" },
  { id: "services-home", from: "/services.html", click: { logo: true }, expectPath: "/" },
  { id: "home-team", from: "/", click: { hrefEnds: "team.html" }, expectIncludes: "team" },
  { id: "team-practitioner", from: "/team.html", click: { hrefIncludes: "doctors/" }, expectIncludes: "/doctors/" },
  {
    id: "practitioner-service",
    from: "/doctors/dr-tanya-goodwill.html",
    click: { hrefIncludes: "services/" },
    expectIncludes: "/services/",
  },
  { id: "home-knowledge", from: "/", click: { hrefIncludes: "knowledge" }, expectIncludes: "knowledge" },
  {
    id: "knowledge-article",
    from: "/knowledge/womens-health.html",
    click: { hrefIncludes: "updates/" },
    expectIncludes: "/updates/",
  },
  { id: "home-join", from: "/", click: { hrefEnds: "join-our-team.html" }, expectIncludes: "join-our-team" },
  {
    id: "join-gp",
    from: "/join-our-team.html",
    click: { hrefIncludes: "gp-opportunities" },
    expectIncludes: "gp-opportunities",
  },
  { id: "contact-home", from: "/contact.html", click: { logo: true }, expectPath: "/" },
];

function percentile(sorted, p) {
  if (!sorted.length) return null;
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[idx];
}

function summarize(rows, key) {
  const vals = rows
    .map((r) => r[key])
    .filter((n) => typeof n === "number" && Number.isFinite(n))
    .sort((a, b) => a - b);
  return {
    n: vals.length,
    p50: percentile(vals, 50),
    p95: percentile(vals, 95),
    min: vals[0] ?? null,
    max: vals[vals.length - 1] ?? null,
  };
}

async function findClickable(page, click) {
  if (click.logo) {
    const candidates = [
      'a.brand, a.logo, .site-brand a, header .brand a',
      'header a[href="/"]',
      'a[href="/"]',
      'a[href="index.html"]',
      'a[href="./"]',
    ];
    for (const sel of candidates) {
      const loc = page.locator(sel).first();
      if (await loc.count()) return loc;
    }
  }
  if (click.hrefEnds) {
    const loc = page.locator(`a[href$="${click.hrefEnds}"]`).first();
    if (await loc.count()) return loc;
  }
  if (click.hrefIncludes) {
    const loc = page.locator(`a[href*="${click.hrefIncludes}"]`).first();
    if (await loc.count()) return loc;
  }
  return null;
}

async function measureClickNav(page, origin, journey, label) {
  const startUrl = origin + journey.from;
  const docMeta = { cache: null, serverTiming: null, status: null, cacheControl: null };

  const onResponse = (res) => {
    try {
      if (res.request().resourceType() !== "document") return;
      if (!res.url().startsWith(origin)) return;
      const h = res.headers();
      docMeta.cache = h["x-wmc-cache"] || null;
      docMeta.serverTiming = h["server-timing"] || null;
      docMeta.cacheControl = h["cache-control"] || null;
      docMeta.status = res.status();
    } catch {
      /* ignore */
    }
  };
  page.on("response", onResponse);

  try {
    await page.goto(startUrl, { waitUntil: "domcontentloaded", timeout: 90000 });
    await page.waitForTimeout(cold ? 100 : 350);

    // Open mobile menu if needed for header links
    const menu = page.locator(
      'button.nav-toggle, button.menu-toggle, [aria-label*="Menu" i], .nav-toggle, #nav-toggle',
    ).first();
    if (await menu.count()) {
      const expanded = await menu.getAttribute("aria-expanded");
      if (expanded !== "true") {
        await menu.click({ timeout: 3000 }).catch(() => {});
        await page.waitForTimeout(150);
      }
    }

    const target = await findClickable(page, journey.click);
    if (!target) {
      return { ok: false, error: "click target not found", journey: journey.id, label, origin };
    }
    await target.scrollIntoViewIfNeeded().catch(() => {});

    const clickWall = Date.now();
    await Promise.all([
      page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 90000 }),
      target.click({ timeout: 15000 }),
    ]);

    await page.waitForFunction(() => {
      const h1 = document.querySelector("h1");
      const main = document.querySelector("main, .page-content, .content, body");
      const el = h1 || main;
      if (!el) return false;
      const r = el.getBoundingClientRect();
      return r.width > 40 && r.height > 16;
    }, { timeout: 30000 });

    const clickToUsableMs = Date.now() - clickWall;

    // Brief settle for FCP/LCP entries (not included in usable wall)
    await page.waitForTimeout(250);

    const perf = await page.evaluate(() => {
      const nav = performance.getEntriesByType("navigation")[0];
      const paints = performance.getEntriesByType("paint");
      const fcp = paints.find((p) => p.name === "first-contentful-paint")?.startTime ?? null;
      let lcp = null;
      try {
        const lcpEntries = performance.getEntriesByType("largest-contentful-paint");
        if (lcpEntries?.length) lcp = lcpEntries[lcpEntries.length - 1].startTime;
      } catch {
        /* */
      }
      const resources = performance.getEntriesByType("resource");
      const transfer =
        resources.reduce((s, r) => s + (r.transferSize || 0), 0) + (nav?.transferSize || 0);
      return {
        ttfb: nav ? nav.responseStart : null,
        dcl: nav ? nav.domContentLoadedEventEnd : null,
        load: nav ? nav.loadEventEnd : null,
        fcp,
        lcp,
        transferSize: transfer,
        encodedBodySize:
          resources.reduce((s, r) => s + (r.encodedBodySize || 0), 0) + (nav?.encodedBodySize || 0),
      };
    });

    const pathName = new URL(page.url()).pathname || "/";
    let pathOk = true;
    if (journey.expectPath) pathOk = pathName === journey.expectPath || pathName === "/index.html";
    if (journey.expectIncludes) pathOk = pathName.includes(journey.expectIncludes);

    return {
      ok: pathOk,
      error: pathOk ? undefined : `unexpected path ${pathName}`,
      journey: journey.id,
      label,
      origin,
      path: pathName,
      clickToUsableMs,
      ...perf,
      xWmcCache: docMeta.cache,
      serverTiming: docMeta.serverTiming,
      cacheControl: docMeta.cacheControl,
      status: docMeta.status,
      cold,
    };
  } catch (err) {
    return {
      ok: false,
      error: String(err?.message || err),
      journey: journey.id,
      label,
      origin,
      xWmcCache: docMeta.cache,
      serverTiming: docMeta.serverTiming,
    };
  } finally {
    page.off("response", onResponse);
  }
}

async function runSite(browser, name, origin, viewportName) {
  const context = await browser.newContext({
    ...VIEWPORTS[viewportName],
    locale: "en-AU",
    timezoneId: "Australia/Brisbane",
  });
  const page = await context.newPage();
  if (cold) {
    const client = await context.newCDPSession(page);
    await client.send("Network.setCacheDisabled", { cacheDisabled: true });
  }

  const results = [];
  for (const journey of JOURNEYS) {
    const samples = cold ? 1 : 2;
    for (let i = 0; i < samples; i += 1) {
      const row = await measureClickNav(page, origin, journey, `${name}:${viewportName}#${i + 1}`);
      results.push(row);
      process.stdout.write(
        `${row.ok ? "✓" : "✗"} ${name} ${viewportName} ${journey.id} usable=${row.clickToUsableMs ?? "-"}ms ttfb=${row.ttfb != null ? Math.round(row.ttfb) : "-"} cache=${row.xWmcCache ?? "-"} xfer=${row.transferSize ?? "-"} ${row.error || ""}\n`,
      );
    }
  }
  await context.close();
  return results;
}

function rollup(results, which) {
  const needle = which === "host" ? "hostinger" : "next.";
  const ok = results.filter((r) => r.ok && r.origin.includes(needle));
  return {
    site: which,
    usable: summarize(ok, "clickToUsableMs"),
    ttfb: summarize(ok, "ttfb"),
    dcl: summarize(ok, "dcl"),
    fcp: summarize(ok, "fcp"),
    lcp: summarize(ok, "lcp"),
    transfer: summarize(ok, "transferSize"),
    cacheHits: ok.filter((r) => r.xWmcCache === "HIT").length,
    cacheMiss: ok.filter((r) => r.xWmcCache === "MISS").length,
    errors: results.filter((r) => !r.ok && r.origin.includes(needle)).length,
  };
}

const browser = await chromium.launch({ headless: true });
const all = [];
try {
  for (const vp of ["desktop", "mobile"]) {
    if (!hostingerOnly) all.push(...(await runSite(browser, "NEXT", NEXT, vp)));
    if (!nextOnly) all.push(...(await runSite(browser, "HOST", HOST, vp)));
  }
} finally {
  await browser.close();
}

const report = {
  generatedAt: new Date().toISOString(),
  cold,
  tag,
  tipNote: "baseline fedafac / after optimisations",
  rollup: { next: rollup(all, "next"), host: rollup(all, "host") },
  results: all,
};

const outFile = join(OUT, `click-benchmark-${tag}.json`);
writeFileSync(outFile, JSON.stringify(report, null, 2));
console.log("\n=== ROLLUP ===");
console.log(JSON.stringify(report.rollup, null, 2));
console.log("Wrote", outFile);
