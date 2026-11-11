# Agent C — CMS Completeness & Service Relationships Audit (Phase 2)

**Branch:** `phase2/agent-c-cms`  
**Baseline:** `6f1b0b28513e0be2c5d74392e94182f0aa49b05c`  
**Clinic:** `woolloongabba` (Woolloongabba Medical Centre)  
**Evidence date:** 2026-11-11  
**Method:** READ-ONLY Prisma (`localhost:5432/wmc`), golden HTML (`old-html/doctors`, `old-html/services`), Phase 1 source review (`care-area-service-map.ts`, `inject-cms-*.ts`). **No database writes.**

**Artifacts (gitignored / optional):**

- `apps/web/.tmp-phase1-golden-doctors.json` (12 golden profiles)
- `apps/web/.tmp-phase1-golden-services.json` (29 service pages)
- `apps/web/.tmp-phase1-cms-practitioners.json` (16 CMS rows)
- `apps/web/.tmp-phase2-agent-c.json` (Agent C consolidated evidence)

---

## Executive summary

| Inventory | Count | Status |
| --- | ---: | --- |
| CMS practitioner rows (WMC) | 16 | 15 `published`, 1 `on_hold` (Gemunu) |
| Golden HTML doctor profiles | 12 | Authoritative public HTML |
| Service pages (`old-html/services`) | 29 | All have `#related-practitioners` section |
| CMS import GPs (`practitioner_import`) | 3 | Golnar, James, Yamesha — full payloads |
| Published rows with `publishedPayloadEmpty: true` | 11 | 10 golden-master GPs + Tanya (partial column data) |

**Headline findings**

1. **Dual source of truth:** Public pages for golden GPs are complete in HTML; CMS `publishedPayload` is empty for **10 of 12** golden-linked GPs. Only **Dr Debra Larkins** has a complete golden-master payload; imports are complete.
2. **Service inject is import-scoped:** `injectCmsPractitionersIntoServiceHtml` only lists practitioners where page revision `source === "practitioner_import"`. Backfilling golden CMS payloads **does not** change service rails unless product changes that filter.
3. **Phase 1 care map is intact** (17 regex rules); runtime inject adds James/Yamesha/Golnar on **5 service paths** where golden rails were thin.
4. **Veterans' health** is an approved CMS interest (Golnar) with **no** `CARE_AREA_SERVICE_MAP` destination and **no** golden service page — content decision required.
5. **Golden journey dead ends** on pathology/pharmacy/radiology/allied remain in source HTML; Phase 1 mitigated at render via `authority-refinements` (not re-audited here). **No duplicate practitioner slugs** in CMS.

---

## A. CMS backfill plan (golden GPs — no DB writes in Phase 2)

### Objective

Align CMS `publishedPayload` + column fields with **golden HTML + Person schema** so admin, measurement, and future inject/search use one approved dataset — without changing public HTML or inventing interests.

### Reference implementation

**Dr Debra Larkins** — `publishedPayloadEmpty: false`, bio ~338 chars, qualifications, languages, `areasOfCare` including shared antenatal (maps to antenatal service). Use as validation template after each backfill.

### Payload shape (`PractitionerContent` / `practitionerFromPayload`)

| Field | Source (golden) | Extraction rule | Notes |
| --- | --- | --- | --- |
| `name` | `<h1>` / Person `name` | Literal from schema | Must match public page |
| `biography` | `#biography` section plain text | Strip tags; preserve approved copy | Length should match golden `bioLen` |
| `qualifications` | Person `hasCredential` + Qualifications `<p>` | String array (e.g. `MBBS`, `FRACGP`) | Mary: FRANZCOG not FRACGP |
| `languages` | Person `knowsLanguage` + Languages `<p>` | ISO/name as already used on site | Mary, Nirupa, Samuel gaps in golden — backfill only what golden lists |
| `areasOfCare` | Person `knowsAbout` | **Primary** list for care-map alignment | Do not add interests not in schema/HTML |
| `professionalInterests` | `#professional-interests` `<li>` | Subset or full list where section adds detail beyond `knowsAbout` | May mirror Debra pattern |
| `portraitFile` | `assets/team/<file>.webp` | Basename only | Nirupa, Samuel, Yamesha: null in CMS — ops gap, not invented |
| `bookingUrl` | Existing CMS row `bookingUrl` | **Keep current HotDoc URLs** | Mary: retain null/phone policy at **render** (`PHONE_ONLY`); do not “fix” golden HotDoc without booking-policy sign-off |
| `relatedServices` (optional) | `href="../services/..."` on profile | Paths without `../` | Evidence-only links already on golden pages |
| Page revision `source` | — | Stay `golden-master` | Must **not** flip to `practitioner_import` without explicit governance |

