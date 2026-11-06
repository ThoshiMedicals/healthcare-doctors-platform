# WMC Content Maturity Audit

**Audit only — no implementation. Do not grow page count for its own sake.**  
**Date:** 2026-11-03  
**Corpus:** `old-html/services/*.html` (29) · `old-html/knowledge/*.html` topics (21) · `old-html/knowledge/articles/*.html` (87)  
**Parents:** [`WMC-MASTER-BRAIN.md`](./WMC-MASTER-BRAIN.md) §8–9 · QA3/QA4 · `old-html/search-index/service-authority-tiers.json`  
**Canvas:** `wmc-content-maturity-audit`  
**Program backlog (Top 20):** [`WMC-CONTENT-MATURITY-PROGRAM.md`](./WMC-CONTENT-MATURITY-PROGRAM.md) · canvas `wmc-content-maturity-program`

---

## Objective

Improve **consistency, educational depth, and page maturity** on service and knowledge pages — by deepening and aligning existing pages, not by adding volume.

---

## Content Maturity Score (rubric)

Distinct from the **Hub / Developing / Thin** *authority-graph* tier (link counts). This score judges **authored patient experience**.

| Score | Meaning |
| --- | --- |
| **Emerging** | Shell incomplete or directory-thin; education shallow; FAQ generic/missing; weak practitioner or related-care graph |
| **Developing** | Shell present; education adequate but template-shallow; FAQ present but low specificity; practitioner/diagram/CTA uneven |
| **Mature** | Full section grammar for family; specific FAQs; related care + CTA solid; practitioners present where clinically honest; readable on mobile |
| **Flagship** | Mature **plus** distinctive depth, intentional visual rhythm (e.g. care-journey), high-intent FAQs, strong named practitioner visibility, clear next-step pathways |

**Nine assessment lenses:** section consistency · educational depth · FAQ quality · practitioner visibility · related care links · diagram placement · CTA placement · visual rhythm · mobile readability.

---

## Corpus findings (cross-cutting)

| Lens | Services | Knowledge topics | Knowledge articles |
| --- | --- | --- | --- |
| 1. Section consistency | Two families (hub vs focused/procedure) share OTP + FAQ + booking; hubs add why/how/next/journey; focused omit why/next → **intentional but uneven** | Hub shell strong; **family-health** is a thin directory outlier | Article shell highly consistent (hero → OTP → body → related → CTA) |
| 2. Educational depth | Hubs ~1.1–1.8k words with care lists; focused ~800–1.0k procedure/info | Topics ~430–980 words; symptom hubs thinner | 19 deep (≥1100w) · 41 mid · 27 thinner; depth ≠ always better FAQs |
| 3. FAQ quality | All 29 have FAQ blocks; hubs often 4–8 specific Qs; many focused stuck at ~4 generic Qs | Only **menopause, women’s, children’s, skin** show authored `<details>` FAQ density; most topics FAQ-thin | Near-universal FAQ presence; quality varies; synonym articles thinner |
| 4. Practitioner visibility | Strong on hubs; **zero doctor cards** on pathology/pharmacy/radiology/telehealth/iron/ear (and thin on some procedures) — QA3 S-M1 | Variable; family/preventive/healthy-ageing/telehealth topics often **0** named cards | 6 articles with **0** doctor links (mostly “is this X?” synonym pages) |
| 5. Related care | Present on all services (resource links) | Present; often 3–4 generic related cards | Related guides/services strong (QA4) |
| 6. Diagram placement | **No** dedicated authority/care-pathway **images** detected on services; hubs use **care-journey-grid** instead | No diagram assets on topics | Diagram assets essentially **absent** on articles (opportunity, not volume) |
| 7. CTA placement | Booking CTA + persistent dock strong; mid-page book stronger on some focused pages | Final CTA + dock; topic wayfinding to service varies | Mid “Next step” + final CTA + dock (QA4) |
| 8. Visual rhythm | Hub care-journey grids create rhythm; focused pages denser prose blocks | Card grids help; thin hubs feel sparse | Uniform article rhythm; little diagram break |
| 9. Mobile readability | Dock + OTP + sectioned H2; QA3 mobile ~87 | KC shell + section toggle; QA4 readability ~88 | Same KC UX; long FAQ lists need scan discipline |

