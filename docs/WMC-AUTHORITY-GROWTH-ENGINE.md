# WMC Authority Growth Engine

**Permanent specification** for turning patient demand into governed authority improvements.

| Field | Value |
| --- | --- |
| Document | `docs/WMC-AUTHORITY-GROWTH-ENGINE.md` |
| Parent SSOT | [`WMC-MASTER-BRAIN.md`](./WMC-MASTER-BRAIN.md) |
| Decision | [`DEC-2026-13`](./WMC-DECISION-REGISTER.md#dec-2026-13) — adopted as the future authority optimisation framework |
| Status | **Accepted (specification)** — product code not required to land with this document |
| Last updated | 2026-11-03 |

**Reuses (do not replace):** `SearchDemandSignal`, Search & Content Opportunities, Practitioner Authority, Service Authority, Digital Reception, Practice Briefing, Recommended Actions, governance expiry.

**Does not create:** a new Insights nav module, a new `/admin/authority-growth` product route as first-class CMS module, new Prisma “queue” tables, AI-generated articles, or golden HTML redesign.

---

## 1. Purpose

Patients search the site (Digital Reception / on-site search). Gaps show up as no-result rates, thin practitioner/service pages, stale reviews, and weak internal links. Today those signals live across several Insights dashboards.

The **Authority Growth Engine** is the operational framework that:

1. Unifies those signals into one ranked **Authority Growth Queue**.
2. Scores each workable item with an **Authority Opportunity Score (AOS)**.
3. Drives **weekly / monthly / quarterly** authority work without inventing clinical ratings, testimonials, or vanity SEO spam.
4. Deep-links staff into the existing dashboard that can fix the item.

**Success looks like:** fewer no-result patient searches, Thin → Developing → Hub movement on high-demand entities, fresher governed pages, and more qualified booking/call next steps — measured with labelled proxies until HotDoc completion attribution exists.

Aligns with Master Brain authority-first strategy ([DEC-2025-02](./WMC-DECISION-REGISTER.md#dec-2025-02)) and Search & Content Opportunity Centre ([DEC-2026-09](./WMC-DECISION-REGISTER.md#dec-2026-09)).

---

## 2. Authority Growth Queue

The queue is a **composed backlog**, not a separate database entity.

```text
SearchDemandSignal + measurement events + search-index + ClinicalReview
        │
        ▼
Existing builders (SCO · PA · SA · Digital Reception · expiry)
        │
        ▼
buildAuthorityGrowthQueue (composer — future measurement helper)
        │
        ├── Practice Briefing → Top 5 Critical/High
        └── Search & Content Opportunities → Top 20 + CSV
```

Each **queue item** carries:

| Field | Meaning |
| --- | --- |
| `lane` | One of the six lanes (§3) |
| `entity` | Human label (normalised term, practitioner, service, page path, link pair) |
| `entityKey` | Stable id for dedupe (`term:adhd`, `practitioner:…`, `service:…`, `page:…`) |
| `aos` | Authority Opportunity Score 0–100 (§4) |
| `label` | `Critical` / `High` / `Plan` |
| `secondary_lanes` | Other lanes that also fired (tags) |
| `action` | Concrete next step for a practice manager / editor |
| `href` | Actionable deep link (§10) |
| `patient_impact_est` | Proxy (§9) |
| `booking_impact_est` | Proxy (§9) |
| `confidence` | `high` / `medium` / `low` from data source |

**Dedupe:** one `entityKey` appears once; keep highest AOS; attach other lanes as `secondary_lanes`.

**Clinic scope:** Active clinic from admin session (`editorContext` / active-clinic cookie). Signals and reviews already filter by `clinicId`.

---

## 3. Six Lanes

| # | Lane | Source rules | Primary action |
| --- | --- | --- | --- |
| 1 | **High-Demand Topics** | High search volume; usable journey (low–moderate no-result) | Strengthen hub article/service page; related practitioners; governed diagram only if already in corpus pipeline |
| 2 | **No-Result Searches** | No-result rate ≥ 35% and ≥ 5 searches (SCO “Low Coverage”) | Improve Digital Reception match + knowledge/service coverage; never invent clinical advice |
| 3 | **Thin Practitioner Authority** | PA `tier === "Thin"` (or Developing with high name-search demand) | Enrich profile overlays; inbound article/service links; booking path check (respect phone-only practitioners) |
| 4 | **Thin Service Authority** | SA `tier === "Thin"` + demand intent mapped to service | Related practitioners/knowledge; inbound article links; journey CTAs |
| 5 | **Content Review Due** | Governance expiry overdue or due within horizon | Clinical review → republish; protect trust strips |
| 6 | **Internal-Link Opportunities** | Hub with weak inbound **or** Thin entity with demand and low inbound article links | Add governed related links via overlay/CMS — not golden HTML rewrites |

Lane multipliers applied after base AOS (§4): No-Result ×1.10 · Thin PA/SA ×1.05 · Review Due ×1.00 · High-Demand ×0.95 · Internal-Link ×0.90.

---

## 4. Authority Opportunity Score

Composite score for ranking the unified Top 20. Extends Search & Content Opportunities term scoring with authority thinness, freshness, and coverage.

\[
AOS = \min(100,\ \mathrm{round}(0.30D + 0.25N + 0.20T + 0.15F + 0.10C))
\]

Then apply the lane multiplier and clamp to 0–100.

| Component | 0–100 definition | Primary source |
| --- | --- | --- |
| **D** Demand | `min(100, searches × k)` over selected range (default last_30); rising/new boost capped (+10) | `SearchDemandSignal` / SCO |
| **N** No-result | `noResultRate × 100` | SCO / Digital Reception |
| **T** Thinness | Thin=100, Developing=55, Hub=15; Hub + very low booking intent may boost (reuse Recommended Actions posture) | `authority-framework` / PA / SA |
| **F** Freshness risk | Overdue=100, due ≤60d=70, current=20 | ClinicalReview / SCO freshness |
| **C** Coverage gap | Inverse of graph density (related practitioners/services/inbound articles) | search-index related links |

**Labels**

| Label | AOS |
| --- | --- |
| Critical | ≥ 75 |
| High | 55–74 |
| Plan | 40–54 |
| Drop from Top 20 | &lt; 40 unless P0 governance expired |

---

## 5. Weekly Workflow

**Owners:** Content Editor (draft) · Clinic Admin (publish) · clinical sign-off for advice pages.  
**Surface:** Practice Briefing Top 5.

1. Monday — Open `/admin` Authority Growth strip; select ≤5 Critical/High items.
2. Prefer **No-Result** fixes that map to an existing page (Digital Reception index / related links) before drafting new articles.
3. Advance **one** Thin practitioner **or** Thin service enrichment (overlays only).
4. Clear overdue **Content Review Due** first when present (trust P0).
5. Friday — Re-check SCO + PA/SA; confirm worked intents are not rising in no-result volume.

**Exit criteria:** ≥3 items closed or waiting clinical review; no-result volume for worked intents not rising week-on-week.

---

## 6. Monthly Workflow

**Owners:** Clinic Admin + clinical reviewer.  
**Surface:** Search & Content Opportunities Top 20 + CSV export.

1. Export Top 20 CSV; review Highest Impact callout.
2. Target Thin → Developing for highest-demand practitioners/services.
3. Run an internal-link sprint on 1–2 Hub services (inbound article + practitioner links).
4. Confirm Insights data confidence (live signals vs demo); fix ingest if stuck on demo.
5. Plan clinical review capacity for the next month’s due/expiry cluster.

---

## 7. Quarterly Workflow

**Owners:** Network/Super Admin + clinical lead.

1. Choose 1–2 **Hub investment** themes from sustained High-Demand ∩ Thin Service overlap (authority-first — e.g. women’s health, skin, ADHD referrals).
2. Authority visuals only via the approved Phase corpus pipeline (one-diagram rules remain).
3. Audit Digital Reception intent coverage against ~90-day `SearchDemandSignal` retention.
4. Set next-quarter clinical review bandwidth; no vanity SEO metrics or star/testimonial work.

---

## 8. Top 20 Report

Weekly operator artifact (UI table + CSV). Default sort: AOS desc, then patient impact desc.

**Columns**

`rank | lane | entity | aos | label | demand | no_result_rate | authority_tier | freshness | coverage | patient_impact_est | booking_impact_est | confidence | action | href | secondary_lanes`

**Highest impact:** from the Top 20, take top 5 by  
`0.5 × normalised(patient_impact_est) + 0.5 × normalised(booking_impact_est)`, tie-break AOS.

**Placement (when implemented)**

| Surface | Content |
| --- | --- |
| Practice Briefing `/admin` | Top 5 + KPI chips; link to Top 20 |
| Search & Content Opportunities | Full Top 20 `#age-top20` + CSV download |
| CMS Modules | **No new Insights module** |

---

## 9. KPI Definitions

| KPI | Definition |
| --- | --- |
| Critical count | Queue items with label Critical |
| High count | Queue items with label High |
| No-result volume | Sum of no-result searches in range (SCO / signals) |
| Thin practitioners | PA rows with `tier === "Thin"` (optionally demand-filtered) |
| Thin services | SA rows with `tier === "Thin"` (optionally demand-filtered) |
| Reviews due | Overdue + due-within-horizon ClinicalReview pages |
| Opportunity queue depth | Items with AOS ≥ 40 (or Critical/High/Plan) |
| Confidence | `high` = live SearchDemandSignal + measurement events; `medium` = events-only; `low` = demo_signals |

**Impact proxies (always labelled estimates — not clinical outcomes or guaranteed bookings)**

| Metric | Formula |
| --- | --- |
| Estimated patient impact | `searches × noResultRate × 0.6` (+ thin profile-view term when applicable) |
| Estimated booking impact | `searches × 0.08` upper-bound HotDoc-start proxy **or** booking-intent gap vs tier expectation |

True HotDoc completion attribution remains a future partner/API dependency (Master Brain §20).

---

## 10. Deep-Link Rules

All Growth Queue `href`s must be **actionable** — they must pass the same posture as `isActionableRecommendationHref` (focus / intent / queue / hash — not bare dashboard homes).

| Lane | Target pattern |
| --- | --- |
| High-Demand / No-Result (term) | `/admin/search-opportunities?range=…#sco-queue` or `#sco-noresult`; add Digital Reception intent when known |
| No-Result (intent) | `/admin/digital-reception?intent={bucket}&range=…` |
| Thin Practitioner | `/admin/practitioner-authority?focus={slug}&range=…` |
| Thin Service | `/admin/service-authority?focus={slug}&range=…` |
| Content Review Due | `/admin/governance/expiry` |
| Internal-Link | Focused PA/SA page for the entity needing inbound links |

Preserve Insights persona / range / data-mode query params via existing `withInsightsQuery` helpers when navigating from Practice Briefing.

Recommended Actions (P0–P2) remain the **ops prompt** layer; the Growth Queue is the **scored backlog**. Cross-link; do not merge models.

---

## 11. Privacy Rules

1. Dashboards and the Growth Queue show **normalised terms** and **intent buckets** only — not raw free-text queries as a primary field.
2. `SearchDemandSignal` retention remains ~90 days; purpose = practice content planning, **not** clinical records.
3. Measurement outbound payloads must continue to strip raw `query` / `raw_query` (site measurement + sanitize defence-in-depth).
4. Access gated by Insights permissions (`manage_settings` for opportunity surfaces; clinical_signoff where governance queues require it).
5. Demo/sample datasets must be labelled in UI; never silently presented as live patient demand.
6. No export of resume files, FormRequest PII, or clinical content through the Growth CSV — CSV is opportunity metadata only.

Reuse the SCO privacy posture string (or equivalent) on any Growth UI chrome.

---

## 12. Future Implementation Notes

Specification is authoritative now; product code may follow without changing this intent.

| Allowed when coding | Forbidden |
| --- | --- |
| `buildAuthorityGrowthQueue` composer under `apps/web/src/measurement/` | New `CMS_MODULES` Insights entry / first-class `/admin/authority-growth` module |
| UI slices on Practice Briefing + Search Opportunities | New Prisma queue table for backlog state |
| `authorityGrowthQueueToCsv` + `/api/admin/exports/authority-growth` | AI auto-drafting public articles from gaps |
| Intent↔service static map in composer | Editing golden HTML for link sprints |
| Unit tests for AOS / lanes / dedupe | Claiming HotDoc completions without partner attribution |

**Suggested rollout**

1. Docs (this file) — **done**.  
2. Composer + tests.  
3. Top 20 on Search Opportunities + CSV.  
4. Practice Briefing Top 5 strip.  
5. Cadence dry-run with Practice Manager.  
6. Prefer live signals when present; label demo clearly.

**Related code today (inputs only)**

- `apps/web/src/measurement/search-opportunity-report.ts`
- `apps/web/src/measurement/authority-framework.ts`
- `apps/web/src/measurement/practitioner-authority-report.ts` / `service-authority-report.ts`
- `apps/web/src/measurement/digital-reception-report.ts`
- `apps/web/src/measurement/recommended-actions.ts`
- `apps/web/src/cms/practice-operations-dashboard.ts`
- `apps/web/src/app/admin/(dashboard)/page.tsx` (Briefing assembler)

---

## Document history

| Date | Change |
| --- | --- |
| 2026-11-03 | Initial permanent specification; DEC-2026-13 accepted. |
