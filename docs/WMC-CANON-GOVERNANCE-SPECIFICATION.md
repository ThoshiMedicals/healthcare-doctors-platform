# Healthcare Doctors — Canon Governance Specification

**Status:** Policy draft for executive approval  
**Version:** 1.0  
**Date:** 2026-11-03  
**Scope:** Governance only — no database, API, or implementation design  
**Parents:** [`WMC-CANON-EXTRACTION-FRAMEWORK.md`](./WMC-CANON-EXTRACTION-FRAMEWORK.md) · [`WMC-CANON-REGISTRY-V1.md`](./WMC-CANON-REGISTRY-V1.md) · [`WMC-HEALTHCARE-DOCTORS-CANONICAL-CONTENT.md`](./WMC-HEALTHCARE-DOCTORS-CANONICAL-CONTENT.md) · Master Brain §8–9 · governance L2 / ClinicalReview model  
**Authority:** This specification formalises how Network Canon content is owned, approved, versioned, audited, adopted, and retired.

---

## Purpose

Translate the Canon Extraction Framework into a **policy-grade governance specification** suitable for:

1. Executive approval  
2. Network clinical and content accountability  
3. Clinic adoption discipline  
4. Future CMS behaviour (without prescribing schema or APIs)

**Hard separation:** Network Canon approval authorises a shared educational package for the Healthcare Doctors network. It does **not** authorise publication on any clinic website. Clinic publication requires separate clinic Clinical Review and clinic publish authority.

---

## 1. Canon ownership model

### 1.1 Roles

| Role | Scope | Authority |
| --- | --- | --- |
| **Network Content Owner** | Canon education package quality, inventory, extraction completeness, editorial clarity, related-Canon linking, registry hygiene | Nominate candidates; prepare extracts; request clinical review; maintain changelogs; propose deprecate/retire |
| **Network Clinical Approver** | Clinical accuracy, safety pathways, evidence quality, FAQ appropriateness, source validity for the **network** package | Approve / reject Canon versions; require revisions; trigger clinical review; authorise MAJOR clinical meaning |
| **Clinic Clinical Reviewer** | Fitness of **adopted** Canon + local overlays for that clinic’s patients and services offered | Approve clinic adoption of a pinned Canon version; reject unsafe or dishonest local overlays |
| **Clinic Publisher** | Putting clinic-reviewed pages live on the clinic domain / golden corpus / immutable revisions | Publish only after Clinic Clinical Reviewer approval; may not alter Canon clinical body |

Supporting roles (consulted / informed, not Canon decision-makers by default): clinic editors (overlay fill), governance ops (registry recording), network executive (policy exceptions).

### 1.2 Responsibilities

#### Network Content Owner

- Maintain alignment with Canon Registry classification (P0 / P1 / P2 / Not Canon).  
- Nominate Flagship sources for promotion and prepare Canon Candidate packages.  
- Ensure Gate A / Gate B evidence is assembled before clinical review.  
- Enforce Canon purity during extraction (see §4).  
- Keep public-facing ownership metadata complete for approved versions.  
- Never place private evidence in public payloads.  
- Propose version bumps and deprecation with rationale.

#### Network Clinical Approver

- Verify clinical accuracy, safety, FAQ urgency pathways, and trusted sources (§5).  
- Approve transition from Clinical Review → Approved.  
- Reject packages that fail purity, safety, or evidence standards.  
- Authorise MAJOR version clinical meaning changes.  
- Confirm annual and triggered review outcomes.  
- Remains accountable for **network** clinical content quality — not for each clinic’s local overlays.

#### Clinic Clinical Reviewer

- Confirm the clinic offers (or appropriately frames) related services before adopting.  
- Review local overlays for honesty (practitioners, booking, eligibility).  
- Approve clinic publication of pages that include adopted Canon body.  
- Must not silently rewrite Canon clinical prose; material clinical change requires a new network Canon cycle (§8).  
- Ensure clinic public strip / ClinicalReview obligations are met under existing L2 rules.

#### Clinic Publisher

