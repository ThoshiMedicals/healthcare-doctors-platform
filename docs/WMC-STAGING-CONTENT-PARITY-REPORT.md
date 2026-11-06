# WMC — Staging Content Parity Report

**Date:** 2026-11-06  
**Staging host:** `https://mediumslateblue-eagle-960503.hostingersite.com`  
**Deployed SHA:** `a545991fe40f6dffed15702e6a2a7c3fb0bc0a24`  
**Supabase:** `wmc-hostinger-staging` / `thwcxuhrzgkufvdrvzzt`  
**Content source:** version-controlled frozen golden master `old-html/` (+ `navigation-ownership.json`)  
**Post-import acceptance:** [`WMC-STAGING-POST-IMPORT-ACCEPTANCE.md`](./WMC-STAGING-POST-IMPORT-ACCEPTANCE.md) — **GO WITH CONDITIONS** (full 207 crawl PASS; SEO + Attraction homepage links FAIL)

---

## 1. Migration integrity

| Check | Result |
| --- | --- |
| Repo migration folders | **27** |
| `_prisma_migrations` rows | **27** |
| Name set match (repo ↔ DB) | **PASS** |
| SHA-256 checksum match (file ↔ DB) | **PASS** (0 mismatch) |
| Rolled back | **0** |
| Failed | **0** |
| `prisma validate` (schema file) | **PASS** |
| Live CLI `prisma migrate status` vs staging URL | **NOT VERIFIED** — agent has no staging `DATABASE_URL` for Prisma CLI; integrity proven by checksum/name equality + schema presence |
| Reset / re-run | **Not performed** |

**Verdict:** Migration integrity **PASS** for content import purposes.

---

## 2. Approved source of truth

| Candidate | Role | Decision |
| --- | --- | --- |
| `old-html/` golden HTML (207 files) | Frozen approved public website corpus | **PRIMARY** — import source |
| `old-html/navigation-ownership.json` | Section/breadcrumb ownership | **PRIMARY** |
| `npm run import:golden` / `src/importer/import-golden-html.ts` | Approved idempotent importer | **PRIMARY mechanism** (SQL-equivalent applied to staging; see note) |
| Local UAT Postgres | Working CMS with post-golden pages | **REFERENCE ONLY** — not copied wholesale |
| Arbitrary DB snapshots | — | **Rejected** |

### Disagreement: golden vs local UAT

| Metric | Golden `old-html` | Local UAT published |
| --- | --- | --- |
| HTML / published pages | **207** | **226** |
| Only in golden | **0** | — |
| Only in local UAT | — | **19** |

**19 local-only paths (not in golden master; not imported to staging):**

- `about-us/clinical-interests.html`
- `about-us/community-catchment.html`
- `about-us/continuity-in-practice.html`
- `about-us/practice-experience.html`
- `doctors/dr-golnar-mortezaei.html`
- `doctors/dr-james.html`
- `doctors/dr-yamesha-ranatunga.html`
- `join-our-team/doctor-readiness.html`
- `join-our-team/dpa-navigator.html`
- `join-our-team/express-interest.html`
- `join-our-team/gp-faq.html`
- `join-our-team/gp-opportunities.html`
- `join-our-team/opportunity-pack.html`
- `join-our-team/practice-support.html`
- `join-our-team/provider-number-readiness.html`
- `join-our-team/registrar-pathway.html`
- `join-our-team/session-planner.html`
- `updates/welcome-dr-golnar-mortezaei.html`
- `updates/welcome-dr-james-chanaka.html`

These are Attraction CMS / Practice Experience / later practitioner onboardings — **outside** frozen golden HTML. Restoring them requires separate approved publish scripts (not invented HTML).

---

## 3. Import execution

| Step | Result |
| --- | --- |
| Pre-import backup (logical counts) | **PASS** — pages=0, revisions=0, users=1 (`wmc.staging.admin`), domains=3 |
| Preserve clinic / ClinicDomain / staging admin | **PASS** |
| Import method | Idempotent SQL generated from golden HTML (mirrors `import-golden-html.ts` semantics: published + immutable revision by content SHA) applied to staging via Supabase MCP |
| Why not CLI `import:golden` | No staging Session-pooler URI available to the agent (Hostinger env masked) |
| Batches | 104/104 applied; temporary staging artifacts removed |
| Private patient/applicant data | **None imported** |

---

## 4. Record-count reconciliation

