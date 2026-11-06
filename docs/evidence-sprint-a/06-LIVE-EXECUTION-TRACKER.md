# Sprint A — Live Execution Tracker

**Role:** Attraction Platform Evidence Coordinator control surface  
**Audience:** Practice Manager (ops) · Principal GP (authenticity)  
**Opened:** 2026-11-04 · **Last updated:** 2026-11-04  

**Sources:** `WMC-EVIDENCE-COLLECTION-PROGRAM.md` · `WMC-EVIDENCE-EXECUTION-PROGRAM.md` · `WMC-ATTRACTION-STAKEHOLDER-ROLE-PACKS.md` · packs `01`–`05`  

**Rule:** Update this file (or the CSV twin) daily. Do not invent a second plan — packs `01`–`03` are how you collect; this tracker is how you manage.

---

## Calendar lock (fill once, then run)

| Field | Value |
| --- | --- |
| Sprint start (Week 1 Mon) | **2026-11-10** (proposed — PM may shift; shift all due dates by same offset) |
| Shoot day (Week 1 Tue) | **2026-11-11** |
| That-is-us gate (Week 1 Thu) | **2026-11-13** |
| Week 2 replace start (Mon) | **2026-11-17** |
| G6 authenticity walkthrough (Week 2 Fri) | **2026-11-21** |
| Photographer | _______________ |
| PM on floor | _______________ |
| Platform lead | _______________ |

**Baseline (Batch 1, 2026-11-04):** No That-is-us bundle → **0 / 11 photos · 0 / 6 voices · 0 / ownership Critical live**. See `05-integration-batch1-gate-report.md`.

### Status legend

| Field | Allowed values |
| --- | --- |
| Photo / voice / ownership **status** | `Not started` · `Consent pending` · `Scheduled` · `Captured` · `In review` · `That-is-us approved` · `Web exported` · `Live on UAT` · `Blocked` |
| **Consent state** | `Not issued` · `Issued` · `Signed on file` · `N/A` · `Withdrawn` |
| **Sign-off state** | `Pending` · `That-is-us approved` · `Rejected — hold` · `N/A` |
| RAG | 🟢 On track · 🟡 At risk · 🔴 Blocked |

---

# 1. Master execution tracker

## 1A. Photography PH-01–11

| ID | Owner | Status | Consent state | Replacement target | Due date | Sign-off state | Placement (frozen) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **PH-01** Arrival threshold | PM + Photographer · Principal gate | Blocked | Not issued | WMC arrival / reception threshold still (retire concept Join hero) | Capture **11 Nov** · That-is-us **13 Nov** · Live UAT **17 Nov** | Pending | `join-our-team.html` hero |
| **PH-02** Street entrance | PM + Photographer · Principal gate | Blocked | N/A if façade only; Issued if faces | WMC exterior / 468 Vulture St neighbourhood still | Capture **11 Nov** · That-is-us **13 Nov** · Live **17 Nov** | Pending | `about-us/community-catchment.html` feature |
| **PH-03** Collegial fit | PM + Photographer · Principal gate | Blocked | Not issued | Collegial GP ± nurse in real clinical room | Capture **11 Nov** · That-is-us **13 Nov** · Live **17 Nov** | Pending | `join-our-team/gp-opportunities.html` feature |
| **PH-04** Atmosphere | PM + Photographer · Principal gate | Blocked | Not issued | Reception → corridor atmosphere still | Capture **11 Nov** · That-is-us **13 Nov** · Live **17 Nov** | Pending | `about-us/practice-experience.html` feature |
| **PH-05** Typical day | PM + Photographer · Principal gate | Blocked | Not issued | GP at desk / between patients in *our* room | Capture **11 Nov** · That-is-us **13 Nov** · Live **18 Nov** | Pending | PE · Typical Day chapter |
| **PH-06** Nursing | PM + Photographer · NUM consulted · Principal gate | Blocked | Not issued | Nurse treatment-room prep (± GP mid-distance) | Capture **11 Nov** · That-is-us **13 Nov** · Live **18 Nov** | Pending | PE · Nursing |
| **PH-07** Reception | PM + Photographer · Reception lead · Principal gate | Blocked | Not issued | Reception desk; screens blank | Capture **11 Nov** · That-is-us **13 Nov** · Live **18 Nov** | Pending | PE · Reception |
| **PH-08** Team corridor | PM + Photographer · Principal gate | Blocked | Not issued | GP–nurse or GP–GP doorway exchange | Capture **11 Nov** · That-is-us **13 Nov** · Live **18 Nov** | Pending | PE · Team Interactions |
| **PH-09** Community cue | PM + Photographer · Principal gate | Blocked | N/A if empty street; Issued if staff | Entrance / bench / street near clinic | Capture **11 Nov** · That-is-us **13 Nov** · Live **18 Nov** | Pending | PE · Community |
| **PH-10** Continuity cue | PM + Photographer · Principal gate | Blocked | Not issued (+ patient form **only if** identifiable) | Same GP in room; patient unidentifiable **or** consented | Capture **11 Nov** · That-is-us **13 Nov** · Live **18 Nov** | Pending | PE · Continuity |
| **PH-11** Flexible sessions | PM + Principal (fallback co-owner) | Blocked | N/A if empty room / typographic treatment | Empty consult ready **or** signed non-photo treatment | Capture **11 Nov** · Decide fallback **13 Nov** · Live **18 Nov** | Pending | PE · Flexible Sessions |

