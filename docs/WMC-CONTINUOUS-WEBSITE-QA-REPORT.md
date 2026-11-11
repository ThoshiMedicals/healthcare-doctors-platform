# WMC Continuous Website QA Report

**Date:** 2026-11-11  
**Integration branch:** `qa/wmc-continuous-website`  
**Worktree:** `C:\Users\RoshanSamarawickrema\Desktop\WMC-qa-continuous`  
**Final release-candidate tip:** see **§ Final Closure** (code tip `80bdbee` + this docs commit)  
**Hostinger staging (accepted baseline — not yet this RC):** https://mediumslateblue-eagle-960503.hostingersite.com · build `01a1c934-77d0-7395-ac90-9017db7f6e8b` · archive `wmc-logo-v4-699f1de39e7e.zip` · tip `699f1de`  
**Do not push / do not deploy without owner approval.**

---

## A. Initial Hostinger deployment identity and source comparison

| Item | Value |
|------|-------|
| Hostinger domain | `mediumslateblue-eagle-960503.hostingersite.com` |
| Latest build UUID | `01a1c934-77d0-7395-ac90-9017db7f6e8b` |
| Build state | `completed` (2026-11-11T06:06:21Z) |
| Source | Archive `wmc-logo-v4-699f1de39e7e.zip` (not Git auto-deploy) |
| Deployed code tip | **`699f1de`** (logo-v4 branding docs tip) |
| `gitAutoDeployment` | `null` |
| Health | `{"ok":true,"phase":"golden-import","database":"up"}` |
| Local Master Project tip (pre-QA) | `745d45b` on `release/wmc-hostinger-rc1` (dirty WIP preserved) |
| Strategic Recovery Phase 1 | `6f1b0b2` — **ancestor of Hostinger tip** via logo-v4 line |
| Corrective RC | `c2a5571` — **ancestor of Hostinger tip** |
| Phase 2 practitioner authority | `8af1698` — **ancestor of Hostinger tip** |
| RC1 attraction layout fix | `745d45b` — **not** on Hostinger; cherry-picked into QA as `f9461e7` |

**Classification rule used:** Hostinger live code = logo-v4 / Phase 2 line (`699f1de`). Local RC1 tip (`745d45b`) diverged without Phase 2/logo. QA baseline = `699f1de` + attraction cherry-pick → `f9461e7`, then continuous fixes.

Master Project uncommitted WIP was **left untouched** on `WMC-Master-Project`.

---

## B. Complete published URL inventory

| Source | Count / note |
|--------|----------------|
| Agent C / golden HTML files | **207** |
| Production sitemap (`seo-approved/sitemap.xml`) | **205** `<loc>` |
| CMS documented historical | **226** (+ orphans `404.html`, `updates/article.html`) |
| Search-index manifest after QA fix | **208** routes |
| Published practitioners with profiles | **15** |
| Services (sitemap/category) | **29** |
| Knowledge (sitemap/category) | **109** |
| Lead Hostinger hub crawl (unique hrefs) | **114** discovered → **118** probed |

**Lead probe summary (Hostinger):** 97 HTTP 200 of 118 absolute paths. Remaining 21 “404” rows were **false positives** from resolving knowledge-hub relative links (`womens-health.html`) to site root; correct `/knowledge/…` paths return 200.

Artefacts (local, not committed):  
`apps/web/.tmp-qa-continuous/inventory/`  
`apps/web/.tmp-qa-continuous/inventory/agent-c-urls.json`

---

## C–D. Visual and responsive audit

| Scope | Result |
|-------|--------|
| Hostinger homepage desktop | Logo-v4 lockup present; hero authority card + sticky Book/Call/Digital Reception visible |
| GP directory | 12 GPs including Golnar/James/Yamesha; Usman booking-conditions chip present |
| Agent A specialist | Worktree created; **no specialist visual commits** before report cut-off |
| Unique templates visually inspected (Lead) | Home, Join Our Team (tabs open), About, GP directory — **not** all 200+ pages |
| Hero freeze | Preserved (no hero redesign) |

Known content gaps visible on staging: “Photo to be published” for **Dr Nirupa Sivathasan** and **Dr Yamesha Ranatunga** (asset/approval BLOCKED).

