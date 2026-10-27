# Prompt 4C — Mid-page conversion bands

## Goal

Long pages had a conversion gap between the hero and the footer. 4C adds a reusable mid-page conversion system that extends the new-patients `critical-action-band` pattern.

## Pattern

| Type | Modifier | Typical CTAs |
|------|----------|--------------|
| Book Appointment | `conversion-band--book` | Book, Call |
| Call Reception | `conversion-band--call` | Call primary |
| Recommended Practitioner | `conversion-band--practitioner` | Book (practitioner HotDoc), Call, Related Service |
| Related Service | `conversion-band--service` | Book, Call, Related Guide/Service |
| Next Step | `conversion-band--next` | Book, Related Service, Call |

Shared classes: `conversion-band` + `critical-action-band`. Mid injects also use `conversion-band--mid`.

### Runtime (`site.js`)

1. Existing authored `.critical-action-band` nodes gain `conversion-band conversion-band--book` (new-patients and any future critical bands).
2. On long article pages (≥3 `.article-section` siblings, excluding FAQ / `#book`), a mid band is inserted after ~the 3rd section.
3. Hub/index pages and pages that already author a critical band skip mid injection.
4. Booking de-dupe keeps Book CTAs inside `.conversion-band` / `.critical-action-band` visible (so the dock can still exist without hiding the in-content next step).

### Styles (`styles.css`)

- Soft green-grey panel aligned with the critical band.
- Desktop: copy left, actions right.
- Mobile (≤700px): Book full-width; secondary actions in a 2-column grid.

## Verification (UAT `:3100`)

| Page | Result |
|------|--------|
| `/doctors/dr-tanya-goodwill.html` | Mid `conversion-band--practitioner` — Book / Call / Related Service |
| `/services/skin-checks.html` | Mid `conversion-band--service` — Book / Call / Related Guide |
| `/fees-billing.html` | Mid `conversion-band--book` — Need help with the next step? |
| `/knowledge/diabetes.html` | Mid `conversion-band--next` — Book / Call |
| `/knowledge/articles/understanding-type-2-diabetes.html` | Mid `conversion-band--next` — Book / Chronic Disease Care / Call |
| `/new-patients.html` | Authored critical band upgraded to `conversion-band--book`; no second mid band |

Screenshots: `apps/web/reports/qa-4c/qa-4c-practitioner-desktop.png`, `qa-4c-practitioner-mobile.png`.

## Rationale

- **Reuse, don’t invent:** Same HTML/CSS language as new-patients so conversion surfaces feel native.
- **Mid-scroll placement:** After ~3 sections is late enough to be informed, early enough to beat footer fatigue.
- **One primary surface:** Pages that already have a critical band keep that as the conversion surface.
- **Dock coexistence:** Mid-page Book stays visible; the care dock remains the persistent chrome control.
