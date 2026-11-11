import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { ensureUnifiedRecruitmentJourneyNav } from "../src/attraction-cms/ensure-journey-nav";
import { applyPwaMeta } from "../src/documents/pwa-meta";
import { applyPublicUxRefinements } from "../src/documents/public-ux";

const STAGING = "https://mediumslateblue-eagle-960503.hostingersite.com";
const paths = [
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
] as const;

async function main() {
  const ev = process.argv[2];
  if (!ev) throw new Error("evidence dir required");
  const beforeDir = join(ev, "fixtures-staging-raw");
  const fixedDir = join(ev, "fixtures-fixed");
  mkdirSync(beforeDir, { recursive: true });
  mkdirSync(fixedDir, { recursive: true });

  const results: Array<Record<string, unknown>> = [];
  for (const path of paths) {
    const url = `${STAGING}/${path}`;
    const res = await fetch(url, { redirect: "follow" });
    const raw = await res.text();
    const slug = path.replace(/\//g, "__");
    writeFileSync(join(beforeDir, slug), raw);
    let html = ensureUnifiedRecruitmentJourneyNav(raw, path);
    html = applyPublicUxRefinements(html, path);
    html = applyPwaMeta(html);
    html = html.replace(/<head([^>]*)>/i, `<head$1><base href="${STAGING}/">`);
    writeFileSync(join(fixedDir, slug), html);
    results.push({
      path,
      status: res.status,
      railFirst: /page-layout[^>]*>\s*<aside[^>]*data-ev-journey-nav="true"/i.test(html),
      articleAfter: /data-ev-journey-nav="true"[\s\S]*<article\b/i.test(html),
      hasManifest: /rel="manifest"/i.test(html),
      hasSw: /serviceWorker\.register\(\s*["']\/sw\.js["']/i.test(html),
      hasQuickNav: /patient-pwa-quicknav/i.test(html),
      bytes: html.length,
    });
  }
  writeFileSync(join(ev, "fixture-transform-matrix.json"), JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
