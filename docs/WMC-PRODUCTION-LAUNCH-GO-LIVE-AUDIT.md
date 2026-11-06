# Production Launch Readiness & Go-Live Audit

Date: 2026-11-06  
Mode: Audit only — no builds, no redesign.  
Observed: git `9429234` on `rg01-release-gate-repairs`; UAT `:3100` health `database:up`; `next.` returns `X-Robots-Tag: noindex, nofollow`.

**Prior evidence reused:** `WMC-PRODUCTION-READINESS-EVIDENCE.md` (ops 8/8 FAIL, 2026-11-03), `WMC-SEO-P0-LAUNCH-READINESS.md` (SEO 82/100), `WMC-BUSINESS-VALUE-ADOPTION-AUDIT.md`, DNS cutover checklist.

---

## Final recommendation

# GO WITH CONDITIONS

| Lens | Verdict |
| --- | --- |
| Patient / content product | Ready enough to replace WordPress |
| SEO preservation (app layer) | Almost Ready — edge deploy at cutover |
| Production ops / DNS cutover | **NO-GO until 8 LAUNCH.md evidence items PASS** |
| Staff-operated recruitment CRM | Not required for patient launch; do not block DNS on it |
| Multi-clinic / network platform | Explicitly **out of launch scope** |

**Meaning:** You may plan a cutover **within ~30 days** if ops conditions are cleared. You must **not** change public DNS today. You should **not** wait for recruitment CRM maturity or network features.

---

## Phase 9 — Platform maturity (launch lens)

| Platform | Score | Launch note |
| --- | --- | --- |
| Patient Platform | **86** | Services, doctors, knowledge, booking CTAs solid on UAT/`next.` |
| Practitioner Platform | **80** | CMS publish path proven (incl. 3 new GPs); draft pipeline unused |
| Recruitment Platform | **62** | Vacancies live; CRM/readiness thin adoption — OK to launch patient site without it |
| SEO Platform | **82** | P0 redirects verified on UAT; apex nginx/CF + indexability flip pending |
| Operations Platform | **45** | VPS backup/smoke/env/TLS/DNS rollback **unproven** |
| Content Platform | **84** | 87 articles / 29 services / Updates path works |
| Multi-Clinic Readiness | **64** | Irrelevant to Gabba go-live |
| **Launch readiness (overall)** | **68** | Product high; ops gate fails → conditional GO only |

---

## Phase 1 — Must / Should / Nice

### Must Have (before DNS cutover)
- Known ship SHA on VPS; build/migrate per `LAUNCH.md`
- Off-box DB + images backup + restore path
- VPS `AUTH_*` + Postgres up, 5432 not public
- Cloudflare Full (strict) + origin cert
- Logged VPS smoke test
- DNS rollback values recorded + owner online
- Apex **nginx + Cloudflare bulk** P0 redirects (same map as middleware)
- Production artifact **without** `UAT_QUICK_TUNNEL` noindex
- robots → `/sitemap.xml`; GSC ready to submit after flip
- Critical booking CTAs (HotDoc / tel) smoke on apex
- New GPs visible: profiles, team/GP index, sitemap

### Should Have (same week as cutover / week 1)
- Process career applications backlog
- Reception brief: Golnar phone-only; James/Yamesha HotDoc
- Accepting-new-patient flags accurate
- Google Business URL update post-cutover
- 404 / redirect sample monitoring plan executed
- Travel/Sexual Health decision logged (proxy OK for launch)

### Nice To Have (not launch blockers)
- GP Readiness / Enquiry / Onboarding / First-90 usage
- Practitioner growth filters habit
- Meta rewrite polish
- Suburb/tag P1 redirects
- Attraction CMS / stories expansion
- Multi-clinic / network hub

### Not required for launch
- Network Recruitment Hub
- Candidate accounts
- Content intelligence / knowledge graph
- Second live clinic
- Dual profile-draft workflow as source of truth

---

## Phase 2 — Launch blockers (ruthless)

