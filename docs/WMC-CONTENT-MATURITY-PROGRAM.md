# WMC Content Maturity Program

**Backlog only — do not implement in this pass.**  
**Date:** 2026-11-03  
**Constraint set:** No new pages · No new diagrams · No website redesign  
**Evidence base:** [`WMC-CONTENT-MATURITY-AUDIT.md`](./WMC-CONTENT-MATURITY-AUDIT.md) · QA3/QA4 · `old-html/assets/knowledge/authority/*` (existing education set) · service authority tiers  
**Canvas:** `wmc-content-maturity-program`

---

## Objective

Increase **educational quality, consistency, and authority** of **existing** service and knowledge pages by deepening copy, wiring existing assets, and closing practitioner / FAQ / booking gaps.

| Allowed | Forbidden |
| --- | --- |
| Edit existing golden HTML pages (when a later implement pass is approved) | Create new pages |
| Reuse existing diagrams / education WebPs already in `assets/knowledge/authority/` | Commission or invent a new diagram phase |
| Reuse clinic-exterior, team portraits, HotDoc / hero photography already in `assets/` | Global redesign, new layout system, new chrome |
| Harden FAQs, related care, booking honesty, section copy | Content volume for vanity |

---

## Service page review (major pages)

### Maturity scores (content maturity — not Hub/Developing/Thin link tier)

| Score | Major services |
| --- | --- |
| **Flagship** | Women’s Health · Family Health · Skin Checks |
| **Mature** | Children’s Health · Preventive Healthcare · Chronic Disease Care · Mental Health · Vaccinations · Men’s Health · Skin Cancer Care |
| **Developing** | Telehealth · Medical Procedures · Antenatal & Postnatal · Allied Health · Cervical Screening · Pre-Pregnancy · ECG · Implanon · IUD · Breast Check · Prostate Care · Spirometry · Nebulising · Wound Dressings · Ear Care · Iron Infusions |
| **Emerging** | Pathology · Radiology · Pharmacy |

### Assessment summary

| Lens | Finding |
| --- | --- |
| Layout consistency | Shared shell; hubs have why/how/next + care-journey; focused/procedure pages shorter grammar — keep families, deepen within them |
| Educational depth | Flagship/Mature hubs strong; Thin procedures often generic FAQs |
| Practitioner visibility | Hubs good; Telehealth / Iron / Ear / independent providers weak or zero (honest empty-state needed) |
| FAQ quality | Present everywhere; specificity gap on procedures + some hubs |
| Related care links | Present; quality uneven (generic vs journey-aware) |
| Booking flow | Dock + HotDoc strong; Mary phone-only honesty on women’s; independent providers still feel clinic-book by default |

---

## Knowledge page review (major hubs + high-impact articles)

| Lens | Finding |
| --- | --- |
| Educational clarity | Article UX strong (QA4); topic hubs uneven — **Family Health KC** Emerging (directory-only) |
| Diagram integration | **Existing** authority education assets exist for women’s, menopause, skin, cervical, diabetes, heart, BP, mental health, telehealth, vaccination, pregnancy, children’s, preventive, healthy ageing, ADHD, chronic coordination — wired on ~22 pages; **most service hubs and many articles still omit the matching asset** |
| Related care pathways | Service ↔ knowledge links generally present; decision “what next” weaker on symptom hubs |
| FAQ completeness | Menopause / women’s / children’s / skin stronger; diabetes/heart/chronic/symptom hubs often FAQ-thin |
| Patient decision support | Best on deep articles (cervical, MHCP, anxiety, skin check); hubs need “when urgent / when book / when telehealth” packs lifted from child articles |

### Knowledge maturity (major hubs)

| Score | Hubs |
| --- | --- |
| **Mature** | Menopause · Women’s Health · Children’s Health · Skin Health & Skin Cancer |
| **Developing** | Mental Health · Diabetes · Heart · Chronic Disease · Pregnancy · Vaccinations · Preventive · Men’s · Healthy Ageing · Telehealth access · Symptom hubs (cough, pain, headache, sleep, weight, ADHD) |
| **Emerging** | Family Health (KC aggregator) |

---

## Visual maturity (no new diagram phase)

### Review

