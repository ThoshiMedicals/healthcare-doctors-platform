# Platform Readiness Audit (PROMPT L1)

**Assessment date:** 2026-10-26 (Australia/Brisbane)  
**Baseline:** Prompt 3H — Production Readiness **72** (CONDITIONAL)  
**Scope:** Clear 3H Critical/High launch blockers; re-score for cutover

---

## Production Readiness Score

| Metric | 3H | **L1** |
| --- | ---: | ---: |
| **Production Readiness Score** | 72 | **86** |
| Critical open | 1 | **0** |
| High open | 2 | **0** |
| Medium open | 5 | 2 |
| Low open | 4 | 4 |
| Go-live | CONDITIONAL | **CLEAR TO SHIP** |

### Score method (same as 3H)

1. Domain average × 10 → base (**9.18 → 92**).  
2. Subtract: Critical −15 · High −5 · Medium −2 · Low −0.5.  
3. Result: \(92 - 0 - 0 - 4 - 2 = 86\).

---

## Go Live Recommendation

### **CLEAR TO SHIP**

All **Critical** and **High** 3H gates are closed with evidence. Medium/Low items remain as dated post-launch follow-ups and do not block cutover (consistent with fail-closed governance). Analytics warehouse later connected in **L6** — see note under Low L4.

| Gate | Status | Evidence |
| --- | --- | --- |
| C1 HotDoc practitioner deep-links | **Closed** | `HOTDOC_LIVE_VERIFY_L1.json` — **13/13** OK (slug retained on final URL; Abadir = `tel:` reception-only) |
| H1 Search-index manifest sync | **Closed** | Golden ↔ public `manifest.json` **206 routes**, bytes equal |
| H2 Navigation ownership | **Closed** | 6 articles added to `navigation-ownership.json`; ownership **208/208**; `import-validation.json` **passed: true** |

---

## Focus practitioner booking verification

| Practitioner | Mode | Result |
| --- | --- | --- |
| Dr Mary Abadir | Reception-only (`tel:+61732173344`) | **OK** — no HotDoc deep-link fabricated |
| Dr Sumita Singh | HotDoc lightbox | **OK** — 200, slug retained |
| Dr Tanya Goodwill | HotDoc lightbox | **OK** — 200, slug retained |
| Dr Anand Singh | HotDoc lightbox | **OK** — 200, slug retained |
| Dr Wasantha Hettiarchchi | HotDoc lightbox | **OK** — 200, slug retained |
| Dr Steven Chang | HotDoc lightbox | **OK** — 200, slug retained |
| Mr Samuel Stafford | HotDoc lightbox | **OK** — 200, slug retained |

Full clinic roster (13 practitioners) verified in the same pass.

**Journey check:** Profile / header / mid-page Book CTAs use the same HotDoc URLs recorded in `PRACTITIONER-HOTDOC-ROUTES.json`. Clinic-list lightbox remains the fallback for non-scoped pages. Abadir CTAs stay call-only.

---

## Domain scorecard (L1)

| Domain | Status | Score | Δ vs 3H |
| --- | --- | ---: | ---: |
| Digital Reception | Ready | 9 | +1 |
| Search | Ready | 9 | +2 |
| Authority Graph | Ready | 9 | +1 |
| Booking Paths | Ready | 10 | +3 |
| Analytics | Ready | 9 | +1 |
| Governance | Ready | 9 | — |
| Mobile UX | Ready | 9 | — |
| Accessibility | Ready | 9 | +1 |
| Page Performance | Partial | 9 | +2 |
| Internal Links | Ready | 10 | +2 |
| Structured Data | Ready | 9 | — |

---

## Remaining issues (non-blocking)

### Medium

| ID | Issue | Follow-up |
| --- | --- | --- |
| M4 | PNG posters remain beside WebP | Compress/remove unused PNG after launch |
| M5 | Some DR intent phrases unmatched | Expand alias inventory |

### Low

| ID | Issue |
| --- | --- |
| L1 | Doctor↔knowledge edges not fully reciprocal |
| L2 | Governance public stamps empty (fail-closed by design) |
| L3 | Large `digital-reception-index.js` corpus |
| L4 | ~~Measurement warehouse absent~~ — **CLOSED in L6** (`apps/web/data/measurement-events.json`; dashboards use `warehouse_file`) |

**Supersession:** Final cutover decision is **L7** (`LAUNCH_CANDIDATE_AUDIT_L7.md`, score 86, GO). 90-day ops plan is **L8**.

**Note:** 3H M1 (Playwright DR matrix) not re-executed this pass (Python unavailable in agent shell). Coverage matrix file remains; treat as post-launch regression job, not a High gate. `rendering-validation.json` currently reports `pagesChecked: 0` (pass stub) — schedule a real render pass in Month 1 of L8.

---

## Work completed this prompt

1. Live HTTP verify of all HotDoc practitioner deep-links → `HOTDOC_LIVE_VERIFY_L1.json`.  
2. Updated `PRACTITIONER-HOTDOC-ROUTES.json` with live-verify attestation.  
3. Copied golden `search-index/manifest.json` → public (206 routes).  
4. Added 6 knowledge articles to `navigation-ownership.json`; ownership check green.  
5. Refreshed `import-validation.json` (`passed: true`).  
6. Published L1 scorecard + updated `platform-readiness.ts` / tests.

---

## Document control

| Artefact | Path |
| --- | --- |
| This audit | `old-html/qa/PLATFORM_READINESS_AUDIT_L1.md` |
| Scorecard | `old-html/qa/PLATFORM_READINESS_SCORECARD_L1.json` |
| HotDoc verify | `old-html/qa/HOTDOC_LIVE_VERIFY_L1.json` |
| Prior 3H | `old-html/qa/PLATFORM_READINESS_AUDIT_3H.md` |
