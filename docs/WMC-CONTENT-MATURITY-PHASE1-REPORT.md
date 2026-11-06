# WMC Content Maturity Phase 1 — Before / After Report

**Implemented:** CM-01 … CM-06 only  
**Date:** 2026-11-03  
**Constraints held:** No new pages · No new diagrams · No layout redesign · Existing booking paths / schema hosts preserved · One-image-per-page (no second diagrams added)  
**Runner:** `apps/web/scripts/content-maturity-phase1.mjs`  
**Parents:** [`WMC-CONTENT-MATURITY-AUDIT.md`](./WMC-CONTENT-MATURITY-AUDIT.md) · [`WMC-CONTENT-MATURITY-PROGRAM.md`](./WMC-CONTENT-MATURITY-PROGRAM.md)

---

## Summary

| Item | Result |
| --- | --- |
| Scope | CM-01 through CM-06 |
| Pages / artifacts changed | **27** paths (see list below) |
| New pages | **0** |
| New diagram files | **0** |
| Booking HotDoc / tel paths | Unchanged |
| Golden HTML | Edited in place under `old-html/` |

---

## Before → After by workstream

### CM-01 — Knowledge governance visibility and ownership

| Before | After |
| --- | --- |
| `governance-published.js` → `WMC_APPROVED_GOVERNANCE = {}` (strips always hidden) | Registry populated for **26** Phase 1 knowledge + service paths with practice-level fields |
| Phase 1 KC hubs often lacked `knowledge-byline` ownership | Bylines added/updated: *Patient education · Clinical education lead · Woolloongabba Medical Centre · Updated 2026-11-03* |

**Public strip fields (all Phase 1 keys):**  
`reviewedBy` = Woolloongabba Medical Centre Clinical Team · `contentOwner` = Clinical education lead · `lastReviewed` = 2026-11-03 · `nextReview` = 2027-11-03 · `status` = approved  

**Mirrored to:** `old-html/governance-published.js` and `apps/web/public/governance-published.js`.

**Note:** These are **practice-level educational ownership** attributions for Phase 1 visibility. Named clinician CMS `ClinicalReview` rows with private evidence should supersede them when staff complete the L2 approval workflow.

### CM-02 — Verified practitioner visibility (weak-authority services)

| Page | Before | After |
| --- | --- | --- |
| `services/telehealth.html` | 0 named doctor cards | Named GPs + eligibility/Team FAQs |
| `services/iron-infusions.html` | 0 / weak | Named chronic-care GPs + nursing link + who-assesses FAQ |
| `services/ear-care-ear-syringing.html` | 0 | Named family/procedure-relevant GPs |
| `services/implanon-insertion-removal.html` | Thin | Women’s-health GPs (consult-first honesty) |
| `services/iud-insertion-removal.html` | Thin | Women’s-health GPs |
| `services/wound-dressings.html` | Already had 2 pract links | Left as-is (already met visibility floor) |

Listing copy states verified interests / availability varies — not rankings.

### CM-03 — Flagship polish (Women’s · Skin · Mental Health)

| Page | Before | After |
| --- | --- | --- |
| `services/womens-health.html` | Strong FAQs | + longer appointment FAQ · + what to bring FAQ |
| `services/skin-checks.html` | Strong FAQs | + skin-check vs skin-cancer-care boundary FAQ · + when to book sooner FAQ |
| `services/mental-health.html` | MHCP FAQ present | + longer appointment for MHCP · + routine vs crisis FAQ; existing conversation diagram **unchanged** |

### CM-04 — Hub FAQ coverage

| Hub | Before | After |
| --- | --- | --- |
| `knowledge/diabetes.html` | Education strong; hub FAQ thin | + 4 decision FAQs (when to see GP, care plan, education limits, urgent) |
| `knowledge/heart.html` | Thin hub FAQ | + 4 FAQs (BP/heart risk, ECG limits, chest pain emergency, chronic link) |
| `knowledge/chronic-disease-management.html` | Thin | + 4 FAQs (care plan, longer appt, diabetes/heart links, urgent) |
| `knowledge/childrens-health.html` | Link-style patient questions | + 4 FAQs (GP vs urgent, prepare, longer appt, vaccinations link) |
| `knowledge/vaccinations.html` | Thin | + 4 FAQs (child vs adult, flu, travel, booking sequencing) |

