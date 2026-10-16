# Woolloongabba Medical Centre — About Us Information Architecture

Release date: 2026-10-11

## Scope
- Added the seventh top-level navigation entry **About Us**, after Our Team and before Patient Information, in all 198 HTML pages. This appears in the existing desktop navigation and mobile menu.
- Created `about-us.html`, using the approved internal page hero, breadcrumbs, institutional sidebar, footer, typefaces and colour system.
- Included seven informational sections linking to existing Philosophy, Story, Community and Access, Quality and Accreditation, Team, Network and Careers authority pages. No historical claims or practitioner credentials were invented.
- Added About Us to the existing Practice footer links; linked institutional child pages to their parent About Us hub in breadcrumbs and appropriate Practice sidebars.
- Aligned visible breadcrumb trails and structured breadcrumb records on seven institutional pages, and updated primary active-navigation logic.
- Added canonical, SEO title, description, Open Graph, Twitter metadata, AboutPage/BreadcrumbList JSON-LD and sitemap entry for the new hub.
- Refreshed the sharded Digital Reception index to include the new page and specific institutional search aliases. Retained existing search and booking interaction behaviour.
- Registered the page for institutionally owned clinical-governance review with status `awaiting_review`; no approved reviewer or review dates are shown.

## Safety and visual scope
- No original article or homepage wording changed; no existing public page removed.
- All existing practitioner images, approved branding and clinical content retained.
- No booking destinations, HotDoc integration or appointment controls changed.
- Scoped CSS only for About Us cards, so the approved website styles do not change elsewhere.

## Verification
- `tools/check_production_regression.py`: passed (198 HTML; 196 indexable, no orphaned public pages or missing internal targets).
- `cms/tools/check_search_metadata.py`: passed (unique metadata, OG and Twitter parity).
- `cms/tools/build_digital_reception_index.py --build/--check`: passed (196 public search pages, 14 topic datasets).
- `cms/tools/check_governance_framework.py --check` and `cms/tools/build_clinical_governance.py --check`: passed (163 eligible pages, no fictional approved review attributions).
- `tools/check_accessibility_semantics.py`: passed (no static errors).
- Isolated responsive renders at 320, 390, 768, 820, 900, 1024, 1200, 1366, 1440 and 1920px: no horizontal overflow or overlapping navigation links; seven About Us cards present.
- An isolated full-script mobile-menu smoke test timed out in the browser environment. Existing nav JavaScript was retained except for the active-section mapping; verify keyboard/menu operation again on the live staging host.

## Staging checklist
1. Verify About Us from header and mobile menu, plus footer Practice section.
2. Verify all seven About Us sections and their destinations, including accreditation and quality links.
3. Verify the mobile menu opens and Escape closes it; all seven navigation links remain keyboard reachable.
4. Verify the existing HotDoc lightbox with a live provider session.
5. Review About Us wording and actual accreditation details with practice management before deployment.

Do not create suburb-specific doorway pages. Future institutional changes should update this hub and its linked authority pages coherently, not duplicate them.
