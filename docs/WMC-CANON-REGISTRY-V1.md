# Healthcare Doctors Canon Registry v1

**Version:** 1.0  
**Locked:** 2026-11-03  
**Phase:** C0 — inventory lock only (**no implementation**)  
**Machine file:** [`WMC-CANON-REGISTRY-V1.json`](./WMC-CANON-REGISTRY-V1.json)  
**Parents:** [`WMC-HEALTHCARE-DOCTORS-CANONICAL-CONTENT.md`](./WMC-HEALTHCARE-DOCTORS-CANONICAL-CONTENT.md) · [`WMC-CANON-EXTRACTION-FRAMEWORK.md`](./WMC-CANON-EXTRACTION-FRAMEWORK.md) · [`WMC-CANON-GOVERNANCE-SPECIFICATION.md`](./WMC-CANON-GOVERNANCE-SPECIFICATION.md)

This registry is the **authoritative C0 lock** of what may become Network Canon. It does not extract packages, change pages, create diagrams, or alter booking.

---

## Classification model

| Class | Meaning |
| --- | --- |
| **Canon P0** | First extraction / harden priority — high educational + multi-clinic value |
| **Canon P1** | Network Canon after P0 — strong education, deferred deepen |
| **Canon P2** | Symptom / thin decision aids — Canon class, later pack |
| **Not Canon** | Must not syndicate as Network Canon education |

**Package types:** `knowledge_hub` · `knowledge_article` · `service_education` (educational layer only)

### Default governance (all Canon candidates)

| Field | Value |
| --- | --- |
| Owner | Network Canon education lead |
| Clinical owner | Healthcare Doctors Network Clinical Review |
| Review cycle | 12 months |
| Public strip | reviewedBy, contentOwner, lastReviewed, nextReview |
| Private evidence | Approver / approval reference / fingerprint — never in public Canon package |

---

## Counts

| Surface | P0 | P1 | P2 | Not Canon |
| --- | ---: | ---: | ---: | ---: |
| Knowledge hubs | 8 | 7 | 5 | 2 |
| Flagship service education | 8 | 2 | 0 | 0 |
| Articles | 12 | 53 | 22 | 0 |

**Canon-class candidates:** 117 · **Excluded hubs:** 2

---

## 1. Knowledge hubs

### 1.1 Summary index

| Canonical slug | Priority | Owner | Review cycle | Diagram asset | Related hubs | Related services | FAQ coverage |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `womens-health` | P0 | Network Canon education lead | 12 mo | `womens-life-stages-education.webp` | `menopause`, `pregnancy`, `preventive-healthcare`, `mental-health` | `womens-health`, `pap-smear-cervical-screening`, `pre-pregnancy-care`, `antenatal-postnatal-care` | present (14 FAQ items on page (≥4 Canon minimum)) |
| `menopause` | P0 | Network Canon education lead | 12 mo | `menopause-education.webp` | `womens-health`, `mental-health`, `healthy-ageing`, `preventive-healthcare` | `womens-health`, `preventive-healthcare`, `mental-health` | present (15 FAQ items on page (≥4 Canon minimum)) |
| `skin-health-skin-cancer` | P0 | Network Canon education lead | 12 mo | `skin-check-education.webp` | `preventive-healthcare` | `skin-checks`, `skin-cancer-care`, `medical-procedures` | present (14 FAQ items on page (≥4 Canon minimum)) |
| `mental-health` | P0 | Network Canon education lead | 12 mo | `mental-wellbeing-education.webp` | `sleep`, `womens-health`, `mens-health`, `adhd` | `mental-health`, `telehealth`, `family-health` | present (11 FAQ items on page (≥4 Canon minimum)) |
| `diabetes` | P0 | Network Canon education lead | 12 mo | `glucose-education.webp` | `chronic-disease-management`, `heart`, `weight`, `preventive-healthcare` | `chronic-disease-care`, `preventive-healthcare` | present (14 FAQ items on page (≥4 Canon minimum)) |
| `heart` | P0 | Network Canon education lead | 12 mo | `circulation-education.webp` | `chronic-disease-management`, `diabetes`, `preventive-healthcare`, `mens-health` | `preventive-healthcare`, `chronic-disease-care`, `ecg` | present (15 FAQ items on page (≥4 Canon minimum)) |
| `chronic-disease-management` | P0 | Network Canon education lead | 12 mo | `chronic-disease-care-coordination-education.webp` | `diabetes`, `heart`, `healthy-ageing`, `preventive-healthcare` | `chronic-disease-care`, `preventive-healthcare` | present (15 FAQ items on page (≥4 Canon minimum)) |
| `childrens-health` | P0 | Network Canon education lead | 12 mo | `childrens-gp-visit-education.webp` | `vaccinations`, `cough`, `pregnancy` | `childrens-health`, `vaccinations`, `family-health` | present (18 FAQ items on page (≥4 Canon minimum)) |
| `vaccinations` | P1 | Network Canon education lead | 12 mo | `vaccination-life-stages-education.webp` | `childrens-health`, `preventive-healthcare`, `healthy-ageing`, `pregnancy` | `vaccinations`, `childrens-health`, `preventive-healthcare` | present (11 FAQ items on page (≥4 Canon minimum)) |
| `pregnancy` | P1 | Network Canon education lead | 12 mo | `pregnancy-care-education.webp` | `womens-health`, `childrens-health` | `antenatal-postnatal-care`, `pre-pregnancy-care`, `womens-health` | present (7 FAQ items on page (≥4 Canon minimum)) |
| `preventive-healthcare` | P1 | Network Canon education lead | 12 mo | `preventive-cycle-education.webp` | `heart`, `diabetes`, `vaccinations`, `healthy-ageing`, `mens-health`, `womens-health` | `preventive-healthcare`, `chronic-disease-care` | present (7 FAQ items on page (≥4 Canon minimum)) |
| `mens-health` | P1 | Network Canon education lead | 12 mo | `—` | `heart`, `preventive-healthcare`, `mental-health`, `healthy-ageing` | `mens-health`, `prostate-care`, `preventive-healthcare` | present (7 FAQ items on page (≥4 Canon minimum)) |
| `healthy-ageing` | P1 | Network Canon education lead | 12 mo | `healthy-ageing-education.webp` | `preventive-healthcare`, `vaccinations`, `chronic-disease-management`, `mens-health` | `preventive-healthcare`, `vaccinations`, `chronic-disease-care` | present (7 FAQ items on page (≥4 Canon minimum)) |
| `telehealth-access-to-care` | P1 | Network Canon education lead | 12 mo | `telehealth-education.webp` | `mental-health`, `cough`, `preventive-healthcare` | `telehealth` | present (7 FAQ items on page (≥4 Canon minimum)) |
| `adhd` | P1 | Network Canon education lead | 12 mo | `adhd-referral-pathway-education.webp` | `mental-health`, `childrens-health` | `mental-health`, `childrens-health` | present (7 FAQ items on page (≥4 Canon minimum)) |
| `cough` | P2 | Network Canon education lead | 12 mo | `—` | `vaccinations`, `chronic-disease-management`, `telehealth-access-to-care` | `telehealth`, `family-health` | present (7 FAQ items on page (≥4 Canon minimum)) |
| `headache` | P2 | Network Canon education lead | 12 mo | `—` | `pain`, `mental-health`, `sleep` | `family-health`, `telehealth` | present (7 FAQ items on page (≥4 Canon minimum)) |
| `pain` | P2 | Network Canon education lead | 12 mo | `—` | `healthy-ageing`, `weight`, `chronic-disease-management` | `allied-health`, `family-health`, `radiology` | present (7 FAQ items on page (≥4 Canon minimum)) |
| `sleep` | P2 | Network Canon education lead | 12 mo | `—` | `mental-health`, `weight`, `healthy-ageing` | `mental-health`, `preventive-healthcare` | present (7 FAQ items on page (≥4 Canon minimum)) |
| `weight` | P2 | Network Canon education lead | 12 mo | `—` | `diabetes`, `preventive-healthcare`, `heart`, `sleep` | `preventive-healthcare`, `chronic-disease-care` | present (7 FAQ items on page (≥4 Canon minimum)) |
| `family-health` | Not Canon | Network Canon education lead | 12 mo | `—` | `childrens-health`, `womens-health`, `mens-health` | `family-health` | present (7 FAQ items on page (≥4 Canon minimum)) |
| `index` | Not Canon | Network Canon education lead | 12 mo | `—` | — | — | present (7 FAQ items on page (≥4 Canon minimum)) |

### 1.2 Full candidate records (hubs)

#### `womens-health` — Women's Health (P0)

