# Business Value & Adoption Audit

Date: 2026-11-06  
Evidence: `docs/WMC-BUSINESS-VALUE-ADOPTION-EVIDENCE.json` + live UAT DB counts  
Mode: **Audit only** — no builds, no redesigns.

Clinic: Woolloongabba Medical Centre (1 live tenant; 1 draft EMP)

---

## Executive snapshot

| Status | Meaning for WMC right now |
| --- | --- |
| **Being used** | Public site corpus, practitioner CMS publish path, knowledge/services, welcome Updates, vacancies board, attraction event logging |
| **Ready to use** | SEO redirects/sitemap/growth badges/filters — value unlocks at **apex cutover** |
| **Built, thin business value** | GP Readiness (2 packs), profile drafts (6 stuck draft), career apps (4 unworked), stories/attraction CMS, multi-clinic draft |
| **Over-engineered vs demand** | Enquiry/onboarding/first-90 pipelines at **0**; network matching; deep analytics rollups |

**Owner focus next 90 days:** cutover → fill books for accepting GPs → run recruitment CRM on real candidates → publish only high-ROI content. Pause new platform layers.

---

## Phase 1 — Platform inventory

### Classification key
- **Production Value** — delivering patient/recruitment/SEO outcomes now (or on next. as if production)
- **Planned Value** — built; value starts when cutover/ops habit starts
- **Future Value** — correct long-term; not needed for Gabba’s next quarter
- **Unused** — exists in DB/code with near-zero operational adoption

| Domain | Feature | Class | Evidence |
| --- | --- | --- | --- |
| CMS | Pages / revisions / clinical review | Production | 226 published pages; 112 revisions; 188 clinical reviews |
| Practitioner | Published profiles + overlay | Production | 15 published; 3 newly onboarded |
| Practitioner | Growth flags / badges / filters | Planned | Seeded; live on UAT; needs cutover + staff habit |
| Practitioner | Profile drafts (GP pipeline) | Unused→thin | 6 drafts, all `draft`; not the path that published Golnar/James |
| Recruitment | Vacancies on Join Our Team | Production | 4 active vacancies |
| Recruitment | Career applications inbox | Thin Production | 4 apps, all status `new` (not progressed) |
| Recruitment | GP Readiness packages | Thin / Planned | **2** packages, both `applicant` |
| Recruitment | GP Enquiry CRM | Unused | **0** enquiries |
| Recruitment | Onboarding cases | Unused | **0** |
| Recruitment | First-90 settling | Unused | **0** |
| Recruitment | Attraction documents / EV hubs | Future / thin | 6 documents; not driving hires yet |
| Recruitment | GP Stories | Thin | 3 stories |
| Content | Knowledge articles + hubs | Production | 87 published articles |
| Content | Services | Production | 29 published |
| Content | Updates | Production (low cadence) | 7 published; 2 recent welcomes |
| SEO | P0 redirects / sitemap / verify | Planned | App-verified; apex edge at cutover |
| SEO | Authority/growth audits | Planned | Guides work after go-live |
| Operations | Attraction analytics events | Production (data) | **2101** events logged — insight underused |
| Operations | Search demand signals | Unused | 1 row |
| Operations | Form requests | Thin | 1 |
| Network | Multi-clinic draft EMP | Future | Draft only; 0 public pages |

---

## Phase 2 — Workflow adoption

| Workflow | Adoption | Reality check |
| --- | --- | --- |
| GP Readiness Portal | **2** packages | Not yet a real applicant funnel; treat as pilot tooling |
| Recruitment CRM (enquiries) | **0** | Vacancies exist; structured CRM not used |
| Career applications | **4**, all `new` | Intake works; **ops follow-up** missing |
| Profile Builder drafts | **6** draft | Parallel to CMS publish; risk of dual workflows |
| Practitioner CMS publish | **High** | This is how live doctors ship |
| Updates publishing | **Low cadence** | Realistic: 1–2/month + welcomes — not a newsroom |
| Knowledge publishing | **Corpus imported** | Day-to-day edits rare; expansion should be selective |
| Multi-clinic admin | **Switchable draft** | No second public site — correct deferral |

