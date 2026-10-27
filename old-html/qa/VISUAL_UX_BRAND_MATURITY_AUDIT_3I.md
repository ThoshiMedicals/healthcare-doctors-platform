# Visual, UX & Brand Maturity Audit (PROMPT 3I)

**Assessment date:** 2026-10-26 (Australia/Brisbane)  
**Environment audited:** UAT at `http://127.0.0.1:3100` (post 3A–3H)  
**Method:** Live page review (home, practitioner profile, service hub), golden HTML/CSS inspection, prior Visual QA (2026-10-08), Hawthorne Clinic / premium AU GP benchmarks  
**Companion scorecard:** `old-html/qa/VISUAL_UX_BRAND_MATURITY_SCORECARD_3I.json`

---

## Maturity scores (0–100)

| Score | Value | Reading |
| --- | --- | --- |
| **Visual Maturity Score** | **78** | Coherent navy/teal system, strong home hero; inner pages more essay+sidebar than premium art-directed |
| **Brand Maturity Score** | **76** | Distinctive slogan + Healthcare Doctors lockup + AGPAL/bulk-billing; typography still Inter + warm cream defaults |
| **UX Maturity Score** | **82** | Clear IA, mobile content-first layouts, Digital Reception + dock; Find Information desktop-hidden; mobile chrome crowded |
| **Conversion Maturity Score** | **84** | Persistent Book/Call, HotDoc lightbox, intelligent specialist pathways; HotDoc education home-heavy; long pages delay mid-journey CTAs |
| **Overall Website Maturity Score** | **80** | Weighted mean (Visual 20% · Brand 20% · UX 30% · Conversion 30%) |

### Benchmark stance

| Benchmark | Relative position |
| --- | --- |
| **WMC maturity goals** (authority ecosystem, continuity narrative, information-first DR, measurable booking) | Largely met on content/ops; next stage is visual differentiation and quieter conversion chrome |
| **Hawthorne Clinic standards** (utility-first GP: booking, hours, team, services, HotDoc; plain trust) | WMC exceeds on storytelling, DR, authority templates, and trust density; Hawthorne is simpler/quieter on chrome |
| **Premium Australian healthcare sites** (distinct type, restrained motion, short conversion path, clinical currency visible) | WMC is competitive on trust + booking; trails on distinctive type, presence motion, and short mid-page conversion bands |

---

## Go-forward recommendation

**Overall: Strong institutional baseline — next stage is polish, not rebuild.**

Do not redesign the homepage architecture or brand lockup. Prioritise the roadmap below: expose Find Information on desktop, quiet mobile CTA competition, add mid-page conversion bands on long service/profile pages, introduce 2–3 intentional motions, and complete clinical-review visibility once approvals exist (ties to 3H/3G).

Target after next enhancement stage: **Overall ≥ 88** with Visual ≥ 85 and Brand ≥ 84.

---

## Audit by area (1–12)

### 1. Homepage — Strong

- Hero hierarchy is clear: Baskerville slogan, dual CTAs, hours, AGPAL / bulk billing / Open 7 days over clinic exterior.
- Narrative arc is long but intentional (team → philosophy → story → community → services → HotDoc → patient info → updates → book).
- Trust marks are concrete (AGPAL through Mar 2029; ACSQHC register line later on page).
- **Gap:** Team carousel early can feel directory-like vs premium sites that lead with care philosophy; CTA density (~7 Book instances + dock) is high.

### 2. Practitioner Profiles — Strong

- Profile hero with photo, care highlights, scoped HotDoc URL + Call.
- Authority sections (areas of care, interests, related services, guides, FAQs) support Hub/Developing/Thin graph.
- On-this-page + breadcrumbs aid journey clarity.
- **Gap:** Long scroll before end booking band; aside is Patient Information (ops) not peer practitioners; clinical-review strip still hidden (empty published governance).

### 3. Service Hubs — Strong / long-form