**Photo roll-up:** Live **0 / 11** · That-is-us **0 / 11** · Consent complete for scheduled faces **0** · RAG **🔴**

**Talent contact sheet:** maintain names in `01-photography-pack.md` §A (single source for people).

---

## 1B. Voices (Critical ×6)

| ID | Owner | Interview status | Quote approval status | Website placement | Consent state | Due date | Sign-off state |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **V-GP-01** Day shape | PM schedules · Principal or long-stay GP speaks · Principal clinical sanity | Not started | Pending | PE Typical Day (+ optional Opportunities) | Not issued | Interview by **12 Nov** · Draft **+48h** · Approve **+72h** · Live **19 Nov** | Pending |
| **V-GP-02** Team / nursing | PM · Continuity-oriented GP · NUM consulted | Not started | Pending | PE Nursing or Team | Not issued | Same SLA · Live **19 Nov** | Pending |
| **V-GP-03** Fit honesty | PM · GP willing to say who should *not* join · Principal sanity | Not started | Pending | `gp-opportunities.html` (+ optional PE Continuity) | Not issued | Same SLA · Live **19 Nov** | Pending |
| **V-NU-01** Pathway | PM · Senior / treatment-room nurse · NUM accuracy | Not started | Pending | PE Nursing | Not issued | Same SLA · Live **19 Nov** | Pending |
| **V-NU-02** Cover honesty | PM · Nurse who knows thin-cover days · NUM accuracy | Not started | Pending | PE Nursing (honesty cue) | Not issued | Same SLA · Live **19 Nov** | Pending |
| **V-RX-01** Flow | PM · Experienced receptionist · Reception lead | Not started | Pending | PE Reception | Not issued | Prefer shoot afternoon **11 Nov** · Live **19 Nov** | Pending |

**Important (not Sprint A blockers):** V-RX-02 · V-PM-01 · V-REG-01 — track in `02-voice-capture-pack.md` if capacity.

**Voice roll-up:** Live **0 / 6** · Approved lines **0 / 6** · Consents signed **0 / 6** · RAG **🔴**

**Interview prompts:** use Role Pack honesty lenses + `02-voice-capture-pack.md` §C–E (do not rewrite prompts here).

---

## 1C. Ownership signals