| Field | Value |
| --- | --- |
| Path | `knowledge/womens-health.html` |
| Package type | `knowledge_hub` |
| Owner | Network Canon education lead |
| Clinical owner | Healthcare Doctors Network Clinical Review |
| Review cycle | 12 months |
| Reason for inclusion | Core life-stage education demanded across HD clinics; deepest women's pathways. |
| Educational value | Screening, contraception, reproductive and midlife framing for GP care. |
| Multi-clinic value | Shared clinical narrative; local overlays for practs/booking only. |
| Governance requirements | Network clinical + content owners; public strip fields fail-closed; private evidence never in Canon package; clinic ClinicalReview on adopt |
| Diagram asset (primary) | `womens-life-stages-education.webp` |
| Secondary diagram assets | — |
| Observed on page now | `womens-life-stages-education.webp` |
| Existing FAQ coverage | **present** — 14 FAQ items on page (≥4 Canon minimum) |
| Knowledge hub relationships | `menopause`, `pregnancy`, `preventive-healthcare`, `mental-health` |
| Service relationships | `womens-health`, `pap-smear-cervical-screening`, `pre-pregnancy-care`, `antenatal-postnatal-care` |
| Status | `inventory_locked` |

#### `menopause` — Menopause & Midlife Health (P0)

| Field | Value |
| --- | --- |
| Path | `knowledge/menopause.html` |
| Package type | `knowledge_hub` |
| Owner | Network Canon education lead |
| Clinical owner | Healthcare Doctors Network Clinical Review |
| Review cycle | 12 months |
| Reason for inclusion | High Flagship exemplar; distinct midlife Canon body. |
| Educational value | Symptoms, HRT discussions, midlife preventive framing. |
| Multi-clinic value | Clinically generalisable Australia-wide; no suburb dependency. |
| Governance requirements | Network clinical + content owners; public strip fields fail-closed; private evidence never in Canon package; clinic ClinicalReview on adopt |
| Diagram asset (primary) | `menopause-education.webp` |
| Secondary diagram assets | — |
| Observed on page now | `menopause-education.webp` |
| Existing FAQ coverage | **present** — 15 FAQ items on page (≥4 Canon minimum) |
| Knowledge hub relationships | `womens-health`, `mental-health`, `healthy-ageing`, `preventive-healthcare` |
| Service relationships | `womens-health`, `preventive-healthcare`, `mental-health` |
| Status | `inventory_locked` |

#### `skin-health-skin-cancer` — Skin Health & Skin Cancer (P0)

| Field | Value |
| --- | --- |
| Path | `knowledge/skin-health-skin-cancer.html` |
| Package type | `knowledge_hub` |
| Owner | Network Canon education lead |
| Clinical owner | Healthcare Doctors Network Clinical Review |
| Review cycle | 12 months |
| Reason for inclusion | QLD/AU sun risk education with existing authority diagrams. |
| Educational value | Skin awareness, checks, sun protection decision support. |
| Multi-clinic value | High multi-clinic value in sun-exposed regions; education travels intact. |
| Governance requirements | Network clinical + content owners; public strip fields fail-closed; private evidence never in Canon package; clinic ClinicalReview on adopt |
| Diagram asset (primary) | `skin-check-education.webp` |
| Secondary diagram assets | `queensland-sun-education.webp` |
| Observed on page now | `skin-check-education.webp` |
| Existing FAQ coverage | **present** — 14 FAQ items on page (≥4 Canon minimum) |
| Knowledge hub relationships | `preventive-healthcare` |
| Service relationships | `skin-checks`, `skin-cancer-care`, `medical-procedures` |
| Status | `inventory_locked` |

#### `mental-health` — Mental Health (P0)

| Field | Value |
| --- | --- |
| Path | `knowledge/mental-health.html` |
| Package type | `knowledge_hub` |
| Owner | Network Canon education lead |
| Clinical owner | Healthcare Doctors Network Clinical Review |
| Review cycle | 12 months |
| Reason for inclusion | High patient impact; MHCP journey is network-standard GP education. |
| Educational value | When to seek help, MHCP pathway, anxiety/depression framing. |
| Multi-clinic value | Every HD clinic needs this education; crisis pathways national. |
| Governance requirements | Network clinical + content owners; public strip fields fail-closed; private evidence never in Canon package; clinic ClinicalReview on adopt |
| Diagram asset (primary) | `mental-wellbeing-education.webp` |
| Secondary diagram assets | `mental-health-conversation-education.webp` |
| Observed on page now | `mental-wellbeing-education.webp` |
| Existing FAQ coverage | **present** — 11 FAQ items on page (≥4 Canon minimum) |
| Knowledge hub relationships | `sleep`, `womens-health`, `mens-health`, `adhd` |
| Service relationships | `mental-health`, `telehealth`, `family-health` |
| Status | `inventory_locked` |

#### `diabetes` — Diabetes & Ongoing Care (P0)

| Field | Value |
| --- | --- |
| Path | `knowledge/diabetes.html` |
| Package type | `knowledge_hub` |
| Owner | Network Canon education lead |
| Clinical owner | Healthcare Doctors Network Clinical Review |
| Review cycle | 12 months |
| Reason for inclusion | Chronic condition education with glucose/review assets. |
| Educational value | Monitoring, living with diabetes, care-plan concepts. |
| Multi-clinic value | Universal GP chronic-care education; care delivery local. |
| Governance requirements | Network clinical + content owners; public strip fields fail-closed; private evidence never in Canon package; clinic ClinicalReview on adopt |
| Diagram asset (primary) | `glucose-education.webp` |
| Secondary diagram assets | `diabetes-review-education.webp` |
| Observed on page now | `glucose-education.webp` |
| Existing FAQ coverage | **present** — 14 FAQ items on page (≥4 Canon minimum) |
| Knowledge hub relationships | `chronic-disease-management`, `heart`, `weight`, `preventive-healthcare` |
| Service relationships | `chronic-disease-care`, `preventive-healthcare` |
| Status | `inventory_locked` |

#### `heart` — Blood Pressure & Heart Health (P0)

| Field | Value |
| --- | --- |
| Path | `knowledge/heart.html` |
| Package type | `knowledge_hub` |
| Owner | Network Canon education lead |
| Clinical owner | Healthcare Doctors Network Clinical Review |
| Review cycle | 12 months |
| Reason for inclusion | Preventive CV risk education with circulation/BP assets. |
| Educational value | BP meaning, CV risk, when urgent vs routine. |
| Multi-clinic value | National heart-health messaging; ECG/booking remain local. |
| Governance requirements | Network clinical + content owners; public strip fields fail-closed; private evidence never in Canon package; clinic ClinicalReview on adopt |
| Diagram asset (primary) | `circulation-education.webp` |
| Secondary diagram assets | `blood-pressure-numbers-education.webp`, `heart-check-education.webp` |
| Observed on page now | `circulation-education.webp` |
| Existing FAQ coverage | **present** — 15 FAQ items on page (≥4 Canon minimum) |
| Knowledge hub relationships | `chronic-disease-management`, `diabetes`, `preventive-healthcare`, `mens-health` |
| Service relationships | `preventive-healthcare`, `chronic-disease-care`, `ecg` |
| Status | `inventory_locked` |

#### `chronic-disease-management` — Chronic Disease Management (P0)

| Field | Value |
| --- | --- |
| Path | `knowledge/chronic-disease-management.html` |
| Package type | `knowledge_hub` |
| Owner | Network Canon education lead |
| Clinical owner | Healthcare Doctors Network Clinical Review |
| Review cycle | 12 months |
| Reason for inclusion | Coordination hub linking diabetes/heart and care plans. |
| Educational value | Care-plan purpose, multi-condition review grammar. |
| Multi-clinic value | Network standard for ongoing-care education. |
| Governance requirements | Network clinical + content owners; public strip fields fail-closed; private evidence never in Canon package; clinic ClinicalReview on adopt |
| Diagram asset (primary) | `chronic-disease-care-coordination-education.webp` |
| Secondary diagram assets | — |
| Observed on page now | `chronic-disease-care-coordination-education.webp` |
| Existing FAQ coverage | **present** — 15 FAQ items on page (≥4 Canon minimum) |
| Knowledge hub relationships | `diabetes`, `heart`, `healthy-ageing`, `preventive-healthcare` |
| Service relationships | `chronic-disease-care`, `preventive-healthcare` |
| Status | `inventory_locked` |

#### `childrens-health` — Children's Health (P0)

