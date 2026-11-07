# WMC — Combined Phase 1 + Phase 2 Production Release Backlog

**Role:** Principal Release Manager / Next.js Architect / Healthcare UX / Clinical Governance  
**Date:** 2026-11-07 (updated after Phase 3)  
**Original mode:** Consolidation only.  
**Phase 3 follow-up:** Controlled pre-launch remediation — see [`docs/WMC-PHASE3-PRELAUNCH-REMEDIATION.md`](./WMC-PHASE3-PRELAUNCH-REMEDIATION.md).  
**Git rollback tip:** `ae202f2` · **Evidence commit:** `af2f53e`  
**Authority UX/content:** https://next.gabbamedicalcentre.com.au  
**Hostinger staging:** https://mediumslateblue-eagle-960503.hostingersite.com  

**Source audits (read-only):**
- Phase 1 — Production Deployment Audit ([transcript worker](2152990c-d6ee-46a0-9cd5-9d38aac6004d))
- Phase 2 — Production UX Audit ([transcript worker](37cd48e6-898a-418d-882e-707d084b926c))
- Supporting: `docs/WMC-PRODUCTION-READINESS-EVIDENCE.md`, `docs/WMC-FINAL-RELEASE-CANDIDATE-GATE.md`, `docs/WMC-ATTRACTION-PRODUCTION-GAP-REPORT.md`, `docs/WMC-DURABLE-CACHE-ACCEPTANCE.md`, `deployment/LAUNCH.md`

**Parity rule:** Any approved correction must ship to **both** NEXT (authority) and Hostinger RC. Do not make Hostinger visually different from NEXT without written approval. Do not reopen durable-cache / cold-start / nav-perf remediation (**PASS**).

---

## Phase 3 status snapshot (2026-11-07)

| Backlog ID | Phase 3 outcome |
|------------|-----------------|
| BL-P0-01 Ops evidence | Still **BLOCKED** (LAUNCH E-table) |
| BL-P0-02 Prod env noindex | Staging hostname lock OK; **prod attestation BLOCKED** |
| BL-P1-01 Hostinger robots CDN | Still **BLOCKED** (hCDN shadows `/robots.txt`) |
| BL-P1-02 UAT robots/sitemap 400 | **DONE** — `:3100` + `next.` return 200 |
| BL-P1-03 Usman notice | **PREVIEW READY** — clinical approval required; not published |
| BL-P1-04/05 Recruitment authenticity + Index Gate | **HOLD** unchanged |
| BL-P3-01 site.js golden drift | **DONE** — byte-synced |

---

## Executive readiness decisions

| Gate | Decision | Rationale |
|------|----------|-----------|
| **Technical deployment readiness** | **CONDITIONAL GO FOR CUTOVER PLANNING** | LAUNCH.md now matches Hostinger + Supabase. UAT SEO routes repaired. Residual: ops evidence, Hostinger CDN robots, Git auto-deploy. |
| **Patient website readiness** | **CONDITIONAL GO** | Homepage authority v6, HotDoc/Mary/insurance paths pass. Usman notice awaits clinical sign-off (preview only). |
| **GP recruitment readiness** | **HOLD** | Join chrome works; Attraction authenticity + Index Gate still HOLD. |
| **SEO readiness** | **CONDITIONAL GO** | UAT/`next.` robots+sitemap **PASS**. Staging sitemap + HTML noindex **PASS**. Hostinger `/robots.txt` CDN shadow **BLOCKED**. |
| **Overall production DNS cutover** | **NO-GO** | Ops evidence still BLOCKED. Do not change apex DNS. |

**Important classification rule used here:** Phase 2 “P1 Critical” UX items are **not** automatically DNS cutover blockers. Only items that make an unsafe or non-indexable apex, or that leave production ops unproven, are **P0** for cutover.

---

## 1. Phase 1 evidence validation

