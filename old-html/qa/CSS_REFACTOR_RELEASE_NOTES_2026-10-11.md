# Production CSS Refactoring and HotDoc CLS Remediation — 11 October 2026

## Scope and change control

- **Locked baseline:** `Woolloongabba_Medical_Centre_Homepage_Viewport_Fit_Final_2026-10-11.zip`
- Production pages before/after: **352 original files retained**.
- Existing source files modified: **`styles.css`**, **`index.html`**.
- No article, practitioner, booking URL, image, asset, or JavaScript source was replaced.
- Original 1400 × 1968 HotDoc poster pixel data remains unchanged.
- There is **one production stylesheet** (`styles.css`), not multiple active stylesheets.

## Fix 1 — HotDoc image layout shift

The source poster has an exact aspect ratio of **1400:1968**. Its container previously lacked an aspect ratio, while the lazy-loaded image used `height:auto`. Before the image loaded, the poster box was only 40–80px high. The tappable hotspot positions then shifted when image dimensions became available.

**Before (simplified):**

```css
.home-page .hotdoc-poster-card {
  position:relative;
  width:min(100%,590px);
  overflow:hidden;
}
.home-page .hotdoc-poster-image {
  width:100%!important;
  height:auto!important;
  aspect-ratio:auto!important;
  object-fit:contain!important;
}
```

**After:**

```css
.home-page .hotdoc-poster-card {
  position:relative;
  width:min(100%,590px);
  aspect-ratio:1400 / 1968;
  overflow:hidden;
}
.home-page .hotdoc-poster-image {
  display:block!important;
  width:100%!important;
  height:100%!important;
  aspect-ratio:1400 / 1968!important;
  object-fit:cover!important;
}
```

The poster `<img>` also declares `width="1400" height="1968"`. Other approved display properties (shadow, radius, filters and responsive width) remain in place. The poster's true ratio and CSS ratio match, so the fully loaded photo is not cropped differently.

### Before / after browser measurements

| Viewport width | Old poster before image | Old after image | New before image | New after image | New hotspot shift |
|---:|---:|---:|---:|---:|---:|
| 320px | 80.0px | 427.3px | 427.3px | 427.3px | 0.0px |
| 375px | 80.0px | 487.8px | 487.8px | 487.8px | 0.0px |
| 768px | 40.0px | 871.5px | 871.5px | 871.5px | 0.0px |
| 1024px | 40.0px | 871.5px | 871.5px | 871.5px | 0.0px |
| 1440px | 60.0px | 635.4px | 635.4px | 635.4px | 0.0px |
| 1920px | 60.0px | 635.4px | 635.4px | 635.4px | 0.0px |

## Fix 2 — CSS duplication, specificity and maintainability

| Metric | Before | After | Improvement |
|---|---:|---:|---:|
| Stylesheet bytes | 351,133 | 337,211 | **13,922 bytes (3.96%)** |
| Rule blocks | 2,992 | 2,912 | 80 empty redundant blocks removed |
| CSS declarations | 8,113 | 7,717 | 396 repeated declarations removed, offset by one HotDoc declaration added |
| `!important` declarations | 3,980 | 3,637 | 343 removed |
| Byte-for-byte repeated rule groups | 53 | 0 | Exact duplicates eliminated |

- Identical declarations were removed only when a later declaration had **the same exact selector, at-rule context, property, value, and importance**. The surviving last declaration preserves cascade precedence.
- Removed **five empty media-query blocks** and merged **one immediately adjacent media-query pair** without rearranging unrelated rules.
- **No uncertain/dead selector was removed on the basis of textual absence alone**, because scripting, pseudo-states, user media preferences, and third-party booking widgets can activate CSS selectors.
- Intentionally different declarations, responsive overrides, and potential browser fallback sequences remain. Full consolidation of every historical media block or all `!important` is not safely provable without a component-by-component browser/state matrix. These items should not be bulk-stripped.
- Reproducible declaration-removal evidence is included at `qa/CSS_DEDUPLICATION_REMOVALS_2026-10-11.json`.

## Visual regression results

- **42** baseline-versus-release isolated browser comparisons across 7 representative pages and 6 viewport widths: **0 computed-style or measured-layout mismatches** outside intentionally changed HotDoc reserve-height properties.
- Loaded HotDoc screenshots were **pixel-identical** at **375px, 768px, 1440px, and 1920px**.
- HotDoc loading and three position-sensitive interactive hotspots: **0px measured card-height shift and 0px hotspot displacement** at 320px, 375px, 768px, 1024px, 1440px, and 1920px.
- Existing production regression: **197 HTML pages / 195 indexable pages / 15,439 local links and references / 13 practitioner profiles**, passed.
- Knowledge Centre: **102 pages, 20 topics, 81 article flows**, passed.
- Booking/browser fallback at **1440px, 1024px, 768px, 390px and 320px**, passed.

**Limit:** The tests directly establish the reported HotDoc fix and sampled visual parity, not a universal real-user Core Web Vitals CLS score. Third-party HotDoc popups and live fonts should receive a staging check.

## Recommended future safe maintenance steps

1. Keep the HotDoc reserved aspect ratio and HTML intrinsic dimensions together.
2. Separate new CSS work into clearly owned component sections instead of appending fresh global overrides.
3. Do not move old `@media` blocks or delete selectors until their behavior is verified in mobile, desktop, keyboard, reduced-motion, forced-colors and third-party-widget states.
4. Run production, navigation, booking and screenshot comparison gates before accepting any subsequent CSS consolidation.
