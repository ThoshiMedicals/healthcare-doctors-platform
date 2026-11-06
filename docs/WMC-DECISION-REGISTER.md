# WMC Decision Register

**Permanent decision log** for Woolloongabba Medical Centre / Healthcare Doctors platform.

| Field | Value |
| --- | --- |
| Document | `docs/WMC-DECISION-REGISTER.md` |
| Parent SSOT | [`WMC-MASTER-BRAIN.md`](./WMC-MASTER-BRAIN.md) |
| Status values | `Accepted` · `Accepted — constrained` · `Superseded` · `Proposed` · `Rejected` |
| Last updated | 2026-11-03 |

**How to add a decision:** Append a new row/section with Date, Decision, Reason, Alternatives Considered, Outcome, Status. Do not rewrite history — supersede with a new entry that references the old ID.

**ID scheme:** `DEC-YYYY-NN` (year + sequence).

---

## Index

| ID | Date | Decision | Status |
| --- | --- | --- | --- |
| [DEC-2025-01](#dec-2025-01) | 2025–2026 | Golden HTML policy | Accepted |
| [DEC-2025-02](#dec-2025-02) | 2025–2026 | Authority-first strategy | Accepted |
| [DEC-2026-01](#dec-2026-01) | 2026 | One-image-per-page framework | Accepted |
| [DEC-2026-02](#dec-2026-02) | 2026 | Phase 1A / 1B / 1C approach | Accepted |
| [DEC-2026-03](#dec-2026-03) | 2026 | Practitioner authority rollout | Accepted |
| [DEC-2026-04](#dec-2026-04) | 2026 | Women’s Health cluster model | Accepted |
| [DEC-2026-05](#dec-2026-05) | 2026 | Join Our Team redesign (employer brand) | Accepted — constrained |
| [DEC-2026-06](#dec-2026-06) | 2026 | Career Pathways removal | Accepted |
| [DEC-2026-07](#dec-2026-07) | 2026 | Careers CMS architecture | Accepted |
| [DEC-2026-08](#dec-2026-08) | 2026 | Applications platform architecture | Accepted |
| [DEC-2026-09](#dec-2026-09) | 2026-11 | Search & Content Opportunity Centre | Accepted |
| [DEC-2026-10](#dec-2026-10) | 2026-11 | Patient Operations Centre | Accepted |
| [DEC-2026-11](#dec-2026-11) | 2026-11 | Media Library architecture | Accepted |
| [DEC-2026-12](#dec-2026-12) | 2026-11-03 | DNS cutover rules | Accepted — constrained |
| [DEC-2026-13](#dec-2026-13) | 2026-11-03 | Authority Growth Engine | Accepted |

---

## DEC-2025-01

| Field | Content |
| --- | --- |
| **Date** | 2025–2026 (platform foundation; restated 2026-11 in Master Brain) |
| **Decision** | **Golden HTML policy** — `old-html/` is the frozen golden master; public pages are served from immutable `PageRevision` rows (`GOLDEN_HTML_FROZEN`). Presentation tweaks go through `public-ux.ts` / overlays, not ad-hoc page rewrites. |
| **Reason** | Preserve approved SEO, schema, HotDoc, layout, and clinical trust. Avoid CMS-driven redesign risk. |
| **Alternatives considered** | Headless CMS that regenerates HTML; editable live HTML in admin; Cloudflare Pages / Hostinger static rebuilds. |
| **Outcome** | Import stores revisions without editing `old-html/` unless a written exception names the file. Phase 1B “redesign” of public layout is out of scope unless explicitly requested. |
| **Status** | **Accepted** |
| **Evidence** | `apps/web/src/platform.ts`; `deployment/SOURCE-CONTROL.md`; `deployment/LAUNCH.md`; Master Brain §4, §17 |

---

## DEC-2025-02

| Field | Content |
| --- | --- |
| **Date** | 2025–2026 |
| **Decision** | **Authority-first strategy** — Invest in practitioner/service/knowledge authority (Hub / Developing / Thin), internal linking, and governed education before marketing vanity or multi-clinic syndication. |
| **Reason** | Patient outcomes and bookable demand improve when people find the right care path; on-site authority graph is controllable without inventing clinical ratings or testimonials. |
| **Alternatives considered** | Paid-media-first growth; testimonial/star-rating widgets; generic SEO blog volume; multi-clinic expansion before content depth. |
| **Outcome** | Authority dashboards, search-index tiers, Phase 1A–1C diagrams, publish gates, and opportunity queues are first-class. Brand forbids testimonials/stars. |
| **Status** | **Accepted** |
| **Evidence** | `authority-framework.ts`; `/admin/practitioner-authority`; `/admin/service-authority`; BRAND_POLISH_4G; Master Brain §7–9 |

---

## DEC-2026-01

| Field | Content |
| --- | --- |
| **Date** | 2026 (Authority visual deployment framework / Phase 1A–1C) |
| **Decision** | **One-image-per-page framework** — A knowledge/authority page gets **one** educational diagram (or none). No stacking heroes + diagrams + infographics on the same page for Phase 1B/1C placements. |
| **Reason** | Reduce visual noise, keep educational intent clear, protect layout and Core Web Vitals, avoid “collage” redesign of golden pages. |
| **Alternatives considered** | Multiple diagrams per page; hero photography plus diagram stacks; service-page diagram flood; unused Phase 1A hero/infographic sets on every hub. |
| **Outcome** | Phase 1B purpose text: “One diagram per page. No heroes. No service pages.” Phase 1C deploy guidance matches. Unused hero/infographic assets held back. |
| **Status** | **Accepted** |
| **Evidence** | `old-html/cms/authority-phase-1b-blocks.json`; canvases `authority-visual-deployment-framework`, `phase-1b-deployment-verification`, `phase-1c-diagram-creation` |

---

## DEC-2026-02

| Field | Content |
| --- | --- |
| **Date** | 2026 |
| **Decision** | **Phase 1A / 1B / 1C approach** — Ship authority education assets in sequenced waves: 1A baseline placements; 1B cluster/hub + selected article diagrams; 1C further education WebPs — with parity between `old-html` and `public`, responsive picture variants, and release artifact gates. |
| **Reason** | Incremental, reviewable authority gains without a single big-bang layout rewrite; each wave can be QA’d and gated. |
| **Alternatives considered** | One monolithic visual redesign; placing all generated assets immediately; diagrams on every service page. |
| **Outcome** | Tip `3875dc3` ships Phase 1B/1C authority artifact + insurance-notice alignment. Manifest tracks WebP parity. Further redesign remains constrained by golden HTML. |
| **Status** | **Accepted** |
| **Evidence** | `deployment/RELEASE-ARTIFACT-MANIFEST.md`; working-memory tip note; Phase 1A/1B/1C canvases |

---

## DEC-2026-03

| Field | Content |
| --- | --- |
| **Date** | 2026 |
| **Decision** | **Practitioner authority rollout** — Score and improve doctor profiles via Hub/Developing/Thin framework, CMS overlays, portrait pixel-lock, HotDoc URL rules, and admin Doctor profiles dashboard — not clinical quality star ratings. |
| **Reason** | Public profiles drive booking intent; overlays keep golden layout; phone-only paths (e.g. Mary) must stay accurate. |
| **Alternatives considered** | Free-form portrait uploads breaking card layout; inventing HotDoc for phone-only doctors; external SEO APIs as primary score. |
| **Outcome** | `/admin/practitioner-authority` + practitioner editors + insurance/phone-only booking rules. Portrait replacement via governance proposal workflow. |
| **Status** | **Accepted** |
| **Evidence** | `PRACTITIONER_AUTHORITY_4E.md`; QA2/QA11; `booking-restriction-notice.ts`; Master Brain §7 |

---

## DEC-2026-04

| Field | Content |
| --- | --- |
| **Date** | 2026 |
| **Decision** | **Women’s Health cluster model** — Treat women’s health as a **service + knowledge cluster** (service page, related pathways, menopause/perimenopause guides, cervical screening, antenatal links, life-stages education diagram) rather than isolated pages. |
| **Reason** | Patients navigate topics as a journey; cluster linking improves authority and findability without inventing a new IA redesign. |
| **Alternatives considered** | Standalone blog posts; mega-menu of every gynae procedure; one undifferentiated “women’s” landing with no related guides. |
| **Outcome** | Women’s Health service + knowledge hubs/articles linked; Phase 1B includes Women’s Health Across Life Stages educational diagram where approved. |
| **Status** | **Accepted** |
| **Evidence** | `old-html/services/womens-health.html`; knowledge menopause hubs; `authority-phase-1b-blocks.json`; canvas `content-synchronisation-audit` / `womens-health-authority-cluster` |

---

## DEC-2026-05

| Field | Content |
| --- | --- |
| **Date** | 2026-11 (local careers rebuild; employer-brand cache busts) |
| **Decision** | **Join Our Team redesign** — Employer-brand presentation of `join-our-team.html` via golden HTML + `public-ux` / vacancy injects, not a separate careers microsite or Phase 1B site redesign. |
| **Reason** | Recruitment needs a clear public story and live vacancies while preserving SEO/canonical layout. |
| **Alternatives considered** | External ATS-only careers site; full page redesign outside golden constraints; Job board CRM. |
| **Outcome** | Join Our Team remains the public careers surface; active vacancies inject at render; Talent Community EOI posts into Applications. Cache busts for employer-brand assets documented in working memory / `public-ux.ts`. |
| **Status** | **Accepted — constrained** (presentation within golden HTML / public-ux) |
| **Evidence** | Master Brain §10; `careers-vacancies` inject; working-memory careers bust notes |

---

## DEC-2026-06

| Field | Content |
| --- | --- |
| **Date** | 2026 |
| **Decision** | **Career Pathways removal** — Do **not** maintain a separate Career Pathways product/page as a parallel careers IA; concentrate recruitment UX on **Join Our Team** + vacancy CMS + Talent Community applications. |
| **Reason** | Avoid duplicate careers surfaces, split SEO, and admin complexity. One employer-brand page with live roles is clearer for applicants and reception. |
| **Alternatives considered** | Keep a distinct Career Pathways section/site; multi-page career ladder CMS; third-party job board embed as primary UX. |
| **Outcome** | Careers investment goes to Join Our Team employer brand, `Vacancy` admin, and Applications inbox. Meta copy may still say “career pathways” in prose without a separate pathways module. |
| **Status** | **Accepted** |
| **Evidence** | Careers module inventory (Vacancies + Applications only in `CMS_MODULES`); Master Brain §10–11; admin platform audit careers notes |

---

## DEC-2026-07

| Field | Content |
| --- | --- |
| **Date** | 2026 |
| **Decision** | **Careers CMS architecture** — Clinic-scoped `Vacancy` model with statuses (now hiring / EOI / future opportunity / closed), `active` flag, and render-time inject into Join Our Team for Active ∧ ¬Closed. |
| **Reason** | Practice staff need CRUD without editing golden HTML; public page stays layout-stable. |
| **Alternatives considered** | Hard-coded vacancies in HTML; network-wide vacancy pool; full ATS. |
| **Outcome** | `/admin/careers/vacancies`; seed helpers; clinic-scoped only (cross-clinic recruitment deferred). |
| **Status** | **Accepted** |
| **Evidence** | Prisma `Vacancy`; `CMS_MODULES` Vacancies; Master Brain §10 |

---

## DEC-2026-08

| Field | Content |
| --- | --- |
| **Date** | 2026-11 |
| **Decision** | **Applications platform architecture** — `CareerApplication` inbox with status workflow (new → reviewing → interview → offer → hired / rejected / closed), resume storage, notes/assignment, Talent Community API POST, optional notify — **not** a full ATS. |
| **Reason** | Capture EOIs that previously fell to mailto; give HR/reception an operational queue aligned with Practice Briefing KPIs. |
| **Alternatives considered** | Mailto-only; external ATS integration first; shared network applicant pool. |
| **Outcome** | `/admin/careers/applications`; API `/api/clinics/[clinicSlug]/career-applications`; briefing recruitment KPIs. |
| **Status** | **Accepted** |
| **Evidence** | Prisma `CareerApplication`; `careers-applications.ts`; Master Brain §11 |

---

## DEC-2026-09

| Field | Content |
| --- | --- |
| **Date** | 2026-11 |
| **Decision** | **Search & Content Opportunity Centre** — Privacy-scoped `SearchDemandSignal` + opportunity scoring dashboard (`/admin/search-opportunities`) joining Digital Reception demand, no-result terms, freshness, and content gap alerts — **not** AI SEO vanity tooling. |
| **Reason** | Turn real patient search behaviour into governed content/authority work. |
| **Alternatives considered** | Dashboard-only without storage; raw query PII on dashboards; auto-drafting articles from gaps; GSC-only without on-site signals. |
| **Outcome** | Signals API, ~90-day retention, Practice Briefing search KPIs, Insights nav module (`manage_settings`). |
| **Status** | **Accepted** |
| **Evidence** | Prisma `SearchDemandSignal`; `search-opportunity-report.ts`; Master Brain §13 |

---

## DEC-2026-10

| Field | Content |
| --- | --- |
| **Date** | 2026-11 |
| **Decision** | **Patient Operations Centre** — Elevate `FormRequest` from API-only storage to an admin inbox (`/admin/operations/patient-requests`) with statuses, assignment, notes, history, widgets — reception/admin ops, **not** clinical messaging. |
| **Reason** | Website registration/records/contact/feedback requests need operational follow-up and SLAs. |
| **Alternatives considered** | Email-only handoff; EMR integration; inventing a patient portal chat. |
| **Outcome** | Operations nav module; public form POST wiring; Action Centre “awaiting action” queue. |
| **Status** | **Accepted** |
| **Evidence** | Prisma `FormRequest` + statuses; `patient-requests.ts`; Master Brain §12 |

---

## DEC-2026-11

| Field | Content |
| --- | --- |
| **Date** | 2026-11 |
| **Decision** | **Media Library architecture** — Split **Media Library** (`edit`: catalogue, usage, metadata, library uploads) from **Image reviews** (`clinical_signoff`: rights, expiry, pixel-matched replacement). Reuse `MediaAsset`; no public redesign. |
| **Reason** | Staff need a practical asset ops surface; replacement must stay fail-safe for golden layout. |
| **Alternatives considered** | Single governance-only UI; free-form overwrite of any public path; new CDN/media SaaS. |
| **Outcome** | `/admin/media` + `/admin/image-governance`; categories; briefing media KPIs; uploads to `assets/library/` do not auto-place on pages. |
| **Status** | **Accepted** |
| **Evidence** | `media-library.ts`; Master Brain §14; Development Standards §2 image replacement |

---

## DEC-2026-12

| Field | Content |
| --- | --- |
| **Date** | 2026-11-03 |
| **Decision** | **DNS cutover rules** — Production DNS cutover is **NO-GO** until `LAUNCH.md` ops evidence is filed (off-box backup, VPS `AUTH_*`/DB, Cloudflare Full strict, VPS smoke log, rollback DNS values). Laptop UAT / `next.` tunnel is **not** staging smoke. Production path = VPS + Cloudflare DNS/SSL only — not Hostinger or Pages. |
| **Reason** | Protect live patient booking/phone traffic; avoid irreversible DNS moves without rollback. |
| **Alternatives considered** | Cut over from laptop tunnel evidence alone; Cloudflare Pages deploy; Hostinger path. |
| **Outcome** | Checklist Decision NO-GO; tip `3875dc3` shippable as artifact but apex DNS unchanged until GO. Re-audit 2026-11-03: **8/8** ops evidence items still FAIL / uninspectable from operator workstation. |
| **Status** | **Accepted — constrained** (GO blocked on ops evidence) |
| **Evidence** | `docs/WMC-PRODUCTION-READINESS-EVIDENCE.md`; `deployment/DNS-CUTOVER-CHECKLIST.md`; `deployment/LAUNCH.md`; Operations Runbook §4; Master Brain §16 |

---

## DEC-2026-13

| Field | Content |
| --- | --- |
| **Date** | 2026-11-03 |
| **Decision** | **Authority Growth Engine adopted as the future authority optimisation framework** — Unify SearchDemandSignal, Search & Content Opportunities, Practitioner/Service Authority, Digital Reception, and Practice Briefing into one scored Authority Growth Queue (six lanes + Authority Opportunity Score + weekly/monthly/quarterly cadence + Top 20 report). Compose existing Insights builders; do **not** invent a new CMS/Insights module, Prisma queue table, AI article spam, or golden HTML redesign. |
| **Reason** | Authority-first growth needs a repeatable backlog from real patient demand gaps, not disconnected dashboards or vanity SEO tooling. |
| **Alternatives considered** | Keep dashboards disconnected; new standalone `/admin/authority-growth` module; AI auto-drafting from search gaps; paid-media-first without on-site authority depth. |
| **Outcome** | Permanent spec [`WMC-AUTHORITY-GROWTH-ENGINE.md`](./WMC-AUTHORITY-GROWTH-ENGINE.md). Implementation may follow as a measurement composer + Briefing / Search Opportunities UI slices. Extends DEC-2025-02 and DEC-2026-09. |
| **Status** | **Accepted** |
| **Evidence** | `docs/WMC-AUTHORITY-GROWTH-ENGINE.md`; Master Brain §7–8, §13, §15, §20; Development Standards Insights/authority notes |

---

## How to maintain this register

1. New irreversible product/architecture choice → add `DEC-YYYY-NN`.  
2. Reversal → new entry with Status `Accepted` that sets prior entry to `Superseded` (do not delete).  
3. Update Master Brain governing set + §19 milestones when a decision ships.  
4. Chat is not a substitute for an entry here.

---

## Document history

| Date | Change |
| --- | --- |
| 2026-11-03 | Initial register populated with major accepted platform decisions. |
| 2026-11-03 | DEC-2026-13 Authority Growth Engine accepted. |
