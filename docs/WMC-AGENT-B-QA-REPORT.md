# WMC Agent B QA Report — Functionality / Patient Journeys / PWA / Admin Smoke
**Branch:** `qa/wmc-agent-b-journeys`  
**Baseline:** `069977bdd25714b221b62ca39ab1c2b74a06d511`  
**Staging:** `https://mediumslateblue-eagle-960503.hostingersite.com`  
**Date:** 2026-11-11  
**Agent:** B (Functionality / Patient Journeys / PWA / Admin Smoke)

---

## 1. Practitioner Route Matrix — All 15 Published Profiles

| # | Practitioner | Route | HTTP | Notes |
|---|---|---|---|---|
| 1 | Dr Anand Singh | `/doctors/dr-anand-singh.html` | **200** ✅ | GP |
| 2 | Dr Debra Larkins | `/doctors/dr-debra-larkins.html` | **200** ✅ | GP |
| 3 | Dr Golnar Mortezaei | `/doctors/dr-golnar-mortezaei.html` | **200** ✅ | CMS-injected GP |
| 4 | Dr James Chanaka | `/doctors/dr-james.html` | **200** ✅ | CMS-injected GP |
| 5 | Dr Kooshyar Karimi | `/doctors/dr-kooshyar-karimi.html` | **200** ✅ | GP |
| 6 | Dr Mary Abadir | `/doctors/dr-mary-abadir.html` | **200** ✅ | GP — phone-only |
| 7 | Dr Nirupa Sivathasan | `/doctors/dr-nirupa-sivathasan.html` | **200** ✅ | GP |
| 8 | Dr Sambo Luon | `/doctors/dr-sambo-luon.html` | **200** ✅ | GP |
| 9 | Dr Steven Chang | `/doctors/dr-steven-chang.html` | **200** ✅ | Allied health |
| 10 | Dr Sumita Singh | `/doctors/dr-sumita-singh.html` | **200** ✅ | GP |
| 11 | Dr Tanya Goodwill | `/doctors/dr-tanya-goodwill.html` | **200** ✅ | GP — insurance notice |
| 12 | Dr Usman Gul | `/doctors/dr-usman-gul.html` | **200** ✅ | GP — special restriction |
| 13 | Dr Wasantha Hettiarchchi | `/doctors/dr-wasantha-hettiarchchi.html` | **200** ✅ | GP |
| 14 | Dr Yamesha Ranatunga | `/doctors/dr-yamesha-ranatunga.html` | **200** ✅ | CMS-injected GP |
| 15 | Mr Samuel Stafford | `/doctors/mr-samuel-stafford.html` | **200** ✅ | Allied health |

**Gemunu (intentionally unpublished):** `/doctors/dr-gemunu-suresh-ranawake.html` → **301 → `/team-general-practitioners.html`** ✅  
Correct: Gemunu is on-hold / unpublished and properly redirects to GP directory. This is the intended behavior per `UNPUBLISHED_PRACTITIONER_DIRECTORY_REDIRECTS`.

---

## 2. Booking CTA Spot-Check Matrix

| Practitioner | Mode | Verified CTA href | Label | Insurance Notice |
|---|---|---|---|---|
| Golnar | ONLINE_HOTDOC | `https://www.hotdoc.com.au/.../dr-golnar-mortezaei-5?wp=w_lightbox` | "Book Appointment" | No |
| Mary | PHONE_ONLY | `tel:+61732173344` | "Call Reception to Book" | No |
| Tanya | ONLINE_HOTDOC | `https://www.hotdoc.com.au/.../dr-tanya-goodwill-does-not-bulk-bill-for-insurance-patients?wp=w_lightbox` | "Book Appointment" | **Yes** ✅ |
| James | ONLINE_HOTDOC | `https://www.hotdoc.com.au/.../dr-james-chanaka-1?wp=w_lightbox` | "Book Appointment" | No |
| Yamesha | ONLINE_HOTDOC | `https://www.hotdoc.com.au/.../dr-yamesha-ranatunga-2?wp=w_lightbox` | "Book Appointment" | No |

**PASS.** All five verified practitioners have correct booking destinations and labels matching the `PRACTITIONER_BOOKING_MATRIX` policy.

- **Golnar**: Owner-approved `dr-golnar-mortezaei-5` discriminant present with `?wp=w_lightbox` lightbox suffix. HotDoc widget attributes expected (verified in tests).
- **Mary**: `tel:+61732173344` telephone CTA, no HotDoc link, no insurance notice. `alignPhoneOnlyPractitionerChrome` applied correctly.
- **Tanya**: Insurance slug `does-not-bulk-bill-for-insurance-patients` present in HotDoc href. `practitioner-booking-notice` injected and visible on profile.
- **James / Yamesha**: Non-insurance HotDoc slugs (`dr-james-chanaka-1`, `dr-yamesha-ranatunga-2`) — no insurance notice injected. Correct.

**Usman**: Not spot-checked interactively (special-restriction path — leave alone per brief). Usman's profile returns 200 and is excluded from `PRACTITIONER_BOOKING_MATRIX` by policy.

