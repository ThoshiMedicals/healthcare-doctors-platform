# Phase 2 — Agent A: Practitioner Authority & Asset Audit

**Clinic:** Woolloongabba Medical Centre (`woolloongabba` / `woolloongabba-medical-centre`)  
**Worktree:** `WMC-p2-agent-a` @ `phase2/agent-a-authority` (baseline `6f1b0b2`)  
**Assessed:** 2026-11-11  
**Scope:** All **15 published** practitioner profiles (`PUBLISHED_PRACTITIONER_ROUTES`); golden HTML where present + CMS published import profiles for Golnar, James, Yamesha.

**Evidence (read-only):** `apps/web/.tmp-phase1-golden-doctors.json`, `apps/web/.tmp-phase2-agent-a.json`, `old-html/assets/team/MANIFEST.json`, onboard scripts, Phase 1 gap report. Local Prisma CMS export was **not** available in this worktree (no `.env` / `node_modules`).

**Inventory rule:** 12 golden `old-html/doctors/*.html` + 3 CMS-native profiles = **15 published**. Dr Gemunu (`on_hold`) excluded.

---

## A. Practitioner completeness matrix (15)

Legend: **Cat.** = professional category · **Cred.** = college/specialist credential · **Photo** = patient-facing portrait linkage · **Def.** = owner-approved deferred portrait (not a launch auto-fail).

