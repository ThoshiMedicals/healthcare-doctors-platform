# WMC release artifact manifest — commit-ready

**Date:** 2026-11-03  
**Branch:** `rg01-release-gate-repairs`  
**Base tip (pre-commit):** `09b7d78`  
**Release SHA:** `3875dc3` (`3875dc34edae2bf39cb591835455484876803acc`) — pushed to `origin/rg01-release-gate-repairs`  
**Target:** one production release commit covering Phase 1A–1C authority assets, authority/service HTML, insurance-notice golden fixes, `site.js` placeRestriction removal, and aligned tests.

This file is an operator staging list. It does not change public content.

## Verdict (artifact readiness)

| Gate | Status |
| --- | --- |
| Phase 1A/1B/1C WebP parity (golden ↔ public) | PASS — 96 files each, 0 missing variants for required stems |
| Authority / service / insurance HTML in working tree | PASS — included below |
| `placeRestriction` removed from `site.js` | PASS — absent in `old-html/site.js` and `apps/web/public/site.js` (byte-identical); bust `site.js?v=wmc-nav-20261102d` |
| Insurance-notice tests match baked golden model | PASS — `booking-restriction-notice.test.ts` + `public-ux.test.ts` (16/16) |
| Commit created / tip advanced | **PASS** — `3875dc3` committed and pushed |
| LAUNCH.md DNS cutover ops | **OPEN** — see `deployment/DNS-CUTOVER-CHECKLIST.md` |

## Include in the release commit

### Runtime / presentation (modified)

- `apps/web/public/index.html`
- `apps/web/public/site.js`
- `apps/web/public/styles.css`
- `apps/web/src/documents/public-ux.ts`
- `apps/web/src/documents/public-ux.test.ts`
- `apps/web/src/documents/booking-restriction-notice.test.ts`
- `old-html/site.js`
- `old-html/styles.css`

### Insurance-notice golden fixes (modified)

- `old-html/doctors/dr-tanya-goodwill.html`
- `old-html/doctors/dr-sumita-singh.html`
- `old-html/doctors/dr-anand-singh.html`
- `old-html/doctors/dr-debra-larkins.html`
- `old-html/doctors/dr-sambo-luon.html`

### Authority knowledge pages (modified)

- `old-html/knowledge/womens-health.html`
- `old-html/knowledge/childrens-health.html`
- `old-html/knowledge/skin-health-skin-cancer.html`
- `old-html/knowledge/menopause.html`
- `old-html/knowledge/pregnancy.html`
- `old-html/knowledge/preventive-healthcare.html`
- `old-html/knowledge/vaccinations.html`
- `old-html/knowledge/healthy-ageing.html`
- `old-html/knowledge/telehealth-access-to-care.html`
- `old-html/knowledge/chronic-disease-management.html`
- `old-html/knowledge/articles/when-should-i-have-a-cervical-screening-test.html`
- `old-html/knowledge/articles/blood-pressure-explained.html`
- `old-html/knowledge/articles/understanding-adhd-referrals.html`
- `old-html/knowledge/articles/protecting-your-skin-from-the-queensland-sun.html`

### Authority / cluster service pages (modified)

- `old-html/services/womens-health.html`
- `old-html/services/childrens-health.html`
- `old-html/services/skin-cancer-care.html`
- `old-html/services/skin-checks.html`
- `old-html/services/antenatal-postnatal-care.html`
- `old-html/services/pap-smear-cervical-screening.html`
- `old-html/services/pre-pregnancy-care.html`
- `old-html/services/breast-check.html`
- `old-html/services/allied-health.html`
- `old-html/services/chronic-disease-care.html`
- `old-html/services/ear-care-ear-syringing.html`
- `old-html/services/ecg.html`
- `old-html/services/family-health.html`
- `old-html/services/iron-infusions.html`
- `old-html/services/medical-procedures.html`
- `old-html/services/mens-health.html`
- `old-html/services/mental-health.html`
- `old-html/services/nebulising.html`
- `old-html/services/pathology.html`
- `old-html/services/pharmacy.html`
- `old-html/services/preventive-healthcare.html`
- `old-html/services/prostate-care.html`
- `old-html/services/radiology.html`
- `old-html/services/spirometry.html`
- `old-html/services/telehealth.html`
- `old-html/services/vaccinations.html`
- `old-html/services/wound-dressings.html`

