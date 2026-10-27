# L8 — First 90-day post-launch roadmap

**Prepared:** 2026-10-26  
**Launch baseline:** L7 Go / Clear to Ship · readiness **86**  
**Horizon:** Day 0 → Day 90 (three calendar months after cutover)  
**Owner model:** Practice management (decisions) · Clinic ops (content/governance) · Web platform (measurement, DR, dashboards)

---

## Purpose

Turn launch readiness into a controlled operating rhythm: review live analytics, close known Medium follow-ups (M4/M5), publish governance strips safely, and grow practitioner/service authority using real patient journeys — without reopening Critical/High launch gates.

---

## Operating cadence (all 90 days)

| Cadence | Forum | Inputs | Outputs |
| --- | --- | --- | --- |
| **Weekly (30–45 min)** | Analytics + conversion huddle | Executive, Digital Reception, Conversion Intelligence dashboards; warehouse feed | Actions logged; warehouse merge if new exports |
| **Fortnightly** | Content + DR optimisation | Intent unmatched list; zero-result / weak-resolution intents; top pages | Content patches; intent routing updates |
| **Monthly** | Governance + authority review | Expiry report; Practitioner/Service Authority dashboards | Approvals published; authority edge backlog |
| **End of each 30-day block** | Steering checkpoint | Scorecard vs this roadmap | Keep / adjust priorities; note score drift |

**Warehouse hygiene:** After each significant traffic week, merge browser `WMCMeasurement.exportEventLog()` dumps via `npm run measurement:warehouse` so dashboards stay on live data (`apps/web/data/measurement-events.json`).

---

## Month 1 — Days 0–30 · Stabilise & observe

**Theme:** Confirm cutover health; seed continuous measurement; close launch Mediums that affect experience quality.

### Analytics reviews

| Week | Focus | Success signal |
| --- | --- | --- |
| 1 | Daily warehouse ingest from UAT/production sessions; verify admin still shows **warehouse feed** | Event volume growing; all 7 core 2G types present weekly |
| 2 | Executive Dashboard: traffic, sessions, book/call rates by placement | Dock vs in-page booking mix understood |
| 3–4 | First monthly pack: last_7 vs last_30; top pages/services/practitioners | Shared PDF/screenshot pack for practice management |

**Tools:** `/admin/executive`, `/admin/conversion-intelligence`, `measurement:warehouse`

### Content reviews

| Priority | Work | Links to |
| --- | --- | --- |
| P0 | Patch **M5** unmatched phrases (vaccine, immunisation, register, video call, hba1c, how much, see a doctor, needles) | DR search quality |
| P1 | Confirm Fees & Billing / New Patients / Telehealth copy matches live clinic policy | Top patient-info paths |
| P1 | Remove or redirect dead aliases (e.g. legacy `fees.html` → `fees-billing.html` if still linked) | Crawl / 404 watch |
| P1 | Replace stub `rendering-validation.json` (`pagesChecked: 0`) with a real multi-page render pass | Import / QA hygiene |

### Digital Reception optimisation

- Close **M5**: map unmatched phrases → existing hubs or new short articles.  
- Watchlist intents from DR dashboard: zero-result and high-search/low-resolution buckets.  
- Re-run intent audit after patches; target **≤3** `mode=none` phrases by Day 30.  
- Do **not** expand the DR index corpus until M5 routing is clean (**L3** payload size stays deferred).

### Conversion optimisation

- Review booking placement mix (dock / hero / profile / digital_reception).  
- Confirm HotDoc deep-links still resolve for focus practitioners (spot re-check 5 profiles).  
- Note drop-offs: DR open → search → result → book/call; one improvement per fortnight.  
- Protect L5 hierarchy: dock remains primary Book/Call/Ask on mobile.

### Governance milestones

| Milestone | Target | Notes |
| --- | --- | --- |
| G1 — First public strips | By Day 21 | Approve **5–10** high-traffic pages with complete public fields + private evidence |
| G2 — Publish registry | Same day as G1 | `governance:publish` → non-empty fail-open only for approved rows |
| G3 — Expiry dashboard habit | Weekly from Day 7 | Use `/admin/governance/expiry` |

Priority page set (suggested): New Patients, Fees & Billing, Bulk Billing, Telehealth, Skin Checks, Women’s Health, Mental Health, Privacy, After Hours, Book Appointment.