### Per-practitioner backfill queue (golden-master, published)

| Practitioner | Payload empty? | Golden evidence | Priority fields |
| --- | --- | --- | --- |
| Dr Anand Singh | Yes | 5 knowsAbout, quals, langs, bio 322 | Full row |
| Dr Kooshyar Karimi | Yes | Rich interests + procedures | Full row; unmapped procedural labels stay unmapped |
| Dr Mary Abadir | Yes | O&G interests, FRANZCOG | Full row; langs if approved |
| Dr Nirupa Sivathasan | Yes | FRACGP, bio, interests | Full row + portrait ops |
| Dr Sambo Luon | Yes | Preventive/vaccination alignment | Full row |
| Dr Steven Chang | Yes | Chiro modalities | Full row; allied map via chiropractic rule only |
| Dr Sumita Singh | Yes | Standard GP profile | Full row |
| Dr Tanya Goodwill | **Yes** (but DB columns have partial areas) | 12+ knowsAbout, strong bio in HTML | **Serialize columns into `publishedPayload`** + complete from golden |
| Dr Usman Gul | Yes | Men's health focus | Full row; booking restriction slug untouched |
| Dr Wasantha Hettiarchchi | Yes | Travel/occupational interests | Full row |
| Mr Samuel Stafford | Yes | Thin bio, physiotherapy | Full row + portrait ops |

**Skip / no backfill**

- **Dr Gemunu Suresh Ranawake** — `on_hold`, page archived (recruitment HOLD).
- **Dr Golnar Mortezaei, Dr James Chanaka, Dr Yamesha Ranatunga** — already complete `practitioner_import` payloads.

### Suggested execution workflow (Phase 3 ops)

1. Script: parse golden HTML → draft `PractitionerContent` JSON per slug (diff against Debra).
2. Admin review + publish gate (no auto-publish).
3. Verify `practitioner-growth` / dashboard reports show areas without changing public HTML render (golden revision still authoritative for HTML body).
4. Re-run `phase1-audit-cms.mjs` until `payloadEmptyPublished` is 0 (excluding HOLD).

---

## B. Service relationship verification

### Phase 1 map & inject — protections intact?

| Check | Result |
| --- | --- |
| `CARE_AREA_SERVICE_MAP` rule count at baseline | **17 rules** — unchanged by Agent C |
| Women's ≠ men's regex guard | Present (`(^|[^a-z])men's health`) |
| Veterans' **not** mapped to women's/chronic inventively | Confirmed by `care-area-service-map.test.ts` |
| `inject-cms-service-practitioners.ts` | Still `matchingCareLabel` only; no golden card rewrites |
| Import filter in `listImportedPublishedPractitioners` | Still `source === "practitioner_import"` (3 slugs) |
| Duplicate inject guard | Skips if `pagePath` or `data-cms-practitioner` already in HTML (tested for James/mental-health) |

**Note:** Local `phase1-build-matrix.mjs` embeds an **older 11-rule map** for offline matrix only; production/runtime uses `care-area-service-map.ts`. Agent C matrix evidence uses the **full 17-rule** map in `.tmp-phase2-agent-c.json`.

### Runtime CMS inject matrix (golden rail + inject adds)

Services where **import GPs** are appended at render (not already on golden rail):

| Service path | Golden rail count | Inject adds (slug → via care label) |
| --- | ---: | --- |
| `services/childrens-health.html` | 2 | James → Children's health; Yamesha → Adolescent and youth health |
| `services/chronic-disease-care.html` | 2 | Golnar → Chronic disease management; Yamesha → Chronic disease management |
| `services/family-health.html` | 9 | James → Family medicine; Yamesha → General practice |
| `services/mental-health.html` | 2 | James → Mental health |
| `services/womens-health.html` | 6 | Yamesha → Women's health |

**Golnar** does not inject on any service from Veterans' interest alone (unmapped). CDM interests inject only on chronic-disease-care.

### Golden-only rails vs care map (expected)

Golden HTML lists practitioners on service rails by **editorial choice**, not only regex map. Examples of `onRailWithoutMapEvidence` (Phase 1 matrix): procedural pages (implanon, IUD, pap smear) listing GPs without a strict `areasOfCare` string match — **not a defect** if golden HTML is authoritative.

### Missing relationships (approved interests, no service destination)

Distinct **unmapped** labels (evidence in `.tmp-phase2-agent-c.json` → `unmappedAreas`, 22 rows):