---

## 3. PWA Audit

### Endpoint Status
| Asset | HTTP | Content-Type | Status |
|---|---|---|---|
| `/manifest.webmanifest` | 200 | `text/plain` | ⚠️ MIME MISMATCH |
| `/sw.js` | 200 | `application/x-javascript` | ✅ |
| `/offline.html` | 200 | `text/html` | ✅ |

### Manifest MIME Issue
`/manifest.webmanifest` is served with `Content-Type: text/plain` instead of the correct `application/manifest+json`. Chrome/Edge will still parse it (they are lenient), but iOS Safari may refuse to add to home screen without the correct MIME type. This is a **LEAD-owned** `next.config` concern — the relevant header rule needs to set `Content-Type: application/manifest+json` for `*.webmanifest`. **AGENT B cannot fix this** (next.config is outside ownership). Recommend LEAD adds:
```js
// next.config.ts — add to headers() or use response headers middleware
{ source: '/manifest.webmanifest', headers: [{ key: 'Content-Type', value: 'application/manifest+json' }] }
```

### sw.js
`application/x-javascript` is acceptable for service workers (standard JS MIME). Service worker registration will succeed.

### offline.html
200 HTML. Offline fallback available.

### PWA Tests — All Pass
All 27 PWA unit tests pass:
- `cache-policy.test.ts`: 10 tests ✅
- `sw-contract.test.ts`: 17 tests ✅ (live `public/sw.js` exercised via vm sandbox)
- `offline-shell.test.ts`: 7 tests ✅ (structure, accessibility, no-session guarantee)

Key contracts verified:
- Admin/auth paths (`/admin/*`, `/api/auth/*`) are **never cached** by SW
- SW falls back to `offline.html` only for failed public navigations — never for admin content
- Manifest, `site.js`, `styles.min.css` (if included) stay in `SHELL_ALLOWLIST`
- `Set-Cookie` / `Authorization` responses never enter the cache

---

## 4. Admin Capability Register

### Auth Routes (no credentials required)
| Route | HTTP | Classification | Notes |
|---|---|---|---|
| `/admin/login` | 200 | ✅ **Fully working** | Login form, forgot-password link, throttle guard (`loginLockMessage`) |
| `/admin/forgot-password` | 200 | ✅ **Fully working** | Password reset form |
| `/admin/session-end` | 307 | ✅ **Functional** | Logout action route — redirects (expected) |

### Dashboard Routes — Auth Guard Verification
All dashboard routes (`/admin`, `/admin/practitioners`, `/admin/pages`, `/admin/settings`, etc.) return **307 → `/admin/login`** when accessed without authentication. Auth guard is correctly applied to the entire `(dashboard)` route group.

**LIMITATION:** All dashboard route content has been inspected at the code level only. Functional testing of dashboard features requires admin credentials which are not available in this QA run. Classifications below are code-inspection results.

### Dashboard Route Inventory (Code-Inspection Classification)

| Route Group | Subroutes | Classification | Evidence |
|---|---|---|---|
| `/admin` (home) | — | ✅ **Fully implemented** | Rich dashboard: KPI strip, command centre snapshot, recommended actions, executive summary, governance, digital reception, practitioner/service authority, career stats |
| `/admin/practitioners` | + `/[id]` | ✅ **Fully implemented** | CRUD list with Prisma, edit form, name/qualifications/HotDoc URL/photo |
| `/admin/services` | + `/[id]` | ✅ **Fully implemented** | CRUD list, edit form |
| `/admin/updates` | + `/[id]` | ✅ **Fully implemented** | Articles list, edit, CMS lifecycle |
| `/admin/knowledge` | + `/[id]`, `/topics/[id]` | ✅ **Fully implemented** | Knowledge centre, topic management |
| `/admin/about` | + `/[id]` | ✅ **Fully implemented** | About page management |
| `/admin/pages` | + `/[pageId]` | ✅ **Fully implemented** | Page hub (knowledge/updates/services/practitioners hubs) |
| `/admin/account` | — | ✅ **Fully implemented** | User account settings |
| `/admin/settings` | — | ✅ **Fully implemented** | Practice settings |
| `/admin/users` | — | ✅ **Fully implemented** | User management (super-admin) |
| `/admin/navigation` | — | ✅ **Fully implemented** | Navigation management |
| `/admin/media` | + `/[id]` | ✅ **Fully implemented** | Media library with grid view, sync, upload |
| `/admin/asset-library` | + `/[id]`, `/architecture` | ✅ **Fully implemented** | Attraction asset CRUD with full kind/status matrix |
| `/admin/attraction` | + `/[id]`, `/architecture` | ✅ **Fully implemented** | Attraction content management |
| `/admin/attraction-analytics` | + `/architecture` | ✅ **Fully implemented** | Analytics dashboard |
| `/admin/governance` | + `/[id]`, `/expiry`, `/management` | ✅ **Fully implemented** | Expiry report, management report, governance items |
| `/admin/image-governance` | + `/[id]` | ✅ **Fully implemented** | Image governance queue |
| `/admin/executive` | + `/monthly` | ✅ **Fully implemented** | Executive dashboard with range selector |
| `/admin/conversion-intelligence` | — | ✅ **Fully implemented** | Conversion intelligence report |
| `/admin/digital-reception` | — | ✅ **Fully implemented** | Digital reception management |
| `/admin/practice-experience` | — | ✅ **Fully implemented** | Practice experience modules |
| `/admin/practitioner-authority` | — | ✅ **Fully implemented** | Practitioner authority hub management |
| `/admin/service-authority` | — | ✅ **Fully implemented** | Service authority hub management |
| `/admin/search-opportunities` | — | ✅ **Fully implemented** | SEO search opportunity analysis |
| `/admin/story-capture` | + `/new`, `/[id]` | ✅ **Fully implemented** | Story capture workflow |
| `/admin/careers/vacancies` | + `/new`, `/[id]` | ✅ **Fully implemented** | Vacancy CRUD, display order |
| `/admin/careers/applications` | + `/[id]` | ✅ **Fully implemented** | Career applications inbox with status workflow |
| `/admin/gp-pipeline` | + `/enquiries/[id]`, `/architecture` | ✅ **Fully implemented** | GP recruitment pipeline |
| `/admin/recruitment/gp-readiness` | + `/[id]` | ✅ **Fully implemented** | GP readiness package management |
| `/admin/operations/patient-requests` | + `/[id]` | ✅ **Fully implemented** | Patient request inbox with status/assignment |
| `/admin/patient-information` | + `/[id]` | ✅ **Fully implemented** | Patient information management |
| `/admin/collections/[collection]` | — | ✅ **Fully implemented** | Collections management |
| `/admin/revisions/[entityType]/[entityId]` | — | ✅ **Fully implemented** | Revision history viewer |
| `/admin/preview/[token]` | — | ✅ **Fully implemented** | Preview route (auth + token) |