- Publish only clinic-approved revisions.  
- Preserve pinned `canonVersion` on adopt.  
- Apply only permitted overlays (§8).  
- Must not publish if required clinic review metadata is missing (fail-closed).  
- Must not expose private network or clinic governance evidence publicly.

### 1.3 Separation of approvals

```text
Network Clinical Approver
        │  approves Canon Version (network package)
        ▼
  Published to Registry (adoptable)
        │
        │  ≠ automatic clinic go-live
        ▼
Clinic Clinical Reviewer + Clinic Publisher
        │  adopt + overlay + clinic ClinicalReview
        ▼
  Live on clinic domain
```

| Approval | What it means | What it does **not** mean |
| --- | --- | --- |
| **Network Canon approval** | Package is clinically fit and pure enough for network adopt | Any clinic site may go live |
| **Clinic Clinical Review** | This clinic may publish this pinned version + these overlays | Network Canon clinical body may be rewritten |
| **Clinic publish** | Live delivery on clinic corpus/domain | Network-wide syndication change |

**Policy statement:** Network approval ≠ clinic publication approval.

---

## 2. Canon lifecycle states

```text
Draft
  → Candidate
  → Clinical Review
  → Approved
  → Published to Registry
  → Deprecated
  → Retired
```

| State | Meaning | Who may enter / change state | Required approvals | Audit requirements |
| --- | --- | --- | --- | --- |
| **Draft** | Working extract or nomination notes; not reviewable as final | Network Content Owner | None | Optional work notes; source path recommended |
| **Candidate** | Formal Canon Candidate after eligibility + purity prep | Network Content Owner → Candidate | Gate A pass + Gate B ≥ threshold documented; purity self-check | Source Flagship path, proposed slug, package type, priority, extraction date, source git SHA (or equivalent fingerprint) |
| **Clinical Review** | Package under Network Clinical Approver assessment | Network Content Owner submits; Network Clinical Approver accepts into review | Candidate complete; purity validation recorded | Reviewer identity, review start date, checklist results (accuracy/safety/sources/FAQs) |
| **Approved** | Network clinical + content sign-off complete; version identity assigned | Network Clinical Approver (clinical); Network Content Owner confirms packaging | Dual accountability: clinical approve + content packaging complete | Approver, approval date, version id, changelog entry, content fingerprint |
| **Published to Registry** | Version is listed as adoptable in Canon Registry | Governance ops / Network Content Owner after Approved | Approved state + immutable audit record complete | Registry publication date, version id, registry reference; package becomes immutable |
| **Deprecated** | Must not be selected for **new** adopts; existing pins may remain | Network Clinical Approver (clinical reason) or Network Content Owner (supersession) with clinical concurrence for clinical deprecations | Written deprecation reason; successor version identified when available | Deprecation date, reason, successor version (if any), notice to adopting clinics |
| **Retired** | No longer available for adopt or routine rollback promotion; archive only | Network Clinical Approver + Network Content Owner (joint) | Executive / network policy concurrence if retirement removes last safe version of a topic | Retirement date, archive location reference, final SHA/fingerprint |

### 2.1 Transition rules

- States move **forward** only through the path above, except: Clinical Review may return to Candidate (revise) or Draft (withdraw).  
- Approved packages are **immutable**; corrections create a **new** version (new Candidate cycle), not an in-place edit of Published to Registry.  
- Deprecated may move to Retired; Published to Registry may move to Deprecated without passing through other states.  
- No role may jump Local Clinic Content into Published to Registry.

### 2.2 Rejection

At Candidate or Clinical Review, Network Clinical Approver or Network Content Owner may **reject**. Rejected items record reason and remain auditable; they do not enter Approved.

---

## 3. Promotion governance

### 3.1 Promotion path

```text
Flagship Authority page (clinic-hosted exemplar)
        → Canon Candidate
        → Canon Version (Approved → Published to Registry)
```

### 3.2 Mandatory promotion requirements

