# CMS-ready content structure

This directory is an implementation seed for a future CMS. It does not replace the current production HTML at runtime.

- `content-model.json` defines editable collections and fields.
- `governance-workflow.json` defines publication and clinical-review rules.
- `site-settings.json` centralises fields a future CMS should control, including hours and contact details.
- `content-registry.json` maps current production pages into the future collections.

A future CMS should render into the existing approved templates and CSS rather than create new layouts. Clinical review metadata must remain invisible unless a genuine approved review record exists.
Additional production-governance seeds:

- `practitioner-photography-spec.json` defines the single practitioner photography language.
- `asset-register.json` records critical asset resilience and authenticity rules.
- `google-business-profile-readiness.json` prepares verified website-aligned business information for future Google Business Profile publishing.


## Evidence-controlled clinical governance review (v2)

- `governance-records.json` registers eligible pages with **no fabricated reviewers, dates or departments**; it is a PUBLIC ELIGIBILITY INVENTORY ONLY.
- `governance-approval-template.json` is an empty template. Copy it **outside the website/document root** into restricted-access secure storage BEFORE entering actual approvals or evidence.
- Review documentation must contain real `reviewedBy`, `lastReviewed`, `nextReview`, `contentOwner`, `approvedBy`, `approvedAt`, `approvalReference`, `evidenceReference` and `reviewedContentSha256`.
- Use `python cms/tools/build_clinical_governance.py --fingerprint services/womens-health.html` to obtain a content fingerprint **before** the authorised reviewer signs off. This binds approval to the specific reviewed page content.
- Only after signed review, run `python cms/tools/build_clinical_governance.py --approvals /secure/private/approvals.json --build` and then `--check` with the same `--approvals` argument. Deploy ONLY the generated `governance-published.js` with the ordinary website, never the private records.
- Records without signed evidence are invisible; the four-field strip appears automatically only for approved records. Approved review data is displayed safely using `textContent`, never HTML interpolation.
- Never fill dates from page creation or publication timestamps; do not use default reviewers as claims. Any subsequent substantial change to approved content invalidates its SHA-256, causing the builder to refuse publication without new sign-off.
- Add newly eligible pages both to the eligibility inventory and to the HTML governance host and JS include before `site.js`.

## Institutional photography governance (October 2026)

- `INSTITUTIONAL-IMAGE-GOVERNANCE.md` defines the six controlled photography categories, crop/grade direction, provenance and release gates.
- `../assets/IMAGE_LIBRARY.json` is the source-of-truth audit of existing website imagery. Legacy production status does **not** certify an authentic photographic original.
- `institutional-photo-approval-template.json` is an empty form only: copy it outside the webroot before any genuine evidence or private consent details are added.
- `../tools/check_institutional_image_library.py` validates the library. `../tools/import_approved_institutional_image.py` only accepts manually approved source files with verified hashes and signed external approval fields; it does not edit any live HTML.
- Missing authentic interiors, team originals and governance photos remain omitted from the approved library until genuinely supplied. Never fabricate site-specific imagery.


## Governance workflow v3 — all 99 registered public authority pages

The four patient-facing labels are **Reviewed by**, **Content Owner**, **Last Reviewed**, and **Next Review Due**. All fields remain invisible until the corresponding page has a genuine signed approval.

**Workflow:** Content Owner submission → appropriate Clinical / Operational / Institutional Reviewer signature → authorised Practice Approval → actual Last Reviewed date → approved Next Review Due date. Dates and signatories are not generated from HTML timestamps or defaults.

1. Use `cms/governance-records.json` only to identify eligible pages and their `reviewType`. All public records are awaiting review.
2. Copy `cms/governance-approval-template.json` to secure non-web-hosted storage before populating actual staff names, dates and evidence.
3. Owner records `contentOwnerSubmittedBy`, `contentOwnerSubmittedAt`, `contentOwner`; reviewer signs `reviewerSignedBy`, `reviewerSignedAt` and authorises the accurate display attribution `reviewedBy`. `lastReviewed` must equal `reviewerSignedAt`.
4. Practice approver signs `approvedBy`, `approvedAt`, `approvalReference` and approves `nextReview`, which must be later than `approvedAt`. Preserve `evidenceReference` and content SHA-256 privately.
5. Generate `governance-published.js` using `python cms/tools/build_clinical_governance.py --approvals /secure/path/approvals.json --build`. Repeat with `--check` at every deployment. Only four public fields are embedded; private names/evidence are never bundled.
6. For policy changes, re-enter review as `in_review`; for overdue review use `review_due`; for revoked approvals use `superseded`. Generate again with the private source to remove the public claim. Never retain a prior approved banner after substantive content changes.

