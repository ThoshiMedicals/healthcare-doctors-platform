# Healthcare Doctors — Canon Extraction Framework

**Framework + C0–C2 Flagship preparation (2026-11-03).** Full extract/version/adopt CMS still deferred.  
**Date:** 2026-11-03  
**Parents:** [`WMC-HEALTHCARE-DOCTORS-CANONICAL-CONTENT.md`](./WMC-HEALTHCARE-DOCTORS-CANONICAL-CONTENT.md) · [`WMC-CANON-REGISTRY.md`](./WMC-CANON-REGISTRY.md) · [`WMC-CANON-GOVERNANCE-SPECIFICATION.md`](./WMC-CANON-GOVERNANCE-SPECIFICATION.md) · [`WMC-MULTI-CLINIC-CONTENT-ARCHITECTURE.md`](./WMC-MULTI-CLINIC-CONTENT-ARCHITECTURE.md) · [`WMC-CONTENT-MATURITY-PROGRAM.md`](./WMC-CONTENT-MATURITY-PROGRAM.md) · Master Brain §8–9 · DEC-2026-09 / governance L2 checklist  
**Canvas:** `wmc-canon-extraction-framework`

---

## Objective

Define the **process that promotes content from WMC Flagship Authority pages into Healthcare Doctors Network Canon** — so other clinics can adopt shared education without copying Gabba locality, practitioners, or booking rules.

```text
WMC Flagship page (live clinic golden HTML)
        │  extract educational layer
        ▼
Network Canon package (slug + body + FAQ skeleton + assets + sources)
        │  network clinical approve + version
        ▼
Clinic adoption (overlay: practs, CTAs, offered=true, clinic ClinicalReview)
```

**Out of scope for this doc:** coding extractors, CMS tables, second-clinic import, new pages/diagrams.

---

## Source and target roles

| Role | Definition |
| --- | --- |
| **Flagship Authority (source)** | Gabba-hosted exemplars that meet quality bar; listed in Canon classification (e.g. Women’s / Family / Skin / Mental / Children’s / Preventive / Chronic / Vaccinations / Men’s / Skin Cancer Care; KC hubs & deep articles) |
| **Network Canon (target)** | Clinic-agnostic educational package: narrative, FAQ skeleton, trusted sources, authority education asset refs, related **Canon** slug links — **no** clinic doctors, phones, HotDoc, fees, or suburb claims |
| **Clinic overlay (after adopt)** | Practitioners, booking/call CTAs, “offered here”, local related services, clinic `ClinicalReview`, clinic domain URL |

---

## 1. Promotion criteria

A Flagship page may enter the **promotion queue** only if **all** gate A items pass and **≥4 of 6** gate B items pass.

### Gate A — mandatory

| # | Criterion | Evidence |
| --- | --- | --- |
| A1 | Classified **Flagship Authority** and/or **Network Canon P0/P1** in classification doc | Classification table |
| A2 | Content maturity **Mature or Flagship** (not Emerging) | Maturity audit / Wave scores |
| A3 | Educational body is clinically generalisable (not Gabba-ops-only) | Manual extract review |
| A4 | One-diagram-per-page policy respected; any diagram is an **existing** network-usable asset | `assets/knowledge/authority/*` or none |
| A5 | No unresolved clinical safety errors in FAQs (urgent pathways correct) | Clinical spot-check |
| A6 | Sponsor nominates page for promotion (content lead + clinical owner) | Written request |

### Gate B — quality signals (need ≥4)

| # | Criterion |
| --- | --- |
| B1 | Clear section grammar (what / why / how / when to seek help / FAQ) |
| B2 | Decision-support FAQs present (urgent vs routine, what next) |
| B3 | Internal links to related **education** hubs/services (not only local ops) |
| B4 | Trusted Australian sources present or easily attachable |
| B5 | Authority education asset already exists for the topic (preferred) |
| B6 | Measurement / demand proxy supports priority (search, briefing, AGE) — optional but scored |

