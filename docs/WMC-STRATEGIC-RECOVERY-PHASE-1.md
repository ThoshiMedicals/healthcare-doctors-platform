# WMC Strategic Recovery — Phase 1

**Scope:** Tasks 04 (Practitioner Authority), 05 (Service→Practitioner matrix), 07 (Patient journey conversion)  
**Worktree:** `WMC-p0-doctor-profiles-incident`  
**Date:** 2026-11-11  
**Constraint:** No redesign; preserve design system, SEO, URLs, booking policies, recruitment HOLD. Do not invent expertise or rank practitioners.

Evidence artifacts (gitignored tmp):

- `apps/web/.tmp-phase1-golden-doctors.json`
- `apps/web/.tmp-phase1-cms-practitioners.json`
- `apps/web/.tmp-phase1-golden-services.json`
- `apps/web/.tmp-phase1-matrix.json`
- `apps/web/.tmp-phase1-before-after.json`

---

## A. Practitioner Authority Gap Report

### Inventory

| Cohort | Count | Notes |
| --- | ---: | --- |
| Golden HTML profiles (`old-html/doctors`) | 12 | 11 doctors + Mr Samuel Stafford |
| CMS published (WMC clinic) | 15 published + 1 HOLD | Includes 3 CMS imports (Golnar, James, Yamesha) |
| Recruitment HOLD | 1 | Dr Gemunu — `on_hold` / page archived (not reopened) |

### Authority checklist (golden profiles)

| Practitioner | Quals visible | FRACGP / college | Languages | Bio | Photo | Booking (golden) | Person schema | Internal service links |
| --- | --- | --- | --- | --- | --- | --- | --- | ---: |
| Dr Anand Singh | MBBS, FRACGP | FRACGP | EN, Hindi | OK | Yes | HotDoc | Yes | 6 |
| Dr Debra Larkins | MBBS, FRACGP | FRACGP | EN | OK | Yes | HotDoc | Yes | 4 |
| Dr Kooshyar Karimi | MD, FRACGP | FRACGP | Multi | OK | Yes | HotDoc | Yes | 5 |
| Dr Mary Abadir | M.B.B.Ch, MRCOG, FRANZCOG | FRANZCOG (not FRACGP) | **Gap:** no langs listed | OK | Yes | HotDoc in golden; **runtime PHONE_ONLY** | Yes | 7 |
| Dr Nirupa Sivathasan | MBBS, FRACGP, MRCGP | FRACGP | **Gap:** none listed | OK | **Missing** | HotDoc | Yes | 3 |
| Dr Sambo Luon | MBBS, FRACGP | FRACGP | EN, Khmer, Mandarin | OK | Yes | HotDoc | Yes | 3 |
| Dr Steven Chang | Chiropractic degrees | N/A (chiro) | EN, Mandarin, Taiwanese | OK | Yes | HotDoc | Yes | 1 |
| Dr Sumita Singh | MBBS, FRACGP | FRACGP | EN, Hindi | OK | Yes | HotDoc | Yes | 3 |
| Dr Tanya Goodwill | MBBS, FRACGP | FRACGP | EN | Strong | Yes | HotDoc + insurance notice | Yes | 10 |
| Dr Usman Gul | MBBS, FRACGP | FRACGP | EN, Urdu | OK | Yes | HotDoc | Yes | 3 |
| Dr Wasantha Hettiarchchi | MBBS, FRACGP | FRACGP | EN, Sinhala | OK | Yes | HotDoc | Yes | 10 |
| Mr Samuel Stafford | **Gap:** none listed | N/A | **Gap** | Thin | **Missing** | HotDoc | Yes | 1 |

### CMS-imported GPs (authority stronger in CMS than golden HTML)