| Step | Requirement | Fail closed if missing |
| --- | --- | --- |
| 1 | Source is Flagship Authority and/or Registry Canon P0–P2 class | Yes |
| 2 | **Gate A** — all mandatory criteria pass (Extraction Framework §1) | Yes |
| 3 | **Gate B** — quality threshold met (≥4 of 6 signals) | Yes |
| 4 | **Canon purity validation** (§4) | Yes |
| 5 | **Network clinical review** (§5) | Yes |
| 6 | **Version approval** with `slug@MAJOR.MINOR.PATCH` (§6) | Yes |
| 7 | Immutable audit record (§7) | Yes |
| 8 | Registry publication | Yes |

### 3.3 Gate A (mandatory) — summary for governance

All must pass:

1. Classified Flagship / Canon-eligible in Registry  
2. Maturity bar (Mature/Flagship educational body — not Emerging-only ops)  
3. Clinically generalisable education  
4. One-diagram policy respected; existing assets only  
5. No unresolved clinical safety errors in FAQs  
6. Formal nomination by Network Content Owner with clinical awareness  

### 3.4 Gate B (threshold) — summary for governance

At least **four of six**:

1. Clear section grammar  
2. Decision-support FAQs  
3. Internal education links  
4. Trusted Australian sources present or attachable  
5. Authority education asset available (preferred)  
6. Demand / measurement priority signal (optional but scored)

### 3.5 Local clinic content

**Local Clinic Content must never bypass governance.**

Prohibited promotion sources include (non-exhaustive): independent provider pages (pathology / radiology / pharmacy), fees-only pages, clinic KC index chrome, thin local aggregators classified Not Canon, phone-only practitioner rules as page core, Gabba-only ops copy.

Attempts to promote such content **fail closed** at Candidate.

---

## 4. Canon purity policy

Canon body must remain **clinic-agnostic clinical education**. Overlay slots exist for clinic-specific material; they are not Canon.

### 4.1 Prohibited content classes

| Class | Definition | Examples (non-exhaustive) |
| --- | --- | --- |
| **Practitioner** | Named clinicians, portraits, doctor deep-links, “ask for Dr X” | Practitioner cards; `practitioner-knowledge-link`; named FAQ answers |
| **Operational** | How **this** clinic runs day-to-day ops as exclusive truth | Opening hours; parking; “ask our reception on Vulture Street”; clinic-specific wait process as Canon |
| **Commercial** | Fees, billing products, practice commercial claims | Fee tables; bulk-billing practice claims as Canon body; HotDoc centre URLs; phone CTAs baked into education |
| **Locality** | Suburb / catchment / “only for patients of this area” framing | Woolloongabba / inner-south catchment paragraphs; address blocks; suburb lists |
| **Clinic Accreditation** | Accreditation or quality marks tied to a **specific** clinic entity as Canon clinical content | AGPAL sentences as Canon body; clinic-specific accreditation badges inside educational package |

Queensland / Australia-wide clinical context (e.g. sun exposure, national screening programs) may remain when clinically true network-wide.

### 4.2 Automatic extraction failure conditions

Extraction / Candidate **must fail** if any of the following are detected in the proposed Canon body (not overlays):

1. Named practitioner or doctor profile URL  
2. HotDoc centre URL or clinic telephone number  
3. Fee amounts or bulk-billing commercial claims  
4. Suburb / street / catchment locality claims  
5. Clinic accreditation claims presented as Canon education  
6. Local Clinic Content source path  
7. Gate A failure or Gate B below threshold  
8. Broken or unsafe urgent-care FAQ pathway  
9. Missing source pin (Flagship path + git SHA / fingerprint)  
10. Private evidence fields embedded in the public Canon package  

Failure returns the item to Draft/Candidate with recorded reasons. It must not reach Approved.

---

## 5. Clinical review policy

### 5.1 What clinical review must verify

| Domain | Standard |
| --- | --- |
| **Accuracy** | Statements are clinically appropriate for Australian general practice education |
| **Safety** | Urgent vs routine pathways are correct; emergencies direct to appropriate care (e.g. 000 where required) |
| **Evidence quality** | Claims are proportionate; no overstated certainty |
| **FAQ appropriateness** | Minimum decision-support intent preserved; no unsafe self-management advice |
| **Source validity** | Trusted sources current and appropriate (e.g. Healthdirect, national program pages) |

Network Clinical Approver signs these domains before Approved.

### 5.2 Cadence

