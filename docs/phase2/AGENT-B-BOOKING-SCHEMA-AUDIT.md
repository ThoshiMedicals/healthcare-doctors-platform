# Agent B — Booking, Schema & Content Consistency Audit (Phase 2)

**Worktree:** `WMC-p2-agent-b`  
**Branch:** `phase2/agent-b-booking`  
**Baseline:** `6f1b0b28513e0be2c5d74392e94182f0aa49b05c`  
**Audited:** 2026-11-11 (static golden + code-path review; no DB reads/writes)

## Executive summary

All **15** published practitioner profiles in `PUBLISHED_PRACTITIONER_ROUTES` were reviewed against `PRACTITIONER_BOOKING_MATRIX` policy, golden HTML booking chrome (where present), and runtime presentation layers (`practitioner-booking`, `phone-only-booking`, `booking-restriction-notice`, `public-ux`, `authority-refinements`, `render-published-document`).

| Verdict | Detail |
| --- | --- |
| **Policy matrix (5 named)** | Golnar, Tanya, James, Yamesha = ONLINE; Mary = PHONE_ONLY — code and golden fixtures align. |
| **Golden HTML** | **12/15** profiles have `old-html` fixtures; **Golnar, James, Yamesha** are CMS-import-only (injected at render). |
| **Mary vs HotDoc** | Golden Mary has **zero** HotDoc URLs; all book controls use `tel:+61732173344`. Runtime `alignPhoneOnlyPractitionerChrome` guards stray HotDoc in header/dock when primary CTA remains `tel:`. |
| **Schema (stored)** | Person nodes use canonical `url` (`/doctors/*.html`) but **WordPress `sameAs`** (`/doctor/…/`); `areaServed` absent on Person. **Runtime** `enrichPractitionerPersonSchema` backfills `areaServed` and rewrites `sameAs` when `url` is canonical. |
| **Risk (low)** | CMS-only trio + live `bookingUrl` not verified in this audit (requires DB). `potentialAction.target.urlTemplate` often omits `?wp=w_lightbox` while visible anchors include it. |

Machine-readable golden extract: `apps/web/.tmp-phase2-agent-b.json`.

---

## A. Booking consistency report (all 15)

**Legend:**  
- **Mode (policy):** Owner matrix when listed; otherwise inferred from golden primary CTA.  
- **Golden primary:** `doctor-profile-actions` → first `wmc-book-appointment` href.  
- **Runtime:** Presentation-only transforms on the response HTML (stored revisions unchanged).

