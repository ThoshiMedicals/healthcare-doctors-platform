# Attraction platform — launch readiness assessment

**Role:** Healthcare platform delivery architect  
**Date:** 2026-11-04  
**Scope:** Implemented WMC attraction modules only (no new workflow concepts)  
**Git observed:** branch `rg01-release-gate-repairs`; tip evidence for ops remains **NO-GO** per `docs/WMC-PRODUCTION-READINESS-EVIDENCE.md`  
**Hosting context:** Public apex cutover ≠ laptop UAT / `next.` tunnel

---

## Module inventory (approved / implemented)

| Module | Admin / surface | Authority |
| --- | --- | --- |
| Practice Experience Hub | `/admin/practice-experience` · public PE page via `Page`/`PageRevision` | PE hub + `public-ux` inject |
| Attraction CMS Phase 1 | `/admin/attraction` | `docs/WMC-GP-ATTRACTION-CMS-PHASE1.md` |
| Publish-ready content packs | Attraction CMS seed | `docs/WMC-ATTRACTION-PUBLISH-READY-CONTENT.md` |
| Story Capture | `/admin/story-capture` | Story Capture proposal + Phase 1 CMS |
| Asset Library | `/admin/asset-library` | `docs/WMC-GP-ATTRACTION-ASSET-LIBRARY.md` |
| GP Operational Pipeline | `/admin/gp-pipeline` | `docs/WMC-GP-OPERATIONAL-PIPELINE.md` |
| Attraction Analytics + KG + CI | `/admin/attraction-analytics` | `docs/WMC-ATTRACTION-ANALYTICS-INSTRUMENTATION.md` |
| Join Our Team / careers | Public + careers admin | Existing careers / vacancy gates |

**Not in Phase 1 public publish path:** Attraction CMS → live HTML (`PRODUCTION_PUBLISH_BLOCKED`).

**Experience Validation (2026-11-04):** UAT/`next.` may surface attraction PageRevisions via `promoteAttractionExperienceValidation` / Admin **Promote to Experience Validation**. That path does **not** publish AttractionDocuments and does **not** clear apex launch. See `docs/WMC-ATTRACTION-EV-VALIDATION-REPORT.md`.

---

## Dimension verdicts

Classification: **Ready** · **Needs Validation** · **Blocked**

### 1. Public launch readiness — **Blocked** (production) / **Needs Validation** (`next.` soft surfaces)

| Criterion | Status | Evidence |
| --- | --- | --- |
| Apex DNS cutover | **Blocked** | Production readiness 8/8 FAIL; `LAUNCH.md` gates open |
| Attraction CMS → public HTML | **Blocked** | Phase 1 hard-blocks `scheduled`/`published` |
| Practice Experience on PageRevision | **Needs Validation** | Live path exists; confirm current UAT/`next.` HTML + schema |
| Join Our Team / vacancy JobPosting | **Needs Validation** | JobPosting only with live vacancy — re-verify |
| Soft-launch of already-published PE (no CMS publish) | **Needs Validation** | Smoke on `127.0.0.1:3100` and `next.` after rebuild |

**Verdict:** Do **not** treat Attraction as production-launched. Soft-validate existing PE / Join Our Team only.

### 2. Governance readiness — **Needs Validation**

| Criterion | Status | Evidence |
| --- | --- | --- |
| Human-only approval events | **Ready** | `AttractionApprovalEvent`; system/auto forbidden |
| Schema gates (JobPosting, FAQ sync, tone, consent) | **Ready** | `validate-schema.ts` + tests |
| Change classes A–D | **Ready** | Phase 1 model |
| Clinical sign-off role wired in prod | **Needs Validation** | Confirm admin users have `clinical_signoff` / edit actions |
| Content Intelligence never auto-publishes | **Ready** | Advisory runs + explicit notice |
| Pipeline notifications ≠ approvals | **Ready** | `countsAsApproval=false` |

**Verdict:** Governance **design is Ready**; operator role assignment and live sign-off drill need validation.

### 3. Content readiness — **Needs Validation** (packs) / **Blocked** (claiming packs as public truth)

| Criterion | Status | Evidence |
| --- | --- | --- |
| Six synthetic packs seeded | **Ready** (capability) | Opportunities, FAQ, PE pack, Catchment, Continuity, Clinical Interests |
| Synthetic honesty markers | **Ready** | `contentClass: synthetic_placeholder`; no fake named doctors / earnings |
| Human clinical review of packs | **Needs Validation** | Seed ≠ approved public copy |
| PE hub copy vs golden/approved narrative | **Needs Validation** | Re-run PE schema guards on live HTML |
| CMS packs as live public content | **Blocked** | Phase 1 publish block + synthetic class |

**Verdict:** Content is **draft/advisory Ready** for review; **Blocked** as production public source until Phase 2 + human approve.

### 4. CMS readiness — **Ready** (Phase 1 drafting) / **Blocked** (production publish)