| Review type | Requirement |
| --- | --- |
| **Annual minimum** | Every Published Registry version must have `nextReview` ≤ 12 months from last network clinical approval unless a shorter cycle is set |
| **Triggered review** | Immediate reassessment when a trigger event affects clinical meaning or safety |

### 5.3 Triggered review events (examples)

- RACGP guidance updates affecting the topic  
- Queensland Health guidance changes material to the education  
- TGA safety communications affecting medicines / devices referenced  
- Medicare / MBS policy updates that change care-plan or pathway education (education layer only — billing rules remain clinic)  
- Clinical incidents or near-misses linked to the topic’s public education  
- Material Flagship source correction that changes clinical meaning  
- Discovery of purity breach in a Published version  

Triggered review may result in: no change (record), MINOR/PATCH version, MAJOR version, Deprecation, or Retirement.

---

## 6. Version management

### 6.1 Version format

```text
slug@MAJOR.MINOR.PATCH
```

Examples: `womens-health@1.0.0`, `diabetes@1.2.1`, `mental-health@2.0.0`

### 6.2 Increment rules

| Segment | When to increment | Examples |
| --- | --- | --- |
| **MAJOR** | Clinical meaning change; FAQ safety pathway change; diagram swap that changes clinical meaning; removal/replacement of core education claims | New urgent-care advice; different screening recommendation framing |
| **MINOR** | Non-safety clinical clarification; structural education improvement; related-Canon link updates; added FAQ that does not change safety pathways | Clearer wording; additional trusted source; improved hub↔service triangle links |
| **PATCH** | Typos, formatting, non-clinical link fixes, metadata corrections that do not change clinical meaning | Spelling; broken relative link repair without meaning change |

**Rules:**

- Approved / Published versions are **immutable**.  
- Any change → new version id → new Candidate → Clinical Review → Approved → Published to Registry.  
- Changelog **required** for MAJOR; **required** for clinical MINOR; recommended for PATCH.  
- Source Flagship path + git SHA / fingerprint recorded per version.

### 6.3 Upgrade policy

- Clinics **pin** an exact version on adopt.  
- Network publication of a newer version does **not** auto-upgrade clinics.  
- Clinic upgrade requires Clinic Clinical Reviewer approval of the new pin (and overlay re-check).  
- Network may **recommend** or **require** upgrade when safety MAJOR deprecates a prior version; clinics must not remain on a Retired unsafe version for public education.

### 6.4 Deprecation policy

- Deprecated versions: blocked for **new** adopts; readable for rollback while successor is stabilising.  
- Retired versions: archive only; not for new adopt; rollback only under documented exception.  
- Deprecation should name successor version when one exists.

---

## 7. Audit requirements

### 7.1 Required audit fields (per Canon version)

| Field | Purpose |
| --- | --- |
| Source Flagship page (`sourcePath`) | Provenance |
| Extraction date | Timeline |
| Source git SHA (or equivalent content fingerprint) | Reproducibility |
| Approver (Network Clinical Approver identity) | Accountability |
| Approval date | Timeline |
| Version number (`slug@MAJOR.MINOR.PATCH`) | Identity |
| Review history | Annual + triggered reviews, outcomes |
| Content fingerprint of approved package | Integrity |
| Purity validation record | Compliance |
| Gate A / Gate B evidence references | Eligibility |
| Changelog | Change control |

### 7.2 Immutability

- Once **Published to Registry**, the audit record and package bytes/fingerprint for that version must not be altered.  
- Corrections append a **new** version and new audit record.  
- Review history events append; they do not rewrite prior approval rows.  
- Rejection and deprecation events are retained.

### 7.3 Public vs private

| Public (may appear on clinic pages / public Canon metadata) | Private (governance only — never public payload) |
| --- | --- |
| `reviewedBy`, `contentOwner`, `lastReviewed`, `nextReview` (per L2 strip rules) | Approver evidence references, internal approval IDs, incident notes, private reviewer comments, raw Gate worksheets if sensitive |

---

## 8. Clinic adoption governance

### 8.1 Permitted clinic overlays

When adopting a pinned Canon version, clinics **may** add:

