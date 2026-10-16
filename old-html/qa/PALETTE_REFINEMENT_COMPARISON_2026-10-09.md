# Institutional colour refinement — before/after QA

## Baseline & safety
- Baseline: `Woolloongabba_Medical_Centre_Healthcare_Institution_Header_2026-10-09.zip`
- Baseline archive SHA-256: `d9ab74d432f8a315b37a59f5fbf29804ae3ff9076dc3883be578b2f5110b917b`
- Original files: **321**. All retained.
- Existing files modified: **1** (`styles.css`, appended scoped palette block only).
- Original files unchanged byte-for-byte: **320**.
- Original files deleted: **0**. Original HTML, article content, JavaScript, bookings, fonts/assets/images and CMS records all unchanged.
- Original stylesheet SHA-256: `d474259f33ce48e4a6b7385c9293fc5c555d0a7cbfe49afb256dc63b0e5ea9f2`
- Modified stylesheet SHA-256: `873d4e89eb8af06bac2a409da4c6f1eebfe659409c9406b3498a9fd53b71b9d5`
- Full baseline hashes: `qa/PALETTE_BASELINE_SHA256.json`.

## Approved palette implementation
- Existing booking blue: `#174A70` — **preserved** (also header, mobile and appointment CTA).
- Institutional headings: `#2F4858` — internal page H1, article H2/H3 and sidebar headings.
- Body text: `#1F2937` — patient education content and page introductory text.
- Interior hero background: `#FAFBFC` — replaces warm introductory background, **homepage excluded**.
- Soft mint: `#E8F4F0` — existing neutral callout and relevant practitioner info panels only; emergency panels excluded.
- Muted teal: `#0C6D62` — restrained link/heading hover cues, callout accent and practitioner care bullets.
- Success green: `#2E8B57` — reserved as token for actual success states; no status colours reassigned.
- Original institutional logo, navy buttons, header structure, homepage hero and all navigation items retained.

## Old/new visual comparison
- Viewports: **1440px desktop, 820px tablet, 390px phone, 320px narrow phone**.
- Pages: homepage, Patient Information, Practice Information, Chronic Disease Care service, GP team directory.
- Comparisons: **20**; DOM element counts/text identical; no measured changed bounding rectangles; **zero overflow**.
- Homepage above-the-fold: identical old/new rendered screenshot at 1440px in isolated comparison.
- Booking button computed fill: `rgb(23, 74, 112)` before and after on every tested page/width.
- Separate comparison sheet: `WMC_Colour_Palette_Before_After_Comparison_2026-10-09.png`.

## Colour contrast (WCAG normal text AA benchmark 4.5:1)
- Institutional headings on off-white: `#2F4858` on `#FAFBFC` = **9.26:1**, passes 4.5:1.
- Body text on off-white: `#1F2937` on `#FAFBFC` = **14.17:1**, passes 4.5:1.
- Accent text on off-white: `#0C6D62` on `#FAFBFC` = **6.00:1**, passes 4.5:1.
- Teal on soft mint: `#0C6D62` on `#E8F4F0` = **5.51:1**, passes 4.5:1.
- Booking blue with white: `#174A70` on `#FFFFFF` = **9.33:1**, passes 4.5:1.

## Existing automated production checks
- `tools/check_production_regression.py`: PASS (197 HTML, 195 indexable, 15,259 local references, 1,899 fragment links, 195 breadcrumb trails, zero orphan pages).
- `tools/check_knowledge_navigation.py`: PASS (102 Knowledge Centre pages, 20 topics, 2,040 topic links).
- `cms/tools/check_search_metadata.py`: PASS (197 HTML pages).
- `cms/tools/check_authority_cluster_flow.py`: PASS (19 clusters, 81 guides, 29 services, 13 practitioners).
- `cms/tools/check_knowledge_publishing.py`: PASS (12 scheduled records).
- `cms/tools/check_digital_reception_coverage.py`: PASS (49 intent scenarios, including emergency prompts).
- `tools/check_booking_browser.py`: PASS (HotDoc fallback at 1440/1024/768/390/320px, keyboard Escape, lazy-index failure).
- JavaScript syntax (`node --check` on all production JS): PASS.
- CSS syntax (`tinycss2`): PASS.

## Scope & remaining live verification
Comparison screenshots use isolated browser rendering of original HTML/CSS with local images embedded; external font and HotDoc connections were unavailable. The same environment was used for old and new and every CSS geometry measurement was identical. Before replacing the live site, perform a short staging visual inspection with live fonts and a real HotDoc booking attempt. No third-party integration or live booking state was modified or claimed to be certified by this palette pass.