| Field | Value |
| --- | --- |
| Path | `knowledge/childrens-health.html` |
| Package type | `knowledge_hub` |
| Owner | Network Canon education lead |
| Clinical owner | Healthcare Doctors Network Clinical Review |
| Review cycle | 12 months |
| Reason for inclusion | Family demand hub; vaccination adjacency; GP-visit asset. |
| Educational value | Child illness, first visits, vaccine pathways overview. |
| Multi-clinic value | Shared parenting/GP education; immunisation schedule national. |
| Governance requirements | Network clinical + content owners; public strip fields fail-closed; private evidence never in Canon package; clinic ClinicalReview on adopt |
| Diagram asset (primary) | `childrens-gp-visit-education.webp` |
| Secondary diagram assets | — |
| Observed on page now | `childrens-gp-visit-education.webp` |
| Existing FAQ coverage | **present** — 18 FAQ items on page (≥4 Canon minimum) |
| Knowledge hub relationships | `vaccinations`, `cough`, `pregnancy` |
| Service relationships | `childrens-health`, `vaccinations`, `family-health` |
| Status | `inventory_locked` |

#### `vaccinations` — Vaccinations (P1)

| Field | Value |
| --- | --- |
| Path | `knowledge/vaccinations.html` |
| Package type | `knowledge_hub` |
| Owner | Network Canon education lead |
| Clinical owner | Healthcare Doctors Network Clinical Review |
| Review cycle | 12 months |
| Reason for inclusion | Life-stage vaccine education; asset ready; deepen after P0. |
| Educational value | Who needs which vaccines; childhood vs adult framing. |
| Multi-clinic value | Schedule education is network-shared; stock/booking local. |
| Governance requirements | Network clinical + content owners; public strip fields fail-closed; private evidence never in Canon package; clinic ClinicalReview on adopt |
| Diagram asset (primary) | `vaccination-life-stages-education.webp` |
| Secondary diagram assets | — |
| Observed on page now | `vaccination-life-stages-education.webp` |
| Existing FAQ coverage | **present** — 11 FAQ items on page (≥4 Canon minimum) |
| Knowledge hub relationships | `childrens-health`, `preventive-healthcare`, `healthy-ageing`, `pregnancy` |
| Service relationships | `vaccinations`, `childrens-health`, `preventive-healthcare` |
| Status | `inventory_locked` |

#### `pregnancy` — Pregnancy & Antenatal Care (P1)

| Field | Value |
| --- | --- |
| Path | `knowledge/pregnancy.html` |
| Package type | `knowledge_hub` |
| Owner | Network Canon education lead |
| Clinical owner | Healthcare Doctors Network Clinical Review |
| Review cycle | 12 months |
| Reason for inclusion | Strong education candidate; shared-care delivery is local. |
| Educational value | Planning, antenatal visits, when to seek help. |
| Multi-clinic value | Clinical education travels; shared-care practs are clinic overlay. |
| Governance requirements | Network clinical + content owners; public strip fields fail-closed; private evidence never in Canon package; clinic ClinicalReview on adopt |
| Diagram asset (primary) | `pregnancy-care-education.webp` |
| Secondary diagram assets | — |
| Observed on page now | `pregnancy-care-education.webp` |
| Existing FAQ coverage | **present** — 7 FAQ items on page (≥4 Canon minimum) |
| Knowledge hub relationships | `womens-health`, `childrens-health` |
| Service relationships | `antenatal-postnatal-care`, `pre-pregnancy-care`, `womens-health` |
| Status | `inventory_locked` |

#### `preventive-healthcare` — Preventive Healthcare (P1)

| Field | Value |
| --- | --- |
| Path | `knowledge/preventive-healthcare.html` |
| Package type | `knowledge_hub` |
| Owner | Network Canon education lead |
| Clinical owner | Healthcare Doctors Network Clinical Review |
| Review cycle | 12 months |
| Reason for inclusion | Cross-cutting prevention hub with cycle diagram. |
| Educational value | Checks, risk reviews, prevention grammar. |
| Multi-clinic value | Reusable across clinics as prevention Canon. |
| Governance requirements | Network clinical + content owners; public strip fields fail-closed; private evidence never in Canon package; clinic ClinicalReview on adopt |
| Diagram asset (primary) | `preventive-cycle-education.webp` |
| Secondary diagram assets | — |
| Observed on page now | `preventive-cycle-education.webp` |
| Existing FAQ coverage | **present** — 7 FAQ items on page (≥4 Canon minimum) |
| Knowledge hub relationships | `heart`, `diabetes`, `vaccinations`, `healthy-ageing`, `mens-health`, `womens-health` |
| Service relationships | `preventive-healthcare`, `chronic-disease-care` |
| Status | `inventory_locked` |

#### `mens-health` — Men's Health (P1)

| Field | Value |
| --- | --- |
| Path | `knowledge/mens-health.html` |
| Package type | `knowledge_hub` |
| Owner | Network Canon education lead |
| Clinical owner | Healthcare Doctors Network Clinical Review |
| Review cycle | 12 months |
| Reason for inclusion | Life-stage pair to women's; currently thinner asset coverage. |
| Educational value | Checks men often delay; prostate/heart adjacency. |
| Multi-clinic value | Network education value; procedure pages stay local. |
| Governance requirements | Network clinical + content owners; public strip fields fail-closed; private evidence never in Canon package; clinic ClinicalReview on adopt |
| Diagram asset (primary) | `none assigned` |
| Secondary diagram assets | — |
| Observed on page now | none detected |
| Existing FAQ coverage | **present** — 7 FAQ items on page (≥4 Canon minimum) |
| Knowledge hub relationships | `heart`, `preventive-healthcare`, `mental-health`, `healthy-ageing` |
| Service relationships | `mens-health`, `prostate-care`, `preventive-healthcare` |
| Status | `inventory_locked` |

#### `healthy-ageing` — Healthy Ageing (P1)

| Field | Value |
| --- | --- |
| Path | `knowledge/healthy-ageing.html` |
| Package type | `knowledge_hub` |
| Owner | Network Canon education lead |
| Clinical owner | Healthcare Doctors Network Clinical Review |
| Review cycle | 12 months |
| Reason for inclusion | Ageing/prevention education with existing asset. |
| Educational value | Falls, vaccines, reviews for older adults. |
| Multi-clinic value | Shared ageing narrative; local geriatric supports vary. |
| Governance requirements | Network clinical + content owners; public strip fields fail-closed; private evidence never in Canon package; clinic ClinicalReview on adopt |
| Diagram asset (primary) | `healthy-ageing-education.webp` |
| Secondary diagram assets | — |
| Observed on page now | `healthy-ageing-education.webp` |
| Existing FAQ coverage | **present** — 7 FAQ items on page (≥4 Canon minimum) |
| Knowledge hub relationships | `preventive-healthcare`, `vaccinations`, `chronic-disease-management`, `mens-health` |
| Service relationships | `preventive-healthcare`, `vaccinations`, `chronic-disease-care` |
| Status | `inventory_locked` |

#### `telehealth-access-to-care` — Telehealth & Access To Care (P1)

| Field | Value |
| --- | --- |
| Path | `knowledge/telehealth-access-to-care.html` |
| Package type | `knowledge_hub` |
| Owner | Network Canon education lead |
| Clinical owner | Healthcare Doctors Network Clinical Review |
| Review cycle | 12 months |
| Reason for inclusion | Education on how/when telehealth helps; eligibility is local. |
| Educational value | Suitability concepts, vs face-to-face, how visits work. |
| Multi-clinic value | Education Canon yes; clinic eligibility/rules overlay mandatory. |
| Governance requirements | Network clinical + content owners; public strip fields fail-closed; private evidence never in Canon package; clinic ClinicalReview on adopt |
| Diagram asset (primary) | `telehealth-education.webp` |
| Secondary diagram assets | — |
| Observed on page now | `telehealth-education.webp` |
| Existing FAQ coverage | **present** — 7 FAQ items on page (≥4 Canon minimum) |
| Knowledge hub relationships | `mental-health`, `cough`, `preventive-healthcare` |
| Service relationships | `telehealth` |
| Status | `inventory_locked` |

#### `adhd` — ADHD & Neurodiversity (P1)

| Field | Value |
| --- | --- |
| Path | `knowledge/adhd.html` |
| Package type | `knowledge_hub` |
| Owner | Network Canon education lead |
| Clinical owner | Healthcare Doctors Network Clinical Review |
| Review cycle | 12 months |
| Reason for inclusion | Referral-pathway education asset exists; growing demand. |
| Educational value | Assessment pathways and GP role framing. |
| Multi-clinic value | Pathway education shared; waitlists/specialists local. |
| Governance requirements | Network clinical + content owners; public strip fields fail-closed; private evidence never in Canon package; clinic ClinicalReview on adopt |
| Diagram asset (primary) | `adhd-referral-pathway-education.webp` |
| Secondary diagram assets | — |
| Observed on page now | none detected |
| Existing FAQ coverage | **present** — 7 FAQ items on page (≥4 Canon minimum) |
| Knowledge hub relationships | `mental-health`, `childrens-health` |
| Service relationships | `mental-health`, `childrens-health` |
| Status | `inventory_locked` |

#### `cough` — Cough & Sore Throat (P2)

