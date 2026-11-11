# WMC — 12-Page UI Recovery Report

**Date:** 2026-11-11  
**Scope:** Isolated local implementation only  
**Baseline:** `7fbb04eaaa80c629f509e803797163c35e806bce`  
**Worktree:** `C:\Users\RoshanSamarawickrema\Desktop\WMC-page-layout-recovery`  
**Branch:** `fix/wmc-about-gp-journey-layout`  
**Staging reference (unchanged):** build `01a1c81c…` — still shows pre-fix HTML until a future authorized deploy  
**Production:** NO-GO  
**PWA worktrees:** not modified by this task

---

## A. Audit results for all 12 pages

Live Hostinger staging audited via real browser + HTML capture + CDP computed styles.

| # | Page | HTTP | Live defect (staging) |
| --- | --- | --- | --- |
| 1 | `/about-us/practice-experience.html` | 200 | Journey rail outside `.page-layout`; article **~280px** wide |
| 2 | `/about-us/community-catchment.html` | 200 | Same |
| 3 | `/about-us/continuity-in-practice.html` | 200 | Same |
| 4 | `/about-us/clinical-interests.html` | 200 | Same |
| 5 | `/join-our-team/gp-opportunities.html` | 200 | Same (CDP: articleW=280, navParent=`breadcrumb-bar`) |
| 6 | `/join-our-team/practice-support.html` | 200 | Same |
| 7 | `/join-our-team/registrar-pathway.html` | 200 | Same |
| 8 | `/join-our-team/opportunity-pack.html` | 200 | Same |
| 9 | `/join-our-team/gp-faq.html` | 200 | Same |
| 10 | `/join-our-team/provider-number-readiness.html` | 200 | Same |
| 11 | `/join-our-team/dpa-navigator.html` | 200 | Same |
| 12 | `/join-our-team/session-planner.html` | 200 | Same |

**Shared stylesheets:** all 12 load `/wmc-cache/styles.min.css?v=wmc-updates-dr-mobile-20261106e` + Google fonts (same as homepage). Not a missing CSS file.

**Evidence captures:** `apps/web/.tmp-layout-recovery/matrix/*.html` (before) and `*.fixed.html` (post-transform).

---

## B. Root causes discovered

### Primary (all 12)

`ensureUnifiedRecruitmentJourneyNav` (`apps/web/src/attraction-cms/ensure-journey-nav.ts`) removed the `.page-nav` rail from `.shell.page-layout` and re-inserted it into `.breadcrumb-bar` / before `<main>`.

`.page-layout` CSS is `grid-template-columns: 280px minmax(0,1fr)`. With only the `<article>` remaining as a child, the article occupied the **first 280px track**. Main editorial content rendered as a narrow column; the journey links appeared as a broken full-width strip under the breadcrumb.

CDP (staging, GP Opportunities):

- `shellGrid`: `280px 951px`
- `shellChildren`: article only, **width 280**
- `navInShell`: **false**
- `navParent`: `breadcrumb-bar`

### Not the cause

- Missing stylesheet / failed CSS network
- Golden-master HTML absence (content present in DOM)
- Image 404s as primary failure
- HOLD policy / CMS revision body content changes

---

## C. Shared components and styles corrected

1. **`ensure-journey-nav.ts`** — prefer inserting the canonical journey rail as the **first child of `.page-layout`** after stripping stale asides.
2. **`ev-shell.ts`** — failsafe CSS: if a layout has no rail child, force `grid-template-columns: minmax(0,1fr)`; ensure articles `min-width:0; max-width:100%`.
3. **Tests** — page-layout contract for all 12 paths + breadcrumb-bar regression guard.

No golden-master edits. No HOLD/env/API changes. No homepage hero changes. No booking governance changes.

---

## D. Exact changed-file list

```
apps/web/src/attraction-cms/ensure-journey-nav.ts
apps/web/src/attraction-cms/ensure-journey-nav.test.ts
apps/web/src/attraction-cms/ev-shell.ts
docs/WMC-12-PAGE-UI-RECOVERY-REPORT.md
```

(+ local evidence under `apps/web/.tmp-layout-recovery/` — gitignored / not for commit unless requested)

---

## E. Before/after screenshot evidence

| State | Evidence |
| --- | --- |
| Before (live staging) | Browser screenshots of Practice Experience + GP Opportunities: empty-looking main column, rail outside grid |
| After (local transform preview) | Desktop CDP: nav **280** + article **951**, `navInShell=true`, `overflowX=false` |
| After mobile (390 emulation) | CDP: flex column, article **362**, `overflowX=false`, `scrollW=390` |

Preview server used transformed live HTML with staging absolute CSS/assets on `127.0.0.1:8765` (local only).

---

## F. Responsive verification results

Measured on fixed Practice Experience preview:

| Width | Result |
| --- | --- |
| ~1366 desktop | PASS — 2-col grid restored |
| 390 mobile emulation | PASS — column stack, no document overflow |
| Transform matrix all 12 | PASS — rail inside `.page-layout`, single rail |

Full 320/375/768/1024/1280/1440 photographic matrix on Hostinger was **not** re-run post-deploy (no staging deploy in this task). Local transform + CDP cover the shared root cause for all 12.

---

## G. Accessibility verification

- Landmark structure retained (header/nav/main/article/footer)
- Journey rail remains navigable links with `aria-current` on active page
- No new focus traps
- Keyboard path not newly blocked by this DOM order fix
- Sticky care dock still present (pre-existing); not altered

---

## H. Recruitment HOLD regression

Live staging (policy unchanged by this work):

| Check | Result |
| --- | --- |
| `express-interest.html` | **404** |
| `doctor-readiness.html` | **404** |
| `POST …/gp-pipeline/eoi` | **403** |
| `POST …/gp-pipeline/readiness` | **403** |
| 8 informational pages | remain publicly routable under HOLD + noindex (pre-approved) |

Automated: `recruitment-hold` + `recruitment-hold-route` + `public-ux` + journey-nav tests **PASS** (41).

---

## I. CMS, booking and SEO regression

| Concern | Status |
| --- | --- |
| CMS P0 modules | Untouched |
| Phone-only / HotDoc governance | Untouched |
| Homepage hero v6 | Untouched |
| Canonical / SEO head injection | Untouched by this change |
| Published revision bodies | Untouched (presentation-layer DOM placement only) |

---

## J. Performance and production-build results

| Check | Result |
| --- | --- |
| `npm run build` (this worktree) | **PASS** |
| Extra client JS | **None** added |
| Extra libraries | **None** |
| First-load impact | DOM order fix only; same CSS pipeline |

Staging cold-start Hostinger latency remains a separate ops concern (not masked).

---

## K. Integration risks with Patient PWA

| Risk | Mitigation |
| --- | --- |
| Overlap on `public-ux.ts` / `render-published-document.ts` | This fix did **not** edit those files |
| PWA platform currently dirty on `render-published-document.ts` | Separate worktree `WMC-pwa-platform`; integrate via review, not concurrent same-tree edits |
| Shared `ev-shell` CSS | Additive failsafe only; PWA should re-test attraction pages after merge |

---

## L. Final verdict

### 12-PAGE UI RECOVERY — COMMIT CANDIDATE READY

Shared root cause fixed in version-controlled presentation code; all 12 paths covered by automated rail-placement contracts; production build green; HOLD/booking/SEO surfaces not weakened. Staging Hostinger still serves the broken placement until an authorized archive deploy of this branch (explicitly out of scope).

**Stopped** — no commit, push, merge, or Hostinger/Supabase/DNS changes.
