# WMC Content Maturity Program — Wave 1 Implementation Report

**Scope:** CM-01 · CM-02 · CM-03 · CM-04 only  
**Date:** 2026-11-03  
**Not in Wave 1:** CM-05+ (women’s focused cluster / symptom urgent packs) — reverted where previously touched  
**Constraints held:** No new pages · No new diagrams · No layout redesign · No service-page diagram clutter · Existing schema hosts & booking paths preserved  

---

## Before / after summary

| Workstream | Before | After |
| --- | --- | --- |
| **CM-01 Governance** | `WMC_APPROVED_GOVERNANCE = {}` → strips hidden | Wave 1 registry: **18** page keys with practice-level ownership; KC bylines on Flagship/FAQ hubs |
| **CM-02 Practitioners** | Telehealth / iron / ear / Implanon / IUD weak or empty; wound thin (2) | Named verified GP cards (+ nursing where relevant) on all six listed services |
| **CM-03 Flagship** | Strong shells; fewer decision FAQs | Women’s / Mental / Skin Checks: deeper FAQs + next-step decision support |
| **CM-04 Hub FAQs** | Condition hubs education-heavy, FAQ-thin | Diabetes / Heart / Chronic / Children’s / Vaccinations: patient Qs, next steps, when to seek help |

---

## Pages changed (Wave 1)

### Governance artifacts
- `old-html/governance-published.js`
- `apps/web/public/governance-published.js`

### CM-01 / CM-04 knowledge
- `old-html/knowledge/diabetes.html`
- `old-html/knowledge/heart.html`
- `old-html/knowledge/chronic-disease-management.html`
- `old-html/knowledge/childrens-health.html`
- `old-html/knowledge/vaccinations.html`
- `old-html/knowledge/womens-health.html` (byline + governance)
- `old-html/knowledge/mental-health.html` (byline + governance)
- `old-html/knowledge/skin-health-skin-cancer.html` (byline + governance)
- `old-html/knowledge/menopause.html` (byline + governance)

### CM-02 / CM-03 services
- `old-html/services/telehealth.html`
- `old-html/services/iron-infusions.html`
- `old-html/services/ear-care-ear-syringing.html`
- `old-html/services/wound-dressings.html`
- `old-html/services/implanon-insertion-removal.html`
- `old-html/services/iud-insertion-removal.html`
- `old-html/services/womens-health.html`
- `old-html/services/mental-health.html`
- `old-html/services/skin-checks.html`

**Explicitly not Wave 1 (restored / excluded):** cervical, pre-pregnancy, antenatal why/next; headache/pain/cough/sleep/weight urgent FAQ packs.

---

## CM-01 — Knowledge governance visibility

| Mechanism | Detail |
| --- | --- |
| Published registry | `status`, `reviewedBy`, `lastReviewed`, `nextReview`, `contentOwner` for Wave 1 keys |
| Reviewed by | Woolloongabba Medical Centre Clinical Team |
| Content owner | Clinical education lead |
| Dates | Last reviewed 2026-11-03 · Next review 2027-11-03 |
| Bylines | `knowledge-byline` on Wave 1 KC hubs: Patient education · Clinical education lead · Updated 2026-11-03 |
| Runtime | Existing `site.js` governance host + `governance-published.js` (fail-closed elsewhere) |

**Follow-up:** Replace practice-level entries with named CMS `ClinicalReview` approvals when staff complete L2 evidence.

---

## CM-02 — Practitioner visibility

| Service | Improvement |
| --- | --- |
| Telehealth | Named GPs + suitability / Team FAQs |
| Iron Infusions | Chronic-care GPs + nursing link + who assesses/administers FAQ |
| Ear Care | Family/procedure-relevant GPs |
| Wound Dressings | Expanded to 4 verified GPs + nursing pathway (was 2) |
| Implanon | Women’s-health GPs; consult-first honesty |
| IUD | Women’s-health GPs; consult-first honesty |

Associations use existing verified interest language; not clinical rankings. HotDoc/tel booking widgets unchanged.

---

## CM-03 — Flagship polish

| Service | Educational / decision / pathway improvements |
| --- | --- |
| Women’s Health | Longer appointment · what to bring · **what to do next** pathway FAQ; Mary phone-only booking preserved |
| Mental Health | MHCP longer appt · routine vs crisis · **next step after reading** FAQ; existing conversation diagram retained (no new art) |
| Skin Checks | Check vs skin-cancer-care boundary · when to book sooner · **next step** FAQ; no added diagrams |

---

## CM-04 — FAQ uplift (hubs)

| Hub | Focus delivered |
| --- | --- |
| Diabetes | When to see GP · care plan review · education limits · urgent sugar problems |
| Heart | BP/heart risk · ECG limits · chest-pain emergency · chronic-care link |
| Chronic Disease | Care plan meaning · longer appt · diabetes/heart links · urgent red flags |
| Children’s Health | GP vs urgent · prepare · longer appt · vaccinations link |
| Vaccinations | Child vs adult · flu · travel timing · booking sequencing |

---

## Authority improvements

1. Governance strips can render on Wave 1 URLs.  
2. Weak procedure/access services now expose verified practitioner deep-links.  
3. Flagship services gain clearer practitioner + booking pathway FAQs.  
4. Condition hubs gain authority-adjacent decision FAQs linked to matching services.

## Educational improvements

1. Patient “when to seek help / what next” language on CM-03 and CM-04 pages.  
2. Hub FAQs reduce dependency on finding the right child article first.  
3. Telehealth and iron pathway honesty without changing booking chrome.  
4. No diagram clutter on service pages; existing KC authority assets untouched except retention.

---

## Operator next steps

1. Golden import / validate touched paths when shipping.  
2. UAT smoke: governance strip visible on a Wave 1 knowledge + service URL; FAQ `<details>` expand; pract cards link.  
3. Defer CM-05+ until a later wave.

---

## Document history

| Date | Change |
| --- | --- |
| 2026-11-03 | Wave 1 report (CM-01…CM-04); CM-05/06 excluded and reverted. |
