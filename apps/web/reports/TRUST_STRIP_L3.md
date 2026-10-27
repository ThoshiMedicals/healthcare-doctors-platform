# L3 — Trust visibility beyond the homepage

**Date:** 2026-10-26  
**Objective:** Mid-journey trust signals so AGPAL / clinic experience / governance no longer depend on footer visibility.  
**Success:** Reusable `.trust-strip` appears near booking controls and conversion bands on inner pages.

---

## Delivered

### 1. Reusable trust strip component

| Layer | Location |
|---|---|
| Markup (runtime) | `apps/web/public/site.js` — L3 IIFE builds `.trust-strip` |
| Styles | `apps/web/public/styles.css` — `.trust-strip` / `__item` / `__mark` / `__label` |
| Sync | Mirrored to `old-html/site.js` + `old-html/styles.css` |

Structure:

- **AGPAL accredited** → `agpal-accreditation.html` (mark + label)
- **100% Medicare bulk billing** → `bulk-billing.html` (clinic experience)
- **Open 7 days** → `contact.html` (clinic experience)
- **Reviewed {date}** → only when `WMC_APPROVED_GOVERNANCE[page]` is approved and current (fail-closed)

Homepage keeps existing `.hero-trust-refined` and skips runtime injection.

### 2. Placement (near conversion / booking)

Up to **two** strips per page:

1. Immediately **before** service / practitioner / book / next conversion bands (and authored critical-action bands)
2. Immediately **before** `#book`, `.service-booking-cta`, `.booking-fallback`, `.doctor-profile-actions`
3. Fallback after page hero / first article section when neither surface exists

### 3. Surface coverage

| Signal | Always | Conditional |
|---|---|---|
| AGPAL | Yes | — |
| Clinic experience (bulk billing + Open 7 days) | Yes | — |
| Governance status | — | When L2 public registry has an approved, non-overdue record for the page |

### 4. Mobile visibility audit (UAT `:3100`, 390×844)

| Check | Result |
|---|---|
| Strip `display` | `grid` (2-column) |
| AGPAL chip | Full-width row, min-height **52px** |
| Billing + Open 7 days | Side-by-side, min-height **52px** |
| Hidden / `display:none` | No |
| Practitioner page (`dr-tanya-goodwill`) | Strip above `.doctor-profile-actions` + above mid `conversion-band--practitioner` |
| Service page (`skin-checks`) | Strip above mid `conversion-band--service` + above booking block |
| Footer dependency | Trust visible mid-journey without scrolling to footer |

---

## Verification notes

- Live governance chip remains **absent** until L2 approvals populate `governance-published.js` (correct fail-closed).
- Motion: mid-page strips use the existing `wmc-inview` pattern (opacity until scrolled); booking-adjacent strip is visible in the first scroll region on practitioner profiles.
- Footer AGPAL marks remain as a secondary confirmation, not the only trust surface.

---

## Operator follow-up (optional)

- Approve priority pages via L2 governance publish to light the governance chip on those strips.
- If a page needs a static authored strip, use class `trust-strip` (runtime skips duplicates next to itself).
