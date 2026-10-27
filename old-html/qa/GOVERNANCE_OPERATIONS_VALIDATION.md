# Governance operations validation (PROMPT 2H)

Governance workflow can scale across eligible pages without changing public attribution until a private approval exists.

## Coverage

| Collection | Expected in register |
| --- | --- |
| Knowledge Centre | All `knowledge/**/*.html` |
| Services | All `services/**/*.html` |
| Practitioner profiles | All `doctors/*.html` |
| Patient information / governance | Essential patient and policy pages listed in `check_governance_framework.py` |

Register: `cms/governance-records.json`  
Count mirror: `cms/governance-workflow.json` → `reviewPublication.registeredPages`

## Ownership metadata

Source: `cms/governance-ownership-metadata.json`

Public fields (labels):

- Reviewed By → `reviewedBy`
- Content Owner → `contentOwner`
- Last Reviewed → `lastReviewed`
- Next Review Due → `nextReview`

Private evidence fields stay outside the public web root and outside `governance-published.js`.

## Fail-closed public display

1. Eligible pages ship an empty, `hidden` host:  
   `<div data-governance-review data-governance-page="…" hidden></div>`
2. `governance-published.js` remains `{}` until private approvals are built.
3. `site.js` shows the four fields only when status is `approved`, all four strings are present, dates are valid ISO, Next Review Due is after Last Reviewed, and Next Review Due is still current in Australia/Brisbane.
4. Otherwise the host stays hidden with no children.

## Expiry reporting

```sh
python cms/tools/check_governance_framework.py --check
python cms/tools/report_governance_review_expiry.py --horizon-days 60
# or, when Python is unavailable locally:
node .tmp-pdf-convert/report-governance-expiry.mjs
```

- JSON report: `cms/governance-expiry-report.json`
- CMS report: `/admin/governance/expiry`
- CMS draft sync: `npm run governance:sync --prefix apps/web` upserts draft `ClinicalReview` rows for eligible pages without inventing public fields
- Reporting does not publish or invent review dates on public pages

## Manual checklist

1. Practitioner profile HTML contains one hidden governance host and loads `governance-published.js` before `site.js`.
2. Opening a doctor page shows **no** Reviewed By / Content Owner / Last Reviewed / Next Review Due text while the public bundle is empty.
3. Eligibility register includes every `doctors/*.html` path with `collection: practitioner` and `status: awaiting_review`.
4. Expiry report runs with zero approved rows and lists awaiting pages without writing public stamps.
5. Admin governance edit form labels match the four public field names; private evidence fields remain labelled private.
