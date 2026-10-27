# Governance Management validation (PROMPT 3G)

Practice monitoring of governance status without opening each CMS record. Built on `ClinicalReview` rows. Does not invent public attribution fields.

## Location

- UI: `/admin/governance/management` (Clinic Admin / Super Admin — `clinical_signoff`)
- Dataset: `buildPracticeGovernanceManagementReport()` in `apps/web/src/governance/management-report.ts`
- Related: `/admin/governance` (record list), `/admin/governance/expiry` (public-visibility expiry buckets)

## Display

| Block | Definition |
| --- | --- |
| Pages Awaiting Review | Status `draft`, `under_review`, or `review_due` |
| Pages Due Within 60 Days | Next Review Due between today and today+60 (Australia/Brisbane) |
| Pages Expired | Next Review Due before today |
| Pages Missing Ownership | Content Owner blank |
| Pages Missing Approval | Not approved/published, or approver/approval date missing |
| Pages Missing Review Metadata | Missing reviewer, last reviewed, next review due, or evidence reference |
| Breakdowns | Services · Health Advice · Patient Information · Practitioners · Updates |
| Review workload by month | Pages grouped by Next Review Due month |

## Collection mapping

| Display | `ContentCollection` |
| --- | --- |
| Services | `service` |
| Health Advice | `knowledge_topic`, `knowledge_article` |
| Patient Information | `practice_information`, `faq` |
| Practitioners | `practitioner` |
| Updates | `update` |

## Tests

```bash
cd apps/web
npx tsx --test src/governance/management-report.test.ts
```