### Technical
1. No filed **off-box backup** / rollback package  
2. VPS **AUTH_*** / DB / cert / smoke **not evidenced** (no SSH from this workstation)  
3. Production must not ship with UAT noindex  
4. Apex redirect layer not yet the live edge (middleware ≠ nginx/CF until deploy)

### SEO
1. Edge P0 301s not live on apex  
2. Indexability flip only at GO  
3. Residual high-risk WP URLs (locations/tags) — **not** P0 blockers if accepted as week-2 debt  
4. `next.` must stay noindex until cutover (currently correct)

### Content
1. None that block launch if Travel/Sexual remain proxied  
2. Gemunu / removed profiles policy — confirm 410/team behaviour on apex  
3. Staff must know Updates ≠ Knowledge cadence

### Operational
1. Entire `LAUNCH.md` 8-pack  
2. Single-person dependency (Roshan) for deploy — need cutover owner online  
3. Reception booking path training for new GPs

### Recruitment
1. **None that should block patient-site DNS**  
2. Do not treat empty Enquiry CRM as a go-live blocker  
3. Vacancies can stay live as-is

---

## Phase 3 — Broken process audit

### Patient: Search → Service → Doctor → Booking
| Step | Status | Friction |
| --- | --- | --- |
| Search → service/doctor | Strong on next. | Equity loss if cutover without 301s |
| Service → doctor | Working (incl. CMS inject) | — |
| Doctor → book | HotDoc / tel | Golnar phone-only must be understood by staff |
| End-to-end on apex | **Unproven** | Needs post-cutover smoke |

### New doctor: Recruit → Portal → Onboard → Profile → Publish
| Step | Status | Friction |
| --- | --- | --- |
| Recruit / vacancies | Live | Apps not worked |
| Readiness portal | 2 packs only | Not the default path |
| Profile drafts | 6 stuck draft | **Dead-end vs CMS publish** |
| CMS publish | **Works** | This is the real path (Golnar/James/Yamesha) |
| Bottleneck | Dual workflows | Standardise: CMS publish for live site |

### Practice manager: Candidate → Pipeline → Review → Offer → Start
| Step | Status | Friction |
| --- | --- | --- |
| Candidate intake | Partial (career apps) | 4× `new`, no progression |
| Pipeline / enquiry | **0 enquiries** | Dead end until habit exists |
| Offer / start | Outside system | Spreadsheet/email reality |
| Launch implication | Do not block DNS waiting for this journey |

---

## Phase 4 — Minimum production monitoring

| Monitor | Cadence (first 14 days) |
| --- | --- |
| `/api/health` on origin | Continuous / uptime check |
| Homepage + 5 service + 3 doctor + book CTA | Daily smoke |
| P0 redirect sample (Golnar/James + 5 landers) | Day 0, 1, 3, 7 |
| GSC Coverage + 404 spike | Daily |
| Sitemap fetch + new GP URLs | Day 0 + day 3 |
| `X-Robots-Tag` absent on apex public HTML | Day 0 |
| Career application / form delivery test | Day 0 + weekly |
| HotDoc lightbox + tel: on mobile | Day 0 |
| Cloudflare cache anomalies on `/site.js?v=` | As needed |
| Error logs / 5xx on VPS | Continuous |

---

## Phase 5 — Business readiness (can staff operate today?)

| Area | Staff-operable today? | Note |
| --- | --- | --- |
| View / share doctor & service pages | Yes (on next./post-cutover) | |
| Publish practitioner via CMS | Yes with Roshan/admin | Training thin |
| Updates / knowledge edit | Partially | Needs role + clinical approval habit |
| Recruitment CRM end-to-end | **No** | Not adopted |
| Cutover / redirects / DNS | **No — Roshan/ops only** | |
| Day-to-day reception booking | Yes if HotDoc/tel briefed | |

**Answer:** Normal staff can **use** the patient website. They cannot **run** cutover or the full recruitment stack alone. That is acceptable for go-live if patient paths are smoke-tested and one admin owner exists.

---

## Phase 6 — Technical debt (launch-relevant)