**Recruitment HOLD integrity:** `/admin/careers` and `/admin/recruitment/gp-readiness` exist and are implemented but the public-facing recruitment form activation is held. No changes made to form submission or activation logic.

---

## 5. Test Results Summary

### Ownership Test Files

| Test File | Tests | Pass | Fail |
|---|---|---|---|
| `booking-restriction-notice.test.ts` | 9 | 9 | 0 |
| `practitioner-booking.test.ts` | 9 | 9 | 0 |
| `phone-only-booking.test.ts` | 6 | 6 | 0 |
| `pwa-meta.test.ts` + `patient-pwa-nav.test.ts` | 21 | 21 | 0 |
| `pwa/cache-policy.test.ts` | 10 | 10 | 0 |
| `pwa/sw-contract.test.ts` | 17 | 17 | 0 |
| `pwa/offline-shell.test.ts` | 7 | 7 | 0 |
| **TOTAL** | **79** | **79** | **0** |

### Supporting Tests (non-ownership, verified pass)
| Test File | Tests | Pass |
|---|---|---|
| `inject-cms-practitioners.test.ts` (package-b) | 11 | 11 |

**All 90 tests pass.** No functional fixes required.

---

## 6. Functional Findings

### PASS
- All 15 published practitioner profiles return HTTP 200 on staging
- Booking CTAs for Golnar, Mary, Tanya, James, Yamesha are correct (modes, HotDoc URLs, labels, insurance notices)
- Gemunu intentional 301 → GP directory is verified live
- Mary phone-only CTA ("Call Reception to Book" + `tel:`) is correctly applied
- Tanya insurance notice is injected and visible on staging profile
- Insurance notice injection is idempotent (verified by tests)
- Usman's special-restriction HotDoc slug is preserved as-is (not overridden by GOLNAR fallback)
- SW admin/auth path exclusions are correct (admin traffic never cached)
- Admin auth guard correctly returns 307 for all dashboard routes without credentials
- Admin login page: title "Clinic CMS | Woolloongabba Medical Centre", form present, forgot-password link present

### KNOWN ISSUE (not Agent B owned)
- `manifest.webmanifest` served as `text/plain` instead of `application/manifest+json`. LEAD must add Content-Type override in `next.config.ts` headers. Linked to MIME fix discussion in prior agent runs.

### NO ISSUES
- No recruitment form activation (HOLD intact)
- No admin feature invention or new functionality added
- No real appointments submitted or patient enquiries triggered

---

## 7. Files Changed

**No production code was changed.** All existing tests pass. No functional bugs found within ownership scope that required fixing.

Files added:
- `apps/web/.tmp-qa-agent-b/AGENT-B-REPORT.md` (this report)

---

## 8. Commit

Single commit on `qa/wmc-agent-b-journeys`:
```
docs(wmc): Agent B QA — practitioner/booking/PWA/admin smoke report
```

---

*Generated by Agent B QA run on 2026-11-11. Staging: mediumslateblue-eagle-960503.hostingersite.com. Branch baseline: 069977bdd25714b221b62ca39ab1c2b74a06d511.*
