# Healthcare Doctors — Multi-Clinic Content Architecture

**Architecture blueprint only — no implementation.**  
**Date:** 2026-11-03  
**Parent:** [`WMC-MASTER-BRAIN.md`](./WMC-MASTER-BRAIN.md)  
**Related:** [`WMC-SECOND-CLINIC-READINESS.md`](./WMC-SECOND-CLINIC-READINESS.md) · [`WMC-DECISION-REGISTER.md`](./WMC-DECISION-REGISTER.md) · [`WMC-HEALTHCARE-DOCTORS-CANONICAL-CONTENT.md`](./WMC-HEALTHCARE-DOCTORS-CANONICAL-CONTENT.md) · [`WMC-CANON-EXTRACTION-FRAMEWORK.md`](./WMC-CANON-EXTRACTION-FRAMEWORK.md) (Flagship → Canon promotion)  
**Constraint:** Golden HTML remains frozen **per clinic corpus**; shared authority means shared *canon and process*, not one mutable HTML tree for all suburbs.

---

## Design principle

```text
Network (Healthcare Doctors)
  ├── Shared canon: brand, knowledge authority, service taxonomy, governance rules
  ├── Shared platform: CMS workflows, HotDoc grammar, measurement, careers UX
  └── Clinic tenants (live only with own golden HTML + ClinicDomain)
        ├── Clinic-specific: team, hours, booking, local pages, ops queues
        ├── Inherited: network knowledge/services by default
        └── Overridden: local CTAs, related practitioners, hours, availability copy
```

**Hard rule:** A `NetworkLocation` stub is not a live clinic. Live = `Clinic.status = live` + approved golden import + primary `ClinicDomain`.

---

## Entity review (current → target)

| Entity today | Ownership today | Target role |
| --- | --- | --- |
| `Network` | Exists | Global brand + positioning |
| `Clinic` / `ClinicDomain` / `ClinicProfile` | Clinic | Clinic-specific identity & hosting |
| `Practitioner` | `clinicId` | **Clinic-specific only** (team pages) |
| `Service` | `clinicId` (full copy) | **Shared service definition** + **clinic overlay** |
| `KnowledgeTopic` / `KnowledgeArticle` | `clinicId` (full copy) | **Shared knowledge canon** + **clinic adoption overlay** |
| `Vacancy` / `CareerApplication` | `clinicId` | Clinic-owned rows; **shared careers platform** UX; optional network visibility |
| `FormRequest` | `clinicId` | **Clinic-specific only** (ops / privacy) |
| `SearchDemandSignal` | `clinicId` | Clinic-collected; **network reporting** aggregates |
| `MediaAsset` | `clinicId` | Split **network brand pool** vs **clinic library** |
| `Page` / `PageRevision` | `clinicId` | **Clinic-specific golden** always |
| `ClinicalReview` | `clinicId` | Clinic publish record; gates shared |

---

## 1. Shared Content

Content and assets that belong to the **network**, not a suburb.

| Shared | Notes |
| --- | --- |
| Network name, positioning, directory (`NetworkLocation`) | Already modelled |
| Healthcare Doctors brand marks (network logo set) | Distinct from clinic `logoPath` |
| Knowledge **canon** (educational body, trusted sources, authority diagrams) | New network-scoped knowledge models or `scope=network` |
| Service **taxonomy** (canonical slugs: womens-health, skin-checks, …) | Title, core education blocks, FAQ skeletons |
| Publish-gate checklist, image authenticity rules, one-diagram-per-page policy | Process / DEC register |
| Shared runtime (`site.js`, digital-reception) | Parameterised by `data-clinic-slug` + profile |

**Not shared as content rows:** practitioner bios, clinic phone, HotDoc URLs, insurance notices, patient form payloads, resumes.

---

## 2. Clinic-Specific Content

Must never silently inherit from another clinic.

