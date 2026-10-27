# Practitioner Profile QA Audit — QA2

**Assessed:** 2026-10-26  
**Environment:** UAT `http://127.0.0.1:3100/`  
**Corpus:** All 13 practitioner templates in `old-html/doctors/*.html`  
**Live samples:** Dr Tanya Goodwill, Dr Mary Abadir (phone-book), Dr Nirupa Sivathasan (no photo)

## Headline scores

| Score | Value |
| --- | ---: |
| **Consistency score** | **90** |
| **Visual score** | **85** |
| **Functional score** | **89** |
| **Compliance score** | **88** |

**Recommendation:** `ONE_LANGUAGE_WITH_POLISH`

All practitioner pages share one template grammar and one conversion model (HotDoc deep-link Book + Call + Digital Reception dock), with an intentional phone-only booking variant for Dr Mary Abadir. Remaining gaps are imagery parity, Call accessible-name duplication, and aside chrome — not competing layouts.

## Conversion model (one model)

| Path | Behaviour | Coverage |
| --- | --- | ---: |
| Primary | Practitioner HotDoc deep-link `Book Appointment` | 12 / 13 |
| Phone-only variant | `Call reception to book` (no online HotDoc doctor URL) | 1 / 13 (Mary Abadir) |
| Contact | Clinic `tel:+61732173344` throughout | 13 / 13 |
| Assist | Persistent dock Book · Call · Digital Reception | 13 / 13 |
| Mid-page | Runtime `Ready to book with {name}?` band (`site.js`) | 13 / 13 (live) |

## Template checklist (static + runtime)

| Requirement | Result |
| --- | --- |
| Doctor hero shell + role + care highlights | **13 / 13** |
| Booking CTA present | **13 / 13** |
| Related Services | **13 / 13** |
| Related knowledge / patient guides | **13 / 13** |
| Trust marks (footer AGPAL / bulk billing) | **13 / 13** |
| On-this-page + FAQ + Planning your visit | **13 / 13** |
| Runtime: published-care caption | **Live on samples** (`site.js`) |
| Runtime: peer authority band | **Live on samples** (`site.js`) |
| Profile photography | **11 / 13** (missing Nirupa, Samuel) |

## Dimension scores

| Dimension | Score | Notes |
| --- | ---: | --- |
| Booking paths | 90 | Deep-links + phone-only variant clear |
| Contact actions | 84 | Call works; “Call Call” a11y defect |
| Authority sections | 92 | Care chips + peers + provenance |
| Related services | 91 | Present on all templates |
| Related knowledge | 90 | Present; volume varies |
| Trust strips | 88 | Footer trust; hero trust lighter than homepage |
| Profile imagery | 78 | Two missing photos + sparse chip heroes |
| Typography | 86 | Shared serif/sans; qual formatting drifts |
| Spacing | 88 | Calm institutional spacing retained |
| Mobile behaviour | 87 | Dock owns Book/Call/Ask; template readable |

## Compliance report — findings

### Priority fixes

1. **P-V1 (P1)** — Add / restore photography for Dr Nirupa Sivathasan and Mr Samuel Stafford (or ship a designed empty-state portrait).  
2. **P-F1 (P1)** — Fix duplicated “Call Call …” accessible names on profile CTAs.  

### Additional polish

| ID | Sev | Issue |
| --- | --- | --- |
| P-C1 | P2 | Qualification string formatting not standardised |
| P-C2 | P2 | Aside still Patient Information ops list (peers in-page only) |
| P-F2 | P2 | Mary Abadir phone-book must keep dock/header labels phone-first |
| P-V2 | P2 | Sparse care-highlight heroes look empty |
| P-F3 | P3 | Related guide counts uneven (3–18) |
| P-C3 | P3 | Authority bands depend on `site.js` (not in static HTML alone) |

## Success criteria

**All practitioner pages follow one design language and one conversion model** — **met with polish**.

- **Design language:** Shared hero, on-this-page journey, authority enrichment, related services/knowledge, FAQ, planning, footer trust, dock.  
- **Conversion model:** Book (HotDoc or explicit phone-book) + Call + Digital Reception — no competing third model.
