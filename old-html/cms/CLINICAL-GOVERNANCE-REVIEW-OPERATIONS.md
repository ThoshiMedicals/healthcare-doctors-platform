# Clinical Governance & Review System — institutional operating framework

**Purpose:** Establish accountable review of patient education, service authority information, patient information and governance pages without claiming approval until a genuine, documented review has occurred. This is an operational framework, not a legal document or an authentication system.

## Source of truth and scope

The existing `cms/governance-records.json` registers review-eligible pages; it is **not** an approval record. Knowledge Centre articles and hubs, service authority pages (including on-site independent providers), practitioner profiles, patient information and governance pages are included in the site-wide eligibility register. Coverage and review-type assignments are checked by `cms/tools/check_governance_framework.py --check`. Ownership role guidance lives in `cms/governance-ownership-metadata.json`.

Do **not** introduce a second register or display a reviewer/date merely because a page is online, indexed or visible. Do not use file modification dates, sitemap dates or proposed calendar dates as review dates.

| Scope | Appropriate review and accountable owner |
| --- | --- |
| Knowledge Centre articles and clinical topic hubs | Genuine authorised clinical review, plus approval by the designated practice approver; **department owner must be nominated and confirmed**, not guessed |
| GP clinical service authority pages | Authorised clinical review plus practice approval; scope, fees and treatment limitations confirmed by the appropriate team |
| Practitioner profiles | The practitioner confirms the profile with practice management; an authorised clinician reviews clinical claims; practice approver releases |
| Patient information (accessibility, billing, opening hours, scripts, privacy and policies) | Appropriate **clinical or operational** review depending on the content; staff/department owner and practice approver documented |
| Governance and quality/safety pages | Appropriate **clinical or institutional** reviewer depending on page; practice management authorises release |
| Independent on-site pathology, pharmacy and radiology information | Operational validation of accurate descriptions and third-party responsibility; do **not** suggest clinical endorsement of independent providers |

The public review card already exists in the approved site. It renders automatically **only** from evidence-approved entries in the generated `governance-published.js` file. The four public fields, in the existing design, are:

- **Reviewed by:** approved reviewer name or real review body; use “Woolloongabba Medical Centre Clinical Team” only if that team actually reviewed the page
- **Content Owner:** actual accountable department confirmed by practice management
- **Last Reviewed:** actual dated reviewer sign-off
- **Next Review Due:** real approved review due date

No fields display for unapproved pages; there are **zero signed approvals** provided in this release. No fictional reviewer, date or content-owner attribution has been added.

## Workflow (private, accountable, auditable)

1. **Register and assign.** Confirm the page's classification and nominate a real accountable department; assign a real content owner. Record changes in private workflow only. A public eligibility entry stays `awaiting_review` regardless of private progress.
2. **Content owner submits.** Confirm actual wording and supporting sources, links and patient-safety information; record submission person/date.
3. **Review.** An authorised, appropriately qualified reviewer (clinical, operational or institutional according to scope) signs off the exact page content; record the reviewer identity, date, factual basis and evidence reference privately.
4. **Approve.** An authorised practice approver signs **after** review, confirms the accountable department, approved public reviewer attribution and the next review due date; keep signature and references in secure restricted storage.
5. **Fingerprint.** Use `python cms/tools/build_clinical_governance.py --fingerprint <path>.html` after editorial changes to record the approved main-content SHA-256 in the private approval record. Any substantive content edit requires new review/sign-off.
6. **Publish.** Generate only the allowed public fields from verified private approvals, then run release validation. Clinical sign-offs, approval/evidence references and content fingerprints must **never** be deployed.
7. **Review due or material change.** Move the private approval into `review_due` / `in_review` and regenerate. An expired next-review date is rejected by the builder and hidden automatically on the website, avoiding stale approval claims.

**Private statuses:** `awaiting_review` → `owner_submitted` → `in_review` → `approval_pending` → `approved` → `review_due` or `superseded`. Changes may be sent back for correction before authorisation. The website does not show draft states.

## Commands

```sh
# Coverage, hidden review hosts and absence of leaked private evidence
python cms/tools/check_governance_framework.py --check

# Pages approaching or past Next Review Due (operations only; does not change public pages)
python cms/tools/report_governance_review_expiry.py --horizon-days 60

# Public bundle must match verified source; no approvals supplied => empty public card registry
python cms/tools/build_clinical_governance.py --check

# Generate exact content fingerprint (after final copy is ready)
python cms/tools/build_clinical_governance.py --fingerprint knowledge/articles/<slug>.html

# After authorised staff have placed signed evidence OUTSIDE the website root
python cms/tools/build_clinical_governance.py --approvals /secure/actual-approvals.json --build
python cms/tools/build_clinical_governance.py --approvals /secure/actual-approvals.json --check

# Production package: requires the same private approvals when any public attribution is displayed
python tools/build_website_release.py --governance-approvals /secure/actual-approvals.json --output /secure/output/release.zip
```

The `cms/governance-approval-template.json` is an **empty example schema**, not the database of signed approvals. Copy it into secure internal storage outside the public document root before completing it. Approval evidence must come from actual staff and practice-authorised processes. The validators check dates, required fields, matching review classifications and hashes, but cannot authenticate signatures or clinician registration; responsible staff must verify these separately.

## Release and incident controls

- Never permit a release that changes a reviewed page without confirming the corresponding signed approval and content fingerprint.
- If any approved next review has expired, remove the current approval attribution until a new approved cycle is complete.
- Avoid publishing a clinical review statement on administrative or independent-provider information without a real clinical review.
- Retain the approved visual identity, layouts and long-form article content; this framework changes governance logic and release gates only.
- QA each release: scope validator, governance builder `--check` with real private evidence, site regression, search metadata, Knowledge Centre navigation, Digital Reception and HotDoc behaviour.
