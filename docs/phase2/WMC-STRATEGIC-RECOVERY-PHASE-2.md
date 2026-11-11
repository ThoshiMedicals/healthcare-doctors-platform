# WMC Strategic Recovery — Phase 2 (Lead Integration)

**Verdict:** **PHASE 2 READY FOR REVIEW — LOCAL ONLY**  
**Date:** 2026-11-11  
**Integration worktree:** `WMC-p0-doctor-profiles-incident`  
**Integration branch:** `incident/p0-doctor-profiles-restore`

---

## K. Worktrees, branches, SHAs

| Role | Path | Branch | Tip / baseline |
| --- | --- | --- | --- |
| Frozen corrective release | (ancestor) | — | `c2a557197cefda91f5d33da93722d4648de757ab` |
| Phase 1 accepted baseline | same repo | `phase2/integrated-baseline` | `6f1b0b28513e0be2c5d74392e94182f0aa49b05c` |
| Agent A | `Desktop/WMC-p2-agent-a` | `phase2/agent-a-authority` | `6f1b0b2` (audit-only) |
| Agent B | `Desktop/WMC-p2-agent-b` | `phase2/agent-b-booking` | `6f1b0b2` (audit-only) |
| Agent C | `Desktop/WMC-p2-agent-c` | `phase2/agent-c-cms` | `6f1b0b2` (audit-only) |
| Lead integration | `Desktop/WMC-p0-doctor-profiles-incident` | `incident/p0-doctor-profiles-restore` | Phase 2 commit on tip (see git log) |

**Specialist reports:**  
- `docs/phase2/AGENT-A-AUTHORITY-AUDIT.md`  
- `docs/phase2/AGENT-B-BOOKING-SCHEMA-AUDIT.md`  
- `docs/phase2/AGENT-C-CMS-SERVICE-AUDIT.md`

**Not performed:** GitHub push, Hostinger staging/production deploy, DNS, DB writes.

---

## A. Complete 15-practitioner authority matrix (definitive)

Scores adjust Agent A after **owner-approved language fills** (Mary / Nirupa / Samuel). Deferred portraits are **not** launch auto-fails.

| # | Practitioner | Category | Credential | Languages (public after Phase 2) | Photo | Booking | Readiness /10 |
| ---: | --- | --- | --- | --- | --- | --- | ---: |
| 1 | Dr Anand Singh | GP | FRACGP | English, Hindi | OK | ONLINE + insurance | 9 |
| 2 | Dr Debra Larkins | GP | FRACGP | English | OK | ONLINE + insurance | 9 |
| 3 | Dr Golnar Mortezaei | GP | FRACGP | English, Persian | OK (CMS) | ONLINE (HotDoc fallback) | 9 |
| 4 | Dr James Chanaka | GP | FRACGP | English, Shona | OK (CMS) | ONLINE | 9 |
| 5 | Dr Kooshyar Karimi | GP | FRACGP | Arabic, English, Persian, Turkish | OK | ONLINE | 9 |
| 6 | Dr Mary Abadir | Specialist O&G | FRANZCOG, MRCOG | **English, Russian** (owner fill) | OK | **PHONE_ONLY** | **9** |
| 7 | Dr Nirupa Sivathasan | GP | FRACGP, MRCGP | **English** (owner fill) | Deferred | ONLINE | **8** |
| 8 | Dr Sambo Luon | GP | FRACGP | English, Khmer, Mandarin | OK | ONLINE + insurance | 9 |
| 9 | Dr Steven Chang | Allied (chiro) | Chiro degrees | English, Mandarin, Taiwanese | OK | ONLINE | 8 |
| 10 | Dr Sumita Singh | GP | FRACGP | English, Hindi | OK | ONLINE + insurance | 9 |
| 11 | Dr Tanya Goodwill | GP | FRACGP | English | OK | ONLINE + insurance | 10 |
| 12 | Dr Usman Gul | GP | FRACGP | English, Urdu | OK | ONLINE (male-only path) | 8 |
| 13 | Dr Wasantha Hettiarchchi | GP | FRACGP | English, Sinhala | OK | ONLINE | 9 |
| 14 | Dr Yamesha Ranatunga | GP | FRACGP | English | Deferred | ONLINE | 8 |
| 15 | Mr Samuel Stafford | Allied (physio) | Not listed | **English** (owner fill) | Deferred / unverified | ONLINE | **7** |

**Cohort mean after Phase 2 fills:** ~8.7/10. HOLD Gemunu excluded.

---

## B. Missing photo / asset inventory

| Practitioner | Status |
| --- | --- |
| Dr Nirupa Sivathasan | Approved **deferred** post-cutover (no files) |
| Dr Yamesha Ranatunga | Approved **deferred** post-cutover |
| Mr Samuel Stafford | Approved **deferred**; public webp exist but MANIFEST pending — do not treat as launch-approved |
| Others | Present (golden and/or CMS public assets) |