| Criterion | Status | Evidence |
| --- | --- | --- |
| Documents / revisions / approvals APIs + admin | **Ready** | `/admin/attraction` |
| Seed defaults + publish-ready seed | **Ready** | Admin actions |
| Production publish helper | **Blocked** (by design) | Always throws `PRODUCTION_PUBLISH_BLOCKED` |
| Public catch-all → `publishedRevisionId` | **Blocked** | Explicit non-goal Phase 1 |

**Verdict:** CMS is **Ready for editorial workflow**, **Blocked for go-live publish**.

### 5. Asset readiness — **Needs Validation** (placeholders) / **Blocked** (identifiable people masters)

| Criterion | Status | Evidence |
| --- | --- | --- |
| AI placeholder registry + public paths | **Ready** | Asset Library seed; `/assets/practice-experience/*`, `/assets/attraction/placeholders` |
| Lifecycle + review actions | **Ready** | `asset-library/lifecycle.ts` |
| Consent for identifiable people | **Blocked** until signed | Named people require Story Capture consent before non-placeholder publish |
| Object-store masters / production CDN | **Blocked** / **Needs Validation** | Registry only; no production object-store pipeline |
| AI-ban shots (people) replaced with real photography | **Needs Validation** | Visual Asset Plan policies |

**Verdict:** Placeholders **Ready for staging**; people-facing masters **Blocked** without consent + review.

### 6. Operational readiness — **Needs Validation** (pipeline on UAT) / **Blocked** (production cutover)

| Criterion | Status | Evidence |
| --- | --- | --- |
| Readiness → EOI → Match → Onboarding → First 90 | **Ready** (code) | `gp-pipeline/*` + admin board |
| Human gates / advisory scores | **Ready** | Proposal rules encoded |
| Operator smoke (demo seed → open onboarding → gate) | **Needs Validation** | Not filed as signed evidence |
| Analytics ingest + dashboard | **Needs Validation** | Demo seed OK; live beacon on PE unproven on `next.` |
| Production ops (backup, AUTH, CF Full Strict, smoke) | **Blocked** | `WMC-PRODUCTION-READINESS-EVIDENCE.md` NO-GO |

**Verdict:** Attraction ops stack is **UAT-capable**; production ops remain **Blocked**.

---

## Overall launch posture

| Launch type | Classification |
| --- | --- |
| Attraction CMS Phase 2 public publish | **Blocked** |
| Production DNS / apex cutover | **Blocked** |
| Soft-validate PE + Join Our Team on `next.` | **Needs Validation** |
| Internal admin: CMS draft, Asset Library, Pipeline, Analytics | **Ready** (with validation drills) |

---

## Go-live checklist

Use only when the launch type is explicitly approved. Items marked **P** are production-cutover; **S** are soft/`next.` only.

### Hard blockers (must stay red until cleared)

- [ ] **P** All 8 items in `docs/WMC-PRODUCTION-READINESS-EVIDENCE.md` filed PASS
- [ ] **P** Attraction CMS Phase 2 publish path approved in writing (today: Phase 1 block stands)
- [ ] **P** No Attraction CMS document with `synthetic_placeholder` marked as public production truth
- [ ] **P/S** No JobPosting schema without a live vacancy
- [ ] **P/S** No identifiable people assets published without signed consent + approve
- [ ] **P/S** HotDoc / insurance / Mary phone-only booking facts unchanged and verified
- [ ] **P** Ship from known git SHA; no dirty laptop-only deploy as production

### Soft-launch / `next.` only (does not clear apex)

- [ ] **S** Postgres up; `/api/health` → `database: up`
- [ ] **S** `npm run uat:build` + `npm run uat` from `apps/web`
- [ ] **S** Practice Experience page 200 on `127.0.0.1:3100` and `https://next.gabbamedicalcentre.com.au`
- [ ] **S** Join Our Team + PE About inject present
- [ ] **S** `/attraction-track.js` loads on PE; events appear in Attraction Analytics
- [ ] **S** Admin modules load: Attraction CMS, Story Capture, Asset Library, GP Pipeline, Attraction Analytics
- [ ] **S** CF edge purge / versioned bust if stale `site.js` / PE assets

---

## Validation checklist

### Public surfaces

- [ ] PE hub: schema guards PASS (`practice-experience/schema-guards`)
- [ ] No invented earnings / fake named doctors on live PE
- [ ] Mobile nav + PEERS intact (`site.js` bust if needed)
- [ ] FAQ accordion opens fire `faq_open` (if FAQ markup present)
- [ ] Opportunity Pack download link fires `pack_download` when used

### Governance / CMS

- [ ] Seed publish-ready packs → submit_for_review → approve (human) succeeds
- [ ] `publish_production` / publish helper returns blocked (403/throw)
- [ ] Story with named person without consent fails schema gate
- [ ] Clinical reviewer can approve; non-signoff cannot

### Assets

- [ ] Placeholder inventory matches Visual Asset Plan IDs
- [ ] AI-ban people shots are environment bridges only
- [ ] Approve/publish of identifiable asset blocked without consent