- Women’s Health uses a mature story template (what / why / how / plan / FAQ / related / practitioners / book).
- Intelligent booking note for Dr Mary Abadir (reception-only) is above typical GP clarity.
- Soft mint/teal service heroes feel calmer than home navy — consistent institutional family.
- **Gap:** Essay length without a mid-page Book band; desktop service nav remains heavy.

### 4. Health Advice — Strong

- Positioned as knowledge centre (not blog); category grid + guide search + final Book/Call CTA.
- Unified knowledge navigation supports authority journeys.
- **Gap:** Trust/clinical-review stamps not visible in UAT; search discoverability depends on manifest sync (see 3H H1).

### 5. Patient Information — Strong

- Hub “Common patient tasks” grid is clearer than home Find Information on desktop.
- New-patients critical action band is a conversion pattern worth cloning elsewhere.
- **Gap:** Hub body still list-heavy; footer/sidebar duplication of long PI link sets.

### 6. Digital Reception — Strong product / busy chrome

- Dialog with disclosure, quick chips, results, Book + Call; focus trap and reduced-motion friendly.
- Information-first journeys exceed typical clinic chat widgets.
- **Gap:** Shares persistent dock with Book/Call — visually busy on mobile; compact label “Search” helps but chrome still competes.

### 7. Booking Pathways — Strong

- Consistent HotDoc lightbox attributes across header, mobile header, dock, page CTAs.
- Practitioner-scoped vs clinic-list vs reception-only paths are documented in UI.
- Booking resilience / fallback messaging present.
- **Gap:** HotDoc app education (poster/QR) concentrated on home; inner pages rarely explain how booking works before the button.

### 8. Mobile Experience — Good with chrome risk

- Oct 2026 Visual QA resolved content-before-nav, DR vs dock collision, overflow at 320–414px.
- Mobile header Call/Book + menu; content-first article layouts.
- **Gap:** Three conversion surfaces (header pills, sticky dock, menu Find Information) — premium peers often keep one dominant mobile CTA.

### 9. Accessibility — Good foundation

- Skip link, landmarks, aria labels, `:focus-visible`, FAQ details, prefers-reduced-motion coverage.
- **Gap:** No formal contrast scorecard (3H M3); governance hosts remain `hidden` so AT never announces clinical currency.

### 10. Motion Design and Visual Effects — Developing

- Micro-interactions: button lift, portrait scale ~1.012, FAQ fade; decorative hero washes.
- Reduced-motion respected broadly.
- **Gap vs premium:** Missing intentional presence motions (2–3 choreographed entrances / restrained hero motion). Feels polished-static.

### 11. Conversion Presentation — Strong

- Language consistent (“Book Appointment” + phone secondary).
- Home conversion ladder (hero → welcome → HotDoc chapter → book band → dock) is mature.
- **Gap:** Long service/profile pages rely on dock + end band; mid-journey CTAs rare except new-patients pattern.

### 12. Brand Maturity — Good / not yet distinctive enough

- Tokens (`--navy #163f62`, teal accents, warm/mist grounds), Healthcare Doctors lockup, continuity slogan.
- Photography intent documented (Brisbane daylight, factual editorial).
- **Gap:** Inter + Libre Baskerville + warm cream is a common “premium template” stack; home feels more brand-led than inner hubs (utilitarian essay+sidebar). CSS layering with many `!important` blocks signals maturity debt.

---

## Issues by priority

### Critical

| ID | Issue | Why critical | Area |
| --- | --- | --- | --- |
| — | *None opened for visual/UX alone* | Technical go-live blockers remain under 3H (HotDoc live verify, manifest sync). Visual system is shippable pending those. | — |

### High Priority Improvements

| ID | Issue | Area | Outcome if fixed |
| --- | --- | --- | --- |
| H1 | Find Information (`patient-tasks`) hidden on desktop (≥768px) | Homepage / Navigation | Task discovery matches Patient Info hub strength sitewide |
| H2 | Mobile CTA competition: header pills + full-width dock + DR | Mobile / Conversion | Quieter primary path; less cognitive load |
| H3 | Long service & practitioner pages lack mid-page Book band | Services / Profiles / Conversion | Shorter time-to-booking without cutting authority content |
| H4 | Motion under-developed vs premium AU healthcare | Motion / Brand | Brand presence without noise |