| # | Practitioner | Slug | Cat. | Cred. | Qualifications (published) | Languages (as published) | Bio | Clinical interests / areas | Trust / experience (factual in copy) | Photo old-html | Photo public | Person schema | Readiness (/10) |
|---|--------------|------|------|-------|---------------------------|--------------------------|-----|---------------------------|--------------------------------------|----------------|--------------|---------------|-----------------|
| 1 | Dr Anand Singh | `dr-anand-singh` | GP | FRACGP | MBBS, FRACGP (+ postgrad dip. noted in bio) | EN, Hindi | OK (~322 chars golden) | Child/women’s/derm/geriatric; 6 service links | Experienced GP; postgrad health/hospital + maternal & child study | Yes | Yes | Yes | **9** |
| 2 | Dr Debra Larkins | `dr-debra-larkins` | GP | FRACGP | MBBS, FRACGP | EN | OK | Shared antenatal care; broad GP | UK training; MBBS 1993; in Australia since 2013 | Yes | Yes | Yes | **9** |
| 3 | Dr Golnar Mortezaei | `dr-golnar-mortezaei` | GP | FRACGP | MD, FRACGP | EN, Persian | Strong (CMS) | Veterans’, CDM, diabetes, heart, COPD, OA | **25+ years** (CMS onboarding) | N/A (CMS) | Yes | Yes (CMS render) | **9** |
| 4 | Dr James Chanaka | `dr-james` | GP | FRACGP | Bachelor of Medicine (U Zimbabwe), FRACGP | EN, Shona | Strong (CMS) | Children’s, mental health, family medicine | Experienced GP; culturally sensitive care (CMS) | N/A (CMS) | Yes | Yes (CMS render) | **9** |
| 5 | Dr Kooshyar Karimi | `dr-kooshyar-karimi` | GP | FRACGP | MD, FRACGP | AR, EN, Persian, Turkish | OK | Emergency/internal/cosmetic procedural | In Australia since 2002 | Yes | Yes | Yes | **9** |
| 6 | Dr Mary Abadir | `dr-mary-abadir` | Specialist (O&G) | FRANZCOG, MRCOG | M.B.B.Ch, MRCOG, FRANZCOG | **Gap:** honest empty copy in golden | OK | Rich O&G interest list (pregnancy, endo, PCOS, etc.) | MRCOG since 2002; FRANZCOG since 2017 | Yes | Yes | Yes | **8** |
| 7 | Dr Nirupa Sivathasan | `dr-nirupa-sivathasan` | GP | FRACGP, MRCGP | MBBS, FRACGP, MRCGP | **Gap:** none in golden | OK | General practice / primary care only; **no listed professional interests section** | British-qualified; London experience; in Australia from 2016 | No | No | **Def.** | No | Yes | **7** |
| 8 | Dr Sambo Luon | `dr-sambo-luon` | GP | FRACGP | MBBS, FRACGP | EN, Khmer, Mandarin | OK | Preventive medicine | Monash 2010; hospital/ED background in bio | Yes | Yes | Yes | **9** |
| 9 | Dr Steven Chang | `dr-steven-chang` | Allied (chiro) | Chiropractic degrees (not FRACGP) | B.Hlth Sci (Chiro), M.Clin Chiro | EN, Mandarin, Taiwanese | OK | Chiropractic techniques (manual, activator, dry needling, etc.) | Taipei origin; full chiro training in bio | Yes | Yes | Yes | **8** |
| 10 | Dr Sumita Singh | `dr-sumita-singh` | GP | FRACGP | MBBS, FRACGP | EN, Hindi | OK | Women’s + mental health | GP in Australia since 2014 | Yes | Yes | Yes | **9** |
| 11 | Dr Tanya Goodwill | `dr-tanya-goodwill` | GP | FRACGP | MBBS, FRACGP | EN | Strong | Broad GP interests (12 knowsAbout; 10 interests) | **20+ years**; paeds background noted | Yes | Yes | Yes | **10** |
| 12 | Dr Usman Gul | `dr-usman-gul` | GP | FRACGP | MBBS, FRACGP | EN, Urdu | OK (shorter) | Men’s health | Listed as GP with MBBS/FRACGP | Yes | Yes | Yes | **8** |
| 13 | Dr Wasantha Hettiarchchi | `dr-wasantha-hettiarchchi` | GP | FRACGP | MBBS, FRACGP | EN, Sinhala | OK | Diabetes, men’s, occupational, pregnancy, travel, skin, women’s | Colombo 1982 graduate; long GP experience | Yes | Yes | Yes | **9** |
| 14 | Dr Yamesha Ranatunga | `dr-yamesha-ranatunga` | GP | FRACGP | MBBS (UQ 2017), FRACGP (2024), BSc Nutrition (UBC 2013) | EN | Strong (CMS/HotDoc source) | Women’s, adolescent/youth, CDM, general practice | QLD hospital/GP settings (CMS bio) | No | No | **Def.** | No | Yes (CMS render) | **8** |
| 15 | Mr Samuel Stafford | `mr-samuel-stafford` | Allied (physio) | N/A (no AHPRA college listed) | **Gap:** honest “none listed” in golden | **Gap:** none in golden | **Thin** (~182 chars) | Physiotherapy only; **no professional interests list** | No years/quals in verified public copy | No | Unverified† | **Def.** | Yes | Yes | **6** |

† **Samuel asset note:** `apps/web/public/assets/team/mr-samuel-stafford*.webp` exist, but `old-html/assets/team/MANIFEST.json` still lists **Mr Samuel Stafford** under `pending_no_public_verified_photo`, and golden HTML has **no** hero portrait. Runtime `public-ux.ts` can inject the portrait on render — governance treats portrait as **deferred**, not owner-verified for cutover.

**Cross-cutting CMS vs golden:** For the 12 golden imports, CMS `publishedPayload` is often empty; **public HTML authority follows golden + runtime enrichment**, except the three CMS-built profiles (full payload in onboard scripts).

**Booking policy (authority/trust, not invented):** Mary = **PHONE_ONLY** at runtime; Golnar = owner-authorised HotDoc fallback when CMS URL null; Tanya/Sumita/Usman insurance HotDoc slugs preserved in golden.

---

## B. Missing asset register