- Local booking CTA (HotDoc / phone-only rules as applicable)  
- Practitioner overlays (verified local associations only)  
- Local contact information  
- Local operational information (hours, parking, reception process)  
- Local related-service links for services the clinic actually offers  
- Clinic ClinicalReview / public strip attribution consistent with L2  

### 8.2 Prohibited clinic changes

Clinics **must not**:

- Alter approved Canon clinical prose, FAQs, diagrams, or safety pathways without a new network Canon review cycle  
- Remove purity constraints (e.g. insert another clinic’s doctors into “Canon body” rather than overlay slots)  
- Publish an unpinned or Draft/Candidate package  
- Adopt Deprecated versions for new publishes (except documented rollback of a prior pin)  
- Adopt Retired versions except archive/exception process  

### 8.3 Divergence rule

If a clinic needs different clinical education:

1. Request network Canon revision (new version), **or**  
2. Keep clinic-local education **outside** Canon adopt (not labelled as Network Canon), subject to clinic Clinical Review  

Silent divergence while claiming a Canon version is a governance breach.

---

## 9. Risk controls

### 9.1 Fail-closed publication rules

Canon **cannot** be Published to Registry (and clinics cannot honestly claim Canon adopt) if any of the following are missing or invalid:

- Required ownership / approval metadata  
- Source Flagship reference + git SHA / fingerprint  
- Gate A pass + Gate B threshold evidence  
- Purity validation record  
- Network clinical approval record  
- Version number  
- Review status in an allowable publishable state (**Approved** transitioning to **Published to Registry**)  

Clinic **cannot** publish adopted Canon pages if:

- Clinic Clinical Reviewer approval is missing  
- Pinned version is missing or points to Draft/Candidate/Retired (except controlled rollback policy)  
- Required clinic public strip / ClinicalReview fields fail L2 fail-closed checks  

### 9.2 Public payload protection

- Public pages, public Canon JSON/JS, and client bundles must **never** expose private evidence or private governance records.  
- Public strip fields remain the only governance-facing patient-visible metadata, under existing fail-closed L2 rules.  
- Measurement / admin systems may hold private records separately under access control (implementation out of scope).

### 9.3 Authority assets

- Canon may reference only approved existing authority education assets.  
- Pixel-lock / authenticity rules for authority diagrams remain in force.  
- New diagram production is outside this governance document’s implementation scope; governance still requires asset approval before Canon reference.

---

## Compliance summary (executive)

| Control | Policy |
| --- | --- |
| Ownership | Network Content Owner + Network Clinical Approver; clinic reviewer + publisher for adopt |
| Separation | Network approval ≠ clinic publication |
| Lifecycle | Draft → Candidate → Clinical Review → Approved → Published to Registry → Deprecated → Retired |
| Promotion | Flagship → Candidate → Version with Gate A/B, purity, clinical review, audit |
| Purity | No practitioner / operational / commercial / locality / clinic-accreditation Canon body |
| Clinical review | Accuracy, safety, evidence, FAQs, sources; annual + triggered |
| Versioning | `slug@MAJOR.MINOR.PATCH`; clinics pin until explicit upgrade |
| Audit | Immutable provenance and approval history |
| Risk | Fail-closed; private evidence never public |

---

## Related artefacts

| Artefact | Role |
| --- | --- |
| [`WMC-CANON-EXTRACTION-FRAMEWORK.md`](./WMC-CANON-EXTRACTION-FRAMEWORK.md) | Process and extraction rules this policy governs |
| [`WMC-CANON-REGISTRY-V1.md`](./WMC-CANON-REGISTRY-V1.md) | Locked inventory of what may be nominated |
| [`WMC-HEALTHCARE-DOCTORS-CANONICAL-CONTENT.md`](./WMC-HEALTHCARE-DOCTORS-CANONICAL-CONTENT.md) | Classification and roadmaps |
| Existing L2 ClinicalReview / `governance-published` model | Public strip fail-closed behaviour on clinic pages |

---

## Document history

| Date | Change |
| --- | --- |
| 2026-11-03 | v1.0 — initial Canon Governance Specification (policy only). |
