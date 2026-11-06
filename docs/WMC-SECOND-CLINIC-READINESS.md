# WMC Second Clinic Readiness Audit

**Audit only — no implementation.**  
**Date:** 2026-11-03  
**Parent:** [`WMC-MASTER-BRAIN.md`](./WMC-MASTER-BRAIN.md) · Decisions: [`WMC-DECISION-REGISTER.md`](./WMC-DECISION-REGISTER.md)  
**Clinic #2 pick:** [`WMC-CLINIC-2-SELECTION-AUDIT.md`](./WMC-CLINIC-2-SELECTION-AUDIT.md)  
**Interactive:** Cursor canvas `wmc-second-clinic-readiness` · selection `wmc-clinic-2-selection-audit`

---

## Current readiness score

| Score | Meaning |
| --- | --- |
| **64 / 100** (was 42 → 58) | Phase 1 foundation + draft EMP exercise 2026-11-03 — see [`WMC-DRAFT-SECOND-CLINIC-EXERCISE.md`](./WMC-DRAFT-SECOND-CLINIC-EXERCISE.md). Still **one live** public tenant; draft second clinic validated in admin only. |

| Layer | Approx. |
| --- | --- |
| Prisma / clinicId data model | ~82 |
| Host → ClinicDomain resolve | ~80 |
| Admin multi-tenant UX | ~78 (active clinic + draft-capable switcher) |
| Branding / presentation | ~55 (profile inject; WMC fallbacks remain) |
| Second golden HTML corpus | Not started (long pole) |

---

## Area review

| Area | Score | Finding |
| --- | --- | --- |
| CMS | 75 | Entities are `clinicId`-scoped; `editorContext` always uses `DEFAULT_CLINIC_SLUG \|\| woolloongabba`; golden import hardcodes that slug |
| Governance | 65 | `ClinicalReview` / revisions scoped; `governance-published.js` is a single shared file |
| Vacancies | 70 | Scoped; default location “Woolloongabba, Brisbane” |
| Applications | 70 | Scoped API + storage; WMC copy and JS slug fallbacks |
| Patient Requests | 70 | Scoped; public handoff strings hardcoded WMC |
| Media Library | 45 | Rows scoped; disk sync walks shared `public/assets` |
| Search Intelligence | 60 | `SearchDemandSignal` scoped; measurement warehouse global |
| Dashboards | 55 | Ops KPIs use `clinic.id`; analytics events lack `clinicId` |
| Domains | 80 | `ClinicDomain` + host resolve work; local/tunnel → default slug; `listLiveClinics` unused |
| Branding | 35 | `ClinicProfile` fields exist; `public-ux` / layout / handoffs still WMC literals |

---

## 1. Single-clinic assumptions

- Admin clinic = `DEFAULT_CLINIC_SLUG` (`apps/web/src/cms/context.ts`, `env.ts`)
- Golden import/validate hardcode `woolloongabba`; one `GOLDEN_HTML_ROOT` (`importer/*`)
- `switch_clinic` allowed for network/super roles — **no UI**; `listLiveClinics()` never called
- Shared `public/governance-published.js` after clinic-scoped query
- Global `data/measurement-events.json` — raw events without clinic field
- Media library catalogs shared `assets/` into each clinic’s rows
- Client fallbacks: `site.js`, `digital-reception.js` → `'woolloongabba'`
- Seed: one live clinic; other suburbs are `NetworkLocation` **external** stubs
- Product policy: second tenant needs its **own approved HTML corpus** (Master Brain / Decision Register)

---

## 2. Required schema changes

**Already OK:** Network, Clinic, ClinicDomain, ClinicProfile, pages/content types, Vacancy, CareerApplication, FormRequest, MediaAsset, ClinicalReview, SearchDemandSignal, memberships, NetworkLocation.

**Gaps / soft requirements:**

| Change | Priority |
| --- | --- |
| Admin active-clinic session (not necessarily a Prisma model) | Phase 1 |
| Measurement events with `clinicId` / partitioned warehouse | Phase 1 |
| Per-clinic governance artifact path or DB-served registry | Phase 1 |
| Per-clinic media/storage root (or explicit network-shared brand pool) | Phase 1 |
| Soften `Vacancy.location` default | Quick win |
| Optional `Clinic.goldenHtmlRoot` or slug→path map | Phase 1–2 |

---

## 3. Required admin changes

1. Clinic switcher using `listLiveClinics` + session for network/super (and multi-membership users)
2. Clinic provisioning (profile, hours, domains, memberships) without Gabba-only seed
3. Parameterized golden import/validate by clinic slug + root
4. Presentation copy from `ClinicProfile` (name, phone, HotDoc, logo, canonical)
5. Media sync/upload scoped per clinic
6. Insights filtered by clinic once measurement is keyed
7. Admin chrome title from `practiceName`

---

## 4. Shared-content opportunities

| Share | Do not share without decision |
| --- | --- |
| Healthcare Doctors network marks + network directory | Practitioners, local services, page HTML |
| Shared CSS/JS with `data-clinic-slug` | HotDoc URLs, hours, address, AGPAL claims |
| Overlay slots + publish-gate process | Resumes, FormRequests, clinic MediaAsset usage |
| Later: light cross-clinic vacancy visibility | Full shared applicant pool / ATS |

---

## 5. Shared-governance opportunities

- Reuse fail-closed publish gates and ClinicalReview workflow as-is
- Keep memberships clinic-scoped; network_admin oversight across clinics
- Reuse image authenticity / pixel-lock rules; approvals on clinic assets
- Replace single shared governance JS with per-clinic artifact
- Network governance dashboard only after ≥2 **live** tenants

---

## Quick wins (0–1 month)

- `--clinic` on import/validate/scripts (still one golden tree)
- Replace WMC string literals with profile fields where clinic is known
- Wire `listLiveClinics` + switcher UI (even with one live clinic)
- Draft/external second clinic for domain/profile dry-run only
- Document media/measurement/governance multi-tenant gaps

## Phase 1 requirements (1–4 months) — platform multi-tenant

- Active-clinic session end-to-end in admin
- Per-clinic asset root + governance publish path
- Measurement warehouse keyed by clinic
- Provisioning path for clinic #2 without page import
- UAT multi-host or slug override beyond single default

## Phase 2 requirements (4–12+ months) — second live clinic

- Approve and freeze **clinic-specific** golden HTML corpus (largest cost)
- Import → DNS (`ClinicDomain`) → HotDoc/AGPAL/brand QA
- Populate governance registry for that clinic
- Network admin reporting; optional light cross-clinic vacancies
- Do **not** promote `NetworkLocation` stubs to live without golden import

## Estimated roadmap

| Horizon | Outcome |
| --- | --- |
| 0–1 mo | Quick wins; still one live tenant |
| 1–4 mo | Platform ready to *operate* a second tenant |
| +6–12 mo | Credible second **live** site after content corpus |
| Aligns with | Master Brain “Later” multi-clinic horizon |

**Engineering vs content:** Phase 1 is mostly platform engineering. Phase 2 is mostly clinical/content/golden HTML plus DNS/HotDoc ops.

---

## Bottom line

**~64/100 overall** after Phase 1 + draft Eight Mile Plains exercise (10/10 isolation checks). You can operate a **draft** second tenant in admin; you still cannot launch a second *live* public site without a clinic-specific golden corpus and media/governance isolation.

---

## Document history

| Date | Change |
| --- | --- |
| 2026-11-03 | Initial audit (no implementation). |
| 2026-11-03 | Phase 1 foundation implemented; score 42 → 58. |
| 2026-11-03 | Draft EMP clinic exercise; score 58 → 64. |