| Lens | Finding |
| --- | --- |
| Image consistency | Knowledge pages that embed authority WebPs look intentional; service hubs rarely use the matching education asset → visual authority uneven |
| Spacing / alignment / hierarchy | Existing OTP + section eyebrows + care-journey grids are the rhythm system — do not invent new section types |
| Mobile readability | Dock + sectioned H2 work (QA3/QA4); avoid stuffing extra chrome; prefer shorter FAQ answers + mid-page next-step bands already in patterns |

### Recommend using **existing** assets only

| Asset family (already in repo) | Use on (existing pages missing or under-using them) |
| --- | --- |
| `womens-life-stages-education.webp` | Service `womens-health` (if not present); keep on KC women’s |
| `menopause-education.webp` | Already on KC menopause — ensure service menopause pathways link, don’t duplicate new art |
| `skin-check-education.webp` / `queensland-sun-education.webp` | Service `skin-checks` / `skin-cancer-care` where missing |
| `cervical-screening-vs-pap-education.webp` | Service `pap-smear-cervical-screening` if missing |
| `mental-wellbeing-*` / `mental-health-conversation-*` | Service mental-health already has one; deepen placement consistency with KC |
| `heart-check-*` / `blood-pressure-numbers-education.webp` | Service chronic / preventive + heart hub articles |
| `diabetes-review-*` / `glucose-*` | Diabetes hub + chronic disease service |
| `telehealth-education.webp` | Service `telehealth` (high booking clarity value) |
| `vaccination-life-stages-education.webp` | Service vaccinations |
| `pregnancy-care-education.webp` / `childrens-gp-visit-education.webp` | Antenatal / children’s service pages if missing |
| `preventive-cycle-education.webp` / `healthy-ageing-education.webp` / `chronic-disease-care-coordination-education.webp` | Matching hubs/services |
| Clinic exterior / storefront / institutional photos | Local-area / trust blocks where hero is generic only — **reuse**, don’t shoot new sets in this program |
| Team portraits (`assets/team/`) | Practitioner cards (visibility), not new layouts |

**Do not** propose new diagram creation, new illustration styles, or a Phase-N diagram program.

---

## Top 20 page improvements

Ranked by composite of **Patient value** · **Authority value** · **Booking value** (H/M/L).  
Each item = improve **existing** page(s) only.

| # | Page(s) | Improvement (backlog) | Patient | Authority | Booking | Maturity move |
| ---: | --- | --- | :---: | :---: | :---: | --- |
| **1** | `services/womens-health.html` | Flagship harden: decision FAQs (urgent bleeding, longer appt, female GP request); ensure `womens-life-stages-education` placement if missing; keep Mary phone-only booking clear | H | H | H | Flagship → stronger Flagship |
| **2** | `services/mental-health.html` | MHCP / longer-appt / crisis-vs-routine FAQs; thicken named pract cards; align existing mental-wellbeing asset placement | H | H | H | Mature → Flagship |
| **3** | `services/skin-checks.html` | Boundary FAQ vs skin-cancer-care; wire existing skin-check / QLD sun assets if missing; pract list keep current | H | H | H | Flagship polish |
| **4** | `services/telehealth.html` | Eligibility + “when not telehealth” FAQs; Team fallback CTA; embed existing `telehealth-education.webp` | H | M | H | Developing → Mature |
| **5** | `knowledge/diabetes.html` + `services/chronic-disease-care.html` | Lift high-intent FAQs from diabetes articles onto hub; ensure diabetes/glucose/coordination assets visible; pract visibility | H | H | M | Developing → Mature |
| **6** | `knowledge/heart.html` + related heart articles | BP/heart decision FAQs on hub; ensure heart-check / BP education assets used; link ECG service honestly | H | H | M | Developing → Mature |
| **7** | `services/childrens-health.html` + `knowledge/childrens-health.html` | Fever/urgent vs routine FAQ pack; wire `childrens-gp-visit-education` on service if missing; named child-interest GPs | H | M | H | Mature → Flagship track |
| **8** | `services/pap-smear-cervical-screening.html` | Wire existing cervical-vs-pap education asset; align why/next copy lightly to hub grammar; booking prep FAQ | H | H | M | Developing → Mature |
| **9** | `services/vaccinations.html` + `knowledge/vaccinations.html` | Child vs adult/flu/travel FAQ split; ensure vaccination-life-stages asset on both where missing | H | M | H | Mature polish |
| **10** | `services/iron-infusions.html` | Who assesses / who administers / what to bring FAQs; related anaemia guides; Team/reception booking honesty | H | M | H | Developing → Mature |
| **11** | Governance publish (all KC hosts) | Populate approved review strips / ownership so existing pages show clinical authority (no new pages) | H | H | L | Corpus-wide authority |
| **12** | `services/implanon-insertion-removal.html` + `iud-insertion-removal.html` | Named inserter pract cards; consult-first FAQ; related contraception links to women’s hub | H | M | H | Developing → Mature |
| **13** | `knowledge/menopause.html` + women’s menopause articles | Decision FAQs (when to book, HRT discussion prep); confirm menopause-education asset; related service CTAs | H | H | M | Mature → Flagship track |
| **14** | `services/family-health.html` | High-intent FAQs (multi-issue, same-day, child vs adult booking); keep pract graph fresh | M | H | H | Flagship polish |
| **15** | `services/ecg.html` | Symptoms→results decision FAQs; related heart hub + chronic links; keep “not ECG specialists” honesty | H | M | M | Developing → Mature |
| **16** | `knowledge/family-health.html` | Emerging fix: short “how to use these hubs” + related service/Team — **no new articles** | M | M | M | Emerging → Developing |
| **17** | Symptom hubs (`cough`, `headache`, `pain`, `sleep`) | “When urgent” + 3 FAQ pack each from best child articles; related service CTAs | H | M | L | Developing → Mature |
| **18** | `services/pathology.html` · `radiology.html` · `pharmacy.html` | Independent-provider booking honesty block; what-to-bring / results FAQs; no fake GP lists | M | L | H | Emerging → Developing |
| **19** | `services/antenatal-postnatal-care.html` + `pre-pregnancy-care.html` | Wire pregnancy-care education if missing; next-step alignment to women’s hub; pract cards | H | M | M | Developing → Mature |
| **20** | Zero-pract synonym articles (6) | Add Team/service CTAs + pract links **or** fold distinctions into parent hub FAQs — prefer deepen/fold over new pages | M | M | L | Emerging/Developing → Mature |

