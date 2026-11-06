# Recruitment Credibility Sprint — Final Report

**Date:** 2026-11-05  
**Scope:** Trust, proof, consistency only — no redesign, no new funnel sections beyond the Commercial FAQ already shipped as Priority 3.  
**SSoT:** `apps/web/src/recruitment/offer-config.ts` · `apps/web/src/recruitment/contact.ts` · `apps/web/src/recruitment/commercial-faq.ts`

---

## Sprint task status

| # | Task | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Remove contradictory remuneration | **PASS** | Vacancy sanitiser drops `$250` / unverified guarantees; seed cleaned; live Opp/Join show no `$250` |
| 2 | Synchronise remuneration with Offer Config | **PASS** | Join commercial card, FAQ answers, featured pills, vacancy meta all read `WMC_RECRUITMENT_OFFER` |
| 3 | Remove unsupported “less than one month” claims | **PASS** | `typicalBusyListWindow` removed; replaced with Established Patient Demand + `70,000+` files |
| 4 | Add Commercial FAQ | **PASS** | `#understanding-the-opportunity` — eight practical GP questions from offer/contact SSoT |
| 5 | Replace image–caption mismatch | **PASS** | Fake “Reception” (`clinic-reception.png`) and credibility-risk exterior removed from Join |
| 6 | Simplify Express Interest | **PASS** | Named contact → confidentiality → short form → submit; side-nav / explore / readiness / sticky stripped |
| 7 | Audit unsupported claims | **PASS** | Soft mentoring/CPD/philosophy claims rewritten to operational facts; open hourly guarantee remains empty |
| 8 | Philosophy → operational evidence | **PASS** | Hero, differentiator, fit cards, support cards, GP Opportunities “how we practise” cite files/rooms/nurses/HotDoc |
| 9 | Centralised contact on every recruitment page | **PASS** | Contact module (+ confidentiality) on Join, Opportunities, FAQ, EOI, Opportunity Pack, Practice Support |
| 10 | Final consistency report | **PASS** | This document + `docs/WMC-RECRUITMENT-CONSISTENCY-REPORT.md` |

---

## Canonical facts (must match everywhere)

| Fact | Value |
| --- | --- |
| Billings | **70%** (70/30), negotiable |
| Hourly guarantee | **None published** (`hourlyGuarantee` empty) |
| Active patient files | **70,000+** |
| Consult rooms | **11** |
| GPs / Nurses | **10 / 3** |
| AGPAL | Yes |
| Address | 468 Vulture Street, Woolloongabba QLD 4102 |
| Recruitment contact | **Roshan Samarawickrema · Practice Operations** |
| Confidentiality | Enquiry reviewed only by WMC recruitment representatives; no employer contact; no CV for first discussion |

---

## Funnel map (VR GP 30-second test)

| Question | Where answered | Conflict risk |
| --- | --- | --- |
| What is the opportunity? | Join hero + Current Opportunities + Opportunities pack | Low — CMS vacancies sanitised |
| How does remuneration work? | Commercial card + Commercial FAQ + GP FAQ | Low — Offer Config only |
| What support exists? | Support cards + Commercial FAQ + Practice Support | Low — nurse/room counts from SSoT |
| How is demand generated? | Why Demand Exists + Established Patient Demand | Low — no “&lt; 1 Month” claim |
| Who to contact? | Contact module on every recruitment page | Low — `contact.ts` |
| How is confidentiality protected? | Confidentiality panel on Join, EOI, and shared inject | Low — same copy module |

---

## Live verification matrix (UAT `127.0.0.1:3100`)

| Page | `$250` / 1-month claim | 70% where expected | Contact | Confidentiality | Notes |
| --- | --- | --- | --- | --- | --- |
| Join Our Team | Absent | Present | Present | Present | Commercial FAQ + verified photos |
| GP Opportunities | Absent | Present | Present | Present (inject) | Vacancy bullets sanitised |
| GP FAQ | Absent | Present (SSoT answers) | Present | Present (inject) | EV promote required after FAQ source edits |
| Express Interest | N/A | N/A | Present | Present | Focus stack only |
| Opportunity Pack | Absent | N/A | Present | Present (inject) | No pay claims |
| Practice Support | Absent | N/A | Present | Present (inject) | Rooms/nurses from offer |

---

## Files touched this sprint (cumulative)

### Offer / contact SSoT
- `apps/web/src/recruitment/offer-config.ts` (+ sanitiser, demand helpers)
- `apps/web/src/recruitment/commercial-faq.ts`
- `apps/web/src/recruitment/contact.ts` (unchanged identity; used everywhere)
- `apps/web/src/recruitment/index.ts`

### Presentation
- `apps/web/src/documents/join-our-team-recruitment.ts` (landing, EOI focus, photos, operational copy)
- `apps/web/src/documents/public-ux.ts` (contact + confidentiality inject; EOI refine)
- `apps/web/src/cms/careers-vacancies.ts` (remuneration sanitise)

### Attraction content / render
- `apps/web/src/attraction-cms/content/gp-faq.ts`
- `apps/web/src/attraction-cms/content/gp-opportunities.ts`
- `apps/web/src/attraction-cms/content/index.ts`
- `apps/web/src/attraction-cms/render/tool-pages.ts` (EOI + Practice Support)
- `apps/web/src/attraction-cms/render/pack-pages.ts`
- `apps/web/src/attraction-cms/journey-questions.ts` (EOI quiet copy)

### Seeds / ops
- `apps/web/scripts/seed-careers-vacancies.ts`
- `apps/web/scripts/promote-ev-local.ts`

### Docs / tests
- `docs/WMC-RECRUITMENT-CONSISTENCY-REPORT.md`
- `docs/WMC-RECRUITMENT-CREDIBILITY-SPRINT.md` (this file)
- `docs/WMC-RECRUITMENT-AUDIT-CHECKLIST.md`
- Matching `*.test.ts` files

---

## Remaining operator actions (not code blockers)

1. **Admin vacancies:** Prefer blank GP `remunerationNote`; never type `$250` or alternate % — public render sanitises, but CMS preview can still show raw fields.
2. **EV promote on ship host:** After merge, re-promote FAQ/Opportunities so production PageRevisions match source SSoT (laptop UAT already promoted locally).
3. **Real interior photography:** Add consented reception / consult / nursing stills when available; do not caption exteriors as interiors.
4. **Clinical software product name:** HotDoc is public; EMR product name still shared in confidential discussion only (no invented brand).

---

## Success criteria verdict

**GO for credibility on laptop UAT / `next.` tunnel.**

An experienced VR GP can learn opportunity shape, 70% billings model, nursing/rooms support, demand from `70,000+` files, Roshan as contact, and confidentiality rules **without encountering competing remuneration claims, fake reception captions, or “&lt; 1 Month” list promises** in the Join → Opportunities → FAQ → Express Interest path.

Cutover to apex production remains gated by `deployment/LAUNCH.md` ops (separate from this sprint).
