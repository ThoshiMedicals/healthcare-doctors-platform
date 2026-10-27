# Prompt 4F — Service hub presentation

## Goal

Service hubs read as clear destination pages (Knowledge ↔ Service ↔ Practitioner ↔ Book), not as undifferentiated content collections. Authority graph tiers drive visual hierarchy.

## Authority audit

Generator: `.tmp-pdf-convert/audit-service-tiers.mjs`  
Artifact: `search-index/service-authority-tiers.json` (mirrored in `old-html` + `apps/web/public`)  
Runtime: tiers + related links embedded in `site.js` via `.tmp-pdf-convert/embed-service-tiers-4f.mjs`

| Tier | Patient label | Count | Threshold |
|------|---------------|-------|-----------|
| Hub | Service hub | 4 | score ≥ 40 |
| Developing | Connected service | 10 | score ≥ 14 |
| Thin | Focused service | 15 | below Developing |

**Hubs:** Family Health (106.5), Preventive Healthcare (81.5), Chronic Disease Care (56.5), Women’s Health (56).

**Developing (examples):** Mental Health, Vaccinations, Children’s Health, Skin Checks, Men’s Health, Skin Cancer Care, Medical Procedures, Allied Health, Telehealth, Antenatal & Postnatal Care.

**Thin (examples):** Pathology, ECG, Iron Infusions, Wound Dressings, Implanon / IUD, independent Radiology & Pharmacy.

## What shipped

1. **Standard hub chrome** — hero → topic wayfinding → breadcrumb → **pathways rail** (guides · practitioners · book).
2. **Pathways rail** — early Knowledge / Practitioner / Booking movement with deep-links into on-page destination sections.
3. **Tier visuals** — body classes `service-tier-hub|developing|thin`; hero accent borders; chip colours; destination left borders; directory row markers on `services.html`.
4. **Directory chips** — each `service-directory-row` gets the patient-facing tier label from the graph.

## Verification (UAT `:3100`)

| Surface | Result |
|---------|--------|
| `/services/family-health.html` | Service hub chip; wayfinding; pathways with 3 guides + 3 practitioners + Book |
| `/services/skin-checks.html` | Connected service chip; pathways + destination sections |
| `/services/pathology.html` | Focused service chip; guides present; practitioners fall back to team / reception |
| `/services.html` | Directory rows show Service hub / Connected service / Focused service |

## Regenerate

```bash
node .tmp-pdf-convert/audit-service-tiers.mjs
node .tmp-pdf-convert/embed-service-tiers-4f.mjs
# then sync old-html ↔ apps/web/public for site.js / styles.css / service-authority-tiers.json
```