| Field | Value |
| --- | --- |
| Path | `knowledge/cough.html` |
| Package type | `knowledge_hub` |
| Owner | Network Canon education lead |
| Clinical owner | Healthcare Doctors Network Clinical Review |
| Review cycle | 12 months |
| Reason for inclusion | Symptom decision aid; urgent vs routine grammar. |
| Educational value | When viral vs concerning; when to book. |
| Multi-clinic value | Reusable symptom Canon; links up to vaccinations/chronic. |
| Governance requirements | Network clinical + content owners; public strip fields fail-closed; private evidence never in Canon package; clinic ClinicalReview on adopt |
| Diagram asset (primary) | `none assigned` |
| Secondary diagram assets | — |
| Observed on page now | none detected |
| Existing FAQ coverage | **present** — 7 FAQ items on page (≥4 Canon minimum) |
| Knowledge hub relationships | `vaccinations`, `chronic-disease-management`, `telehealth-access-to-care` |
| Service relationships | `telehealth`, `family-health` |
| Status | `inventory_locked` |

#### `headache` — Headache & Migraine (P2)

| Field | Value |
| --- | --- |
| Path | `knowledge/headache.html` |
| Package type | `knowledge_hub` |
| Owner | Network Canon education lead |
| Clinical owner | Healthcare Doctors Network Clinical Review |
| Review cycle | 12 months |
| Reason for inclusion | Common decision-support symptom hub. |
| Educational value | Migraine vs headache; red flags. |
| Multi-clinic value | Network symptom education; imaging pathways local. |
| Governance requirements | Network clinical + content owners; public strip fields fail-closed; private evidence never in Canon package; clinic ClinicalReview on adopt |
| Diagram asset (primary) | `none assigned` |
| Secondary diagram assets | — |
| Observed on page now | none detected |
| Existing FAQ coverage | **present** — 7 FAQ items on page (≥4 Canon minimum) |
| Knowledge hub relationships | `pain`, `mental-health`, `sleep` |
| Service relationships | `family-health`, `telehealth` |
| Status | `inventory_locked` |

#### `pain` — Pain & Musculoskeletal Health (P2)

| Field | Value |
| --- | --- |
| Path | `knowledge/pain.html` |
| Package type | `knowledge_hub` |
| Owner | Network Canon education lead |
| Clinical owner | Healthcare Doctors Network Clinical Review |
| Review cycle | 12 months |
| Reason for inclusion | High volume symptom decision aid. |
| Educational value | When to seek help; chronic pain framing. |
| Multi-clinic value | Shared education; allied health/radiology local. |
| Governance requirements | Network clinical + content owners; public strip fields fail-closed; private evidence never in Canon package; clinic ClinicalReview on adopt |
| Diagram asset (primary) | `none assigned` |
| Secondary diagram assets | — |
| Observed on page now | none detected |
| Existing FAQ coverage | **present** — 7 FAQ items on page (≥4 Canon minimum) |
| Knowledge hub relationships | `healthy-ageing`, `weight`, `chronic-disease-management` |
| Service relationships | `allied-health`, `family-health`, `radiology` |
| Status | `inventory_locked` |

#### `sleep` — Sleep & Fatigue (P2)

| Field | Value |
| --- | --- |
| Path | `knowledge/sleep.html` |
| Package type | `knowledge_hub` |
| Owner | Network Canon education lead |
| Clinical owner | Healthcare Doctors Network Clinical Review |
| Review cycle | 12 months |
| Reason for inclusion | Cross-links mental health and lifestyle Canon. |
| Educational value | When fatigue needs GP review. |
| Multi-clinic value | Education reusable; sleep studies local. |
| Governance requirements | Network clinical + content owners; public strip fields fail-closed; private evidence never in Canon package; clinic ClinicalReview on adopt |
| Diagram asset (primary) | `none assigned` |
| Secondary diagram assets | — |
| Observed on page now | none detected |
| Existing FAQ coverage | **present** — 7 FAQ items on page (≥4 Canon minimum) |
| Knowledge hub relationships | `mental-health`, `weight`, `healthy-ageing` |
| Service relationships | `mental-health`, `preventive-healthcare` |
| Status | `inventory_locked` |

#### `weight` — Weight & Healthy Lifestyle (P2)

| Field | Value |
| --- | --- |
| Path | `knowledge/weight.html` |
| Package type | `knowledge_hub` |
| Owner | Network Canon education lead |
| Clinical owner | Healthcare Doctors Network Clinical Review |
| Review cycle | 12 months |
| Reason for inclusion | Lifestyle decision aid feeding chronic/preventive Canon. |
| Educational value | Healthy weight discussions with GP. |
| Multi-clinic value | Shared education; programs/fees local. |
| Governance requirements | Network clinical + content owners; public strip fields fail-closed; private evidence never in Canon package; clinic ClinicalReview on adopt |
| Diagram asset (primary) | `none assigned` |
| Secondary diagram assets | — |
| Observed on page now | none detected |
| Existing FAQ coverage | **present** — 7 FAQ items on page (≥4 Canon minimum) |
| Knowledge hub relationships | `diabetes`, `preventive-healthcare`, `heart`, `sleep` |
| Service relationships | `preventive-healthcare`, `chronic-disease-care` |
| Status | `inventory_locked` |

#### `family-health` — Family Health (Not Canon)

| Field | Value |
| --- | --- |
| Path | `knowledge/family-health.html` |
| Package type | `knowledge_hub` |
| Owner | Network Canon education lead |
| Clinical owner | Healthcare Doctors Network Clinical Review |
| Review cycle | 12 months |
| Reason for inclusion | Thin local aggregator of other hubs — not a strong standalone Canon education body. |
| Educational value | Directory-like; rebuild as network template later. |
| Multi-clinic value | Low as-is; would confuse multi-clinic adopt. |
| Governance requirements | Network clinical + content owners; public strip fields fail-closed; private evidence never in Canon package; clinic ClinicalReview on adopt |
| Diagram asset (primary) | `none assigned` |
| Secondary diagram assets | — |
| Observed on page now | none detected |
| Existing FAQ coverage | **present** — 7 FAQ items on page (≥4 Canon minimum) |
| Knowledge hub relationships | `childrens-health`, `womens-health`, `mens-health` |
| Service relationships | `family-health` |
| Status | `excluded` |

#### `index` — Healthcare Knowledge Centre home (Not Canon)

| Field | Value |
| --- | --- |
| Path | `knowledge/index.html` |
| Package type | `knowledge_hub` |
| Owner | Network Canon education lead |
| Clinical owner | Healthcare Doctors Network Clinical Review |
| Review cycle | 12 months |
| Reason for inclusion | Clinic IA chrome / KC landing — not extractable clinical Canon. |
| Educational value | Navigation shell. |
| Multi-clinic value | Each clinic keeps own KC home. |
| Governance requirements | Network clinical + content owners; public strip fields fail-closed; private evidence never in Canon package; clinic ClinicalReview on adopt |
| Diagram asset (primary) | `none assigned` |
| Secondary diagram assets | — |
| Observed on page now | none detected |
| Existing FAQ coverage | **present** — 7 FAQ items on page (≥4 Canon minimum) |
| Knowledge hub relationships | — |
| Service relationships | — |
| Status | `excluded` |


---

## 2. Flagship service hubs (education layer only)

Whole service HTML stays clinic Flagship. **Canon candidate = education / FAQ / care-list blocks**, not booking or practitioners.

### 2.1 Summary index

| Canonical slug | Priority | Owner | Review cycle | Diagram asset | Knowledge hub | Service | FAQ coverage |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `womens-health-education` | P0 | Network Canon education lead | 12 mo | `womens-life-stages-education.webp` | `womens-health` | `womens-health` | present |
| `family-health-education` | P0 | Network Canon education lead | 12 mo | `—` | — | `family-health` | present |
| `skin-checks-education` | P0 | Network Canon education lead | 12 mo | `skin-check-education.webp` | `skin-health-skin-cancer` | `skin-checks` | present |
| `mental-health-education` | P0 | Network Canon education lead | 12 mo | `mental-wellbeing-education.webp` | `mental-health` | `mental-health` | present |
| `childrens-health-education` | P0 | Network Canon education lead | 12 mo | `childrens-gp-visit-education.webp` | `childrens-health` | `childrens-health` | present |
| `preventive-healthcare-education` | P0 | Network Canon education lead | 12 mo | `preventive-cycle-education.webp` | `preventive-healthcare` | `preventive-healthcare` | present |
| `chronic-disease-care-education` | P0 | Network Canon education lead | 12 mo | `chronic-disease-care-coordination-education.webp` | `chronic-disease-management` | `chronic-disease-care` | present |
| `skin-cancer-care-education` | P0 | Network Canon education lead | 12 mo | `skin-check-education.webp` | `skin-health-skin-cancer` | `skin-cancer-care` | present |
| `vaccinations-education` | P1 | Network Canon education lead | 12 mo | `vaccination-life-stages-education.webp` | `vaccinations` | `vaccinations` | present |
| `mens-health-education` | P1 | Network Canon education lead | 12 mo | `—` | `mens-health` | `mens-health` | present |

