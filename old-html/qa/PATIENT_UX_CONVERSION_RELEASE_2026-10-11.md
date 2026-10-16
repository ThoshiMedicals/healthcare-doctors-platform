# Woolloongabba Medical Centre — Patient Journey, UX & Conversion Audit

**Release:** 11 October 2026  
**Baseline:** Uploaded WCAG Accessibility Refined production ZIP.  
**Scope:** Interaction feedback and Digital Reception search-wait messaging; no brand, layout, clinical-content or booking URL changes.  
**Certification:** Targeted technical and usability checks only; **not a live HotDoc completion, screen-reader certification, or measured conversion uplift**.

## 1. Executive findings

The website is already functionally mature. Every requested top-level patient pathway exists, the practitioner carousel supports 11 profile links, and booking remains accessible from the main header, hero and persistent controls. Repeating calls to action, adding popups or changing the approved hierarchy would add noise. Two small, high-confidence improvements were implemented:

1. **Consistent pressed feedback:** existing controls now show a subtle 1px pressed state with restrained brightness feedback during a mouse or touch press. The state has no document-flow impact and returns to its original appearance on release. Disabled actions, transparent HotDoc poster hotspots, focus indicators and reduced-motion behaviour remain protected.
2. **Digital Reception search-wait feedback:** while a query waits for the lazy-loaded index, the results area visibly says **“Finding relevant website information…”** and exposes `aria-busy=true`; stale results from an earlier query are not left on screen. The busy state clears on completion or error. Clinical and administrative ranking, emergency routing, care links and booking controls are unchanged.

No new marketing content, buttons, banners, modal flows or layout sections have been created.

## 2. Issues found and actions

| Area | Finding | Action |
|---|---|---|
| Interaction feedback | Resting focus/hover states were broadly covered but pressed feedback differed by control | **Fixed**, targeted CSS `:active` treatment |
| Digital Reception | New search can momentarily show stale prior results while waiting for its on-demand index | **Fixed**, explicit searching/busy feedback |
| Navigation | Six primary destinations and mobile menu already available | **Retained**, no visual change |
| Booking | Home and service/profile pages already carry HotDoc appointment pathways | **Retained**, no invented provider improvements |
| Practitioner browsing | 11 cards, previous/next arrows and partial-next-card cue exist | **Retained**, no autoplay or extra directory UI |
| Trust | AGPAL, Medicare bulk billing, 7-day opening and practice hours are already documented and linked | **Retained**, no duplicate badges |
| HotDoc | Layout shift previously corrected; store actions have accessible touch targets | **Retained**, no hotspot or URL changes |
| FAQs and Knowledge Centre | Existing details, topic menus, section anchors and contextual links offer content discovery | **Retained**, no article rewriting |

## 3. Booking conversion and route depth

| Journey | Verified website route | Approximate website navigation steps |
|---|---|---|
| Homepage → Booking | Direct HotDoc lightbox CTA | 1 activation to launch |
| Homepage → Team | Primary nav / Meet Our Team | 1 click |
| Homepage → Services | Primary nav / View All Services | 1 click |
| Homepage → Contact | Primary nav | 1 click |
| Homepage → Knowledge Centre | Primary nav | 1 click |
| Homepage → Doctor → Booking | Featured portrait/profile link → individual booking action | 2 website activations before HotDoc |

**Important:** Counts cover the website-to-booking-launch journey only. HotDoc appointment selection, account prompts, provider availability and completed booking rates cannot be independently measured from the ZIP.

## 4. Patient journey review

| Visitor | Important question | Existing route / observation |
|---|---|---|
| New patient | Can I attend, how much will it cost and how do I book? | New Patients, billing/bulk-billing links and persistent booking actions |
| Existing patient | How can I book, request a script or get a result? | Direct booking, Patient Information, repeat prescriptions, test results and Digital Reception |
| Parent | Does the clinic offer care for children? | Children's Health service, practitioner areas of care and Knowledge Centre |
| Older patient | Can I read and navigate this easily? | Existing large tap controls, straightforward heading structure; real-device usability study recommended |
| Busy professional | Can I take action without browsing the site? | Header booking/call actions and Digital Reception administrative routing |
| Health-information seeker | Can I find reliable patient education before deciding on care? | Topic clusters, guide pages and contextual service/practitioner/booking links |