Screenshots: `apps/web/.tmp-qa-continuous/screenshots/` (gitignored).

---

## E–H. Patient journeys, practitioners, booking, navigation

### Practitioner routes (15/15 Hostinger)

All inventory paths in `published-practitioner-routes.ts` return **HTTP 200**.  
Gemunu unpublished paths redirect to `/team-general-practitioners.html` (intentional).  
Wrong slug `/doctors/dr-james-chanaka.html` → **404** (canonical is `/doctors/dr-james.html`).

### Booking policies (Agent B + Lead)

| Practitioner | Policy | Staging | Status |
|--------------|--------|---------|--------|
| Golnar | ONLINE HotDoc `dr-golnar-mortezaei-5` | Present | PASS |
| Mary | PHONE_ONLY `tel:` | Present | PASS |
| Tanya | ONLINE + insurance slug | Notice + slug | PASS |
| James | ONLINE `dr-james-chanaka-1` | Present | PASS |
| Yamesha | ONLINE `dr-yamesha-ranatunga-2` | Present | PASS* |
| Usman | Special restriction slug | Preserved | PASS |

\*Yamesha JSON-LD FAQ claims insurance non–bulk-bill while HotDoc URL lacks insurance slug — **BLOCKED** for clinical/CMS approval (LEAD-B1). No invented notice injected.

Recruitment HOLD: EOI/readiness form children 404; join hub informational — PASS.

---

## I. SEO and structured data

| Check | Hostinger | Local code |
|-------|-----------|------------|
| HTML robots meta on `/` | `noindex, nofollow, noarchive` | OK |
| `X-Robots-Tag` on `/` | present | OK |
| `/sitemap.xml` | empty urlset | OK |
| `/robots.txt` | CDN body: Googlebot Disallow:/ ; `*` Allow:/ | **BLOCKED** — CDN shadow (app staging robots correct in code) |
| `/index.html` static | production `index,follow` without X-Robots-Tag | **P1** — CDN/static shadow; middleware now 302→`/` when Node handles staging |
| Canonical identity | Production host in content model | Unchanged |

---

## J. Accessibility findings

- Skip link, named booking controls, sticky care bar present on sampled pages.  
- Join map phone CTA gained `aria-label` via attraction cherry-pick.  
- Full axe/keyboard matrix across all templates: **not completed** (Agent A incomplete).  
- Touch targets / contrast: no new P0 found in sampled views.

---

## K. Performance measurements

Representative Hostinger timings (curl `time_total`, not Lighthouse):

| Path | Notes |
|------|-------|
| `/` | Cold ~9s observed once; warm ~0.5–1s in Agent C samples |
| `/team.html` | ~0.5–5s depending on cold start |
| Doctor profiles | typically ~0.5–0.7s warm |
| Static `/site.js`, CSS | ~0.1–0.35s |

No speculative perf refactors. Durable-cache / cold-start remediation remains historically PASS; residual cold spikes on Hostinger are ops/runtime.

---

## L. Content-preservation comparison

- No CMS/database writes performed.  
- Golden `old-html/` only updated where required to keep runtime search-index / `site.js` byte-aligned with `apps/web/public` (peer graph + doctors shard).  
- Attraction joining-map + HOLD EOI behaviour preserved in cherry-pick resolution.  
- Homepage hero authority v6 not redesigned.

---

## M. Issue register (P0–P3)

