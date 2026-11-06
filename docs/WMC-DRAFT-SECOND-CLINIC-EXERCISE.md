# Draft Second Clinic Exercise

**Date:** 2026-11-03  
**Clinic:** Eight Mile Plains Doctors (`eight-mile-plains`)  
**Status:** `draft` only — no public website, no DNS, no golden HTML import  
**Machine evidence:** `apps/web/reports/DRAFT-SECOND-CLINIC-EXERCISE.json`  
**Runner:** `npx tsx scripts/draft-second-clinic-exercise.ts` (from `apps/web`)

---

## Updated readiness score

| | Previous (Phase 1 foundation) | After draft exercise |
| --- | --- | --- |
| **Overall** | **58 / 100** | **64 / 100** |

| Layer | Score | Note |
| --- | --- | --- |
| Prisma / clinicId model | ~82 | Draft tenant + isolated ops rows proven |
| Host → ClinicDomain | ~80 | Unchanged; draft has **zero** domains (correct) |
| Admin multi-tenant UX | ~78 | Switcher now includes draft for Network/Super Admin |
| Branding / presentation | ~55 | Profile branding works in assembler; public runtime still Gabba fallbacks |
| Second golden HTML corpus | Not started | Explicitly out of scope |

**Meaning:** Platform can operate a **non-public** second tenant in admin. It cannot yet launch a second **live** public site.

---

## What was created

| Artifact | Value |
| --- | --- |
| Clinic | `Eight Mile Plains Doctors` / `eight-mile-plains` / `draft` |
| Profile | EMP address, phone `(07) 3000 0000`, example HotDoc URL, network logo path |
| Hours | 7 opening-hours rows |
| NetworkLocation | `location_eight_mile_plains` linked, status `draft`, **no website** |
| Sample rows | Vacancy, CareerApplication, FormRequest, MediaAsset, SearchDemandSignal |
| Explicitly **not** created | `ClinicDomain`, `Page` / revisions, DNS, golden import |

Super Admin membership on EMP was upserted so switch_clinic holders can enter the tenant.

---

## Validation results (10/10)

| # | Check | Result |
| --- | --- | --- |
| 1 | Clinic provisioning | Pass — draft, 0 domains, 0 pages |
| 2 | Clinic switcher | Pass — admin list includes EMP; live list excludes EMP |
| 3 | Clinic profile | Pass — suburb/phone/hours from EMP profile |
| 4 | Clinic branding | Pass — `brandingFromClinic` returns EMP name/HotDoc (not Gabba HotDoc) |
| 5 | Vacancy isolation | Pass — EMP vacancies not visible under WMC `clinicId` |
| 6 | Applications isolation | Pass — application row clinic-scoped |
| 7 | Patient request isolation | Pass — form request clinic-scoped |
| 8 | Media isolation | Pass — **row** isolation OK; disk still under shared `assets/` |
| 9 | Search signal isolation | Pass — signal clinic-scoped |
| 10 | Dashboard scoping | Pass — EMP vs WMC vacancy/signal counts diverge by `clinicId` |

Public guards: `status !== live`, no domains, no pages → public APIs / host resolve cannot serve EMP.

---

## What worked

- Draft clinic + profile + hours without touching golden HTML or DNS.
- Clinic-scoped Prisma rows isolate vacancies, applications, patient requests, media metadata, and search signals.
- Profile-driven branding helper returns EMP identity for future public-ux inject.
- After a small platform fix, Network/Super Admin switcher can select draft tenants (labelled “(draft)”) while `listLiveClinics()` stays live-only for public/host paths.
- Migration `20261103210000_multi_tenant_foundation` applied locally (`golden_html_root`, vacancy location default).

---

## What broke (and was repaired for the exercise)

| Issue | Repair |
| --- | --- |
| Clinic switcher used `listLiveClinics()` only → draft EMP invisible | Added `listAdminSwitchableClinics()` (`live` + `draft`); layout + `switchActiveClinic` use it |
| Super Admin on WMC alone is enough for `canAccessClinic`, but EMP membership was still upserted for clarity | Membership upsert in exercise script |

No public regression: draft still rejected by `/api/clinics/[slug]/*` (`status !== live`) and host resolve (no domain / non-live).

---

## What still assumes WMC

1. Local / quick-tunnel host resolve → `DEFAULT_CLINIC_SLUG` (`woolloongabba`).
2. `site.js` last-resort HotDoc and tel fallbacks remain Gabba literals.
3. Media library disk sync still walks shared `public/assets` (rows are scoped; files are not partitioned).
4. Single shared `governance-published.js` artifact.
5. Measurement warehouse file is global until events consistently carry `clinic_slug` / partitions.
6. Root admin metadata title still “Clinic CMS \| Woolloongabba Medical Centre”.
7. Accessibility / overlay string replacements still match Gabba golden literals when serving WMC pages.

---

## What requires Phase 2

1. Approved **clinic-specific golden HTML corpus** for EMP (or any second live site).
2. `import:golden --clinic=eight-mile-plains` against that corpus (not run here).
3. Primary `ClinicDomain` + DNS + real HotDoc / AGPAL / canonical URL.
4. Promote `draft` → `live` only after import + QA.
5. Per-clinic media storage root and governance publish path.
6. Multi-host UAT beyond single default slug.
7. Insights dashboards end-to-end filtered by active clinic (composer helpers exist; chrome not fully wired).

---

## Operator notes

- Re-run exercise (idempotent clinic upsert; creates new sample rows each run):  
  `npx tsx scripts/draft-second-clinic-exercise.ts` from `apps/web`.
- In admin (after UAT rebuild): switcher should show **Eight Mile Plains Doctors (draft)** for Super Admin.
- Do **not** set EMP `status=live` or add domains until Phase 2 content is ready.
- Draft sample vacancies/applications are exercise fixtures — delete or ignore in production cutover DBs.

---

## Document history

| Date | Change |
| --- | --- |
| 2026-11-03 | Initial draft EMP exercise; readiness 58 → 64. |
