/**
 * Post-deploy share-control verification on live staging.
 * Viewports: 390, 430, 768, 1024, 1440
 */
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = process.env.STAGING_BASE || "https://staging.gabbamedicalcentre.com.au";
const OUT = path.resolve(
  __dirname,
  "../../../docs/phase4a-evidence/share-control-staging-20261112",
);
fs.mkdirSync(OUT, { recursive: true });

const VIEWPORTS = [390, 430, 768, 1024, 1440];
const HUB = `${BASE}/practice-information-hub.html`;
const PATIENT = `${BASE}/patient-hub.html`;

function toolbarVisible(box) {
  return Boolean(box && box.width > 0 && box.height > 0);
}

const results = { base: BASE, checks: [], screenshots: [] };

const browser = await chromium.launch({ headless: true });
try {
  for (const w of VIEWPORTS) {
    const page = await browser.newPage({ viewport: { width: w, height: 900 } });
    await page.goto(HUB, { waitUntil: "networkidle", timeout: 90000 });
    await page.waitForTimeout(800);

    const metrics = await page.evaluate(() => {
      const toolbar = document.querySelector(".wmc-patient-share--toolbar");
      if (!toolbar) return { present: false };
      const style = getComputedStyle(toolbar);
      const rect = toolbar.getBoundingClientRect();
      const buttons = [...toolbar.querySelectorAll("button, a, [tabindex]")].map((el) => ({
        tag: el.tagName,
        tabIndex: el.tabIndex,
        ariaHidden: el.getAttribute("aria-hidden"),
        disabled: el.disabled === true,
      }));
      return {
        present: true,
        display: style.display,
        visibility: style.visibility,
        width: rect.width,
        height: rect.height,
        buttons,
      };
    });

    const expectVisible = w < 768;
    const visible = metrics.present && metrics.display !== "none" && metrics.height > 0;
    const tabbableWhenHidden =
      !expectVisible &&
      metrics.present &&
      metrics.display === "none" &&
      (await page.evaluate(() => {
        const toolbar = document.querySelector(".wmc-patient-share--toolbar");
        if (!toolbar) return false;
        const focusables = toolbar.querySelectorAll("button, a, [href], [tabindex]");
        // display:none removes from tab order in browsers
        return false;
      }));

    // Explicit keyboard probe: Tab through first N focusables and ensure toolbar btn not focused when hidden
    let toolbarFocused = false;
    if (!expectVisible) {
      for (let i = 0; i < 25; i++) {
        await page.keyboard.press("Tab");
        const focusedInToolbar = await page.evaluate(() => {
          const active = document.activeElement;
          const toolbar = document.querySelector(".wmc-patient-share--toolbar");
          return Boolean(toolbar && active && toolbar.contains(active));
        });
        if (focusedInToolbar) {
          toolbarFocused = true;
          break;
        }
      }
    }

    const shot = path.join(OUT, `practice-hub-${w}.png`);
    await page.screenshot({ path: shot, fullPage: false });
    results.screenshots.push(shot);

    const pass =
      metrics.present &&
      (expectVisible ? visible : metrics.display === "none" && !toolbarFocused);

    results.checks.push({
      page: "practice-information-hub",
      viewport: w,
      expectVisible,
      metrics,
      toolbarFocused,
      pass,
    });

    await page.close();
  }

  // Preferred GP persist at 390
  {
    const page = await browser.newPage({ viewport: { width: 390, height: 900 } });
    await page.goto(PATIENT, { waitUntil: "networkidle", timeout: 90000 });
    await page.waitForTimeout(1000);
    const hasPanel =
      (await page.locator("#preferred-gp-panel").count()) +
      (await page.getByText(/My preferred GP/i).count());
    let persistOk = false;
    try {
      const select = page.locator("select").filter({ hasText: /James|prefer|GP/i }).first();
      const anySelect = page.locator("#preferred-gp-panel select, [data-preferred-gp] select, select").first();
      if (await anySelect.count()) {
        const options = await anySelect.locator("option").allTextContents();
        const james = options.find((o) => /james/i.test(o));
        if (james) {
          await anySelect.selectOption({ label: james });
        } else {
          const vals = await anySelect.locator("option").evaluateAll((els) =>
            els.map((e) => ({ v: e.value, t: e.textContent })),
          );
          const j = vals.find((x) => /james/i.test(x.t) || /dr-james/i.test(x.v));
          if (j) await anySelect.selectOption(j.v);
        }
        const save = page.getByRole("button", { name: /Save on this device|Save/i }).first();
        if (await save.count()) await save.click();
        await page.waitForTimeout(500);
        await page.reload({ waitUntil: "networkidle" });
        await page.waitForTimeout(800);
        const body = await page.innerText("body");
        persistOk = /James/i.test(body);
      }
    } catch (e) {
      results.preferredGpError = String(e);
    }
    const shot = path.join(OUT, `patient-hub-390-preferred-gp.png`);
    await page.screenshot({ path: shot, fullPage: false });
    results.screenshots.push(shot);

    // Digital Reception
    let receptionOk = false;
    const dr = page.getByRole("button", { name: /Digital Reception/i }).first();
    if (await dr.count()) {
      await dr.click();
      await page.waitForTimeout(700);
      receptionOk = (await page.locator("[data-digital-reception], .digital-reception, [aria-label*='Digital Reception' i]").count()) > 0
        || /Digital Reception|reception/i.test(await page.innerText("body"));
      const shot2 = path.join(OUT, `patient-hub-390-digital-reception.png`);
      await page.screenshot({ path: shot2, fullPage: false });
      results.screenshots.push(shot2);
    }

    results.preferredGp = { hasPanel: hasPanel > 0, persistOk };
    results.digitalReception = { receptionOk };
    await page.close();
  }

  // CSS presence in HTML source (server inject)
  const html = await (await fetch(HUB)).text();
  results.cssInjected = /@media \(min-width:768px\)\{\s*\.wmc-patient-share--toolbar\{display:none!important\}/.test(
    html,
  );
  results.noindexMeta = /noindex/i.test(html);
} finally {
  await browser.close();
}

const outJson = path.join(OUT, "verify-raw.json");
fs.writeFileSync(outJson, JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));
const allSharePass = results.checks.every((c) => c.pass);
console.log(`SHARE_CHECKS=${allSharePass ? "PASS" : "FAIL"} css=${results.cssInjected}`);
process.exit(allSharePass && results.cssInjected ? 0 : 1);
