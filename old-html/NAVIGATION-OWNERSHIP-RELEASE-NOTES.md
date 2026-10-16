# Woolloongabba Medical Centre — Header & Navigation Remediation

**Release date:** 11 October 2026  
**Production baseline:** `Woolloongabba_Medical_Centre_Footer_Architecture_Implemented_2026-10-11.zip`  
**Scope:** Header navigation ownership, accessible active states, visible breadcrumbs and breadcrumb structured data only. The approved seven-link order, branding, booking placement, footer, logo, typography and page content are retained.

## 1. Pages corrected / files modified

- **198/198 HTML pages** updated with the publishing-manifest-derived navigation ownership metadata, keyed links and correct static active state. **196** content pages now have exactly one owning section; Home and 404 intentionally have no active primary link.
- **101/101 Knowledge Centre child pages** maintain Knowledge Centre active context in static HTML and after navigation JavaScript executes; the hub additionally uses `aria-current="page"`.
- **Four named Patient Information utility pages** now have parent ownership: `book-appointment.html`, `medicare-exclusions.html`, `new-patient-prescribing-policy.html`, `patient-code-of-conduct.html`.
- `join-our-team.html`: static About Us ownership now agrees with the already-approved About Us breadcrumb and runtime state.
- `team.html`: breadcrumb changed from Home > About Us > Our Team to Home > Our Team, consistent with its primary destination.
- Two Knowledge Centre guides have malformed first breadcrumb links corrected to Home: `knowledge/articles/understanding-neck-pain.html` and `knowledge/articles/understanding-your-cardiovascular-risk.html`.
- `site.js`: eliminated overlapping hardcoded route lists; now enhances the generated `data-nav-owner`/`data-nav-key` state rather than inferring its own parent from URL patterns.
- `styles.css`: added one tightly scoped selector making `aria-current="location"` use the **same existing** approved active-page colour and weight.
- **New:** `navigation-ownership.json` (single source for 198 page ownership/breadcrumb records), `tools/sync_navigation_ownership.py`, `tools/qa_navigation_ownership.py`, and a developer README. Existing unrelated content and assets preserved.

## 2. Navigation ownership map

| Primary destination | Manifest key | Owned HTML pages | Canonical hub |
|---|---|---:|---|
| Services | `services` | 30 | `services.html` |
| Our Team | `team` | 20 | `team.html` |
| About Us | `about` | 7 | `about-us.html` |
| Patient Information | `patient-info` | 29 | `patient-information.html` |
| Knowledge Centre | `knowledge` | 102 | `knowledge/index.html` |
| Updates | `updates` | 7 | `updates/index.html` |
| Contact | `contact` | 1 | `contact.html` |
| No primary owner | `null` | 2 | `index.html`, `404.html` |
| **Total** | | **198** | |

Each page also has a full ordered breadcrumb chain in the manifest. This explicitly preserves nested Knowledge Centre topic/article breadcrumbs and the existing Service/Practice Information breadcrumb hierarchy. Accreditation remains canonically under Patient Information, although linked from About Us as a legitimate cross-link.

## 3. Active-state accessibility

- Primary nav hub page: `aria-current="page"` on the actual page link.
- Child page: `aria-current="location"` on the owning section link, avoiding the misleading claim that the parent's URL *is* the loaded child page.
- Home/404: no artificially active primary navigation item.
- Initial HTML is correct without JavaScript; `site.js` does not clear a correct marker or contradict the manifest. Approved focus appearance and mobile disclosure functionality remain unchanged.

## 4. Breadcrumb fixes

- **Book appointment** now: Home > Patient Information > Book an Appointment.
- The other three named patient pages already carried the correct Patient Information breadcrumb path; these were retained while their active state was repaired.
- `join-our-team.html` retains Home > About Us > Careers.
- `team.html` now uses Home > Our Team.
- The two mislinked Knowledge Centre articles now begin with Home, followed by Knowledge Centre, the topic and the article.
- **196/196 content routes** now expose one canonical BreadcrumbList JSON-LD derived from the same manifest as visible breadcrumbs and nav ownership. Older duplicate/contradictory BreadcrumbLists removed; all **1,108 other JSON-LD entities** preserved.

## 5. Validation results

| Check | Result |
|---|---|
| Complete HTML / manifest route coverage | **198/198 pass** |
| Primary nav destinations/order | **1,386 links checked; 0 errors** |
| Breadcrumb parent links | **482 checked; 0 errors** |
| Knowledge child sections | **101/101 pass** |
| Four Patient Information routes | **4/4 pass** |
| Static active state and breadcrumb equality | **198/198 pass** |
| Canonical breadcrumb JSON-LD | **196/196 content pages pass** |
| All local links across HTML package | **0 broken** |
| JSON-LD parseability | **0 errors** |
| Assets compared byte-for-byte to prior package | **63/63 unchanged** |
| Entire footer markup compared to prior package | **198/198 unchanged** |
| Main content (excluding intended breadcrumb changes) | Unchanged on **194/198** pages; four deliberate breadcrumb adjustments |
| Build script rerun/idempotence | **198/198 unchanged on second run** |
| Isolated Chromium layout/interaction sample | **64/64 pass** at 320, 360, 375, 390, 768, 1024, 1440, 1920 px |
| Mobile Menu open, first-link focus, Escape and focus restoration | **Pass** in all sampled mobile cases |
| No-JavaScript selected sections and breadcrumbs | **Pass** on sampled routes |
| Homepage header pixel comparison with approved baseline | **Identical** at 320, 390, 768, 1440 px |

**Test method and limitations:** Exhaustive file/DOM/source validation for 198 pages, plus isolated Chromium rendering with the actual HTML header and approved CSS for eight representative routes × eight widths. This is not a complete deployed-site browser regression or independent WCAG/assistive-tech certification. Staging verification should still check the final deployed HotDoc flow, call links, zoom, mobile devices, NVDA/VoiceOver and production network assets.

## 6. Production readiness assessment

**Status: Implementation complete; ready for staging release gate.** All requested P1/P2 remediation items pass local checks. No design changes, header order changes, booking reordering or footer modifications were introduced. Full production certification should follow live staging / assistive-technology testing rather than being claimed from isolated checks alone.

**Build repeatability:** The navigation JSON manifest and included synchronisation/QA commands prevent later content publishing from reintroducing conflicting static/JavaScript active-state or BreadcrumbList ownership.