**Updates realism:** Practice staff will not run a weekly magazine. Use Updates for welcomes, billing/hours, campaigns; put evergreen clinical copy in Knowledge only.

---

## Phase 3 — Return on development investment

| System | Build effort | Ops value now | Revenue | Recruitment | SEO | ROI now |
| --- | --- | --- | --- | --- | --- | --- |
| Practitioner CMS + public profiles | High | High | High (books) | Medium | High | **High** |
| Knowledge + services corpus | High | High | Medium-High | Low | High | **High** |
| SEO redirects / sitemap / cutover gates | Medium | Pending cutover | High | Low | Critical | **High** (at GO) |
| Practitioner growth badges/filters | Low-Med | Medium | Medium | Low | Medium | **Medium** |
| Vacancies + Join Our Team | Medium | Medium | Indirect | High | Medium | **High** if apps worked |
| Career applications inbox | Low-Med | Low (unworked) | Indirect | Medium | Low | **Medium** if process |
| GP Readiness | High | Low (2 packs) | Indirect | High *potential* | Low | **Low now / High later** |
| Attraction CMS / EV hubs | High | Low | Low | Medium potential | Low | **Low now** |
| Enquiry/onboarding/first-90 | High | None (0) | — | High potential | — | **Defer use** |
| Multi-clinic network layer | High | None for Gabba Q1 | — | Future | Future | **Defer** |
| Analytics event lake | Medium | Underused | Low | Low | Low | **Medium** (mine, don’t expand) |

---

## Phase 4 — Overbuilding risk (keep deferred)

| Defer / do not expand yet | Why |
| --- | --- |
| Candidate self-serve accounts | No enquiry volume; CRM empty |
| Multi-clinic matching / network hub product | One live clinic; EMP draft only |
| First-90 / onboarding case automation | 0 cases; process not proven manually |
| Session capacity matching | Premature vs roster reality |
| Content intelligence insight runs / knowledge graph | 1 demand signal; articles already plentiful |
| Deep attraction rollups productisation | 2101 events — **analyse first**, don’t build more collectors |
| Dual profile-builder vs CMS publish | Causes confusion; standardise on CMS publish for live site |
| New analytics dashboards | Won’t fix unworked applications |

---

## Phase 5 — Highest ROI activities (next)

| Rank | Activity | Why |
| --- | --- | --- |
| 1 | **Production cutover** (DNS/ops + SEO 301s live) | Unlocks all Planned SEO/patient value |
| 2 | **Book accepting new GPs** (Golnar/James/Yamesha) | Direct appointment capacity |
| 3 | **Work the 4 career applications + vacancies** | Recruitment ROI on what’s already built |
| 4 | Google Business / NAP consistency post-cutover | Local pack → appointments |
| 5 | Practitioner growth habit (accepting flags kept true) | Conversion on directory |
| 6 | Selective service/content (Travel/Sexual decision only) | Authority without sprawl |
| 7 | Meta polish for new GPs | Cheap SEO |
| 8 | Use Readiness only when a real candidate is in process | Don’t demo-fill |
| 9 | Mine attraction events for Join Our Team drop-offs | Free insight |
| 10 | Defer network platform build | Protects focus |

---

## Phase 6 — Team capacity

| Work | Owner |
| --- | --- |
| Cutover, redirects edge, DNS, TLS, backups | **Roshan** (+ ops) |
| Platform bugs, injects, CMS publish tooling | **Roshan** |
| Network architecture decisions | **Roshan** (decide, don’t build yet) |
| HotDoc diaries, accepting patients, phone vs online | **Practice / clinical lead** |
| Welcome copy accuracy, fees updates | **Practice staff** |
| Working applications / calling candidates | **Practice / recruiter** — must not stay with Roshan |
| Knowledge article clinical accuracy | **Clinical lead** (approve); Roshan ships |
| Google Business posts / photos | **Practice staff** |
| Automate | Cache-bust, sitemap inclusion, badge expiry, redirects verify script |
| Stay manual | Candidate judgement, clinical claims, HotDoc restrictions, fees |