### 2.2 Full candidate records (service education)

#### `womens-health-education` — Women's Health (service education) (P0)

| Field | Value |
| --- | --- |
| Source path | `services/womens-health.html` |
| Package type | `service_education` |
| Owner | Network Canon education lead |
| Review cycle | 12 months |
| Reason for inclusion | Flagship service hub; education/FAQ/care-list are Canon candidates. |
| Educational value | Life-stage women's care education blocks. |
| Multi-clinic value | Education adopt + local pract/booking overlay. |
| Governance requirements | Extract education only; strip HotDoc/phone/fees/practitioners; network approve version before clinic adopt |
| Diagram asset | `womens-life-stages-education.webp` |
| Observed on page now | none detected |
| Existing FAQ coverage | **present** — 13 FAQ items on page (≥4 Canon minimum) |
| Knowledge hub relationships | `womens-health` |
| Service relationships | `womens-health` |
| Status | `inventory_locked` |

#### `family-health-education` — Family Health (service education) (P0)

| Field | Value |
| --- | --- |
| Source path | `services/family-health.html` |
| Package type | `service_education` |
| Owner | Network Canon education lead |
| Review cycle | 12 months |
| Reason for inclusion | Flagship family entry hub; education blocks reusable even if KC family hub is Not Canon. |
| Educational value | Family care overview education. |
| Multi-clinic value | Shared overview; local team graph. |
| Governance requirements | Extract education only; strip HotDoc/phone/fees/practitioners; network approve version before clinic adopt |
| Diagram asset | `none assigned` |
| Observed on page now | none detected |
| Existing FAQ coverage | **present** — 7 FAQ items on page (≥4 Canon minimum) |
| Knowledge hub relationships | — |
| Service relationships | `family-health` |
| Status | `inventory_locked` |

#### `skin-checks-education` — Skin Checks (service education) (P0)

| Field | Value |
| --- | --- |
| Source path | `services/skin-checks.html` |
| Package type | `service_education` |
| Owner | Network Canon education lead |
| Review cycle | 12 months |
| Reason for inclusion | Flagship skin assessment education pairs to KC skin Canon. |
| Educational value | What a check covers; when sooner. |
| Multi-clinic value | High AU multi-clinic value. |
| Governance requirements | Extract education only; strip HotDoc/phone/fees/practitioners; network approve version before clinic adopt |
| Diagram asset | `skin-check-education.webp` |
| Observed on page now | none detected |
| Existing FAQ coverage | **present** — 14 FAQ items on page (≥4 Canon minimum) |
| Knowledge hub relationships | `skin-health-skin-cancer` |
| Service relationships | `skin-checks` |
| Status | `inventory_locked` |

#### `mental-health-education` — Mental Health (service education) (P0)

| Field | Value |
| --- | --- |
| Source path | `services/mental-health.html` |
| Package type | `service_education` |
| Owner | Network Canon education lead |
| Review cycle | 12 months |
| Reason for inclusion | Flagship MH service education/MHCP framing. |
| Educational value | Service-side pathway education. |
| Multi-clinic value | Standard GP mental health narrative. |
| Governance requirements | Extract education only; strip HotDoc/phone/fees/practitioners; network approve version before clinic adopt |
| Diagram asset | `mental-wellbeing-education.webp` |
| Observed on page now | `mental-health-conversation-education.webp` |
| Existing FAQ coverage | **present** — 10 FAQ items on page (≥4 Canon minimum) |
| Knowledge hub relationships | `mental-health` |
| Service relationships | `mental-health` |
| Status | `inventory_locked` |

#### `childrens-health-education` — Children's Health (service education) (P0)

| Field | Value |
| --- | --- |
| Source path | `services/childrens-health.html` |
| Package type | `service_education` |
| Owner | Network Canon education lead |
| Review cycle | 12 months |
| Reason for inclusion | Flagship children's service education. |
| Educational value | Child GP visit education. |
| Multi-clinic value | Shared; vaccines/booking local. |
| Governance requirements | Extract education only; strip HotDoc/phone/fees/practitioners; network approve version before clinic adopt |
| Diagram asset | `childrens-gp-visit-education.webp` |
| Observed on page now | none detected |
| Existing FAQ coverage | **present** — 7 FAQ items on page (≥4 Canon minimum) |
| Knowledge hub relationships | `childrens-health` |
| Service relationships | `childrens-health` |
| Status | `inventory_locked` |

#### `preventive-healthcare-education` — Preventive Healthcare (service education) (P0)

| Field | Value |
| --- | --- |
| Source path | `services/preventive-healthcare.html` |
| Package type | `service_education` |
| Owner | Network Canon education lead |
| Review cycle | 12 months |
| Reason for inclusion | Cross-cutting Flagship prevention service education. |
| Educational value | Prevention cycle / checks. |
| Multi-clinic value | Reusable prevention blocks. |
| Governance requirements | Extract education only; strip HotDoc/phone/fees/practitioners; network approve version before clinic adopt |
| Diagram asset | `preventive-cycle-education.webp` |
| Observed on page now | none detected |
| Existing FAQ coverage | **present** — 7 FAQ items on page (≥4 Canon minimum) |
| Knowledge hub relationships | `preventive-healthcare` |
| Service relationships | `preventive-healthcare` |
| Status | `inventory_locked` |

#### `chronic-disease-care-education` — Chronic Disease Care (service education) (P0)

| Field | Value |
| --- | --- |
| Source path | `services/chronic-disease-care.html` |
| Package type | `service_education` |
| Owner | Network Canon education lead |
| Review cycle | 12 months |
| Reason for inclusion | Coordination service education for chronic conditions. |
| Educational value | Care coordination grammar. |
| Multi-clinic value | Network chronic-care education. |
| Governance requirements | Extract education only; strip HotDoc/phone/fees/practitioners; network approve version before clinic adopt |
| Diagram asset | `chronic-disease-care-coordination-education.webp` |
| Observed on page now | none detected |
| Existing FAQ coverage | **present** — 7 FAQ items on page (≥4 Canon minimum) |
| Knowledge hub relationships | `chronic-disease-management` |
| Service relationships | `chronic-disease-care` |
| Status | `inventory_locked` |

#### `skin-cancer-care-education` — Skin Cancer Care (service education) (P0)

| Field | Value |
| --- | --- |
| Source path | `services/skin-cancer-care.html` |
| Package type | `service_education` |
| Owner | Network Canon education lead |
| Review cycle | 12 months |
| Reason for inclusion | Clinical pair to skin checks; education extractable. |
| Educational value | Follow-up / treatment pathway education. |
| Multi-clinic value | Education shared; procedures local. |
| Governance requirements | Extract education only; strip HotDoc/phone/fees/practitioners; network approve version before clinic adopt |
| Diagram asset | `skin-check-education.webp` |
| Observed on page now | none detected |
| Existing FAQ coverage | **present** — 10 FAQ items on page (≥4 Canon minimum) |
| Knowledge hub relationships | `skin-health-skin-cancer` |
| Service relationships | `skin-cancer-care` |
| Status | `inventory_locked` |

#### `vaccinations-education` — Vaccinations (service education) (P1)

| Field | Value |
| --- | --- |
| Source path | `services/vaccinations.html` |
| Package type | `service_education` |
| Owner | Network Canon education lead |
| Review cycle | 12 months |
| Reason for inclusion | Life-stage vaccine service education. |
| Educational value | Vaccine education blocks. |
| Multi-clinic value | Shared; stock/eligibility local. |
| Governance requirements | Extract education only; strip HotDoc/phone/fees/practitioners; network approve version before clinic adopt |
| Diagram asset | `vaccination-life-stages-education.webp` |
| Observed on page now | none detected |
| Existing FAQ coverage | **present** — 8 FAQ items on page (≥4 Canon minimum) |
| Knowledge hub relationships | `vaccinations` |
| Service relationships | `vaccinations` |
| Status | `inventory_locked` |

#### `mens-health-education` — Men's Health (service education) (P1)

| Field | Value |
| --- | --- |
| Source path | `services/mens-health.html` |
| Package type | `service_education` |
| Owner | Network Canon education lead |
| Review cycle | 12 months |
| Reason for inclusion | Flagship men's service education to deepen with P1 hubs. |
| Educational value | Men's checks education. |
| Multi-clinic value | Shared education; prostate pathway local nuance. |
| Governance requirements | Extract education only; strip HotDoc/phone/fees/practitioners; network approve version before clinic adopt |
| Diagram asset | `none assigned` |
| Observed on page now | none detected |
| Existing FAQ coverage | **present** — 7 FAQ items on page (≥4 Canon minimum) |
| Knowledge hub relationships | `mens-health` |
| Service relationships | `mens-health` |
| Status | `inventory_locked` |