| Practitioner | Quals | FRACGP | Areas (approved) | Languages | Bio | Photo | Booking |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Dr Golnar Mortezaei | MD, FRACGP | Yes | Veterans’, CDM, diabetes, heart, COPD, OA | EN, Persian | Strong | Yes | HotDoc via ONLINE fallback (`booking_url` null) |
| Dr James Chanaka | Bachelor of Medicine, FRACGP | Yes | Children’s, mental, family medicine | EN, Shona | Strong | Yes | HotDoc |
| Dr Yamesha Ranatunga | MBBS, FRACGP, BSc Nutrition | Yes | Women’s, adolescent/youth, CDM, GP | EN | Strong | **Missing** | HotDoc |

### Cross-cutting gaps

1. **CMS payload emptiness for most golden GPs** — published HTML is authoritative; CMS `areasOfCare` / quals / bio often empty (`publishedPayloadEmpty: true`). Service inject relies on CMS cards for imports only; golden rails cover legacy GPs.
2. **Person `sameAs` still references WordPress `/doctor/` URLs** on golden profiles — runtime `enrichPractitionerPersonSchema` rewrites to canonical `/doctors/*.html`.
3. **Photo consistency** — missing portraits: Nirupa, Samuel, Yamesha.
4. **Language gaps** — Mary, Nirupa, Samuel.
5. **Mary booking policy** — golden HTML still embeds HotDoc; public render must keep PHONE_ONLY (do not “fix” golden HotDoc without explicit booking-policy change).
6. **Veterans’ health** — approved for Golnar; **no dedicated service page** (maps only via her CDM cluster).

---

## B. Service → Practitioner Matrix

**Method:** Approved interests only (`knowsAbout` / professional interests / CMS `areasOfCare`) → `CARE_AREA_SERVICE_MAP` → compare to golden `#related-practitioners` rails. No ranking.

### Dead-end / weak discovery services (golden)

| Service | Golden rail | Team link | Patient risk |
| --- | --- | --- | --- |
| Pathology | None | No | Journey dead end |
| Pharmacy | None | No | Journey dead end |
| Radiology | None | No | Journey dead end |
| Allied Health | Empty rail | No | Soft dead end |

### High-value missing rail connections (approved but absent from golden HTML)

These are filled at **render time** by `injectCmsPractitionersIntoServiceHtml` when care areas match:

| Service | Missing from golden rail (approved) |
| --- | --- |
| Children’s Health | James, Yamesha (adolescent→children map) |
| Chronic Disease Care | Golnar, Yamesha |
| Family Health | James, Yamesha |
| Mental Health | James |
| Women’s Health | Yamesha |

### Unmapped approved interests (intentionally not invented into fake services)

Examples: Veterans’ health (standalone), geriatric/senior health, occupational/pre-employment (partially → medical procedures), many Mary O&G procedural labels beyond women’s/antenatal/pre-pregnancy, Kooshyar cosmetic procedure labels beyond medical-procedures, Steven chiropractic modalities beyond allied-health.

Full dump: `.tmp-phase1-matrix.json` → `unmappedAreas`.

---

## C. Patient Journey Audit

Canonical path: **Patient need → Service → Practitioner → Booking**

| Entry | Observed journey | Friction |
| --- | --- | --- |
| Home | Hero CTAs → Book / Team / Services (authority v6 frozen) | OK; deep care discovery depends on Services/Knowledge |
| Services hub | Service cards → service page → related practitioners → profile → HotDoc/phone | Strong on clinical services; **dead ends** on pathology/pharmacy/radiology/allied |
| Knowledge | Topic pages; some lack practitioner rails | Family / preventive / pregnancy had **no** related-practitioner rail before Phase 1 inject |
| Team | Directory → profile | CMS imports appear via inject; HOLD Gemunu stays out |
| Practitioner profile | Areas → related services → book | Authority generally strong; photo/language gaps; WP sameAs cleaned at render |
| Booking CTAs | HotDoc lightbox / phone / insurance notices | Mary must remain phone-only; Golnar ONLINE fallback; Usman restriction path untouched |

### Journey issues found

1. Support services end without a GP next step (fixed at render).
2. Knowledge hubs that educate but don’t surface doctors (fixed for family / preventive / pregnancy).
3. CMS GPs invisible on golden rails until care-map inject (map expanded; inject already present).
4. Extra clicks: Knowledge → Service → Team when Knowledge lacked a rail.
5. Confusion: empty allied-health “related practitioners” section.

