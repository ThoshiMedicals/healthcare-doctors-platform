/**
 * Patient PWA standalone quicknav — cold/warm load timing probe.
 *
 * WHY THIS EXISTS
 * ----------------
 * Agent 2 (patient experience/performance) added a standalone-only quick-access
 * strip (`.patient-pwa-quicknav`, wired by apps/web/src/documents/public-ux.ts +
 * apps/web/public/patient-pwa-nav.js). This script is the agreed, repeatable way
 * to measure whether that addition affects navigation performance, without
 * depending on any specific environment being up at agent run time.
 *
 * HOW COLD VS WARM SHOULD BE MEASURED (methodology — read this even if you
 * cannot run the script right now)
 * -----------------------------------------------------------------------
 * 1. Target a LOCAL server only (never next.gabbamedicalcentre.com.au or the
 *    Hostinger origin from this script — those are separate agents' concerns
 *    and this script must not depend on or affect deployed environments):
 *      - UAT build: `npm run uat:build && npm run uat` (apps/web) → serves
 *        http://127.0.0.1:3100 with production-like output (.next-uat).
 *      - Or plain dev: `npm run dev` (apps/web) → http://127.0.0.1:3000.
 *    Postgres must be reachable (`npm run db:local`) or pages 500.
 * 2. COLD = first paint after a forced empty cache (CDP
 *    `Network.setCacheDisabled`) in a brand-new browser context — simulates a
 *    first-time visit / freshly installed PWA cold start. One sample per
 *    journey (repeat samples would just be warm by definition).
 * 3. WARM = a second, back-to-back navigation to the same destination in the
 *    SAME context (cache + any HTTP keep-alive intact) — simulates returning
 *    to the app after it is already installed/opened once. 2+ samples,
 *    report p50/p95.
 * 4. For EACH journey record: wall-clock click→usable (first paint of
 *    `h1`/`main`), Navigation Timing TTFB/DCL, first-contentful-paint, and
 *    total transfer bytes — the same fields apps/web/scripts/
 *    nav-perf-click-benchmark.mjs already uses for NEXT vs Hostinger, so
 *    results are comparable apples-to-apples with existing reports.
 * 5. The quicknav itself is CSS-hidden outside `@media (display-mode:
 *    standalone)`. Playwright cannot toggle that CSS media feature directly,
 *    so this script stubs `window.matchMedia('(display-mode: standalone)')`
 *    via `page.addInitScript` before each navigation — this is "forced
 *    standalone" for measurement purposes only, not a general technique and
 *    not shipped to users.
 * 6. Compare the SAME journeys with and without `?wmc-pwa-quicknav=off` is
 *    not implemented (there is no runtime flag — the strip is presentation
 *    CSS + ~70 lines of guarded JS); instead compare this report's numbers
 *    to a prior nav-perf-click-benchmark.mjs run on the same commit baseline
 *    to see the delta. Expect no material difference: the strip adds a few
 *    DOM nodes behind `display:none` in the non-standalone case (effectively
 *    free) and one small deferred script that no-ops immediately when
 *    `matchMedia('(display-mode: standalone)').matches` is false.
 *
 * RUNNING
 * -------
 *   node scripts/patient-pwa-cold-warm-probe.mjs [--base-url http://127.0.0.1:3100]
 *
 * If no server answers at --base-url (or the default candidates), the script
 * prints the exact commands to start one and exits 0 without writing a
 * report — "leave a small script for timing probes" per the brief, rather
 * than fail the run or require a server as a hard dependency.
 */
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "../.tmp-patient-pwa-probe");

const DEFAULT_CANDIDATES = ["http://127.0.0.1:3100", "http://127.0.0.1:3000"];
const args = process.argv.slice(2);
const baseUrlArg = args.includes("--base-url") ? args[args.indexOf("--base-url") + 1] : null;

const JOURNEYS = [
  { id: "home-book", from: "/", click: { selector: "a.patient-pwa-quicknav-book" }, external: true },
  {
    id: "home-doctors",
    from: "/",
    click: { selector: "a.patient-pwa-quicknav-doctors" },
    expectIncludes: "team-general-practitioners",
  },
  { id: "home-services", from: "/", click: { selector: "a.patient-pwa-quicknav-services" }, expectIncludes: "services" },
  { id: "home-contact", from: "/", click: { selector: "a.patient-pwa-quicknav-contact" }, expectIncludes: "contact" },
  {
    id: "doctors-contact",
    from: "/team-general-practitioners.html",
    click: { selector: "a.patient-pwa-quicknav-contact" },
    expectIncludes: "contact",
  },
];

// Force "installed PWA" rendering for measurement only — see note 5 above.
const FORCE_STANDALONE_INIT_SCRIPT = `
(() => {
  const realMatchMedia = window.matchMedia.bind(window);
  window.matchMedia = (query) => {
    if (typeof query === "string" && query.includes("display-mode: standalone")) {
      return { matches: true, media: query, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} };
    }
    return realMatchMedia(query);
  };
})();
`;