---

## Phase 7 — Bottlenecks at scale

| Scale | Human | Process | Technical |
| --- | --- | --- | --- |
| **5 new GPs** | Roshan as publish bottleneck; reception booking setup | No standard onboarding checklist used in system | Portrait/HotDoc URL gates; dual draft vs CMS |
| **10 new GPs** | Clinical review + copy approval stalls | Updates/welcome every join = content debt | Media library + payload seed scripts fragile |
| **20 new GPs** | Impossible if Roshan does CRM + publish + SEO | Readiness/CRM unused → shadow spreadsheets return | Need shared person model / playbooks — **not more features first** |

**Implication:** Before 10 GPs, institutionalise a **one-page onboarding playbook** (manual) and a **single publish path** (CMS). Tools already exist; habits don’t.

---

## Phase 8 — Revenue impact roadmap

| Horizon | Highest-leverage activities | Targets |
| --- | --- | --- |
| **30 days** | Cutover; promote new GPs; GMB; work applications; phone capacity for Golnar | Appointments ↑, candidate response ↑ |
| **90 days** | Keep diaries full; 1–2 Updates max; fix Travel/Sexual decision; reciprocal doctor links on top articles | Capacity utilisation; local SEO recovery |
| **12 months** | Steady GP recruiting with CRM habit; selective content clusters; only then multi-clinic | Clinic capacity; recruitment throughput |

---

## Phase 9 — Stop doing list (do not build yet)

1. **Network Recruitment Hub product** — no multi-clinic demand in ops yet.  
2. **Candidate accounts / portals** — zero enquiries.  
3. **Onboarding/First-90 automation expansion** — zero cases.  
4. **Multi-clinic matching / find-a-doctor network** — one live site.  
5. **New analytics products** — mine 2101 events first.  
6. **Second full golden-HTML clinic** until Gabba is live and playbooks exist.  
7. **Parallel profile-builder as source of truth** — consolidate on Practitioner CMS.  
8. **Attraction CMS feature sprawl** — 6 docs / 3 stories unused for hiring outcomes.  
9. **Content intelligence / knowledge graph** — not the bottleneck.  
10. **More SEO tooling** — redirects/sitemap/growth enough until post-cutover data.

---

## Phase 10 — Executive recommendation (next 90 days)

If I owned Woolloongabba Medical Centre, I would personally focus on **going live and filling capacity**, not building more platform.

### Top 10 actions by business impact

1. **Complete production cutover** (DNS, TLS, redirects, indexable artifact, smoke).  
2. **Make Golnar / James / Yamesha bookable in real diaries** and train reception on CTAs.  
3. **Process the 4 career applications this week** (accept/reject/schedule).  
4. **Assign a human owner for vacancies** (not the platform builder).  
5. **Google Business optimisation** aligned to new site URLs post-cutover.  
6. **Keep accepting-new-patient flags accurate** weekly.  
7. **One Travel/Sexual Health decision** (page vs proxy) — no other service sprawl.  
8. **Publish only necessity Updates** (billing/hours/welcomes).  
9. **Use GP Readiness only on the next real applicant** — prove the workflow once.  
10. **Explicit freeze on new platform epics** until cutover + 30 days of live metrics.

---

## Bottom line

You have already built a **patient + practitioner + SEO platform that can earn money**.  
Recruitment **surfaces** exist; recruitment **operating rhythm** does not.  
Several advanced GP-pipeline modules are **inventory, not impact**.

The scarce resource is not software — it is **cutover execution, diary fill, and human follow-up on candidates**.