---

## D. Recommended Improvements

### Implemented now (low risk)

1. Expand `CARE_AREA_SERVICE_MAP` (adolescent/youth, primary care, shared antenatal, pre-pregnancy, menopause/gynaecology labels, sports/chiro → allied, cosmetic/procedural → medical procedures).
2. Knowledge hub rails: add James (family), Sambo (preventive), Yamesha (pregnancy) using approved interest labels only.
3. Extend trust-link pages (mens/mental/children/preventive).
4. Support-service next steps (pathology/pharmacy/radiology/allied) → GP directory + contact **without inventing who “does” those services**.

### Recommended next (not implemented — needs content/ops)

1. Supply approved portraits for Nirupa, Samuel, Yamesha.
2. Confirm and publish Mary / Nirupa / Samuel languages (or keep explicit “not listed” copy).
3. Backfill CMS payloads for golden GPs (quals, areas, bio) so admin + inject stay aligned.
4. Decide whether Veterans’ health deserves a service/knowledge destination (content approval required).
5. Align Mary golden booking chrome with PHONE_ONLY policy (booking-policy change).
6. Purge leftover WP `sameAs` in golden source when a golden edit exception is approved.

---

## E. Implemented Improvements

| Change | File(s) | Risk |
| --- | --- | --- |
| Care-area → service map expansion | `apps/web/src/seo/care-area-service-map.ts` (+ tests) | Low — matching only approved labels |
| Knowledge rails + trust pages + support next steps | `apps/web/src/seo/authority-refinements.ts` (+ tests) | Low — additive existing patterns |
| Wire tests into `npm test` | `apps/web/package.json` | Low |
| Audit/matrix/evidence scripts | `apps/web/scripts/phase1-*.mjs` | Local only |

**Preserved:** design/layout, SEO URLs, HotDoc policies, insurance notices, Mary phone-only runtime, Gemunu HOLD, hero freeze.

**Tests:** `care-area-service-map`, `authority-refinements`, `inject-cms-service-practitioners` — all passing (13 + 3).

---

## F. Before / After Evidence

From `.tmp-phase1-before-after.json` (golden HTML → `applyAuthoritySeoRefinements`):

| Page | Before | After |
| --- | --- | --- |
| `services/pathology.html` | No GP next-step | `data-seo-support-next="gp-directory"` + team GP link |
| `services/pharmacy.html` | Dead end | Same GP next-step |
| `services/radiology.html` | Dead end | Same GP next-step |
| `knowledge/family-health.html` | No related practitioners | Rail includes Tanya + **James** |
| `knowledge/preventive-healthcare.html` | No related practitioners | Rail includes **Sambo** |
| `knowledge/pregnancy.html` | No related practitioners | Rail includes Debra/Mary/Tanya + **Yamesha** |
| Care map: adolescent | Unmapped | → `services/childrens-health.html` |
| Care map: Golnar CDM | Chronic only | Still chronic only (no invented women’s health) |
| Care map: James | Children / mental / family | Unchanged destinations |

Runtime CMS inject (already shipped) continues to append Golnar/James/Yamesha onto matching **service** rails when areas qualify.

---

## G. Remaining Strategic Gaps

1. Portrait + language authority holes (Nirupa, Samuel, Yamesha, Mary langs).
2. CMS↔golden authority dual source of truth for legacy GPs.
3. Veterans’ health destination missing.
4. Mary golden HotDoc vs runtime phone-only inconsistency.
5. Schema `sameAs` WP legacy still in golden source.
6. Staging/production deploy still gated by ops backup / cutover NO-GO (out of Phase 1 content scope).
7. No ranking / availability guarantee copy remains correct — listing ≠ endorsement.

### Success measure status

A first-time patient can move **Need → Service/Knowledge → approved Practitioner → correct booking path** with fewer dead ends on support services and clearer discovery of CMS GPs on matching clinical topics, without redesign or invented expertise. Residual friction is content completeness (photos/languages/CMS backfill), not layout.
