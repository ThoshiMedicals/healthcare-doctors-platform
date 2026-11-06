# Attraction platform — publish-ready synthetic content

Populates Attraction CMS with six packs:

| Pack | Kind | Slug |
| --- | --- | --- |
| GP Opportunities | `opportunities` | `gp-opportunities` |
| FAQ | `faq` | `gp-faq` |
| Practice Experience Content Pack | `practice_experience` | `hub` |
| Catchment Analysis | `catchment_analysis` | `inner-south-catchment` |
| Continuity Network | `continuity_network` | `local-continuity-network` |
| Clinical Interests Framework | `clinical_interests` | `clinical-interests-framework` |

## Rules encoded

- `contentClass: synthetic_placeholder` on every body
- No fake named doctors — composite role labels only
- No invented earnings, testimonials or fabricated statistics
- Catchment suburbs from published `community.html` / `local-healthcare-access.html`
- Phase 1 still blocks production HTML publish

## How to load

Admin: **Populate publish-ready content** on `/admin/attraction`  
API: `POST /api/admin/attraction/documents` with `{ "action": "seed_publish_ready" }`  
Code: `seedAttractionPublishReadyContent(clinicId)`

## Source modules

`apps/web/src/attraction-cms/content/*.ts`
