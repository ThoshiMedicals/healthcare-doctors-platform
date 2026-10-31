# Woolloongabba Medical Centre — controlled production recovery

Repository baseline: rg01-release-gate-repairs @ c7d7b33d46fe2ca11b5a75c9a9fa91869366b182.
No golden-master HTML, layout, content, schema, booking payload, navigation ownership or CMS metadata changes are made by this workflow.

## Batches and intended outcomes

| Batch | Page | Issue | Repair method | Expected outcome |
| --- | --- | --- | --- | --- |
| 1 | team.html | Known unsafe; missing hero/H1/intro/breadcrumb, protected drift requires sign-off | Exact frozen golden revision, explicit unsafe approval | Team opening and verified directory restored |
| 2 | services/family-health.html | Production Gap Audit flagged opening | Golden revision for opening-damaged; unsafe requires explicit individual review | Hero, service overview, approved SEO and links |
| 2 | services/mens-health.html | Production Gap Audit flagged opening | Same gated revision method | Approved service introduction and navigation |
| 2 | services/childrens-health.html | Production Gap Audit flagged opening | Same gated revision method | Approved service introduction and navigation |
| 2 | services/mental-health.html | Production Gap Audit flagged opening | Same gated revision method | Approved mental-health content |
| 2 | services/chronic-disease-care.html | Production Gap Audit flagged opening | Same gated revision method | Approved chronic-care content |
| 2 | services/skin-checks.html | Production Gap Audit flagged opening | Same gated revision method | Approved skin-check content |
| 3 | doctors/dr-tanya-goodwill.html | Production Gap Audit flagged profile opening | Same gated revision method; preserve published practitioner payload | Approved profile opening, care areas, booking |
| 3 | doctors/dr-wasantha-hettiarchchi.html | Production Gap Audit flagged profile opening | Same gated revision method; preserve published practitioner payload | Approved profile opening, care areas, booking |
| 3 | doctors/dr-kooshyar-karimi.html | Production Gap Audit flagged profile opening | Same gated revision method; preserve published practitioner payload | Approved profile opening, care areas, booking |
| 3 | Remaining doctors/*.html and knowledge/**/*.html | Potential damage elsewhere in scoped public content | Restore only individually approved opening-damaged or unsafe records | Approved source restored to affected pages; healthy/other-drift untouched |

Actual status and specific missing elements per page are captured at PREPARE time from the live database. Do not infer that a Production Gap Audit listing is proof of a particular current status.

## Recovery mechanism
- PREPARE compares frozen source, repository source and the current published immutable revision. It writes full HTML backup copies and a per-page repair-plan.json under Windows TEMP: wmc-production-recovery/batch-<n>-<timestamp>.
- Approvals require a named reviewer, exact previous revision ID, original SHA-256, golden SHA-256 and chosen restoration method.
- 'unsafe' pages require unsafeReviewed=true after manual comparison of canonical, JSON-LD, navigation, cards, appointments and footer. This approves replacing the entire stored HTML revision. It does **not** preserve unapproved revisions' custom HTML; previous revision remains intact for rollback. Legal/clinical and publishing owners should review each such page.
- 'opening-damaged' pages can switch to the exact immutable golden revision only when head, navigation/booking and all downstream content match.
- 'healthy' and 'other-drift' pages are never automatically changed.
- APPLY rechecks SHA-256 of golden source and backed-up original plus the currently selected revision, then creates/reuses immutable golden revisions and CAS-updates only the page.publishedRevisionId in a transaction. Every other DB record stays untouched.
- APPLY verifies exact stored HTML plus opening structure after overlays and delivery. Verify live host response and booking manually before releasing.
- ROLLBACK accepts the APPLY result JSON and reverses only those revision pointers when current revisions still match. It does not delete revisions.

## Windows PowerShell (from repository root)
Verify branch, then run build and unit tests before an apply:

~~~powershell
git switch rg01-release-gate-repairs
git rev-parse HEAD
Set-Location .\apps\web
npx.cmd tsx --test src/recovery/production-recovery.test.ts
npm.cmd run build
~~~

Prepare all three batches **without mutating the database**:

~~~powershell
npx.cmd tsx scripts/run-production-recovery.ts --batch 1 --prepare
npx.cmd tsx scripts/run-production-recovery.ts --batch 2 --prepare
npx.cmd tsx scripts/run-production-recovery.ts --batch 3 --prepare
~~~

In each printed directory, check backups/ and repair-plan.json; copy approval-TEMPLATE.json to approval.json, set approvedBy to the appropriate reviewer, remove any unapproved entries, and set unsafeReviewed=true only after page-specific clinical/editorial verification.

Apply a single approved batch (use the ACTUAL path printed by PREPARE):

~~~powershell
npx.cmd tsx scripts/run-production-recovery.ts --batch 1 --apply --manifest "C:\path\batch-1\manifest.json" --approval "C:\path\batch-1\approval.json"
~~~

Output includes an absolute result-<timestamp>.json. Validate pages and only then proceed to batch 2 and batch 3 using their own manifest and approval files.

Rollback a previously applied batch, if needed:

~~~powershell
npx.cmd tsx scripts/run-production-recovery.ts --batch 1 --rollback --result "C:\path\batch-1\result-<timestamp>.json"
~~~

## Deployment sequence
1. Create a complete PostgreSQL backup and verify it can be restored outside the production instance. Preserve existing user-edited published payloads.
2. Confirm git branch and commit; deploy the recovery scripts and run tests; build once. No website redesign or unrelated import.
3. Confirm that DATABASE_URL targets the **intended environment**. Prepare each batch; review immutable source and current revision evidence.
4. Apply approved Batch 1; verify /team.html via the actual production hostname, page H1, cards, schema and HotDoc; hold Batch 2 until passed.
5. Apply approved Batch 2 service-by-service; verify full mobile/desktop rendering, sections, clinician links, booking and SEO.
6. Apply approved Batch 3 selectively; verify practitioner identity, care content, booking restrictions, Knowledge Centre links and structured data.
7. Confirm the delivery pipeline (overlay, performance, public UX, accessibility, favicon) and actual HTTP 200. Track any residual other-drift separately; do NOT apply import:golden globally.
8. If any batch fails verification, rollback its result before proceeding.

## Files introduced
- apps/web/src/recovery/production-recovery.ts
- apps/web/src/recovery/production-recovery.test.ts
- apps/web/scripts/run-production-recovery.ts
- apps/web/reports/PRODUCTION_RECOVERY_EXECUTION.md

No existing source file changed. This workflow is source code only until run against the environment's PostgreSQL database. Do not assert that public pages were recovered merely because the code was committed.