**Fail closed:** Local Clinic Content (pathology/radiology/pharmacy, Mary phone-only notices as page core, fees-only pages) **never** promote.

---

## 2. Canon eligibility

### Eligible for Canon package

| Content type | Eligible? | Notes |
| --- | --- | --- |
| Knowledge hub educational body + FAQ skeleton | **Yes** | Primary Canon surface |
| Knowledge article educational body + FAQ + sources | **Yes** | Prefer deep Flagship articles |
| Service hub **education / FAQ / care-list / why-it-matters** blocks | **Yes** | Extract blocks, not whole Gabba HTML chrome |
| Service focused-procedure **clinical education** (what happens, prep general) | **Conditional** | Eligible if locality stripped; booking always overlay |
| Authority education WebPs (existing) | **Yes** | Referenced by Canon asset id/path |
| Trusted external source links (Healthdirect, gov programs) | **Yes** | Keep in Canon |

### Not eligible (remain clinic / never Canon)

| Content type | Reason |
| --- | --- |
| Practitioner cards / doctor deep-links | Always clinic overlay |
| HotDoc centre URLs, phone CTAs, phone-only rules | Local booking |
| Fees, bulk-billing practice claims, AGPAL clinic claim text | Clinic profile |
| Local area suburb lists / “inner south” blocks | Local |
| Independent provider pages (path/rad/pharm) | Local Clinic Content |
| Careers vacancies, patient forms, updates | Clinic ops |
| Full golden HTML document as opaque blob | Must extract educational layer only |

### Eligibility output artifact (conceptual)

```text
CanonCandidate
  sourceClinic: woolloongabba
  sourcePath: knowledge/… or services/…
  targetSlug: stable network slug
  packageType: knowledge_hub | knowledge_article | service_education
  priority: P0 | P1 | P2
  assetRefs: […]
  relatedCanonSlugs: […]
  status: nominated | extracting | network_review | approved | rejected
```

---

## 3. Clinic-specific content removal rules

When extracting Flagship → Canon, **remove or rewrite** anything that binds the text to Woolloongabba / Gabba Medical Centre as the only audience.

| Pattern | Action |
| --- | --- |
| Practice name in educational sentences (“at Woolloongabba Medical Centre…”) | Replace with neutral “in general practice” / “your GP” / omit |
| Address, phone, fax, email | **Strip** |
| Opening hours | **Strip** |
| Local suburb lists / catchment blocks | **Strip** |
| “Book at this clinic” mid-education | Move to **CTA template slot** (see §5), not Canon body |
| Gabba-only programs or partners named as exclusive | Strip or generalise |
| Fees / bulk billing statements | **Strip** (clinic profile) |
| AGPAL / accreditation sentences tied to this practice | **Strip** from Canon body |
| Internal links to Gabba-only ops pages (`fees-billing`, `new-patients`) inside education | Remove from Canon; clinics add via overlay if needed |
| Links to Canon-eligible hubs/services by **slug** | **Keep** as relative Canon links (`knowledge/diabetes`, `services/womens-health`) |
| Queensland/Australia clinical context (sun, CST program) | **Keep** if clinically true network-wide |

**Test:** A second clinic in another Brisbane suburb could publish the Canon body without editing clinical meaning — only overlays change.

---

## 4. Practitioner-removal rules

| Rule | Detail |
| --- | --- |
| **R1** | Remove all `practitioner-knowledge-link` / doctor profile URLs from Canon package |
| **R2** | Remove named clinicians from FAQ answers and body prose |
| **R3** | Remove “Ask for Dr X” / phone-only practitioner booking notes from Canon |
| **R4** | Canon may keep **role-level** language (“your GP”, “a clinician”, “nursing support when arranged”) |
| **R5** | Related-practitioners section becomes an **empty overlay slot** on adopt (`relatedPractitioners[]`) |
| **R6** | Do not invent network-wide doctor directories |
| **R7** | Portrait assets never enter Canon |

**After adopt:** Clinic fills verified local associations only (same honesty rules as WMC Wave 1 CM-02).

