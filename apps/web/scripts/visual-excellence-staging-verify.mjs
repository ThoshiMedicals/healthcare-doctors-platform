/**
 * Post-deploy visual excellence verification (homepage discovery, D2, share).
 */
import { chromium, devices } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = process.env.STAGING_BASE || "https://staging.gabbamedicalcentre.com.au";
const OUT = process.env.EVIDENCE_DIR
  ? path.resolve(process.env.EVIDENCE_DIR)
  : path.resolve(__dirname, "../../../docs/phase4a-evidence/visual-excellence-20261112");
fs.mkdirSync(OUT, { recursive: true });

const VIEWPORTS = [320, 390, 430, 768, 1024, 1440];
const results = { base: BASE, checks: {}, screenshots: [] };

const browser = await chromium.launch({ headless: true });
try {
  // Homepage discovery
  for (const w of [390, 1440]) {
    const page = await browser.newPage({ viewport: { width: w, height: 900 } });
    await page.goto(`${BASE}/`, { waitUntil: "networkidle", timeout: 90000 });
    await page.waitForTimeout(600);
    const hasSection = await page.locator("#patient-app").count();
    const cta = await page.getByRole("link", { name: /Explore the Patient App/i }).count();
    const shot = path.join(OUT, `home-patient-app-${w}.png`);
    if (hasSection) {
      await page.locator("#patient-app").scrollIntoViewIfNeeded();
      await page.waitForTimeout(200);
    }
    await page.screenshot({ path: shot, fullPage: false });
    results.screenshots.push(shot);
    results.checks[`homeDiscovery_${w}`] = { hasSection: hasSection > 0, cta: cta > 0 };
    await page.close();
  }

  // Share control
  for (const w of VIEWPORTS) {
    const page = await browser.newPage({ viewport: { width: w, height: 900 } });
    await page.goto(`${BASE}/practice-information-hub.html`, {
      waitUntil: "networkidle",
      timeout: 90000,
    });
    await page.waitForTimeout(500);
    const metrics = await page.evaluate(() => {
      const el = document.querySelector(".wmc-patient-share--toolbar");
      if (!el) return { present: false };
      const s = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return { present: true, display: s.display, height: r.height, width: r.width };
    });
    const expectVisible = w < 768;
    const pass =
      metrics.present &&
      (expectVisible ? metrics.display !== "none" && metrics.height > 0 : metrics.display === "none");
    const shot = path.join(OUT, `share-practice-hub-${w}.png`);
    await page.screenshot({ path: shot, fullPage: false });
    results.screenshots.push(shot);
    results.checks[`share_${w}`] = { ...metrics, expectVisible, pass };
    await page.close();
  }

  // D2 — iOS overlay must not cover hero when forced visible
  {
    const iPhone = devices["iPhone 13"];
    const context = await browser.newContext({
      ...iPhone,
      userAgent:
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    });
    const page = await context.newPage();
    await page.addInitScript(() => {
      try {
        localStorage.removeItem("wmc.patientInstall.v1.dismissedAt");
        localStorage.removeItem("wmc.patientInstall.v1.iosGuideDismissedAt");
      } catch (_) {}
    });
    await page.goto(`${BASE}/patient-hub.html`, { waitUntil: "networkidle", timeout: 90000 });
    await page.waitForTimeout(1200);
    // Force show if gates blocked (still verify CSS position)
    await page.evaluate(() => {
      const panel = document.getElementById("wmc-ios-install");
      if (panel) panel.hidden = false;
    });
    await page.waitForTimeout(300);
    const geo = await page.evaluate(() => {
      const hero = document.querySelector(".patient-hub-hero h1");
      const panel = document.getElementById("wmc-ios-install");
      if (!hero || !panel) return { ok: false };
      const hs = getComputedStyle(panel);
      const hr = hero.getBoundingClientRect();
      const pr = panel.getBoundingClientRect();
      const heroCovered =
        hs.position === "fixed" &&
        pr.top < hr.bottom &&
        pr.bottom > hr.top &&
        pr.height > window.innerHeight * 0.45;
      return {
        ok: true,
        position: hs.position,
        inline: panel.getAttribute("data-wmc-ios-install-inline"),
        heroTop: hr.top,
        heroBottom: hr.bottom,
        panelTop: pr.top,
        panelBottom: pr.bottom,
        heroCovered,
        heroVisibleInViewport: hr.top >= 0 && hr.bottom <= window.innerHeight + 40,
      };
    });
    const shot = path.join(OUT, `patient-hub-ios-guide-390.png`);
    await page.screenshot({ path: shot, fullPage: false });
    results.screenshots.push(shot);
    const globalTip = await page.evaluate(() => {
      const tip = document.getElementById("wmc-pwa-install-tip");
      if (!tip || tip.hidden) return { present: Boolean(tip), visible: false };
      const s = getComputedStyle(tip);
      const r = tip.getBoundingClientRect();
      return {
        present: true,
        visible: s.display !== "none" && r.height > 0,
        position: s.position,
      };
    });
    results.checks.d2IosOverlay = {
      ...geo,
      globalTip,
      pass:
        geo.ok &&
        geo.position === "static" &&
        geo.inline === "1" &&
        !geo.heroCovered &&
        !globalTip.visible,
    };
    await context.close();
  }

  // Preferred GP + Digital Reception
  {
    const page = await browser.newPage({ viewport: { width: 390, height: 900 } });
    await page.goto(`${BASE}/patient-hub.html`, { waitUntil: "networkidle", timeout: 90000 });
    await page.waitForTimeout(800);
    const hasPanel = (await page.locator("#preferred-gp-panel").count()) > 0;
    let persistOk = false;
    const select = page.locator("#preferred-gp-panel select, select").first();
    if (await select.count()) {
      const vals = await select.locator("option").evaluateAll((els) =>
        els.map((e) => ({ v: e.value, t: e.textContent || "" })),
      );
      const j = vals.find((x) => /james/i.test(x.t) || /dr-james/i.test(x.v));
      if (j?.v) {
        await select.selectOption(j.v);
        const save = page.getByRole("button", { name: /Save/i }).first();
        if (await save.count()) await save.click();
        await page.reload({ waitUntil: "networkidle" });
        await page.waitForTimeout(600);
        persistOk = /James/i.test(await page.innerText("body"));
      }
    }
    const dr = page.getByRole("button", { name: /Digital Reception/i }).first();
    let receptionOk = false;
    if (await dr.count()) {
      await dr.click();
      await page.waitForTimeout(500);
      receptionOk = true;
    }
    results.checks.preferredGp = { hasPanel, persistOk };
    results.checks.digitalReception = { receptionOk };
    await page.screenshot({
      path: path.join(OUT, "patient-hub-390-after.png"),
      fullPage: false,
    });
    await page.close();
  }

  // HTML source checks
  const homeHtml = await (await fetch(`${BASE}/`)).text();
  const hubHtml = await (await fetch(`${BASE}/patient-hub.html`)).text();
  results.checks.source = {
    homeHasPatientApp: /id="patient-app"/.test(homeHtml),
    homeExploreCta: /Explore the Patient App/.test(homeHtml),
    iosInline: /data-wmc-ios-install-inline="1"/.test(hubHtml),
    iosNotFixed: !/#wmc-ios-install\{[^}]*position:\s*fixed/.test(hubHtml),
    shareDesktopHide: /min-width:768px\{\s*\.wmc-patient-share--toolbar\{display:none!important\}/.test(
      hubHtml,
    ) || /min-width:768px\{\s*\.wmc-patient-share--toolbar\{display:none!important\}/.test(
      await (await fetch(`${BASE}/practice-information-hub.html`)).text(),
    ),
  };
} finally {
  await browser.close();
}

fs.writeFileSync(path.join(OUT, "verify-raw.json"), JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));

const sharePass = Object.entries(results.checks)
  .filter(([k]) => k.startsWith("share_"))
  .every(([, v]) => v.pass);
const homePass =
  results.checks.homeDiscovery_390?.hasSection && results.checks.homeDiscovery_390?.cta;
const d2Pass = results.checks.d2IosOverlay?.pass;
const srcPass =
  results.checks.source?.homeHasPatientApp &&
  results.checks.source?.iosInline &&
  results.checks.source?.iosNotFixed;
const ok = sharePass && homePass && d2Pass && srcPass;
console.log(`VERIFY=${ok ? "PASS" : "FAIL"} share=${sharePass} home=${homePass} d2=${d2Pass}`);
process.exit(ok ? 0 : 1);
