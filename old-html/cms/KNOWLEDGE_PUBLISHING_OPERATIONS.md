# Healthcare Knowledge Centre — monthly publishing operations

**Website remains frozen:** do not change the approved homepage architecture, public UI, brand imagery, existing Knowledge Centre template or headline “Care that knows your story.”

## Source of truth and storage

- `cms/editorial-calendar.json`: public-safe **planning seed** only. Twelve themes, from January through December, repeat annually. The seeded 2027 draft due dates (12th of each month) and publication targets (20th) are suggested operating dates, not claims of completed work.
- `WMC_Knowledge_Centre_Private_Publishing_Office.html` (delivered **separately** from public ZIP): internal workstation editor. Open locally in a browser. Browser storage persists per browser/profile; it does not sync across users or constitute a permissions/audit-controlled CMS.
- At the start of each editing session, import the team's current restricted **JSON** working register; after editing export it back to restricted storage. Treat the CSV as a reporting copy, not the authoritative source. Avoid parallel edits: appoint a custodian to merge and version exports and check the change history. Do not commit, email in the clear, or upload the private export, reviewer names, evidence IDs or dashboard to public hosting.
- Add the next year using **New year**; prior years and audit entries remain.

## Operational steps each month

1. **Plan & assign:** nominate the actual Content Owner. Confirm the monthly theme, draft Due Date and target publication date.
2. **Draft:** create content using the existing `knowledge/articles/` HTML template. Explain the care topic for patients, cite trustworthy Australian sources, and retain clear pathways to a relevant service, appropriately matched verified practitioner and booking. Do not invent doctor information or promise availability.
3. **Check source and SEO:** verify clinical statements, page title, description, canonical URL, structured data, accessibility, relevant internal links and appropriate search intent. Update the article list, category pathways, sitemap and search index only when the new **approved** page is actually added.
4. **Clinical review:** content owner submits the **exact drafted file** to the appropriate authorised clinician. Generate the main-content fingerprint via `python cms/tools/build_clinical_governance.py --fingerprint knowledge/articles/<slug>.html`. Record the genuine reviewer, signed review date/reference, practice approver, signed approval date/reference and secure evidence reference **in the private register**. Approval must not be presumed from an existing article's public `published` label.
5. **Practice approval:** obtain actual sign-off for the approved content fingerprint and the **Next Review Date**; next review must follow the approval and planned publication. Mark technical checks complete only after verification. The private dashboard refuses the move to **Approved** until required fields are filled; the validator independently checks the content hash.
6. **Schedule:** choose the intended publication target. A target date is **not** the publication date. Release the new approved article via the existing website production process. Register any added governance-eligible article in `cms/governance-records.json`, with any public review attribution generated **only** from real restricted approval evidence by the existing clinical governance builder.
7. **Publish & verify:** run the release validator with the secure exported register (`--register ... --release`), then deploy. Inspect the live article and related page navigation. Only then use **Confirm live publication** in the dashboard to record the **actual Publication Date** and the named verifier. Export the register again. If publishing is delayed, leave the record **Scheduled**.
8. **Follow up:** each month review overdue drafts, pending approvals, and nearing/overdue **Next Review Dates**. If the article becomes outdated, move it to **Review Due**; start a new approval cycle and keep prior evidence in the audit history. Guidance changes override routine annual review timing.

## Gate & commands

```sh
# Validate public, unassigned planning seed
python cms/tools/check_knowledge_publishing.py

# Validate internal exported register and published-page SEO/sitemap gates
python cms/tools/check_knowledge_publishing.py --register /secure/private/editorial-register.json --release

# Check content fingerprint before sign-off (must match recorded approval)
python cms/tools/build_clinical_governance.py --fingerprint knowledge/articles/<slug>.html

# Create a website release while checking the SECURE register but excluding it
python tools/build_website_release.py --publishing-register /secure/private/editorial-register.json --output /output/website-release.zip
```

**Separation of duties:** software can verify field completeness, dates, file presence and SHA-256 matching. Software cannot verify a person's professional registration, consent, or authenticity of sign-off. Only authorised staff may certify clinical/practice approval, and signed evidence must remain in appropriately secured internal storage.

## Reporting

Dashboard: scheduled themes, ownership, progress, approvals and work needing attention. Exported register: Due Date, Status, Clinical Approval, actual Publication Date and Next Review Date; also export to CSV for team meetings. Public SEO outcomes may be measured separately with Search Console impressions, clicks, indexed pages, and organic booking intent, without treating traffic growth as a clinical-quality substitute.