---

## C. Missing qualifications and language information

| Item | Status |
| --- | --- |
| Mary / Nirupa / Samuel languages | **Implemented** at render (`practitioner-authority-languages.ts`) |
| Samuel qualifications | **Outstanding** — practitioner confirmation required (not invented) |
| Nirupa professional interests expansion | Outstanding — confirmation only |
| Mary / Nirupa / Samuel golden HTML source placeholders | Still in golden; runtime corrects (golden master not rewritten) |

---

## D. CMS backfill plan

See Agent C §A. Summary:

- **11** published rows with empty/weak `publishedPayload` (10 golden-master GPs + Tanya column/payload mismatch).
- Complete today: Debra + Golnar + James + Yamesha.
- Backfill from golden Person schema / HTML only; keep `source: golden-master`; **no DB writes in Phase 2**.
- Import-only service inject means golden payload backfill does **not** by itself change service rails.

---

## E. Booking consistency audit

Agent B + Lead confirmation:

| Named policy | Result |
| --- | --- |
| Golnar ONLINE | Pass (fallback HotDoc) |
| Mary PHONE_ONLY | Pass — golden has **zero** HotDoc; runtime phone chrome |
| Tanya / James / Yamesha ONLINE | Pass |
| Usman male-only | Untouched |
| Insurance notices | Preserved |

No booking policy changes implemented.

---

## F. Schema and internal-link assessment

- Person `url` / canonical: `/doctors/*.html` on golden.
- WP `sameAs` `/doctor/…` → rewritten at render (`enrichPractitionerPersonSchema`).
- `areaServed` backfilled at render.
- Mary/Nirupa/Samuel: `knowsLanguage` + FAQ answers filled at render from owner list.
- Legacy WP redirects: inventory tests pass; Gemunu → directory only.

---

## G. Service → Practitioner relationship matrix

Phase 1 map (**17 rules**) intact. Runtime CMS inject (import-only) covers:

| Service | Approved CMS inject additions |
| --- | --- |
| Children’s Health | James, Yamesha (adolescent map) |
| Chronic Disease Care | Golnar, Yamesha |
| Family Health | James, Yamesha |
| Mental Health | James |
| Women’s Health | Yamesha |

Support dead ends (pathology/pharmacy/radiology/allied) remain mitigated by Phase 1 next-step links.  
**Veterans’ health:** Golnar interest with **no** service destination — Phase 3 / content approval.

---

## H. Readiness scores

See matrix §A (post language-fill adjustments).

---

## I. Implemented local improvements (Phase 2)

1. `apps/web/src/documents/practitioner-authority-languages.ts` (+ tests)  
2. Wired into `applyAuthoritySeoRefinements`  
3. Test wiring in `package.json`  
4. Specialist audit docs under `docs/phase2/`

**Preserved Phase 1:** CARE_AREA_SERVICE_MAP extensions, knowledge rails, support next steps, trust links, inject behaviour, HOLD.

---

## J. Outstanding content / clinical approvals

1. Samuel qualifications + deeper bio (practitioner confirm)  
2. Nirupa interest expansion (optional confirm)  
3. Deferred portraits post-cutover (Nirupa, Yamesha, Samuel)  
4. CMS golden payload backfill (ops/DB write approval later)  
5. Veterans’ Health destination decision  
6. Tanya CMS column vs payload reconciliation  

---

## L. Combined test / build results

**Regression pack (51 tests):** PASS — language fills, Phase 1 map/rails, CMS service inject, published routes, booking matrix, phone-only, WP redirects.

**Full `npm run build`:** PASS (Next.js 15.5.28 compiled; pre-existing admin lint warnings only). Standalone symlink EPERM warning is an environmental multi-worktree junction issue, not a compile failure.

---

## M. Staging deployment report

**Not performed** (owner safety amendment: no Hostinger staging, no push). Separate GO required.

---

## N. Phase 3 recommendation register

1. Veterans’ Health service or knowledge destination (content-approved)  
2. CMS payload backfill job for golden GPs (admin parity)  
3. Portrait programme for deferred trio after cutover  
4. Samuel allied authority pack (quals + bio) after confirmation  
5. Optional golden HTML source language sync (once runtime proven)  
6. Community / catchment / local SEO / heritage / recruitment / analytics — **out of Phase 2**  

---

## O. Launch-readiness assessment (practitioner authority)

Practitioner authority is **ready for local review**: policies consistent, Phase 1 journey improvements intact, owner language gaps closed at render, deferred photos correctly classified as non-blockers, CMS backfill planned but not executed (no DB writes).

**Not** production-cutover ready until ops gates (backup, staging GO, DNS) outside this Phase.

### Final outcome

**PHASE 2 READY FOR REVIEW — LOCAL ONLY**