---

## Scoring notes for the Top 20

| Value | Means |
| --- | --- |
| **Patient** | Reduces confusion, risk (urgent vs routine), or preparation burden |
| **Authority** | Strengthens clinical trust signals (practitioners, governed education assets, FAQ specificity) |
| **Booking** | Improves correct appointment type, HotDoc vs phone, telehealth eligibility, procedure prep |

Composite rank prefers pages that score **H** on at least two of three, then single-H high-demand hubs.

---

## Program rules (implementers later)

1. Change **existing** files under `old-html/services/` and `old-html/knowledge/` only (plus approved related public runtime if CTA honesty requires it).  
2. Prefer **rewriting FAQs and related-care copy** over adding sections that change layout grammar.  
3. For visuals: **relocate/reuse** WebPs already under `assets/knowledge/authority/`, `assets/team/`, `assets/clinic-exterior/`, existing heroes — never invent new diagram files in this program.  
4. Do not promote NetworkLocation stubs or open a second-clinic content track here.  
5. After any implement wave: golden import + UAT smoke on touched URLs only.

---

## Out of scope

- New knowledge articles or service URLs  
- New diagram / illustration production  
- Homepage / global nav / design-system redesign  
- Multi-tenant second clinic corpus  
- DNS / production cutover ops  

---

## Related artefacts

- Prior audit detail: [`WMC-CONTENT-MATURITY-AUDIT.md`](./WMC-CONTENT-MATURITY-AUDIT.md)  
- Service QA: `apps/web/reports/SERVICE_QA_AUDIT_QA3.md`  
- Knowledge QA: `apps/web/reports/KNOWLEDGE_QA_AUDIT_QA4.md`  

---

## Document history

| Date | Change |
| --- | --- |
| 2026-11-03 | Content Maturity Program backlog + Top 20 (no implementation). |
| 2026-11-03 | Phase 1 draft CM-01…CM-06 — see Phase1 report. |
| 2026-11-03 | **Wave 1 shipped CM-01…CM-04 only** — [`WMC-CONTENT-MATURITY-WAVE1-REPORT.md`](./WMC-CONTENT-MATURITY-WAVE1-REPORT.md); CM-05+ deferred/reverted. |
