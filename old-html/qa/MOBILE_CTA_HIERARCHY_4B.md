# Prompt 4B — Mobile CTA hierarchy

**Objective:** Reduce CTA competition on mobile; make primary actions obvious without clutter.

## Audit (before)

| Surface | Issue |
| --- | --- |
| Care dock | Three labelled pills of similar weight (Book / Call Clinic / Ask us) |
| Hero | Equal two-column Book + Call buttons |
| Mobile header | Book/Call present but already suppressed when dock is active |
| Service journeys | Mixed Book + Call button pairs competing with the dock |

Measured dock widths (390px): Book ~174 · Call ~81 · DR ~107.

## Changes (after)

1. **Mobile dock** — Grid `1fr · 48px · 48px`:
   - **Book Appointment** — labelled primary (navy, full remaining width, icon kept)
   - **Call** — icon-only (phone), outline; `aria-label` retained
   - **Digital Reception** — icon-only (chat), teal; `aria-label` retained
2. **Restriction notices** — Span full dock width (`grid-column: 1 / -1`) so Book is not squeezed into 48px
3. **Hero** — Book stacked full-width; Call Clinic demoted to underlined text link
4. **Journey / service CTA rows** — Column stack; Book filled; tel links as text

Desktop dock unchanged (labels remain).

## Accessibility

| Control | Accessible name |
| --- | --- |
| Book | Visible “Book Appointment” |
| Call | `aria-label="Call Woolloongabba Medical Centre on (07) 3217 3344"` |
| Digital Reception | `aria-label="Open Digital Reception — ask for information"` |

Touch targets ≥48×48px; focus outline 3px `#174f75`; forced-colors borders retained.

## Journey checks (390px)

| Page | Dock Book / Call / DR |
| --- | --- |
| Home | 254 / 48 / 48 |
| New Patients | 254 / 48 / 48 |
| Skin Checks (with restriction) | 254 / 48 / 48 |
| Mental Health | 254 / 48 / 48 |
| Telehealth | 254 / 48 / 48 |

## Screenshots

| File | View |
| --- | --- |
| `qa/4b-before-mobile-dock.png` | Before — competing labelled dock + equal hero CTAs |
| `qa/4b-after-mobile-hero.png` | After — Book primary, Call as text link |
| `qa/4b-after-mobile-dock-bar.png` | After — dock: labelled Book + icon Call + icon DR |

## Success criteria

Primary action (Book) is obvious; Call and Digital Reception stay available without visual clutter; names remain accessible.
