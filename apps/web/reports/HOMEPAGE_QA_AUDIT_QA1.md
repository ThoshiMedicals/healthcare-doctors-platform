# Homepage QA Audit — QA1

**Assessed:** 2026-10-26  
**Environment:** UAT `http://127.0.0.1:3100/`  
**Method:** Live desktop + mobile review of `public/index.html` against platform architecture and visual system (hero → footer)

## Homepage Score

| Headline | Score |
| --- | ---: |
| **Homepage Score** | **88** |

**Recommendation:** `MATCHES_WITH_POLISH`

The homepage matches the intended architecture: brand-led hero, trust ladder, Book primary CTA, docked Digital Reception, service hubs, practitioner pathways, and institutional footer. Remaining work is polish (a11y duplicates, CSS override debt, mobile hero clip) — not a structural miss.

Score = 60% mean(section scores) + 40% mean(check scores).

## Section review

| Section | Score | Verdict |
| --- | ---: | --- |
| Hero | 90 | Strong — slogan, dual CTAs, hours, trust chips, clinic photo |
| Navigation | 88 | Strong — full IA; L5 dock owns Book/Call/Ask ≤1024 |
| Trust row | 91 | Strong — AGPAL / bulk billing / Open 7 days + register copy |
| Booking CTA | 93 | Excellent — HotDoc + resilience fallback + mid-page book band |
| Digital Reception CTA | 89 | Strong — dock teal assist (not primary-nav clutter) |
| Service pathways | 86 | Good — six hubs; title-only hit areas |
| Practitioner pathways | 84 | Good — carousel pathways; early placement + duplicate links |
| Footer | 85 | Good — trust/hours/contact; accordion + “Call Call” a11y |

## Check scores

| Check | Score |
| --- | ---: |
| Visual consistency | 87 |
| Typography | 86 |
| Spacing | 88 |
| Component usage | 85 |
| Trust visibility | 92 |
| Conversion hierarchy | 90 |
| Mobile layout | 84 |
| Desktop layout | 91 |
| Accessibility | 82 |

## Functional issues

| ID | Sev | Section | Issue |
| --- | --- | --- | --- |
| F1 | P1 | Footer | Phone announces “Call Call …” |
| F2 | P1 | Practitioners | Portrait + View profile duplicate accessible names |
| F3 | P2 | Booking / HotDoc | Nameless store hotspot links |
| F4 | P2 | Services | Only title is linked (row copy not clickable) |
| F5 | P3 | Hero | Mobile preload uses desktop hero asset |

## Visual issues

| ID | Sev | Section | Issue |
| --- | --- | --- | --- |
| V1 | P1 | Hero | Mobile H1 can clip under sticky chrome on scroll |
| V2 | P2 | Booking | High CTA density mid-page |
| V3 | P2 | Practitioners | Team carousel immediately after hero feels directory-like |
| V4 | P3 | Hero | Mobile Call is text-only vs desktop paired pills |

## Design-system deviations

| ID | Sev | Section | Issue |
| --- | --- | --- | --- |
| D1 | P1 | Cross-cutting | `styles.css` patch layering / `!important` debt |
| D2 | P2 | Footer | Open `<details>` duplicates visible `h3` titles |
| D3 | P2 | Cross-cutting | Type tokens only partially migrated (4G scaffold) |
| D4 | P3 | Trust | Trust marks reuse assets without one shared component |

## Priority fixes

1. **F1** — Fix footer tel accessible name (single “Call”).  
2. **F2** — Make portrait decorative-or-one-link; keep one profile control.  
3. **V1** — Add scroll-margin / padding so mobile H1 never clips.  
4. **D1** — Consolidate hero/dock/trust overrides into named component rules.  
5. **F3** — Hide hotspot links from a11y tree or give unique names.  
6. **D2** — Drop duplicate footer headings or close details by default on mobile.

## Architecture fit

| Expected platform piece | Homepage presence |
| --- | --- |
| Brand-first hero | Yes |
| Trust before deep content | Yes (in-hero + story) |
| Book as primary conversion | Yes |
| Digital Reception as assist CTA | Yes (persistent dock) |
| Service hubs | Yes (`#healthcare-services`) |
| Practitioner pathways | Yes (`#team` carousel) |
| Institutional footer | Yes |

## Success criteria

**Homepage matches the intended platform architecture and visual system** — **met with polish**. No P0 blockers; Homepage Score **88**.