| ID | Sev | Issue | Status |
|----|-----|-------|--------|
| H-CDN-ROBOTS | P1/P0-at-cutover | Hostinger CDN shadows `/robots.txt` | **BLOCKED** (ops) |
| H-INDEX-HTML | P1 | `/index.html` static serves production robots on staging | **Partial fix** — middleware redirect when Node sees path; CDN may still shadow |
| PEERS-STALE | P1 | PEERS omitted James/Yamesha/Golnar | **FIXED** locally (`cd6dfad`) |
| SEARCH-INDEX-GPS | P1 | doctors.json missing 3 GPs + null stub | **FIXED** locally (`e3553cf`) |
| YAMESHA-JSONLD | P1 | FAQ/JSON-LD vs HotDoc insurance inconsistency | **BLOCKED** clinical/CMS |
| MANIFEST-MIME | P2 | `manifest.webmanifest` as `text/plain` | **FIXED** locally (`3bac035`) — needs redeploy |
| PHOTO-GAPS | P2 | Nirupa/Yamesha “Photo to be published” | **BLOCKED** assets |
| USMAN-NOTICE | P1 clinical UX | Clearer OHO wording | **BLOCKED** clinical approval (Phase 2 backlog F1) |
| ATTR-LOCAL-404 | P2 env | Local `:3100` attraction pages 404 without CMS DB | Environment — not Hostinger defect |
| REL-CRAWL-FP | P3 | Inventory false 404s from relative knowledge links | Documented only |

**P0 patient-functionality:** none open on staging practitioner/booking matrix after verification.

---

## N. Local repairs completed

1. QA baseline rebase onto Hostinger tip + attraction layout cherry-pick (`f9461e7`).  
2. Regenerate practitioner PEERS for all 15 published profiles (`cd6dfad`).  
3. Restore James/Yamesha/Golnar in search-index; drop null doctor stub (`e3553cf`).  
4. Agent B regression tests for insurance-notice boundaries + Usman matrix exclusion (`ac31c2f`).  
5. PWA manifest Content-Type header (`3bac035`).  
6. Staging `/index.html` → `/` middleware redirect + Agent C SEO lock tests (`eb58602`).

---

## O. Before/after evidence

| Issue | Evidence |
|-------|----------|
| PEERS missing new GPs | Before: peer keys=12, no james/yamesha/golnar in `site.js`. After: 15 keys; coverage tests pass. |
| Search index | Before: doctors.json=13 incl. null row; manifest 206. After: 15 doctors; manifest 208. |
| Manifest MIME | Code header set; live Hostinger still `text/plain` until redeploy. |
| Screenshots | `.tmp-qa-continuous/screenshots/hostinger-home-desktop.png` |

---

## P. Correction cycles performed

| Round | Activity |
|-------|----------|
| 1 | Baseline discovery, Hostinger identity, worktrees, inventory |
| 2 | PEERS + search-index repairs; Agent B/C integrations |
| 3 | Focused regressions (61 pass) |
| 4 | Visual spot-check Hostinger home + GP directory |
| 5 | Report + build verification (see Q) |

---

## Q. Test and build results

**Focused suite (61 tests):** PASS — practitioners, booking, HOLD, peers, search-index, staging noindex, Agent C SEO.

**Production build:** PASS (`npm run build` in `apps/web`, exit 0; log `apps/web/.tmp-qa-continuous/build-log.txt`).

---

## R. Changed-file manifest (integration tip vs `699f1de`)

Primary paths:

- `apps/web/public/site.js`, `old-html/site.js`
- `apps/web/public/search-index/{practitioner-peers,doctors,manifest}.json` (+ old-html mirrors)
- `apps/web/scripts/regenerate-practitioner-peers.mjs`
- `apps/web/scripts/patch-search-index-missing-gps.mjs`
- `apps/web/src/seo/practitioner-peers-coverage.test.ts`
- `apps/web/src/seo/search-index-doctors-coverage.test.ts`
- `apps/web/src/seo/agent-c-qa.test.ts`
- `apps/web/src/documents/booking-restriction-notice.test.ts`
- `apps/web/src/documents/practitioner-booking.test.ts`
- `apps/web/src/documents/join-our-team-recruitment.ts` (cherry-pick merge)
- `apps/web/src/documents/public-ux.ts` / tests / attraction repair modules (cherry-pick)
- `apps/web/next.config.ts`
- `apps/web/src/middleware.ts`
- `apps/web/package.json`
- `docs/WMC-CONTINUOUS-WEBSITE-QA-REPORT.md`

---

## S. Local Git commit history (`qa/wmc-continuous-website`)