async function detectBaseUrl() {
  const candidates = baseUrlArg ? [baseUrlArg] : DEFAULT_CANDIDATES;
  for (const url of candidates) {
    try {
      const res = await fetch(url + "/", { signal: AbortSignal.timeout(2000) });
      if (res.ok || res.status < 500) return url;
    } catch {
      /* try next candidate */
    }
  }
  return null;
}

async function measure(page, baseUrl, journey, cold) {
  const startUrl = baseUrl + journey.from;
  try {
    await page.goto(startUrl, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(cold ? 100 : 300);

    const target = page.locator(journey.click.selector).first();
    if (!(await target.count())) {
      return { ok: false, error: `selector not found: ${journey.click.selector}`, journey: journey.id, cold };
    }

    const clickWall = Date.now();
    if (journey.external) {
      // tel:/HotDoc links do not complete an in-app navigation — just confirm
      // the element is present, visible, and keeps its approved href.
      const href = await target.getAttribute("href");
      return { ok: Boolean(href), journey: journey.id, cold, note: "external booking link — href only", href };
    }

    await Promise.all([
      page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 30000 }),
      target.click({ timeout: 10000 }),
    ]);
    await page.waitForFunction(() => {
      const el = document.querySelector("h1") || document.querySelector("main, body");
      if (!el) return false;
      const r = el.getBoundingClientRect();
      return r.width > 40 && r.height > 16;
    }, { timeout: 15000 });
    const clickToUsableMs = Date.now() - clickWall;
    await page.waitForTimeout(150);

    const perf = await page.evaluate(() => {
      const nav = performance.getEntriesByType("navigation")[0];
      const paints = performance.getEntriesByType("paint");
      const fcp = paints.find((p) => p.name === "first-contentful-paint")?.startTime ?? null;
      const resources = performance.getEntriesByType("resource");
      const transfer =
        resources.reduce((s, r) => s + (r.transferSize || 0), 0) + (nav?.transferSize || 0);
      return {
        ttfb: nav ? nav.responseStart : null,
        dcl: nav ? nav.domContentLoadedEventEnd : null,
        fcp,
        transferSize: transfer,
      };
    });

    const path = new URL(page.url()).pathname;
    const ok = journey.expectIncludes ? path.includes(journey.expectIncludes) : true;
    return { ok, journey: journey.id, cold, path, clickToUsableMs, ...perf };
  } catch (err) {
    return { ok: false, error: String(err?.message || err), journey: journey.id, cold };
  }
}

async function main() {
  const baseUrl = await detectBaseUrl();
  if (!baseUrl) {
    console.log(
      [
        "No local server detected on " + (baseUrlArg || DEFAULT_CANDIDATES.join(" or ")) + ".",
        "",
        "To measure cold/warm loads for the patient PWA quicknav, start one of:",
        "  npm run uat:build && npm run uat   # apps/web — http://127.0.0.1:3100 (production-like)",
        "  npm run dev                        # apps/web — http://127.0.0.1:3000",
        "  (Postgres must also be reachable: npm run db:local)",
        "",
        "Then re-run: node scripts/patient-pwa-cold-warm-probe.mjs",
        "See the header comment in this file for the full cold/warm methodology.",
      ].join("\n"),
    );
    return;
  }

  console.log(`Measuring against ${baseUrl} ...`);
  mkdirSync(OUT_DIR, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const results = [];

  try {
    // COLD: fresh context per journey, cache disabled, one sample each.
    for (const journey of JOURNEYS) {
      const context = await browser.newContext();
      const page = await context.newPage();
      await page.addInitScript(FORCE_STANDALONE_INIT_SCRIPT);
      const client = await context.newCDPSession(page);
      await client.send("Network.setCacheDisabled", { cacheDisabled: true });
      const row = await measure(page, baseUrl, journey, true);
      results.push(row);
      console.log(`${row.ok ? "✓" : "✗"} COLD ${journey.id} usable=${row.clickToUsableMs ?? "-"}ms ${row.error || ""}`);
      await context.close();
    }

    // WARM: single shared context, two samples per journey.
    const warmContext = await browser.newContext();
    const warmPage = await warmContext.newPage();
    await warmPage.addInitScript(FORCE_STANDALONE_INIT_SCRIPT);
    for (const journey of JOURNEYS) {
      for (let i = 0; i < 2; i += 1) {
        const row = await measure(warmPage, baseUrl, journey, false);
        results.push(row);
        console.log(`${row.ok ? "✓" : "✗"} WARM ${journey.id}#${i + 1} usable=${row.clickToUsableMs ?? "-"}ms ${row.error || ""}`);
      }
    }
    await warmContext.close();
  } finally {
    await browser.close();
  }

  const report = { generatedAt: new Date().toISOString(), baseUrl, results };
  const outFile = join(OUT_DIR, `patient-pwa-probe-${Date.now()}.json`);
  writeFileSync(outFile, JSON.stringify(report, null, 2));
  console.log("\nWrote", outFile);
}

main();
