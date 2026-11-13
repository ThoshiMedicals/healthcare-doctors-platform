# WMC C1 + Patient Journey — Integration Preflight

| Field | Value |
| --- | --- |
| Date | 2026-11-13 |
| Verdict | **WMC C1 + PATIENT JOURNEYS — INTEGRATION READY** |
| Integration branch | `integration/wmc-c1-patient-journey` |
| Final integrated SHA | **`71bbc6012763d29385ab1f11fe5aba039cafd5b4`** (`71bbc60`) |
| Code tip (PJ + C1 feature) | `b3a5c3f27dd32c24305ebe8932d5186a5ad46d1e` |
| Staging baseline (preserved ancestor) | `f6bba5ca0deea4ef70ebed64c64f35a9ca8d78dd` |
| C1 base | `1a12bf98b0d940bb3ff41a6c7813e3f7427190e3` |
| Deploy | **Not deployed** (preflight only) |
| DB / CMS / DNS / Auth config | **Unchanged** |

## 1. Git ancestry (verified)

```
f6bba5c (Hostinger staging B1)
  └─ 0f86795 (Phase C1 Engagement UI foundation)
       └─ 1a12bf9 (C1 report pin)
            └─ b3a5c3f (PJ-01/02 + mockup docs)
                 └─ 83c4e09 (preflight pack)
                 └─ 1cd3fba … → **d786419** (docs artefacts)  ← integration tip
```

- `merge-base --is-ancestor f6bba5c HEAD` → **PASS** (no staging commits lost)
- `merge-base --is-ancestor 1a12bf9 HEAD` → **PASS**
- `git log HEAD..f6bba5c` → **empty** (nothing on staging missing from tip)
- Working tree: only unrelated untracked Class-B SQL scratch scripts (excluded from release)

## 2. Concept register reconciliation

| Source | Status |
| --- | --- |
| Owner-approved concept brief (Task list: Care Hub, visit prep, Trust Facts links, GP/DR, notifications in future phases, rejects) | **Reconciled** into `docs/WMC-PWA-MOCKUP-CONCEPT-DECISION-REGISTER.md` |
| `WMC_PWA_Mockup_Concept_Audit_2026-11-13.md` | **Not found on disk** |
| Uncertainty recorded | Exact 17-image filenames/order and any per-image clinical caveats in the missing audit file are unknown — not invented |

## 3. Specific verification gates

| Gate | Result | Evidence |
| --- | --- | --- |
| Visit-prep: no clinical / free-text storage | **PASS** | Only boolean keys in `wmc.visitPrep.v1`; no textarea; unit test |
| Care Hub destinations exist | **PASS** | All page hrefs present under `old-html/` (`new-patients`, `fees-billing`, `bulk-billing`, `telehealth`, `after-hours-care`, `book-appointment`, `team`, `knowledge/index`); anchors `#preferred-gp-panel`, `#practice-info-strip`, `#digital-reception` |
| C1 screens labelled demonstration | **PASS** | Banner + `[DEMO]` titles; ledes say demonstration; existing `phase-c1-evidence/c1-inbox-390.png` |
| No live push / subscription / patient-data collection | **PASS** | C1 tests forbid `Notification.requestPermission` / `pushManager.subscribe`; prototype gate; dummy data only |
| Admin lab behind Auth.js permissions | **PASS** | Every `/admin/engagement-lab/**` page calls `requireAction("edit")` |
| HotDoc policies + 15 practitioners | **PASS** | `published-practitioner-routes` + booking matrix tests; inventory length **15** |
| PWA / DR / Preferred GP / mobile share | **PASS** | Suite includes preferred-GP, DR runtime, install landing, share practitioner, hub dashboard |

## 4. Tests and build

| Check | Result |
| --- | --- |
| Focused Patient App / C1 / Journey / booking / DR / a11y / share suite | **70/70 PASS** → `docs/phase-c1-journey-preflight/2026-11-13/unit-regression.txt` |
| `npx next build` (Next 15.5.29) | **PASS** (pre-existing ESLint warnings only) → `…/next-build.txt` |
| Responsive hub visuals | **PASS** — `hub-journey-care-{320,390,430,768,1024}.png` |
| C1 prior visual evidence | Retained under `docs/phase-c1-evidence/` |

## 5. Release artefacts

| Artefact | Path |
| --- | --- |
| Changed-file manifest vs staging | `docs/phase-c1-journey-preflight/2026-11-13/changed-files-vs-f6bba5c.txt` |
| Diffstat | `…/changed-stat-vs-f6bba5c.txt` |
| **Preferred release ZIP (delta)** | `docs/phase-c1-journey-preflight/wmc-c1-patient-journey-delta-1cd3fba.zip` |
| Delta SHA256 | `2B66AFABA389270822ACDD73640C12651A332FB647CEAB666CE2D6FD22AEA8F2` |
| Full git-archive ZIP (local, ~116 MB, gitignored) | `…/wmc-c1-patient-journey-integration-b3a5c3f.zip` (tree at code tip; regenerate with `git archive` at `83c4e09` if needed) |
| Full ZIP SHA256 (code tip archive) | `D5A76923F1841AEE383E5F3AD179BD69206BFACE2DC71CFAA03C3C6C8CEADD8F` |

Prefer the **delta ZIP** for review/transfer; full archive is a complete tree snapshot only.

## 6. Rollback plan

1. **Do not deploy** this tip until separate Hostinger approval.  
2. If ever deployed: restore Hostinger to staging tip **`f6bba5c`** using prior archive `wmc-patient-app-b1-install-f6bba5c.zip` / build `01a1d23c-…`.  
3. Git: `git switch release/wmc-patient-app-visual-excellence` @ `f6bba5c` (or checkout that SHA).  
4. C1-only rollback without Journey: tip `1a12bf9` / `0f86795`.  
5. No DB migration accompanies this tip — no schema rollback required.

## 7. Still not authorised by this preflight

- Hostinger staging or production deploy  
- Live Web Push / Prisma messaging schema  
- CMS clinical content edits  
- DNS / Auth.js configuration changes  
- Distribution of B1 production QR promo pack  

---

**WMC C1 + PATIENT JOURNEYS — INTEGRATION READY**
