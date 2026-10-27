# Prompt 4G — Brand polish improvement plan (76 → 90+)

**Assessed:** 2026-10-26 (Australia/Brisbane)  
**Environment:** UAT `http://127.0.0.1:3100` (post 4C–4F)  
**Baseline:** Prompt 3I Brand Maturity **76**  
**Companion scorecard:** `old-html/qa/BRAND_MATURITY_SCORECARD_4G.json`

---

## Verdict

Brand is a **strong institutional GP** after authority, conversion, motion, and hub work — still short of **premium Australian healthcare** calm. Content and trust *facts* are ahead of trust *presentation* and type/spacing discipline. Closing the gap is polish and publish, not a redesign.

| Score | 3I | 4G now | Target after plan |
| --- | ---: | ---: | ---: |
| Brand maturity | 76 | **79** | **90+** |
| Visual maturity | 78 | **82** | **88** |
| UX maturity | 82 | **86** | **88** |
| Conversion maturity | 84 | **88** | **90** |
| Overall (same weights) | 80 | **84** | **89–91** |

**Why Brand only +3 since 3I:** 4C–4F lifted conversion, motion, hubs, and peers. Brand score is still capped by Inter + warm-cream defaults, invisible clinical governance, footer-only trust marks on most journeys, and ~5k `!important` CSS layers.

---

## 1. Trust presentation audit

### What already works

| Signal | Where | Quality |
| --- | --- | --- |
| AGPAL + bulk billing + Open 7 days | Home hero overlays | Concrete, dated (AGPAL through Mar 2029) |
| ACSQHC register line | Home story/community | Independent verification language |
| Footer AGPAL + bulk-billing marks | **208/208** HTML pages | Universal but easy to miss |
| Dedicated AGPAL page | `/agpal-accreditation.html` | Premium-grade plain language; register check date 7 Oct 2026 |
| Healthcare Doctors lockup + slogan | Header / home H1 | Distinctive identity |

### Gaps vs premium AU peers

1. **Trust is front-loaded on home, then demoted to footer** on services, knowledge, and many PI pages. Premium clinics repeat a slim accreditation/bulk-billing line near the first Book CTA.
2. **Mobile first viewport** often shows hero + Book before AGPAL chips scroll into view — trust is “below the fold” on small screens.
3. **No visible clinical currency** — see governance below.
4. **Experience indicators** (years, continuity, open 7 days, local suburb list) exist in copy but are not systematised as a quiet “practice facts” pattern.

---

## 2. Domain reviews

### Accreditation

| Strength | Gap |
| --- | --- |
| Authoritative AGPAL page; hero mark; national register links | Inner pages rarely surface “Accredited general practice” near booking |
| Footer marks on every page | Marks are small, duplicated inconsistently in CSS (`!important` size overrides) |
| Home chips are specific and linkable | Chip treatment is home-only; not a reusable trust strip component |

**Polish:** Extract a single `.trust-strip` (AGPAL · Bulk billing · Open 7 days) for service hubs, new-patients, team, and book-appointment — same assets, same copy rules.

### Practitioner trust signals

| Strength | Gap |
| --- | --- |
| Photos, FRACGP/MBBS lines, care highlights | Qualification formatting inconsistent (`FRACGP` vs `MBBS, FRACGP` vs `M.B.B.CH`) |
| Published interests + peer band (4E) | Aside still “Patient Information” ops list — peers not in primary chrome |
| Scoped HotDoc + reception-only notes | No AHPRA registration number (optional; only if practice policy allows) |
| Authority-related practitioners on services | Experience years / languages not standardised on profiles |

**Polish:** One qualification line pattern; “Published areas of care” caption already present — extend languages/experience only from verified profile fields; keep no unverified claims.

### Experience indicators

| Present | Missing as a system |
| --- | --- |
| Continuity narrative, suburb list, open 7 days | Shared “practice facts” module (hours · accreditation · bulk billing · location) |
| Multidisciplinary team story | Visual hierarchy still essay-heavy vs fact-first |

### Governance indicators

| Finding | Detail |
| --- | --- |
| Hooks exist | `data-governance-page` on **111** pages; `.clinical-review-strip` CSS ready |
| Publish payload empty | `governance-published.js` → `WMC_APPROVED_GOVERNANCE = {}` |
| Reviews empty | **0 / 111** `data-governance-review` values populated |
| Patient impact | Clinical-review strip never appears; knowledge trust pills unused |

**This is the single largest Brand 90+ unlock that is ops-gated, not design-gated.**

---

## 3. Visual inconsistencies (inventory)

| ID | Inconsistency | Impact |
| --- | --- | --- |
| V1 | Home navy cinematic hero vs inner warm/mint essay heroes | Brand feels split: brochure home / utility inside |
| V2 | Eyebrow colour/size redefined ≥4 times (`#72828d`, `#647784`, `#5f707c`, `!important` 12px) | Meta hierarchy wobbles |
| V3 | Button system: `.button` / `.button-light` / `.button-secondary` / mobile pills | Secondary CTA styling drifts |
| V4 | Card radius: 12 / 16 / 26 / pill — no shared scale | Surfaces feel ad hoc |
| V5 | Footer trust image sizes overridden repeatedly | Marks look soft or cropped |
| V6 | Service hub pathway cards (4F) vs knowledge category cards | Two “premium card” dialects |
| V7 | CSS debt: **~4,984** `!important` declarations | Polish changes fight the cascade |
| V8 | Mobile chrome: Menu + dock Book/Call/DR still dense | Premium peers keep one dominant CTA |

---

## 4. Typography hierarchy (refined spec)