### Phase 1B + 1C education WebPs (untracked — both trees)

Duplicate under `old-html/assets/knowledge/authority/` and `apps/web/public/assets/knowledge/authority/` (3 variants each: base, `-640`, `-960`):

**Phase 1C**

- `cervical-screening-vs-pap-education`
- `blood-pressure-numbers-education`
- `chronic-disease-care-coordination-education`
- `adhd-referral-pathway-education`

**Phase 1B cluster extras**

- `preventive-cycle-education`
- `vaccination-life-stages-education`
- `healthy-ageing-education`
- `menopause-education`
- `pregnancy-care-education`
- `skin-check-education`
- `telehealth-education`
- `queensland-sun-education`
- `womens-life-stages-education`
- `childrens-gp-visit-education`

**Phase 1A** — already in tip `09b7d78` (glucose / circulation / diabetes-review / heart-check / mental-health-conversation / mental-wellbeing education + hero/infographic sets). No additional untracked Phase 1A stems.

### This manifest

- `deployment/RELEASE-ARTIFACT-MANIFEST.md`

## Exclude from the release commit

- `.cursor/`
- `.tmp-pdf-convert/**` (local deploy/verify scripts and screenshots)
- Root scratch lists: `branches.txt`, `git-history.txt`, `repo-files.txt`, `repo-structure.txt`
- Optional local tooling (not required to serve): `old-html/cms/authority-phase-1b-blocks.json`, `old-html/cms/tools/render-authority-phase-1b.mjs`
- Secrets / `.env` / laptop-only deploy state

## Suggested stage commands (PowerShell)

```powershell
git add `
  apps/web/public/index.html `
  apps/web/public/site.js `
  apps/web/public/styles.css `
  apps/web/src/documents/public-ux.ts `
  apps/web/src/documents/public-ux.test.ts `
  apps/web/src/documents/booking-restriction-notice.test.ts `
  old-html/site.js `
  old-html/styles.css `
  old-html/doctors/dr-anand-singh.html `
  old-html/doctors/dr-debra-larkins.html `
  old-html/doctors/dr-sambo-luon.html `
  old-html/doctors/dr-sumita-singh.html `
  old-html/doctors/dr-tanya-goodwill.html `
  old-html/knowledge `
  old-html/services `
  old-html/assets/knowledge/authority `
  apps/web/public/assets/knowledge/authority `
  deployment/RELEASE-ARTIFACT-MANIFEST.md
```

Suggested message style:

```text
release(wmc): ship Phase 1B/1C authority artifact and insurance-notice gate alignment
```

## Post-commit operator steps (not done here)

1. Record new tip SHA; update working-memory tip note (`site.js?v=wmc-nav-20261102d`).
2. On VPS: checkout tip → build → `import:golden` after off-box backup.
3. Run `deployment/smoke-test.sh` on staging via `--resolve`, then complete LAUNCH.md Go checklist before DNS.

## LAUNCH.md validation (this machine)

| Requirement | Script / doc | Evidence on this PC | Cutover status |
| --- | --- | --- | --- |
| Backup | `deployment/backup-database.sh` | Script present; `deployment/backups/` **missing** | **CRITICAL — open** |
| AUTH_* | LAUNCH.md env table | No production `.env` verified here; do not copy laptop `.env` | **CRITICAL — open** |
| Cloudflare Full (strict) | LAUNCH.md § Certificate / §8 | No CF API/dashboard access from agent | **CRITICAL — open** |
| Smoke testing | `deployment/smoke-test.sh` | Script present; UAT health `ok` local only — **not** VPS staging smoke log | **CRITICAL — open** |
| Rollback | LAUNCH.md §9 (DNS / release / content) | Process documented; prior DNS values + off-box backup **not evidenced** | **CRITICAL — open** |

Laptop `next.` UAT is not a substitute for VPS staging + DNS cutover gates.