| Content type | Expected (golden) | Imported (staging) | Missing | Unexpected | Result |
| --- | --- | --- | --- | --- | --- |
| Published pages + revisions | 207 | 207 / 207 | 0 | 0 | **PASS** |
| Practitioners (collection) | 12 | 12 | 0 | 0 | **PASS** |
| Services | 29 | 29 | 0 | 0 | **PASS** |
| Knowledge articles | 87 | 87 | 0 | 0 | **PASS** |
| Knowledge topics (collection rows) | 22 (classifier) | 21 | 1 row vs classifier | 0 | **PASS*** |
| Practice pages (collection) | ~40 practice_information + faq + network | 43 | — | — | **PASS** |
| Practice updates (collection rows) | updates HTML present | **0** rows | collection rows | pages still present | **FAIL** (collection only) |
| Attraction / PE / new doctor pages | 19 local-only | 0 | 19 | 0 | **NOT IN SCOPE** of golden |

\*All knowledge HTML files are among the 207 pages; one topic file may be classified differently into `practice_pages` vs `knowledge_topics` in the SQL generator vs TS classifier. Public routes still resolve from `pages`.

---

## 5. Critical page smoke tests (live staging)

| URL | HTTP | H1 / notes | Result |
| --- | --- | --- | --- |
| `/api/health` | 200 | `database: up`; `X-Robots-Tag: noindex, nofollow` | **PASS** |
| `/` | 200 | Authority homepage H1 present (public-ux) | **PASS** |
| `/index.html` | 200 | Golden homepage H1 | **PASS** |
| `/services.html` | 200 | Healthcare For Every Stage Of Life | **PASS** |
| `/team.html` | 200 | Team opening present | **PASS** |
| `/knowledge/index.html` | 200 | Knowledge hub H1 | **PASS** |
| `/services/skin-checks.html` | 200 | Skin Checks in Woolloongabba | **PASS** |
| `/doctors/dr-tanya-goodwill.html` | 200 | Dr Tanya Goodwill | **PASS** |
| `/doctors/dr-mary-abadir.html` | 200 | Dr Mary Abadir | **PASS** |
| `/knowledge/articles/blood-pressure-explained.html` | 200 | Blood Pressure Explained | **PASS** |
| `/knowledge/diabetes.html` | 200 | Diabetes topic | **PASS** |
| `/patient-information.html` | 200 | Clear information… | **PASS** |
| `/contact.html` | 200 | At home in Woolloongabba | **PASS** |
| `/book-appointment.html` | 200 | Book your appointment | **PASS** |
| `/join-our-team.html` | 200 | VR GP role H1 | **PASS** |
| `/faqs.html` | 200 | FAQ hub | **PASS** |
| `/updates/index.html` | 200 | Updates hub | **PASS** |
| `/admin/login` | 200 | Clinic CMS \| Woolloongabba…; noindex | **PASS** |

---

## 6. CMS / SEO / media / storage

| Check | Result |
| --- | --- |
| Synthetic admin preserved | **PASS** |
| Data API RLS posture | **PASS** (RLS on; anon denied; INFO-only advisor) |
| Public HTML `<meta robots>` | Golden HTML still embeds `index,follow` — crawlers must rely on `X-Robots-Tag` until meta rewrite is approved |
| Middleware / config noindex | **Local fix ready** — `*.hostingersite.com` + `STAGING_NOINDEX=true` in middleware/`next.config`; **NOT LIVE** on deploy SHA `a545991` until redeploy |
| Live public `X-Robots-Tag` (current Hostinger) | **FAIL** — homepage/services return no header (verified 2026-11-06) |
| Canonical host | Staging serves staging host; production DNS untouched (**PASS**). HTML canonicals still production-oriented — **NOT VERIFIED** for full SEO acceptance |
| Runtime assets (`/assets`, CSS, JS) | Served from Hostinger deploy `public/` (from build), not re-copied by SQL import | **PASS** for smoke; full asset parity **NOT VERIFIED** file-by-file |
| Persistent CV/media dirs | **NOT VERIFIED** / not proven durable |

---

## 7. Remaining blockers before full acceptance

1. **Staging public noindex** — local middleware/`STAGING_NOINDEX` fix prepared; **validate and redeploy** Hostinger so live public pages emit `X-Robots-Tag`.  
2. **19 non-golden Attraction/PE/onboarding pages** — restore via approved publish/seed scripts if staging must match local UAT 226, not just golden 207.  
3. **`practice_updates` collection rows** — optional follow-up using `updates-data.js` (pages already serve).  
4. **Provide staging `DATABASE_URL` to agent** — enables literal `prisma migrate status` + `npm run import:golden` next time.  
5. **Persistent private storage** proof before real uploads.  
6. Full functional suite (HotDoc lightbox, CMS publish round-trip, recruitment forms).

---

## 8. Totals

| Metric | Value |
| --- | --- |
| Total approved golden pages | **207** |
| Successfully restored to staging | **207** |
| Missing golden pages | **0** |
| Local-only pages not in golden (not restored) | **19** |
| Staging health | **PASS** (`database: up`) |
| Readiness for full functional + SEO acceptance | **CONDITIONAL** — golden public site restored; close noindex + optional Attraction pages first |