---

## 5. Local CTA replacement rules

Canon ships **CTA templates**, not Gabba buttons.

| Slot | Canon default | Clinic overlay replaces with |
| --- | --- | --- |
| Primary book | “Book with your clinic” placeholder / `{{bookingCta}}` | HotDoc lightbox URL for that clinic, or phone-only rule |
| Call | `{{phoneTel}}` / `{{phoneDisplay}}` | `ClinicProfile` |
| Team | “Meet our doctors” → clinic team index | Clinic `team.html` / GP list |
| Related service | Canon slug path | Same slug on **clinic domain** if offered |
| Restriction notices | Not in Canon | Clinic insurance / Mary-style rules |
| Independent providers | Not in Canon | Local Clinic Content pages only |

**Rules:**

1. Never bake `t-medicals-woolloongabba` HotDoc URLs into Canon.  
2. Never bake `+61732173344` into Canon.  
3. Mid-page “Next step” education may say “book a GP appointment”; the **control** is overlay.  
4. Persistent care dock remains clinic runtime (`site.js` + profile), not Canon HTML.

---

## 6. Governance requirements

| Layer | Requirement |
| --- | --- |
| **Network Canon governance** | Network clinical owner + content owner; review cadence (default 12 months or on clinical change) |
| **Public strip fields** (when shown on adopted pages) | `reviewedBy`, `contentOwner`, `lastReviewed`, `nextReview` — fail-closed if incomplete/overdue (existing L2 rules) |
| **Private evidence** | Approver, approval reference, evidence reference, content fingerprint — **never** in public Canon JSON/JS |
| **Asset governance** | Authority diagrams must remain authenticity/pixel-lock compliant; Canon references approved asset paths only |
| **Change control** | Edits to approved Canon create a new **Canon version** (§8); clinics adopt versions explicitly |
| **Rejection** | Network can reject extraction if locality cannot be stripped or safety FAQs fail |

**Separation:** Approving Canon ≠ publishing on a clinic site. Clinic must still adopt + clinic ClinicalReview.

---

## 7. Clinical review requirements

### Network review (Canon package)

| Step | Owner | Outcome |
| --- | --- | --- |
| 1. Extraction completeness | Content lead | Diff: Flagship vs proposed Canon (locality/pract/CTA removed) |
| 2. Clinical accuracy | Network clinical reviewer | Education + FAQs + urgent pathways signed |
| 3. Source check | Clinical / content | Trusted sources current |
| 4. Network approval | Practice/network approver | Canon version `approved` |
| 5. Registry | Governance ops | Canon id + version recorded (future CMS / Decision log) |

### Clinic review (adoption)

| Step | Owner | Outcome |
| --- | --- | --- |
| 1. Offer decision | Clinic admin | `offered` / adopt status |
| 2. Overlay fill | Clinic editor | Practitioners, CTAs, local related links |
| 3. Clinic ClinicalReview | Clinic reviewer + approver | Page publish on clinic golden / revisions |
| 4. Public strip | Publish pipeline | Clinic or network attribution per product rule (default: clinic strip may cite network Canon version + local owner) |

**Hard rule:** No clinic may publish Canon body that diverges silently from approved Canon version without either (a) overlay-only changes or (b) a new network Canon version.

---

## 8. Versioning

| Concept | Rule |
| --- | --- |
| **Canon version id** | `slug@MAJOR.MINOR` (e.g. `womens-health@1.0`) |
| **MAJOR** | Clinical meaning change, FAQ safety change, diagram swap with clinical meaning |
| **MINOR** | Clarity edits, link fixes, non-clinical wording |
| **Source pin** | Record Flagship `sourcePath` + content hash / git SHA at extraction |
| **Immutability** | Approved versions are immutable; fixes → new version |
| **Clinic pin** | Adoption stores `canonVersion`; upgrades are explicit |
| **Rollback** | Clinic may pin previous Canon version; network may deprecate with notice |
| **Deprecation** | Deprecated versions remain readable for rollback; not selectable for new adopts |
| **Changelog** | Required for MAJOR; recommended for MINOR |