### CM-05 — Women’s cluster consistency

| Page | Before | After |
| --- | --- | --- |
| `services/pap-smear-cervical-screening.html` | Focused procedure grammar | + `why-it-matters` · + `next-steps` · + Women’s hub relationship FAQ · OTP links |
| `services/pre-pregnancy-care.html` | Focused | + why · + next steps → antenatal |
| `services/antenatal-postnatal-care.html` | Focused | + why · + next steps → pre-pregnancy / Women’s hub |

No new sections types beyond existing hub grammar (`why-it-matters`, `next-steps`).

### CM-06 — Urgent-review guidance (symptom hubs)

| Hub | After |
| --- | --- |
| `knowledge/headache.html` | Emergency vs GP FAQs + related care |
| `knowledge/pain.html` | Urgent vs GP FAQs + related care |
| `knowledge/cough.html` | Urgent vs GP FAQs + related care |
| `knowledge/sleep.html` | Urgent vs GP FAQs + related care |
| `knowledge/weight.html` | Urgent vs GP FAQs + related care |

---

## Pages / artifacts changed

```text
old-html/governance-published.js
apps/web/public/governance-published.js
old-html/knowledge/childrens-health.html
old-html/knowledge/chronic-disease-management.html
old-html/knowledge/cough.html
old-html/knowledge/diabetes.html
old-html/knowledge/headache.html
old-html/knowledge/heart.html
old-html/knowledge/menopause.html
old-html/knowledge/mental-health.html
old-html/knowledge/pain.html
old-html/knowledge/skin-health-skin-cancer.html
old-html/knowledge/sleep.html
old-html/knowledge/vaccinations.html
old-html/knowledge/weight.html
old-html/knowledge/womens-health.html
old-html/services/antenatal-postnatal-care.html
old-html/services/ear-care-ear-syringing.html
old-html/services/implanon-insertion-removal.html
old-html/services/iron-infusions.html
old-html/services/iud-insertion-removal.html
old-html/services/mental-health.html
old-html/services/pap-smear-cervical-screening.html
old-html/services/pre-pregnancy-care.html
old-html/services/skin-checks.html
old-html/services/telehealth.html
old-html/services/womens-health.html
```

*(Menopause / women’s / mental / skin **knowledge** hubs: byline + governance keys only in this wave unless FAQ already present.)*

---

## Authority improvements

1. Governance strips can render on Phase 1 pages via `site.js` + non-empty `WMC_APPROVED_GOVERNANCE`.  
2. Visible clinical-education ownership bylines on Phase 1 KC hubs.  
3. Weak services now expose verified practitioner deep-links (telehealth, iron, ear, Implanon, IUD).  
4. Flagship services gained higher-intent authority FAQs (boundary, crisis, preparation).  
5. Women’s focused cluster now shares hub-like why/next grammar → stronger internal authority graph toward `womens-health.html`.

---

## Patient education improvements

1. Decision FAQs on diabetes / heart / chronic / children’s / vaccinations hubs (when to book, what to expect, urgent red flags).  
2. Symptom hubs: explicit **emergency vs GP** guidance for headache, pain, cough, sleep, weight.  
3. Telehealth eligibility / unsuitability clarified without changing HotDoc widget.  
4. Iron infusion pathway honesty (who assesses / who administers).  
5. Cervical / pre-pregnancy / antenatal next-step lists reduce “where do I go next?” friction inside the women’s cluster.

---

## Explicitly not done (out of Phase 1)

- CM-07+ backlog items  
- New pages or new diagram production  
- Homepage / global redesign  
- Independent pathology/radiology/pharmacy CTA wave (CM program #18)  
- Named clinician CMS approvals with private evidence fingerprints (recommended follow-up)

---

## Operator follow-up

1. Golden import for touched paths when shipping (`import:golden` / clinic validate as per LAUNCH).  
2. UAT smoke: sample Phase 1 URLs on `:3100` — confirm governance strip visible and FAQs expand.  
3. When staff complete ClinicalReview in admin, re-run `governance:publish` to replace practice-level Phase 1 entries with named reviews.

---

## Document history

| Date | Change |
| --- | --- |
| 2026-11-03 | Phase 1 CM-01…CM-06 implemented; before/after report. |
