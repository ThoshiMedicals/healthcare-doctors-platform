# Woolloongabba Medical Centre — Master Brain

**Single source of truth** for the Healthcare Doctors / Woolloongabba Medical Centre (WMC) platform.

| Field | Value |
| --- | --- |
| Document | `docs/WMC-MASTER-BRAIN.md` |
| Maintained for | Developers, AI agents, project managers |
| Repo | `ThoshiMedicals/healthcare-doctors-platform` (local: `WMC-Master-Project`) |
| Last updated | 2026-11-03 |
| Companion rule | `.cursor/rules/wmc-working-memory.mdc` (operator tip / hosting — refresh when tip SHA changes) |
| Production guide | `deployment/LAUNCH.md` **only** |

### Governing document set

| Document | Role |
| --- | --- |
| **This file — Master Brain** | Permanent product / architecture / status SSOT |
| [`docs/WMC-DECISION-REGISTER.md`](./WMC-DECISION-REGISTER.md) | Permanent log of major product/architecture decisions |
| [`docs/WMC-DEVELOPMENT-STANDARDS.md`](./WMC-DEVELOPMENT-STANDARDS.md) | How to code, CMS, public UX, deploy hygiene, governance |
| [`docs/WMC-OPERATIONS-RUNBOOK.md`](./WMC-OPERATIONS-RUNBOOK.md) | How to run UAT, VPS, DNS, backups, rollback, Cloudflare, smoke |
| `deployment/LAUNCH.md` | Production command authority (runbook points here) |
| `deployment/DNS-CUTOVER-CHECKLIST.md` | Cutover GO / NO-GO gate |
| `docs/WMC-PRODUCTION-READINESS-EVIDENCE.md` | Filed ops evidence for 8 cutover blockers |
| `docs/WMC-CLINIC-2-SELECTION-AUDIT.md` | Which clinic should be live tenant #2 |
| `docs/WMC-CONTENT-MATURITY-AUDIT.md` | Service/knowledge maturity scores |
| `docs/WMC-CONTENT-MATURITY-PROGRAM.md` | Top 20 content maturity backlog (no new pages/diagrams) |
| `docs/WMC-CONTENT-MATURITY-WAVE1-REPORT.md` | Wave 1 CM-01…CM-04 implementation report |
| `docs/WMC-CONTENT-MATURITY-PHASE1-REPORT.md` | Earlier CM-01…CM-06 pass (superseded scope by Wave 1) |
| `docs/WMC-HEALTHCARE-DOCTORS-CANONICAL-CONTENT.md` | Network Canon vs Flagship vs Local classification + roadmaps |
| `docs/WMC-CANON-EXTRACTION-FRAMEWORK.md` | Flagship → Network Canon promotion workflow |
| `docs/WMC-CANON-REGISTRY-V1.md` | **Canon Registry v1** — C0 inventory lock (hubs / articles / Flagship service education) |
| `docs/WMC-CANON-REGISTRY.md` | Pointer to current Canon registry lock |
| `docs/WMC-CANON-GOVERNANCE-SPECIFICATION.md` | Canon ownership, lifecycle, purity, versioning, audit, adopt (policy) |
| `docs/WMC-CANON-PHASE-C0-C2-REPORT.md` | C0–C2 preparation report + readiness score |

Master Brain does **not** replace LAUNCH.md for production commands. Standards, Runbook, and Decision Register are companions; they must stay consistent with this file. New irreversible choices belong in the Decision Register (with a Master Brain cross-link when status or modules change).

**How to use this document**

1. Read §1–3 for product intent and brand.
2. Read §4–6 and §21 for architecture (public → CMS → admin).
3. Read §7–15 for product modules.
4. Read §16–17 before any deploy or public change; execute via Operations Runbook + LAUNCH.md.
5. Read §18–20 for planning; do not treat chat history as authority.
6. Read §22–23 for ownership and how to keep this brain current.
7. Follow Development Standards while implementing; follow Operations Runbook while operating.
8. Before reversing strategy, read the [Decision Register](./WMC-DECISION-REGISTER.md) — do not rely on chat memory.

**Maintenance rule:** When tip SHA, hosting model, cutover status, or a major module ships, update §16, §19, the working-memory Cursor rule, and (if procedure changed) Standards / Runbook in the same change set. When a major product/architecture choice is made or superseded, append the [Decision Register](./WMC-DECISION-REGISTER.md). See §23.

---

## Table of contents

