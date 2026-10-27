# Platform Readiness Audit (PROMPT 3H)

**Assessment date:** 2026-10-26 (Australia/Brisbane)  
**Scope:** Woolloongabba Medical Centre patient website + CMS measurement / governance layer  
**Golden source:** `old-html/`  
**Published runtime:** `apps/web/public/`  
**CMS app:** `apps/web/`

## Production Readiness Score

| Metric | Value |
| --- | --- |
| **Production Readiness Score** | **72 / 100** |
| Domain average (11 areas × 0–10) | 8.0 / 10 |
| Critical open issues | 1 |
| High open issues | 2 |
| Medium open issues | 5 |
| Low open issues | 4 |
| Automated checks this audit | Measurement 3A–3F + governance 2H/3G + SEO launch: **pass**; golden-master DR/search-index: **fail** (manifest drift); import-validation snapshot: **passed: false** |

### Score method

1. Score each domain 0–10 from evidence (Ready ≈ 9–10, Partial ≈ 6–8, Blocked ≤ 5).  
2. Convert the domain average to a 0–100 base.  
3. Subtract: Critical −15 · High −5 · Medium −2 · Low −0.5 (capped at 0).  
4. Result: \(80 - 15 - 10 - 10 - 2 = 72\).

---

## Go Live Recommendation

### **CONDITIONAL — not clear to ship**

Do **not** cut over to production until every **Critical** and **High** item below is closed and re-checked. Medium items may ship with a dated follow-up plan; Low items are backlog.

| Gate | Required before go-live |
| --- | --- |
| HotDoc practitioner deep-links | Live Dashboard / lightbox confirmation for each practitioner in `PRACTITIONER-HOTDOC-ROUTES.json` |
| Search-index manifest sync | `apps/web/public/search-index/manifest.json` matches golden (restore 3 patient-page routes) |
| Navigation ownership | Close 6 article ownership gaps; import validation `passed: true` |
| Digital Reception coverage | Re-run Playwright 49-case matrix at 1440 / 390 / 320 |
| Regression | `golden-master` Digital Reception / search-index test green |

**Recommended cutover stance after gates:** Go live with governance public stamps still fail-closed (empty `governance-published.js`) and analytics on fixture feed until the warehouse file is connected — both are acceptable for launch if documented.

---

## Domain scorecard

| Domain | Status | Score | Notes |
| --- | --- | --- | --- |
| Digital Reception | Partial | 8 | Scripts synced; 49-case matrix defined; public manifest missing 3 patient routes used by search/DR |
| Search | Partial | 7 | 14 shards + alias inventory; manifest catalog/routes drifted (203 vs 206) |
| Authority Graph | Ready | 8 | Hub / Developing / Thin for practitioners + services; related graph populated |
| Booking Paths | Partial | 7 | CTAs + HotDoc widgets present; practitioner deep-links not live-verified |
| Analytics | Partial | 8 | 2G + sanitize + dashboards 3A–3F; warehouse feed not connected |
| Governance | Ready | 9 | Fail-closed public fields; management + expiry reporting (3G / 2H) |
| Mobile UX | Ready | 9 | Viewport, mobile header Call/Book, persistent dock, DR mobile layout |
| Accessibility | Ready | 8 | Skip link, aria labels, focus-visible; no formal contrast scorecard |
| Page Performance | Partial | 7 | WebP posters in HTML; large PNG sources remain; DR index fallback ~1 MB |
| Internal Links | Partial | 8 | No missing href targets in import; 6 articles missing navigation ownership |
| Structured Data | Ready | 9 | 208 pages / 607 JSON-LD blocks / 0 invalid; SEO launch tests pass |

---

## Issues by severity

### Critical

| ID | Domain | Issue | Evidence |
| --- | --- | --- | --- |
| C1 | Booking Paths | Practitioner HotDoc deep-links are inventory-preserved only — must be verified in HotDoc Dashboard / live lightbox before public deployment | `old-html/qa/PRACTITIONER-HOTDOC-ROUTES.json` (`note`, per-practitioner `clinical_source`) |

### High

| ID | Domain | Issue | Evidence |
| --- | --- | --- | --- |
| H1 | Search / Digital Reception | Public `search-index/manifest.json` missing routes/catalog entries for `assignment-of-benefit.html`, `identifying-hotdoc-scam-messages.html`, `recalls-and-reminders.html` (golden 206 vs public 203) | Manifest diff; `golden-master.test.ts` failure: `search-index/manifest.json: bytes differ` |
| H2 | Internal Links | Six knowledge articles missing navigation ownership metadata; import validation `passed: false` | `apps/web/reports/import-validation.json` → `navigationOwnership.missingInOwnership` |

### Medium

| ID | Domain | Issue | Evidence |
| --- | --- | --- | --- |
| M1 | Digital Reception | 49-case Playwright coverage gate not re-executed in this audit | `old-html/cms/tools/check_digital_reception_coverage.py` |
| M2 | Analytics | No `apps/web/data/measurement-events.json` — admin dashboards fall back to fixture sample feed | `apps/web/src/measurement/event-source.ts` |
| M3 | Accessibility | No formal WCAG contrast measurement report in the QA set | Absence vs size/UI notes in `VISUAL_QA_UI_CONSISTENCY_AUDIT_2026-10-08.md` |
| M4 | Page Performance | Large PNG poster sources remain beside WebP (HTML prefers WebP) | `apps/web/public/assets/patient-information/*.png` |
| M5 | Digital Reception / Search | Some patient-intent phrases still unmatched in intent audit (`mode=none`) | `.tmp-pdf-convert/intent-audit.txt` |

