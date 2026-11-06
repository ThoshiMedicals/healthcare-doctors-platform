# GP Attraction — Production Gap Report & Go-Live Recommendation

**Date:** 2026-11-04  
**Role:** GP Attraction platform lead  
**Evidence base (aggregated):**  
1. Employer-brand review (trust 72 / authenticity 58 / employer-brand 68)  
2. SEO & security launch readiness (`issues_overview_report_3.csv` + live header probe)  
3. Live UAT inspection (`:3100` / `next.`)  
4. Release / cutover working memory (`LAUNCH.md` ops NO-GO)  

**Note:** Formal multi-role stakeholder scorecards from the Review Pack are **not yet returned**. Frequency below = number of independent evidence sources (max 4) that flag the item. Re-run this report after pack completion.

**Scope:** Production readiness only. No new modules.

---

## Go-live recommendation

### **HOLD — Attraction not ready for public production**

| Gate | Verdict |
| --- | --- |
| Attraction content authenticity | **HOLD** — concept photography; no consented voices; Flexible Sessions unfinished visually |
| Attraction SEO index flip | **HOLD** — keep `noindex` until Index Gate + photography/sign-off |
| Security (CSP enforce) | **HOLD** — Report-Only OK for UAT; enforce after clean reports on real host |
| Site-wide DNS / VPS cutover | **NO-GO** — separate ops blockers (unchanged) |

**Recommended next:** Run Stakeholder Review Pack → close **P0** sprint → re-score → then decide Attraction soft-launch (`noindex`) vs selective index.

**Do not:** Flip Attraction pages to `index,follow`, expand sitemap for Attraction, or treat concept imagery as final.

---

## Classification key

| Priority | Meaning |
| --- | --- |
| **P0** | Blocks public Attraction production (or creates hard-stop reputation/ops risk) |
| **P1** | Required before selective index / confident stakeholder demo close-out |
| **P2** | Production polish; can follow first Attraction soft-launch if P0/P1 clear |

| Field | Scale |
| --- | --- |
| Frequency | 1–4 evidence sources |
| Severity | Critical · High · Medium · Low |
| Cost | **S** &lt;1 day · **M** 1–5 days · **L** &gt;1 week / shoot / ops campaign |

---

## 1. Final production-gap findings

### P0

| ID | Finding | Freq | Severity | Cost | Recommendation |
| --- | --- | --- | --- | --- | --- |
| P0-1 | **Concept / non-WMC photography** on Join, Catchment, Opportunities, PE feature & chapters | 3 | Critical | L | Replace with approved WMC photography before public Attraction. Written interim-only exception requires owner sign-off + expiry date. |
| P0-2 | **No consented GP/nurse/reception voices** (composites correctly suppressed → silence) | 3 | Critical | M–L | Capture 3–5 consented quotes; place on PE + Opportunities. Do not invent composites for production. |
| P0-3 | **Flexible Sessions chapter has no image** after AI-placeholder suppress | 2 | High | S–M | Add approved still **or** intentional non-image treatment so chapter does not read unfinished. |
| P0-4 | **Attraction Index Gate undecided**; EV hard-codes `noindex,nofollow` / `indexable: false` | 2 | Critical | S | Explicit decision: Soft-launch stay-noindex **or** Selective index list. Do not index by accident. |
| P0-5 | **EOI operational ownership** not evidenced for production (who reads, SLA) | 2 | Critical | S | PM written ownership + mailbox/process before public EOI traffic. |
| P0-6 | **DNS / VPS / backup / CF Full(strict) cutover NO-GO** | 2 | Critical | L | Attraction publish ≠ site cutover. Keep Attraction on UAT/`next.` until `LAUNCH.md` ops pass — or soft-publish only behind existing production constraints with ops sign-off. |

### P1

| ID | Finding | Freq | Severity | Cost | Recommendation |
| --- | --- | --- | --- | --- | --- |
| P1-1 | Product residue in `<title>`: “Clinical Interests **Framework**”, “Local Continuity **Network**” | 2 | High | S | Practice-language titles/meta only (no IA/URL change). |
| P1-2 | **Numeric readiness tools** feel like internal assessment (0–30 spinbuttons) on public path | 2 | High | S | Soft-hide from primary nav/demo path or demote; keep deep-link optional. No new module. |
| P1-3 | Continuity / Clinical Interests / Support / Registrar / FAQ **logo-only** imagery | 2 | Medium | M | One practice still each (reuse approved library) before index. |
| P1-4 | Sitemap lists only `join-our-team.html`; other Attraction paths absent | 2 | High | S | After Index Gate: controlled approved-sitemap add for indexable paths only; tools/EOI never. |
| P1-5 | CSP still **Report-Only** (SF “missing CSP”) | 2 | Medium | S–M | Collect clean reports on production-like host; then `CSP_REPORT_ONLY=false`. |
| P1-6 | PE chapter JPGs **122–146 KB** (SF over-100 KB) | 2 | Medium | S | Re-encode / WebP ≤100 KB; keep width/height. |
| P1-7 | Stakeholder Review Pack **not yet run** with owners/PM/nurses/reception/external GP | 1 | High | S | Facilitate pack; replace this proxy aggregation with scored consolidation. |