| Check | Phase 1 claim | Re-validation (2026-11-07) | Production defect? |
|-------|---------------|----------------------------|--------------------|
| Production build | Not run (read-only) | Still not re-run in this consolidation | Residual attestation gap — schedule at ship SHA |
| TypeScript | `tsc --noEmit` fail: 2 vitest-only files | Accepted as reported | **No** for runtime; **P3** tool hygiene |
| Import errors | Only vitest module resolution | Accepted | **No** for public runtime |
| Hydration warnings | None found; public HTML + `site.js` | Accepted | **No** |
| Runtime URL leakage | None in public HTML / `site.js` / `public-ux.ts` | Accepted; docs/scripts localhost hits excluded | **No** for deployed public pages |
| Metadata / canonical / OG | Apex `https://gabbamedicalcentre.com.au` in published HTML | Accepted | **Pass** for production content model |
| Route completeness | Home, team, join, contact, fees-billing, services, sampled doctors → 200 | Usman 200 on NEXT + Hostinger confirmed this pass | **Pass** |
| Production-only SEO behaviour | Approved robots/sitemap assets; staging empty sitemap; UAT 400 | Confirmed: `:3000` robots/sitemap **200**; `:3100` + `next.` **400**; Hostinger sitemap empty **200**; Hostinger robots CDN body `Allow: /` (not app staging robots) | Split: UAT rebuild vs Hostinger CDN vs apex cutover |

**Localhost / `:3000` / `:3100` in docs, tests, readiness modules, and LAUNCH runbooks are not production defects** unless they appear in deployed public HTML/JS (none found).

### Phase 1 IDs mapped into this backlog

| Phase 1 ID | Backlog ID | Priority for cutover |
|------------|------------|----------------------|
| B1 Ops evidence | **BL-P0-01** | **P0** |
| B2 `STAGING_NOINDEX` on apex | **BL-P0-02** | **P0** |
| H1 Hostinger CDN robots | **BL-P1-01** | **P1** (P0 if Hostinger is the production web host at cutover) |
| H2 UAT/next. robots+sitemap 400 | **BL-P1-02** | **P1** (authority hygiene; not apex DNS by itself) |
| M1 Warm-boot host hardcodes | **BL-P2-01** | **P2** |
| M2 `site.js` ≠ golden | **BL-P3-01** / subsumed by F6 | **P3** after semantic diff |
| M3 Vitest vs `tsc` | **BL-P3-02** | **P3** |
| M4 Attraction pack `next.` URL | **BL-P1-03** | **P1** for recruitment soft-launch |
| L1 `/fees.html` 404 | **BL-P3-03** | **P3** (canonical path is `/fees-billing.html`) |

---

## 2. Phase 2 findings F1–F7 (validated)

### F1 — Dr Usman booking notice clarity