**Authority-graph snapshot (services):** Hub 4 · Developing 10 · Thin 15 — useful for prioritisation, **not** identical to Content Maturity Score.

---

## Service pages — maturity scorecards

### Flagship

| Page | Strengths | Weaknesses | Recommended improvements |
| --- | --- | --- | --- |
| **Women’s Health** | Full hub grammar; rich next-step pathways; 7 FAQ details; 6–7 named practitioners; strong related services/guides; care-journey grid; Mary phone-only booking honesty | No educational diagram; some FAQ answers still “ask your doctor” soft | Add one governed care-pathway diagram (screening → contraception → pregnancy → menopause); harden 1–2 FAQs with decision cues (when longer appointment / when urgent) |
| **Family Health** | Highest authority graph; 9+ practitioner links; care-journey; broad related care | Educational body less distinctive than women’s/skin; FAQ count modest vs depth available | Enrich 2–3 high-intent FAQs (same-day, multi-issue, children’s vs adult booking); keep practitioner graph current |
| **Skin Checks** | Deepest service copy; strong FAQ set; care-journey; clear QLD sun context; good practitioner + guide links | No diagram; overlaps skin-cancer-care (clarify boundary) | One “when to book / what happens” visual; cross-link boundary sentence with skin-cancer-care (no new page) |

### Mature

| Page | Strengths | Weaknesses | Recommended improvements |
| --- | --- | --- | --- |
| **Children’s Health** | Deep hub; care-journey; strong guides | Practitioner cards thinner than women’s | Name verified child-interest GPs; FAQ on fever/urgent vs routine |
| **Preventive Healthcare** | Hub tier; journey + guides | Diagram absent; FAQ modest | Age-stage FAQ cluster (not new articles) |
| **Chronic Disease Care** | Hub; rich knowledge inbound | Pract cards thinner; education generic vs diabetes/heart topics | Link journey steps explicitly to diabetes/heart knowledge hubs |
| **Mental Health** | Developing→near Mature content; care-journey; guides | Pract list thin; FAQs generic vs anxiety/depression articles | Surface MHCP / longer appointment FAQs; ensure 3+ named pract cards |
| **Vaccinations** | Solid hub grammar; good guides | Depth uneven adult vs child | Split FAQ intent (child schedule vs adult/flu/travel) without new pages |
| **Men’s Health** | Journey + prostate/heart links | Thinner than women’s hub | Strengthen prostate/heart next-step FAQs; pract visibility |
| **Skin Cancer Care** | Deep; FAQ rich; paired with skin checks | Boundary with skin-checks fuzzy | Clarify “check vs treatment/referral” in intro + one FAQ |

### Developing

| Page | Strengths | Weaknesses | Recommended improvements |
| --- | --- | --- | --- |
| **Telehealth** | Clear access education; related guides | **0** practitioner cards; after-hours/eligibility FAQs thin | Eligibility + “when not telehealth” FAQs; Meet Our Team fallback if no specialty list |
| **Medical Procedures** | Index hub for procedures; journey | Thin knowledge inbound; uneven child pages | Strengthen links into ECG/iron/etc.; one “what procedures we offer” visual list |
| **Antenatal & Postnatal** | Focused depth; FAQs; pract links | Missing hub why/next grammar | Align section IDs with hub pattern lightly (why it matters / next steps) |
| **Allied Health** | Journey present | Thin pract; education shallow | Clarify referral model; related care to chronic/family |
| **Cervical Screening** | Strong FAQ count; pract cards | Authority Thin; no journey grid | Promote educational depth already present; link women’s hub journey |
| **Pre-Pregnancy Care** | Good FAQ density | Thin authority; no journey | Align next steps with antenatal; pract visibility |
| **ECG** | Clear procedure grammar; honest “not ECG specialists” copy; 2 pract + nursing | Thin authority; short FAQ; no diagram | Add “symptoms → ECG → results” micro-journey; keep honesty |
| **Implanon / IUD** | Procedure clarity | 0–1 pract cards; short FAQs | Named inserters + consult-first FAQ; related contraception pathways |
| **Breast Check / Prostate Care** | Focused info | Thin graph; short FAQ | Tie to women’s/men’s hubs; screening interval FAQ |
| **Spirometry / Nebulising / Wound / Ear** | Focused procedure shell | Thin education; weak pract | Prefer deepen FAQs + related care over new pages |
| **Iron Infusions** | Procedure/cost honesty cues | 0 pract; Thin | Who assesses / who administers FAQ; anaemia related guides |