| # | Display name | Profile path | Golden fixture | Policy mode | Golden primary CTA | Sticky dock (golden) | Special rules | Runtime alignment |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Dr Anand Singh | `doctors/dr-anand-singh.html` | yes | ONLINE | HotDoc `…/dr-anand-singh-does-not-bulk-bill-for-insurance-patients?wp=w_lightbox` | Same HotDoc | Insurance slug + notice in golden | Insurance notice inject if missing; schema enrich |
| 2 | Dr Debra Larkins | `doctors/dr-debra-larkins.html` | yes | ONLINE | HotDoc insurance slug | Same | Insurance notice in golden | Same as Anand |
| 3 | Dr Golnar Mortezaei | `doctors/dr-golnar-mortezaei.html` | **no** | **ONLINE** | CMS / fallback | CMS | `resolvePractitionerBookingHref` → `GOLNAR_APPROVED_HOTDOC_URL` when CMS null/tel/clinic-level | `alignGolnarOnlineBookingChrome` (render + `public-ux`); prose upgrade for phone-only copy |
| 4 | Dr James Chanaka | `doctors/dr-james.html` | **no** | **ONLINE** | CMS | CMS | Matrix member; CMS import | CMS `bookingUrl` pass-through; directory inject uses resolver |
| 5 | Dr Kooshyar Karimi | `doctors/dr-kooshyar-karimi.html` | yes | ONLINE | HotDoc `…/dr-kooshyar-karimi-2?wp=w_lightbox` | Same | — | Standard HotDoc chrome |
| 6 | Dr Mary Abadir | `doctors/dr-mary-abadir.html` | yes | **PHONE_ONLY** | `tel:+61732173344` “Call Reception to Book” | `tel:+61732173344` | No HotDoc in golden; no `potentialAction` in Person schema | `alignPhoneOnlyPractitionerChrome`; **not** subject to Golnar upgrade |
| 7 | Dr Nirupa Sivathasan | `doctors/dr-nirupa-sivathasan.html` | yes | ONLINE | HotDoc `…/dr-nirupa-sivathasan?wp=w_lightbox` | Same | — | Standard |
| 8 | Dr Sambo Luon | `doctors/dr-sambo-luon.html` | yes | ONLINE | HotDoc insurance slug | Same | Insurance notice in golden | Insurance notice inject |
| 9 | Dr Steven Chang | `doctors/dr-steven-chang.html` | yes | ONLINE | HotDoc `…/dr-steven-chang-1?wp=w_lightbox` | Same | Allied / chiro; on `team-allied-health` | Standard |
| 10 | Dr Sumita Singh | `doctors/dr-sumita-singh.html` | yes | ONLINE | HotDoc insurance slug | Same | Insurance notice in golden | Insurance notice inject |
| 11 | Dr Tanya Goodwill | `doctors/dr-tanya-goodwill.html` | yes | **ONLINE** | HotDoc insurance slug (preserved) | Same | Matrix; insurance notice | `ensureInsuranceBookingNoticesInHtml`; do not invent alternate slug |
| 12 | Dr Usman Gul | `doctors/dr-usman-gul.html` | yes | ONLINE | HotDoc `…/strictly-seeing-male-patients-only?wp=w_lightbox` | Same | **Male-only** restriction notice (authored); not insurance slug | Leave Usman path alone per policy |
| 13 | Dr Wasantha Hettiarchchi | `doctors/dr-wasantha-hettiarchchi.html` | yes | ONLINE | HotDoc `…/dr-wasantha-hettiarachchi-1?wp=w_lightbox` | Same | HotDoc path spelling `hettiarachchi` vs file `hettiarchchi` (existing HotDoc equity) | No slug invention |
| 14 | Dr Yamesha Ranatunga | `doctors/dr-yamesha-ranatunga.html` | **no** | **ONLINE** | CMS | CMS | Matrix; CMS import | CMS `bookingUrl` pass-through |
| 15 | Mr Samuel Stafford | `doctors/mr-samuel-stafford.html` | yes | ONLINE | HotDoc `…/samuel-stafford-physiotherapist?wp=w_lightbox` | Same | Allied physiotherapist | Standard |

### Named policy checks

| Practitioner | Expected | Evidence |
| --- | --- | --- |
| **Golnar** | ONLINE; fallback OK if `bookingUrl` null/tel/clinic-level | `GOLNAR_APPROVED_HOTDOC_URL` in `practitioner-booking.ts`; double application in `render-published-document.ts` and `public-ux.ts` |
| **Mary** | PHONE_ONLY | Golden: 0 HotDoc hrefs; primary + sticky + header + mobile all `tel:`; `htmlIndicatesPhoneOnlyPractitioner` true |
| **Tanya / James / Yamesha** | ONLINE | Matrix + published route inventory; Tanya insurance slug preserved in golden |

### Directory & profile CTAs

| Surface | Behaviour |
| --- | --- |
| **Golden `team-general-practitioners.html`** | Links only golden GP cards; **does not** list Golnar / James / Yamesha (CMS inject via `inject-cms-practitioners.ts`). |
| **Golden `team.html` / `team-allied-health.html`** | Cards link to inventory profile paths (e.g. Tanya, Mary, Steven, Samuel) per `published-practitioner-routes.test.ts`. |
| **CMS discovery cards** | `bookHref = resolvePractitionerBookingHref(slug, bookingUrl) \|\| tel:`; Golnar gets fallback HotDoc when CMS weak. |
| **Profile chrome** | Primary, header, mobile quick-actions, and sticky `.persistent-care-book` share one HotDoc or tel destination per practitioner in golden (Mary: all tel). |

### FAQ & booking prose

- Practitioner FAQs are predominantly embedded in **FAQPage JSON-LD** inside golden HTML (not always duplicated as visible FAQ blocks).
- **Golnar:** Runtime rewrites legacy telephone-only FAQ/body copy on profile + welcome (`alignGolnarOnlineBookingProse`).
- **Mary:** Golden CTAs and appointment sections are telephone-first; `alignPhoneOnlyBookingProse` runs on **welcome updates** when `bookingHref` is phone-only (`render-published-document.ts`), not on doctor profile pages — acceptable if stored profile copy already matches policy (golden does).
- **Phone-only meta:** `alignPhoneOnlyBookingProse` rewrites meta/OG when booking href is tel/null (welcome surfaces).