```
eb58602 fix(wmc): redirect staging /index.html and lock CDN-shadow SEO regressions
3bac035 fix(wmc): serve PWA manifest with application/manifest+json content type
ac31c2f fix(wmc): add regression tests for non-insurance HotDoc URLs and Usman matrix exclusion
e3553cf fix(wmc): restore James Yamesha Golnar in public search index
cd6dfad fix(wmc): regenerate practitioner peer graph for James Yamesha Golnar
f9461e7 fix(wmc): restore attraction journey layout and joining map
699f1de docs(wmc): record logo-v4 branding commit SHA in acceptance note
```

---

## T. Final integrated commit SHA

Recorded at report commit time on branch `qa/wmc-continuous-website` (this document’s commit becomes the tip).

Final tip: `755d0addc138162258b02029803d639609be9766`.

---

## U. Outstanding approval-dependent items

1. Hostinger CDN `/robots.txt` override  
2. Confirm CDN behaviour for `/index.html` after redeploy of middleware redirect  
3. Yamesha insurance FAQ vs HotDoc slug clinical decision  
4. Practitioner photo assets (Nirupa, Yamesha)  
5. Usman plain-language booking notice (clinical principal)  
6. Independent staging DB backup attestation (unchanged / unresolved in this run)  
7. GitHub push + Hostinger archive/Git deploy authorisation  
8. Merge QA tip into `release/wmc-hostinger-rc1` (lineage differs from pre-QA RC1 tip)

---

## V. GitHub and Hostinger deployment readiness

| Action | Status |
|--------|--------|
| Local RC branch | Ready for review |
| GitHub push | **NOT DONE** |
| Hostinger redeploy | **NOT DONE** — staging still on archive `699f1de` |
| Production DNS | **NO-GO** |

Suggested deploy path (after approval): push `qa/wmc-continuous-website` (or merge to release branch) → Hostinger Node rebuild from known SHA/archive → bust public cache → re-smoke `/`, `/team-general-practitioners.html`, 15 doctors, `/robots.txt`, `/sitemap.xml`, Mary/Golnar/Tanya booking.

---

## W. Rollback instructions

1. Local: `git checkout qa/wmc-continuous-website` then `git reset --hard 699f1de` (Hostinger-matching tip) or `f9461e7` (post cherry-pick only).  
2. Hostinger: redeploy previous archive `wmc-logo-v4-699f1de39e7e.zip` / build `01a1c934-…`.  
3. Do not revert CMS DB (no DB writes in this QA).  
4. Master Project WIP remains on `release/wmc-hostinger-rc1` working tree — untouched.

---

## X. Remaining strategic improvements

- Full Agent A multi-viewport visual pass + a11y keyboard matrix  
- Regenerate search-index from CMS publish pipeline (avoid manual shard patches)  
- Align `release/wmc-hostinger-rc1` with Phase 2 + logo-v4 ancestry  
- Enable Hostinger Git auto-deploy with attested SHA  
- Attraction authenticity / Index Gate (recruitment HOLD)  
- Production cutover ops checklist (`docs/WMC-HOSTINGER-PRODUCTION-READINESS.md`)

---

## Executive release summary

| Metric | Value |
|--------|-------|
| Published pages (sitemap / CMS docs) | 205 / ~226 |
| Pages automatically checked (Lead probe) | 118 (97 true 200; 21 relative false 404s) |
| Unique templates visually inspected | 4+ (home, join, about, GP directory) |
| Issues identified | 10 tracked |
| P0 | 0 open patient-function P0; CDN robots remains cutover blocker |
| P1 | 4 (2 fixed locally, 2 blocked) |
| P2 | 3 (1 fixed locally, 2 blocked/env) |
| Issues fixed locally | 5 code commits after baseline |
| Issues remaining / blocked | CDN robots, photos, Yamesha FAQ, Usman copy, DB backup |
| Repair rounds | 5 |
| Practitioner routes | **15/15 PASS** on Hostinger |
| Booking tests | **PASS** (61 focused tests) |
| Content preservation | PASS (no unapproved content loss) |
| Phase 1/2 regression | Phase 1+2 present on QA baseline ancestry; RC1 tip not overwritten |
| Production build | **PASS** |
| Local Git | Clean commits on `qa/wmc-continuous-website` |
| GitHub push | Not performed |
| Hostinger deploy | Not updated |

### Verdict

