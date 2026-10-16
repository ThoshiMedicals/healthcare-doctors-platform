# Accessibility remediation — 11 October 2026

## Scope and safeguards
- Base: Production CSS Refactor / HotDoc CLS Fixed release.
- No redesign; original approved graphics, type, colour, spacing and image assets retained.
- No original pages or scripts removed. All patient education, practitioner biographies, HotDoc booking routes and site navigation remain.

## Code changes
1. Shared quick-action and opening-hours containers now explicitly expose a named `group` role. Other eligible labelled generic containers either receive the correct role or have redundant labels removed.
2. The 404 page receives a visually hidden intermediate H2 for a valid heading sequence without changing the visible footer.
3. HotDoc Store hotspots have a minimum 44x44 CSS footprint. At widths up to 1024px the printed store badges are too close together for two independent 44px tap targets, so the two hotspots are replaced by compact visible 44px App Store / Google Play links below the **unchanged** poster artwork. The online booking hotspot and exact poster ratio remain unchanged.
4. Digital Reception now retries search-field focus after the modal opens and the underlying page is made inert, avoiding transient focus loss observed in a headless browser. Escape, modal dismissal, and prior focus restoration remain supported.
5. A repeatable semantic HTML validation gate is available at `tools/check_accessibility_semantics.py`.

## Tests performed
- Static review: all 197 HTML pages, heading hierarchy, landmarks, one main/H1 per page, skip links, image alternatives, accessible link names, label associations and local ARIA ID references. No failures.
- Production regression: 197 HTML pages, 195 indexable pages, all local references, profile booking routes and lightbox attributes passed.
- Knowledge Centre navigation 102 pages and clinical governance 162 review-eligible pages passed their existing validators.
- Chromium before/after layout and overflow spot checks: 30 cases covering home, 404, forms, GP listing and article, at 320/375/768/1024/1440/1920px; no unintended geometry changes.
- Store link target tests: 320/360/375/390/768/1024/1440px; both stores had hit-testable targets at least 44px in both dimensions.
- Keyboard: mobile menu opens and Escape closes; Digital Reception open, focus transfer to input, and Escape close tested.
- JavaScript syntax checks passed; poster aspect ratio / CLS protection remains in the original CSS and markup.

## Production caveat
The changes are a tested accessibility improvement, **not an independent WCAG 2.2 AA conformance certification**. A full audit still needs NVDA/JAWS/VoiceOver/TalkBack, 200–400% zoom, forced-colour/contrast, touch-device testing, and real HotDoc lightbox behaviour on a deployed staging site. The additional mobile store links are the only deliberate visible modification and are required to prevent overlapping tap targets.
