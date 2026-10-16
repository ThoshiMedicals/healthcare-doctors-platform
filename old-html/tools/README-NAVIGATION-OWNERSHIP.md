# Woolloongabba Medical Centre — navigation ownership publishing rule

`navigation-ownership.json` is the canonical publishing manifest for every HTML page. It defines the approved seven primary destinations, their hub routes, each page's owning section and its ordered visible / structured-data breadcrumb path.

## Publishing contract

1. Preserve the exact approved order: Services, Our Team, About Us, Patient Information, Knowledge Centre, Updates, Contact.
2. Add a page entry to `navigation-ownership.json` whenever an HTML page is added. Explicitly select **one** owning section and supply the breadcrumb route chain from Home to the page. Home and 404 intentionally have no owner/breadcrumb.
3. Run `python tools/sync_navigation_ownership.py` after publishing changes. Requires Python 3 and `beautifulsoup4` (`pip install beautifulsoup4`). It fails if the manifest and actual HTML pages disagree.
4. Run `python tools/qa_navigation_ownership.py` before committing. Inspect `qa/navigation-ownership-qa.json` and resolve errors. QA also checks all local `<a>` links across the site.
5. The HTML generator places `aria-current="page"` only when the current document is the hub, or `aria-current="location"` when the selected navigation link represents the owning parent of a child page. Active state is present with JavaScript disabled. `site.js` only checks the generated `data-nav-*` attributes and no longer maintains independent route lists.
6. Breadcrumb JSON-LD is generated from the same manifest and old duplicated BreadcrumbList schema is stripped, without altering the other schema entities. Visible breadcrumbs keep their approved layout, including existing nested topics and legacy service layouts; only differing trails are corrected.
7. This release is built on the approved **footer architecture implementation**. Footer HTML, logo files, branding and asset bytes have not been changed. External booking / calls, real-device assistive technology and staging integration still require live release-gate checks.