### Practitioner authority growth

- Baseline Practitioner Authority dashboard (Day 7).  
- Ensure each GP profile has: areas of care, related services, ≥3 related guides where clinically appropriate.  
- Close obvious **L1** gaps for top-booked practitioners first (Goodwill, Singh, Hettiarchchi, Karimi).  
- Target: **+1 reciprocal doctor↔guide edge set** for 4 focus GPs by Day 30.

### Service authority growth

- Baseline Service Authority dashboard (Day 7).  
- Skin Checks, Women’s Health, Mental Health, Family Health: verify related guides + practitioners + booking band.  
- Add missing guide links where authority dashboard shows weak guide coverage.  
- Target: **3 priority services** at “guide + practitioner + book” complete by Day 30.

### Month 1 exit criteria

- [ ] Warehouse events ≫ seed (order-of-magnitude growth or clear traffic-normal explanation)  
- [ ] M5 unmatched ≤3  
- [ ] ≥5 pages with live governance strips  
- [ ] Focus practitioners re-verified on HotDoc  
- [ ] Authority dashboards reviewed once by practice management  

---

## Month 2 — Days 31–60 · Optimise & publish

**Theme:** Convert observation into content and authority improvements; expand governance coverage.

### Analytics reviews

| Week | Focus |
| --- | --- |
| 5 | Conversion Intelligence: placement and path drop-outs |
| 6 | Digital Reception: resolution rate by intent; compare to Month 1 |
| 7–8 | Cohort note: new vs returning sessions if available; otherwise page_group mix |

Deliverable: **Month 2 analytics brief** (1–2 pages) with three decisions for Month 3.

### Content reviews

- Second-pass patient information: Test Results, Repeat Scripts, Referrals, After Hours.  
- Knowledge articles tied to top DR intents (diabetes, skin check, fees) — refresh ledes and CTAs only where analytics show demand.  
- Start **M4** PNG cleanup: remove or archive unused PNG posters where WebP is already preferred (largest first).

### Digital Reception optimisation

- Add shortcuts for newly resolved intents.  
- Tune care-journey vs direct_page outcomes for top 10 intents.  
- Privacy check: confirm debug query store TTL still 14 days; no raw queries on dashboards.  
- Optional: thin DR index shards for unused legacy entries (**L3** — plan only; implement if size still hurts LCP).

### Conversion optimisation

- A/B-style sequential test (not code fork): one fortnight emphasising profile Book, one emphasising dock — compare book_appointment_click placement mix.  
- Reduce redundant in-page Call emphasis only where dock already covers mobile.  
- HotDoc fallback copy review (“Need help booking?”) — keep clear, short, clinic-owned.

### Governance milestones

| Milestone | Target |
| --- | --- |
| G4 — 25% of ClinicalReview rows public-ready **or** 40 published strips | By Day 45 |
| G5 — All patient-information hubs approved/published | By Day 60 |
| G6 — Next-review calendar filled for published set | By Day 60 |

Use expiry report to prevent silent strip disappearance.

### Practitioner authority growth

- Complete reciprocity pass for remaining GPs + allied (Chang, Stafford).  
- Add peer links only where published care areas overlap (existing 4E pattern).  
- Authority dashboard: reduce “orphan” practitioners (profile with no related guides).  
- Target: **≥80%** of active practitioners have ≥1 related service and ≥1 related guide.

### Service authority growth

- Extend to Preventive Healthcare, Vaccinations, Chronic Disease, Men’s/Children’s Health.  
- Ensure each service hub has trust strip + booking band (L3/L5 intact).  
- Target: **8 services** with complete authority triangle (guides · practitioners · book).

### Month 2 exit criteria

- [ ] Month 2 analytics brief signed off  
- [ ] M4: top 5 PNGs removed or justified retained  
- [ ] Governance: patient-info hubs published  
- [ ] Practitioner reciprocity ≥80% active roster  
- [ ] 8 services authority-complete  

---

## Month 3 — Days 61–90 · Grow & institutionalise

**Theme:** Embed reviews as BAU; grow authority graph; prepare 180-day plan.

### Analytics reviews

- Full-quarter Executive + Conversion + DR + Authority dashboard pack.  
- Compare Day 0–30 vs 31–60 vs 61–90 booking/call rates.  
- Decide warehouse automation (scheduled export vs manual merge).  
- Re-score soft readiness: analytics domain should remain **ready** with deeper samples.

