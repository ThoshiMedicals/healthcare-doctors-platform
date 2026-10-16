# Healthcare Institution Authority Refinement — 9 October 2026

Baseline: the 42-article Healthcare Knowledge Centre website package supplied for this request.

## Changes

1. **Calmer hero:** muted the supporting hours typography and the optional hero community-caption style without changing the H1, main explanation, Book/Call actions, accreditation, billing or seven-day trust links. The supplied homepage has no separate hero community-caption element; the principal supporting paragraph is retained.
2. **Mobile footer:** accessible native `<details>`/`<summary>` groups for Practice, Patient Information and Opening Hours. Desktop links and presentation remain expanded. A responsive matchMedia listener handles orientation and resizing; browsers without JavaScript still show the original links.
3. **Digital Reception:** regenerated static search index across all 145 indexable pages (including all 42 articles). Relevant query paths lead from article to real published service to linked doctor profile to appointment page. The UI does not diagnose conditions, promise an available doctor, or accept medical history. Emergency keywords retain a separate 000 path.
4. **Clinical governance:** registered all 42 Knowledge Centre article URLs in the existing evidence-controlled review registry (13 added). Approved review panels display immediately below the article byline when valid external approval records are supplied. As of this release there are **zero recorded clinical approvals**, so no reviewer name or clinical review date is displayed. Never invent approval dates or reviewer sign-offs.
5. **Metadata repair:** repaired mismatched Twitter Card title/description values on 18 articles, shortened one SEO title (not its on-page H1), and refreshed 42 editorial integrity hashes. Article MAIN content and established visual design remain unchanged.

## QA

- Browser functionality tested at 1440px, 390px, and 320px with no script errors or horizontal overflow.
- Mobile footer open/close and desktop expanded state verified.
- Four-step guide verified for anxiety, blood pressure, travel vaccinations, telehealth, and burnout; emergency terms bypass the recommendation path.
- Evidence-gated review state tested both unapproved and with a simulated test-only approved record, never saved to production files.
- Digital Reception index: 145/145 public pages; clinical governance eligibility: 42/42 articles.
- SEO metadata checks: all 147 HTML files, 145 indexable pages pass; publication workflow has 12 planned records.
- All 42 clinical article MAIN bodies are unchanged against the supplied production ZIP.

## Approval and publication

Article editorial creation or technical deployment is **not** clinical approval. Keep supporting clinical approval evidence in private storage and use `cms/tools/build_clinical_governance.py --approvals /secure/private-approvals.json --build` to generate approved public metadata after real clinician sign-off and practice approval. The builder also verifies main-content fingerprints, approval sequence and dates. Ensure the approved record remains current after any clinical article content changes. No patient-facing review claim is printed unless the existing approval gate validates it.

The SharePoint reconciliation report referenced in the request was not directly retrievable using the available connectors; verification was carried out against the supplied website package and local audit tools.