| Asset | Practitioner | old-html/assets/team | apps/web/public/assets/team | Golden HTML references | Status |
|-------|--------------|---------------------|----------------------------|------------------------|--------|
| Portrait `.webp` + responsive | Dr Nirupa Sivathasan | Missing | Missing | No hero image | **Deferred (approved post-cutover)** |
| Portrait `.webp` + responsive | Dr Yamesha Ranatunga | Missing | Missing | CMS profile (no `portraitFile` in onboard) | **Deferred (approved post-cutover)** |
| Portrait (verified) | Mr Samuel Stafford | Missing | Files present but **not in MANIFEST** | No hero; no-photo / single-column hero | **Deferred** — do not treat public files as launch-approved without owner sign-off |
| Portrait sync | Dr Golnar Mortezaei | Missing | Present | CMS only | **OK for CMS path** — copy to golden tree not required for Phase 2 |
| Portrait sync | Dr James Chanaka | Missing | Present | CMS only | **OK for CMS path** |
| MANIFEST alignment | 11 named GPs | 11 owner-supplied | 11 + Golnar/James + Samuel variants | — | Nirupa + Samuel remain in `pending_no_public_verified_photo` |

**Non-blockers explicitly recorded:** Deferred portraits for **Nirupa, Yamesha, Samuel** per operator direction.

---

## C. Information requiring practitioner confirmation

| Practitioner | Topic | Current state | Action |
|--------------|-------|---------------|--------|
| **Dr Mary Abadir** | Languages | Golden uses honest empty-state copy | **Owner-approved:** English, Russian — confirm practitioner wishes public listing |
| **Dr Nirupa Sivathasan** | Languages | Not listed in golden/schema visible copy | **Owner-approved:** English — confirm; do not add other languages without source |
| **Mr Samuel Stafford** | Languages | Not listed | **Owner-approved:** English — confirm |
| **Mr Samuel Stafford** | Qualifications & registrations | Explicitly absent in golden | Confirm degree, AHPRA registration title, affiliations for public display |
| **Mr Samuel Stafford** | Clinical interests / scope | Only “Physiotherapy” chip | Confirm subspecialties (sports, MSK, etc.) if any — **do not invent** |
| **Mr Samuel Stafford** | Portrait | Public webp files vs MANIFEST pending | Confirm whether existing `mr-samuel-stafford.webp` is authentic and approved, or await new photography |
| **Dr Nirupa Sivathasan** | Professional interests | Empty interests section | Confirm whether additional interests beyond GP/primary care may be published |
| **Dr Yamesha Ranatunga** | Portrait | HotDoc placeholder only at onboard | Await owner-supplied photography (already deferred) |
| **Dr Golnar Mortezaei** | Portrait identity | Sourced from WP import in onboard script | Routine owner identity check per `INSTITUTIONAL-CATEGORY.json` policy |
| **Allied / specialist naming** | Dr Steven Chang | Titled “Dr” on site (chiropractor) | Confirm preferred public title if practitioner cares (no content change without ask) |

---

## D. Proposed practitioner-authority enhancements (factual only)

1. **Owner-approved language fills (pre-approved for implementation when Phase 2 edits are authorised):**
   - Mary: English, Russian — replace honest empty-state language line in credentials/schema where enrichment runs.
   - Nirupa: English — same pattern (no additional languages).
   - Samuel: English — same pattern.

2. **Nirupa — maintain credential strength, narrow interest honesty:** Keep MBBS, FRACGP, MRCGP and London→Australia narrative; only expand `professional-interests` after practitioner confirmation (Section C).

3. **Samuel — authority without invention:** After confirmation, add qualifications and AHPRA-appropriate title lines mirroring Steven Chang’s allied template depth; keep biography factual; **do not** add portrait until owner-approved asset replaces deferred state (even if runtime inject exists).

4. **Yamesha — already strong CMS authority:** Preserve HotDoc-sourced quals (MBBS UQ 2017, FRACGP 2024, BSc Nutrition); maintain women’s / adolescent / CDM areas; portrait remains post-cutover.