### Emerging

| Page | Strengths | Weaknesses | Recommended improvements |
| --- | --- | --- | --- |
| **Pathology / Radiology / Pharmacy** | Independent-provider honesty; FAQ present; dock CTA | 0 clinic practitioners (expected); education thin; booking chrome still clinic-default (QA3) | Dedicated “how booking differs” CTA block; deepen “what to bring / results” FAQs; do **not** fake GP lists |

---

## Knowledge topic hubs — maturity scorecards

### Mature (near-Flagship candidates)

| Topic | Strengths | Weaknesses | Recommended improvements |
| --- | --- | --- | --- |
| **Menopause** | FAQ density; pract cards; related care | No diagram; CTA only final | One symptoms→GP→options pathway visual; mid-page next step |
| **Women’s Health (KC)** | Guides + pract; FAQ details | Overlaps service hub | Differentiate education vs booking roles in lede |
| **Children’s Health (KC)** | Guides + some FAQ | Pract thin | Fever/urgent FAQ block |
| **Skin Health & Skin Cancer** | FAQ + pract | Diagram absent | Reuse skin-check decision cues |

### Developing

| Topic | Strengths | Weaknesses | Recommended improvements |
| --- | --- | --- | --- |
| **Mental Health / Diabetes / Heart / Chronic Disease / Pregnancy / Vaccinations** | Guide grids; related care; some pract | Little/no `<details>` FAQ; education short vs article depth | Lift 3–5 high-intent FAQs from best child articles onto hub (no new articles) |
| **Symptom hubs** (cough, pain, headache, sleep, weight, ADHD) | Navigation + guides | Short; FAQ-thin; similar related-care chrome | Deepen hub intros with “when urgent” + 3 FAQs; keep article count stable |
| **Men’s / Preventive / Healthy Ageing / Telehealth access** | Structure OK | 0 pract on several; thin body | Add named pract or Team CTA; age-stage FAQs |

### Emerging

| Topic | Strengths | Weaknesses | Recommended improvements |
| --- | --- | --- | --- |
| **Family Health (KC)** | Useful directory of child hubs | ~430 words; no FAQ; 0 pract; no education body | Either promote to thin aggregator with clearer purpose **or** add short “how families use these hubs” + related service/pract — **do not** spawn new articles |

---

## Knowledge articles — maturity model (87 pages)

Articles share a **Mature UX shell** (QA4 UX ~90) but **authority presentation** lags (governance strips empty; 0 named clinician bylines; 13 missing byline).

| Cohort | Approx. | Maturity | Pattern | Improve by |
| --- | --- | --- | --- | --- |
| **Deep guides** (e.g. cardiovascular risk, neck pain, cervical screening, menopause, MHCP, anxiety, skin checks, childhood vaccines) | ~19 | **Mature → Flagship-capable** | Strong depth + FAQ + related | Add 1 diagram where decision-heavy; publish governance; named reviewer |
| **Mid guides** | ~41 | **Mature** | Solid education | FAQ specificity pass; pract links where 0 |
| **Thinner / synonym** (e.g. is-this-sinus, hay-fever-a-fever, tummy-bug/gastro, school-sores, thrush, UTI naming) | ~27 | **Developing / Emerging** | Short; often **0 pract** | Merge cues into parent hubs **or** deepen in place — prefer hub FAQs over new pages |
| **Telehealth trio** (how/when/vs F2F) | 3 | **Developing** | Useful but thin | Eligibility decision FAQ; link telehealth service |

**Articles with 0 practitioner links (priority for visibility, not volume):**  
`is-a-tummy-bug-the-same-as-gastro` · `is-a-water-infection-the-same-as-a-uti` · `is-hay-fever-a-fever` · `is-this-sinus` · `is-this-thrush` · `what-are-school-sores`

---

