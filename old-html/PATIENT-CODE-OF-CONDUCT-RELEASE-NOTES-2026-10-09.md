# Patient Code of Conduct — production release candidate

Date: 2026-10-09

## Scope

- Added `patient-code-of-conduct.html` with the existing Practice Information typography, layout, header, footer, breadcrumb system, accessibility hooks, HotDoc dependencies and governance review host.
- Added a local Practice Information sidebar link on the 13 existing practice-governance pages; also available on the new page.
- Added direct links from Practice Information and Patient Information hubs, and contextual links from Patient Rights, Practice Policies, Healthcare Quality & Safety and Feedback & Complaints.
- Added canonical, SEO and social metadata, WebPage/BreadcrumbList structured data and the sitemap entry.
- Registered an operational review eligibility record with status `awaiting_review`. No reviewer or approval details are publicly represented.
- Rebuilt the lazy Digital Reception index with a new search entry and patient-centred synonyms; the search UI and behavior were not modified.

## Preserved

- Approved homepage, existing branding and `styles.css` are byte-for-byte unchanged.
- No existing clinical article text, practitioner profile, booking destination, HotDoc script, or Knowledge Centre cluster was changed.
- No primary navigation or footer links were added.

## Validation

- Search metadata check: 197 HTML pages, 195 indexable.
- Production link / fragment / breadcrumb regression: passed.
- Digital Reception: 49 patient-intent tests passed across desktop, 390px and 320px.
- 81 Knowledge Centre articles, 19 clusters and 13 practitioner profiles preserved.
- Visual layout checks: 1440px, 768px, 390px and 320px with no horizontal overflow, in a locally isolated browser render.

## Publication control

Practice management should confirm and approve operational conduct wording before public deployment. No clinical-team review name or last-reviewed date has been invented. Further live staging review is recommended for external scripts such as HotDoc and external font/image loading.