| Clinic-specific | Why |
| --- | --- |
| Golden HTML corpus / `Page` + immutable `PageRevision` | Layout & SEO ownership |
| `ClinicProfile` (address, phone, hours, HotDoc, AGPAL claim, logo, OG) | Local truth |
| `Practitioner` + doctor pages + portraits | Employment / AHPRA presentation is local |
| `FormRequest` inbox | Privacy & reception ownership |
| `CareerApplication` (+ resumes) | HR / privacy |
| Clinic `MediaAsset` photos of premises/team | Local rights |
| `ClinicalReview` publication records for clinic pages | Local sign-off |
| Local practice updates / FAQs about this site | Local ops |

---

## 3. Shared Services

Introduce a **network service definition** (conceptual):

```text
NetworkService (global)
  slug, display, summary, education blocks, FAQ skeleton,
  relatedKnowledgeSlugs[], authorityTierHints

ClinicService (today's Service row, evolved)
  clinicId, networkServiceId?, slug (usually same),
  status, relatedPractitioners[], booking/next-step overlays,
  pageId → clinic golden HTML
```

| Layer | Responsibility |
| --- | --- |
| Shared | Clinical education narrative, structure, related knowledge links |
| Clinic | Whether offered, which doctors, next-step/booking CTA, local notes |

Public URL remains clinic-hosted (`services/womens-health.html` on that clinic’s domain/corpus).

---

## 4. Clinic Service Overlays

**Inherit** network service body by default. **Override** only local slots:

| Slot | Default | Override |
| --- | --- | --- |
| Title / education / FAQs | Network | Rare (clinical network edit) |
| `relatedPractitioners` | Empty | Clinic team slugs |
| `nextStep` / booking CTA | Network template | Clinic HotDoc / phone / Mary-style rules |
| Hours / “available here” | — | Clinic profile + service flag `offered: true/false` |
| Authority diagram | Network asset | Clinic may omit if page not in corpus |

Overlay mechanism should mirror today’s `publishedPayload` overlays — **do not** fork HTML per small copy change.

---

## 5. Shared Knowledge Articles

```text
NetworkKnowledgeArticle (canon)
  slug, educationalContent, trustedSources, authority figure,
  clinicalOwnerNetwork, nextReviewDate (network cadence)

ClinicKnowledgeAdoption
  clinicId, networkArticleId / slug,
  status (adopted | local_draft | unpublished),
  relatedPractitioners[], relatedServices[], bookingCta,
  pageId (clinic revision), ClinicalReview (clinic)
```

| Inherit | Override |
| --- | --- |
| Educational body, diagrams (one per page), trusted sources | Related local doctors/services |
| Network clinical review of *canon* | Clinic publish decision & local CTA |
| Slug / path convention | Canonical host = clinic domain |

**Gabba today:** treat existing `KnowledgeArticle` rows as the first canon source to *extract upward* when multi-clinic ships — not duplicated blindly.

---

## 6. Clinic Team Pages

**Always clinic-specific.** No network practitioner entity.

| Rule | Detail |
| --- | --- |
| Model | Keep `Practitioner` + page on `clinicId` |
| Portraits | Clinic media / pixel-locked replacement |
| Booking | Clinic HotDoc or phone-only rules |
| Cross-links | Services/knowledge point *to this clinic’s* doctor slugs |
| Network directory | May list clinic names only — not shared doctor pages across domains without explicit product decision |

---

## 7. Shared Careers Platform

| Layer | Design |
| --- | --- |
| UX / platform | Shared Join Our Team patterns, Talent Community form, Applications inbox UI, status workflow |
| Data | `Vacancy` and `CareerApplication` remain **`clinicId`-owned** |
| Visibility | Clinic site shows that clinic’s active vacancies; **network careers hub** (optional) lists vacancies with `networkVisible=true` |
| Applications | Always land on one clinic (form `clinicSlug`); no silent cross-clinic applicant pool in v1 |
| Later | Explicit “also consider other locations” consent — product decision (Decision Register) |

---

## 8. Cross-Clinic Reporting

| Report | Scope | Access |
| --- | --- | --- |
| Practice Briefing Action Centre | Active clinic | Clinic admin / editors as today |
| Search opportunities / DR | Per clinic signals; network rollup | `manage_settings` clinic; network_admin rollup |
| Authority dashboards | Per clinic graph; network comparison later | Same |
| Careers / patient ops KPIs | Per clinic; network totals | Network_admin |
| Measurement warehouse | **Must** key events by `clinicId`/`clinicSlug` | Required before honest rollups |