## Ranked improvement backlog (highest patient impact first)

Impact = booking/clarity urgency × demand/care risk × maturity gap. **Depth over volume.**

| Rank | ID | Action | Pages | Impact | Effort |
| ---: | --- | --- | --- | --- | --- |
| 1 | **CM-01** | Publish governance strips + named clinical ownership on knowledge (unlocks maturity→Flagship for many articles) | All KC | Critical | Ops/CMS |
| 2 | **CM-02** | Practitioner visibility pass on high-demand services with 0/weak doctor cards (honest empty-state or named GPs) | Telehealth, Iron, Ear, Wound, Implanon, IUD, ECG (reinforce), independent providers’ booking honesty | Critical | Content |
| 3 | **CM-03** | Women’s / Skin / Mental Health **Flagship polish** — one pathway diagram each + harden high-intent FAQs (urgent vs routine, longer appt, what to bring) | `womens-health`, `skin-checks`, `mental-health` (+ KC mirrors) | High | Content |
| 4 | **CM-04** | Lift hub FAQs from best child articles onto **Diabetes, Heart, Chronic Disease, Children’s, Vaccinations** topic hubs | 5 KC topics | High | Content |
| 5 | **CM-05** | Cervical / Pre-pregnancy / Antenatal **section alignment** toward hub grammar (why/next/journey) without new pages | 3 services | High | Content |
| 6 | **CM-06** | Symptom-hub “when urgent” + 3 FAQ pack (cough, headache, pain, sleep, fever-adjacent) | 4–5 KC topics | High | Content |
| 7 | **CM-07** | Synonym article remediation: add Team/service CTA + pract links **or** fold key distinctions into parent hub FAQs | 6 zero-pract articles | Medium | Content |
| 8 | **CM-08** | Care-journey grid (or equivalent rhythm) on high-traffic **focused** pages still prose-only | Pap smear, Pre-pregnancy, ECG, Iron | Medium | Content |
| 9 | **CM-09** | Independent provider CTA differentiation (pathology/radiology/pharmacy) | 3 services | Medium | Content/UX |
| 10 | **CM-10** | Family Health KC Emerging fix (purpose + related care + Team) | `knowledge/family-health.html` | Medium | Content |
| 11 | **CM-11** | Men’s / Preventive / Healthy Ageing pract + FAQ parity with women’s hub quality | 3 services + 3 topics | Medium | Content |
| 12 | **CM-12** | Diagram placement standard: **one** governed diagram only on decision-heavy Flagship candidates (avoid illustration spam) | Skin, Women’s, Heart/Diabetes hubs | Medium | Design+Gov |
| 13 | **CM-13** | Article byline completion (13 missing) + reviewer model | KC articles | Lower | Editorial |
| 14 | **CM-14** | Thin procedure FAQ specificity pass (spirometry, nebulising, wound, ear) | 4 services | Lower | Content |

**Explicit non-goals:** new knowledge articles for coverage vanity; duplicate hubs; importing network WordPress content; changing golden layout chrome globally.

---

## Suggested sequencing

1. **CM-01 + CM-02** — authority trust + “who can help” (patient impact immediate).  
2. **CM-03 → CM-06** — deepen existing hubs patients already use.  
3. **CM-07 → CM-10** — close Emerging holes without volume.  
4. **CM-11 → CM-14** — parity and polish.

---

## Evidence sources

- Structural HTML probe 2026-11-03 (word counts, FAQ `<details>`, care-journey-grid, practitioner-knowledge-link counts, doctor URL counts).  
- [`apps/web/reports/SERVICE_QA_AUDIT_QA3.md`](../apps/web/reports/SERVICE_QA_AUDIT_QA3.md) · [`KNOWLEDGE_QA_AUDIT_QA4.md`](../apps/web/reports/KNOWLEDGE_QA_AUDIT_QA4.md).  
- `old-html/search-index/service-authority-tiers.json` (Hub/Developing/Thin graph).  
- Spot reads: `services/womens-health.html`, `services/ecg.html`, `knowledge/family-health.html`.

---

## Document history

| Date | Change |
| --- | --- |
| 2026-11-03 | Initial content maturity audit + ranked backlog (no implementation). |