| ID | Owner | Approval status | Implementation status | Placement / artefact | Due date | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| **OWN-EOI** Named EOI reader | PM (A) · Owner informed · Platform lead implements copy only | Pending — Pack 03 unsigned | Not started | `join-our-team/express-interest.html` | Approve **by 14 Nov** · Live **20 Nov** | Choose A (role) or B (named) in `03-ownership-pack.md` |
| **OWN-CALL** Joining call path | PM + Reception lead | Pending | Not started | Sticky `tel:` + desk script | Brief **by 14 Nov** · Live path verified **20 Nov** | Script in Pack 03 §C |
| **OWN-SLA** Response guideline | PM | Pending | Not started | Internal (± optional public phrase) | Agree **by 14 Nov** | Acknowledge 3 bd · substantive 10 bd (Pack 03) |
| **OWN-ADDR** Address / hours truth | PM | Pending verify | Not started | Catchment + Support / contact cues | Verify **by 12 Nov** | Place ownership — no false hours |
| **OWN-VAC** Vacancy honesty | PM + Owner | Pending weekly review | Not started | Opportunities vacancy cards | Review **by 14 Nov** · recheck **21 Nov** | No oversell |
| **OWN-NURSE** Nursing cover honesty | NUM / senior nurse + PM | Pending | Tied to V-NU-02 | PE Nursing honesty | Align with voice approve · Live **19 Nov** | Ops-owned claim |
| **OWN-FLEX** Session flexibility honesty | PM + Principal | Pending | Tied to PH-11 + optional V-GP-03 | PE Flexible Sessions | Decide treatment **13 Nov** · Live **18 Nov** | Rooms/nursing constraints owned |
| **OWN-PRIN** Principal endorsement | Principal GP | Pending | Not started | Join or Opportunities short line | Optional Important — target **20 Nov** if capacity | Quote consent if published |
| **OWN-AGPAL** AGPAL mark | PM | Approved (existing) | Live (keep) | Footer | — | Do not overclaim |
| **OWN-PHOTO-GATE** Photo sign-off | Principal + PM | Pending G3 | Blocked | All Critical photo slots | **13 Nov** | Hard stop before any swap |
| **OWN-QUOTE-GATE** Quote sign-off | Interviewee + PM (+ Principal sanity for clinical) | Pending | Blocked | All Critical voices | Per voice SLA · bundle **19 Nov** | Hard stop before voice publish |

**Ownership Critical for Sprint A done:** OWN-EOI · OWN-CALL · OWN-SLA · OWN-ADDR · OWN-VAC · OWN-NURSE · OWN-FLEX · OWN-PHOTO-GATE · OWN-QUOTE-GATE  

**Ownership roll-up (Critical):** Approved **1 / 9** (AGPAL only) · Implemented live **1 / 9** · RAG **🔴**

---

## 1D. Gate board (Execution Program)

| Gate | When | Signatories | Pass criteria | State |
| --- | --- | --- | --- | --- |
| **G0** Program start | Before Week 1 | Owner + PM | Evidence Plan still approved; shoot budget/time | ☐ |
| **G1** Consent complete | Week 1 Mon **10 Nov** | PM | All scheduled faces/voices have forms | ☐ |
| **G2** Capture complete | Week 1 Tue EOD **11 Nov** | PM + photographer | PH-01–11 coverage checklist | ☐ |
| **G3** That-is-us | Week 1 Thu **13 Nov** | **Principal + PM** | Every Critical photo/quote marked approve | ☐ **← Batch 1 hard stop** |
| **G4** UAT visual replace | Week 2 Tue **18 Nov** | Platform lead + PM | Demo path shows WMC photos only | ☐ |
| **G5** Voices + EOI | Week 2 Thu **20 Nov** | PM + interviewees done | Six voices + ownership line live | ☐ |
| **G6** Authenticity line | Week 2 Fri **21 Nov** | Owner · PM · Principal · Nurse lead · Reception lead | Walkthrough “That is us”; punch-list ≤5 non-blockers | ☐ |
| **G7** Re-enter gap report | After G6 | Platform lead | Update authenticity status in production gap docs | ☐ |

---

## 1E. Scoreboard (paste into weekly report)

| Bundle | Critical | Live on UAT | That-is-us / approved | Blocked | RAG |
| --- | --- | --- | --- | --- | --- |
| Photos PH-01–11 | 11 | 0 | 0 | 11 | 🔴 |
| Voices ×6 | 6 | 0 | 0 | 6 | 🔴 |
| Ownership Critical | 9 | 1 (AGPAL) | 1 | 8 | 🔴 |
| Stakeholder G6 | 1 | — | — | Open | 🔴 |