### Operations / pipeline

- [ ] Demo EOI → human review → session match (advisory) → open onboarding
- [ ] Gate advance requires human reviewer id
- [ ] Notification log `countsAsApproval=false`
- [ ] First 90 case only after `go_live` human gate
- [ ] Analytics dashboard KPIs update after demo seed / live beacon
- [ ] Graph ingest creates snapshot + content-intel signals (advisory)

### Analytics privacy

- [ ] Ingest rejects AHPRA / provider-number-like payloads
- [ ] No free-text readiness answers in event props

---

## Launch sequence

Ordered; do not skip gates.

### Phase A — Internal enablement (now)

1. Keep Attraction CMS on **draft/review only** (Phase 1).
2. Train PM / clinical sign-off on Attraction CMS, Asset Library, Story Capture, GP Pipeline.
3. Seed publish-ready packs; run human review; leave unpublished.
4. Confirm placeholder assets catalogued; schedule real photography for AI-ban people shots.
5. Run validation checklist on UAT/`next.` (soft surfaces only).

### Phase B — Soft public confirmation (`next.` only)

1. Rebuild UAT; verify PE + Join Our Team.
2. Confirm analytics beacons and dashboard.
3. Confirm booking/insurance/Mary phone-only regressions PASS.
4. File soft-validation evidence (URLs, timestamps, SHA). **Does not** clear DNS cutover.

### Phase C — Attraction public content launch (future Phase 2)

1. Written exception + Phase 2 publish design approved.
2. Replace synthetic packs with practice-approved copy.
3. Consent + approve people assets; retire placeholders where required.
4. Human approve → publish to PageRevision (still no auto-publish).
5. Smoke public HTML; schema; SEO; HotDoc.

### Phase D — Production DNS cutover (platform, not attraction-only)

1. Clear `WMC-PRODUCTION-READINESS-EVIDENCE.md` 8/8.
2. Follow `deployment/LAUNCH.md` + `deployment/DNS-CUTOVER-CHECKLIST.md`.
3. Only then change apex DNS.

---

## Post-launch monitoring plan

Applies after any soft or production surface goes live. **Advisory only — no automated EOI/hire/publish decisions.**

### Daily (first 14 days)

| Watch | Where | Action threshold |
| --- | --- | --- |
| `/api/health` database | UAT/VPS | Any `down` → stop publishing; restore Postgres |
| Public PE / Join Our Team HTTP | `next.` / apex | Non-200 or HTML 500 → rollback PageRevision |
| Attraction Analytics ingest errors | Admin dashboard / logs | Spike in rejected events → check beacon / PII false positives |
| EOI queue | GP Pipeline board | New EOIs reviewed same business day (human) |
| Booking regressions | Tanya insurance notice; Mary `tel:` | Regression → hotfix branch process |

### Weekly

| Watch | Where | Action |
| --- | --- | --- |
| FAQ top opens + not-helpful | Attraction Analytics | Human editor backlog (Content Intelligence recs) |
| Readiness completion / abandon | Analytics | Content/tool UX review — no auto-reject |
| EOI paths lift | Analytics / graph snapshot | Editorial pathway improvements |
| PE module engagement | Analytics | Hub IA tweaks via approved CMS/Page path |
| Opportunity Pack downloads | Analytics | Confirm pack still accurate |
| Asset review cadence | Asset Library | `review_due` queue |
| Story consent expiry | Story Capture / consent | Withdraw assets if consent lapses |

### Monthly

| Watch | Where | Action |
| --- | --- | --- |
| Graph + Content Intelligence ingest | Admin button / API | Human accept/defer/reject recs only |
| Governance change-class audit | AttractionApprovalEvent | Spot-check Class C/D decisions |
| Pipeline First 90 open cases | GP Pipeline | Settling checklist health |
| npm audit (safe patches only) | CI / local | No `audit fix --force` on cutover windows |

### Incident triggers (stop / escalate)

- Public vacancy schema without live vacancy  
- Identifiable photo live without consent  
- Auto-publish or auto-hire behaviour detected  
- Analytics storing AHPRA / provider numbers / CV text  
- Production DNS change without PASS evidence pack  

---

## Summary scorecard

| Dimension | Classification |
| --- | --- |
| Public launch readiness | **Blocked** (prod) · **Needs Validation** (`next.` soft) |
| Governance readiness | **Needs Validation** |
| Content readiness | **Needs Validation** · **Blocked** as public truth |
| CMS readiness | **Ready** (Phase 1 draft) · **Blocked** (prod publish) |
| Asset readiness | **Needs Validation** (placeholders) · **Blocked** (people masters) |
| Operational readiness | **Needs Validation** (UAT) · **Blocked** (prod cutover) |

**Architect recommendation:** Continue **internal enablement + `next.` validation** only. Do not announce Attraction CMS public launch or apex cutover until Phase 2 publish is approved and production evidence is PASS.
