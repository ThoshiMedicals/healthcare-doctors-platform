# Healthcare Knowledge Centre — Unified Navigation

Release date: 2026-10-09
Starting point: Woolloongabba Medical Centre Production Cleanup & Regression-Safe Optimisation.

## Issue corrected

The original Knowledge Centre category pages and the ten subsequently added authority hubs used different hard-coded sidebar menus. The two menus have been replaced by **one consistent, static, accessible navigation** across every Knowledge Centre hub and article, including the original landing page.

## New navigation

- Knowledge Centre (one landing page at `knowledge/index.html`)
- Symptoms & Everyday Concerns — Headache & Migraine; Cough & Sore Throat; Pain & Musculoskeletal Health; Sleep & Fatigue
- Health Conditions — Diabetes & Ongoing Care; Blood Pressure & Heart Health; Chronic Disease Management; Mental Health; ADHD & Neurodiversity; Skin Health & Skin Cancer
- Life Stages & Wellbeing — Women's Health; Menopause & Midlife Health; Pregnancy & Antenatal Care; Men's Health; Children's Health; Healthy Ageing; Weight & Healthy Lifestyle
- Prevention & Healthcare Access — Preventive Healthcare; Vaccinations; Telehealth & Access To Care

All 20 topic hub links appear **once** in each sidebar. The active category remains highlighted. On desktop the navigation groups are open; on smaller screens they collapse, automatically displaying the group relevant to the current page. Native `<details>`/`<summary>` provides keyboard-accessible disclosure. With JavaScript disabled all groups remain open, so no category becomes inaccessible.

## Preservation and scope

- No new, deleted or redirected public pages; all existing URLs and canonical links retained
- No changes to homepage, H1s, headings, clinical article content, FAQs, practitioner links, booking links, Digital Reception content or index, or HotDoc integration
- Original stylesheet rules preserved byte-for-byte, with only narrowly scoped navigation additions appended
- All 20 topics were already represented on the single Knowledge Centre landing page; no new category cards were needed
- 102 Knowledge Centre HTML pages updated only for unified sidebar markup and script reference

## Future publishing source of truth

- `cms/knowledge-navigation-groups.json` — canonical grouped topic list
- `tools/build_knowledge_navigation.py` — idempotent navigation generator; run after adding or publishing Knowledge Centre pages
- `knowledge-navigation.js` — responsive disclosure enhancement; not needed for baseline navigation access
- `tools/check_knowledge_navigation.py` — static coverage and correct-route gate
- `tools/check_knowledge_navigation_browser.py` — isolated Chromium keyboard, disclosure and responsive tests

## QA

- Unified navigation static gate: PASS (102 pages, 4 groups, 20 topics, 2,040 category links checked)
- Production regression gate: PASS (196 pages, 194 indexable, 15,174 local references, 194 breadcrumb trails)
- Clinical authority link gate: PASS (19 clusters, 81 article guides, 29 services, 13 practitioners)
- Digital Reception coverage: PASS (49 patient-intent cases at 1440, 390 and 320 px)
- Isolated Chromium navigation: PASS (1440, 768, 390, 320 px; keyboard interaction, reduced-motion, no-JavaScript fallback)
- Byte comparison: homepage, all article content and original CSS rules unchanged

Deploy to staging and visually review the unified sidebar against the approved visual baseline before replacing production. Third-party HotDoc behaviour remains subject to the existing live staging smoke test.