## 5. Mobile and carousel

Checked width **320, 360, 375 and 390px**. No horizontal page overflow was observed. Visible Call, Book, Menu, Digital Reception and HotDoc download controls each measured at least **44px in both dimensions**. The existing 11-card carousel remained present. A focused browser check also confirmed the next arrow advances the track. Existing keyboard and touch behaviour were not rewritten.

## 6. Homepage scanning and trust

The current flow retains the approved: hero/booking/trust → practice story/community → team → services → HotDoc → patient information → updates → final booking/contact. The trust information is already contextual rather than repeated in new blocks. No change to section order or CTA rhythm is justified by the offline evidence.

## 7. Files and before/after snippets

**Changed production files:** `styles.css`, `digital-reception.js` only.

**Before — pressed state:** Different controls relied on their existing hover and focus styles; there was no unified transient press rule.

**After — essential CSS extract:**

```css
:where(.button, .menu-toggle, .team-carousel-arrow,
       .digital-reception-search, .digital-reception-quick button,
       .digital-reception-show-more):active:not(:disabled):not([aria-disabled="true"]) {
  translate: 0 1px;
  filter: brightness(.96);
}
```

The actual production selector is scoped to additional existing controls and explicitly avoids transparent poster hotspots.

**Before — Digital Reception:** A new query could leave the previous results visible until the search index finished loading.

**After — essential JavaScript extract:**

```javascript
results.setAttribute('aria-busy', 'true');
results.innerHTML = '<span class="digital-reception-status">Finding relevant website information…</span>';
try { await loadIndex(); }
finally { /* clear busy state for current request */ }
```

The release contains request-ID checks and error fallback handling; the extract is illustrative.

## 8. QA and preservation evidence

- **197 HTML pages / 195 indexable pages:** production regression passed.
- **15,439 local links and file references / 1,920 fragments:** checked by existing production gate; no broken local targets reported.
- **13 practitioner profiles / 11 individual booking routes:** validated by existing production gate.
- **102 Knowledge Centre pages / 81 articles:** navigation and reading validation passed.
- **Static accessibility:** 197 pages passed the supplied semantic accessibility validator.
- **Four old/new rendered viewport comparisons:** pixel-identical after assets settled (homepage 390px/1440px, GP listing 390px, Knowledge Centre 1440px); geometry unchanged and no horizontal overflow.
- **Four mobile widths:** the existing action targets remain at least 44px square.
- **Focused browser interaction checks:** all 13 passed (Digital Reception symptom and emergency queries, modal open/close, carousel movement, launcher, preserved booking controls).
- **File integrity:** all original files retained; only the two stated files modified; no original content/images/scripts removed.

## 9. Remaining opportunities — evidence required before implementing

**High-confidence next actions, without design change:** instrument privacy-respecting booking-launch and successful-booking events (only after authorising the provider integration); collect anonymised task-completion data for scripts, results and parking; perform moderated patient testing on narrow phones and with older users; conduct manual TalkBack, VoiceOver and live HotDoc tests.

**Do not introduce without evidence:** extra header CTAs, booking popups, new trust badges, extra carousel controls, unverified GP matching, or a homepage section reorder.

## 10. Indicative engineering scores

| Score | Result | Interpretation |
|---|---:|---|
| **UX readiness** | **89/100** | Strong information architecture and interaction accessibility; live patient validation still required |
| **Conversion-path readiness** | **86/100** | Low click depth to booking launch; completed-booking funnel is not instrumented |

These are qualitative expert-assessment scores, **not observed patient conversion percentages**. No numerical uplift is claimed.