Demo datasets remain labelled Gabba-only until replaced.

---

## A–D definitions (global matrix)

### A. Global (network)

- Network identity & positioning  
- Brand marks (network)  
- Service taxonomy + knowledge canon  
- Governance rules, publish gates, authority visual policy  
- Platform code (CMS, measurement contract, careers UX)  
- Cross-clinic reporting for network_admin  

### B. Clinic-specific

- Domains, profile, hours, HotDoc, AGPAL claim text  
- Golden HTML / pages / team  
- FormRequests, applications, resumes  
- Clinic media (premises, team)  
- ClinicalReview for clinic publications  
- SearchDemandSignal rows  

### C. Inherited (clinic receives by default)

- Network knowledge body + diagrams when adopted  
- Network service education blocks when service offered  
- Shared runtime behaviour and gate checklists  
- Network vacancy *platform* (not other clinics’ applicants)  

### D. Overridden (clinic localises)

- Related practitioners / services links  
- Booking / call CTAs and restriction notices  
- Whether a network service/article is offered/published here  
- Vacancy location & local offer copy  
- Logo / OG / practice name in chrome  
- Media replacement for clinic paths  

---

## Blueprint diagrams

### Content resolution at request time

```text
Host → ClinicDomain → Clinic
  → Load clinic PageRevision (immutable golden)
  → Resolve Service/Knowledge:
       if linked to network canon → merge canon + clinic overlay
       else → clinic-only payload
  → Resolve Practitioners → clinic only
  → applyPublicUx(clinic.profile)
  → HTML
```

### Recommended future model (conceptual — not implemented)

```text
Network
 ├─ NetworkService[]
 ├─ NetworkKnowledgeArticle[]
 ├─ NetworkMediaAsset[]          (brand / shared diagrams)
 └─ Clinic[]
     ├─ ClinicDomain[]
     ├─ ClinicProfile
     ├─ Page[] / PageRevision[]  (golden)
     ├─ Practitioner[]
     ├─ Service[] ── optional FK → NetworkService
     ├─ KnowledgeAdoption[] ── FK → NetworkKnowledge
     ├─ Vacancy[] / CareerApplication[] / FormRequest[]
     ├─ MediaAsset[]             (clinic library)
     ├─ SearchDemandSignal[]
     └─ ClinicalReview[]
```

---

## Target matrix by objective area

| Design area | Global | Clinic-specific | Inherited | Overridden |
| --- | --- | --- | --- | --- |
| **1 Shared content** | Canon knowledge, taxonomy, brand | — | Clinics adopt canon | Local CTAs |
| **2 Clinic-specific content** | — | Team, pages, ops, profile | — | — |
| **3 Shared services** | NetworkService | Offer flag + page | Education body | Doctors, booking |
| **4 Service overlays** | Slot schema | Overlay JSON | Defaults | Local slots |
| **5 Shared knowledge** | Network articles | Adoption + review | Body/diagram | Links/CTA |
| **6 Team pages** | — | Full practitioner | — | — |
| **7 Shared careers** | Platform UX | Vacancies & apps | Workflow statuses | Location, visibility |
| **8 Cross-clinic reporting** | Network rollups | Clinic briefing | Metric definitions | Filters / range |

---

## Migration posture (when implementing later)

1. **Do not** merge two clinics into one golden tree.  
2. Extract Gabba knowledge/services *up* into network canon; leave Gabba overlays pointing at canon.  
3. New clinics import their own HTML, then **adopt** network canon rather than copy-paste articles.  
4. Keep FormRequest / applications clinic-bound for privacy.  
5. Record adoption in Decision Register when shipping.

---

## Out of scope for this blueprint

- Implementation, migrations, or admin UI  
- Treating NetworkLocation stubs as live  
- Testimonials / star ratings  
- Single shared public domain for all clinics without ClinicDomain mapping  

---

## Document history

| Date | Change |
| --- | --- |
| 2026-11-03 | Initial multi-clinic content architecture blueprint (design only). |
