import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright";

const base = "http://127.0.0.1:3456";
const staging = "https://mediumslateblue-eagle-960503.hostingersite.com";
const widths = [320, 375, 390, 768, 1024, 1280, 1440];
const pages = [
  "about-us/practice-experience.html",
  "about-us/community-catchment.html",
  "about-us/continuity-in-practice.html",
  "about-us/clinical-interests.html",
  "join-our-team/gp-opportunities.html",
  "join-our-team/practice-support.html",
  "join-our-team/registrar-pathway.html",
  "join-our-team/opportunity-pack.html",
  "join-our-team/gp-faq.html",
  "join-our-team/provider-number-readiness.html",
  "join-our-team/dpa-navigator.html",
  "join-our-team/session-planner.html",
];

function slug(p: string) { return p.replace(/\//g, "__"); }

async function measure(page: any, label: string) {
  return page.evaluate((labelInner: string) => {
    const layout = document.querySelector(".page-layout");
    const rail = document.querySelector('[data-ev-journey-nav="true"]');
    const article = document.querySelector(".page-layout article, article.article");
    const ar = article?.getBoundingClientRect();
    const rr = rail?.getBoundingClientRect();
    return {
      label: labelInner,
      articleW: ar ? Math.round(ar.width) : null,
      railW: rr ? Math.round(rr.width) : null,
      railParent: rail?.parentElement?.className || null,
      overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      scrollW: document.documentElement.scrollWidth,
      clientW: document.documentElement.clientWidth,
    };
  }, label);
}

async function main() {
  const outDir = process.argv[2];
  mkdirSync(join(outDir, "screenshots"), { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const results: any[] = [];

  for (const path of pages) {
    for (const w of widths) {
      const context = await browser.newContext({
        viewport: { width: w, height: 900 },
        deviceScaleFactor: 1,
      });
      const page = await context.newPage();
      const fixedUrl = `${base}/${slug(path)}`;
      await page.goto(fixedUrl, { waitUntil: "domcontentloaded", timeout: 60000 });
      await page.waitForTimeout(800);
      const fixed = await measure(page, "fixed");
      const shotName = `fixed_${slug(path)}_${w}.png`;
      if (w === 375 || w === 768 || w === 1280) {
        await page.screenshot({ path: join(outDir, "screenshots", shotName), fullPage: false });
      }
      // staging before at same width (sample subset to save time: 3 pages x key widths already; do all pages at 1280 + 375)
      let stagingM = null as any;
      if (w === 375 || w === 1280) {
        await page.goto(`${staging}/${path}`, { waitUntil: "domcontentloaded", timeout: 60000 });
        await page.waitForTimeout(800);
        stagingM = await measure(page, "staging");
        if (w === 1280 && path.endsWith("gp-opportunities.html")) {
          await page.screenshot({ path: join(outDir, "screenshots", `staging_${slug(path)}_${w}.png`), fullPage: false });
        }
      }
      results.push({ path, width: w, fixed, staging: stagingM });
      await context.close();
    }
  }

  // Standalone patient page quicknav check on homepage-ish contact
  {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();
    await page.emulateMedia({ media: "screen" });
    await page.addInitScript(() => {
      Object.defineProperty(window, "matchMedia", {
        writable: true,
        value: (q: string) => ({
          matches: String(q).includes("display-mode: standalone"),
          media: q,
          onchange: null,
          addListener() {},
          removeListener() {},
          addEventListener() {},
          removeEventListener() {},
          dispatchEvent() { return false; },
        }),
      });
    });
    // Use a fixed recruitment page first - quicknav should stay hidden on HOLD pages
    await page.goto(`${base}/join-our-team__gp-opportunities.html`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(500);
    const recruitQn = await page.evaluate(() => {
      const nav = document.querySelector(".patient-pwa-quicknav");
      if (!nav) return { present: false };
      const cs = getComputedStyle(nav as Element);
      return { present: true, display: cs.display };
    });
    results.push({ path: "standalone-recruit-quicknav", width: 390, recruitQn });
    await context.close();
  }

  // PWA asset checks against static server
  const assets = ["/manifest.webmanifest", "/sw.js", "/offline.html", "/icons/icon-192.png", "/icons/icon-512.png"];
  const assetResults: any[] = [];
  for (const a of assets) {
    const r = await fetch(`${base}${a}`);
    assetResults.push({ path: a, status: r.status, type: r.headers.get("content-type"), len: Number(r.headers.get("content-length") || 0) });
  }

  // HOLD staging checks
  const hold = [] as any[];
  for (const p of ["join-our-team/express-interest.html", "join-our-team/gp-readiness.html", "join-our-team/gp-opportunities.html"]) {
    const r = await fetch(`${staging}/${p}`, { redirect: "manual" as any });
    hold.push({ path: p, status: r.status });
  }

  writeFileSync(join(outDir, "responsive-matrix.json"), JSON.stringify({ results, assetResults, hold }, null, 2));
  console.log(JSON.stringify({ pages: pages.length, widths: widths.length, assetResults, hold, sample: results.filter(r => r.width === 1280).slice(0, 3) }, null, 2));
  await browser.close();
}

main().catch((e) => { console.error(e); process.exit(1); });