# Healthcare Doctors — Canonical Content Classification

**Classification + C0–C2 preparation implemented 2026-11-03.**  
**Registry:** [`WMC-CANON-REGISTRY.md`](./WMC-CANON-REGISTRY.md) · **Report:** [`WMC-CANON-PHASE-C0-C2-REPORT.md`](./WMC-CANON-PHASE-C0-C2-REPORT.md)  
**Date:** 2026-11-03  
**Parents:** [`WMC-MULTI-CLINIC-CONTENT-ARCHITECTURE.md`](./WMC-MULTI-CLINIC-CONTENT-ARCHITECTURE.md) · [`WMC-CONTENT-MATURITY-PROGRAM.md`](./WMC-CONTENT-MATURITY-PROGRAM.md) · [`WMC-CONTENT-MATURITY-AUDIT.md`](./WMC-CONTENT-MATURITY-AUDIT.md) · Master Brain §8–9  
**Canvas:** `wmc-hd-canonical-content`  
**Promotion process:** [`WMC-CANON-EXTRACTION-FRAMEWORK.md`](./WMC-CANON-EXTRACTION-FRAMEWORK.md) · canvas `wmc-canon-extraction-framework`

---

## Objective

Identify which **existing** Woolloongabba Medical Centre service and knowledge pages should become **Healthcare Doctors network-canonical** content versus remain clinic-local — then roadmap Canon, Flagship, and Local workstreams.

**Hard rules for later implement waves:** No new page sprawl required to *classify*; enhancements deepen existing pages. Diagram work = **reuse / correctly place existing** `assets/knowledge/authority/*` unless a later program explicitly opens new art (not this doc’s implement pass).

---

## Classification model

| Class | Meaning | Travels to other HD clinics? | Typical owner |
| --- | --- | --- | --- |
| **1. Network Canon** | Educational body, FAQ skeleton, trusted sources, authority education assets — the shared clinical narrative | **Yes** (adopt + local overlay) | Network clinical + content lead |
| **2. Flagship Authority** | Gabba-hosted pages that are the **quality bar and extraction source** for Canon; deepest hubs with full journey + pract graph today | Education → Canon; **URL/branding stays clinic** until multi-tenant adopt | WMC content + network |
| **3. Local Service** | Service pages where **delivery, booking, and practitioners** are clinic-specific; may *inherit* Canon education blocks | Education inherit; **pract/booking always local** | Clinic |
| **4. Local Clinic Content** | Must not syndicate as-is (ops, independent providers, phone-only rules, thin local aggregators) | **No** | Clinic only |

```text
Network Canon (education)
        ↑ extract / align
Flagship Authority (WMC exemplars on gabbamedicalcentre.com.au)
        ↓ inherit education
Local Service (clinic page + local pract/booking overlays)
Local Clinic Content (never shared raw)
```

---

## Service pages — classification

### Flagship Authority (service hubs)

These define Healthcare Doctors service authority quality. Education blocks are **Canon candidates**; public page remains WMC until other clinics adopt overlays.

| Page | Why Flagship |
| --- | --- |
| `services/womens-health.html` | Deepest hub grammar; pract graph; pathways |
| `services/family-health.html` | Highest authority-graph score; network entry hub |
| `services/skin-checks.html` | Depth + QLD relevance; pairs with skin KC |
| `services/mental-health.html` | High patient impact; MHCP journey |
| `services/childrens-health.html` | Family demand; vaccination adjacency |
| `services/preventive-healthcare.html` | Cross-cutting prevention hub |
| `services/chronic-disease-care.html` | Diabetes/heart coordination hub |
| `services/vaccinations.html` | Life-stage education candidate |
| `services/mens-health.html` | Life-stage pair to women’s |
| `services/skin-cancer-care.html` | Clinical pair to skin checks |

### Local Service (focused / procedure / access)

Inherit thin Canon FAQ/education where a network slug exists; **local** practitioners, fees nuance, booking.