**MASTER QA PARTIAL — APPROVALS OR EXTERNAL BLOCKERS REMAIN**

Local release candidate is ready for **controlled staging redeploy review**, but must not be declared Hostinger-complete until CDN robots/`/index.html` behaviour is re-verified post-deploy and blocked clinical/content items are decided.

---

## Master QA continuation — 11 Nov 2026 (evening)

### A2. Re-verified Hostinger / V4

| Check | Result |
|-------|--------|
| Health | `database: up`, phase `golden-import` |
| Homepage logo src | **`assets/brand/healthcare-doctors-woolloongabba-logo-v4.png` LIVE** |
| V4 asset HTTP | 200, `image/png`, ~197KB |
| Favicon / PWA icons | 200 |
| `manifest.webmanifest` MIME on Hostinger | still `text/plain` (local `next.config` MIME fix not yet deployed) |
| `/robots.txt` | still 58-byte CDN shadow (`*` Allow:/) — **BLOCKED** |
| Hostinger MCP this session | auth required / unavailable — evidence via curl |

Prompt note that “V4 Hostinger deployment not established” is **superseded by live evidence**: V4 is on staging homepage.

### I2. Admin capability assessment (non-destructive)

| Item | Result |
|------|--------|
| Filesystem admin `page.tsx` routes | **67** under `apps/web/src/app/admin` |
| Staging `/admin/login` | **200** — Clinic CMS login with password field |
| Staging `/admin`, `/admin/pages`, `/admin/practitioners` | redirect to `/admin/login` (auth boundary OK) |
| Logged-in CRUD browser verification | **BLOCKED** — credentials not used in this QA |
| Classification | Login + route surface **implemented**; deep module behaviour **not fully browser-tested** without authorised session |

Admin route list: `apps/web/.tmp-qa-continuous/inventory/admin-routes.txt`

### B2. Agent B specialist completion (integrated)

| Item | Result |
|------|--------|
| Specialist commit | `0ee2bf0` on `qa/wmc-agent-b-journeys` |
| Integrated as | `b636b97` (docs-only cherry-pick) |
| Report | `docs/WMC-AGENT-B-QA-REPORT.md` |
| Practitioners | **15/15 HTTP 200**; Gemunu **301 → GP directory** (intentional) |
| Booking matrix | Golnar HotDoc, Mary `tel:`, Tanya insurance notice, James/Yamesha HotDoc — **PASS** |
| PWA | `offline.html`/`sw.js` OK; Hostinger `manifest.webmanifest` still `text/plain` until redeploy of local MIME fix |
| Admin | 33 dashboard groups code-inspected; unauthenticated → login **307**; deep CMS still credential-blocked |
| Ownership tests | **79/79 PASS**; no production code changes from Agent B |

### A2b. Agent A specialist completion (integrated)

| Item | Result |
|------|--------|
| Specialist commit | `364adc7` on `qa/wmc-agent-a-visual` |
| Integrated as | `9a25f70` |
| Report / screenshots | `apps/web/.tmp-qa-agent-a/` (local evidence; not required in git tip beyond CSS) |
| P2-B1 | Update-card secondary h3 links → `min-height:24px` (WCAG 2.5.8) |
| P2-B2 | Footer mailto/tel links → restore `min-height:24px` despite specificity conflict |
| Scope | `apps/web/public/styles.css` only; hero freeze untouched |
| Handoff (not fixed) | Frozen `.hero-trust-badge` / `.hero-practitioner-more` sizes — leave unless owner lifts hero freeze |

### C2. Agent C specialist completion (integrated)

| Item | Result |
|------|--------|
| Specialist commit | `6acfa17` on `qa/wmc-agent-c-tech` |
| Integrated as | `88e6107` |
| Report | `apps/web/.tmp-qa-agent-c/AGENT-C-REPORT.md` |
| New tests | +3 in `agent-c-qa.test.ts` (manifest MIME config, manifest JSON, no static `public/robots.txt`) — **12/12 PASS** after integrate |
| Auth.js critical | Agent C escalated next-auth beta.32 — **already applied** on tip (`93037b7`) |
| Remaining prod highs | postcss→Next 16, zod→4, prisma→7 via `--force` — **BLOCKED** |
| Safe `npm audit fix` | Applied (no `--force`): Next **15.5.28→15.5.29**, Playwright **1.49.1→1.65.0**; postcss/zod/prisma highs still need `--force` majors — **BLOCKED** |
| CDN robots / manifest MIME | Confirmed Hostinger shadow — **BLOCKED** pending hPanel / redeploy |
| Staging noindex meta | **PASS** on dynamic pages |
| Cold TTFB sample | `/` 623ms, `/team.html` 451ms; service pages 3–5s cold — noted, not local-code P0 |

