# Healthcare Doctors — Clinic #2 Selection Audit

**Strategy only — no implementation.**  
**Date:** 2026-11-03  
**Parent:** [`WMC-MASTER-BRAIN.md`](./WMC-MASTER-BRAIN.md) · Related: [`WMC-SECOND-CLINIC-READINESS.md`](./WMC-SECOND-CLINIC-READINESS.md) · [`WMC-DRAFT-SECOND-CLINIC-EXERCISE.md`](./WMC-DRAFT-SECOND-CLINIC-EXERCISE.md) · [`WMC-MULTI-CLINIC-CONTENT-ARCHITECTURE.md`](./WMC-MULTI-CLINIC-CONTENT-ARCHITECTURE.md)  
**Canvas:** `wmc-clinic-2-selection-audit`

---

## Objective

Identify the best clinic to become the **second live platform tenant** after Woolloongabba Medical Centre (`woolloongabba`).

**Out of scope:** Building product features, editing golden HTML, provisioning DNS, or promoting any clinic to `live`.

---

## Network inventory

Source of truth for “all Healthcare Doctors clinics” = network contact directory + platform seed stubs + dedicated clinic domains found publicly.

| Clinic | Suburb | Dedicated domain (public) | Platform today |
| --- | --- | --- | --- |
| Woolloongabba Medical Centre | Woolloongabba | `gabbamedicalcentre.com.au` | **Live tenant** (excluded from #2) |
| Eight Mile Plains Family Doctors | Eight Mile Plains | `eightmileplainsdoctors.com.au` | **Draft** tenant (`eight-mile-plains`); NetworkLocation linked |
| Bald Hills Doctors | Bald Hills | `baldhillsdoctors.com.au` | External NetworkLocation stub |
| Healthcare Doctors Indooroopilly | Indooroopilly | `indooroopillydoctors.com.au` | External NetworkLocation stub |
| Cannon Hill Family Doctors | Cannon Hill | `cannonhilldoctors.com.au` | External NetworkLocation stub |
| Forest Lake Doctors | Forest Lake | `forestlakedoctors.com.au` | External NetworkLocation stub |
| Chapel Hill Family Doctors | Chapel Hill | `chapelhillfamilydoctors.com.au` | External NetworkLocation stub |
| Lawnton Country Market Medical Centre | Lawnton | `lawntonmedicals.com.au` | Listed on HD contact; **not** in seed `EXTERNAL_LOCATIONS` |

Also referenced on `healthcaredoctors.com.au` directory pages: network hub site (shared WordPress template), HotDoc listings where present.

---

## Review criteria (what was examined)

| Lens | What counted as evidence |
| --- | --- |
| Existing website quality | Dedicated clinic domain vs network-only page; content accuracy; template debt; conflict with WMC copy |
| Team information | Named GPs + usable bios (network/clinic pages) |
| Service information | Service lists, billing clarity, after-hours correctness |
| Local content readiness | Suburb/local pages, FAQs, booking pages usable as corpus seed |
| Domain readiness | Own hostname exists and resolves as clinic site |
| SEO opportunity | Catchment size, competition, satellite suburb pages, language niches |
| Revenue opportunity | Hours breadth, billing model, catchment economics, overlap with Gabba |
| Operational complexity | Platform draft status, domain cutover risk, brand/email hygiene, catchment cannibalisation |

### Score dimensions (1–10 each)

1. **Content Readiness** — quality/depth of existing public HTML that could seed a golden corpus  
2. **Team Readiness** — practitioner identity pack (names, bios, specialties, languages)  
3. **Operational Readiness** — domain + HotDoc + hours + platform proximity (draft/profile)  
4. **SEO Opportunity** — upside from a WMC-class site in that catchment  
5. **Business Value** — booking/revenue leverage if the site converts better  

**Total = sum of five scores (max 50).**

---

## Clinic evidence summaries

### Eight Mile Plains Family Doctors

| Factor | Finding |
| --- | --- |
| Website | Dedicated `eightmileplainsdoctors.com.au` + HD clinic page; template-era quality, not WMC authority depth |
| Team | Strong: Drs Aixia Wu, Ashok Kirpalani, Sumedha Amarasinghe with substantive bios; Mandarin/Cantonese/Sinhala |
| Services | Clear GP service list (women’s/men’s, kids, mental health, skin, WorkCover, travel) |
| Local content | Multiple satellite suburb pages already exist (Wishart, Underwood, Rochedale, Sunnybank, …) — raw SEO material + cleanup debt |
| Domain / booking | Domain live; HotDoc listings present |
| SEO | Southside growth corridor + language niche + satellite URLs → high opportunity if rebuilt to WMC standard |
| Revenue | Mixed billing; solid family catchment |
| Ops | **Already draft in platform** (exercise 2026-11-03); highest proximity to Phase 2. Some email/fax cross-contamination on public pages |
| Complexity | Medium content rewrite; low platform onboarding cost |

### Healthcare Doctors Indooroopilly

| Factor | Finding |
| --- | --- |
| Website | `indooroopillydoctors.com.au` + HD Indooroopilly/UQ pages; same network template generation |
| Team | Present via HotDoc / practice pages; thinner published bios than EMP network clinic archive |
| Services | Standard network GP suite; mixed billing notes |
| Local content | Clinic site + network page; less satellite sprawl than EMP |
| Domain / booking | Domain live; HotDoc centre listing |
| SEO | Affluent westside + UQ adjacency; **high competition** |
| Revenue | **Long weekday hours (to ~20:00)** + weekend — strongest access economics |
| Ops | Not drafted in platform; clean brand naming (“Healthcare Doctors Indooroopilly”) |
| Complexity | Medium–high (competitive SEO + new tenant from zero in CMS) |

### Bald Hills Doctors

| Factor | Finding |
| --- | --- |
| Website | `baldhillsdoctors.com.au` — slightly more self-contained practice narrative than pure stubs |
| Team | Named GPs on site (e.g. Han, Warakaulle, Velusamy, Yao) with specialty hints |
| Services | GP suite + skin/minor surgery messaging; mixed billing since 2022 |
| Local content | About/contact/FAQ depth moderate; northside suburb mentions |
| Domain / booking | Domain live; healthdirect + HotDoc-adjacent discovery |
| SEO | North Brisbane catchment **diversifies** from Gabba; moderate competition |
| Revenue | Solid mixed billing; weekend hours inconsistent across sources (ops/content risk) |
| Ops | Named specially in seed stub; no draft tenant yet |
| Complexity | Medium |

### Cannon Hill Family Doctors

| Factor | Finding |
| --- | --- |
| Website | `cannonhilldoctors.com.au` — template twin of other HD clinic sites |
| Team | Generic “male & female GPs” marketing; weaker published bio pack |
| Services | Standard suite; mixed billing |
| Local content | Thin local authority pages |
| Domain / booking | Domain live |
| SEO | Eastside corridor; moderate |
| Revenue | **Strong access** (incl. weekend / Sunday hours on site) |
| Ops | Geographic **overlap risk with Woolloongabba** (shared after-hours suburb lists already bleed across sites) |
| Complexity | Medium–high for brand differentiation next to Gabba |

### Forest Lake Doctors

| Factor | Finding |
| --- | --- |
| Website | `forestlakedoctors.com.au` |
| Team | Thin public team pack |
| Services | GP suite; billing messages conflict (bulk vs mixed notes across updates) |
| Local content | Moderate; after-hours copy incorrectly references Gabba-side suburbs |
| Domain / booking | Domain live; HotDoc mentioned on site |
| SEO | SW growth corridor — good long-term |
| Revenue | Good population growth; billing clarity must be fixed before authority site |
| Ops | Content hygiene debt raises cutover risk |
| Complexity | Medium–high |

### Lawnton Country Market Medical Centre

| Factor | Finding |
| --- | --- |
| Website | `lawntonmedicals.com.au` (naming differs from “Doctors” pattern) |
| Team | HotDoc practitioners exist; clinic site team depth moderate |
| Services | GP + chronic care + allied messaging |
| Local content | About history (opened 2013); sister-centre list includes Beachmere |
| Domain / booking | Domain + HotDoc (`t-medicals-lawton-country-market`) |
| SEO | North / Moreton corridor diversification |
| Revenue | Mixed billing; solid local centre |
| Ops | **Not in platform seed EXTERNAL_LOCATIONS** — extra provisioning work |
| Complexity | Higher platform + brand-alignment cost |

### Chapel Hill Family Doctors

| Factor | Finding |
| --- | --- |
| Website | `chapelhillfamilydoctors.com.au` |
| Team | Thin public bios |
| Services | Standard; HotDoc confirmed |
| Local content | Thin; westside overlap with Indooroopilly |
| Domain / booking | Domain live |
| SEO | Smaller catchment; competes with Indooroopilly if both upgraded |
| Revenue | Moderate hours |
| Ops | Better after Indooroopilly (shared west cluster) |
| Complexity | Medium; low strategic urgency as #2 |

---

## Scorecard

| Rank | Clinic | Content | Team | Ops | SEO | Business | **Total /50** |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | **Eight Mile Plains Family Doctors** | 7 | 8 | 9 | 8 | 7 | **39** |
| 2 | Healthcare Doctors Indooroopilly | 6 | 6 | 7 | 7 | 9 | **35** |
| 3 | Bald Hills Doctors | 7 | 7 | 7 | 6 | 7 | **34** |
| 4 | Cannon Hill Family Doctors | 6 | 5 | 7 | 6 | 8 | **32** |
| 5 | Forest Lake Doctors | 5 | 5 | 6 | 7 | 7 | **30** |
| 6 | Lawnton Country Market Medical Centre | 6 | 5 | 5 | 6 | 6 | **28** |
| 7 | Chapel Hill Family Doctors | 5 | 5 | 6 | 5 | 5 | **26** |
| — | Woolloongabba Medical Centre | — | — | — | — | — | Live (#1) — not scored |

---

## Decision outputs

### Clinic ranking

1. Eight Mile Plains Family Doctors  
2. Healthcare Doctors Indooroopilly  
3. Bald Hills Doctors  
4. Cannon Hill Family Doctors  
5. Forest Lake Doctors  
6. Lawnton Country Market Medical Centre  
7. Chapel Hill Family Doctors  

### Best candidate (overall #2 live tenant)

**Eight Mile Plains Family Doctors**

Best balance of (a) platform proximity already proven as draft, (b) named team + language niche, (c) southside SEO upside including existing suburb URLs that can be rebuilt under governance, (d) lower catchment collision with Gabba than Cannon Hill.

### Fastest candidate

**Eight Mile Plains Family Doctors**

Draft clinic + profile + isolation exercise already done; domain and HotDoc exist; team bios can be ported into a golden corpus sooner than starting a cold tenant.

### Highest ROI candidate

**Healthcare Doctors Indooroopilly**

Longest published hours, westside/UQ catchment economics, and a clean “Healthcare Doctors {suburb}” brand — highest conversion/revenue upside **after** a WMC-class site exists. Not the fastest path because platform draft and deep team HTML pack lag EMP.

### Recommended rollout order

| Wave | Clinic | Why |
| --- | --- | --- |
| **#2 (next live)** | Eight Mile Plains | Prove multi-tenant live path; reuse draft work; southside SEO |
| **#3** | Indooroopilly | Highest ROI westside; HotDoc + domain ready |
| **#4** | Bald Hills | Northside diversification; solid team/domain |
| **#5** | Cannon Hill | Strong hours; **only after** Gabba/Cannon brand differentiation rules |
| **#6** | Forest Lake | Growth corridor after billing/content hygiene |
| **#7** | Lawnton | Add to seed first; north corridor |
| **#8** | Chapel Hill | After Indooroopilly (shared west cluster) |

---

## Cross-clinic risks (apply to any #2)

1. **Template debt** — shared HD WordPress sites recycle Gabba after-hours suburb lists and cross-clinic emails; golden corpus must be clinic-true, not a find-replace of WMC.  
2. **NetworkLocation ≠ live** — stubs must not be promoted without approved clinic golden import + `ClinicDomain` (Master Brain / multi-clinic architecture).  
3. **Platform readiness ~64/100** — second *live* site still blocked on golden corpus + media/governance isolation ([`WMC-SECOND-CLINIC-READINESS.md`](./WMC-SECOND-CLINIC-READINESS.md)).  
4. **DNS cutover for Gabba remains NO-GO** — do not couple clinic #2 go-live to unfinished Gabba production ops evidence.  
5. **Satellite SEO pages** (especially EMP) are opportunity *and* cleanup cost — rebuild under authority/governance, do not import spammy stubs wholesale.

---

## Preconditions before EMP (or any clinic) goes live as tenant #2

1. Clinic-approved golden HTML corpus (not network WordPress scrape).  
2. Real HotDoc URL, AGPAL claim, hours, phone, logo locked in `ClinicProfile`.  
3. Primary `ClinicDomain` + DNS plan for the clinic’s hostname.  
4. Phase 2 media root + governance publish path per clinic.  
5. Promote `draft` → `live` only after import + smoke on that host.  
6. Reception/owner sign-off on billing copy and after-hours provider.

---

## Sources (public evidence, 2026-11-03)

- https://healthcaredoctors.com.au/contact-us/  
- Clinic domains: eightmileplainsdoctors.com.au, baldhillsdoctors.com.au, indooroopillydoctors.com.au, cannonhilldoctors.com.au, forestlakedoctors.com.au, chapelhillfamilydoctors.com.au, lawntonmedicals.com.au  
- HD clinic pages / team archives (EMP doctors archive; Indooroopilly HotDoc)  
- Platform: `apps/web/prisma/seed.ts` `EXTERNAL_LOCATIONS`; `docs/WMC-DRAFT-SECOND-CLINIC-EXERCISE.md`

---

## Document history

| Date | Change |
| --- | --- |
| 2026-11-03 | Initial clinic #2 selection audit (strategy only). |