### Canonical URLs & internal links

- All **12** golden doctor profiles use `<link rel="canonical" href="https://gabbamedicalcentre.com.au/doctors/{slug}.html"/>`, matching Person `url` in JSON-LD.
- **WordPress legacy:** `/doctor/{slug}` → `/doctors/{slug}.html` for published inventory (`wordpress-legacy-redirects` + tests). Gemunu remains directory redirect only.
- **Internal:** Side-nav includes `../book-appointment.html` on profiles (clinic-level booking education, not practitioner HotDoc).

---

## B. Schema gap matrix

Audit columns: **Stored (golden)** vs **After runtime** (`applyAuthoritySeoRefinements` → `enrichPractitionerPersonSchema`).

| Practitioner | `sameAs` WP legacy (stored) | `areaServed` (stored) | `knowsLanguage` | `hasCredential` / `credential` | `potentialAction` (stored) | Runtime fixes |
| --- | --- | --- | --- | --- | --- | --- |
| Anand | `/doctor/dr-anand-singh/` | null | EN, Hindi | hasCredential ✓ | ReserveAction → insurance HotDoc path | sameAs → canonical; areaServed ×7 suburbs |
| Debra | WP legacy | null | EN | hasCredential ✓ | ReserveAction | same |
| Golnar | (CMS — not in golden) | — | — | — | — | same enrich when page served |
| James | (CMS) | — | — | — | — | same |
| Kooshyar | WP legacy | null | AR, EN, FA, TR | hasCredential ✓ | ReserveAction | same |
| Mary | WP legacy | null | **null** | hasCredential ✓ | **null** (phone booking) | sameAs + areaServed; no HotDoc `potentialAction` invented |
| Nirupa | WP legacy | null | **null** | hasCredential ✓ | ReserveAction | same |
| Sambo | WP legacy | null | EN, Km, Zh | hasCredential ✓ | ReserveAction (insurance path) | same |
| Steven | `/doctor/dr-steven-chang-chiropractor/` | null | EN, Zh-TW variants | hasCredential ✓ | ReserveAction | same |
| Sumita | WP legacy | null | EN, Hindi | hasCredential ✓ | ReserveAction (insurance) | same |
| Tanya | WP legacy | null | EN | hasCredential ✓ | ReserveAction (insurance) | same |
| Usman | WP legacy | null | EN, Urdu | hasCredential ✓ | ReserveAction (male-only slug) | same |
| Wasantha | WP legacy | null | EN, Sinhala | hasCredential ✓ | ReserveAction | same |
| Yamesha | (CMS) | — | — | — | — | same enrich when served |
| Samuel | WP legacy | null | **null** | **hasCredential false** | ReserveAction | same; credential content gap in stored JSON only |

**Cross-cutting gaps (stored content, not policy):**

1. **Person `sameAs`:** 12/12 golden profiles still reference WordPress `/doctor/…/` URLs — **runtime rewrite active** when Person `url` is `/doctors/*.html`.
2. **Person `areaServed`:** Missing in stored JSON for all golden profiles — **runtime inject** from `CLINIC_AREA_SERVED`.
3. **`credential` object:** Often empty while `hasCredential` is true (boolean flag only); no runtime invention (by design in `authority-refinements.ts`).
4. **`potentialAction` vs UI:** `urlTemplate` frequently lacks `?wp=w_lightbox` while page anchors include it — cosmetic/schema consistency only; do not change HotDoc destinations.
5. **Mary:** Absence of `potentialAction` matches phone-only policy (correct).

---

## C. Proposed safe corrections (no policy changes)

These are either **already implemented** at runtime or **operator/CMS** optional parity — none alter the five-practitioner matrix.