### Content reviews

- Seasonal / clinic-priority topics (e.g. skin checks, vaccination, after-hours) based on DR intents.  
- Finish M4 PNG cleanup for patient-information assets.  
- Editorial pass: trust strip destinations still correct (AGPAL, bulk billing, hours).

### Digital Reception optimisation

- Re-run full intent audit; target **0–1** unmatched high-frequency phrases.  
- Document intent → destination ownership (ops runbook).  
- Review emergency / unmatched pathways still fail closed to reception/call.

### Conversion optimisation

- Codify winning placement mix into content guidelines (no layout regression of L5).  
- Practitioner profile CTA consistency audit (Book destination = HotDoc verify list).  
- One conversion experiment only (e.g. booking band copy) — measure via warehouse, then keep or revert.

### Governance milestones

| Milestone | Target |
| --- | --- |
| G7 — ≥50% of indexed clinical pages have current public strips **or** explicit deferred reason | By Day 75 |
| G8 — First full expiry cycle completed (none overdue without action) | By Day 90 |
| G9 — Governance BAU: fortnightly approval batch | Ongoing |

### Practitioner authority growth

- Publish “authority completeness” checklist for new/updated profiles.  
- Grow knowledge edges until Low **L1** is closable or explicitly accepted with owners.  
- Target: all focus practitioners from HotDoc verify list authority-complete.

### Service authority growth

- Remaining services + independent-provider pages (pathology/radiology/pharmacy) clarity check.  
- Service Authority dashboard: no priority service in bottom quartile without a remediation ticket.  
- Target: **all primary clinical service hubs** authority-complete.

### Month 3 exit criteria

- [ ] 90-day analytics pack delivered  
- [ ] M4 closed or residual list ≤2 assets  
- [ ] M5 effectively closed (≤1 unmatched high-frequency)  
- [ ] Governance expiry cycle green  
- [ ] L1 reciprocity closed or accepted with named owner  
- [ ] Draft **Days 91–180** roadmap seeded from lessons  

---

## Workstream summary (RACI-style)

| Workstream | Primary owner | Platform support | Key artefacts |
| --- | --- | --- | --- |
| Analytics reviews | Practice management | Web platform | Executive / Conversion / DR dashboards; warehouse |
| Content reviews | Clinic ops | Web platform | Patient info + knowledge articles |
| Digital Reception optimisation | Clinic ops + platform | Web platform | Intent audit; DR dashboard |
| Conversion optimisation | Practice management | Web platform | Conversion Intelligence; HotDoc verify |
| Governance milestones | Clinical lead / practice mgmt | CMS governance | Publish registry; expiry report |
| Practitioner authority growth | Clinical lead | Web platform | Practitioner Authority dashboard; search-index |
| Service authority growth | Clinical lead | Web platform | Service Authority dashboard; service hubs |

---

## Backlog carry-in from L7 (must schedule)

| ID | Severity | Month to close | Workstream |
| --- | --- | --- | --- |
| **M5** | Medium | Month 1 (hard), Month 3 (final) | Digital Reception |
| **M4** | Medium | Month 2–3 | Content / Performance |
| **L1** | Low | Month 2–3 | Practitioner + Service authority |
| **L2** | Low | Month 1–2 (by design → published) | Governance |
| **L3** | Low | Month 2 plan / Month 3 if needed | Digital Reception / Performance |

---

## Success criteria (L8)

Documented roadmap for the first three months after launch — **this file**.

Operational success at Day 90:

1. Live analytics reviewed on a weekly cadence with warehouse-backed dashboards.  
2. Content and DR intents improved against unmatched and zero-result lists.  
3. Conversion decisions informed by placement and funnel data.  
4. Governance strips live for priority pages with an expiry habit.  
5. Practitioner and service authority coverage measurably higher than Day 0 baselines.

---

## Related documents

- `LAUNCH_CANDIDATE_AUDIT_L7.md` / `LAUNCH_CANDIDATE_SCORECARD_L7.json`  
- `ANALYTICS_VERIFICATION_L6.md`  
- `GOVERNANCE_PUBLICATION_CHECKLIST_L2.md`  
- `MOBILE_ACTION_HIERARCHY_L5.md`  
- `TRUST_STRIP_L3.md`  
- `HOTDOC_LIVE_VERIFY_L1.json`  
