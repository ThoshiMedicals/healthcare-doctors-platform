# Evidence Integration — Batch 1 Gate Report

**Role:** WMC Evidence Integration Lead  
**Date:** 2026-11-04  
**Sources:** `docs/WMC-EVIDENCE-COLLECTION-PROGRAM.md` · `docs/WMC-EVIDENCE-EXECUTION-PROGRAM.md` · Sprint A tracker  
**Constraint check:** IA · navigation · Journey · CTA destinations · Recommended Next — **unchanged** (no Attraction HTML/TS edits)

---

## Verdict

### **NO SWAP — Batch 1 blocked at G3 (That-is-us)**

Execution Program hard stop: Principal + Practice Manager must both mark Critical assets **“That is us — approve for Attraction UAT”** before concept slots are replaced.

| Check | Result |
| --- | --- |
| Approved photography handoff folder / vault | **Not found** |
| Tracker rows at `That-is-us approved` or `Web exported` | **0 / 11 photos · 0 / 6 voices** |
| Staff image / quote consent records in repo or agent stores | **None** (correct — consents stay in practice secure folder; none referenced) |
| Ownership pack EOI statement signed | **Unsigned** (Pack 03 checkboxes empty) |
| Platform files changed for Batch 1 | **None** (correct) |

**Rule applied:** Replace concept assets **only where approved replacements exist.** None exist → zero replacements.

---

## Files changed

| Path | Change |
| --- | --- |
| `docs/evidence-sprint-a/05-integration-batch1-gate-report.md` | **Added** — this gate report |
| `docs/evidence-sprint-a/04-asset-replacement-tracker.md` | Status → `Blocked` (awaiting approved bundle) |
| `docs/evidence-sprint-a/asset-replacement-tracker.csv` | Same status sync |
| `docs/evidence-sprint-a/baselines/batch1-before/*.png` | **Added** — before screenshots for PH-01…04 |

No Attraction platform source, assets, or published HTML modified.

---

## Replacement status matrix

### Photography

| ID | Current concept asset | Replacement asset | Website location | Status | Before / after |
| --- | --- | --- | --- | --- | --- |
| PH-01 | `assets/attraction/journey/join-our-team-feature.jpg` | — (none approved) | `join-our-team.html` hero | **Blocked** | Before: `baselines/batch1-before/PH-01-join-before.png` · After: *n/a* |
| PH-02 | `assets/attraction/journey/community-catchment-feature.jpg` | — | `about-us/community-catchment.html` feature | **Blocked** | Before: `PH-02-catchment-before.png` · After: *n/a* |
| PH-03 | `assets/attraction/journey/gp-opportunities-feature.jpg` | — | `join-our-team/gp-opportunities.html` feature | **Blocked** | Before: `PH-03-opportunities-before.png` · After: *n/a* |
| PH-04 | `assets/practice-experience/feature-atmosphere.jpg` | — | `about-us/practice-experience.html` feature | **Blocked** | Before: `PH-04-practice-experience-before.png` · After: *n/a* |
| PH-05 | `assets/practice-experience/typical-day.jpg` | — | PE Typical Day | **Blocked** | After: *n/a* |
| PH-06 | `assets/practice-experience/nursing.jpg` | — | PE Nursing | **Blocked** | After: *n/a* |
| PH-07 | `assets/practice-experience/reception.jpg` | — | PE Reception | **Blocked** | After: *n/a* |
| PH-08 | `assets/practice-experience/team-interactions.jpg` | — | PE Team Interactions | **Blocked** | After: *n/a* |
| PH-09 | `assets/practice-experience/community.jpg` | — | PE Community | **Blocked** | After: *n/a* |
| PH-10 | `assets/practice-experience/continuity.jpg` | — | PE Continuity | **Blocked** | After: *n/a* |
| PH-11 | `assets/practice-experience/flexible-sessions.jpg` | — | PE Flexible Sessions | **Blocked** | After: *n/a* |

**Live on UAT:** **0 / 11**

### Voices

| ID | Placement | Attribution | Approval record | Context | Status |
| --- | --- | --- | --- | --- | --- |
| V-GP-01 | PE Typical Day quote rail | — | None on file | Composite still suppressed (silence) | **Blocked** |
| V-GP-02 | PE Nursing or Team | — | None | Silence | **Blocked** |
| V-GP-03 | GP Opportunities | — | None | Silence | **Blocked** |
| V-NU-01 | PE Nursing | — | None | Silence | **Blocked** |
| V-NU-02 | PE Nursing honesty cue | — | None | Silence | **Blocked** |
| V-RX-01 | PE Reception | — | None | Silence | **Blocked** |

**Live on UAT:** **0 / 6**

### Ownership (Batch 1 adjacent)

| ID | Status |
| --- | --- |
| OWN-EOI | **Blocked** — Pack 03 statement not signed |
| OWN-CALL | **Blocked** — reception brief not signed |
| OWN-SLA | **Blocked** — guideline not completed |

---

## Remaining concept assets (still serving)

1. Journey Join feature JPG  
2. Journey Catchment feature JPG  
3. Journey Opportunities feature JPG  
4. PE feature-atmosphere JPG  
5. PE typical-day · nursing · reception · team-interactions · community · continuity · flexible-sessions JPGs  
6. Attraction placeholder library under `assets/attraction/placeholders/` (not Critical journey slots; leave until mapped)

---

## Remaining voice gaps

| Gap | Impact |
| --- | --- |
| No consented GP day voice (V-GP-01) | Typical Day rail stays silent |
| No consented GP team/nursing voice (V-GP-02) | Nursing/Team unproven by peer |
| No consented fit-honesty GP voice (V-GP-03) | Opportunities lacks social proof |
| No nurse pathway / cover voices (V-NU-01/02) | Nursing claims text-only |
| No reception flow voice (V-RX-01) | Reception systems text-only |
| No PM EOI ownership line (OWN-EOI) | EOI reader still soft/anonymous |

---

## Authenticity score update

Baseline (employer-brand / production-gap review, 2026-11-04):

| Metric | Prior | After Batch 1 attempt | Delta |
| --- | --- | --- | --- |
| Authenticity | **58 / 100** | **58 / 100** | 0 |
| Trust | 72 / 100 | 72 / 100 | 0 |
| Employer-brand | 68 / 100 | 68 / 100 | 0 |
| Attraction production stance | **HOLD** | **HOLD** | — |

**Why no score movement:** Zero Critical photo/voice slots crossed G3. Concept imagery and quote silence remain on the Join → PE → Catchment → Opportunities path.

**Score unlock condition (minimum authenticity line):** PH-01–11 That-is-us + live · V-GP×3 · V-NU×2 · V-RX×1 live · OWN-EOI live · G6 walkthrough.

---

## What unblocks Batch 1 (handoff checklist)

Place into a practice-secure bundle (not necessarily the git repo) and notify platform lead:

1. Web derivatives ≤100 KB named to tracker slots (or clear PH-ID → filename map)  
2. Principal + PM **That-is-us** sign-off per Critical photo  
3. Staff image consent IDs (faces) · quote consent + approved final lines for each voice  
4. Optional: signed Pack 03 EOI statement for OWN-EOI in same batch  

Then platform lead runs R3→R5 per Execution Program (Journey → PE → voices) **without** changing IA / nav / Journey / CTAs / Recommended Next.

---

## Integrity note

Integration lead **did not** substitute patient-site stock (`clinic-reception.png`, storefront, etc.) or invent voices. That would violate Collection Program (“Attraction slots only” + That-is-us gate) and create a false authenticity gain.