| Field | Detail |
|-------|--------|
| **URL** | https://next.gabbamedicalcentre.com.au/doctors/dr-usman-gul.html (Hostinger same path) |
| **Source** | Golden/CMS: `old-html/doctors/dr-usman-gul.html` → published revision. Presentation: optional CSS only via `apps/web/src/documents/public-ux.ts`. **Do not** invent rules in `apps/web/src/documents/booking-restriction-notice.ts` (insurance slug only; leaves Usman unchanged). |
| **Observed** | `.practitioner-booking-notice`: “Current booking restrictions apply. Read booking conditions before booking.” Book CTAs use HotDoc slug `…/dr-usman-gul-strictly-seeing-male-patients-only`. |
| **Approved practice facts (from `#booking-conditions` on the same page)** | Queensland **Office of the Health Ombudsman** publishes scope conditions; practice lists Dr Gul as **seeing male patients**; contact with **female patients permitted only through telehealth**, with patient/guardian agreeing the consult is **entirely telehealth**; WMC listed as approved location; link to current OHO notice. |
| **NEXT behaviour** | Identical notice + conditions (golden == live). |
| **Impact** | Patients can open Book before reading who may be seen face-to-face — clinical-safety / trust UX risk. |
| **Proposed correction (draft — needs approval)** | Beside Book CTA, replace generic sentence with plain-language summary drawn **only** from approved `#booking-conditions`, e.g.: *“Dr Gul currently sees male patients in person. Female patients may be seen by telehealth only, under Queensland Office of the Health Ombudsman conditions. [Read full booking conditions.](#booking-conditions)”* — keep OHO link + full detail in `#booking-conditions`; **do not** change HotDoc slug. |
| **Approval** | **Clinical Principal / practice owner** + governance (OHO wording must match current protective order). |
| **Regression** | Doctor profile HTML revision + Hostinger CMS sync; sticky/dock inherits HotDoc from profile — verify sticky still points at male-patients slug. |
| **Cutover class** | **P1** (patient feature / clinical clarity) — **not** automatic DNS P0. |

### F2 — GP recruitment authenticity

| Field | Detail |
|-------|--------|
| **URL** | https://next.gabbamedicalcentre.com.au/join-our-team.html (+ Attraction/PE hubs) |
| **Source** | `apps/web/src/documents/join-our-team-recruitment.ts`; Attraction CMS `apps/web/src/attraction-cms/`; sticky chrome in `public-ux.ts` (~recruit sticky). Authority gap: `docs/WMC-ATTRACTION-PRODUCTION-GAP-REPORT.md`. |
| **Observed** | Recruit sticky, EOI, nav “Join Our Team” work. |
| **Missing authenticity (not inventable in code)** | **P0-1** concept/non-WMC photography on Join/Catchment/Opportunities/PE; **P0-2** no consented GP/nurse/reception voices; **P0-3** Flexible Sessions chapter image gap; **P0-4** Index Gate undecided; **P0-5** EOI operational ownership unproven. |
| **Impact** | Employer-brand trust insufficient for **production recruitment conversion**; patient site can still cut over with recruitment soft-held. |
| **Correction** | Content/media/ops sprint (Attraction Sprint A/B) — not a patient homepage redesign. |
| **Approval** | Owner + PM + Attraction stakeholders; Index Gate written decision. |
| **Regression** | Join page presentation + Attraction hubs; sitemap/robots if index flips. |
| **Cutover class** | **P1 for recruitment feature launch**; **not** patient DNS P0. |

### F3 — James / Yamesha discoverability + PEERS stale

| Field | Detail |
|-------|--------|
| **URL** | `/team.html`; peer blocks on doctor profiles; homepage hero strip (freeze-bound) |
| **Source** | `apps/web/public/site.js` `const PEERS` (`generated":"2026-10-26"`) — **0** `dr-james` / `yamesha` keys; sync `old-html/site.js`; team inject `inject-cms-practitioners.ts`; hero faces in `public-ux.ts` (freeze). |
| **Observed** | Team lists James/Yamesha; PEERS blob omits them; Yamesha portrait unavailable. |
| **NEXT** | Same runtime PEERS. |
| **Impact** | Weak peer graph / discovery for new GPs. |
| **Correction** | Regenerate PEERS; publish Yamesha photo; prefer team hub prominence — **do not** expand frozen hero without exception. |
| **Approval** | Content/media for photos; freeze exception only if hero change insisted. |
| **Regression** | `site.js` bust via `public-ux.ts` `siteJsHref`; golden sync. |
| **Class** | **P2** |

### F4 — Weak practitioner photography (Nirupa, Samuel, Yamesha)

| Field | Detail |
|-------|--------|
| **URL** | `/doctors/dr-nirupa-sivathasan.html`, `/doctors/mr-samuel-stafford.html`, `/doctors/dr-yamesha-*.html` (as published) |
| **Source** | Published doctor HTML / `old-html/doctors/*`; CMS media |
| **Observed** | Missing `doctor-profile-photo` / unavailable cues (matches practitioner QA P-V1). |
| **Correction** | Approved portraits or intentional non-photo treatment. |
| **Approval** | Practice + media consent. |
| **Class** | **P2** |

### F5 — Local SEO (sitemap/robots/geo/locations)

| Field | Detail |
|-------|--------|
| **URLs** | `/sitemap.xml`, `/robots.txt`, homepage schema, legacy `/locations/*` |
| **Source** | `apps/web/src/app/robots.txt/route.ts`, `apps/web/src/app/sitemap.xml/route.ts`, `apps/web/public/seo-approved/*`, `apps/web/src/seo/staging-noindex.ts` |
| **Investigation (this pass)** | |
| | **App design:** routes return **200** with production assets or staging empty/noindex bodies. |
| | **Dev `:3000`:** robots + sitemap **200** (production Allow + 160-loc sitemap). |
| | **UAT `:3100` and `next.`:** both **400** HTML “Bad Request”. Compiled route present under `.next/server/app/robots.txt` but **missing** under `.next-uat/server/app/` → **stale/incomplete UAT build**, not a Cloudflare-only invention (400 reproduces on localhost:3100 without CF). Tunnel merely fronts the same UAT process. |
| | **Hostinger:** sitemap empty urlset **200** (correct staging). robots **200** but body is **CDN/static** `Googlebot Disallow` / `* Allow` — **not** the app `stagingRobotsTxt()` — known Hostinger short-circuit risk. |
| | **Canonicals/noindex:** NEXT sends `X-Robots-Tag: noindex, nofollow` (correct for UAT). HTML meta may still say index,follow while header noindexes — header wins for bots on UAT. |
| | **GeoCoordinates:** still absent from MedicalClinic graph (optional). |
| | **`/locations/*`:** still 404 (legacy suburb taxonomy residual). |
| **Correction** | Rebuild UAT (`.next-uat`) so robots/sitemap compile; at Hostinger/prod ensure app robots not CDN-shadowed; at apex cutover flip noindex off and serve `seo-approved` assets; optional geo + suburb redirects. |
| **Approval** | SEO owner for index flip; ops for CDN. |
| **Class** | Split — see **BL-P1-01**, **BL-P1-02**, **BL-P2-02**, **BL-P2-03** |

### F6 — `site.js` vs `old-html/site.js` semantic diff

| Field | Detail |
|-------|--------|
| **Files** | `apps/web/public/site.js` (109070 B) vs `old-html/site.js` (109069 B) |
| **Semantic diff (this pass)** | After CRLF normalize: **not** byte-identical. **Only 2 line deltas:** (1) comment at prefetch block — Unicode **em dash** (`—`) in public vs **replacement character** (`�`) in golden; (2) trailing blank line. **No executable logic drift** in the diff sample. |
| **PEERS** | Both files share the same stale `PEERS` generated `2026-10-26` (James/Yamesha absent) — that is **F3 content staleness**, not a public↔golden behavioural fork. |
| **Impact** | Golden-master test fails on hash; runtime regression risk from *this* drift alone is **negligible**. |
| **Correction** | Re-sync bytes when next touching `site.js` (prefer public UTF-8 → golden); regenerate PEERS under F3; bust `siteJsHref` in `public-ux.ts`. |
| **Class** | **P3** sync hygiene (raise to P1 only if a real behavioural fork appears) |

### F7 — Attraction index / sitemap scope

| Field | Detail |
|-------|--------|
| **Source** | Attraction Index Gate / `attraction-cms/ev-shell.ts`; sitemap allowlists; gap report P0-4 / P1-4 |
| **Observed** | EV hard noindex until gate; sitemap lists join hub; deeper Attraction paths gated. |
| **Impact** | Premature index = thin authenticity risk; permanent noindex = no recruitment SEO. |
| **Correction** | Written soft-launch vs selective-index decision **after** authenticity P0s. |
| **Class** | **P1 for recruitment SEO launch**; not patient DNS P0 |

### P3 observations (F8–F12) — retained

| ID | Topic | Class |
|----|-------|-------|
| F8 | Mary dual identical `tel:` CTAs | **P3** |
| F9 | Hero empty `alt=""` | **P3** / freeze-bound |
| F10 | Some targets &lt;44px | **P3** / freeze-sensitive on hero |
| F11 | No review AggregateRating | **P3** (governance-first by design) |
| F12 | Tel aria-label layering | **P3** |

---

## 3. Actionable backlog

Priority key:

- **P0** — Blocks production DNS cutover  
- **P1** — Must fix before the **affected feature** launches (patient clarity, SEO edge, recruitment, authority UAT)  
- **P2** — Important; schedule after cutover planning / with content sprints  
- **P3** — Optional polish  

### P0 — Blocks production cutover

#### BL-P0-01 — Production ops evidence package
| | |
|--|--|
| **Page** | Apex cutover / VPS or production Hostinger |
| **Exact path** | `deployment/LAUNCH.md`, `deployment/DNS-CUTOVER-CHECKLIST.md`, `docs/WMC-PRODUCTION-READINESS-EVIDENCE.md` |
| **Root cause** | Off-box backup, `AUTH_*`, DB isolation, CF Full (strict), origin cert, smoke log, DNS rollback values unverified |
| **Repair** | File PASS evidence per LAUNCH; no product code required |
| **Approval** | Ops owner |
| **Acceptance** | All eight evidence rows PASS |
| **Regression** | Ops only |
| **Deploy dep** | Before DNS change |

#### BL-P0-02 — Guarantee production env is not staging-noindex
| | |
|--|--|
| **Page** | Entire public site at apex |
| **Exact path** | `apps/web/src/seo/staging-noindex.ts` (behaviour); production host env |
| **Root cause** | `STAGING_NOINDEX=true` is absolute and would noindex apex |
| **Repair** | Production env: unset `STAGING_NOINDEX` / `UAT_QUICK_TUNNEL`; checklist attestation |
| **Approval** | Ops |
| **Acceptance** | Apex HTML + headers indexable per SEO plan; staging hosts still noindex |
| **Regression** | SEO only |
| **Deploy dep** | Production env freeze before DNS |

---

### P1 — Must fix before affected feature / authority ship

#### BL-P1-01 — Hostinger (or prod web host) must serve app robots, not CDN Allow-all
| | |
|--|--|
| **Page** | `/robots.txt` on staging today; apex if Hostinger is prod |
| **Exact path** | `apps/web/src/app/robots.txt/route.ts`, `public/seo-approved/robots.txt`, Hostinger CDN/static rules |
| **Root cause** | Edge short-circuits `/robots.txt` with static body (`Allow: /`) while app intends staging disallow / prod approved file |
| **Repair** | Hostinger config so Node route wins; verify body matches app |
| **Approval** | Ops + SEO |
| **Acceptance** | Staging robots = app staging text; production robots = `seo-approved/robots.txt` |
| **Regression** | Crawlability |
| **Deploy dep** | Before treating Hostinger as indexable prod; **promote to P0** if Hostinger is the cutover origin |

#### BL-P1-02 — Rebuild UAT so `next.` robots/sitemap return 200
| | |
|--|--|
| **Page** | https://next.gabbamedicalcentre.com.au/robots.txt , `/sitemap.xml` |
| **Exact path** | `apps/web` UAT dist `.next-uat`; routes above; `npm run uat:build` |
| **Root cause** | `.next-uat` missing compiled `robots.txt` / `sitemap.xml` app routes → Next **400**; Cloudflare tunnel is not the root cause |
| **Repair** | Clean `uat:build` + restart `uat`; confirm `:3100` and `next.` 200 |
| **Approval** | Eng |
| **Acceptance** | `:3100` and `next.` return 200; staging hosts still noindex via app logic |
| **Regression** | Authority SEO tooling only |
| **Deploy dep** | None for DNS; required for NEXT as SEO authority fidelity |

#### BL-P1-03 — Usman booking notice plain-language (F1)
| | |
|--|--|
| **Page** | `/doctors/dr-usman-gul.html` |
| **Exact path** | Published revision from `old-html/doctors/dr-usman-gul.html`; **not** `booking-restriction-notice.ts` |
| **Root cause** | Notice generic; OHO male/telehealth detail only in `#booking-conditions` |
| **Repair** | Approved wording beside CTA (see §2 F1 draft); keep HotDoc slug; sync NEXT CMS + Hostinger |
| **Approval** | **Clinical Principal** (mandatory) |
| **Acceptance** | Notice states male in-person + female telehealth-only per OHO; full conditions + OHO link remain; Book CTA unchanged slug |
| **Regression** | Single doctor profile + sticky inheritance |
| **Deploy dep** | Content publish + cache invalidate; both NEXT and Hostinger |

#### BL-P1-04 — Attraction authenticity hard stops (F2 subset)
| | |
|--|--|
| **Page** | `/join-our-team.html` + Attraction/PE hubs |
| **Exact path** | Media library + `join-our-team-recruitment.ts` / Attraction CMS content; gap report P0-1…P0-5 |
| **Root cause** | Concept photography, no consented voices, Flexible Sessions visual gap, EOI ownership, Index Gate undecided |
| **Repair** | Content/media/ops sprint — not patient homepage redesign |
| **Approval** | Owner + PM + Attraction stakeholders |
| **Acceptance** | Gap report P0 authenticity rows closed or written interim exception with expiry |
| **Regression** | Recruitment surfaces only |
| **Deploy dep** | Before public recruitment conversion claims / index flip |

#### BL-P1-05 — Attraction Index Gate decision (F7)
| | |
|--|--|
| **Page** | Attraction paths + sitemap |
| **Exact path** | `apps/web/src/attraction-cms/ev-shell.ts` (and sitemap allowlists under `apps/web/src/seo/` / approved sitemap) |
| **Root cause** | Soft-launch vs selective index undecided |
| **Repair** | Written decision; implement robots/sitemap only for approved set |
| **Approval** | SEO + Owner |
| **Acceptance** | Decision logged; live headers/sitemap match; tools/EOI never indexed |
| **Regression** | Crawl set |
| **Deploy dep** | After BL-P1-04 authenticity |

#### BL-P1-06 — Remove `next.` from public attraction pack text (Phase 1 M4)
| | |
|--|--|
| **Page** | Public asset consumed by candidates |
| **Exact path** | `apps/web/public/assets/attraction/opportunity-pack-summary.txt` |
| **Root cause** | Points operators/doctors at UAT host |
| **Repair** | Replace with apex URL or practice-approved contact path |
| **Approval** | PM |
| **Acceptance** | No `next.gabbamedicalcentre.com.au` in public attraction assets |
| **Regression** | Asset only |
| **Deploy dep** | Before recruitment soft-launch |

---

### P2 — Important, schedulable

#### BL-P2-01 — Warm-boot host candidates (Phase 1 M1)
| | |
|--|--|
| **Path** | `apps/web/src/documents/warm-public-delivery.ts` `hostCandidates()` |
| **Root cause** | Hardcoded staging + localhost hosts in production warm path |
| **Repair** | Prefer `WMC_WARM_HOSTNAMES` / production domains; drop hardcoded staging before prod |
| **Approval** | Eng |
| **Acceptance** | Prod warm uses prod hosts only |
| **Regression** | Cold-start warm set |
| **Class** | **P2** |

#### BL-P2-02 — Optional MedicalClinic `GeoCoordinates` (F5)
| | |
|--|--|
| **Path** | Golden/CMS MedicalClinic JSON-LD (not rewritten by `public-ux.ts`) |
| **Repair** | Add lat/long if SEO owner wants local-pack boost |
| **Approval** | SEO |
| **Class** | **P2** |

#### BL-P2-03 — Legacy `/locations/*` suburb URL policy (F5)
| | |
|--|--|
| **Path** | `apps/web/src/seo/wordpress-legacy-redirects.ts` (+ edge redirects at cutover) |
| **Repair** | Decide redirect map vs intentional 404 |
| **Approval** | SEO |
| **Class** | **P2** |

#### BL-P2-04 — Regenerate PEERS + CMS GP discoverability (F3)
| | |
|--|--|
| **Path** | `apps/web/public/site.js` + `old-html/site.js`; `inject-cms-practitioners.ts` |
| **Repair** | Regenerate PEERS including James/Yamesha; bust `siteJsHref`; **no hero strip change** without freeze exception |
| **Approval** | Eng + content |
| **Class** | **P2** |

#### BL-P2-05 — Practitioner photography (F4)
| | |
|--|--|
| **Path** | Doctor HTML revisions / CMS media (`old-html/doctors/dr-nirupa-sivathasan.html`, `mr-samuel-stafford.html`, Yamesha) |
| **Repair** | Approved portraits or intentional non-photo treatment |
| **Approval** | Practice + consent |
| **Class** | **P2** |

---

### P3 — Optional

| ID | Item | Path | Notes |
|----|------|------|-------|
| **BL-P3-01** | Byte-sync `site.js` em dash / EOF (F6) | `public/site.js`, `old-html/site.js` | No logic regression found |
| **BL-P3-02** | Vitest files vs workspace `tsc` | `lifecycle.test.ts`, `aggregate.test.ts` | Exclude or add vitest types |
| **BL-P3-03** | `/fees.html` alias | routing / redirects | Canonical is `/fees-billing.html` |
| **BL-P3-04** | Mary dual `tel:` (F8) | `old-html/doctors/dr-mary-abadir.html` | |
| **BL-P3-05** | Hero `alt=""` / &lt;44px (F9–F10) | `public-ux.ts` | **Freeze-bound** |
| **BL-P3-06** | Review schema (F11) | CMS/schema only if marketing asks | |
| **BL-P3-07** | Tel aria naming rule (F12) | `site.js`, `accessibility.ts` | Prefer non-hero first |

---

## 4. Explicit non-blockers / working as designed

- Insurance HotDoc slug notices via `booking-restriction-notice.ts` + `site.js` (Tanya path); Usman/Mary left alone by design.  
- Mary phone-only sticky.  
- Gemunu 404 expected.  
- Homepage hero authority v6 **frozen** — no redesign from these audits.  
- Durable cache acceptance **PASS** — do not reopen perf remediation.  
- Staging empty sitemap + HTML/`X-Robots-Tag` noindex.  
- Localhost references in docs/tests/scripts.  
- F6 hash drift without behavioural fork.  
- Full `next build` of tip not run in Phase 1 — schedule attestation, not a code defect by itself.

---

## 5. Recommended implementation order (confirmed P0 / P1 only)

Do **not** start fixes in this document pass. When work begins, execute in this order:

1. **BL-P0-01** — Complete production ops evidence (`LAUNCH.md`) — gates DNS forever until PASS.  
2. **BL-P0-02** — Production env attestation (`STAGING_NOINDEX` / tunnel flags unset on apex host).  
3. **BL-P1-02** — Rebuild UAT; prove `next.` `/robots.txt` + `/sitemap.xml` **200** (authority fidelity).  
4. **BL-P1-01** — Fix Hostinger/prod edge so app robots win (promote to P0 if Hostinger is cutover origin).  
5. **BL-P1-03** — Clinical-approved Usman notice wording → publish on NEXT + Hostinger.  
6. **BL-P1-04** — Attraction authenticity P0 sprint (media/voices/Flexible Sessions/EOI ownership).  
7. **BL-P1-05** — Record Attraction Index Gate; implement sitemap/robots allowlist.  
8. **BL-P1-06** — Strip `next.` from public attraction pack asset.  

Then schedule **P2** (warm hosts, PEERS, photos, geo, location redirects) and **P3** polish. Only after **BL-P0-01/02** (+ **BL-P1-01** if Hostinger is prod origin) consider DNS cutover.

---

## 6. Final statements

| Statement | Status |
|-----------|--------|
| Code / CMS / DB / deploy changed by this consolidation? | **No** |
| Production DNS changed? | **No** |
| Performance remediation reopened? | **No** |
| Hostinger made visually different from NEXT? | **No** |
| Overall DNS cutover | **NO-GO** |
| Next programme step after backlog acceptance | Execute §5 order; then ops cutover planning per `deployment/LAUNCH.md` |