| Debt | Risk at launch |
| --- | --- |
| Laptop UAT ≠ VPS production | False confidence — already documented |
| Gabba string fallbacks in JS | Wrong if mis-deployed branding |
| Dual practitioner draft vs CMS | Confusion post-launch |
| Shared media disk | OK for one clinic |
| No SSH on operator PC | Ops evidence must come from someone with VPS access |
| P1 suburb/tag redirects incomplete | Manageable SEO debt |
| Recruitment modules unused | Maintenance cost if mistaken for launch scope |

---

## Phase 7 — Top 20 launch tasks

| # | Task | Priority |
| --- | --- | --- |
| 1 | File off-box backup + restore proof | Critical |
| 2 | Confirm VPS AUTH_* + DB locked down | Critical |
| 3 | Cloudflare Full (strict) + origin cert | Critical |
| 4 | Logged VPS smoke (`smoke-test.sh`) | Critical |
| 5 | Record DNS rollback values + owner | Critical |
| 6 | Deploy ship SHA to VPS | Critical |
| 7 | Deploy nginx + CF P0 redirect set | Critical |
| 8 | Ship indexable production (no UAT noindex) | Critical |
| 9 | Apex smoke: home, book, 3 doctors, Golnar redirect | Critical |
| 10 | Submit GSC sitemap after flip | High |
| 11 | Reception brief new GP booking paths | High |
| 12 | Verify sitemap includes new GPs on apex | High |
| 13 | Process career applications backlog | High |
| 14 | Update Google Business website URL | High |
| 15 | 14-day 404/redirect watch | High |
| 16 | Confirm Gemunu/removed URL behaviour | Medium |
| 17 | Log Travel/Sexual proxy decision | Medium |
| 18 | Freeze recruitment feature build | Medium |
| 19 | Meta polish new GPs | Low |
| 20 | P1 location/tag redirects batch | Low |

---

## Phase 8 — First 30 days after launch

### Week 1
- Stabilize: health, 5xx, booking CTAs, P0 redirects  
- GSC submit + coverage watch  
- Reception issues log (HotDoc/tel)  
- No feature work  

### Week 2
- 404 triage (locations/tags) — 410 or batch 301 only if noisy  
- Confirm new GP impressions / booking anecdotes  
- Work any new career applications  

### Week 3
- Selective content only if GSC shows clear gaps  
- Keep accepting flags accurate  
- Review analytics events for Join Our Team drop-off  

### Week 4
- Cutover retrospective: what broke  
- Decide P1 redirect batch  
- Only then consider readiness CRM habit for next hire  

---

## Phase 10 — What must complete / wait / never build

### Must complete first (before WordPress switch)
1. All 8 ops evidence items in `LAUNCH.md`  
2. Apex redirects + indexable production artifact  
3. Booking + new-GP smoke on apex  
4. Rollback package + DNS rollback owner  

### Can wait (after go-live)
- Travel/Sexual dedicated pages  
- Suburb/tag full redirect matrix  
- GP Readiness/CRM operating rhythm  
- Practitioner growth analytics  
- Meta/title keyword continuity  
- Multi-clinic  

### Should never be built (for this launch — and defer generally)
- Network Recruitment Hub / candidate accounts  
- First-90 automation expansion before manual habit  
- Content intelligence / knowledge graph  
- Second full golden clinic as a launch dependency  
- Parallel profile-builder as live source of truth  

---

## Success criteria answer

> If Woolloongabba Medical Centre switched from WordPress next month, what must be completed first, what can wait, and what should never be built?

**Complete first:** production ops evidence + apex SEO edge + booking smoke.  
**Wait:** recruitment CRM maturity, content nice-to-haves, multi-clinic.  
**Never (for launch):** network platforms, candidate portals, analytics products, dual publish pipelines.

**Verdict: GO WITH CONDITIONS** — the replacement **product** is mature enough; the **cutover operation** is not cleared. Clear the conditions, then GO. Do not GO on laptop/`next.` confidence alone.