### Medium Improvements

| ID | Issue | Area |
| --- | --- | --- |
| M1 | HotDoc education (poster/QR) mostly home-only | Booking / Conversion |
| M2 | Clinical-review strip never visible in UAT (empty governance publish) | Trust / Brand / Accessibility |
| M3 | Homepage team carousel early may feel directory-like | Homepage / Hierarchy |
| M4 | Inter + warm cream typography defaults | Brand |
| M5 | Desktop service / PI side nav density | Services / Patient Information |
| M6 | Peer practitioner discovery weak on profile aside | Practitioner Profiles |

### Low Improvements

| ID | Issue | Area |
| --- | --- | --- |
| L1 | CTA count on homepage is high (~7 Books + dock) | Homepage / Conversion |
| L2 | Knowledge trust pills unused without approved governance | Health Advice |
| L3 | CSS `!important` / completion-layer debt | Consistency |
| L4 | Portrait hover scale is the dominant “motion language” | Motion |

### Quick Wins (≤1–2 days each)

1. **Show Find Information on desktop** — promote `patient-tasks` into a compact header strip or under primary nav (do not only hide ≥768px).  
2. **Clone new-patients critical band** — add a slim mid-page Book/Call band after “Next steps” on top 5 service pages.  
3. **Quiet mobile dock** — keep Book primary; demote Call/DR to icon-only on ≤700px.  
4. **One presence motion** — subtle hero fade/rise on load (respect `prefers-reduced-motion`).  
5. **Profile peer link** — “Other practitioners in this care area” block using existing related graph.  
6. **HotDoc how-to microcopy** — one sentence under Book on profiles: “Opens secure HotDoc booking for this practitioner.”

---

## Prioritised roadmap (next visual/UX stage)

### Stage A — Clarity & conversion (1–2 weeks)

1. Desktop Find Information (H1)  
2. Mid-page conversion bands on priority services + profiles (H3)  
3. Mobile dock simplification (H2)  
4. Quick-win HotDoc microcopy + peer practitioner block  

**Exit criteria:** Task discovery on desktop; Book reachable without scrolling to page end on Women’s Health / Family Health / Skin Checks / Tanya profile.

### Stage B — Brand presence (2–3 weeks)

1. Motion system: 2–3 intentional motions (hero, section reveal, dock settle) (H4)  
2. Typography refinement pass (display/body pairing review — keep Baskerville hero, consider less generic UI sans) (M4)  
3. Optional home section order experiment: philosophy snippet before full team carousel (M3) — A/B or stakeholder review only  

**Exit criteria:** Visual ≥ 85, Brand ≥ 82; reduced-motion still green.

### Stage C — Trust & consistency (ongoing with clinical ops)

1. Publish approved clinical-review stamps (M2) when 3G approvals exist  
2. Extend HotDoc education pattern beyond home (M1)  
3. CSS consolidation of completion layers (L3)  

**Exit criteria:** Visible clinical currency on eligible pages; Overall ≥ 88.

---

## Assessment notes

- Oct 2026 Visual QA closed the largest mobile inconsistency class (content-before-nav, DR/dock collision, overflow). This 3I audit assumes those fixes remain in UAT.  
- Conversion tooling from 3A–3F is backend maturity; this audit scores **patient-facing presentation**, not dashboard ops.  
- Hawthorne Clinic is utility-first and quieter; WMC should not copy that simplicity wholesale — the opportunity is **premium calm**, not brochure reduction.

---

## Document control

| Artefact | Path |
| --- | --- |
| Narrative audit | `old-html/qa/VISUAL_UX_BRAND_MATURITY_AUDIT_3I.md` |
| Machine scorecard | `old-html/qa/VISUAL_UX_BRAND_MATURITY_SCORECARD_3I.json` |
| Related platform readiness | `old-html/qa/PLATFORM_READINESS_AUDIT_3H.md` |
| Prior visual QA | `old-html/qa/VISUAL_QA_UI_CONSISTENCY_AUDIT_2026-10-08.md` |
