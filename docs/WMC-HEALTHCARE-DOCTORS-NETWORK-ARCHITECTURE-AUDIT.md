# Healthcare Doctors Network Architecture Audit

Date: 2026-11-06  
Scope: 12–24 month evolution — scalability, maintainability, recruitment leverage, practitioner growth, content authority, multi-clinic leverage.  
Not in scope: UX redesign, SEO keyword work, recruitment campaign copy.

**Grounding evidence:** Multi-tenant Phase 1 (`clinicId`, host resolve, admin switcher, branding helper), draft Eight Mile Plains exercise (64/100 second-clinic readiness), WMC-only live public tenant, clinic-scoped Prisma for practitioners/knowledge/vacancies/CRM.

---

## Executive answer

| Stay Woolloongabba-specific | Become shared Healthcare Doctors infrastructure | Become network-wide platform |
| --- | --- | --- |
| Golden HTML / public IA for Gabba | Practitioner CMS engine + workflows | Network Recruitment Hub |
| NAP, hours, fees, HotDoc, local trust | Person-centric practitioner graph + clinic overlays | Shared Knowledge Master + syndication |
| Clinic Updates & local news | GP Readiness / 19AB / spousal / provider tooling | Network ops console + candidate pool |
| Gabba SEO equity + redirects | Vacancy/application/CRM data model | Optional `healthcaredoctors.com.au` talent + content canons |
| Clinic #1 cutover ops | Media/measurement keyed by clinic | Cross-clinic rostering & placement |

**If this were your healthcare group:** Stop cloning WMC feature-by-feature for seven sites. Finish **WMC production cutover**, then invest in a **network practitioner + recruitment + knowledge master layer** before importing the next golden corpus. That order prevents building the same CMS seven times.

---

## Platform maturity scores (out of 100)

| Platform | Score | Meaning |
| --- | --- | --- |
| Patient Experience (WMC) | **84** | Strong services, directory, knowledge, booking journeys |
| Practitioner Platform | **78** | CMS, overlays, growth flags, publishing — still clinic-row, not network-person |
| Recruitment Platform | **80** | Join Our Team + readiness + CRM advanced; clinic-bound entry |
| SEO Platform | **82** | Preservation + growth sprints; Gabba-first |
| Operations Platform | **72** | Workflows/notes/tasks exist; not yet multi-clinic ops product |
| Multi-Clinic Readiness | **64** | Draft tenant proven; no second live public site |
| **Network leverage overall** | **74** | Excellent single-clinic depth; early multi-tenant bones |

---

## Phase 1 — Shared components audit

| Component | Today | 12–24m target | Notes |
| --- | --- | --- | --- |
| Practitioner CMS / overlay / publish | Clinic-scoped rows | **Shared engine**; clinic placements | Keep clinicId on placement, not only on person |
| Practitioner profiles (public) | Per-clinic pages | Shared person + clinic presentation | Avoid 7 divergent HTML generators |
| Completeness / growth scoring | WMC | Shared scoring service | Same rubric, clinic thresholds |
| Recruitment CRM | Clinic-scoped | Shared CRM + clinic ownership | One candidate, many clinic interests |
| GP Readiness / 19AB / spousal / provider | Clinic-attached | **Network product** with clinic context | Highest reuse ROI |
| Doctor profile builder / drafts | Clinic | Shared | |
| Updates engine | Clinic pages | Shared engine; clinic feeds | |
| Knowledge Hub | Clinic-scoped articles | **Master content + syndication** | Canonical strategy required |
| Services IA | Clinic golden | Shared taxonomy; clinic catalogue | Same service types, local copy |
| Host/domain resolve | Ready | Ready | Already multi-domain capable |
| Branding / profile inject | Partial | Shared | Finish killing Gabba literals |
| Golden HTML import | Per-clinic root | Shared importer | Second corpus is long pole |
| Measurement | clinic_slug stamped | Shared warehouse | |

---

## Phase 2 — Practitioner network strategy

### Recommendation: **Network Person + Clinic Placement** (not pure copy-paste profiles)

```
PractitionerPerson (network identity)
  name, AHPRA, quals, languages, bio master, media
  └── ClinicPlacement[] (woolloongabba | indooroopilly | …)
        acceptingNewPatients, availability, bookingUrl, relatedServices,
        local bio blurb, roster visibility, newToPracticeAt
  └── PublicPage per clinic (or shared route with clinic host)
```

