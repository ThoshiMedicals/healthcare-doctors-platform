/**
 * Staging verify + screenshots for owner-approved Patient Hub mobile dashboard.
 * Usage: node scripts/patient-hub-dashboard-staging-verify.mjs
 */
import { chromium, devices } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const BASE =
  process.env.WMC_STAGING_BASE?.replace(/\/$/, "") ||
  "https://staging.gabbamedicalcentre.com.au";
const OUT = path.resolve(
  process.cwd(),
  "../../docs/phase4a-evidence/patient-hub-dashboard-20261112",
);
const WIDTHS = [320, 390, 430, 768, 1024, 1440];

mkdirSync(OUT, { recursive: true });

function score(html) {
  const checks = [
    ["welcome_h1", /Your care, made easier\./i.test(html)],
    ["preferred_gp_mount", /id=["']preferred-gp-panel["']/i.test(html)],
    ["book_action", /Book Appointment/i.test(html)],
    ["dr_primary", /patient-hub-dr-primary/i.test(html)],
    ["find_doctor", /Find a Doctor/i.test(html)],
    ["health_info", /Health Information/i.test(html)],
    ["install_card", /data-wmc-hub-install-card/i.test(html)],
    ["practice_details", /patient-hub-practice-details/i.test(html)],
    ["dashboard_marker", /wmc-patient-hub-dashboard-v1/i.test(html)],
    ["patient_hub_page", /patient-hub-page/i.test(html)],
    ["care_dock", /persistent-care-actions/i.test(html)],
    ["dr_dock_launcher", /digital-reception-launcher/i.test(html)],
    ["no_secondary_band", !/id=["']patient-dashboard-secondary["']/i.test(html)],
    ["preferred_gp_script", /patient-preferred-gp\.js/i.test(html)],
    ["share_preferred_gp", /data-wmc-share-preferred-gp/i.test(html)],
  ];
  return Object.fromEntries(checks);
}

const browser = await chromium.launch({ headless: true });
const results = { base: BASE, capturedAt: new Date().toISOString(), widths: {} };

try {
  const probe = await browser.newContext({
    ...devices["iPhone 13"],
    viewport: { width: 390, height: 844 },
  });
  const page = await probe.newPage();
  const res = await page.goto(`${BASE}/patient-hub.html`, {
    waitUntil: "networkidle",
    timeout: 60000,
  });
  const html = await page.content();
  results.status = res?.status() ?? null;
  results.checks = score(html);
  results.title = await page.title();
  await page.screenshot({
    path: path.join(OUT, "after-390-full.png"),
    fullPage: true,
  });
  await page.screenshot({
    path: path.join(OUT, "after-390-viewport.png"),
  });
  await probe.close();

  for (const width of WIDTHS) {
    const height = width < 768 ? 844 : 900;
    const ctx = await browser.newContext({
      viewport: { width, height },
      deviceScaleFactor: 1,
      isMobile: width < 768,
      hasTouch: width < 768,
      userAgent:
        width < 768
          ? devices["iPhone 13"].userAgent
          : undefined,
    });
    const p = await ctx.newPage();
    await p.goto(`${BASE}/patient-hub.html`, {
      waitUntil: "networkidle",
      timeout: 60000,
    });
    await p.screenshot({
      path: path.join(OUT, `after-${width}-viewport.png`),
    });
    await p.screenshot({
      path: path.join(OUT, `after-${width}-full.png`),
      fullPage: true,
    });
    const bodyPad = await p.evaluate(() => {
      const dock = document.querySelector(".persistent-care-actions");
      const strip = document.querySelector("#practice-info-strip");
      const dockBox = dock?.getBoundingClientRect();
      const stripBox = strip?.getBoundingClientRect();
      return {
        h1: document.querySelector(".patient-hub-hero h1")?.textContent?.trim() || null,
        hasGp: !!document.querySelector("#preferred-gp-panel"),
        actionCount: document.querySelectorAll(".patient-hub-dashboard-actions a").length,
        hasInstall: !!document.querySelector("[data-wmc-hub-install-card]"),
        hasPracticeDetails: !!document.querySelector(".patient-hub-practice-details"),
        dockVisible: !!dock && getComputedStyle(dock).display !== "none",
        stripBottom: stripBox ? stripBox.bottom : null,
        dockTop: dockBox ? dockBox.top : null,
      };
    });
    results.widths[width] = bodyPad;
    await ctx.close();
  }
} finally {
  await browser.close();
}

const reportPath = path.join(OUT, "verify-report.json");
writeFileSync(reportPath, JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));
console.log(`Wrote ${reportPath}`);

const failed = Object.entries(results.checks || {}).filter(([, ok]) => !ok);
process.exit(failed.length ? 1 : 0);