### K2. Dependency security

| Item | Result |
|------|--------|
| Before | prod audit: 2 critical, 5 high, 1 moderate (8 total) |
| Applied | `next-auth` **5.0.0-beta.29 → 5.0.0-beta.32** (`@auth/core` 0.41.3) — commit `93037b7` |
| After (omit=dev) | **0 critical**, 5 high, 1 moderate (6 total) |
| Remaining high | Next-bundled `postcss`, `zod`&lt;4, Prisma `deepmerge-ts` — fixes want **Next 16 / zod 4 / Prisma 7** via `--force` → **BLOCKED** separate approval |
| Evidence | `.tmp-qa-continuous/SECURITY-NPM-AUDIT.md`, audit JSON |

### O2. Additional local repairs this continuation

| Commit | Change |
|--------|--------|
| `93037b7` | next-auth security patch |
| `ee18adb` | Golnar CTA label → **Book with Dr Golnar** (+ aria-label); HotDoc URL preserved |
| Prior tip `069977b`… | PEERS, search-index, SEO middleware, Agent A CSS, trust-logo aria-labels (see history above) |

### Q2. Tests / build (continuation)

| Suite | Result |
|-------|--------|
| `test:practitioner-routes` | **34/34 PASS** |
| `test:p0` | **75/75 PASS** |
| Golnar booking + a11y smoke | **14/14 PASS** |
| Production `npm run build` | **PASS** (log `.tmp-qa-continuous/build-log-cycle2.txt`) |

### Executive summary (updated tip)

| Metric | Value |
|--------|-------|
| Code tip for release archive | `80bdbee4d94c7e12a7b90a39e7b1cc74197e34d2` |
| V4 branding on Hostinger | **CONFIRMED LIVE** (accepted baseline `699f1de`) |
| Practitioner / booking | **15/15** + matrix PASS (Golnar CTA improved **locally only**) |
| Admin | Login verified; deep CMS **BLOCKED** without credentials |
| Security | **0 critical** after Auth.js beta.32; remaining force-upgrade highs **accepted risk / BLOCKED** |
| SEO CDN robots / manifest MIME | Hosting-layer **BLOCKED** until post-deploy hPanel checks |
| GitHub / Hostinger deploy | **NOT DONE** |
| Verdict | superseded by **§ Final Closure** |

---

## Final Closure — Master QA release candidate (11 Nov 2026 evening)

### 1. Integrated Git tip and ancestry

| Item | Status |
|------|--------|
| Branch | `qa/wmc-continuous-website` (clean; no force-reset) |
| Prior recorded tip | `755d0ad` — **superseded** by later specialist + Lead commits |
| Code tip (release archive source) | **`80bdbee`** |
| Agent A CSS | `364adc7` cherry-picked as **`9a25f70`** (WCAG 2.5.8 touch targets) — **complete** |
| Agent B report | `0ee2bf0` → **`b636b97`** |
| Agent C SEO/security tests | `6acfa17` → **`88e6107`** |
| Auth.js | `next-auth@5.0.0-beta.32` / `@auth/core@0.41.3` — **`93037b7`** |
| Dep patches | Next **15.5.29**, Playwright **1.65.0** — **`b46faf9`** |
| Golnar CTA | **`ee18adb`** (local only until deploy) |
| PEERS + search-index | **`cd6dfad`**, **`e3553cf`** (+ tests `ac31c2f`) |
| PWA manifest header | **`3bac035`** (local `next.config`; Hostinger still `text/plain`) |
| Staging `/index.html` mitigation | **`eb58602`** |
| V4 / Phase 1 / Phase 2 / corrective | `699f1de`, `6f1b0b2`, `8af1698`, `c2a5571` — **all ancestors** |
| Specialist SHAs `364adc7`/`0ee2bf0`/`6acfa17` | Content integrated via cherry-pick (new SHAs above) |