| Question | Answer |
| --- | --- |
| Reuse one doctor across clinics? | **Yes** for identity & clinical facts |
| Clinic-specific overrides? | **Required** — HotDoc URL, accepting flag, fees notes, local services |
| Same URL everywhere? | **No** — each clinic host should serve `/doctors/{slug}` with that clinic’s placement; optional network “find a GP” index later |
| What not to do | Duplicate seven independent Practitioner rows that drift |

**Near-term (compatible with current schema):** Keep `Practitioner.clinicId` rows; add optional `networkPersonId` / link table when second live clinic needs a shared GP. Do not block WMC cutover on this.

---

## Phase 3 — Recruitment network strategy

### Recommendation: **Yes — Healthcare Doctors Recruitment Hub** as the primary GP entry, with clinic routing.

| Benefits | Complexity | Advantages |
| --- | --- | --- |
| One talent brand; larger perceived network | Auth, privacy, clinic assignment UX | Candidates stop re-applying clinic-by-clinic |
| Shared readiness (19AB, provider, spousal) once | Data model already close | Faster fill across Indooroopilly ↔ Gabba ↔ EMP |
| Central CRM pipeline | Change management for PMs | Better forecasting of VR/AGPT supply |
| Clinic pages keep local Join Our Team CTAs | SEO: hub vs clinic careers cannibalisation | Hub = commercial intent; clinics = local trust |

**Pattern:** Hub captures EOI → readiness pack → CRM stages → **clinic placement offer**. Clinic sites deep-link into hub with `?clinic=` preselected, not separate CRMs.

**Do not:** Delete clinic Join Our Team pages. They remain local conversion + SEO; hub is the system of record.

---

## Phase 4 — Content network strategy

| Content type | Shared (master) | Clinic-specific |
| --- | --- | --- |
| Diabetes, skin checks, vaccinations, travel, mental health explainers | **Master article** | Intro sentence, NAP, booking CTA, related local GPs |
| Women’s / children’s evergreen guides | Master | Local practitioners module |
| Fees, billing, after-hours, new patients | — | **Clinic only** |
| Welcome Dr X | — | Clinic Updates |
| Catchment / suburb mentions | Light shared guidance | Clinic contact & service pages |
| Recruitment offer facts | Network policy + clinic offer config | Clinic vacancy cards |

**Rule:** Write clinical education once; **syndicate with clinic chrome**. Never seven near-duplicate diabetes articles.

---

## Phase 5 — SEO network strategy (no thin duplicates)

| Asset | Strategy |
| --- | --- |
| Knowledge masters | One canonical URL (prefer strongest domain first = Gabba, or future `healthcaredoctors.com.au/knowledge/…`) |
| Clinic mirrors | Either (A) no full republish — link out to canonical, or (B) syndicated page with `rel=canonical` to master + unique local modules |
| Practitioner authority | Clinic profile URLs keep local E-E-A-T; network person schema `sameAs` links placements |
| Recruitment | Hub for “GP jobs Brisbane network”; clinic pages for “GP job Woolloongabba” |
| Services | Clinic service URLs remain (local intent); shared taxonomy IDs for internal linking |
| Risk to avoid | Seven identical articles → Google picks one randomly and dilutes all |

**Sequence:** Perfect Gabba clusters first (already ~81 content maturity) → extract masters → syndicate to clinic #2 with canonicals.

---

## Phase 6 — Operations platform roadmap

| Phase | Focus | Deliverables |
| --- | --- | --- |
| **Phase 2** (now→~3–6 mo) | Multi-clinic ops hardening | Second golden corpus OR progressive IA; media roots; governance per clinic; finish branding literals; WMC cutover |
| **Phase 3** | Network practitioner + recruitment | `networkPerson` / placements; Recruitment Hub MVP; shared readiness detached from single clinic UI |
| **Phase 4** | Network content + intelligence | Knowledge master + syndication; cross-clinic dashboards; placement analytics; optional network find-a-doctor |

Publishing workflow stays: Draft → Review → Approve → Publish — **engine shared**, **approval rights clinic-scoped**.

---

## Phase 7 — Technology debt (will hurt at clinic #3)

| Debt | Impact if ignored |
| --- | --- |
| Golden HTML per clinic as full corpus | Months per site; blocks live tenant #2 |
| Gabba string fallbacks in `site.js` / handoffs | Wrong phone/HotDoc on new tenants |
| Shared `public/assets` + governance JS | Cross-clinic media bleed |
| Practitioner = clinic row only | Duplicate doctors across sites |
| Knowledge `clinicId` only (no master) | Content rewritten 7× |
| Recruitment EOI clinic-bound | Fragmented candidate pool |
| UAT/tunnel → `DEFAULT_CLINIC_SLUG` | Weak multi-host QA |
| Measurement warehouse still maturing | Can’t compare clinics |
| Manual onboarding scripts | Fragile GP launches |
| HotDoc per-doctor URLs unmanaged | Booking drift |