```text
Flagship git SHA ──extract──► CanonCandidate draft
                              │
                              ▼
                         network approve ──► CanonVersion 1.0 (immutable)
                              │
                              ├── clinic A adopts @1.0 + overlays
                              └── clinic B adopts @1.0 + overlays
                              │
                         clinical update ──► CanonVersion 1.1 / 2.0
                              │
                         clinics opt-in upgrade
```

---

## Canon promotion workflow

### End-to-end swimlane

```text
[1] NOMINATE
  Content lead selects Flagship path from classification (P0 first).
  Record: sourcePath, targetSlug, packageType, priority.

[2] ELIGIBILITY CHECK
  Apply §1 Gate A + Gate B; §2 eligibility tables.
  Stop if Local Clinic Content or Emerging maturity.

[3] EXTRACT
  Copy educational blocks from Flagship golden HTML (logical extract — not whole page).
  Apply §3 removal, §4 practitioner removal, §5 CTA templating.
  Attach asset refs + trusted sources + relatedCanonSlugs.
  Produce CanonCandidate draft + source pin (git SHA).

[4] DIFF REVIEW
  Side-by-side: Flagship vs Canon draft.
  Checklist: no phone/HotDoc/doctors/fees/suburbs; urgent FAQs intact.

[5] NETWORK CLINICAL REVIEW
  §7 network steps 2–4.
  Fail → revise extract or reject nomination.

[6] VERSION & PUBLISH CANON
  Assign version id (§8); mark approved; register changelog.
  Canon is now adoptable (not yet on other clinic domains).

[7] CLINIC ADOPT (per clinic)
  Overlay practs/CTAs; clinic ClinicalReview; publish on clinic corpus/domain.
  Pin canonVersion.

[8] MEASURE & REFRESH
  Demand/authority signals may trigger re-extraction from updated Flagship.
  New Flagship improvements → new Canon version → opt-in upgrades.
```

### RACI (summary)

| Step | Content lead | Network clinician | Network approver | Clinic editor | Clinic approver |
| --- | :---: | :---: | :---: | :---: | :---: |
| Nominate | R | C | I | I | I |
| Extract / strip | R | C | I | — | — |
| Network clinical sign-off | C | R | A | — | — |
| Version approve | C | C | A | — | — |
| Adopt + overlay | I | I | I | R | A |
| Clinic publish | I | I | I | R | A |

R = responsible · A = accountable · C = consulted · I = informed

### Definition of done (single promotion)

- [ ] Gate A pass + Gate B ≥4  
- [ ] Canon draft passes locality/pract/CTA strip checklist  
- [ ] Network clinical + approval complete  
- [ ] Version id + source pin + changelog filed  
- [ ] At least one dry-run adopt checklist completed on paper (overlays listed) — optional before first real second clinic  

---

## Relationship to existing artefacts

| Artefact | Role |
| --- | --- |
| Flagship / Canon classification | What may be nominated |
| Multi-clinic architecture | NetworkKnowledge / ClinicAdoption / service overlays |
| Content maturity Wave 1 | Raises Flagship quality before extraction |
| Governance L2 / `governance-published.js` | Fail-closed public strips; private evidence model |
| Golden HTML freeze | Flagship remains clinic corpus; Canon is extracted package, not a second mutable golden tree for all suburbs |

---

## Explicit non-goals

- Auto-scraping WordPress network sites into Canon  
- Sharing practitioner entities across clinics  
- Promoting independent-provider or fees pages  
- Implementing CMS extractors in this pass  

---

## Document history

| Date | Change |
| --- | --- |
| 2026-11-03 | Initial Canon extraction / promotion framework (no implementation). |
| 2026-11-03 | C0–C2 preparation on Flagship host; registry + nominated extraction candidates. |
| 2026-11-03 | Linked formal Canon Governance Specification (policy; no CMS design). |