The builder validates genuine-looking structured records, sequence, dates, references and exact page-content fingerprint; it **cannot independently authenticate signatures or authorisation**. Those must be checked by practice governance staff against restricted internal evidence.

## Digital Reception complete site search — mandatory release step

The Digital Reception on-page search index is **generated from the current public HTML pages**, not manually maintained. Every indexable HTML page must also be present in `sitemap.xml`; `404.html` and the non-indexed Updates article template are excluded. New public pages missing from the sitemap cause the build to stop. Page titles, meta descriptions, headings, relevant page text, and real internal relationships are refreshed automatically; the Digital Reception UI and booking behaviour are not rebuilt.

**Use the release builder for every future site ZIP** (requires Python 3 and `beautifulsoup4>=4.12` from `tools/requirements.txt`):

```sh
python tools/build_website_release.py --output /absolute/path/new-production-release.zip
```

The release builder always runs `python cms/tools/build_digital_reception_index.py --build`, followed by `--check`, **before** creating the ZIP. It stops on missing/extra sitemap pages or any index mismatch. For deployments that do not use the ZIP builder, run these same two commands as mandatory build and CI steps; do not deploy if `--check` fails. To verify a website without modifying files, run only `python cms/tools/build_digital_reception_index.py --check`.

The index includes all public Knowledge Centre, Service, Doctor, Patient Information, Practice & Governance, Team, Practice and Updates pages. Never index private files, draft HTML or intentionally non-indexed pages. Do not add unverified clinical service claims to search synonyms.

## Search appearance metadata release gate

Before producing a production ZIP, `tools/build_website_release.py` runs `cms/tools/check_search_metadata.py`, which checks every HTML page for present titles and descriptions within the approved editorial caps (60 and 150 characters), and checks indexable pages for unique titles, canonical URL correctness and matching Open Graph/Twitter titles and descriptions. The Digital Reception release step then rebuilds its search data from these same current page metadata values. Search display lengths are editorial targets and cannot guarantee that a search engine will show a title or snippet without truncation.

## Practitioner photo migration and release gate

The eleven previously published practitioner portraits are still sourced from original clinic-hosted WordPress image URLs because their unaltered JPEG files were not included in the supplied production ZIP and could not be fetched in this build environment. **Do not change the public image `src` to a nonexistent local placeholder.** The approved layout and existing images remain unchanged.

`assets/team/MANIFEST.json` maps each existing practitioner source image and exact local target path. `assets/team/README.md` documents how to download original bytes from the clinic website on a connected server, or import authenticated files using a private identity/source/hash approval record. `tools/import_verified_practitioner_photos.py` safely migrates each available original and rewrites all relevant on-site HTML/SEO image references. The script never edits or regenerates photographs.

`python tools/build_website_release.py --output /path/to/new.zip` checks for broken/misrouted imported image references. Once actual originals have been supplied, use `--require-local-practitioner-photos` to prevent an all-local production release with any still-external practitioner portraits. The two named practitioners without verified public portraits remain without photos unless genuine assets are supplied.

## Knowledge Centre publishing operations (2027 and recurring)

- `editorial-calendar.json` now seeds **twelve monthly publishing tasks**, with real workflow fields, planned draft due dates and planned publication targets. January–December 2027 is the first complete forward cycle; all content owners, approval names, actual publication dates and next review dates are deliberately blank.
- The **separate, private, offline publishing office HTML** supplied alongside this website ZIP allows staff to assign the content owner, manage status, record real clinical/practice sign-off, capture the publication date and next review date, and monitor overdue work. Its local data is NOT a shared back-end: securely **export the JSON** after each session, share through an approved restricted location and **import the latest register** on another browser.
- Do **not** place the private dashboard or exported register on the public web server. Public `cms/editorial-calendar.json` is only an unassigned seed; completed evidence is not public.
- `cms/publishing-workflow.json` documents the guardrails; `cms/KNOWLEDGE_PUBLISHING_OPERATIONS.md` contains the operations checklist.
- For review, fingerprint the exact staged article and obtain genuine clinical/practice approval with private signed evidence. The existing `cms/tools/build_clinical_governance.py` remains the separate source of truth for any **patient-facing** reviewed-by banner.
- Run `python cms/tools/check_knowledge_publishing.py --register /secure/private/editorial-register.json --release` before publishing. The validator ensures every `approved`/`scheduled`/`published` article is present in the package and still matches the signed main-content hash. It does not authenticate signatures.
- The standard production builder always validates the public blank seed; to enforce a private working register as part of release, pass `--publishing-register /secure/private/editorial-register.json` to `tools/build_website_release.py`. The private register is **never packaged**.

No public Knowledge Centre page, homepage section, heading or CSS is redesigned for this programme.