---

## Phase 8 — 12-month network roadmap

### Immediate (0–30 days)
1. **Ship WMC production cutover** (SEO + ops gates) — network is worthless if Gabba isn’t live.  
2. Freeze “no seventh copy of CMS” as a decision register rule.  
3. Document clinic vs network ownership matrix (this audit).  
4. Complete branding literal purge plan.  
5. Rank clinic #2 for live public (EMP draft exists; selection audit already done).

### 3 months
1. Provision clinic #2 path: golden strategy (full corpus vs progressive templates).  
2. Per-clinic media + governance artifacts.  
3. Recruitment Hub information architecture (still may point at WMC readiness).  
4. Spec `networkPersonId` + placements (design only or thin schema).  
5. Knowledge canonical policy written and applied on Gabba clusters.

### 6 months
1. First non-Gabba **live** public tenant (or template-driven MVP).  
2. Recruitment Hub MVP + clinic deep-links.  
3. Shared readiness usable under two clinic contexts.  
4. Pilot 10 master articles syndicated with canonicals.  
5. Network admin dashboard: candidates × clinics.

### 12 months
1. 3+ clinics on shared practitioner/recruitment infrastructure.  
2. Knowledge master library covering top commercial intents.  
3. Cross-clinic GP placement (one person, multiple HotDoc endpoints).  
4. Ops automation for onboarding (replace script-heavy path).  
5. Decision on network consumer domain for talent + knowledge.

---

## Phase 9 — Maturity (detail)

Already scored above. Multi-clinic **64** is the binding constraint on network leverage; Patient/SEO/Recruitment scores are high **because of Gabba concentration**, not because the network is productised.

---

## Phase 10 — Final recommendation & top 20 opportunities

### What I would focus on next
1. **Gabba live cutover** (cashflow + SEO equity).  
2. **Network practitioner identity model** (stop future duplication).  
3. **Recruitment Hub + shared readiness** (highest labour ROI).  
4. **Knowledge masters + canonical syndication**.  
5. **Clinic #2 live path** only after 1–3 are designed—not before.

### Top 20 by business impact

| Rank | Opportunity | Impact | Effort |
| --- | --- | --- | --- |
| 1 | WMC production DNS/ops cutover | Critical | Ops |
| 2 | Decision: shared vs cloned CMS (lock it) | Critical | Policy |
| 3 | Network practitioner person + placements design | Very high | Arch |
| 4 | Healthcare Doctors Recruitment Hub MVP | Very high | Product |
| 5 | Shared GP Readiness as network product | Very high | Product |
| 6 | Knowledge master + `rel=canonical` policy | Very high | Content/Eng |
| 7 | Kill Gabba hardcoded fallbacks | High | Eng |
| 8 | Per-clinic media/storage roots | High | Eng |
| 9 | Clinic #2 live provisioning (domains/pages) | High | Eng/Ops |
| 10 | Golden strategy: templates vs full corpus | High | Arch |
| 11 | Candidate pool visible across clinics | High | CRM |
| 12 | Clinic deep-link EOI with preselected clinic | High | Product |
| 13 | Syndicated articles with local GP modules | High | Content |
| 14 | Shared service taxonomy IDs | Medium-high | Arch |
| 15 | Network ops dashboard (pipeline × site) | Medium-high | Product |
| 16 | Measurement warehouse multi-clinic compare | Medium-high | Data |
| 17 | Multi-host UAT for tenant QA | Medium | Eng |
| 18 | Automated practitioner onboarding playbook | Medium | Ops |
| 19 | Network find-a-doctor (phase later) | Medium | Product |
| 20 | Consumer network domain for talent/knowledge | Medium | Brand/SEO |

---

## Clinic portfolio mapping (7 sites)

| Clinic | Suggested near-term role |
| --- | --- |
| Woolloongabba | **Reference implementation** + SEO equity holder |
| Eight Mile Plains | Draft tenant / next live candidate (already exercised) |
| Indooroopilly, Chapel Hill, Cannon Hill, Forest Lake, Bald Hills | External/`NetworkLocation` until shared stack ready — do not rebuild WMC seven times |

---

## Document history

| Date | Note |
| --- | --- |
| 2026-11-06 | Network architecture audit; scores and 12–24m roadmap. |