| Page | Notes |
| --- | --- |
| `antenatal-postnatal-care.html` | Local shared-care practs |
| `pre-pregnancy-care.html` | Local booking prep |
| `pap-smear-cervical-screening.html` | Education → Canon asset exists; booking local |
| `breast-check.html` | Local screening pathway |
| `implanon-insertion-removal.html` | Local inserters |
| `iud-insertion-removal.html` | Local inserters |
| `medical-procedures.html` | Local index of offered procedures |
| `ecg.html` | Local test pathway |
| `iron-infusions.html` | Local administration |
| `spirometry.html` / `nebulising.html` | Local |
| `ear-care-ear-syringing.html` / `wound-dressings.html` | Local |
| `prostate-care.html` | Local men’s pathway |
| `telehealth.html` | **Local eligibility/rules**; education asset can be Canon |
| `allied-health.html` | Local referral model |

### Local Clinic Content (do not syndicate raw)

| Page | Why local-only |
| --- | --- |
| `pathology.html` | Independent provider at **this** site |
| `radiology.html` | Independent provider at **this** site |
| `pharmacy.html` | Independent provider at **this** site |

**Also local-only (not in services/*.html but binding):** Mary Abadir phone-only booking notices, Gabba HotDoc centre URL, AGPAL/bulk-billing claims as presented for WMC, fees copy tied to this practice.

---

## Knowledge pages — classification

### Network Canon — topic hubs

Educational hubs whose body should become network-shared (clinic adopts + local related pract/service CTAs).

| Hub | Canon priority |
| --- | --- |
| `womens-health.html` | P0 |
| `menopause.html` | P0 |
| `skin-health-skin-cancer.html` | P0 |
| `mental-health.html` | P0 |
| `diabetes.html` | P0 |
| `heart.html` | P0 |
| `chronic-disease-management.html` | P0 |
| `childrens-health.html` | P0 |
| `vaccinations.html` | P1 |
| `pregnancy.html` | P1 |
| `preventive-healthcare.html` | P1 |
| `mens-health.html` | P1 |
| `healthy-ageing.html` | P1 |
| `telehealth-access-to-care.html` | P1 (education only; eligibility local) |
| `adhd.html` | P1 |
| `cough.html` · `headache.html` · `pain.html` · `sleep.html` · `weight.html` | P2 (symptom decision aid) |

### Flagship Authority — knowledge (extraction exemplars)

Already strongest WMC KC pages; **source of truth** when lifting Network Canon.

| Page | Role |
| --- | --- |
| `knowledge/menopause.html` | Flagship KC + Canon P0 |
| `knowledge/womens-health.html` | Flagship KC + Canon P0 |
| `knowledge/skin-health-skin-cancer.html` | Flagship KC + Canon P0 |
| Deep articles (examples): `when-should-i-have-a-cervical-screening-test`, `what-happens-during-a-mental-health-care-plan`, `understanding-your-cardiovascular-risk`, `why-skin-checks-matter-in-australia`, `childhood-vaccinations-explained`, `understanding-menopause`, anxiety/MHCP cluster | Flagship articles → Canon bodies |

*Dual-label:* Flagship Authority **and** Network Canon (education). Roadmaps treat education under Canon; Gabba presentation polish under Flagship.

### Network Canon — articles (cohort)

| Cohort | Class | Count (approx.) |
| --- | --- | --- |
| Deep / mid educational guides | **Network Canon** | ~60 |
| Decision / “when should I” guides | **Network Canon** | included above |
| Synonym / naming articles (`is-this-sinus`, thrush, UTI naming, school sores, tummy-bug, hay-fever) | **Network Canon** (thin decision aids) — prefer hub FAQ merge later | 6 |
| Telehealth how/when/vs F2F | **Network Canon** education; local eligibility overlay | 3 |

### Local Clinic Content — knowledge

| Page | Why |
| --- | --- |
| `knowledge/family-health.html` | Thin **local aggregator** of other hubs; not strong Canon education — rebuild as network directory template later, keep Gabba-local until then |
| `knowledge/index.html` | Clinic KC home / IA chrome |

---

## Canon page recommendations

Applies to **Network Canon** (and Flagship pages’ educational layer).

### Educational enhancements

- Align hub intros to a shared skeleton: what it is → when to seek care → what GP can do → what to bring → trusted sources.  
- Lift best article decision paragraphs into hub summaries (**no new articles**).  
- Keep Australian guideline tone; strip Gabba-only locality from Canon body (locality stays in local overlay).

### FAQ additions

- Every Canon hub: **when urgent**, **when book GP**, **when longer appointment**, **what to bring** (minimum four).  
- Specialty packs: MHCP (mental), life-stage screening (women’s/men’s), child vs adult vaccines, telehealth suitability (education only).

### Diagram opportunities (**existing assets only**)

| Canon topic | Existing asset to ensure on Canon body |
| --- | --- |
| Women’s / life stages | `womens-life-stages-education.webp` |
| Menopause | `menopause-education.webp` |
| Skin / sun | `skin-check-education.webp`, `queensland-sun-education.webp` |
| Cervical | `cervical-screening-vs-pap-education.webp` |
| Mental health | `mental-wellbeing-*`, `mental-health-conversation-*` |
| Heart / BP | `heart-check-*`, `blood-pressure-numbers-education.webp`, `circulation-*` |
| Diabetes | `diabetes-review-*`, `glucose-*` |
| Chronic coordination | `chronic-disease-care-coordination-education.webp` |
| Vaccinations | `vaccination-life-stages-education.webp` |
| Pregnancy / children | `pregnancy-care-education.webp`, `childrens-gp-visit-education.webp` |
| Preventive / ageing | `preventive-cycle-education.webp`, `healthy-ageing-education.webp` |
| Telehealth education | `telehealth-education.webp` |
| ADHD | `adhd-referral-pathway-education.webp` |

Do **not** open a new diagram production phase in this roadmap; place or confirm existing assets.

### Internal-link improvements

- Canon hub ↔ matching Flagship service slug (stable paths).  
- Article → parent hub → service slug triangle on every Canon article.  
- Related Canon hubs (e.g. menopause ↔ mental health ↔ women’s) without Gabba-only dead ends.  
- Symptom Canon → condition Canon (cough → vaccinations/chronic as appropriate).

### Practitioner authority improvements

- Canon body: **no named Gabba doctors** (practitioners are clinic overlay).  
- Flagship Gabba pages: keep/enrich named pract cards locally.  
- Network adopt pattern: empty pract slot → clinic fills verified interests.  
- Publish network-level clinical ownership for Canon; clinic ClinicalReview on adopt.

---

## Local page recommendations (Local Service + Local Clinic Content only)

| Enhancement type | Allowed | Not allowed |
| --- | --- | --- |
| Practitioners | Named local GPs / inserters / Team CTA | Copying another clinic’s doctor list |
| Booking | HotDoc centre URL, phone-only rules, longer-appt tips for **this** site | Inventing network-wide eligibility |
| Independent providers | Pathology/radiology/pharmacy honesty for **this** premises | Presenting as network clinical canon |
| FAQs | Fees confirmation, what happens here, parking/access, “ask reception” | Rewriting clinical Canon FAQs on local-only pages without need |
| Related care | Links to local services + adopted Canon hubs | Syndicating local fees/hours into Canon |
| Visual | Local clinic exterior / team portraits | Replacing Canon education diagrams with local marketing art |

---

## Canon roadmap

| Phase | Outcome | Pages / work |
| --- | --- | --- |
| **C0 — Inventory lock** | Confirm Canon slug list = hubs P0–P2 + article cohorts above | **Done:** [`WMC-CANON-REGISTRY-V1.md`](./WMC-CANON-REGISTRY-V1.md) |
| **C1 — P0 Canon bodies** | Women’s, menopause, skin, mental, diabetes, heart, chronic, children’s hubs: FAQ minimum pack + existing diagram placement + Gabba-locality stripped from education | 8 hubs |
| **C2 — P0 article harden** | Flagship articles aligned to Canon skeleton; hub↔article↔service links | Cervical, MHCP, CV risk, skin checks, childhood vax, menopause, anxiety cluster |
| **C3 — P1 hubs** | Vaccinations, pregnancy, preventive, men’s, healthy ageing, telehealth education, ADHD | 7 hubs |
| **C4 — P2 symptom Canon** | Urgent/book packs on cough, headache, pain, sleep, weight; link to P0/P1 | 5 hubs |
| **C5 — Network package** | Document Canon export fields (per multi-clinic architecture): education, FAQ skeleton, asset refs, related Canon slugs — **no second clinic import yet** | Spec only |
| **C6 — Governance** | Network clinical owner + review cadence for Canon; clinic adopt gate separate | Process |

**Success:** Another HD clinic could adopt a Canon hub’s education + assets without copying Gabba phone, HotDoc, or doctor names.

---

## Flagship roadmap

| Phase | Outcome | Pages / work |
| --- | --- | --- |
| **F1 — Service Flagship polish** | Women’s, Family, Skin Checks, Mental Health: local pract graph + booking honesty + journey FAQs (Gabba) | Top maturity program #1–3, #14 |
| **F2 — Service Flagship set complete** | Children’s, Preventive, Chronic, Vaccinations, Men’s, Skin Cancer Care to Mature/Flagship bar | Remaining Flagship services |
| **F3 — KC Flagship exemplars** | Menopause, Women’s, Skin KC presentation quality on Gabba domain | Dual Canon+Flagship hubs |
| **F4 — Extraction** | Diff Flagship HTML → Canon education blocks (manual/spec); leave local slots behind | Feeds C1–C2 |
| **F5 — Measurement** | Track Flagship URLs for authority/booking proxies (AGE / service authority) | Insights only |

**Success:** Gabba remains the live **authority showcase**; Canon is extracted from Flagship without redesigning the site.

---

## Local roadmap

| Phase | Outcome | Pages / work |
| --- | --- | --- |
| **L1 — Booking honesty** | Telehealth eligibility; Iron/Implanon/IUD/ECG reception paths; Mary phone-only preserved | Local Service set |
| **L2 — Practitioner visibility** | Named local cards or designed Team fallback on Local Service pages with 0 doctors | Per maturity CM-02 |
| **L3 — Independent providers** | Pathology / Radiology / Pharmacy: local CTA differentiation only | Local Clinic Content |
| **L4 — Focused service deepen** | Procedure FAQs (what to bring, aftercare) — local delivery facts | ECG, iron, ear, wound, spirometry, nebulising, breast, prostate |
| **L5 — Local aggregators** | Family Health KC purpose + local related care (not Canon education) | `knowledge/family-health.html` |
| **L6 — Overlay readiness** | Document local slots: pract[], HotDoc, phone rules, independent providers, fees pointers | For future EMP/other clinic adopt |

**Success:** Local pages improve patient booking/clarity **without** claiming network-wide clinical narrative ownership.

---

## Quick reference — class counts

| Class | Services | Knowledge hubs | Articles (stance) |
| --- | ---: | ---: | --- |
| Network Canon | 0 whole pages* | 20 (ex. family-health, index) | ~87 educational (thin synonyms included) |
| Flagship Authority | 10 hubs | 3+ exemplar hubs + deep articles | Flagship subset of Canon |
| Local Service | 16 | 0 | 0 |
| Local Clinic Content | 3 independent | 2 (`family-health`, `index`) | 0 |

\*Service **education blocks** on Flagship/Local Service pages are Canon candidates; the HTML file remains clinic-hosted.

---

## Out of scope

- Implementing Canon extraction or CMS network models  
- New pages, new diagram production phase, site redesign  
- Promoting NetworkLocation stubs to live tenants  
- Changing Gabba DNS / production cutover  

---

## Document history

| Date | Change |
| --- | --- |
| 2026-11-03 | Initial HD canonical content classification + three roadmaps (no implementation). |
| 2026-11-03 | C0–C2 preparation complete — registry locked; P0 hubs + triangles prepared on Flagship host. |
