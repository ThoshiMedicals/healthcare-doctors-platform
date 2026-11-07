# WMC — NEXT vs Hostinger Visual & Content Parity Report

Generated: 2026-11-07T00:40:01.865Z  
Repair close-out: 2026-11-07 (Hostinger `fedafac`)  
Original audit mode was READ-ONLY; repair evidence is in `docs/WMC-FINAL-THREE-PAGE-REPAIR.md`.

## Executive verdict

**Final verdict: MATCH WITH DOCUMENTED EXCEPTIONS** (after three-page repair on Hostinger `fedafac`)

Prior baseline audit: **224 / 224** pages × five widths (**1,120** pairs) → **NOT MATCHED** (3 P1 pages).  
Post-repair re-verify of `/`, Tanya, Debra + controls/orphans: material gaps closed. Homepage heights match at all five widths; Tanya/Debra show **Services Provided**; inventory reconciled as **226 = 224 + `404.html` + `updates/article.html`**.

| Category | Baseline audit | After repair |
|----------|----------------|--------------|
| CONTENT PARITY | FAIL | **PASS** (Tanya/Debra headings match NEXT) |
| VISUAL PARITY | FAIL | **PASS** with INTENTIONAL home@320 pixel noise |
| ASSET PARITY | PASS | **PASS** |
| INTERACTION PARITY | PASS | **PASS** (unchanged) |
| PAGE INVENTORY PARITY | PASS* | **PASS** (226 reconciled; *was incomplete without orphan explanation) |

Browsable offline dashboard (baseline screenshots):  
`apps/web/.tmp-next-hostinger-audit/dashboard/index.html`  
Repair re-verify shots: `apps/web/.tmp-next-hostinger-audit/repair-verify/`

---

## Scope

| Role | URL |
|------|-----|
| Approved reference | https://next.gabbamedicalcentre.com.au |
| Migration target | https://mediumslateblue-eagle-960503.hostingersite.com |
| Localhost / `old-html/` golden master | **Not used** as the approved reference |

---

## Phase 1 — Baselines

| Item | NEXT | Hostinger |
|------|------|-----------|
| Home HTTP | 200 | 200 |
| `/api/health` | `{"ok":true,"phase":"golden-import","database":"up"}` | same |
| Home HTML bytes (approx) | 81,467 | 79,168 |
| Hero cache token | `wmc-hero-authority-v6` | `wmc-hero-authority-v6` |
| `site.js?v=` | `wmc-practitioner-growth-20261106` | `wmc-practitioner-growth-20261106` |
| Next.js `buildId` in HTML | not exposed on CMS-rendered home | not exposed |
| `/sitemap.xml` | 400 via tunnel (Host-header quirk) | 200 empty urlset (**INTENTIONAL** staging) |
| `/robots.txt` | 400 via tunnel | staging noindex (**INTENTIONAL**) |

Capture environment (identical both sites): Playwright Chromium 1.65, viewports 320 / 390 / 768 / 1024 / 1440, locale `en-AU`, timezone `Australia/Brisbane`, DPR=1, `prefers-reduced-motion: reduce`, full-page screenshots after font + image settle and lazy-load scroll.

Local git tip at audit time: `aee8284` on `release/wmc-hostinger-rc1` (informational only; live NEXT is the content authority).

---

## Phase 2 — Page inventory

Authority inventory was built from:

1. Approved seed list in `apps/web/public/seo-approved/sitemap.xml` (208 locs)
2. Known attraction / join / practice-experience extras
3. Live BFS crawl of NEXT nav/footer/internal links
4. Live HTTP probes on both hosts for the union of candidates (438 probed)

| Metric | Count |
|--------|------:|
| NEXT public inventory (authority) | **224** |
| Missing on Hostinger | **0** |
| Extra on Hostinger | **0** |
| Pages captured (5 widths each) | **224** |
| Viewport comparisons | **1,120** |
| Capture errors | **0** |
| Visual/semantic PASS pages | **221** |
| Pages with differences | **3** |

Live NEXT authority crawl for this audit is **224** reachable public pages. Published CMS count **226** = those **224** + published specials **`404.html`** and **`updates/article.html`** (HTTP 200 both hosts; omitted from primary nav/footer crawl). Reconciled in the three-page repair note.

Inventory parity: **PASS** (reconciled).

---

## Material findings (baseline audit — closed by repair)

Baseline P1 items below were open at audit time (`aee8284`). They are **closed** on Hostinger tip **`fedafac`**. Full root-cause and re-verify: `docs/WMC-FINAL-THREE-PAGE-REPAIR.md`.

### 1. Homepage `/` — visual height / layout drift (P1 → CLOSED)