1. [Project Vision](#1-project-vision)
2. [Brand Positioning](#2-brand-positioning)
3. [Design System](#3-design-system)
4. [Public Website Architecture](#4-public-website-architecture)
5. [CMS Architecture](#5-cms-architecture)
6. [Admin Architecture](#6-admin-architecture)
7. [Practitioner Authority Strategy](#7-practitioner-authority-strategy)
8. [Service Authority Strategy](#8-service-authority-strategy)
9. [Health Advice Strategy](#9-health-advice-strategy)
10. [Careers Platform](#10-careers-platform)
11. [Applications Platform](#11-applications-platform)
12. [Patient Operations Centre](#12-patient-operations-centre)
13. [Search & Content Opportunity Centre](#13-search--content-opportunity-centre)
14. [Media Library Platform](#14-media-library-platform)
15. [Dashboard Architecture](#15-dashboard-architecture)
16. [Current Production Status](#16-current-production-status)
17. [Known Constraints](#17-known-constraints)
18. [Strategic Roadmap](#18-strategic-roadmap)
19. [Completed Milestones](#19-completed-milestones)
20. [Future Opportunities](#20-future-opportunities)
21. [Platform architecture diagram](#21-platform-architecture-diagram)
22. [Ownership model](#22-ownership-model)
23. [Master Brain maintenance workflow](#23-master-brain-maintenance-workflow)

---

## 1. Project Vision

WMC is a **clinic-first digital practice operating system** for Woolloongabba Medical Centre under the Healthcare Doctors network brand.

**Outcomes that matter**

- Patients find the right doctor/service quickly and book (or call) safely via HotDoc / phone.
- Clinically governed health advice stays accurate, review-dated, and fail-closed on publish.
- Reception and administration run day-to-day queues (forms, careers, media hygiene) from one admin.
- Practice leadership sees “what needs attention today” without a generic SaaS redesign of the public site.

**What this is not**

- Not a marketing CMS that regenerates page layouts.
- Not a multi-clinic syndication product yet (schema supports Network/Clinic; one live tenant).
- Not a reputation/star-rating platform (brand forbids testimonials and stars).

**Platform phase:** `golden-import` (`apps/web/src/platform.ts`) — public pages are served from **immutable golden-master HTML revisions** imported from `old-html/`.

---

## 2. Brand Positioning

| Attribute | Position |
| --- | --- |
| Practice name | Woolloongabba Medical Centre |
| Network | Healthcare Doctors |
| Geography | Woolloongabba / Brisbane local care |
| Trust signals | AGPAL accreditation, clinical governance, team-based care, factual photography |
| Booking | HotDoc lightbox on `hotdoc.com.au` (clinic + practitioner URLs) |
| Tone | Factual healthcare editorial — premium, local, human; not “best doctor” claims |

**Hard brand rules** (see `apps/web/reports/BRAND_POLISH_4G.md`)

- Do **not** add testimonials or star ratings.
- Do **not** invent accreditation, AHPRA, or review dates.
- Do **not** claim superiority (“best GP”, etc.).
- AGPAL mark and `agpal-accreditation.html` are governed brand assets, not decorative filler.

**About / trust paths** (`ABOUT_PATHS` in `apps/web/src/cms/modules.ts`) include about, philosophy, story, community, local access, AGPAL, network, Join Our Team, team-based care.

---

## 3. Design System

Public design is **locked to the golden HTML + CSS package**, not a separate design-token CMS.

| Layer | Location | Role |
| --- | --- | --- |
| Golden HTML | `old-html/` | Approved public markup — **do not edit** without a written exception naming the file |
| Public CSS / assets | Served via imported revisions + `apps/web/public/` | Layout, photography, icons |
| Runtime JS | `apps/web/public/site.js` (keep `old-html/site.js` in sync for shared behaviour) | Nav, PEERS, forms, HotDoc labels, client injects |
| Digital Reception | `apps/web/public/digital-reception.js` | On-site search / intent measurement beacon |
| Presentation overlays | `apps/web/src/documents/public-ux.ts` | Cache busts, nav injects, form actions, careers/patient wiring — **no layout redesign** |
| Image policy | `apps/web/public/assets/IMAGE_LIBRARY.json` | Institutional image governance categories / crop rules |

**Cache busting:** Prefer versioned query strings on `styles.css`, `site.js`, `digital-reception.js` inside `public-ux.ts` (e.g. `?v=wmc-…`). Origin may send `Cache-Control: no-cache` for `/site.js`; Cloudflare edge can still cache until purged.

**Admin UI:** Practical clinic CMS chrome (slate borders, link KPI cards, `Field` / `SaveBar` / `GateNotice`) — extend existing patterns; do not invent a new admin design system.

---

## 4. Public Website Architecture

```
Browser
  → Host resolve (ClinicDomain / tunnel host)  [apps/web/src/clinics/host.ts, resolve-clinic.ts]
  → Load Page by path for clinic
  → Require publishedRevision.immutable
  → Overlay CMS publishedPayloads onto golden HTML  [overlay.ts]
  → applyPublicUxRefinements + a11y/perf/favicon  [public-ux.ts, render-published-document.ts]
  → HTML response
```

**Key principles**

- HTML body structure comes from the golden import — overlays change **approved slots** (name, bio, HotDoc URL, vacancy inject, etc.).
- Managed images may rewrite through `/api/managed-image/…`.
- Measurement / Digital Reception beacons post privacy-scoped signals (search demand), not raw PII dashboards.
- Booking grammar: HotDoc lightbox; insurance notices only for the data-driven slug `does-not-bulk-bill-for-insurance-patients`; Mary = phone-only (`tel:`) — do not invent notices for other practitioners.

**Local UAT vs public apex**

| Environment | URL / port | Notes |
| --- | --- | --- |
| Dev | `localhost:3000` | `npm run dev`, distDir `.next` |
| UAT | `127.0.0.1:3100` | `npm run uat:build` then `npm run uat`, distDir `.next-uat` |
| `next.` staging hostname | Cloudflare tunnel → `:3100` | **This Windows PC**, not a remote VPS app (operator setup) |
| Production apex | Per `LAUNCH.md` on VPS | DNS cutover gated — see §16 |

---

## 5. CMS Architecture

**Stack:** Next.js 15 (App Router) · Prisma · PostgreSQL · Auth.js / credentials · Resend (optional notify).

**Core content model**

| Entity | Purpose |
| --- | --- |
| `Clinic` / `Network` / `ClinicDomain` | Multi-tenant foundation (one live clinic today) |
| `Page` + `PageRevision` | Path + immutable published HTML (`contentSha256`) |
| `Practitioner` / `Service` / `Knowledge*` / `PracticeUpdate` / `PracticePage` | Typed content with `publishedPayload` overlays |
| `ClinicalReview` | Per-page clinical governance record |
| `ContentRevision` | Entity field history (`previous` / `next` JSON) |
| `MediaAsset` | Image catalogue + governance metadata |
| `Vacancy` / `CareerApplication` | Careers |
| `FormRequest` | Patient website form inbox |
| `SearchDemandSignal` | Privacy-scoped search demand (~90-day retention) |
| `AuditLog` | Action audit trail |

**Publish model**

- Editors draft → submit → clinical sign-off → practice approve → publish (`apps/web/src/cms/release.ts`).
- **Fail-closed gates:** `apps/web/src/cms/publish-gates.ts` (`evaluateContentPublication`).
- Image file replacement: propose → approve → publish with pixel/format lock (`image-replacement.ts`) for logo / hero / exterior / verified portraits only.

**Roles** (`MembershipRole` + `apps/web/src/auth/permissions.ts`)

| Role band | Typical powers |
| --- | --- |
| `content_editor` / `editor` | `edit`, `submit_for_review` |
| `clinic_admin` (+ network/super) | Edit + clinical_signoff + publish + `manage_settings` + rollback |
| `super_admin` / `network_admin` | Above + `create_users` / `switch_clinic` |
| Reviewer / approver / publisher-only roles | Narrow workflow actions; limited or empty nav |

---

## 6. Admin Architecture

**Nav contract:** `CMS_MODULES` in `apps/web/src/cms/modules.ts` — locked by `apps/web/src/security/admin-hardening.test.ts`. Changing modules requires updating the approved test list.

| Group | Modules | Gate |
| --- | --- | --- |
| Content | Pages, Practitioners, Services, Vacancies, Applications, Media Library | `edit` |
| Operations | Patient Requests | `edit` |
| Insights | Practice briefing, Website overview, Online search, Search & content opportunities, Doctor profiles, Service pages, Booking journey | `manage_settings` |
| Governance | Content reviews, Review board, Review due dates, Image reviews | `clinical_signoff` |

**Pages hub** also reaches Knowledge, Updates, About/Patient Information, Navigation ownership (not all are top-level nav items).

**Practice Briefing** (`/admin`) leads with **Needs attention today** (Action Centre) then KPI strips, then command-centre health / recommended actions / alerts. Assembler: `practice-operations-dashboard.ts`. UI: `practice-action-centre.tsx`.

---

## 7. Practitioner Authority Strategy

**Goal:** Public doctor profiles that are Hub / Developing / Thin by **on-site authority graph** (content depth, internal linking, measurement) — **not** clinical quality ratings.

| Piece | Location |
| --- | --- |
| Scoring framework | `apps/web/src/measurement/authority-framework.ts` |
| Dashboard builder | `practitioner-authority-report.ts` |
| Admin UI | `/admin/practitioner-authority` (“Doctor profiles”) |
| Search-index tiers | `apps/web/public/search-index/` |
| Evidence reports | `apps/web/reports/PRACTITIONER_AUTHORITY_4E.md`, QA2 / QA11 |
| Demand → backlog | [`WMC-AUTHORITY-GROWTH-ENGINE.md`](./WMC-AUTHORITY-GROWTH-ENGINE.md) (Thin Practitioner lane) |

**Operating loop:** Identify Thin profiles → enrich governed content → re-score → improve discoverability and booking paths. Ranked with patient demand via the Authority Growth Queue.

**Constraints:** Portrait swaps must stay pixel-compatible; HotDoc URLs stay on hotdoc.com.au; phone-only practitioners (e.g. Mary) must not gain invented HotDoc/insurance notices.

---

## 8. Service Authority Strategy

**Goal:** Service pages as local care authority hubs (women’s health, skin, ADHD referrals, etc.), scored similarly to practitioners.

| Piece | Location |
| --- | --- |
| Dashboard | `/admin/service-authority` |
| Builder | `service-authority-report.ts` |
| Content editing | `/admin/services/[id]` over golden HTML via overlays |
| Opportunity join | Search & Content Opportunity Centre (demand vs thin services) |
| Growth backlog | [`WMC-AUTHORITY-GROWTH-ENGINE.md`](./WMC-AUTHORITY-GROWTH-ENGINE.md) (Thin Service + Internal-Link lanes) |

Service imagery is largely HTML-locked; Media Library browse links help inspect usage — replacements follow governance rules, not free-form CMS image pickers on locked regions.

---

## 9. Health Advice Strategy

Knowledge Centre = **healthcare authority articles and topic hubs**, not a blog (`collections.ts`).

| Piece | Location |
| --- | --- |
| Models | `KnowledgeTopic`, `KnowledgeArticle` |
| Admin | `/admin/knowledge` (+ topics) |
| Workflow | Draft → clinical review → approved → published |
| Clinical review | `ClinicalReview` + `/admin/governance*` |
| Checklist flags | SEO, source verification, internal links, accessibility on articles |

**Patient safety posture:** Publish gates refuse incomplete governance evidence. Expiry / due-date queues keep advice from going stale. Public review strips depend on a populated published governance registry (known gap if empty).

---

## 10. Careers Platform

| Piece | Detail |
| --- | --- |
| Public page | `join-our-team.html` (employer-brand presentation via public-ux injects) |
| Model | `Vacancy` — statuses include now_hiring, expression_of_interest, future_opportunity, closed; `active` flag |
| Admin | `/admin/careers/vacancies` |
| Inject | Active vacancies rendered into Join Our Team at document render |
| Nav | Content → Vacancies |

Careers is **clinic-scoped** — not a network talent marketplace.

---

## 11. Applications Platform

| Piece | Detail |
| --- | --- |
| Model | `CareerApplication` — new, reviewing, interview, offer, hired, rejected, closed |
| Source | Talent Community form (`data-talent-community-form`) → `/api/clinics/[clinicSlug]/career-applications` |
| Admin | `/admin/careers/applications` (+ detail, notes, assignment, resume storage) |
| Briefing KPIs | Open vacancies, applications today, awaiting review, interviews, hired this month |
| Notify | Optional email via existing notify patterns |

Treat applications as an **HR ops inbox**, not a full ATS (no Seek/LinkedIn sync in-product).

---

## 12. Patient Operations Centre

| Piece | Detail |
| --- | --- |
| Model | `FormRequest` + `FormRequestStatus` |
| Types | Patient Registration, Medical Records, Contact Request, Feedback, General Request, Other |
| Public | Forms with `data-patient-form-request` POST to `/api/clinics/[clinicSlug]/form-requests` |
| Admin | `/admin/operations/patient-requests` — search, filters, assignment, notes, status history |
| Audit | History JSON + `AuditLog` / `ContentRevision` on updates |
| Briefing | New / assigned / waiting / overdue / closed-this-week KPIs |

**Not** a clinical messaging or EMR system — reception/admin follow-up for website forms only.

---

## 13. Search & Content Opportunity Centre

| Piece | Detail |
| --- | --- |
| Signal model | `SearchDemandSignal` (privacy-scoped; retention ~90 days) |
| Ingest | Digital Reception / search-signals API |
| Admin | `/admin/search-opportunities` |
| Report | `search-opportunity-report.ts` — top/rising/no-result terms, opportunity score, freshness, gap alerts |
| Related | Digital Reception dashboard (`/admin/digital-reception`) for intent resolution |

**Principle:** Measure patient demand gaps and turn them into governed content/authority work — not vanity SEO scores or AI-generated article spam.

**Authority Growth Engine:** SCO is a primary input to the unified Growth Queue ([`WMC-AUTHORITY-GROWTH-ENGINE.md`](./WMC-AUTHORITY-GROWTH-ENGINE.md); [DEC-2026-13](./WMC-DECISION-REGISTER.md#dec-2026-13)). Future Top 20 UI lives on this surface; no separate Insights module.

---

## 14. Media Library Platform

| Surface | Route | Permission | Role |
| --- | --- | --- | --- |
| Media Library | `/admin/media` | `edit` | Catalogue: grid/list, search, filters, upload to `assets/library/`, metadata |
| Image reviews | `/admin/image-governance` | `clinical_signoff` | Rights, expiry, alt governance, pixel-matched replacement workflow |

| Piece | Location |
| --- | --- |
| Model | `MediaAsset` (+ category, title, byteSize, dimensions, lastUsedAt) |
| Sync / usage | `media-library.ts` — disk + published HTML usage |
| Categories | Practitioners, Services, Knowledge Hub, Careers, General, Authority Diagrams, Patient Information |
| Briefing widgets | Assets, unused, missing alt, recent uploads |

Uploads to the library do **not** auto-place on public pages. Locked regions stay locked to avoid broken paths.

---

## 15. Dashboard Architecture

```
Practice Briefing (/admin)          ← Action Centre + ops KPIs + command centre
├── Website overview                /admin/executive
├── Online search (Digital Reception) /admin/digital-reception
├── Search & content opportunities  /admin/search-opportunities
├── Doctor profiles                 /admin/practitioner-authority
├── Service pages                   /admin/service-authority
├── Booking journey                 /admin/conversion-intelligence
└── Governance boards               /admin/governance*
```

**Shared behaviours**

- Insights persona / range filters / live vs demo data modes.
- Recommended actions that deep-link into queues.
- Measurement events contract (`apps/web/src/measurement/types.ts`) + warehouse/demo feeds.
- Exports where implemented (CSV/PDF management packs).

**QA evidence packs:** `apps/web/reports/` — QA6 booking, QA8 command centre, QA9 executive, QA10 Digital Reception, QA11 authority, plus `DASHBOARD_DEPLOYMENT_STATUS.md`, `PRACTICE-OPERATIONS-DASHBOARD.md`.

---

## 16. Current Production Status

| Item | Status (as of 2026-11-03) |
| --- | --- |
| Release tip to ship | **`3875dc3`** on branch `rg01-release-gate-repairs` |
| Full SHA | `3875dc34edae2bf39cb591835455484876803acc` |
| Artifact | `deployment/RELEASE-ARTIFACT-MANIFEST.md` |
| DNS cutover | **NO-GO** — `deployment/DNS-CUTOVER-CHECKLIST.md` + [`WMC-PRODUCTION-READINESS-EVIDENCE.md`](./WMC-PRODUCTION-READINESS-EVIDENCE.md) |
| Product readiness | Advanced single-clinic OS; many L1/L7 readiness artefacts CLEAR historically |
| Blocking cutover | 8 ops items FAIL (2026-11-03): off-box backup, VPS `AUTH_*`, VPS DB, CF Full (strict), origin cert, VPS smoke, rollback package, DNS rollback values |
| `next.` hostname | Local UAT `:3100` + `cloudflared` (not VPS) |
| Public DNS | Leave on current production site until GO |
| Local work beyond tip | Careers employer-brand / patient ops / media library / Practice Briefing Action Centre may exist as uncommitted or post-tip local work — **ship only from a known SHA** |

**Do not claim GO** if deploy ≠ commit, Postgres down, or ops evidence missing.

---

## 17. Known Constraints

### Product / content

1. Golden master `old-html/` — exception must name the file (`deployment/SOURCE-CONTROL.md`).
2. `GOLDEN_HTML_FROZEN = true` — public HTML from immutable DB revisions.
3. Presentation changes via `public-ux.ts` (and related documents modules), not ad-hoc HTML rewrites.
4. No Phase 1B public redesign unless explicitly requested.
5. Preserve SEO, schema.org, HotDoc lightbox, governance strips, approved layout.
6. Insurance notices only for the insurance HotDoc slug model; Mary phone-only; do not invent Usman/Gemunu paths.
7. No testimonials / star ratings.
8. External `NetworkLocation` suburbs are directory stubs until each has an approved HTML corpus.

### Engineering / ops

9. Production deploy path = `deployment/LAUNCH.md` only (Hostinger / Cloudflare Pages = fail paths).
10. Do not commit `.env`, secrets, or patient data.
11. Prefer PowerShell on this workstation; no bash `&&` assumptions in agent docs for Windows.
12. `uat:build` may dirty `next-env.d.ts` toward `.next-uat/types` — restore before commit.
13. Safe npm audit patches OK; **do not** `npm audit fix --force` (Next 16 / zod 4) on cutover day.
14. Keep `apps/web/public/site.js` and `old-html/site.js` aligned when changing shared runtime.
15. Edge cache: prefer `?v=` busts; CF purge is operator/dashboard unless credentials provided.

---

## 18. Strategic Roadmap

Horizon classification for the next ~24 months (practice/patient outcomes first). Detail canvas: Cursor canvas `wmc-platform-roadmap-24m`.

### Now (0–3 months)

- Clear LAUNCH.md ops evidence → lift DNS cutover from NO-GO.
- Populate ClinicalReview → published governance registry (public strips).
- Run Practice Briefing Action Centre as daily BAU.
- Close remaining booking-funnel QA friction.
- Establish live measurement warehouse habit after apex traffic.

### Next (3–12 months)

- Grow practitioner/service authority from Thin → Hub using opportunity queues.
- Reduce Digital Reception unmatched intents via SearchDemandSignal.
- Expand clinical review coverage + image governance completeness.
- Deepen conversion coaching from booking journey analytics.
- Keep careers employer-brand improvements clinic-scoped under golden HTML.

### Later (12–24 months)

- Second live clinic tenant (approved HTML corpus + domain + import).
- Network admin reporting once ≥2 live tenants.
- Optional HotDoc completed-booking attribution if partnership allows.
- Light cross-clinic vacancy visibility after multi-tenant content model.
- Scheduled warehouse ingest when manual merge becomes a bottleneck.

### Never (or explicit product decision required)

- Phase 1B redesign of golden public HTML.
- Testimonials / star-rating widgets.
- Google-review CRM as first-class CMS without a separate decision.
- Treating NetworkLocation stubs as live clinics without golden import.
- Hostinger / Cloudflare Pages production path.
- Invented booking restriction notices outside the insurance slug model.

**Maturity snapshot (2026-11-03 audit):** overall ~62/100; mean capability ~3.1/5 — strong single-clinic OS; thin multi-clinic syndication and reputation.

---

## 19. Completed Milestones

High-level delivered capabilities (evidence under `apps/web/reports/` and `deployment/`):

| Milestone | Evidence / surface |
| --- | --- |
| Golden HTML import + immutable revisions | `platform.ts`, importer, PageRevision |
| Overlay CMS for practitioners/services/knowledge/updates | `overlay.ts`, admin editors |
| Fail-closed publish + clinical governance | publish-gates, `/admin/governance*` |
| HotDoc booking grammar + insurance notices | booking-restriction-notice, public-ux, HotDoc QA |
| Practitioner & service authority dashboards | `/admin/practitioner-authority`, `/admin/service-authority` |
| Digital Reception + measurement 2G | digital-reception.js, measurement reports, QA10 |
| Executive / conversion / command centre | `/admin/executive`, conversion-intelligence, briefing |
| Careers vacancies + Talent Community applications | Vacancy, CareerApplication, careers admin |
| Patient Operations Centre (FormRequest inbox) | `/admin/operations/patient-requests` |
| Search & Content Opportunity Centre | SearchDemandSignal, `/admin/search-opportunities` |
| Media Library (+ Image reviews retained) | `/admin/media`, `/admin/image-governance` |
| Practice Briefing Action Centre + KPI strips | practice-operations-dashboard, `/admin` |
| Release artifact `3875dc3` (Phase 1B/1C authority + insurance gate) | RELEASE-ARTIFACT-MANIFEST, DNS checklist |
| Phone-only practitioner booking hotfix | `hotfix/wmc-phone-only-practitioner-booking-20261101` |

QA corpus: Homepage → Knowledge → Booking → Trust → Command Centre → Executive → Digital Reception → Authority (QA1–QA11) and maturity audits A8/B8/C8/D8.

---

## 20. Future Opportunities

Prioritised by patient outcome and practice revenue/ops — not generic feature creep.

| Opportunity | Value | Depends on |
| --- | --- | --- |
| Production apex cutover | Real traffic + real measurement | LAUNCH.md ops evidence |
| Authority growth sprints | More qualified HotDoc starts | [Authority Growth Engine](./WMC-AUTHORITY-GROWTH-ENGINE.md) ([DEC-2026-13](./WMC-DECISION-REGISTER.md#dec-2026-13)) + clinical reviewers |
| Intent coverage improvement | Fewer “no result” patient searches | SearchDemandSignal BAU |
| Governance registry completion | Trust strips truthful on public pages | ClinicalReview publish pipeline |
| Second clinic OS clone | Network brand consistency | New golden HTML corpus |
| HotDoc completion attribution | True conversion (not click proxies) | Partner/API access |
| Cross-clinic recruitment visibility | Faster roster fill across locations | Multi-tenant content model |
| GSC / external demand ingest | Richer opportunity intel | Privacy + product decision |
| Reputation ops (if ever) | Separate product decision | Brand exception — stars still forbidden |

---

## Quick reference — where to change what

| Intent | Start here |
| --- | --- |
| Public presentation tweak | `apps/web/src/documents/public-ux.ts` |
| Public JS behaviour | `apps/web/public/site.js` (+ sync `old-html/site.js`) |
| Admin nav module | `apps/web/src/cms/modules.ts` + `admin-hardening.test.ts` |
| Permissions | `apps/web/src/auth/permissions.ts` |
| Schema | `apps/web/prisma/schema.prisma` + migrations |
| Coding / CMS / UX standards | [`docs/WMC-DEVELOPMENT-STANDARDS.md`](./WMC-DEVELOPMENT-STANDARDS.md) |
| UAT / deploy / DNS / backup | [`docs/WMC-OPERATIONS-RUNBOOK.md`](./WMC-OPERATIONS-RUNBOOK.md) |
| Why we chose X (decision log) | [`docs/WMC-DECISION-REGISTER.md`](./WMC-DECISION-REGISTER.md) |
| Second clinic readiness | [`docs/WMC-SECOND-CLINIC-READINESS.md`](./WMC-SECOND-CLINIC-READINESS.md) |
| Multi-clinic content architecture | [`docs/WMC-MULTI-CLINIC-CONTENT-ARCHITECTURE.md`](./WMC-MULTI-CLINIC-CONTENT-ARCHITECTURE.md) |
| Authority Growth Engine | [`docs/WMC-AUTHORITY-GROWTH-ENGINE.md`](./WMC-AUTHORITY-GROWTH-ENGINE.md) ([DEC-2026-13](./WMC-DECISION-REGISTER.md#dec-2026-13)) |
| Production deploy commands | `deployment/LAUNCH.md` |
| Cutover gate | `deployment/DNS-CUTOVER-CHECKLIST.md` + `docs/WMC-PRODUCTION-READINESS-EVIDENCE.md` |
| Branch / freeze policy | `deployment/SOURCE-CONTROL.md`, `RELEASE-WORKFLOW.md` |
| Operator tip / next. hosting | `.cursor/rules/wmc-working-memory.mdc` |
| 24-month strategy | §18 + canvas `wmc-platform-roadmap-24m` |

---

## 21. Platform architecture diagram

End-to-end view of how public, CMS, admin, and ops environments relate. Detail for each layer remains in §4–§6 and §15.

```text
                         ┌─────────────────────────────────────┐
                         │         Cloudflare (DNS/SSL)         │
                         │   Full (strict) · not Pages/Hostinger │
                         └───────────────┬─────────────────────┘
                                         │ public traffic (after GO)
                                         ▼
┌──────────────┐   tunnel    ┌──────────────────┐   compose    ┌─────────────────┐
│ Operator PC  │────────────►│ next. (optional) │              │  Production VPS │
│ UAT :3100    │  cloudflared│ → local UAT only │              │  Nginx → Next   │
│ Dev  :3000   │             └──────────────────┘              │  Postgres (priv)│
└──────┬───────┘                                               └────────┬────────┘
       │ import / migrate / seed                                         │
       ▼                                                                 ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                         PostgreSQL (clinic-scoped data)                        │
│  Page + immutable PageRevision (golden HTML) · overlays · ClinicalReview       │
│  Vacancy / CareerApplication · FormRequest · MediaAsset · SearchDemandSignal   │
└──────────────────────────────────────────────────────────────────────────────┘
       ▲ serve published HTML                              ▲ edit / publish
       │                                                   │
┌──────┴──────────────┐                         ┌─────────┴────────────────────┐
│ Public site         │                         │ Admin CMS (/admin)             │
│ old-html → revision │                         │ Content · Ops · Insights · Gov │
│ overlay + public-ux │                         │ Practice Briefing Action Centre│
│ site.js · HotDoc    │                         │ Fail-closed publish gates      │
└─────────────────────┘                         └────────────────────────────────┘

Document ownership:
  Master Brain ──► product truth
  Decision Register ──► why major choices were locked
  Development Standards ──► how to change code safely
  Operations Runbook + LAUNCH.md ──► how to run and cut over
```

**Environment rule:** Laptop UAT / `next.` ≠ VPS staging smoke ≠ production apex. Cutover requires LAUNCH ops evidence (§16).

---

## 22. Ownership model

Who is accountable for keeping the platform truthful and operable.

| Domain | Primary owner | Accountable artefacts | Secondary |
| --- | --- | --- | --- |
| Product / architecture SSOT | Platform owner / tech lead | **This Master Brain** | PM reviews roadmap §18–20 |
| Decision log | Tech lead + practice sponsor | `WMC-DECISION-REGISTER.md` | Engineers append; do not delete history |
| Development standards | Tech lead | `WMC-DEVELOPMENT-STANDARDS.md` | All engineers / AI agents |
| Day-2 operations | Platform operator (Super Admin) | `WMC-OPERATIONS-RUNBOOK.md`, `LAUNCH.md` | Practice Manager on go-live checks |
| DNS cutover GO/NO-GO | Platform operator + practice sponsor | `DNS-CUTOVER-CHECKLIST.md`, `WMC-PRODUCTION-READINESS-EVIDENCE.md` | Rollback owner named on cutover day |
| Clinical content publish | Clinic Admin + clinical reviewers | Governance modules, publish gates | Content Editors submit only |
| Public layout / brand | Practice + brand guardian | Golden HTML freeze, BRAND_POLISH rules | Devs via `public-ux.ts` only |
| Tip SHA / working memory | On-call implementer for the release | `.cursor/rules/wmc-working-memory.mdc`, §16 | Must match shipped commit |
| Patient / careers queues | Reception / practice admin (BAU) | Patient Requests, Applications inboxes | Insights for leadership triage |
| Measurement / opportunities | Practice leadership + content lead | Digital Reception, Search opportunities | Devs keep signal privacy intact |

**RACI shorthand for Master Brain updates**

- **R** — Engineer/agent who shipped the change  
- **A** — Tech lead (document remains authoritative)  
- **C** — Practice Manager for patient-facing or cutover wording  
- **I** — All agents: prefer this file over chat history  

---

## 23. Master Brain maintenance workflow

Keep this file permanent. Do not fork “chat truths” that never land here.

### When to update

| Trigger | Update |
| --- | --- |
| Tip SHA / release branch / cutover status changes | §16 + working-memory rule + RELEASE manifest if needed |
| New admin module or major product surface | Relevant §7–15 + §19 + `CMS_MODULES` note |
| Coding / CMS / UX rule changes | `WMC-DEVELOPMENT-STANDARDS.md` (+ link check here) |
| UAT / VPS / DNS / backup procedure changes | `WMC-OPERATIONS-RUNBOOK.md` and/or `LAUNCH.md` |
| Roadmap re-prioritisation | §18–20 |
| Constraint added (brand, HotDoc, freeze) | §17 + Standards |
| Major strategy / architecture choice | Append Decision Register; link from §19 or relevant module § |

### Workflow (every substantive ship)

1. Implement against Development Standards.  
2. Verify on UAT / `next.` per Operations Runbook.  
3. Update Master Brain sections that the change makes false or incomplete (**do not delete** historical milestone rows — add rows).  
4. Sync Standards or Runbook if procedure/policy moved.  
5. If the change locks or reverses a major decision, append the Decision Register (`DEC-YYYY-NN`).  
6. Refresh `.cursor/rules/wmc-working-memory.mdc` when tip SHA, hosting, or blockers change.  
7. Prefer one PR/commit set that keeps docs and code aligned.  

### Conflict resolution

1. **Product intent / module inventory** → Master Brain  
2. **Why a choice was locked** → Decision Register  
3. **Production shell commands** → `deployment/LAUNCH.md`  
4. **Cutover decision** → `DNS-CUTOVER-CHECKLIST.md`  
5. **Day-to-day coding rules** → Development Standards  
6. **How to operate environments** → Operations Runbook  

Chat transcripts are **not** authoritative once this set is updated.

---

## Document history

| Date | Change |
| --- | --- |
| 2026-11-03 | Initial Master Brain created from repo evidence, deployment status, and module inventory. |
| 2026-11-03 | Governance pack: linked Development Standards + Operations Runbook; added §21 architecture diagram, §22 ownership, §23 maintenance workflow. |
| 2026-11-03 | Linked Decision Register (`docs/WMC-DECISION-REGISTER.md`); ownership + maintenance + conflict-resolution updates. |
| 2026-11-03 | Linked Authority Growth Engine (`docs/WMC-AUTHORITY-GROWTH-ENGINE.md`); DEC-2026-13. |

*End of Master Brain. Prefer updating this file over relying on chat transcripts.*