**Keep** Libre Baskerville for display/H1–H2 (brand voice).  
**Evolve** Inter as UI/body only; avoid Inter for H3 where Baskerville already owns authority.

### Target scale (tokens scaffolded in `:root` as 4G)

| Role | Token | Spec |
| --- | --- | --- |
| Display (home H1) | `--fs-display` | clamp(48px, 5.1vw, 82px) / lh 0.98 |
| Page H1 | `--fs-h1` | clamp(40px, 4vw, 60px) / lh 1.08 |
| Section H2 | `--fs-h2` | clamp(28px, 3.2vw, 34px) / lh 1.2 |
| UI H3 / labels | `--fs-h3` | 15px Inter 600 (not Baskerville) |
| Lede | `--fs-lede` | 17.5px / lh 1.85 |
| Body | `--fs-body` | 16px / lh 1.7 (tighten from 1.9–2.0 essay default) |
| Eyebrow | `--fs-eyebrow` | 12px / tracking 0.14em / weight 600 |

### Implementation order

1. Point `.eyebrow`, `.page-hero h1`, `.page-hero .lede`, `.article h2` at tokens (remove competing `!important` sizes for those selectors).  
2. Cap article body line-height at 1.7; keep philosophy/story at 1.85 max.  
3. Optional Stage P2: replace Inter with a less template-generic UI sans (e.g. Source Sans 3 / IBM Plex Sans) — **stakeholder review**; Baskerville stays.

---

## 5. Spacing & component consistency (refined spec)

### Spacing scale

`--space-1`…`--space-9` = 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96px.

| Surface | Vertical rhythm |
| --- | --- |
| Page hero | padding-block `--space-8` / `--space-7` mobile |
| Section gaps | `--space-8` desktop, `--space-7` tablet |
| Card internal | `--space-5` |
| Chip/trust strip | gap `--space-3` |

### Component contracts

| Component | Rule |
| --- | --- |
| Primary button | Navy pill, min-height 54px, `--radius-pill` |
| Secondary | Outline / `button-secondary` only — retire ad-hoc ghosts |
| Trust strip | White chips, `--trust-chip-border`, AGPAL mark 56×56 |
| Cards | `--radius-md` (16); hub pathway cards align to knowledge cards |
| Conversion band | One mid-page pattern (4C) — no third CTA dialect |

---

## 6. Brand-polish roadmap (76 → 90+)

### Stage P0 — Trust visibility (3–5 days) → Brand ~84

1. Reusable `.trust-strip` on Family Health, Women’s Health, Skin Checks, New Patients, Team, Book Appointment.  
2. Mobile: ensure AGPAL/bulk-billing appear in first scroll-screen on home (chip row above or beside hours card).  
3. Unify footer trust mark sizes to one rule.  
4. Standardise practitioner qualification line + published-care caption.

### Stage P1 — Type & spacing migration (1–2 weeks) → Brand ~87–88

1. Migrate heroes, eyebrows, ledes, article H2 to 4G tokens.  
2. Apply spacing scale to page-hero, article-section, conversion-band, service-hub-pathways.  
3. Unify button-secondary + card radius.  
4. Quiet remaining mobile CTA competition (Book primary; Call/DR icon).

### Stage P2 — Governance publish + calm surfaces (ops + 1 week design) → Brand **90+**

1. Approve and publish clinical-review records into `governance-published.js` for priority knowledge + hub pages.  
2. Reveal `.clinical-review-strip` + knowledge trust pills with real dates.  
3. Optional UI sans evaluation; keep Baskerville.  
4. Begin retiring high-traffic `!important` layers for type/space only (do not big-bang rewrite).

### Stage P3 — Distinctiveness (optional, after 90)

1. Photography/art direction pass so inner hubs share home’s sense of place.  
2. Home section-order experiment (philosophy before full team carousel) — stakeholder only.  
3. HotDoc education micro-pattern beyond home.

---

## Score model (how 90+ is earned)

| Lever | Est. Brand points | Depends on |
| --- | ---: | --- |
| Trust strip reuse + mobile trust in first screen | +3 | Design/CSS |
| Type + spacing token migration | +3 | Design/CSS |
| Button/card/footer consistency | +2 | Design/CSS |
| Visible clinical governance on key pages | +4 | Clinical ops publish |
| Quieter mobile chrome | +1 | CSS |
| Optional UI sans / photo continuity | +1–2 | Stakeholder |

**Floor without governance publish:** ~87–88.  
**90+ requires** at least a first wave of approved clinical-review stamps.

---

## Guardrails (do not)

- Do not invent accreditation dates, AHPRA numbers, or review dates.  
- Do not add testimonials or star ratings.  
- Do not claim “best doctor” or unverified experience years.  
- Do not rebuild homepage architecture or replace Healthcare Doctors lockup.  
- Do not introduce bounce/pulse motion (4D still applies).

---

## Artefacts

| File | Role |
| --- | --- |
| `apps/web/reports/BRAND_POLISH_4G.md` | This plan |
| `old-html/qa/BRAND_MATURITY_SCORECARD_4G.json` | Machine scorecard |
| `old-html/styles.css` `:root` 4G tokens | Type/space scaffold |
| Prior | `VISUAL_UX_BRAND_MATURITY_AUDIT_3I.md`, `SERVICE_HUB_4F.md`, `PRACTITIONER_AUTHORITY_4E.md`, `MOTION_DESIGN_4D.md` |

---

## Recommended next prompt

**4H — Execute Stage P0 + P1** (trust strip, token migration, component contracts) while clinical ops prepares governance publish for P2.