| Viewport | Baseline | After `fedafac` |
|----------|----------|-----------------|
| 320 | 13446 vs 13319 (6.09% + H mismatch) | **same H 13446**; 2.39% pixel noise = INTENTIONAL |
| 390 | 12560 vs 12406 (6.67% + H mismatch) | **PASS** same H |
| 768 | PASS | PASS |
| 1024 | PASS | PASS |
| 1440 | 9189 vs 9126 (1.76% + H mismatch) | **PASS** same H |

**Root cause:** Hostinger static layer served unminified `styles.css`, bypassing Next rewrite to `styles.min.css`. Fixed by linking `styles.min.css` (+ DR scrim / welcome-dr / hours meridian).

### 2–3. Tanya / Debra — heading label (P1 → CLOSED)

| | Baseline Hostinger | After repair |
|--|--------------------|--------------|
| H2 | Related Services | **Services Provided** (matches NEXT) |

**Root cause:** empty staging `areas_of_care` skipped growth rename; then women’s→men’s regex false positive. Data sync + anchored care-area map. Sumita control still **Related Services** on both (no regression).

---

## Discrepancy register

| Path | Section | Status | Notes |
|------|---------|--------|-------|
| `/` | visual height | **CLOSED** | heights match all widths; home@320 INTENTIONAL pixel noise |
| `/doctors/dr-tanya-goodwill.html` | H2 Services Provided | **CLOSED** | matches NEXT |
| `/doctors/dr-debra-larkins.html` | H2 Services Provided | **CLOSED** | matches NEXT |
| `404.html`, `updates/article.html` | inventory | **RECONCILED** | published specials; not missing |

**P0/P1 open:** none  
**INTENTIONAL remaining:** staging noindex/empty sitemap; CF email obfuscation on NEXT; `styles.css` vs `styles.min.css` href with identical bytes

---

## Interaction sampling (safe, non-submitting)

| Test | NEXT | Hostinger | Status |
|------|------|-----------|--------|
| desktop-nav-links | navLinks=17 logo=1 | same | PASS |
| mobile-nav-toggle | toggles=1 opened=true | same | PASS |
| page-interact `/` | ctas=22 accordions=5 | same | PASS |
| `/team.html` | ctas=11 | same | PASS |
| `/book-appointment.html` | ctas=20 | same | PASS |
| `/contact.html` | ctas=16 | same | PASS |
| `/join-our-team.html` | ctas=15 accordions=13 | same | PASS |
| `/join-our-team/gp-opportunities.html` | ctas=13 | same | PASS |
| `/about-us/practice-experience.html` | ctas=6 | same | PASS |
| `/services.html` | ctas=11 | same | PASS |
| `/patient-information.html` | ctas=14 | same | PASS |
| `/doctors/dr-tanya-goodwill.html` | ctas=17 | same | PASS |
| `/doctors/dr-golnar-mortezaei.html` | ctas=16 | same | PASS |
| footer-links | 28 | 28 | PASS |

Forms were observed but **not submitted**.

Interaction parity: **PASS**.

---

## Completeness

| Requirement | Status |
|-------------|--------|
| Every discovered public page assessed | YES (224) |
| All five widths per page | YES |
| Timed-out captures marked success | NO (0 capture failures) |
| Screenshots kept out of git | YES (`.tmp-next-hostinger-audit/`, gitignored) |
| Dashboard offline-capable | YES (`dashboard/index.html` + `../screenshots/`) |

Resumable harness: `apps/web/scripts/next-vs-hostinger-visual-audit.mjs`  
Checkpoint: `apps/web/.tmp-next-hostinger-audit/checkpoint.json`

---

## Notes

- Staging empty sitemap / noindex is an **INTENTIONAL** environment difference and does not fail inventory or content parity by itself.
- Pixel comparison thresholds: soft 1.2%, material 4%; anti-aliasing excluded via `includeAA: false`. Dimension mismatches elevate severity even when ratio is modest.
- CMS HTML hash equality from earlier local-vs-Hostinger work is **not** treated as visual equivalence; this audit used rendered NEXT DOM + screenshots.
- Home HTML byte gap (~2.3 KB) aligns with presentation-layer drift rather than a missing page.
- Do **not** authorise production DNS cutover from this report alone (ops/cutover gates remain separate).
- Repair close-out evidence: `docs/WMC-FINAL-THREE-PAGE-REPAIR.md`; shots under `.tmp-next-hostinger-audit/repair-verify/`.

## Final verdict

**MATCH WITH DOCUMENTED EXCEPTIONS**

Hostinger tip **`fedafac`** on `release/wmc-hostinger-rc1`. Material P1 gaps from the baseline audit are closed. Remaining deltas are intentional staging/environment differences without content or layout-height failure.
