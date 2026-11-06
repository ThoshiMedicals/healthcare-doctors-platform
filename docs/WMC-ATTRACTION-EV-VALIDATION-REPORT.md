# GP Attraction — Experience Validation rollout report

**Date:** 2026-11-04  
**Environment:** UAT / `next.gabbamedicalcentre.com.au` (laptop tunnel → `127.0.0.1:3100`)  
**Scope:** Expose completed Attraction platform for stakeholder experience validation  
**Production publish:** still blocked (`PRODUCTION_PUBLISH_BLOCKED`)

---

## 1. Implementation summary

Experience Validation (EV) promote writes clinic `Page` / `PageRevision` HTML for attraction surfaces **without** publishing AttractionDocuments or calling `publishAttractionDocumentToProduction()`.

Operator entrypoints:

- Admin: **Promote to Experience Validation** on `/admin/attraction`
- CLI: `npx tsx scripts/promote-attraction-experience-validation.ts --clinic=woolloongabba --seed`

---

## 2. File-by-file change list (primary)

| Area | Paths |
| --- | --- |
| EV promote | `src/attraction-cms/experience-validation.ts`, `promote-page.ts`, `ev-shell.ts`, `inject-nav.ts`, `render/pack-pages.ts`, `render/tool-pages.ts` |
| Script | `scripts/promote-attraction-experience-validation.ts` |
| Public APIs | `src/app/api/clinics/[clinicSlug]/gp-pipeline/readiness/route.ts`, `.../eoi/route.ts` |
| Admin | `src/app/admin/(dashboard)/attraction/promote-ev-button.tsx`, `page.tsx`, `[id]/page.tsx`, `api/admin/attraction/experience-validation/route.ts`, asset-library review queue |
| Stories | `src/story-capture/seed-composite-ev.ts` |
| Nav / analytics | `src/documents/public-ux.ts`, `src/cms/modules.ts`, `public/attraction-track.js` |
| Tool clients | `public/attraction-tools/*.js`, `public/assets/attraction/opportunity-pack-summary.txt` |

---

## 3. Data migration impacts

- **No Prisma schema migration** required for EV promote.
- Seeds create/update: Attraction CMS publish-ready packs, Asset Library placeholders, composite Story Capture rows + live placements, Page/PageRevision rows for EV paths.
- AttractionDocument `publishState` remains non-`published` / non-`scheduled`.
- EV pages use `robots: noindex,nofollow` and `indexable: false`.

---

## 4. Public route inventory (EV)

| Path | Status (UAT smoke) |
| --- | --- |
| `join-our-team.html` | 200 + EV banner |
| `join-our-team/gp-opportunities.html` | 200 + EV banner |
| `join-our-team/gp-faq.html` | 200 + EV banner |
| `join-our-team/practice-support.html` | 200 + EV banner |
| `join-our-team/doctor-readiness.html` | 200 + EV banner |
| `join-our-team/provider-number-readiness.html` | 200 + EV banner |
| `join-our-team/dpa-navigator.html` | 200 + EV banner |
| `join-our-team/session-planner.html` | 200 + EV banner |
| `join-our-team/registrar-pathway.html` | 200 + EV banner |
| `join-our-team/opportunity-pack.html` | 200 + EV banner |
| `join-our-team/express-interest.html` | 200 + EV banner |
| `about-us/practice-experience.html` | 200 + EV banner |
| `about-us/community-catchment.html` | 200 + EV banner |
| `about-us/continuity-in-practice.html` | 200 + EV banner |
| `about-us/clinical-interests.html` | 200 + EV banner |

Verified on `127.0.0.1:3100` (all 15) and sample set on `https://next.gabbamedicalcentre.com.au`.

---

## 5. Admin route inventory

| Route | EV notes |
| --- | --- |
| `/admin/attraction` | Seed packs + **Promote to Experience Validation**; synthetic markers |
| `/admin/attraction/[id]` | Revisions list, validation, relationships, synthetic badge |
| `/admin/story-capture` | Destinations panel + seed composites; consent/placements/withdrawal on detail |
| `/admin/asset-library` | Taxonomy/lifecycle filters + review_due queue |
| `/admin/gp-pipeline` | Board + enquiry stage actions/audits/notifications |
| `/admin/attraction-analytics` | Advisory KPIs + read-only graph snapshot + CI insights + demo seed |
| `/admin/practice-experience` | Existing PE editor |

---

## 6. UAT validation report

| Check | Result |
| --- | --- |
| EV promote CLI with `--seed` | PASS — assets + stories + analytics demo + 15 pages |
| All attraction public paths 200 + banner on `:3100` | PASS (15/15; PE includes story rail) |
| All attraction public paths 200 + banner on `next.` | PASS (15/15) |
| Production publish helper still blocked | PASS (by design; unchanged) |
| JobPosting on attraction packs | Forbidden by schema rules (unchanged) |
| EOI / readiness public APIs auto-approve? | No — create records + notify only |
| Apex / DNS cutover | Not attempted (correct) |

---

## 7. Outstanding blockers to apex launch

Unchanged from production readiness posture:

1. Ops evidence 8/8 FAIL (`docs/WMC-PRODUCTION-READINESS-EVIDENCE.md`)
2. Attraction CMS Phase 2 production HTML publish not approved
3. Synthetic / AI placeholder content must not be treated as production truth
4. Consent + photography for identifiable people still required before non-placeholder production media
5. Formal smoke + Cloudflare Full (strict) + off-box backup + AUTH/Postgres hardening per `deployment/LAUNCH.md`

**EV on `next.` does not clear apex launch.**