No approved work lost. `.env`, `.next`, `node_modules`, `.pgdata`, and `styles.min.css` (build artefact) are not committed.

### 2. Full regression verification

| Gate | Result |
|------|--------|
| `npm test` (maintained suite) | **514 tests · 513 pass · 1 fail** |
| Sole failure | `golden-master` HTML region compare — **207 published pages missing** in fresh local DB |
| Why blocked | `import:golden` correctly **refuses localhost** (production DB target guard). No DB writes to staging/production performed. |
| Byte compares | `site.js` golden equality **PASS**; `styles.css` intentional QA CSS via approved-runtime exception **PASS** |
| `test:practitioner-routes` | **34/34 PASS** |
| Phase 1 care-area + Phase 2 authority + Agent C SEO | **25/25 PASS** (subset re-run) |
| Auth / password / admin-hardening / super-admin | **PASS** after local seed with process env (Auth.js beta.32 — no login/middleware regressions observed in unit suite) |
| Lint | **PASS** (existing warnings only; no errors) |
| Production `npm run build` | **PASS** (Next **15.5.29**, Node 22-compatible settings) |
| vs historical 512/512 | Suite now **514** tests; **513** green. Net +2 tests from QA; 1 env-blocked DB HTML compare |

### 3. Dependency security gate (final)

Installed: `next@15.5.29`, `next-auth@5.0.0-beta.32`, `@auth/core@0.41.3`, `zod@3.25.76`, `prisma@6.19.3`, `playwright@1.65.0`.

| Advisory | Chain | Prod exposure | Reachability | Fix | Classification |
|----------|-------|---------------|--------------|-----|----------------|
| Auth.js criticals | cleared by beta.32 | n/a | n/a | done | **RESOLVED** |
| `postcss` ≤8.5.22 (high) | bundled under `next` | build-time CSS stringify / source map path issues | Not a public request handler; exploit needs attacker-controlled PostCSS input during build | Next **16** via `--force` | **Accepted risk** for this RC (no `--force`) |
| `zod` &lt;4.6.6 (high) | direct dep 3.25.76 | memory exhaustion on oversized constrained collections (advisory targets zod **v4** paths; project on **v3**) | Low for current Zod 3 usage; no evidence of attacker-controlled unbounded collection schemas in public routes | zod **4** major | **Accepted risk / false-positive posture for v3**; major upgrade BLOCKED |
| `deepmerge-ts` (high) | `prisma` → `@prisma/config` | stack exhaustion on recursive merge | Prisma config/ORM internal; not a public HTTP handler | Prisma **7** major | **Accepted risk** (low runtime exploitability) |
| Dev: `minimatch` (mod) via typescript-eslint | devOnly | CI lint tooling | Not shipped to Hostinger runtime | eslint stack bump | Non-blocking |
| `npm audit --omit=dev` | **0 critical**, 5 high, 1 moderate | — | — | no `--force` | Gate: **criticals cleared** |

### 4. Hostinger SEO / CDN outstanding (operator)

Live checks **still show** (accepted V4 deploy, not this RC):

| Path | Live behaviour | Local app status | Operator action |
|------|----------------|------------------|-----------------|
| `/robots.txt` | 58-byte CDN body: Googlebot `Disallow: /`; `*` `Allow: /` | Route handler + staging noindex code **correct** | hPanel/CDN: stop static short-circuit of `/robots.txt`; after RC deploy expect staging all-disallow (or confirm CF/hcdn bypass removed). **Do not** drop production canonicals. |
| `/manifest.webmanifest` | `Content-Type: text/plain` | `next.config` sets `application/manifest+json` | After RC deploy: confirm response header is `application/manifest+json`. If still `text/plain`, set Hostinger MIME for `*.webmanifest`. |
| `/index.html` | 200 DYNAMIC (CDN may serve static) | Middleware redirect/mitigation **`eb58602`** | After deploy: `curl -sI /index.html` should follow app redirect or serve staging-noindex HTML — not production `index,follow` static file. |