| Item | Status | Recommendation |
| --- | --- | --- |
| Golnar ONLINE when CMS `bookingUrl` null/tel/clinic-list | **Present** | Keep `resolvePractitionerBookingHref` + `alignGolnarOnlineBookingChrome`; optional CMS republish with authorised URL for durable parity (see `docs/WMC-GOLNAR-HOTDOC-AGENT-B-REPORT.md`). |
| Mary PHONE_ONLY vs stray HotDoc chrome | **Present** | Keep `alignPhoneOnlyPractitionerChrome`; verify live CMS never sets HotDoc on Mary (would still be overridden in chrome when primary remains tel). |
| Tanya / insurance GPs notices | **Present** | `ensureInsuranceBookingNoticesInHtml` — idempotent; golden already has notices for Anand, Debra, Sambo, Sumita, Tanya. |
| Usman male-only slug | **Present** | Do not map to insurance notice helper; preserve authored `.practitioner-booking-notice`. |
| WordPress `sameAs` + `areaServed` | **Present** | `enrichPractitionerPersonSchema` via `applyAuthoritySeoRefinements` on render (last in pipeline). |
| CMS trio directory presence | **Present** | `inject-cms-practitioners` + `resolvePractitionerBookingHref` on cards. |
| Stored golden updates | **Out of scope** | Do not edit `old-html/` for Golnar/James/Yamesha; CMS remains source for imported profiles. |
| `potentialAction` query parity | **Optional future** | Presentation-only normalisation could append `?wp=w_lightbox` to match anchors — low priority, no booking policy impact. |
| Samuel `hasCredential` / languages | **CMS content** | Enrich published payload when operator approves; not a booking-policy change. |

**Render pipeline order (relevant):** CMS injects → Golnar welcome/profile align → `applyPublicUxRefinements` (Golnar + Mary chrome, insurance notices) → `applyAuthoritySeoRefinements` (Person schema).

---

## D. Regression test recommendations

Existing coverage (run in `apps/web` with dependencies installed):

- `practitioner-booking.test.ts` — matrix, Golnar fallback, Mary isolation.
- `phone-only-booking.test.ts` — Mary chrome, welcome prose, Golnar not forced phone-only.
- `booking-restriction-notice.test.ts` — Tanya insurance slug; Mary/Usman exclusions.
- `published-practitioner-routes.test.ts` — inventory 15, legacy redirects, directory links, matrix.
- `authority-refinements.test.ts` — `sameAs` + `areaServed` enrich.

**Recommended additions (Phase 2 / no policy change):**

1. **Golden fixture harness** — Extend `readPublicHtml` loop over all 12 golden doctor paths: assert primary `wmc-book-appointment` href equals sticky `.persistent-care-book` href; Mary must match `^tel:`; online GPs must match `hotdoc.com.au`.
2. **Full-render snapshot (DB test)** — For CMS trio + Golnar, `publish-render` or `practitioner-qa-audit` style assertion: rendered HTML contains expected book href (Golnar fallback when fixture simulates null `bookingUrl`).
3. **Schema contract** — After `applyAuthoritySeoRefinements`, every `doctors/*.html` response: Person has `areaServed.length === 7`, `sameAs` contains only `/doctors/*.html`, no `/doctor/` paths.
4. **Insurance roster** — Parametrised test for Anand, Debra, Sambo, Sumita, Tanya: `hotdocPathHasInsuranceRestriction` true and notice text present in output HTML.
5. **Usman guard** — Assert male-only HotDoc href unchanged and insurance helper does not inject duplicate notice.
6. **Directory inject** — Mock `listImportedPublishedPractitioners` returning Golnar with null `bookingUrl`; GP directory card href equals `GOLNAR_APPROVED_HOTDOC_URL`.
7. **Mary live regression** — Assert rendered profile has zero `hotdoc.com.au` in `doctor-profile-actions` and `persistent-care-book`.
8. **CI gate** — Add focused npm script `test:agent-b-booking` chaining the five modules above (local audit could not execute `tsx` on this machine).

---

## References (read-only)

| Module | Role |
| --- | --- |
| `apps/web/src/documents/practitioner-booking.ts` | Five-practitioner matrix, Golnar resolver & chrome |
| `apps/web/src/documents/phone-only-booking.ts` | Mary-style tel chrome & welcome prose |
| `apps/web/src/documents/booking-restriction-notice.ts` | Insurance slug notices |
| `apps/web/src/documents/public-ux.ts` | Golnar + Mary chrome; insurance inject |
| `apps/web/src/documents/render-published-document.ts` | Inject + Golnar align ordering |
| `apps/web/src/seo/authority-refinements.ts` | `enrichPractitionerPersonSchema` |
| `apps/web/src/seo/published-practitioner-routes.ts` | Canonical 15 inventory |
| `apps/web/src/documents/inject-cms-practitioners.ts` | Directory booking CTAs |

---

*Agent B — booking/schema audit complete. No application source or policy files were modified in this worktree.*