### Low

| ID | Domain | Issue | Evidence |
| --- | --- | --- | --- |
| L1 | Authority Graph | Doctor → knowledge related edges not fully reciprocal | Search-index related analysis |
| L2 | Governance | Clinical public stamps intentionally empty until private approval | `governance-published.js` = `{}` |
| L3 | Page Performance | `digital-reception-index.js` large compatibility corpus (legacy/offline fallback only) | `apps/web/public/digital-reception-index.js` |
| L4 | Analytics | Untracked `apps/web/public/index.html` diverges from golden script tags (Next serves imported golden HTML for pages) | File presence vs golden `index.html` |

---

## Domain evidence detail

### 1. Digital Reception — 8/10 Partial

- **Pass:** `digital-reception.js` / `digital-reception-index.js` present in golden and public; import report `pagesWithScript: 208`, manifest copied.  
- **Pass:** Coverage matrix 49 cases / topics with expected target files under `old-html`.  
- **Fail (H1):** DR/`knowledge-search` load `search-index/manifest.json` first — public routes omit three patient-information pages shipped in golden.  
- **Open (M1):** Live Playwright matrix not re-run this audit.

### 2. Search — 7/10 Partial

- **Pass:** Shard files present; alias inventory (`search-alias-inventory.js`) + `knowledge-search.js` fallback.  
- **Fail (H1):** Catalog/routes count mismatch (206 vs 203).  
- **Fail:** Golden-master regression on manifest bytes.

### 3. Authority Graph — 8/10 Ready

- **Pass:** `authority-framework.ts` Hub (≥40) / Developing (≥14) / Thin; practitioner + service loaders.  
- **Pass:** Admin dashboards 3D / 3E + tests pass; related links populated on doctor/service shards.  
- **Note (L1):** Some one-way knowledge edges remain.

### 4. Booking Paths — 7/10 Partial

- **Pass:** Clinic HotDoc lightbox CTAs (header / dock / mobile); measurement placements including `digital_reception`.  
- **Pass:** Reception-only policy preserved for Dr Mary Abadir (tel CTA).  
- **Fail (C1):** Live HotDoc verification outstanding per QA inventory.

### 5. Analytics — 8/10 Partial

- **Pass:** Measurement 2G events; sanitize strips raw queries; 14-day local debug retention contract.  
- **Pass:** Practice dashboards Executive, Digital Reception, Practitioner Authority, Service Authority, Conversion Intelligence (3B–3F) + tests.  
- **Open (M2):** Warehouse file not connected — fixtures only until ops wiring.

### 6. Governance — 9/10 Ready

- **Pass:** Fail-closed `toPublicGovernanceFields`; empty published bundle until approval.  
- **Pass:** Expiry report + Governance Management (3G) totals, breakdowns, monthly workload.  
- **Note (L2):** No public Reviewed By / Next Review stamps yet (by design).

### 7. Mobile UX — 9/10 Ready

- **Pass:** Viewport meta; mobile header Call/Book; persistent care actions + safe-area; DR panel offset above dock on small screens.

### 8. Accessibility — 8/10 Ready

- **Pass:** Skip link to `#main`; aria labels on primary controls; `:focus-visible` outlines; accessibility regression in publish-render tests.  
- **Open (M3):** Formal contrast scorecard not in repo QA.

### 9. Page Performance — 7/10 Partial

- **Pass:** Patient HotDoc posters referenced as WebP in HTML.  
- **Open (M4 / L3):** Large PNG companions and large DR index fallback remain on disk.

### 10. Internal Links — 8/10 Partial

- **Pass:** Import validation `links.missing: []`, breadcrumbs unbroken, images present.  
- **Fail (H2):** Six articles missing navigation ownership.

### 11. Structured Data — 9/10 Ready

- **Pass:** JSON-LD on all imported pages; 0 invalid blocks.  
- **Pass:** SEO launch tests — production host canonicals, sitemap/robots parity, 404 `noindex` (known sitemap omission: `updates/article.html` template only).

---

## Automated verification snapshot (this audit)

| Check | Result |
| --- | --- |
| `seo/launch.test.ts` | Pass |
| Measurement 3A–3F tests | Pass |
| Governance expiry + management tests | Pass |
| `rendering-validation.json` | Pass (208/208) |
| `import-validation.json` | Fail (`passed: false`, ownership gaps) |
| `golden-master` DR/search-index | Fail (`manifest.json` drift) |

---

## Clear-to-ship sequence

1. Copy / regenerate `search-index/manifest.json` from golden into `apps/web/public` (and keep old-html ↔ public in sync). Re-run golden-master.  
2. Live-verify each practitioner HotDoc lightbox from `PRACTITIONER-HOTDOC-ROUTES.json`; record confirmation date.  
3. Add navigation ownership for the six articles; re-run import validation to `passed: true`.  
4. Run `python cms/tools/check_digital_reception_coverage.py` (desktop + 390 + 320).  
5. Optional for day-one ops: place warehouse events at `apps/web/data/measurement-events.json`.  
6. Re-score this audit; target **≥ 85** with **0 Critical / 0 High** before production cutover.

---

## Machine-readable companion

See `old-html/qa/PLATFORM_READINESS_SCORECARD_3H.json` for the same score, recommendation, and issue list.