**These are not fixed on live Hostinger until an authorised redeploy + hPanel verification.**

### 5. Content / clinical safeguards

| Check | Result |
|-------|--------|
| 15 practitioner profiles | Hostinger **15/15 HTTP 200**; Gemunu intentional 301 |
| Booking matrix | Golnar HotDoc, Mary phone-only, Tanya insurance notice, James/Yamesha HotDoc — **PASS** |
| V4 branding | Live on staging; preserved on QA tip |
| Recruitment HOLD | Tests **PASS**; HOLD preserved |
| PWA cache policy | Admin/auth/network-only — **PASS** |
| Approval-held | Yamesha FAQ vs URL; Usman notice wording; missing photos — **unchanged / not invented** |

### 6. Release preparation artefacts

| Artefact | Path / value |
|----------|--------------|
| Release archive | `C:\Users\RoshanSamarawickrema\Desktop\backups\WMC-release-archives\wmc-master-qa-rc-80bdbee.zip` |
| Archive SHA-256 | `6C6B69DFCDFDDD4F1CB4C7E55BB3D63BA9329711C2CE37C0CEC7EAEFD13D7390` |
| Git SHA archived | `80bdbee4d94c7e12a7b90a39e7b1cc74197e34d2` |
| Rollback archive (accepted V4) | `...\wmc-logo-v4-699f1de39e7e.zip` (build `01a1c934-…`) |
| DB migrations required for this RC | **None new** beyond already-deployed schema lineage |
| Hostinger Node | **22** (confirmed on current staging build settings) |
| Independent off-server DB backup | **OUTSTANDING** — required before treating staging DB risk as closed |
| GitHub push | **NOT performed** |
| Hostinger deploy | **NOT performed** |

#### Post-deploy smoke (owner)

1. Health `{"ok":true,"database":"up"}`  
2. Homepage V4 logo + Golnar CTA “Book with Dr Golnar”  
3. 15 practitioner 200 + Gemunu 301  
4. Mary `tel:` / Tanya insurance notice  
5. `/robots.txt`, `/manifest.webmanifest` MIME, `/index.html` behaviour per table above  
6. Admin login page 200; dashboard still redirects when logged out  
7. Rollback = re-upload `wmc-logo-v4-699f1de39e7e.zip` (do **not** hard-reset local git branches)

### 7. Issue register (remaining)

| ID | Pri | Status |
|----|-----|--------|
| CDN `/robots.txt` shadow | P0 cutover/ops | **BLOCKED** — hPanel |
| Manifest MIME on Hostinger | P1 | **BLOCKED** until redeploy + MIME confirm |
| Golden HTML DB region test locally | P2 env | **BLOCKED** — localhost import correctly refused |
| Remaining npm highs (Next16/zod4/Prisma7) | P2 security debt | **Accepted risk** / separate approval |
| Yamesha FAQ / Usman copy / photos | P2 clinical | **BLOCKED** — owner/clinical |
| Authenticated CMS deep CRUD | P2 | **BLOCKED** — credentials |
| Off-box DB backup | P0 ops for DB-risk deploy | **OUTSTANDING** |

### Executive quality summary (closure)

| Metric | Value |
|--------|-------|
| Final code SHA | `80bdbee4d94c7e12a7b90a39e7b1cc74197e34d2` |
| Full suite | **513/514 PASS** (1 DB-import env block) |
| Production build | **PASS** |
| Security | **0 critical**; highs documented accepted/BLOCKED |
| Practitioners / booking | **PASS** |
| Content preservation | **PASS** |
| Agent A/B/C | **All integrated** |
| Hostinger live = this RC? | **No** — still `699f1de` / `01a1c934` |
| Push / deploy | **Not done** |

### Verdict

**MASTER QA RELEASE CANDIDATE VERIFIED — READY FOR OWNER REVIEW**

Local RC is verified for controlled staging upload **after** owner confirms: (1) staging DB backup exception or off-box backup, (2) post-deploy CDN/robots/manifest checks, (3) no GitHub push until separately authorised.