**Demo path (Role Packs):** Join → PE → Catchment → Opportunities → EOI · UAT `https://next.gabbamedicalcentre.com.au`

CSV twin for spreadsheet: `live-execution-tracker.csv`

---

# 2. Daily checklist

**Who runs it:** PM (ops) · Principal joins on gate days (G3, G6) · Platform lead on replace days.  
**Time box:** 10 minutes stand-up · update §1 tables before close of day.

### Every working day (Week 0–2)

- [ ] Open this tracker · update any status / consent / sign-off that changed  
- [ ] Note blockers in Daily log (below) with owner + next action  
- [ ] Confirm no Critical face/quote published without consent + That-is-us  
- [ ] Confirm concept files still serving only until G3 pass (no half-approved swaps)

### Weekday overlays

| Day | Extra checks |
| --- | --- |
| **Mon Week 1** | Consent chase complete (G1) · call sheet locked · privacy walk booked · quote consents issued |
| **Tue Week 1 (shoot)** | T−60 pack (`01` §C) · PH-01–11 wrap checklist · interviews started if free · drive labelled |
| **Wed Week 1** | Remaining interviews · shortlist 2 frames/Critical shot · drafts queued |
| **Thu Week 1** | Principal + PM gallery (G3) · quote drafts to interviewees · PH-11 fallback decided if needed |
| **Fri Week 1** | Final quote approvals chase · web ≤100 KB export list · OWN-EOI text drafted |
| **Mon–Tue Week 2** | Platform lead: Journey PH-01–03 + PE feature/chapters PH-04–11 only if G3 passed |
| **Wed Week 2** | Enable six voices only if quote consents + approvals complete |
| **Thu Week 2** | EOI ownership live · reception joining-call brief signed |
| **Fri Week 2** | Role Pack walkthrough (Owner/PM/Principal/Nurse/Reception) · punch-list ≤5 · G6 sign-off |

### Daily log (append rows)

| Date | RAG | Done today | Blocker | Owner of next action | Due |
| --- | --- | --- | --- | --- | --- |
| 2026-11-04 | 🔴 | Live tracker opened; Batch 1 remains NO-SWAP at G3 | No That-is-us photo/voice bundle; consents not issued | PM: issue consent packs · lock shoot date | 2026-11-10 |
| | | | | | |

---

# 3. Weekly status report format

**Copy this block each Friday (or Monday AM) into email / Teams to Owner + Principal.**  
**Preparer:** PM · **Facilitator cc:** Platform lead  

```
WMC Attraction — Sprint A Weekly Status
Week of: _______________   Prepared by: _______________   Date: _______________

1) RAG SUMMARY
   Schedule: 🟢 / 🟡 / 🔴
   Authenticity (photos+voices): 🟢 / 🟡 / 🔴
   Ownership (EOI/calls): 🟢 / 🟡 / 🔴
   Overall: 🟢 / 🟡 / 🔴
   One-line critical path: _______________________________________________

2) SCOREBOARD (from Live Tracker §1E)
   Photos live: __ / 11     That-is-us: __ / 11
   Voices live: __ / 6      Quote approved: __ / 6
   Ownership Critical live: __ / 9
   Gates passed: G0☐ G1☐ G2☐ G3☐ G4☐ G5☐ G6☐

3) THIS WEEK — DONE (max 5 bullets)
   • 
   • 
   • 

4) NEXT WEEK — PLAN (max 5 bullets, with owners)
   • 
   • 
   • 

5) MILESTONES (next 14 days)
   | Milestone | Due | Confidence H/M/L | Owner |
   |-----------|-----|------------------|-------|
   |           |     |                  |       |

6) RISKS / ISSUES
   | ID | Issue | Impact | Mitigation | Owner | Need-by |
   |----|-------|--------|------------|-------|---------|
   |    |       |        |            |       |         |

7) DECISIONS NEEDED FROM PRINCIPAL / OWNER (this week)
   • 
   • 

8) STAKEHOLDER LENS (Role Packs — optional 2 lines)
   PM ops truth: Ready / After must-fixes / Not ready — ________________
   Principal authenticity: Ready / After must-fixes / Not ready — ______

9) DEMO PATH CHECK
   UAT Join→PE→Catchment→Opportunities→EOI walked? ☐ Yes date ______
   Still seeing concept photos on Critical slots? ☐ Yes ☐ No
```