---

## 3. Educational articles (87)

All educational articles in `knowledge/articles/` are **Network Canon class**. Priority:

- **P0** — first harden / triangle exemplars  
- **P1** — main educational cohort  
- **P2** — synonym / naming decision aids (prefer hub FAQ merge later)

### 3.1 P0 harden set (full records)

#### `anxiety-vs-stress-what-is-the-difference` (P0)

| Field | Value |
| --- | --- |
| Path | `knowledge/articles/anxiety-vs-stress-what-is-the-difference.html` |
| Owner | Network Canon education lead |
| Review cycle | 12 months |
| Reason for inclusion | Flagship deep guide selected for first Canon harden / triangle set |
| Educational value | Decision or condition education for GP patients |
| Multi-clinic value | Clinic-agnostic clinical education; strip Gabba locality/pract/CTAs at extract |
| Governance requirements | Strip locality/pract/CTA at extract; network clinical sign-off; version pin |
| Diagram asset | `none on page` |
| Existing FAQ coverage | **present** — 10 FAQ items on page (≥4 Canon minimum) |
| Knowledge hub relationships | `mental-health` |
| Service relationships | `womens-health`, `mental-health`, `preventive-healthcare` |

#### `childhood-vaccinations-explained` (P0)

| Field | Value |
| --- | --- |
| Path | `knowledge/articles/childhood-vaccinations-explained.html` |
| Owner | Network Canon education lead |
| Review cycle | 12 months |
| Reason for inclusion | Flagship deep guide selected for first Canon harden / triangle set |
| Educational value | Decision or condition education for GP patients |
| Multi-clinic value | Clinic-agnostic clinical education; strip Gabba locality/pract/CTAs at extract |
| Governance requirements | Strip locality/pract/CTA at extract; network clinical sign-off; version pin |
| Diagram asset | `none on page` |
| Existing FAQ coverage | **present** — 10 FAQ items on page (≥4 Canon minimum) |
| Knowledge hub relationships | `childrens-health` |
| Service relationships | `womens-health`, `vaccinations`, `childrens-health`, `family-health` |

#### `diabetes-care-plans-explained` (P0)

| Field | Value |
| --- | --- |
| Path | `knowledge/articles/diabetes-care-plans-explained.html` |
| Owner | Network Canon education lead |
| Review cycle | 12 months |
| Reason for inclusion | Flagship deep guide selected for first Canon harden / triangle set |
| Educational value | Decision or condition education for GP patients |
| Multi-clinic value | Clinic-agnostic clinical education; strip Gabba locality/pract/CTAs at extract |
| Governance requirements | Strip locality/pract/CTA at extract; network clinical sign-off; version pin |
| Diagram asset | `none on page` |
| Existing FAQ coverage | **present** — 9 FAQ items on page (≥4 Canon minimum) |
| Knowledge hub relationships | `diabetes` |
| Service relationships | `womens-health`, `chronic-disease-care` |

#### `how-can-a-gp-support-depression` (P0)

| Field | Value |
| --- | --- |
| Path | `knowledge/articles/how-can-a-gp-support-depression.html` |
| Owner | Network Canon education lead |
| Review cycle | 12 months |
| Reason for inclusion | Flagship deep guide selected for first Canon harden / triangle set |
| Educational value | Decision or condition education for GP patients |
| Multi-clinic value | Clinic-agnostic clinical education; strip Gabba locality/pract/CTAs at extract |
| Governance requirements | Strip locality/pract/CTA at extract; network clinical sign-off; version pin |
| Diagram asset | `none on page` |
| Existing FAQ coverage | **present** — 10 FAQ items on page (≥4 Canon minimum) |
| Knowledge hub relationships | `mental-health` |
| Service relationships | `womens-health`, `mental-health`, `family-health` |

#### `living-with-diabetes` (P0)

| Field | Value |
| --- | --- |
| Path | `knowledge/articles/living-with-diabetes.html` |
| Owner | Network Canon education lead |
| Review cycle | 12 months |
| Reason for inclusion | Flagship deep guide selected for first Canon harden / triangle set |
| Educational value | Decision or condition education for GP patients |
| Multi-clinic value | Clinic-agnostic clinical education; strip Gabba locality/pract/CTAs at extract |
| Governance requirements | Strip locality/pract/CTA at extract; network clinical sign-off; version pin |
| Diagram asset | `none on page` |
| Existing FAQ coverage | **present** — 9 FAQ items on page (≥4 Canon minimum) |
| Knowledge hub relationships | `diabetes` |
| Service relationships | `womens-health`, `chronic-disease-care` |

#### `understanding-menopause` (P0)

| Field | Value |
| --- | --- |
| Path | `knowledge/articles/understanding-menopause.html` |
| Owner | Network Canon education lead |
| Review cycle | 12 months |
| Reason for inclusion | Flagship deep guide selected for first Canon harden / triangle set |
| Educational value | Decision or condition education for GP patients |
| Multi-clinic value | Clinic-agnostic clinical education; strip Gabba locality/pract/CTAs at extract |
| Governance requirements | Strip locality/pract/CTA at extract; network clinical sign-off; version pin |
| Diagram asset | `none on page` |
| Existing FAQ coverage | **present** — 10 FAQ items on page (≥4 Canon minimum) |
| Knowledge hub relationships | `womens-health` |
| Service relationships | `womens-health`, `preventive-healthcare`, `mental-health` |

#### `understanding-your-cardiovascular-risk` (P0)

| Field | Value |
| --- | --- |
| Path | `knowledge/articles/understanding-your-cardiovascular-risk.html` |
| Owner | Network Canon education lead |
| Review cycle | 12 months |
| Reason for inclusion | Flagship deep guide selected for first Canon harden / triangle set |
| Educational value | Decision or condition education for GP patients |
| Multi-clinic value | Clinic-agnostic clinical education; strip Gabba locality/pract/CTAs at extract |
| Governance requirements | Strip locality/pract/CTA at extract; network clinical sign-off; version pin |
| Diagram asset | `none on page` |
| Existing FAQ coverage | **present** — 11 FAQ items on page (≥4 Canon minimum) |
| Knowledge hub relationships | `heart` |
| Service relationships | `womens-health`, `preventive-healthcare`, `ecg` |

#### `what-happens-during-a-mental-health-care-plan` (P0)

| Field | Value |
| --- | --- |
| Path | `knowledge/articles/what-happens-during-a-mental-health-care-plan.html` |
| Owner | Network Canon education lead |
| Review cycle | 12 months |
| Reason for inclusion | Flagship deep guide selected for first Canon harden / triangle set |
| Educational value | Decision or condition education for GP patients |
| Multi-clinic value | Clinic-agnostic clinical education; strip Gabba locality/pract/CTAs at extract |
| Governance requirements | Strip locality/pract/CTA at extract; network clinical sign-off; version pin |
| Diagram asset | `none on page` |
| Existing FAQ coverage | **present** — 10 FAQ items on page (≥4 Canon minimum) |
| Knowledge hub relationships | `mental-health` |
| Service relationships | `womens-health`, `mental-health`, `telehealth` |

#### `when-should-i-book-a-skin-check` (P0)

| Field | Value |
| --- | --- |
| Path | `knowledge/articles/when-should-i-book-a-skin-check.html` |
| Owner | Network Canon education lead |
| Review cycle | 12 months |
| Reason for inclusion | Flagship deep guide selected for first Canon harden / triangle set |
| Educational value | Decision or condition education for GP patients |
| Multi-clinic value | Clinic-agnostic clinical education; strip Gabba locality/pract/CTAs at extract |
| Governance requirements | Strip locality/pract/CTA at extract; network clinical sign-off; version pin |
| Diagram asset | `none on page` |
| Existing FAQ coverage | **present** — 10 FAQ items on page (≥4 Canon minimum) |
| Knowledge hub relationships | `skin-health-skin-cancer` |
| Service relationships | `womens-health`, `skin-checks`, `skin-cancer-care`, `medical-procedures` |

#### `when-should-i-have-a-cervical-screening-test` (P0)

| Field | Value |
| --- | --- |
| Path | `knowledge/articles/when-should-i-have-a-cervical-screening-test.html` |
| Owner | Network Canon education lead |
| Review cycle | 12 months |
| Reason for inclusion | Flagship deep guide selected for first Canon harden / triangle set |
| Educational value | Decision or condition education for GP patients |
| Multi-clinic value | Clinic-agnostic clinical education; strip Gabba locality/pract/CTAs at extract |
| Governance requirements | Strip locality/pract/CTA at extract; network clinical sign-off; version pin |
| Diagram asset | `cervical-screening-vs-pap-education.webp` |
| Existing FAQ coverage | **present** — 10 FAQ items on page (≥4 Canon minimum) |
| Knowledge hub relationships | `womens-health` |
| Service relationships | `womens-health`, `pap-smear-cervical-screening`, `preventive-healthcare` |