- **Veterans' health** (Golnar, CMS) — see Section C
- **Geriatric medicine** (Anand) — no dedicated service; family/preventive hubs only
- **Kooshyar** — emergency/internal medicine + procedural injectables (partial medical-procedures match only where labels hit regex)
- **Mary** — several O&G procedural labels beyond women's/antenatal/pre-pregnancy map
- **Steven** — modality-specific chiro labels (generic chiropractic → allied-health only)
- **Wasantha** — occupational health; travel medicine → vaccinations rule only if label matches
- **Samuel** — physiotherapy (no physio service page)

**No invented map extensions recommended** without content approval.

### Duplicates

- CMS practitioner `slug`: **no duplicates** among published rows.
- Service inject: **idempotent** — existing `href` to same doctor prevents second link.

### Dead-end journeys (golden source)

| Service | Golden practitioners | Team link | Risk |
| --- | ---: | --- | --- |
| `services/pathology.html` | 0 | No | Dead end in golden |
| `services/pharmacy.html` | 0 | No | Dead end in golden |
| `services/radiology.html` | 0 | No | Dead end in golden |
| `services/allied-health.html` | 0 | No | Empty rail |

Phase 1 added render-time GP directory next steps for support services (documented in `WMC-STRATEGIC-RECOVERY-PHASE-1.md`); golden files unchanged.

### Weak discovery (rails exist, thin)

- `services/telehealth.html` — 0 practitioners, has team link
- `services/iron-infusions.html` — 0 practitioners, has team link
- `services/ear-care-ear-syringing.html` — 0 practitioners, has team link

Acceptable if intentional; no CMS inject today.

---

## C. Content approval requirements

### Veterans' Health destination gap

| Item | Evidence |
| --- | --- |
| Approved interest | Golnar `areasOfCare`: "Veterans' health" |
| `servicesForCareAreas(["Veterans' health"])` | **[]** — intentional in Phase 1 tests |
| Dedicated golden service page | **None** among 29 services |
| Updates feed mention | `updates-data.js` lists Veterans' health under Golnar |
| Patient journey | Need → no service/knowledge URL → profile/search only |

**Decision required (content/governance):**

1. **Option A — Knowledge hub** (e.g. DVA/GP chronic care guide) linking family health, chronic disease, preventive healthcare, Golnar profile — matches existing CDM cluster.
2. **Option B — New service page** — only if clinical/ops sign approved URL, copy, and governance registry entry (Phase 3+; not Agent C scope).
3. **Option C — Status quo** — keep interest on profile + updates only; document in reception index keywords (already partially present).

**Do not** add a `CARE_AREA_SERVICE_MAP` row without approved destination page.

### Other approval-sensitive items

| Topic | Stakeholder |
| --- | --- |
| Mary HotDoc in golden vs `PHONE_ONLY` runtime | Booking policy owner |
| Missing portraits (Nirupa, Samuel, Yamesha) | Media governance |
| Mary / Nirupa / Samuel languages | Practitioner or practice manager |
| Extending service inject to golden GPs after backfill | Product + SEO (would change “imports only” rule) |

---

## D. Proposed improvements

### Low risk (Phase 2 — evidence-based, no map edits by Agent C)

1. **CMS payload backfill** per Section A (admin publish, golden HTML as source).
2. **Normalize Tanya** — merge existing column `areasOfCare` / `professionalInterests` into `publishedPayload` to fix `publishedPayloadEmpty` inconsistency.
3. **Align `phase1-build-matrix.mjs`** with full 17-rule map (developer ergonomics only).
4. **Post-backfill verification** — re-run read-only audits; confirm dashboard practitioner authority metrics populate.
5. **Reception index** — ensure Golnar Veterans' keyword routes to approved destination once chosen (Section C).

### Phase 3 / ops (separate from Phase 2 code)

1. Veterans' knowledge or service destination (Section C).
2. Approved portraits upload + `portraitPath` for Nirupa, Samuel, Yamesha.
3. Language copy approval for Mary, Nirupa, Samuel.
4. Optional product decision: widen `listImportedPublishedPractitioners` to golden-master with non-empty `areasOfCare` for service inject (behaviour change; tests + governance).
5. Golden HTML booking chrome alignment for Mary (if policy changes).
6. Purge WordPress `sameAs` in golden doctor source when golden-edit exception granted.

---

## Verification checklist (Agent C)

- [x] 15 published + 1 HOLD practitioner records reviewed
- [x] 29 service pages inventoried
- [x] CMS vs golden payload completeness compared
- [x] `CARE_AREA_SERVICE_MAP` + inject behaviour reviewed (files not modified)
- [x] Service relationship matrix + inject adds documented
- [x] Unmapped approved interests listed (no invention)
- [x] Duplicates: none
- [x] Dead-end / thin journeys listed
- [x] Veterans' Health gap documented
- [x] No staging/production DB writes

---

*Agent C — Phase 2 CMS & service audit. Protected Phase 1 files untouched.*