**Escalation rules (from Execution Program):**  
Talent no-show → reschedule shoot; **do not** fall back to concept for Critical slots.  
Quote withheld → role-only if still approved, else leave empty.  
That-is-us disagreement → Principal decides; asset stays unpublished.

---

# 4. Definition of Done

## Sprint A — authenticity line crossed

Sprint A is **Done** only when **all** of the following are true:

### Photography
- [ ] PH-01–11 each have a usable select **or** PH-11 has a **signed** non-photo treatment  
- [ ] Staff image consent on file for every identifiable face used  
- [ ] Principal **and** PM marked each Critical photo **“That is us — approve for Attraction UAT”** (G3)  
- [ ] Web derivatives ≤100 KB installed on frozen slots (R3–R4)  
- [ ] Concept journey / PE feature images **off** the stakeholder demo path (G4)  
- [ ] Patient media default off; no unconsented identifiable patients (especially PH-10)

### Voices
- [ ] Six Critical voices live: V-GP-01 · V-GP-02 · V-GP-03 · V-NU-01 · V-NU-02 · V-RX-01  
- [ ] Quote consent + written approval of **exact** published lines for each  
- [ ] Attribution matches interviewee preference  
- [ ] Principal clinical sanity check done for GP clinical claims  
- [ ] No composites / no filler quotes

### Ownership
- [ ] OWN-EOI ownership line live on Express Interest (Pack 03 approved)  
- [ ] OWN-CALL reception joining-call brief signed; sticky `tel:` verified  
- [ ] OWN-SLA internal response guideline agreed  
- [ ] OWN-ADDR address/hours verified true  
- [ ] OWN-VAC vacancy cards reviewed honest  
- [ ] OWN-NURSE / OWN-FLEX honesty aligned with live PE copy and voices/photos  
- [ ] OWN-PHOTO-GATE and OWN-QUOTE-GATE passed

### Stakeholder close
- [ ] G6 walkthrough complete (Owner · PM · Principal · Nurse lead · Reception lead)  
- [ ] Punch-list ≤5 **non-blocking** items with owners/dates  
- [ ] Written authenticity sign-off filed (Execution Program sign-off block)  
- [ ] Tracker scoreboard shows Photos **11/11** · Voices **6/6** · Ownership Critical complete · G6 ☑  
- [ ] Platform lead scheduled G7 gap-report update  

### Explicitly out of scope (not required for Done)
- New modules · IA/nav/journey changes · DNS cutover · selective SEO index  
- Patient-site golden-master hero swaps  
- Important/Nice PH-12–15 and optional voices (unless already captured)

### Success test (Collection + Execution + Role Packs)
A visiting GP does not need to ask “is this stock?”  
Principal and PM can defend every Critical photo and quote as Woolloongabba Medical Centre evidence.  
Owner would be comfortable with a peer practice seeing this as *us* (Role Pack owner lens).

---

## Quick links

| Need | Open |
| --- | --- |
| Start today (30–45 min) | `00-START-HERE.md` |
| Shoot / consents | `01-photography-pack.md` |
| Interviews | `02-voice-capture-pack.md` |
| EOI / calls | `03-ownership-pack.md` |
| Slot file map | `04-asset-replacement-tracker.md` |
| Why nothing swapped yet | `05-integration-batch1-gate-report.md` |
| Programs | `docs/WMC-EVIDENCE-COLLECTION-PROGRAM.md` · `docs/WMC-EVIDENCE-EXECUTION-PROGRAM.md` |
| Role scoring | `docs/WMC-ATTRACTION-STAKEHOLDER-ROLE-PACKS.md` |