#### `when-should-i-speak-to-a-gp-about-anxiety` (P0)

| Field | Value |
| --- | --- |
| Path | `knowledge/articles/when-should-i-speak-to-a-gp-about-anxiety.html` |
| Owner | Network Canon education lead |
| Review cycle | 12 months |
| Reason for inclusion | Flagship deep guide selected for first Canon harden / triangle set |
| Educational value | Decision or condition education for GP patients |
| Multi-clinic value | Clinic-agnostic clinical education; strip Gabba locality/pract/CTAs at extract |
| Governance requirements | Strip locality/pract/CTA at extract; network clinical sign-off; version pin |
| Diagram asset | `none on page` |
| Existing FAQ coverage | **present** — 10 FAQ items on page (≥4 Canon minimum) |
| Knowledge hub relationships | `mental-health` |
| Service relationships | `womens-health`, `mental-health`, `family-health`, `telehealth` |

#### `why-skin-checks-matter-in-australia` (P0)

| Field | Value |
| --- | --- |
| Path | `knowledge/articles/why-skin-checks-matter-in-australia.html` |
| Owner | Network Canon education lead |
| Review cycle | 12 months |
| Reason for inclusion | Flagship deep guide selected for first Canon harden / triangle set |
| Educational value | Decision or condition education for GP patients |
| Multi-clinic value | Clinic-agnostic clinical education; strip Gabba locality/pract/CTAs at extract |
| Governance requirements | Strip locality/pract/CTA at extract; network clinical sign-off; version pin |
| Diagram asset | `none on page` |
| Existing FAQ coverage | **present** — 10 FAQ items on page (≥4 Canon minimum) |
| Knowledge hub relationships | `skin-health-skin-cancer` |
| Service relationships | `womens-health`, `skin-checks`, `skin-cancer-care`, `preventive-healthcare`, `medical-procedures` |


### 3.2 All articles — registry index

