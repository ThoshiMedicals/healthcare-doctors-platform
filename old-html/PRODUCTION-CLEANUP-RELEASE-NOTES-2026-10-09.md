# Woolloongabba Medical Centre — Production Cleanup & Regression-Safe Optimisation

**Release date:** 9 October 2026  
**Source:** Practitioner-Specific HotDoc Booking Optimised 2026-10-09 ZIP  
**Approval scope:** Stability, deployment hygiene, fragment-anchor repair, SEO metadata correction and lazy Digital Reception index. No homepage, CSS, visual styling or clinical-body changes.

## Implemented changes

1. **On-page navigation:** Corrected 20 invalid fragment links on 10 topic hubs (ADHD, cough, diabetes, headache, heart, menopause, pain, pregnancy, sleep and weight). Links now point to existing `#about-this-topic` and `#related-care` targets. The old generic label was changed to the accurate short navigation label, “About this topic”. No clinical article prose was altered.
2. **Safe deployment cleanup:** Archived the exact original `styles.css.bak_hero_gap`, `styles.css.bak_logo_prominence`, and compiled `cms/tools/__pycache__/build_clinical_governance.cpython-313.pyc` in `WMC_Archived_Deployment_Artefacts_2026-10-09.zip`, then removed them from the website package. Rebuilds exclude caches automatically.
3. **Search metadata:** Corrected 21 overlong `<title>` values and eight overlong meta descriptions (28 distinct pages), synchronising `og:*` and Twitter metadata. The 60/150-character local publishing validator is now green. All H1s and clinical main content are preserved.
4. **Digital Reception loading:** Moved the 194-page public search corpus into `digital-reception-index.js`, requested only upon opening Digital Reception. The existing search/controller, patient-question priorities, article → service → doctor → booking routing, accessibility, focus trap, emergency 000 guard and service-first fallback remain. Added an explicit Book Online / Call Clinic recovery state if the index cannot load. The build script now rebuilds the separate index and fingerprints the URL for safe browser caching.
5. **Regression gate:** Added `tools/check_production_regression.py` for internal links, section anchors, breadcrumbs, navigation reachability, 13 practitioner profiles, Lightbox markup and expected artefact exclusions. Updated the existing 49-case browser search test to intercept lazy resource loading and check the request occurs once after opening. Added `tools/check_booking_browser.py` for HotDoc recovery, focus/Escape, responsive widths and missing-index emergency/fallback.
6. **CSS ownership, no deletion:** `qa/CSS_SELECTOR_OWNERSHIP_2026-10-09.csv` and `qa/CSS_SELECTOR_OWNERSHIP_REPORT_2026-10-09.md` classify selector occurrences by evidence. Unmatched static selectors are not called definitively dead because externally injected widgets and runtime states have not undergone complete visual QA. No CSS selector was deleted.

## Measured outcome

- Digital Reception controller: **978,394 bytes → approximately 49,500 bytes** (uncompressed). The **separate ~931 KB index** is now deferred until the visitor opens the assistant. **This is a loading-path optimisation, not a reduction in total search data or a measured network performance guarantee.**
- **196 HTML pages** retained; **194 indexable**; **81 Knowledge Centre guides**; **19 topical clusters**.
- The homepage `index.html`, shared `styles.css`, logos/images and approved article-body/H1 wording are **byte-for-byte/structurally unchanged**, except the two corrected On This Page navigation labels and anchor URLs on the ten topic hubs.
- **No authority pages, practitioners, services or images removed.**

## Automated acceptance checks

- SEO metadata: 196 HTML pages, 194 indexable, canonical URL and social metadata parity — PASS.
- Digital Reception generated search index: all 194 sitemap pages, no stale or repeated records — PASS.
- Patient-intent search: 49 queries across 1440px, 390px and 320px; one on-demand index request; emergency guard — PASS.
- Links and navigational integrity: 14,052 local references, 1,897 fragment targets, 194 breadcrumb trails, no orphan public pages — PASS.
- HotDoc: 13 practitioner profiles checked; 11 contain 33 individual practitioner-specific lightbox CTAs with consistent URLs; other profiles preserve existing policies — PASS (static route validity only).
- Offline HotDoc fallback browser: 1440px, 1024px, 768px, 390px, 320px; Book Online, Call Clinic and Escape — PASS.
- Clinical authority cluster flow: 19 clusters, 81 guides, 29 services and 13 practitioner profiles — PASS.
- Editorial publishing workflow: 12 entries — PASS.
- All eight first-party runtime JavaScript files: `node --check` — PASS.
- Homepage and stylesheet: unchanged SHA-256 versus input ZIP — PASS.
- Edited HTML bodies/H1s: structural equality when only in-page navigation is excluded — PASS.

## Important release caveats

- **Live HotDoc** must still be tested in production/staging with actual provider scripts, cookies, CSP and each practitioner's booking preselection; offline tests cannot certify those third-party behaviours.
- **11 original practitioner portraits** still reference external media sources (existing dependency, not changed by this release).
- This package is an output of a controlled static-site cleanup; final staging smoke tests, backups and rollback planning remain the hosting team's responsibility.
- The CSS ownership analysis is deliberately conservative. Do not delete any rule without cross-viewport and open-state visual regression comparisons.