5. **Mary — specialist authority:** Keep FRANZCOG/MRCOG and rich O&G interest taxonomy; align language display with approved EN/RU; preserve **phone-only** booking presentation vs golden HotDoc embed.

6. **Golden GP CMS payload (optional Phase 2B):** Backfill empty `publishedPayload` for directory cards from golden JSON (Phase 1 finding) — does not change public facts, improves admin/discovery parity.

7. **Asset governance:** When portraits arrive for Nirupa/Yamesha/Samuel, update `MANIFEST.json` + responsive variants together; remove `pending_no_public_verified_photo` only after owner identity check.

---

## E. Readiness score (/10) with rationale

Deferred photos **do not** reduce scores below the bands below (visual parity noted separately).

| Practitioner | Score | Rationale |
|--------------|------:|-----------|
| Dr Tanya Goodwill | 10 | Full quals, languages, interests, bio depth, photo, schema, rich pathways |
| Dr Anand Singh | 9 | Strong authority; insurance notice present |
| Dr Debra Larkins | 9 | Solid GP + antenatal positioning |
| Dr Golnar Mortezaei | 9 | Richest CMS bio; veterans/CDM; photo via CMS asset |
| Dr James Chanaka | 9 | Strong CMS bio; children’s/mental health clear |
| Dr Kooshyar Karimi | 9 | Multi-language; broad procedural interests |
| Dr Sambo Luon | 9 | Complete minus insurance notice (not required) |
| Dr Sumita Singh | 9 | Clear women’s/mental positioning |
| Dr Wasantha Hettiarchchi | 9 | Broad interests + experience year in bio |
| Dr Yamesha Ranatunga | 8 | Excellent CMS content; deferred photo only gap |
| Dr Mary Abadir | 8 | Specialist gold standard content; language line + booking UX nuance |
| Dr Steven Chang | 8 | Good allied depth; not FRACGP (correct) |
| Dr Usman Gul | 8 | Slightly thinner bio; men’s health clear |
| Dr Nirupa Sivathasan | 7 | Good quals/bio; thin interests; language gap (fixable); deferred photo |
| Mr Samuel Stafford | 6 | Thin bio, no quals, minimal interests; deferred/unverified photo governance |

**Cohort mean (simple):** 8.5/10. **Weakest authority surface:** allied physio (Samuel) and thin-interest GP (Nirupa). **Strongest:** Tanya, CMS newcomers (Golnar/James/Yamesha content), Mary (specialist).

---

## Special attention summary (Nirupa, Yamesha, Samuel, Mary)

| Name | Photo | Languages | Credentials | Interests | Priority |
|------|-------|-----------|-------------|-----------|----------|
| **Nirupa** | Deferred — no files either tree | Apply **English** (owner) | FRACGP + MRCGP strong | Only GP/primary — confirm expansion | Language fill + post-cutover photo |
| **Yamesha** | Deferred — CMS `portraitFile: null` | English in CMS | MBBS/FRACGP/BSc strong | Women’s, adolescent, CDM well documented | Photo post-cutover only |
| **Samuel** | Deferred; public files unverified | Apply **English** (owner) | Missing — **must confirm** | Physiotherapy only | Quals + bio depth before authority parity with Steven |
| **Mary** | Approved local photo both trees | Apply **EN + RU** (owner) | FRANZCOG/MRCOG | Rich O&G list | Language enrichment; keep phone-first booking |

---

## Audit method notes

- Golden parse: `node apps/web/scripts/phase1-audit-practitioners.mjs` (repo root).
- CMS DB: unavailable in worktree; CMS facts for Golnar/James/Yamesha taken from `onboard-*.mjs` and staging parity docs.
- Photo checks: filesystem existence per slug (`old-html` vs `public`) documented in `apps/web/.tmp-phase2-agent-a.json`.

**Report path:** `C:\Users\RoshanSamarawickrema\Desktop\WMC-p2-agent-a\docs\phase2\AGENT-A-AUTHORITY-AUDIT.md`
