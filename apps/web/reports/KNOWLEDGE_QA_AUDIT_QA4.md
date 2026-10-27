# Educational Content QA Audit — QA4

**Assessed:** 2026-10-26  
**Environment:** UAT `http://127.0.0.1:3100/`  
**Corpus:** All 109 Knowledge Centre templates (`old-html/knowledge/` — 22 topic hubs + 87 articles)  
**Live samples:** Blood Pressure Explained, Why Preventive Healthcare Matters, Heart topic hub

## Headline scores

| Score | Value |
| --- | ---: |
| **Knowledge UX score** | **90** |
| **Authority score** | **73** |
| **Visual score** | **87** |
| **Compliance score** | **83** |

**Recommendation:** `UX_ALIGNED_AUTHORITY_POLISH`

Educational templates share a strong KC shell (hero → breadcrumb → On This Page → aside nav → article/hub body → related pathways → final CTA → dock). Conversion and internal linking are excellent live. Authority presentation is the gap: the published governance registry is empty, so review strips never appear, and bylines never name a clinician.

## Dimension scores

| Check | Score | Notes |
| --- | ---: | --- |
| Typography | 90 | Libre Baskerville H1 + Inter body 18px / ~1.65 lh |
| Readability | 88 | Sectioned H2 journey + mobile section toggle; no read-time aid |
| Governance strips | 62 | Hosts on 109/109; `WMC_APPROVED_GOVERNANCE = {}` → always hidden |
| Author visibility | 72 | Generic byline 74/87 articles; 0 named clinicians; topics none |
| Review information | 70 | “Updated” stamps only; no Reviewed by / Next review live |
| Knowledge pathways | 92 | Article related guides + hub guide grids + unified nav |
| Conversion bands | 91 | Mid-page Next step band + final CTA + HotDoc dock 109/109 |
| Internal linking | 89 | Services 109/109; practitioners strong on articles; AU sources |

## Template checklist

| Requirement | Result |
| --- | --- |
| H1 + KC article/hub shell | **109 / 109** |
| On this page | **109 / 109** |
| Book + Call + Digital Reception + site.js | **109 / 109** |
| Governance host markup | **109 / 109** |
| Governance strip populated live | **0 / 109** |
| knowledge-byline | **74 / 109** (0/22 topics; 74/87 articles) |
| Named clinician in byline | **0 / 87** |
| Related services links | **109 / 109** |
| Related knowledge (article pattern) | **87 / 109** (hubs use guide grids) |
| Conversion / final CTA | **109 / 109** |

## Score composition

- **Knowledge UX** = mean(typography, readability, pathways, conversion, linking) → **90**  
- **Authority** = mean(governance, author, review, clinical-link strength 88) → **73**  
- **Visual** = mean(typography, shell consistency 86, spacing/chrome 85) → **87**

## Priority fixes

1. **K-A1 (P1)** — Publish approved ClinicalReview records into `governance-published.js` so Reviewed by / Last reviewed / Next review / Content owner render on knowledge pages.  
2. **K-A2 (P1)** — Establish visible authorship model (named clinician reviewer, or explicit “Clinic editorial · clinical governance” ownership) on articles.

## Additional polish

| ID | Sev | Issue |
| --- | --- | --- |
| K-A3 | P2 | Review metadata limited to byline Updated date |
| K-U1 | P2 | Byline missing on 13 articles + all topic hubs |
| K-V1 | P2 | Call Call accessible-name duplication |
| K-U2 | P3 | No reading-time / key-takeaway aids |
| K-U3 | P3 | Hub vs article related-guides chrome differs (intentional) |

## Live evidence notes

- **Blood Pressure Explained:** conversion band “Next step” injected; related guides/services/doctors present; governance host empty/hidden; no byline.  
- **Why Preventive Healthcare Matters:** byline visible (`Patient education · Australian primary-care context · Updated 2026-10-08`); governance still hidden; disclaimer present.  
- **Heart hub:** guide search + patient-guide cards + practitioners; no byline; conversion + dock intact.

## Success criteria

**Educational templates deliver readable knowledge UX with visible clinical authority** — **UX met; authority polish required**.

- **UX / visual:** One KC design language across hubs and articles.  
- **Authority:** Markup ready; published registry and named ownership still outstanding.