### P2

| ID | Finding | Freq | Severity | Cost | Recommendation |
| --- | --- | --- | --- | --- | --- |
| P2-1 | Aria “Practice experience **modules**” | 1 | Low | S | Rename to practice language (“chapters”). |
| P2-2 | HTML comments “Temporary concept photography…” | 2 | Low | S | Strip before any view-source stakeholder handoff. |
| P2-3 | `renderStoryFigure()` omits width/height | 1 | Low | S | Add dimensions if helper reused. |
| P2-4 | SF HSTS / Referrer-Policy **1-URL outliers** | 1 | Low | S | Confirm asset/edge URL classes; HTML already sends headers. |
| P2-5 | Opportunity-pack thin-content index risk | 1 | Low | S | Prefer `noindex` or index only after pack substance check. |
| P2-6 | Alt re-validation after photography swap | 1 | Low | S | Re-crawl; trim &gt;100 char alts. |

---

## 2. Sprint backlog (production readiness only)

### Sprint A — Authenticity hard stops (target before stakeholder close-out)

| # | Backlog item | Pri | Cost | Owner suggestion | Done when |
| --- | --- | --- | --- | --- | --- |
| A1 | Commission / select approved WMC photos for Join, Catchment, Opportunities, PE feature | P0 | L | Owner + PM | Assets approved; concept crops retired on those slots |
| A2 | Fill Flexible Sessions visual gap | P0 | S–M | PM + design | Chapter not empty |
| A3 | Consent + publish 3–5 real voices on PE + Opportunities | P0 | M–L | Principal + PM | Quotes live; composites stay off |
| A4 | Document EOI reader + response expectation on/near EOI page (ops fact, not new module) | P0 | S | PM | Written + reflected in page honesty if needed |
| A5 | Run Stakeholder Review Pack; consolidate must-fixes | P1 | S | Facilitator | Signed score summary |

### Sprint B — Index & residue cleanup (before selective index)

| # | Backlog item | Pri | Cost | Owner suggestion | Done when |
| --- | --- | --- | --- | --- | --- |
| B1 | Fix Framework / Continuity Network titles + meta | P1 | S | Eng | Titles practice-language |
| B2 | Demote readiness tools from primary attraction path | P1 | S | Eng + PM | Demo path clean |
| B3 | Light stills for Continuity + Clinical Interests (+ Support if indexing) | P1 | M | PM | No logo-only story pages in index set |
| B4 | Record Index Gate decision; implement robots + sitemap only for approved set | P0/P1 | S | Eng + SEO | Decision logged; UAT/prod robots match intent |
| B5 | Compress PE chapter images | P1 | S | Eng | ≤100 KB or WebP |
| B6 | Strip concept-photo HTML comments; aria modules rename | P2 | S | Eng | Clean view-source |

### Sprint C — Host security (parallel; not Attraction-content)

| # | Backlog item | Pri | Cost | Owner suggestion | Done when |
| --- | --- | --- | --- | --- | --- |
| C1 | CSP report window then enforce on production host | P1 | M | Eng + ops | Enforcing CSP header |
| C2 | Close HSTS/Referrer outliers; CF Full(strict) per LAUNCH | P0 ops | L | Ops | Cutover checklist items green |
| C3 | Off-box backup + smoke log | P0 ops | L | Ops | LAUNCH evidence PASS |

**Out of scope (explicit):** new modules, new tools, IA redesign, gallery layouts, recruitment microsite expansion.

---

## 3. Go-live recommendation (detail)

### Attraction public production

| Option | When allowed |
| --- | --- |
| **A. Stay UAT-only** (current) | Default until Sprint A P0 closed + stakeholder mean ≥70 with no hard stop |
| **B. Soft-launch on apex `noindex`** | P0-1 interim exception signed **or** real photos live; P0-2 voices in progress with date; P0-5 EOI owned; still `noindex` |
| **C. Selective index** | Sprint A+B done; Index Gate signed; sitemap updated; stakeholder band ≥85 or Conditional with empty must-fix list |
| **D. Full site DNS cutover** | Independent — **NO-GO** until LAUNCH ops evidence (not unblocked by Attraction content work) |

### Platform lead decision (today)

**HOLD.**  
Ship nothing Attraction-indexed. Keep `next.` noindex isolation. Complete Sprint A authenticity P0s and the Stakeholder Review Pack before reconsidering soft-launch.

### Re-evaluation trigger

After Sprint A + pack consolidation: update frequency from real role scores; re-issue this report; then choose A/B/C above.

---

## Appendix — Evidence map

| Source | Contribution |
| --- | --- |
| Employer-brand review | P0-1, P0-2, P0-3, P1-1, P1-2, P1-3, P2-1, P2-2 |
| SEO/security readiness | P0-4, P1-4, P1-5, P1-6, P2-3, P2-4, P2-5, P2-6 |
| Live UAT | P0-3, titles, Flexible Sessions empty, robots meta |
| Release working memory / LAUNCH | P0-5 (ops posture), P0-6 |

Interactive summary: canvas `attraction-production-gap-golive`.
