# Trust & Authority QA Audit — QA7

**Assessed:** 2026-10-26  
**Environment:** UAT `http://127.0.0.1:3100/`  
**Surfaces:** Homepage trust ladder · AGPAL accreditation page · footer trust marks · governance hosts · practitioner peers · service pathways · knowledge bylines  
**Live samples:** AGPAL Accreditation, Dr Tanya Goodwill (peers), Family Health (prior QA)

## Headline scores

| Score | Value |
| --- | ---: |
| **Trust maturity score** | **91** |
| **Authority maturity score** | **79** |
| **Compliance score** | **85** |

**Recommendation:** `TRUST_STRONG_AUTHORITY_POLISH`

Practice trust signals (AGPAL, bulk billing, Open 7 days, footer marks) are mature and consistently placed. Authority *implementation* is half-complete: practitioner peer graphs and service pathways work live, but the published governance registry is empty so review strips never appear.

## Dimension scores

| Check | Score | Notes |
| --- | ---: | --- |
| Trust strips | 90 | Footer AGPAL/bulk on all templates; homepage hero trust excellent |
| Governance strips | 62 | Hosts present; `WMC_APPROVED_GOVERNANCE = {}` → never populated |
| AGPAL | 94 | Dedicated page + register-dated copy + ACSQHC/AGPAL/RACGP links |
| Authority pathways | 88 | Service/knowledge ↔ practitioners ↔ booking rails live |
| Review locations | 70 | Bylines Updated only; no Reviewed by / Next review live |
| Practitioner authority | 91 | Care chips + peer band + provenance captions live via site.js |
| Service authority | 84 | Hubs strong; 14 procedure pages thin on doctor links |

## Coverage

| Signal | Coverage |
| --- | --- |
| Footer trust (doctors) | **13 / 13** |
| Footer trust (services) | **29 / 29** |
| Footer trust (knowledge) | **109 / 109** |
| Governance hosts | Present on doctors + services + knowledge |
| Governance records published | **0** |
| Knowledge bylines | **74 / 87** articles |
| Service related-practitioners (static) | **16 / 29** |

## Score composition

- **Trust maturity** = mean(trust strips, AGPAL, homepage/footer ubiquity 89) → **91**  
- **Authority maturity** = mean(governance, review, practitioner, service, pathways) → **79**

## Priority fixes

1. **T-A1 (P1)** — Publish approved ClinicalReview records into `governance-published.js`.  
2. **T-A2 (P1)** — Surface clinical authorship / ownership (not only generic Updated stamps).

## Recommendations

| ID | When | Action |
| --- | --- | --- |
| **T-R1** | **Now** | Populate governance registry so review strips render |
| **T-R2** | **Now** | Named reviewer or explicit clinic editorial ownership |
| T-R3 | Next | Close service practitioner authority gaps on procedures |
| T-R4 | Next | Embed critical peer/provenance HTML (survive without site.js) |
| T-R5 | Later | Optional mid-page trust ladder on long templates without hero trust |

## Additional findings

| ID | Sev | Issue |
| --- | --- | --- |
| T-S1 | P2 | Service practitioner graph uneven (16/29 static) |
| T-T1 | P2 | Mid-page trust strips removed; footer carries trust on templates |
| T-A3 | P2 | Practitioner peer authority runtime-injected |
| T-T2 | P3 | Call Call accessible-name duplication |

## Live evidence notes

- **AGPAL page:** Register-dated status through 22 March 2029; checked 7 October 2026; independent ACSQHC/AGPAL/RACGP links; clinical governance section.  
- **Tanya Goodwill:** Published care areas + peer cards with shared care provenance.  
- **Knowledge / governance:** Hosts remain hidden while published map is empty (QA4 confirmed).

## Success criteria

**Patients see credible practice trust and published clinical authority** — **trust met; authority polish required** (publish governance + ownership).
