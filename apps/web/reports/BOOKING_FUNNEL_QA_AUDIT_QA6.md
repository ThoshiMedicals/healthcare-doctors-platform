# Booking Funnel QA Audit — QA6

**Assessed:** 2026-10-26  
**Environment:** UAT `http://127.0.0.1:3100/`  
**Surfaces:** Homepage · 13 practitioners · 29 services · HotDoc lightbox + `booking-resilience.js` · persistent dock  
**Live samples:** Homepage, Dr Tanya Goodwill (HotDoc), Dr Mary Abadir (phone-only), Family Health hub

## Conversion score

| Headline | Score |
| --- | ---: |
| **Conversion score** | **89** |

**Recommendation:** `CONVERSION_STRONG_WITH_FRICTION`

Booking funnels are consistent: Book (HotDoc) + Call + Digital Reception dock across homepage, practitioners, and services, with resilience when lightbox fails. Remaining friction is accessible Call labelling, phone-only chrome leftovers on Mary Abadir, and independent-provider Book semantics.

Conversion Score = mean of seven funnel dimensions.

## Dimension scores

| Check | Score | Notes |
| --- | ---: | --- |
| Homepage | 93 | Hero + header + dock Book; trust chips beside CTAs |
| Practitioners | 90 | 12/13 HotDoc deep-link; 1/13 phone-only; Ready-to-book band |
| Services | 89 | Book on 29/29 + Guides/practitioners/booking rail live |
| Call actions | 84 | Tel present everywhere; “Call Call …” a11y defect |
| HotDoc journeys | 91 | Lightbox primary + tab/phone recovery |
| Mobile booking | 88 | Dock Book/Call/Ask; mobile header Book/Call |
| Trust placement | 90 | Hero AGPAL/bulk billing; footer trust; service costs copy |

## Coverage

| Surface | Booking coverage |
| --- | --- |
| Homepage Book CTAs (live) | **8** HotDoc Book controls |
| Practitioners with book path | **13 / 13** |
| Phone-only practitioner | **1 / 13** (Mary Abadir) |
| Services with Book | **29 / 29** |
| Services with persistent dock | **29 / 29** |
| booking-resilience.js | Present on audited templates |

## Booking friction report

| ID | Sev | Surface | Friction |
| --- | --- | --- | --- |
| **B-F1** | **P1** | Call | Accessible name duplicates “Call Call …” |
| **B-F2** | **P1** | Practitioners | Phone-only Mary still shows Book Appointment TOC / mid-page chrome |
| B-F3 | P2 | HotDoc | Recovery dialog always in DOM; can surface in a11y tree while hidden |
| B-F4 | P2 | Homepage | Many parallel Book CTAs compete on mobile scroll |
| B-F5 | P2 | Services | Independent providers still offer clinic Book dock |
| B-F6 | P3 | Practitioners | `tel:…?wp=w_lightbox` leftover on phone-book CTA |
| B-F7 | P3 | Mobile | Header Book can compete with dock on mid-width tablets |

## Recommendations

| ID | When | Action |
| --- | --- | --- |
| **B-R1** | **Now** | Fix Call accessible names sitewide |
| **B-R2** | **Now** | Phone-first labels on Mary Abadir (TOC, mid-page, suppress irrelevant HotDoc recovery) |
| B-R3 | Next | Keep resilience; inert/exclude recovery region until opened |
| B-R4 | Next | Clarify independent-provider booking vs clinic HotDoc |
| B-R5 | Later | Demote mid-page homepage Book repeats on small viewports |

## Funnel model (one conversion grammar)

```
Primary:  Book Appointment → HotDoc lightbox (practitioner deep-link when available)
Variant:  Call Reception to Book (phone-only profiles)
Secondary: Call clinic tel:+61732173344
Assist:   Digital Reception (Ask us) in persistent dock
Fallback: booking-resilience → open HotDoc tab + Call Clinic
Trust:    AGPAL / bulk billing / hours near primary CTAs + footer
```

## Live evidence notes

- **Homepage:** Book in header/hero/body/dock; trust chips + footer AGPAL; recovery hidden.  
- **Tanya Goodwill:** Ready-to-book band; HotDoc Book; dock Book + Call + Ask.  
- **Mary Abadir:** Dock “Call Reception to Book”; FAQ/copy phone-only; residual Book Appointment labels remain.  
- **Family Health:** Guides · practitioners · booking rail with Book this service; dock; bulk-billing costs copy.

## Success criteria

**Patients can book or call from every major funnel with trust nearby** — **met with friction polish**.