| Canonical slug | Priority | Cohort | Hub | Services | FAQs | Diagram on page |
| --- | --- | --- | --- | --- | --- | --- |
| `adhd-assessment-pathways` | P1 | educational_cohort | `adhd` | `womens-health`, `mental-health` | present | `—` |
| `anxiety-vs-stress-what-is-the-difference` | P0 | p0_harden | `mental-health` | `womens-health`, `mental-health`, `preventive-healthcare` | present | `—` |
| `back-pain-when-should-i-see-a-gp` | P2 | educational_cohort | `pain` | `womens-health`, `family-health`, `allied-health`, `radiology` | present | `—` |
| `blood-pressure-explained` | P1 | educational_cohort | `chronic-disease-management` | `preventive-healthcare`, `chronic-disease-care` | present | `blood-pressure-numbers-education.webp` |
| `breast-health-changes-screening-when-to-see-a-gp` | P1 | educational_cohort | `womens-health` | `breast-check`, `womens-health` | present | `—` |
| `childhood-vaccinations-explained` | P0 | p0_harden | `childrens-health` | `womens-health`, `vaccinations`, `childrens-health`, `family-health` | present | `—` |
| `childrens-preventive-healthcare` | P1 | educational_cohort | `childrens-health` | `womens-health`, `childrens-health`, `vaccinations`, `preventive-healthcare` | present | `—` |
| `cholesterol-explained` | P1 | educational_cohort | `heart` | `womens-health`, `preventive-healthcare`, `pathology` | present | `—` |
| `chronic-pain-when-should-i-seek-help` | P2 | educational_cohort | `pain` | `womens-health`, `family-health` | present | `—` |
| `common-childhood-illnesses` | P1 | educational_cohort | `childrens-health` | `womens-health`, `childrens-health`, `family-health`, `ear-care-ear-syringing` | present | `—` |
| `diabetes-care-plans-explained` | P0 | p0_harden | `diabetes` | `womens-health`, `chronic-disease-care` | present | `—` |
| `diabetes-monitoring-explained` | P1 | educational_cohort | `diabetes` | `womens-health`, `chronic-disease-care`, `pathology` | present | `—` |
| `health-assessments-explained` | P1 | educational_cohort | `preventive-healthcare` | `womens-health`, `preventive-healthcare`, `chronic-disease-care` | present | `—` |
| `health-checks-every-man-should-consider` | P1 | educational_cohort | `mens-health` | `womens-health`, `mens-health`, `preventive-healthcare`, `prostate-care` | present | `—` |
| `healthy-ageing-for-men` | P1 | educational_cohort | `mens-health` | `womens-health`, `preventive-healthcare`, `mens-health`, `chronic-disease-care` | present | `—` |
| `healthy-ageing-prevention-falls-vaccination-reviews` | P1 | educational_cohort | `healthy-ageing` | `preventive-healthcare`, `chronic-disease-care`, `vaccinations` | present | `—` |
| `healthy-weight-management` | P2 | educational_cohort | `weight` | `womens-health`, `preventive-healthcare` | present | `—` |
| `heart-health-checks` | P1 | educational_cohort | `heart` | `womens-health`, `preventive-healthcare`, `ecg` | present | `heart-check-education.webp` |
| `heart-health-for-men` | P1 | educational_cohort | `mens-health` | `womens-health`, `mens-health`, `chronic-disease-care`, `ecg` | present | `—` |
| `high-blood-pressure-explained` | P1 | educational_cohort | `heart` | `womens-health`, `preventive-healthcare` | present | `—` |
| `how-can-a-gp-support-depression` | P0 | p0_harden | `mental-health` | `womens-health`, `mental-health`, `family-health` | present | `—` |
| `how-telehealth-works` | P1 | educational_cohort | `telehealth-access-to-care` | `telehealth`, `family-health` | present | `—` |
| `hrt-discussions-with-your-gp` | P1 | educational_cohort | `menopause` | `womens-health` | present | `—` |
| `influenza-vaccination-who-should-consider-it` | P1 | educational_cohort | `vaccinations` | `vaccinations`, `family-health` | present | `—` |
| `is-a-tummy-bug-the-same-as-gastro` | P1 | educational_cohort_unmapped_hub | — | `family-health`, `childrens-health` | present | `—` |
| `is-a-water-infection-the-same-as-a-uti` | P1 | educational_cohort_unmapped_hub | — | `family-health` | present | `—` |
| `is-hay-fever-a-fever` | P1 | educational_cohort_unmapped_hub | — | `family-health` | present | `—` |
| `is-my-sore-throat-viral-or-bacterial` | P2 | synonym_decision_aid | `cough` | `womens-health`, `family-health` | present | `—` |
| `is-this-sinus` | P1 | educational_cohort_unmapped_hub | — | `family-health` | present | `—` |
| `is-this-thrush` | P2 | synonym_decision_aid | `womens-health` | `family-health`, `womens-health` | present | `—` |
| `living-with-diabetes-gp-monitoring-long-term-management` | P1 | educational_cohort | `chronic-disease-management` | `chronic-disease-care`, `preventive-healthcare` | present | `diabetes-review-education.webp` |
| `living-with-diabetes` | P0 | p0_harden | `diabetes` | `womens-health`, `chronic-disease-care` | present | `—` |
| `managing-asthma` | P1 | educational_cohort | `chronic-disease-management` | `chronic-disease-care`, `spirometry`, `nebulising`, `pharmacy` | present | `—` |
| `managing-winter-respiratory-illness` | P1 | educational_cohort | `childrens-health` | `family-health`, `childrens-health`, `vaccinations` | present | `—` |
| `menopause-symptoms-explained` | P1 | educational_cohort | `menopause` | `womens-health` | present | `—` |
| `mental-health-and-menopause` | P1 | educational_cohort | `menopause` | `womens-health` | present | `—` |
| `migraine-or-headache-how-do-i-tell-the-difference` | P2 | educational_cohort | `headache` | `womens-health`, `family-health` | present | `—` |
| `planning-a-pregnancy` | P1 | educational_cohort | `pregnancy` | `womens-health`, `antenatal-postnatal-care`, `pre-pregnancy-care` | present | `—` |
| `preparing-for-your-childs-first-gp-appointment` | P1 | educational_cohort | `childrens-health` | `womens-health`, `childrens-health`, `vaccinations` | present | `—` |
| `preventing-diabetes-complications` | P1 | educational_cohort | `diabetes` | `womens-health`, `chronic-disease-care`, `wound-dressings` | present | `—` |
| `preventive-womens-healthcare` | P1 | educational_cohort | `womens-health` | `womens-health`, `preventive-healthcare`, `vaccinations`, `implanon-insertion-removal` | present | `—` |
| `protecting-your-skin-from-the-queensland-sun` | P1 | educational_cohort | `skin-health-skin-cancer` | `womens-health`, `skin-checks`, `skin-cancer-care`, `preventive-healthcare` | present | `queensland-sun-education.webp` |
| `sleep-problems-explained` | P2 | educational_cohort | `sleep` | `womens-health`, `family-health` | present | `—` |
| `sore-throat-when-should-i-see-a-doctor` | P2 | educational_cohort | `cough` | `womens-health`, `family-health` | present | `—` |
| `staying-healthy-as-you-age` | P1 | educational_cohort | `preventive-healthcare` | `womens-health`, `preventive-healthcare`, `chronic-disease-care`, `vaccinations` | present | `—` |
| `telehealth-vs-face-to-face-appointments` | P1 | educational_cohort | `telehealth-access-to-care` | `telehealth`, `family-health`, `skin-checks` | present | `—` |
| `travel-vaccinations-before-overseas-travel` | P1 | educational_cohort | `vaccinations` | `vaccinations`, `preventive-healthcare` | present | `—` |
| `understanding-adhd-referrals` | P1 | educational_cohort | `adhd` | `womens-health`, `mental-health` | present | `adhd-referral-pathway-education.webp` |
| `understanding-cholesterol` | P1 | educational_cohort | `chronic-disease-management` | `preventive-healthcare`, `chronic-disease-care` | present | `—` |
| `understanding-gp-chronic-disease-care-plans` | P1 | educational_cohort | `chronic-disease-management` | `chronic-disease-care`, `allied-health`, `pharmacy` | present | `—` |
| `understanding-healthy-lifestyle-changes` | P2 | educational_cohort | `weight` | `womens-health`, `preventive-healthcare` | present | `—` |
| `understanding-menopause` | P0 | p0_harden | `womens-health` | `womens-health`, `preventive-healthcare`, `mental-health` | present | `—` |
| `understanding-muscle-and-joint-pain` | P2 | educational_cohort | `pain` | `womens-health`, `family-health`, `allied-health` | present | `—` |
| `understanding-neck-pain` | P2 | educational_cohort | `pain` | `womens-health`, `family-health`, `allied-health`, `radiology` | present | `—` |
| `understanding-perimenopause` | P1 | educational_cohort | `womens-health` | `womens-health`, `mental-health`, `preventive-healthcare` | present | `—` |
| `understanding-prostate-health` | P1 | educational_cohort | `mens-health` | `womens-health`, `prostate-care`, `mens-health`, `preventive-healthcare` | present | `—` |
| `understanding-skin-cancer-risks` | P1 | educational_cohort | `skin-health-skin-cancer` | `womens-health`, `skin-checks`, `skin-cancer-care` | present | `—` |
| `understanding-type-2-diabetes` | P1 | educational_cohort | `diabetes` | `womens-health`, `chronic-disease-care` | present | `—` |
| `understanding-your-cardiovascular-risk` | P0 | p0_harden | `heart` | `womens-health`, `preventive-healthcare`, `ecg` | present | `—` |
| `vaccinations-for-adults` | P1 | educational_cohort | `preventive-healthcare` | `womens-health`, `vaccinations`, `preventive-healthcare`, `family-health` | present | `—` |
| `what-are-school-sores` | P2 | synonym_decision_aid | `childrens-health` | `family-health`, `childrens-health` | present | `—` |
| `what-causes-a-persistent-cough` | P2 | educational_cohort | `cough` | `womens-health`, `family-health`, `spirometry`, `nebulising` | present | `—` |
| `what-causes-frequent-headaches` | P2 | educational_cohort | `headache` | `womens-health`, `family-health` | present | `—` |
| `what-happens-during-a-mental-health-care-plan` | P0 | p0_harden | `mental-health` | `womens-health`, `mental-health`, `telehealth` | present | `—` |
| `what-happens-during-antenatal-care` | P1 | educational_cohort | `pregnancy` | `womens-health`, `antenatal-postnatal-care` | present | `—` |
| `what-is-preventive-healthcare` | P1 | educational_cohort | `preventive-healthcare` | `womens-health`, `preventive-healthcare`, `family-health`, `vaccinations` | present | `—` |
| `when-can-i-use-telehealth` | P1 | educational_cohort | `telehealth-access-to-care` | `telehealth`, `family-health` | present | `—` |
| `when-is-a-headache-an-emergency` | P2 | educational_cohort | `headache` | `womens-health`, `family-health` | present | `—` |
| `when-should-a-child-with-a-cough-see-a-gp` | P2 | educational_cohort | `cough` | `womens-health`, `family-health` | present | `—` |
| `when-should-i-be-concerned-about-a-fever` | P1 | educational_cohort | `childrens-health` | `womens-health`, `childrens-health`, `family-health` | present | `—` |
| `when-should-i-be-concerned-about-blood-pressure` | P1 | educational_cohort | `heart` | `womens-health`, `preventive-healthcare` | present | `—` |
| `when-should-i-be-concerned-about-pain` | P2 | educational_cohort | `pain` | `womens-health`, `family-health` | present | `—` |
| `when-should-i-book-a-skin-check` | P0 | p0_harden | `skin-health-skin-cancer` | `womens-health`, `skin-checks`, `skin-cancer-care`, `medical-procedures` | present | `—` |
| `when-should-i-have-a-cervical-screening-test` | P0 | p0_harden | `womens-health` | `womens-health`, `pap-smear-cervical-screening`, `preventive-healthcare` | present | `cervical-screening-vs-pap-education.webp` |
| `when-should-i-see-a-gp-about-headaches` | P2 | educational_cohort | `headache` | `womens-health`, `family-health` | present | `—` |
| `when-should-i-seek-adhd-assessment` | P1 | educational_cohort | `adhd` | `womens-health`, `mental-health` | present | `—` |
| `when-should-i-seek-help-for-burnout` | P1 | educational_cohort | `mental-health` | `womens-health`, `mental-health`, `preventive-healthcare`, `telehealth` | present | `—` |
| `when-should-i-speak-to-a-gp-about-anxiety` | P0 | p0_harden | `mental-health` | `womens-health`, `mental-health`, `family-health`, `telehealth` | present | `—` |
| `when-should-i-speak-to-a-gp-about-sleep` | P2 | educational_cohort | `sleep` | `womens-health`, `family-health` | present | `—` |
| `when-should-i-speak-to-a-gp-about-weight` | P2 | educational_cohort | `weight` | `womens-health`, `preventive-healthcare` | present | `—` |
| `why-am-i-always-tired` | P2 | educational_cohort | `sleep` | `womens-health`, `family-health`, `iron-infusions` | present | `—` |
| `why-preventive-healthcare-matters` | P1 | educational_cohort | `mens-health` | `womens-health`, `preventive-healthcare`, `mens-health`, `vaccinations` | present | `—` |
| `why-regular-check-ups-matter` | P1 | educational_cohort | `preventive-healthcare` | `womens-health`, `preventive-healthcare`, `family-health`, `chronic-disease-care` | present | `—` |
| `why-skin-checks-matter-in-australia` | P0 | p0_harden | `skin-health-skin-cancer` | `womens-health`, `skin-checks`, `skin-cancer-care`, `preventive-healthcare` | present | `—` |
| `why-won-t-my-cough-go-away` | P2 | educational_cohort | `cough` | `womens-health`, `family-health` | present | `—` |
| `womens-health-checks-at-different-stages-of-life` | P1 | educational_cohort | `womens-health` | `womens-health`, `preventive-healthcare`, `breast-check`, `implanon-insertion-removal` | present | `—` |
| `your-first-pregnancy-gp-appointment` | P1 | educational_cohort | `pregnancy` | `womens-health`, `antenatal-postnatal-care`, `pre-pregnancy-care` | present | `—` |

> Full per-article field objects (reason, educational value, multi-clinic value, governance) are in JSON `articles[]`.

---

## 4. Not Canon (locked exclusions)

| Slug | Type | Why excluded |
| --- | --- | --- |
| `family-health` (KC hub) | Knowledge hub | Local aggregator — not strong Canon education |
| `index` (KC home) | Knowledge hub | Clinic IA chrome |
| Independent providers (`pathology`, `radiology`, `pharmacy`) | Local clinic content | Site-specific — never Canon |
| Fees / new-patients / HotDoc centre URL / named practitioners | Clinic overlay | Never enter Canon body |

---

## 5. Explicit non-goals (C0)

- No HTML edits, no new pages, no new diagrams  
- No CMS extractors, no second-clinic import  
- No booking changes  

---

## Document history

| Date | Change |
| --- | --- |
| 2026-11-03 | **v1.0** C0 inventory lock — hubs, Flagship service education, 87 articles classified with registry fields. |
