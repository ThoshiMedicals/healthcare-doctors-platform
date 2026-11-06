# WMC Recruitment Consistency Report

**Date:** 2026-11-05  
**SSoT:** `apps/web/src/recruitment/offer-config.ts` (`WMC_RECRUITMENT_OFFER`)  
**Scope:** Join Our Team, GP Opportunities, GP FAQ, Express Interest, Opportunity Pack, Practice Support, future recruitment pages (vacancy inject + EV packs)

## Canonical offer facts

| Fact | Verified value |
| --- | --- |
| Billings | 70% (70/30), negotiable |
| Hourly guarantee | *(empty — must not be claimed)* |
| Active patient files | 70,000+ |
| Consult rooms | 11 |
| GPs / Nurses | 10 / 3 |
| AGPAL | Yes |
| Location | Woolloongabba, Brisbane · 468 Vulture Street, Woolloongabba QLD 4102 |

---

## 1. Contradictions found

| # | Surface | Contradiction vs SSoT | Severity | Resolution |
| --- | --- | --- | --- | --- |
| C1 | GP Opportunities (live DB vacancy inject) | Offer highlights showed **Guaranteed $250 per hour for first 3 months** and **70% of billings after guarantee period** while `hourlyGuarantee` is empty | Critical | Render sanitiser strips unverified guarantees; seed + live vacancy highlights refreshed from `offerFeaturedHighlights()` |
| C2 | Vacancy seed `scripts/seed-careers-vacancies.ts` | Hard-coded `$250` guarantee would reintroduce C1 on reseed | Critical | Seed now spreads `offerFeaturedHighlights()` — no hard-coded remuneration |
| C3 | GP FAQ (live PageRevision) | Still published old “no headline percentage / no public rate card only” billing answers — **no 70%** — while source modules already used `offerFaqBillingAnswer()` | Critical | Re-seed Attraction packs + EV promote so FAQ HTML matches offer config |
| C4 | Vacancy card renderer | CMS `remunerationNote` / `offerHighlights` could publish any commercial claim without checking SSoT | High | `sanitizeVacancyOfferHighlights` + `resolvePublicRemunerationNote` — GP cards only emit verified offer facts |
| C5 | Content index FAQ summary | Said “no public earnings claims” while SSoT now publishes 70% billings | Medium | Summary updated to “commercial facts only from Recruitment Offer Config” |
| C6 | GP Opportunities “cannot” list | Allowed “earnings beyond what an active advertised role states” — roles could invent beyond SSoT | Medium | Bound to “beyond the published Recruitment Offer Config” |
| C7 | Practice Support / Opportunities pack pillars | Scale (rooms/nurses) and AGPAL wording not always read from offer config | Low | Wired to `WMC_RECRUITMENT_OFFER` |

**Not contradictions (verified aligned or non-commercial):**

- Join Our Team landing (`join-our-team-recruitment.ts`) — already offer-config driven; no `$250`.
- Express Interest — no remuneration claims.
- Opportunity Pack — no remuneration claims (qualitative / advisory).
- Practice Support “training guarantee” disclaimer — boundary language, not a pay guarantee.
- Provider-number “we do not guarantee” — Medicare boundary, not remuneration.

---

## 2. Files modified

| File | Change |
| --- | --- |
| `apps/web/src/recruitment/offer-config.ts` | Added `offerPublicRemunerationNote`, `sanitizeVacancyOfferHighlights`, `resolvePublicRemunerationNote` |
| `apps/web/src/recruitment/index.ts` | Re-exports new helpers |
| `apps/web/src/recruitment/offer-config.test.ts` | Sanitiser / remuneration tests |
| `apps/web/src/cms/careers-vacancies.ts` | Vacancy cards sanitise remuneration + highlights against SSoT |
| `apps/web/src/cms/careers-vacancies.test.ts` | Assert `$250` stripped from public HTML |
| `apps/web/scripts/seed-careers-vacancies.ts` | GP highlights from `offerFeaturedHighlights()`; location/clinic from offer |
| `apps/web/src/attraction-cms/content/gp-faq.ts` | Autonomy / AGPAL / parking answers use offer street + AGPAL flags |
| `apps/web/src/attraction-cms/content/gp-opportunities.ts` | Facilities + cannot-approve bound to offer config |
| `apps/web/src/attraction-cms/content/index.ts` | FAQ summary aligned with published 70% model |
| `apps/web/src/attraction-cms/render/tool-pages.ts` | Practice Support rooms/nurses/AGPAL from offer |
| `apps/web/src/attraction-cms/render/pack-pages.ts` | Fit pillars autonomy/location from offer |
| `apps/web/scripts/promote-ev-local.ts` | `seedPacks: true` so local promote refreshes FAQ/opportunities drafts |
| `docs/WMC-RECRUITMENT-CONSISTENCY-REPORT.md` | This report |
| `docs/WMC-RECRUITMENT-AUDIT-CHECKLIST.md` | Cross-link / checklist refresh |

---

## 3. Remaining manual content requiring review

| Item | Why manual | Owner action |
| --- | --- | --- |
| Admin vacancy `remunerationNote` / `offerHighlights` in production CMS | Operators can still type free text; public render now sanitises, but admin preview should prefer SSoT defaults | Prefer leaving remuneration blank for GPs (renderer supplies offer) or paste `70% billings (negotiable)` only |
| Featured vacancy title / copy in live DB | Seed key may not match a renamed featured row; sanitiser covers commercial lines but narrative copy is CMS-owned | Confirm featured GP vacancy text has no alternate % or guarantee wording |
| Opportunity Pack / Catchment / Clinical Interests qualitative packs | No remuneration; still say “no invented earnings” in places — intentional | Leave unless product wants explicit 70% cross-links |
| Nursing / reception support FAQ answers | Qualitative; do not cite nurse count yet | Optional: add `${nurses}` from offer if operators want numeric consistency |
| Future recruitment pages | Any new EV pack or static HTML must import offer helpers — do not hard-code % / $ / guarantees | Gate in PR review against this report |
| Production PageRevision promote | Laptop UAT promote ≠ production VPS until `LAUNCH.md` cutover | Re-run EV promote on the ship host after merge |

---

## Live verification (2026-11-05, post UAT rebuild)

| Page | `$250` / unverified guarantee | SSoT 70% where expected | Notes |
| --- | --- | --- | --- |
| Join Our Team | Absent | Present (70%, 70/30, negotiable) | Offer-config landing |
| GP Opportunities | Absent | Present | Vacancy highlights sanitised + pack commercial section |
| GP FAQ | Absent | Present (`offerFaqBillingAnswer`) | EV re-promote applied |
| Express Interest | Absent | N/A (no remuneration) | Correct — no commercial claims |
| Opportunity Pack | Absent | N/A (no remuneration) | Correct — qualitative pack |
| Practice Support | Absent | N/A | Rooms/nurses from offer; no pay claims |
| `next.` FAQ / Opportunities | Absent / 70% present | Aligned with local UAT | Tunnel reflects this machine |

---

## Enforcement rule (ongoing)

1. Change commercial facts **only** in `offer-config.ts`.  
2. Public vacancy HTML must go through `sanitizeVacancyOfferHighlights` / `resolvePublicRemunerationNote`.  
3. After editing `gp-faq.ts` / `gp-opportunities.ts`, seed packs + promote EV before claiming live consistency.  
4. Empty `hourlyGuarantee` ⇒ **zero** public `$/hr` or “guaranteed for N months” claims.
