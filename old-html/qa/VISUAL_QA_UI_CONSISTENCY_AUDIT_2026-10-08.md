# Woolloongabba Medical Centre — Visual QA & UI Consistency Audit
**Date:** 8 October 2026  
**Scope:** 134 HTML pages  
**Review role:** Senior UI Design · Healthcare UX · Luxury Brand Art Direction · Accessibility  
**Excluded from review:** SEO ranking strategy and source-code quality as design criteria. Structural/link checks were used only to confirm that the visual journeys were not hiding or breaking pages.

## Audit method
- Full-page patient-view renders were reviewed across the site at desktop and mobile, supported by responsive geometry checks at **320px, 375px, 390px and 414px**.
- Shared UI systems reviewed: header, primary navigation, breadcrumbs, On This Page, left/related navigation, booking actions, Digital Reception, trust elements, practitioner cards and footer.
- 134 pages were cross-checked for hidden/orphan pathways and internal destinations after the visual repair pass.
- Approved homepage content architecture and brand identity were preserved; only visual/UX consistency refinements were applied.

## Final QA summary
- **134/134 HTML pages** remain present.
- **0 broken internal links or fragments** in the final cross-check.
- **0 orphan public HTML pages** in the final cross-check.
- **0 horizontal overflow pages** at 320, 375, 390 or 414px in the responsive geometry pass.
- **0 mobile clipping defects** detected in the final geometry pass.
- **Primary navigation order is consistent on all applicable pages:** Services → Our Team → Patient Information → Healthcare Knowledge Centre → Updates → Contact.
- **All 13 practitioner profiles** contain Areas of Care, Professional Interests and Related Services sections. Items use internal links where a relevant approved destination exists; no unverified clinical interests were invented.
- **All 13 practitioner profiles** use the Patient Information related-page panel.
- Digital Reception quick actions were specifically retested at 320/375/390/414 and are visible/reachable.
- Homepage `<main>` content remained byte-for-byte-equivalent at the DOM serialization level to the supplied Authority Ecosystem baseline; the original Healthcare Doctors logo and brand-mark assets are unchanged.

# Top 50 visual issues ranked by impact

### 1. Secondary left navigation appeared before the page content on mobile, delaying the information a patient selected.
**Priority:** HIGH  
**Status:** RESOLVED  
**Recommended / applied fix:** Mobile/tablet page layouts now present the article first and the related-page panel afterwards; desktop retains the approved left panel.

### 2. Digital Reception quick actions became partially obscured at 320–375px when the sticky action row occupied the same visual space.
**Priority:** HIGH  
**Status:** RESOLVED  
**Recommended / applied fix:** Quick actions and Book/Call actions now use a two-column compact layout down to 320px; all six quick buttons remain visible/clickable.

### 3. Sixteen procedure/service pages rendered breadcrumbs as a tall vertical sequence on mobile.
**Priority:** HIGH  
**Status:** RESOLVED  
**Recommended / applied fix:** Legacy nested breadcrumb markup is now visually normalized into one wrapping horizontal trail.

### 4. The mobile footer was visually too dominant, especially on short institutional pages.
**Priority:** HIGH  
**Status:** RESOLVED  
**Recommended / applied fix:** Footer spacing, trust marks and link grids were compacted while retaining all required institutional information.

### 5. Footer appearance varied between templates because legacy Open 7 Days / HotDoc chips appeared only on some pages.
**Priority:** HIGH  
**Status:** RESOLVED  
**Recommended / applied fix:** The redundant visual chip row is suppressed consistently; the source content remains intact and the same information remains available through hours and booking controls.

### 6. Long desktop side navigation could extend below a short laptop viewport and hide lower navigation choices.
**Priority:** HIGH  
**Status:** RESOLVED  
**Recommended / applied fix:** Desktop side panels now have a viewport-aware maximum height and internal scrolling.

### 7. Persistent Book/Call actions and Digital Reception competed for the same lower-right screen area.
**Priority:** HIGH  
**Status:** RESOLVED  
**Recommended / applied fix:** Digital Reception launcher/panel sits above the persistent action tray and the tray remains independently reachable.

### 8. Procedure/service pages used a very long service navigation block that overwhelmed mobile content flow.
**Priority:** HIGH  
**Status:** RESOLVED  
**Recommended / applied fix:** Service navigation is moved after the main content on mobile and remains available from Explore related pages.

### 9. Patient Information pages used a 16-link side panel ahead of content on mobile.
**Priority:** HIGH  
**Status:** RESOLVED  
**Recommended / applied fix:** Patient content is now first; the complete patient-information panel follows the article.

### 10. Knowledge Centre articles/categories placed a large related-category panel ahead of educational content on mobile.
**Priority:** HIGH  
**Status:** RESOLVED  
**Recommended / applied fix:** Knowledge content is now first, with the authority navigation retained after it.

### 11. Doctor profiles placed Patient Information navigation before the clinician profile content on mobile.
**Priority:** HIGH  
**Status:** RESOLVED  
**Recommended / applied fix:** Every clinician profile now leads with clinician information and places the Patient Information panel after the content.

### 12. Some doctor Areas of Care / Professional Interests linked to overly broad destination pages.
**Priority:** HIGH  
**Status:** RESOLVED  
**Recommended / applied fix:** Mappings were refined to the most specific approved service or Knowledge Centre destination available.

### 13. Dr Mary Abadir’s broad women’s-health items did not take patients to the most specific existing care pages.
**Priority:** HIGH  
**Status:** RESOLVED  
**Recommended / applied fix:** Pre-pregnancy, antenatal/postnatal, cervical screening and menopause pathways now use the specific approved destinations where available.

### 14. Shared antenatal/maternity terms on Dr Debra Larkins and Dr Tanya Goodwill were linked too generically.
**Priority:** HIGH  
**Status:** RESOLVED  
**Recommended / applied fix:** They now link directly to Antenatal & Postnatal Care.

### 15. Pregnancy care on Dr Wasantha Hettiarchchi’s profile was linked too generically.
**Priority:** HIGH  
**Status:** RESOLVED  
**Recommended / applied fix:** It now links directly to Antenatal & Postnatal Care.

### 16. Geriatric/senior-health interests could lead to generic care pages.
**Priority:** HIGH  
**Status:** RESOLVED  
**Recommended / applied fix:** Relevant items now link to Healthy Ageing.

### 17. There was a risk of inventing professional interests for profiles where separate interests are not publicly verified.
**Priority:** HIGH  
**Status:** RESOLVED  
**Recommended / applied fix:** Dr Nirupa Sivathasan and Mr Samuel Stafford retain transparent explanatory text and link to relevant care pages without fabricating interests.

### 18. Eleven clinician profile hero photos depend on externally hosted clinic images rather than image files packaged locally.
**Priority:** MEDIUM  
**Status:** OPEN DEPENDENCY  
**Recommended / applied fix:** Before deployment, copy the exact verified source photographs into local assets and point the same profiles to those files; do not replace faces with AI/stock imagery.

### 19. Dr Nirupa Sivathasan has no verified portrait in the current package.
**Priority:** MEDIUM  
**Status:** OPEN DEPENDENCY  
**Recommended / applied fix:** Add only a verified real portrait when supplied/published; the current text-led profile is safer than a fabricated image.

### 20. Mr Samuel Stafford has no verified portrait in the current package.
**Priority:** MEDIUM  
**Status:** OPEN DEPENDENCY  
**Recommended / applied fix:** Add only a verified real portrait when supplied/published.

### 21. Dr Mary Abadir does not have a verified individual HotDoc practitioner URL in the current build.
**Priority:** MEDIUM  
**Status:** OPEN DEPENDENCY  
**Recommended / applied fix:** Keep the safe general HotDoc booking flow until an individual verified HotDoc URL is available.

### 22. The On This Page navigation could wrap into a tall block on narrow devices.
**Priority:** MEDIUM  
**Status:** RESOLVED  
**Recommended / applied fix:** It now behaves as a horizontally scrollable pill row with adequate target height.

### 23. Medical Centre Network location actions were only about 36px high.
**Priority:** MEDIUM  
**Status:** RESOLVED  
**Recommended / applied fix:** Location actions now use a minimum 44px target.

### 24. Footer trust badges could inflate the footer because their rendered height was not tightly controlled.
**Priority:** MEDIUM  
**Status:** RESOLVED  
**Recommended / applied fix:** AGPAL and Bulk Billing artwork now has explicit compact square dimensions and consistent object fitting.

### 25. Footer link inventory varied between page families, including missing Our Services links on some templates.
**Priority:** MEDIUM  
**Status:** RESOLVED  
**Recommended / applied fix:** Footer Practice navigation is now normalized across the site.

### 26. The footer’s type hierarchy became too small in earlier compact versions.
**Priority:** MEDIUM  
**Status:** RESOLVED  
**Recommended / applied fix:** Footer body text, headings and hours were raised to readable sizes while retaining compact spacing.

### 27. Mobile header action labels became too small at the narrowest breakpoint.
**Priority:** MEDIUM  
**Status:** RESOLVED  
**Recommended / applied fix:** Compact header labels are now kept at a more legible size without creating overflow.

### 28. On This Page and side-navigation section labels were micro-type.
**Priority:** MEDIUM  
**Status:** RESOLVED  
**Recommended / applied fix:** Their label size has been increased to 12px while retaining the institutional uppercase style.

### 29. Knowledge Centre kicker labels were below the preferred small-text threshold.
**Priority:** MEDIUM  
**Status:** RESOLVED  
**Recommended / applied fix:** Kickers now render at 12px.

### 30. Supporting update metadata on the homepage dropped to approximately 8–9px in some card states.
**Priority:** MEDIUM  
**Status:** RESOLVED  
**Recommended / applied fix:** Supporting update metadata is now 12px.

### 31. Supporting Read update links were visually undersized.
**Priority:** MEDIUM  
**Status:** RESOLVED  
**Recommended / applied fix:** Supporting editorial links are now 12px.

### 32. Supporting update excerpts were visually undersized.
**Priority:** MEDIUM  
**Status:** RESOLVED  
**Recommended / applied fix:** Supporting update copy is now 12.5px with controlled line-height.

### 33. Service-page practitioner focus labels were only about 11px.
**Priority:** MEDIUM  
**Status:** RESOLVED  
**Recommended / applied fix:** Practitioner-service secondary labels are now 12px.

### 34. Team directory interest summaries were too small for comfortable scanning.
**Priority:** MEDIUM  
**Status:** RESOLVED  
**Recommended / applied fix:** Team authority summaries are now 12.5px.

### 35. Photo to be published labels were too small to read comfortably.
**Priority:** MEDIUM  
**Status:** RESOLVED  
**Recommended / applied fix:** Unavailable-photo messaging is now 12px and remains explicitly non-fabricated.

### 36. Homepage Call Clinic and supporting operational microcopy were smaller than the rest of the action system.
**Priority:** MEDIUM  
**Status:** RESOLVED  
**Recommended / applied fix:** The hero action and related helper text were increased while preserving the approved hero layout.

### 37. Booking-page helper copy below the HotDoc heading was undersized.
**Priority:** MEDIUM  
**Status:** RESOLVED  
**Recommended / applied fix:** Helper copy is now 12px with improved line-height.

### 38. FAQ and Updates search labels were visually small.
**Priority:** MEDIUM  
**Status:** RESOLVED  
**Recommended / applied fix:** Search labels are now 12px.

### 39. Breadcrumb trails and Explore related pages could visually compete on narrow screens.
**Priority:** MEDIUM  
**Status:** RESOLVED  
**Recommended / applied fix:** Breadcrumbs now wrap as a compact trail while the related-pages action remains a separate secondary control.

### 40. The six-category Team order needed to remain consistent throughout navigation.
**Priority:** MEDIUM  
**Status:** RESOLVED  
**Recommended / applied fix:** The approved order is retained: GP → Specialist → Allied Health → Nursing → Management → Reception.

### 41. Local Healthcare Access previously risked behaving like a hidden authority page.
**Priority:** MEDIUM  
**Status:** VERIFIED  
**Recommended / applied fix:** It is linked through the Community pathway and footer, with zero orphan public HTML pages found.

### 42. The authority ecosystem increased the chance of hidden pages as page count grew.
**Priority:** MEDIUM  
**Status:** VERIFIED  
**Recommended / applied fix:** All public HTML pages have inbound internal links; the final cross-check found zero orphan pages.

### 43. Very short pages can still make the footer occupy a large proportion of the total screen height.
**Priority:** LOW  
**Status:** ACCEPTED DESIGN  
**Recommended / applied fix:** Footer has been compacted globally; retain complete trust, opening-hours and institutional navigation rather than removing useful patient information.

### 44. Long article pages repeat a final in-content booking CTA while the persistent Book/Call tray is also present.
**Priority:** LOW  
**Status:** ACCEPTED DESIGN  
**Recommended / applied fix:** Keep both: the in-content CTA closes the reading journey and the fixed tray provides immediate access; maintain the in-content CTA as the visual primary at the article end.

### 45. Knowledge article bylines add a trust block before the educational body and slightly increase first-screen density.
**Priority:** LOW  
**Status:** ACCEPTED DESIGN  
**Recommended / applied fix:** Retain the byline/trust context; it supports healthcare authority and remains visually subordinate to the article title.

### 46. Doctor profiles with a portrait devote substantial vertical space to the image on mobile.
**Priority:** LOW  
**Status:** ACCEPTED DESIGN  
**Recommended / applied fix:** Retain the approved portrait treatment; if future testing shows excessive drop-off, reduce only the mobile portrait width without changing the image crop or identity.

### 47. The 320px footer remains necessarily taller than at 390–414px because long institutional links wrap.
**Priority:** LOW  
**Status:** ACCEPTED DESIGN  
**Recommended / applied fix:** No horizontal overflow is present; keep readability rather than forcing overly small text.

### 48. Homepage supporting news excerpts use intentional line clamping, which can truncate sentence endings.
**Priority:** LOW  
**Status:** ACCEPTED DESIGN  
**Recommended / applied fix:** Retain the editorial card rhythm; the full article remains one tap away.

### 49. Some image containers intentionally crop source imagery and can appear as internal overflow in geometry tests.
**Priority:** LOW  
**Status:** VERIFIED  
**Recommended / applied fix:** Manual review confirmed the GP directory image crop is intentional object-cover behaviour, not visible layout overflow.

### 50. The homepage supporting-card paragraph clamp registers as internal clipping in geometry tests.
**Priority:** LOW  
**Status:** VERIFIED  
**Recommended / applied fix:** Manual review confirmed this is the intended editorial excerpt treatment, not a broken layout.

# Practitioner pathway audit
| Practitioner | Areas of Care | Professional Interests | Related Services | Patient Information panel | Booking | Image dependency |
|---|---:|---|---:|---|---|---|
| Dr Anand Singh | 5 linked | linked | 6 links | Yes | HotDoc Lightbox | External verified clinic image |
| Dr Debra Larkins | 2 linked | linked | 4 links | Yes | HotDoc Lightbox | External verified clinic image |
| Dr Gemunu Suresh Ranawake | 6 linked | linked | 5 links | Yes | HotDoc Lightbox | External verified clinic image |
| Dr Kooshyar Karimi | 4 linked | linked | 5 links | Yes | HotDoc Lightbox | External verified clinic image |
| Dr Mary Abadir | 17 linked | linked | 8 links | Yes | General HotDoc flow (individual URL not verified) | External verified clinic image |
| Dr Nirupa Sivathasan | 2 linked | linked | 3 links | Yes | HotDoc Lightbox | No verified portrait in package |
| Dr Sambo Luon | 2 linked | linked | 3 links | Yes | HotDoc Lightbox | External verified clinic image |
| Dr Steven Chang | 7 linked | linked | 4 links | Yes | HotDoc Lightbox | External verified clinic image |
| Dr Sumita Singh | 3 linked | linked | 3 links | Yes | HotDoc Lightbox | External verified clinic image |
| Dr Tanya Goodwill | 12 linked | linked | 7 links | Yes | HotDoc Lightbox | External verified clinic image |
| Dr Usman Gul | 2 linked | linked | 3 links | Yes | HotDoc Lightbox | External verified clinic image |
| Dr Wasantha Hettiarchchi | 8 linked | linked | 8 links | Yes | HotDoc Lightbox | External verified clinic image |
| Mr Samuel Stafford | 1 linked | linked | 4 links | Yes | HotDoc Lightbox | No verified portrait in package |

# Page-by-page visual audit

## We couldn’t find that page.
**File:** `404.html`  
**Page family:** System page

**Visual Problems Found**
- Shared footer previously consumed too much vertical space on mobile and varied between legacy templates. **Resolved:** compact common footer treatment applied.
- As a short utility page, the footer occupies a larger proportion of the screen than on content-heavy pages; the compact footer reduces this effect.

**UI Problems Found**
- Primary navigation, persistent Book/Call tray and footer navigation were checked against the common site system. **Final state:** consistent.

**UX Problems Found**
- Primary appointment path remains visible through the in-page CTA and persistent Book/Call controls.
- Recovery navigation remains more important than decorative content on this page.

**Accessibility Problems Found**
- Final responsive check found no horizontal page overflow at 320/375/390/414px.

**Recommended Fixes**
- Retain the current common footer/header/action system; avoid page-specific overrides unless clinically necessary.

**Priority: LOW**

## Plan your visit with confidence.
**File:** `access-parking.html`  
**Page family:** Institution / patient information

**Visual Problems Found**
- Shared footer previously consumed too much vertical space on mobile and varied between legacy templates. **Resolved:** compact common footer treatment applied.
- The related-page/left navigation was visually too dominant before the article at mobile widths. **Resolved:** content now comes first; related navigation follows.

**UI Problems Found**
- Primary navigation, persistent Book/Call tray and footer navigation were checked against the common site system. **Final state:** consistent.
- Desktop side navigation could exceed a short viewport. **Resolved:** viewport-aware scrolling is applied.

**UX Problems Found**
- Primary appointment path remains visible through the in-page CTA and persistent Book/Call controls.
- “Explore related pages” remains available above the content so the secondary panel is still discoverable after being moved below the article on mobile.

**Accessibility Problems Found**
- Final responsive check found no horizontal page overflow at 320/375/390/414px.

**Recommended Fixes**
- Retain the current common footer/header/action system; avoid page-specific overrides unless clinically necessary.
- Keep desktop navigation sticky/scrollable and mobile navigation after content.

**Priority: MEDIUM**

## Care should be easier to access.
**File:** `accessibility.html`  
**Page family:** Institution / patient information

**Visual Problems Found**
- Shared footer previously consumed too much vertical space on mobile and varied between legacy templates. **Resolved:** compact common footer treatment applied.
- The related-page/left navigation was visually too dominant before the article at mobile widths. **Resolved:** content now comes first; related navigation follows.

**UI Problems Found**
- Primary navigation, persistent Book/Call tray and footer navigation were checked against the common site system. **Final state:** consistent.
- Desktop side navigation could exceed a short viewport. **Resolved:** viewport-aware scrolling is applied.

**UX Problems Found**
- Primary appointment path remains visible through the in-page CTA and persistent Book/Call controls.
- “Explore related pages” remains available above the content so the secondary panel is still discoverable after being moved below the article on mobile.

**Accessibility Problems Found**
- Final responsive check found no horizontal page overflow at 320/375/390/414px.

**Recommended Fixes**
- Retain the current common footer/header/action system; avoid page-specific overrides unless clinically necessary.
- Keep desktop navigation sticky/scrollable and mobile navigation after content.

**Priority: MEDIUM**

## After Hours Care
**File:** `after-hours-care.html`  
**Page family:** Institution / patient information

**Visual Problems Found**
- Shared footer previously consumed too much vertical space on mobile and varied between legacy templates. **Resolved:** compact common footer treatment applied.
- The related-page/left navigation was visually too dominant before the article at mobile widths. **Resolved:** content now comes first; related navigation follows.

**UI Problems Found**
- Primary navigation, persistent Book/Call tray and footer navigation were checked against the common site system. **Final state:** consistent.
- Desktop side navigation could exceed a short viewport. **Resolved:** viewport-aware scrolling is applied.

**UX Problems Found**
- Primary appointment path remains visible through the in-page CTA and persistent Book/Call controls.
- “Explore related pages” remains available above the content so the secondary panel is still discoverable after being moved below the article on mobile.

**Accessibility Problems Found**
- Final responsive check found no horizontal page overflow at 320/375/390/414px.

**Recommended Fixes**
- Retain the current common footer/header/action system; avoid page-specific overrides unless clinically necessary.
- Keep desktop navigation sticky/scrollable and mobile navigation after content.

**Priority: MEDIUM**

## Why AGPAL accreditation matters.
**File:** `agpal-accreditation.html`  
**Page family:** Institution / patient information

**Visual Problems Found**
- Shared footer previously consumed too much vertical space on mobile and varied between legacy templates. **Resolved:** compact common footer treatment applied.
- The related-page/left navigation was visually too dominant before the article at mobile widths. **Resolved:** content now comes first; related navigation follows.

**UI Problems Found**
- Primary navigation, persistent Book/Call tray and footer navigation were checked against the common site system. **Final state:** consistent.
- Desktop side navigation could exceed a short viewport. **Resolved:** viewport-aware scrolling is applied.

**UX Problems Found**
- Primary appointment path remains visible through the in-page CTA and persistent Book/Call controls.
- “Explore related pages” remains available above the content so the secondary panel is still discoverable after being moved below the article on mobile.

**Accessibility Problems Found**
- Final responsive check found no horizontal page overflow at 320/375/390/414px.

**Recommended Fixes**
- Retain the current common footer/header/action system; avoid page-specific overrides unless clinically necessary.
- Keep desktop navigation sticky/scrollable and mobile navigation after content.

**Priority: MEDIUM**

## AI-Assisted Consultation Notes & Consent
**File:** `ai-transcription-consent.html`  
**Page family:** Institution / patient information

**Visual Problems Found**
- Shared footer previously consumed too much vertical space on mobile and varied between legacy templates. **Resolved:** compact common footer treatment applied.
- The related-page/left navigation was visually too dominant before the article at mobile widths. **Resolved:** content now comes first; related navigation follows.

**UI Problems Found**
- Primary navigation, persistent Book/Call tray and footer navigation were checked against the common site system. **Final state:** consistent.
- Desktop side navigation could exceed a short viewport. **Resolved:** viewport-aware scrolling is applied.

**UX Problems Found**
- Primary appointment path remains visible through the in-page CTA and persistent Book/Call controls.
- “Explore related pages” remains available above the content so the secondary panel is still discoverable after being moved below the article on mobile.

**Accessibility Problems Found**
- Final responsive check found no horizontal page overflow at 320/375/390/414px.

**Recommended Fixes**
- Retain the current common footer/header/action system; avoid page-specific overrides unless clinically necessary.
- Keep desktop navigation sticky/scrollable and mobile navigation after content.

**Priority: MEDIUM**

## Book your appointment.
**File:** `book-appointment.html`  
**Page family:** Institution / patient information

**Visual Problems Found**
- Shared footer previously consumed too much vertical space on mobile and varied between legacy templates. **Resolved:** compact common footer treatment applied.

**UI Problems Found**
- Primary navigation, persistent Book/Call tray and footer navigation were checked against the common site system. **Final state:** consistent.
- All six Digital Reception quick buttons plus Book Appointment / Call Reception are visible/reachable at 320/375/390/414px.

**UX Problems Found**
- Primary appointment path remains visible through the in-page CTA and persistent Book/Call controls.
- Digital Reception and HotDoc are both appointment pathways; on 320–375px some Digital Reception actions were previously hidden behind its sticky action row. **Resolved.**

**Accessibility Problems Found**
- Final responsive check found no horizontal page overflow at 320/375/390/414px.

**Recommended Fixes**
- Retain the current common footer/header/action system; avoid page-specific overrides unless clinically necessary.
- Keep Digital Reception quick/action grids at two columns even at 320px.

**Priority: HIGH**

## Bulk Billing
**File:** `bulk-billing.html`  
**Page family:** Institution / patient information

**Visual Problems Found**
- Shared footer previously consumed too much vertical space on mobile and varied between legacy templates. **Resolved:** compact common footer treatment applied.
- The related-page/left navigation was visually too dominant before the article at mobile widths. **Resolved:** content now comes first; related navigation follows.

**UI Problems Found**
- Primary navigation, persistent Book/Call tray and footer navigation were checked against the common site system. **Final state:** consistent.
- Desktop side navigation could exceed a short viewport. **Resolved:** viewport-aware scrolling is applied.

**UX Problems Found**
- Primary appointment path remains visible through the in-page CTA and persistent Book/Call controls.
- “Explore related pages” remains available above the content so the secondary panel is still discoverable after being moved below the article on mobile.

**Accessibility Problems Found**
- Final responsive check found no horizontal page overflow at 320/375/390/414px.

**Recommended Fixes**
- Retain the current common footer/header/action system; avoid page-specific overrides unless clinically necessary.
- Keep desktop navigation sticky/scrollable and mobile navigation after content.

**Priority: MEDIUM**

## Proudly caring for Brisbane’s inner south.
**File:** `community.html`  
**Page family:** Institution / patient information

**Visual Problems Found**
- Shared footer previously consumed too much vertical space on mobile and varied between legacy templates. **Resolved:** compact common footer treatment applied.
- The related-page/left navigation was visually too dominant before the article at mobile widths. **Resolved:** content now comes first; related navigation follows.

**UI Problems Found**
- Primary navigation, persistent Book/Call tray and footer navigation were checked against the common site system. **Final state:** consistent.
- Desktop side navigation could exceed a short viewport. **Resolved:** viewport-aware scrolling is applied.

**UX Problems Found**
- Primary appointment path remains visible through the in-page CTA and persistent Book/Call controls.
- “Explore related pages” remains available above the content so the secondary panel is still discoverable after being moved below the article on mobile.

**Accessibility Problems Found**
- Final responsive check found no horizontal page overflow at 320/375/390/414px.

**Recommended Fixes**
- Retain the current common footer/header/action system; avoid page-specific overrides unless clinically necessary.
- Keep desktop navigation sticky/scrollable and mobile navigation after content.

**Priority: MEDIUM**

## At home in Woolloongabba.
**File:** `contact.html`  
**Page family:** Institution / patient information

**Visual Problems Found**
- Shared footer previously consumed too much vertical space on mobile and varied between legacy templates. **Resolved:** compact common footer treatment applied.
- The related-page/left navigation was visually too dominant before the article at mobile widths. **Resolved:** content now comes first; related navigation follows.

**UI Problems Found**
- Primary navigation, persistent Book/Call tray and footer navigation were checked against the common site system. **Final state:** consistent.
- Desktop side navigation could exceed a short viewport. **Resolved:** viewport-aware scrolling is applied.

**UX Problems Found**
- Primary appointment path remains visible through the in-page CTA and persistent Book/Call controls.
- “Explore related pages” remains available above the content so the secondary panel is still discoverable after being moved below the article on mobile.

**Accessibility Problems Found**
- Final responsive check found no horizontal page overflow at 320/375/390/414px.

**Recommended Fixes**
- Retain the current common footer/header/action system; avoid page-specific overrides unless clinically necessary.
- Keep desktop navigation sticky/scrollable and mobile navigation after content.

**Priority: MEDIUM**

## Dr Anand Singh
**File:** `doctors/dr-anand-singh.html`  
**Page family:** Practitioner profile

**Visual Problems Found**
- Shared footer previously consumed too much vertical space on mobile and varied between legacy templates. **Resolved:** compact common footer treatment applied.
- The related-page/left navigation was visually too dominant before the article at mobile widths. **Resolved:** content now comes first; related navigation follows.
- Clinician content and booking CTA are now visually prioritized ahead of the Patient Information panel on mobile.
- **Open dependency:** the portrait is loaded from the clinic’s external website; the ZIP does not contain the local copy referenced by the fallback metadata.

**UI Problems Found**
- Primary navigation, persistent Book/Call tray and footer navigation were checked against the common site system. **Final state:** consistent.
- Desktop side navigation could exceed a short viewport. **Resolved:** viewport-aware scrolling is applied.
- Areas of Care, Professional Interests and Related Services are presented as linked patient pathways rather than dead labels.

**UX Problems Found**
- Primary appointment path remains visible through the in-page CTA and persistent Book/Call controls.
- “Explore related pages” remains available above the content so the secondary panel is still discoverable after being moved below the article on mobile.
- The profile now supports the journey: practitioner → relevant care information → booking.

**Accessibility Problems Found**
- Final responsive check found no horizontal page overflow at 320/375/390/414px.
- If the remote image becomes unavailable, the visual identity of this profile is weakened even though text remains usable.

**Recommended Fixes**
- Retain the current common footer/header/action system; avoid page-specific overrides unless clinically necessary.
- Keep desktop navigation sticky/scrollable and mobile navigation after content.
- Keep care/interest links mapped to the most specific approved service or Knowledge Centre destination.
- Before production cutover, localize the exact verified photograph; do not alter the face or substitute AI/stock imagery.

**Priority: MEDIUM**

## Dr Debra Larkins
**File:** `doctors/dr-debra-larkins.html`  
**Page family:** Practitioner profile

**Visual Problems Found**
- Shared footer previously consumed too much vertical space on mobile and varied between legacy templates. **Resolved:** compact common footer treatment applied.
- The related-page/left navigation was visually too dominant before the article at mobile widths. **Resolved:** content now comes first; related navigation follows.
- Clinician content and booking CTA are now visually prioritized ahead of the Patient Information panel on mobile.
- **Open dependency:** the portrait is loaded from the clinic’s external website; the ZIP does not contain the local copy referenced by the fallback metadata.

**UI Problems Found**
- Primary navigation, persistent Book/Call tray and footer navigation were checked against the common site system. **Final state:** consistent.
- Desktop side navigation could exceed a short viewport. **Resolved:** viewport-aware scrolling is applied.
- Areas of Care, Professional Interests and Related Services are presented as linked patient pathways rather than dead labels.

**UX Problems Found**
- Primary appointment path remains visible through the in-page CTA and persistent Book/Call controls.
- “Explore related pages” remains available above the content so the secondary panel is still discoverable after being moved below the article on mobile.
- The profile now supports the journey: practitioner → relevant care information → booking.

**Accessibility Problems Found**
- Final responsive check found no horizontal page overflow at 320/375/390/414px.
- If the remote image becomes unavailable, the visual identity of this profile is weakened even though text remains usable.

**Recommended Fixes**
- Retain the current common footer/header/action system; avoid page-specific overrides unless clinically necessary.
- Keep desktop navigation sticky/scrollable and mobile navigation after content.
- Keep care/interest links mapped to the most specific approved service or Knowledge Centre destination.
- Before production cutover, localize the exact verified photograph; do not alter the face or substitute AI/stock imagery.

**Priority: MEDIUM**

## Dr Gemunu Suresh Ranawake
**File:** `doctors/dr-gemunu-suresh-ranawake.html`  
**Page family:** Practitioner profile

**Visual Problems Found**
- Shared footer previously consumed too much vertical space on mobile and varied between legacy templates. **Resolved:** compact common footer treatment applied.
- The related-page/left navigation was visually too dominant before the article at mobile widths. **Resolved:** content now comes first; related navigation follows.
- Clinician content and booking CTA are now visually prioritized ahead of the Patient Information panel on mobile.
- **Open dependency:** the portrait is loaded from the clinic’s external website; the ZIP does not contain the local copy referenced by the fallback metadata.

**UI Problems Found**
- Primary navigation, persistent Book/Call tray and footer navigation were checked against the common site system. **Final state:** consistent.
- Desktop side navigation could exceed a short viewport. **Resolved:** viewport-aware scrolling is applied.
- Areas of Care, Professional Interests and Related Services are presented as linked patient pathways rather than dead labels.

**UX Problems Found**
- Primary appointment path remains visible through the in-page CTA and persistent Book/Call controls.
- “Explore related pages” remains available above the content so the secondary panel is still discoverable after being moved below the article on mobile.
- The profile now supports the journey: practitioner → relevant care information → booking.

**Accessibility Problems Found**
- Final responsive check found no horizontal page overflow at 320/375/390/414px.
- If the remote image becomes unavailable, the visual identity of this profile is weakened even though text remains usable.

**Recommended Fixes**
- Retain the current common footer/header/action system; avoid page-specific overrides unless clinically necessary.
- Keep desktop navigation sticky/scrollable and mobile navigation after content.
- Keep care/interest links mapped to the most specific approved service or Knowledge Centre destination.
- Before production cutover, localize the exact verified photograph; do not alter the face or substitute AI/stock imagery.

**Priority: MEDIUM**

## Dr Kooshyar Karimi
**File:** `doctors/dr-kooshyar-karimi.html`  
**Page family:** Practitioner profile

**Visual Problems Found**
- Shared footer previously consumed too much vertical space on mobile and varied between legacy templates. **Resolved:** compact common footer treatment applied.
- The related-page/left navigation was visually too dominant before the article at mobile widths. **Resolved:** content now comes first; related navigation follows.
- Clinician content and booking CTA are now visually prioritized ahead of the Patient Information panel on mobile.
- **Open dependency:** the portrait is loaded from the clinic’s external website; the ZIP does not contain the local copy referenced by the fallback metadata.

**UI Problems Found**
- Primary navigation, persistent Book/Call tray and footer navigation were checked against the common site system. **Final state:** consistent.
- Desktop side navigation could exceed a short viewport. **Resolved:** viewport-aware scrolling is applied.
- Areas of Care, Professional Interests and Related Services are presented as linked patient pathways rather than dead labels.

**UX Problems Found**
- Primary appointment path remains visible through the in-page CTA and persistent Book/Call controls.
- “Explore related pages” remains available above the content so the secondary panel is still discoverable after being moved below the article on mobile.
- The profile now supports the journey: practitioner → relevant care information → booking.

**Accessibility Problems Found**
- Final responsive check found no horizontal page overflow at 320/375/390/414px.
- If the remote image becomes unavailable, the visual identity of this profile is weakened even though text remains usable.

**Recommended Fixes**
- Retain the current common footer/header/action system; avoid page-specific overrides unless clinically necessary.
- Keep desktop navigation sticky/scrollable and mobile navigation after content.
- Keep care/interest links mapped to the most specific approved service or Knowledge Centre destination.
- Before production cutover, localize the exact verified photograph; do not alter the face or substitute AI/stock imagery.

**Priority: MEDIUM**

## Dr Mary Abadir
**File:** `doctors/dr-mary-abadir.html`  
**Page family:** Practitioner profile

**Visual Problems Found**
- Shared footer previously consumed too much vertical space on mobile and varied between legacy templates. **Resolved:** compact common footer treatment applied.
- The related-page/left navigation was visually too dominant before the article at mobile widths. **Resolved:** content now comes first; related navigation follows.
- Clinician content and booking CTA are now visually prioritized ahead of the Patient Information panel on mobile.
- **Open dependency:** the portrait is loaded from the clinic’s external website; the ZIP does not contain the local copy referenced by the fallback metadata.

**UI Problems Found**
- Primary navigation, persistent Book/Call tray and footer navigation were checked against the common site system. **Final state:** consistent.
- Desktop side navigation could exceed a short viewport. **Resolved:** viewport-aware scrolling is applied.
- Areas of Care, Professional Interests and Related Services are presented as linked patient pathways rather than dead labels.

**UX Problems Found**
- Primary appointment path remains visible through the in-page CTA and persistent Book/Call controls.
- “Explore related pages” remains available above the content so the secondary panel is still discoverable after being moved below the article on mobile.
- The profile now supports the journey: practitioner → relevant care information → booking.
- **Open dependency:** booking remains the general practice HotDoc flow because an individual verified practitioner URL is not available in the current source set.

**Accessibility Problems Found**
- Final responsive check found no horizontal page overflow at 320/375/390/414px.
- If the remote image becomes unavailable, the visual identity of this profile is weakened even though text remains usable.

**Recommended Fixes**
- Retain the current common footer/header/action system; avoid page-specific overrides unless clinically necessary.
- Keep desktop navigation sticky/scrollable and mobile navigation after content.
- Keep care/interest links mapped to the most specific approved service or Knowledge Centre destination.
- Before production cutover, localize the exact verified photograph; do not alter the face or substitute AI/stock imagery.
- Replace the general booking URL only when Dr Mary Abadir’s individual HotDoc URL is verified.

**Priority: MEDIUM**

## Dr Nirupa Sivathasan
**File:** `doctors/dr-nirupa-sivathasan.html`  
**Page family:** Practitioner profile

**Visual Problems Found**
- Shared footer previously consumed too much vertical space on mobile and varied between legacy templates. **Resolved:** compact common footer treatment applied.
- The related-page/left navigation was visually too dominant before the article at mobile widths. **Resolved:** content now comes first; related navigation follows.
- Clinician content and booking CTA are now visually prioritized ahead of the Patient Information panel on mobile.
- **Open dependency:** no verified portrait is packaged, so this profile intentionally uses a text-led hero and differs from photo-led clinician profiles.

**UI Problems Found**
- Primary navigation, persistent Book/Call tray and footer navigation were checked against the common site system. **Final state:** consistent.
- Desktop side navigation could exceed a short viewport. **Resolved:** viewport-aware scrolling is applied.
- Areas of Care, Professional Interests and Related Services are presented as linked patient pathways rather than dead labels.

**UX Problems Found**
- Primary appointment path remains visible through the in-page CTA and persistent Book/Call controls.
- “Explore related pages” remains available above the content so the secondary panel is still discoverable after being moved below the article on mobile.
- The profile now supports the journey: practitioner → relevant care information → booking.

**Accessibility Problems Found**
- Final responsive check found no horizontal page overflow at 320/375/390/414px.

**Recommended Fixes**
- Retain the current common footer/header/action system; avoid page-specific overrides unless clinically necessary.
- Keep desktop navigation sticky/scrollable and mobile navigation after content.
- Keep care/interest links mapped to the most specific approved service or Knowledge Centre destination.
- Add a verified real portrait only when one is available.

**Priority: MEDIUM**

## Dr Sambo Luon
**File:** `doctors/dr-sambo-luon.html`  
**Page family:** Practitioner profile

**Visual Problems Found**
- Shared footer previously consumed too much vertical space on mobile and varied between legacy templates. **Resolved:** compact common footer treatment applied.
- The related-page/left navigation was visually too dominant before the article at mobile widths. **Resolved:** content now comes first; related navigation follows.
- Clinician content and booking CTA are now visually prioritized ahead of the Patient Information panel on mobile.
- **Open dependency:** the portrait is loaded from the clinic’s external website; the ZIP does not contain the local copy referenced by the fallback metadata.

**UI Problems Found**
- Primary navigation, persistent Book/Call tray and footer navigation were checked against the common site system. **Final state:** consistent.
- Desktop side navigation could exceed a short viewport. **Resolved:** viewport-aware scrolling is applied.
- Areas of Care, Professional Interests and Related Services are presented as linked patient pathways rather than dead labels.

**UX Problems Found**
- Primary appointment path remains visible through the in-page CTA and persistent Book/Call controls.
- “Explore related pages” remains available above the content so the secondary panel is still discoverable after being moved below the article on mobile.
- The profile now supports the journey: practitioner → relevant care information → booking.

**Accessibility Problems Found**
- Final responsive check found no horizontal page overflow at 320/375/390/414px.
- If the remote image becomes unavailable, the visual identity of this profile is weakened even though text remains usable.

**Recommended Fixes**
- Retain the current common footer/header/action system; avoid page-specific overrides unless clinically necessary.
- Keep desktop navigation sticky/scrollable and mobile navigation after content.
- Keep care/interest links mapped to the most specific approved service or Knowledge Centre destination.
- Before production cutover, localize the exact verified photograph; do not alter the face or substitute AI/stock imagery.

**Priority: MEDIUM**

## Dr Steven Chang
**File:** `doctors/dr-steven-chang.html`  
**Page family:** Practitioner profile

**Visual Problems Found**
- Shared footer previously consumed too much vertical space on mobile and varied between legacy templates. **Resolved:** compact common footer treatment applied.
- The related-page/left navigation was visually too dominant before the article at mobile widths. **Resolved:** content now comes first; related navigation follows.
- Clinician content and booking CTA are now visually prioritized ahead of the Patient Information panel on mobile.
- **Open dependency:** the portrait is loaded from the clinic’s external website; the ZIP does not contain the local copy referenced by the fallback metadata.

**UI Problems Found**
- Primary navigation, persistent Book/Call tray and footer navigation were checked against the common site system. **Final state:** consistent.
- Desktop side navigation could exceed a short viewport. **Resolved:** viewport-aware scrolling is applied.
- Areas of Care, Professional Interests and Related Services are presented as linked patient pathways rather than dead labels.

**UX Problems Found**
- Primary appointment path remains visible through the in-page CTA and persistent Book/Call controls.
- “Explore related pages” remains available above the content so the secondary panel is still discoverable after being moved below the article on mobile.
- The profile now supports the journey: practitioner → relevant care information → booking.

**Accessibility Problems Found**
- Final responsive check found no horizontal page overflow at 320/375/390/414px.
- If the remote image becomes unavailable, the visual identity of this profile is weakened even though text remains usable.

**Recommended Fixes**
- Retain the current common footer/header/action system; avoid page-specific overrides unless clinically necessary.
- Keep desktop navigation sticky/scrollable and mobile navigation after content.
- Keep care/interest links mapped to the most specific approved service or Knowledge Centre destination.
- Before production cutover, localize the exact verified photograph; do not alter the face or substitute AI/stock imagery.

**Priority: MEDIUM**

## Dr Sumita Singh
**File:** `doctors/dr-sumita-singh.html`  
**Page family:** Practitioner profile

**Visual Problems Found**
- Shared footer previously consumed too much vertical space on mobile and varied between legacy templates. **Resolved:** compact common footer treatment applied.
- The related-page/left navigation was visually too dominant before the article at mobile widths. **Resolved:** content now comes first; related navigation follows.
- Clinician content and booking CTA are now visually prioritized ahead of the Patient Information panel on mobile.
- **Open dependency:** the portrait is loaded from the clinic’s external website; the ZIP does not contain the local copy referenced by the fallback metadata.

**UI Problems Found**
- Primary navigation, persistent Book/Call tray and footer navigation were checked against the common site system. **Final state:** consistent.
- Desktop side navigation could exceed a short viewport. **Resolved:** viewport-aware scrolling is applied.
- Areas of Care, Professional Interests and Related Services are presented as linked patient pathways rather than dead labels.

**UX Problems Found**
- Primary appointment path remains visible through the in-page CTA and persistent Book/Call controls.
- “Explore related pages” remains available above the content so the secondary panel is still discoverable after being moved below the article on mobile.
- The profile now supports the journey: practitioner → relevant care information → booking.

**Accessibility Problems Found**
- Final responsive check found no horizontal page overflow at 320/375/390/414px.
- If the remote image becomes unavailable, the visual identity of this profile is weakened even though text remains usable.

**Recommended Fixes**
- Retain the current common footer/header/action system; avoid page-specific overrides unless clinically necessary.
- Keep desktop navigation sticky/scrollable and mobile navigation after content.
- Keep care/interest links mapped to the most specific approved service or Knowledge Centre destination.
- Before production cutover, localize the exact verified photograph; do not alter the face or substitute AI/stock imagery.

**Priority: MEDIUM**

## Dr Tanya Goodwill
**File:** `doctors/dr-tanya-goodwill.html`  
**Page family:** Practitioner profile

**Visual Problems Found**
- Shared footer previously consumed too much vertical space on mobile and varied between legacy templates. **Resolved:** compact common footer treatment applied.
- The related-page/left navigation was visually too dominant before the article at mobile widths. **Resolved:** content now comes first; related navigation follows.
- Clinician content and booking CTA are now visually prioritized ahead of the Patient Information panel on mobile.
- **Open dependency:** the portrait is loaded from the clinic’s external website; the ZIP does not contain the local copy referenced by the fallback metadata.

**UI Problems Found**
- Primary navigation, persistent Book/Call tray and footer navigation were checked against the common site system. **Final state:** consistent.
- Desktop side navigation could exceed a short viewport. **Resolved:** viewport-aware scrolling is applied.
- Areas of Care, Professional Interests and Related Services are presented as linked patient pathways rather than dead labels.

**UX Problems Found**
- Primary appointment path remains visible through the in-page CTA and persistent Book/Call controls.
- “Explore related pages” remains available above the content so the secondary panel is still discoverable after being moved below the article on mobile.
- The profile now supports the journey: practitioner → relevant care information → booking.

**Accessibility Problems Found**
- Final responsive check found no horizontal page overflow at 320/375/390/414px.
- If the remote image becomes unavailable, the visual identity of this profile is weakened even though text remains usable.

**Recommended Fixes**
- Retain the current common footer/header/action system; avoid page-specific overrides unless clinically necessary.
- Keep desktop navigation sticky/scrollable and mobile navigation after content.
- Keep care/interest links mapped to the most specific approved service or Knowledge Centre destination.
- Before production cutover, localize the exact verified photograph; do not alter the face or substitute AI/stock imagery.

**Priority: MEDIUM**

## Dr Usman Gul
**File:** `doctors/dr-usman-gul.html`  
**Page family:** Practitioner profile

**Visual Problems Found**
- Shared footer previously consumed too much vertical space on mobile and varied between legacy templates. **Resolved:** compact common footer treatment applied.
- The related-page/left navigation was visually too dominant before the article at mobile widths. **Resolved:** content now comes first; related navigation follows.
- Clinician content and booking CTA are now visually prioritized ahead of the Patient Information panel on mobile.
- **Open dependency:** the portrait is loaded from the clinic’s external website; the ZIP does not contain the local copy referenced by the fallback metadata.

**UI Problems Found**
- Primary navigation, persistent Book/Call tray and footer navigation were checked against the common site system. **Final state:** consistent.
- Desktop side navigation could exceed a short viewport. **Resolved:** viewport-aware scrolling is applied.
- Areas of Care, Professional Interests and Related Services are presented as linked patient pathways rather than dead labels.

**UX Problems Found**
- Primary appointment path remains visible through the in-page CTA and persistent Book/Call controls.
- “Explore related pages” remains available above the content so the secondary panel is still discoverable after being moved below the article on mobile.
- The profile now supports the journey: practitioner → relevant care information → booking.

**Accessibility Problems Found**
- Final responsive check found no horizontal page overflow at 320/375/390/414px.
- If the remote image becomes unavailable, the visual identity of this profile is weakened even though text remains usable.

**Recommended Fixes**
- Retain the current common footer/header/action system; avoid page-specific overrides unless clinically necessary.
- Keep desktop navigation sticky/scrollable and mobile navigation after content.
- Keep care/interest links mapped to the most specific approved service or Knowledge Centre destination.
- Before production cutover, localize the exact verified photograph; do not alter the face or substitute AI/stock imagery.

**Priority: MEDIUM**

## Dr Wasantha Hettiarchchi
**File:** `doctors/dr-wasantha-hettiarchchi.html`  
**Page family:** Practitioner profile

**Visual Problems Found**
- Shared footer previously consumed too much vertical space on mobile and varied between legacy templates. **Resolved:** compact common footer treatment applied.
- The related-page/left navigation was visually too dominant before the article at mobile widths. **Resolved:** content now comes first; related navigation follows.
- Clinician content and booking CTA are now visually prioritized ahead of the Patient Information panel on mobile.
- **Open dependency:** the portrait is loaded from the clinic’s external website; the ZIP does not contain the local copy referenced by the fallback metadata.

**UI Problems Found**
- Primary navigation, persistent Book/Call tray and footer navigation were checked against the common site system. **Final state:** consistent.
- Desktop side navigation could exceed a short viewport. **Resolved:** viewport-aware scrolling is applied.
- Areas of Care, Professional Interests and Related Services are presented as linked patient pathways rather than dead labels.

**UX Problems Found**
- Primary appointment path remains visible through the in-page CTA and persistent Book/Call controls.
- “Explore related pages” remains available above the content so the secondary panel is still discoverable after being moved below the article on mobile.
- The profile now supports the journey: practitioner → relevant care information → booking.

**Accessibility Problems Found**
- Final responsive check found no horizontal page overflow at 320/375/390/414px.
- If the remote image becomes unavailable, the visual identity of this profile is weakened even though text remains usable.

**Recommended Fixes**
- Retain the current common footer/header/action system; avoid page-specific overrides unless clinically necessary.
- Keep desktop navigation sticky/scrollable and mobile navigation after content.
- Keep care/interest links mapped to the most specific approved service or Knowledge Centre destination.
- Before production cutover, localize the exact verified photograph; do not alter the face or substitute AI/stock imagery.

**Priority: MEDIUM**

## Mr Samuel Stafford
**File:** `doctors/mr-samuel-stafford.html`  
**Page family:** Practitioner profile

**Visual Problems Found**
- Shared footer previously consumed too much vertical space on mobile and varied between legacy templates. **Resolved:** compact common footer treatment applied.
- The related-page/left navigation was visually too dominant before the article at mobile widths. **Resolved:** content now comes first; related navigation follows.
- Clinician content and booking CTA are now visually prioritized ahead of the Patient Information panel on mobile.
- **Open dependency:** no verified portrait is packaged, so this profile intentionally uses a text-led hero and differs from photo-led clinician profiles.

**UI Problems Found**
- Primary navigation, persistent Book/Call tray and footer navigation were checked against the common site system. **Final state:** consistent.
- Desktop side navigation could exceed a short viewport. **Resolved:** viewport-aware scrolling is applied.
- Areas of Care, Professional Interests and Related Services are presented as linked patient pathways rather than dead labels.

**UX Problems Found**
- Primary appointment path remains visible through the in-page CTA and persistent Book/Call controls.
- “Explore related pages” remains available above the content so the secondary panel is still discoverable after being moved below the article on mobile.
- The profile now supports the journey: practitioner → relevant care information → booking.

**Accessibility Problems Found**
- Final responsive check found no horizontal page overflow at 320/375/390/414px.

**Recommended Fixes**
- Retain the current common footer/header/action system; avoid page-specific overrides unless clinically necessary.
- Keep desktop navigation sticky/scrollable and mobile navigation after content.
- Keep care/interest links mapped to the most specific approved service or Knowledge Centre destination.
- Add a verified real portrait only when one is available.

**Priority: MEDIUM**

## Healthcare FAQ Hub
**File:** `faqs.html`  
**Page family:** Institution / patient information

**Visual Problems Found**
- Shared footer previously consumed too much vertical space on mobile and varied between legacy templates. **Resolved:** compact common footer treatment applied.
- The related-page/left navigation was visually too dominant before the article at mobile widths. **Resolved:** content now comes first; related navigation follows.

**UI Problems Found**
- Primary navigation, persistent Book/Call tray and footer navigation were checked against the common site system. **Final state:** consistent.
- Desktop side navigation could exceed a short viewport. **Resolved:** viewport-aware scrolling is applied.

**UX Problems Found**
- Primary appointment path remains visible through the in-page CTA and persistent Book/Call controls.
- “Explore related pages” remains available above the content so the secondary panel is still discoverable after being moved below the article on mobile.

**Accessibility Problems Found**
- Final responsive check found no horizontal page overflow at 320/375/390/414px.

**Recommended Fixes**
- Retain the current common footer/header/action system; avoid page-specific overrides unless clinically necessary.
- Keep desktop navigation sticky/scrollable and mobile navigation after content.

**Priority: MEDIUM**

## Questions and concerns deserve a clear pathway.
**File:** `feedback-concerns.html`  
**Page family:** Institution / patient information

**Visual Problems Found**
- Shared footer previously consumed too much vertical space on mobile and varied between legacy templates. **Resolved:** compact common footer treatment applied.
- The related-page/left navigation was visually too dominant before the article at mobile widths. **Resolved:** content now comes first; related navigation follows.

**UI Problems Found**
- Primary navigation, persistent Book/Call tray and footer navigation were checked against the common site system. **Final state:** consistent.
- Desktop side navigation could exceed a short viewport. **Resolved:** viewport-aware scrolling is applied.

**UX Problems Found**
- Primary appointment path remains visible through the in-page CTA and persistent Book/Call controls.
- “Explore related pages” remains available above the content so the secondary panel is still discoverable after being moved below the article on mobile.

**Accessibility Problems Found**
- Final responsive check found no horizontal page overflow at 320/375/390/414px.

**Recommended Fixes**
- Retain the current common footer/header/action system; avoid page-specific overrides unless clinically necessary.
- Keep desktop navigation sticky/scrollable and mobile navigation after content.

**Priority: MEDIUM**

## Fees & Billing
**File:** `fees-billing.html`  
**Page family:** Institution / patient information

**Visual Problems Found**
- Shared footer previously consumed too much vertical space on mobile and varied between legacy templates. **Resolved:** compact common footer treatment applied.
- The related-page/left navigation was visually too dominant before the article at mobile widths. **Resolved:** content now comes first; related navigation follows.

**UI Problems Found**
- Primary navigation, persistent Book/Call tray and footer navigation were checked against the common site system. **Final state:** consistent.
- Desktop side navigation could exceed a short viewport. **Resolved:** viewport-aware scrolling is applied.

**UX Problems Found**
- Primary appointment path remains visible through the in-page CTA and persistent Book/Call controls.
- “Explore related pages” remains available above the content so the secondary panel is still discoverable after being moved below the article on mobile.

**Accessibility Problems Found**
- Final responsive check found no horizontal page overflow at 320/375/390/414px.

**Recommended Fixes**
- Retain the current common footer/header/action system; avoid page-specific overrides unless clinically necessary.
- Keep desktop navigation sticky/scrollable and mobile navigation after content.

**Priority: MEDIUM**

## Care that knows your story.
**File:** `index.html`  
**Page family:** Homepage

**Visual Problems Found**
- Shared footer previously consumed too much vertical space on mobile and varied between legacy templates. **Resolved:** compact common footer treatment applied.
- Supporting update metadata and secondary CTA text were too small. **Resolved:** supporting editorial text has been increased without changing homepage architecture.
- Automated geometry detects clipped supporting-update paragraphs; manual review confirms this is intentional editorial line clamping, not a visible break.

**UI Problems Found**
- Primary navigation, persistent Book/Call tray and footer navigation were checked against the common site system. **Final state:** consistent.
- Hero Book/Call hierarchy remains unchanged; only small-type legibility was refined.

**UX Problems Found**
- Primary appointment path remains visible through the in-page CTA and persistent Book/Call controls.

**Accessibility Problems Found**
- Final responsive check found no horizontal page overflow at 320/375/390/414px.

**Recommended Fixes**
- Retain the current common footer/header/action system; avoid page-specific overrides unless clinically necessary.
- Keep the approved homepage sections and hero composition frozen.

**Priority: MEDIUM**

## Safety is built into everyday systems.
**File:** `infection-prevention-control.html`  
**Page family:** Institution / patient information

**Visual Problems Found**
- Shared footer previously consumed too much vertical space on mobile and varied between legacy templates. **Resolved:** compact common footer treatment applied.
- The related-page/left navigation was visually too dominant before the article at mobile widths. **Resolved:** content now comes first; related navigation follows.

**UI Problems Found**
- Primary navigation, persistent Book/Call tray and footer navigation were checked against the common site system. **Final state:** consistent.
- Desktop side navigation could exceed a short viewport. **Resolved:** viewport-aware scrolling is applied.

**UX Problems Found**
- Primary appointment path remains visible through the in-page CTA and persistent Book/Call controls.
- “Explore related pages” remains available above the content so the secondary panel is still discoverable after being moved below the article on mobile.

**Accessibility Problems Found**
- Final responsive check found no horizontal page overflow at 320/375/390/414px.

**Recommended Fixes**
- Retain the current common footer/header/action system; avoid page-specific overrides unless clinically necessary.
- Keep desktop navigation sticky/scrollable and mobile navigation after content.

**Priority: MEDIUM**

## Join Our Team.
**File:** `join-our-team.html`  
**Page family:** Institution / patient information

**Visual Problems Found**
- Shared footer previously consumed too much vertical space on mobile and varied between legacy templates. **Resolved:** compact common footer treatment applied.
- The related-page/left navigation was visually too dominant before the article at mobile widths. **Resolved:** content now comes first; related navigation follows.

**UI Problems Found**
- Primary navigation, persistent Book/Call tray and footer navigation were checked against the common site system. **Final state:** consistent.
- Desktop side navigation could exceed a short viewport. **Resolved:** viewport-aware scrolling is applied.

**UX Problems Found**
- Primary appointment path remains visible through the in-page CTA and persistent Book/Call controls.
- “Explore related pages” remains available above the content so the secondary panel is still discoverable after being moved below the article on mobile.

**Accessibility Problems Found**
- Final responsive check found no horizontal page overflow at 320/375/390/414px.

**Recommended Fixes**
- Retain the current common footer/header/action system; avoid page-specific overrides unless clinically necessary.
- Keep desktop navigation sticky/scrollable and mobile navigation after content.

**Priority: MEDIUM**

## Anxiety vs Stress: What Is The Difference?
**File:** `knowledge/articles/anxiety-vs-stress-what-is-the-difference.html`  
**Page family:** Knowledge article

**Visual Problems Found**
- Shared footer previously consumed too much vertical space on mobile and varied between legacy templates. **Resolved:** compact common footer treatment applied.
- The related-page/left navigation was visually too dominant before the article at mobile widths. **Resolved:** content now comes first; related navigation follows.
- Knowledge pages have a deliberately quieter editorial hierarchy; the trust/byline layer remains visually subordinate to the article/category title.

**UI Problems Found**
- Primary navigation, persistent Book/Call tray and footer navigation were checked against the common site system. **Final state:** consistent.
- Desktop side navigation could exceed a short viewport. **Resolved:** viewport-aware scrolling is applied.

**UX Problems Found**
- Primary appointment path remains visible through the in-page CTA and persistent Book/Call controls.
- “Explore related pages” remains available above the content so the secondary panel is still discoverable after being moved below the article on mobile.
- Related service, practitioner and booking pathways remain visible so the page does not become a read-and-leave dead end.

**Accessibility Problems Found**
- Final responsive check found no horizontal page overflow at 320/375/390/414px.

**Recommended Fixes**
- Retain the current common footer/header/action system; avoid page-specific overrides unless clinically necessary.
- Keep desktop navigation sticky/scrollable and mobile navigation after content.

**Priority: MEDIUM**

## Childhood Vaccinations Explained
**File:** `knowledge/articles/childhood-vaccinations-explained.html`  
**Page family:** Knowledge article

**Visual Problems Found**
- Shared footer previously consumed too much vertical space on mobile and varied between legacy templates. **Resolved:** compact common footer treatment applied.
- The related-page/left navigation was visually too dominant before the article at mobile widths. **Resolved:** content now comes first; related navigation follows.
- Knowledge pages have a deliberately quieter editorial hierarchy; the trust/byline layer remains visually subordinate to the article/category title.

**UI Problems Found**
- Primary navigation, persistent Book/Call tray and footer navigation were checked against the common site system. **Final state:** consistent.
- Desktop side navigation could exceed a short viewport. **Resolved:** viewport-aware scrolling is applied.

**UX Problems Found**
- Primary appointment path remains visible through the in-page CTA and persistent Book/Call controls.
- “Explore related pages” remains available above the content so the secondary panel is still discoverable after being moved below the article on mobile.
- Related service, practitioner and booking pathways remain visible so the page does not become a read-and-leave dead end.

**Accessibility Problems Found**
- Final responsive check found no horizontal page overflow at 320/375/390/414px.

**Recommended Fixes**
- Retain the current common footer/header/action system; avoid page-specific overrides unless clinically necessary.
- Keep desktop navigation sticky/scrollable and mobile navigation after content.

**Priority: MEDIUM**

## Children's Preventive Healthcare
**File:** `knowledge/articles/childrens-preventive-healthcare.html`  
**Page family:** Knowledge article

**Visual Problems Found**
- Shared footer previously consumed too much vertical space on mobile and varied between legacy templates. **Resolved:** compact common footer treatment applied.
- The related-page/left navigation was visually too dominant before the article at mobile widths. **Resolved:** content now comes first; related navigation follows.
- Knowledge pages have a deliberately quieter editorial hierarchy; the trust/byline layer remains visually subordinate to the article/category title.

**UI Problems Found**
- Primary navigation, persistent Book/Call tray and footer navigation were checked against the common site system. **Final state:** consistent.
- Desktop side navigation could exceed a short viewport. **Resolved:** viewport-aware scrolling is applied.

**UX Problems Found**
- Primary appointment path remains visible through the in-page CTA and persistent Book/Call controls.
- “Explore related pages” remains available above the content so the secondary panel is still discoverable after being moved below the article on mobile.
- Related service, practitioner and booking pathways remain visible so the page does not become a read-and-leave dead end.

**Accessibility Problems Found**
- Final responsive check found no horizontal page overflow at 320/375/390/414px.

**Recommended Fixes**
- Retain the current common footer/header/action system; avoid page-specific overrides unless clinically necessary.
- Keep desktop navigation sticky/scrollable and mobile navigation after content.

**Priority: MEDIUM**

## Common Childhood Illnesses
**File:** `knowledge/articles/common-childhood-illnesses.html`  
**Page family:** Knowledge article

**Visual Problems Found**
- Shared footer previously consumed too much vertical space on mobile and varied between legacy templates. **Resolved:** compact common footer treatment applied.
- The related-page/left navigation was visually too dominant before the article at mobile widths. **Resolved:** content now comes first; related navigation follows.
- Knowledge pages have a deliberately quieter editorial hierarchy; the trust/byline layer remains visually subordinate to the article/category title.

**UI Problems Found**
- Primary navigation, persistent Book/Call tray and footer navigation were checked against the common site system. **Final state:** consistent.
- Desktop side navigation could exceed a short viewport. **Resolved:** viewport-aware scrolling is applied.

**UX Problems Found**
- Primary appointment path remains visible through the in-page CTA and persistent Book/Call controls.
- “Explore related pages” remains available above the content so the secondary panel is still discoverable after being moved below the article on mobile.
- Related service, practitioner and booking pathways remain visible so the page does not become a read-and-leave dead end.

**Accessibility Problems Found**
- Final responsive check found no horizontal page overflow at 320/375/390/414px.

**Recommended Fixes**
- Retain the current common footer/header/action system; avoid page-specific overrides unless clinically necessary.
- Keep desktop navigation sticky/scrollable and mobile navigation after content.

**Priority: MEDIUM**

## Health Assessments Explained
**File:** `knowledge/articles/health-assessments-explained.html`  
**Page family:** Knowledge article

**Visual Problems Found**
- Shared footer previously consumed too much vertical space on mobile and varied between legacy templates. **Resolved:** compact common footer treatment applied.
- The related-page/left navigation was visually too dominant before the article at mobile widths. **Resolved:** content now comes first; related navigation follows.
- Knowledge pages have a deliberately quieter editorial hierarchy; the trust/byline layer remains visually subordinate to the article/category title.

**UI Problems Found**
- Primary navigation, persistent Book/Call tray and footer navigation were checked against the common site system. **Final state:** consistent.
- Desktop side navigation could exceed a short viewport. **Resolved:** viewport-aware scrolling is applied.

**UX Problems Found**
- Primary appointment path remains visible through the in-page CTA and persistent Book/Call controls.
- “Explore related pages” remains available above the content so the secondary panel is still discoverable after being moved below the article on mobile.
- Related service, practitioner and booking pathways remain visible so the page does not become a read-and-leave dead end.

**Accessibility Problems Found**
- Final responsive check found no horizontal page overflow at 320/375/390/414px.

**Recommended Fixes**
- Retain the current common footer/header/action system; avoid page-specific overrides unless clinically necessary.
- Keep desktop navigation sticky/scrollable and mobile navigation after content.

**Priority: MEDIUM**

## Health Checks Every Man Should Consider
**File:** `knowledge/articles/health-checks-every-man-should-consider.html`  
**Page family:** Knowledge article

**Visual Problems Found**
- Shared footer previously consumed too much vertical space on mobile and varied between legacy templates. **Resolved:** compact common footer treatment applied.
- The related-page/left navigation was visually too dominant before the article at mobile widths. **Resolved:** content now comes first; related navigation follows.
- Knowledge pages have a deliberately quieter editorial hierarchy; the trust/byline layer remains visually subordinate to the article/category title.

**UI Problems Found**
- Primary navigation, persistent Book/Call tray and footer navigation were checked against the common site system. **Final state:** consistent.
- Desktop side navigation could exceed a short viewport. **Resolved:** viewport-aware scrolling is applied.

**UX Problems Found**
- Primary appointment path remains visible through the in-page CTA and persistent Book/Call controls.
- “Explore related pages” remains available above the content so the secondary panel is still discoverable after being moved below the article on mobile.
- Related service, practitioner and booking pathways remain visible so the page does not become a read-and-leave dead end.

**Accessibility Problems Found**
- Final responsive check found no horizontal page overflow at 320/375/390/414px.

**Recommended Fixes**
- Retain the current common footer/header/action system; avoid page-specific overrides unless clinically necessary.
- Keep desktop navigation sticky/scrollable and mobile navigation after content.

**Priority: MEDIUM**

## Healthy Ageing For Men
**File:** `knowledge/articles/healthy-ageing-for-men.html`  
**Page family:** Knowledge article

**Visual Problems Found**
- Shared footer previously consumed too much vertical space on mobile and varied between legacy templates. **Resolved:** compact common footer treatment applied.
- The related-page/left navigation was visually too dominant before the article at mobile widths. **Resolved:** content now comes first; related navigation follows.
- Knowledge pages have a deliberately quieter editorial hierarchy; the trust/byline layer remains visually subordinate to the article/category title.

**UI Problems Found**
- Primary navigation, persistent Book/Call tray and footer navigation were checked against the common site system. **Final state:** consistent.
- Desktop side navigation could exceed a short viewport. **Resolved:** viewport-aware scrolling is applied.

**UX Problems Found**
- Primary appointment path remains visible through the in-page CTA and persistent Book/Call controls.
- “Explore related pages” remains available above the content so the secondary panel is still discoverable after being moved below the article on mobile.
- Related service, practitioner and booking pathways remain visible so the page does not become a read-and-leave dead end.

**Accessibility Problems Found**
- Final responsive check found no horizontal page overflow at 320/375/390/414px.

**Recommended Fixes**
- Retain the current common footer/header/action system; avoid page-specific overrides unless clinically necessary.
- Keep desktop navigation sticky/scrollable and mobile navigation after content.

**Priority: MEDIUM**

## Heart Health For Men
**File:** `knowledge/articles/heart-health-for-men.html`  
**Page family:** Knowledge article

**Visual Problems Found**
- Shared footer previously consumed too much vertical space on mobile and varied between legacy templates. **Resolved:** compact common footer treatment applied.
- The related-page/left navigation was visually too dominant before the article at mobile widths. **Resolved:** content now comes first; related navigation follows.
- Knowledge pages have a deliberately quieter editorial hierarchy; the trust/byline layer remains visually subordinate to the article/category title.

**UI Problems Found**
- Primary navigation, persistent Book/Call tray and footer navigation were checked against the common site system. **Final state:** consistent.
- Desktop side navigation could exceed a short viewport. **Resolved:** viewport-aware scrolling is applied.

**UX Problems Found**
- Primary appointment path remains visible through the in-page CTA and persistent Book/Call controls.
- “Explore related pages” remains available above the content so the secondary panel is still discoverable after being moved below the article on mobile.
- Related service, practitioner and booking pathways remain visible so the page does not become a read-and-leave dead end.

**Accessibility Problems Found**
- Final responsive check found no horizontal page overflow at 320/375/390/414px.

**Recommended Fixes**
- Retain the current common footer/header/action system; avoid page-specific overrides unless clinically necessary.
- Keep desktop navigation sticky/scrollable and mobile navigation after content.

**Priority: MEDIUM**

## How Can A GP Support Depression?
**File:** `knowledge/articles/how-can-a-gp-support-depression.html`  
**Page family:** Knowledge article

**Visual Problems Found**
- Shared footer previously consumed too much vertical space on mobile and varied between legacy templates. **Resolved:** compact common footer treatment applied.
- The related-page/left navigation was visually too dominant before the article at mobile widths. **Resolved:** content now comes first; related navigation follows.
- Knowledge pages have a deliberately quieter editorial hierarchy; the trust/byline layer remains visually subordinate to the article/category title.

**UI Problems Found**
- Primary navigation, persistent Book/Call tray and footer navigation were checked against the common site system. **Final state:** consistent.
- Desktop side navigation could exceed a short viewport. **Resolved:** viewport-aware scrolling is applied.

**UX Problems Found**
- Primary appointment path remains visible through the in-page CTA and persistent Book/Call controls.
- “Explore related pages” remains available above the content so the secondary panel is still discoverable after being moved below the article on mobile.
- Related service, practitioner and booking pathways remain visible so the page does not become a read-and-leave dead end.

**Accessibility Problems Found**
- Final responsive check found no horizontal page overflow at 320/375/390/414px.

**Recommended Fixes**
- Retain the current common footer/header/action system; avoid page-specific overrides unless clinically necessary.
- Keep desktop navigation sticky/scrollable and mobile navigation after content.

**Priority: MEDIUM**

## Preparing For Your Child's First GP Appointment
**File:** `knowledge/articles/preparing-for-your-childs-first-gp-appointment.html`  
**Page family:** Knowledge article

**Visual Problems Found**
- Shared footer previously consumed too much vertical space on mobile and varied between legacy templates. **Resolved:** compact common footer treatment applied.
- The related-page/left navigation was visually too dominant before the article at mobile widths. **Resolved:** content now comes first; related navigation follows.
- Knowledge pages have a deliberately quieter editorial hierarchy; the trust/byline layer remains visually subordinate to the article/category title.

**UI Problems Found**
- Primary navigation, persistent Book/Call tray and footer navigation were checked against the common site system. **Final state:** consistent.
- Desktop side navigation could exceed a short viewport. **Resolved:** viewport-aware scrolling is applied.

**UX Problems Found**
- Primary appointment path remains visible through the in-page CTA and persistent Book/Call controls.
- “Explore related pages” remains available above the content so the secondary panel is still discoverable after being moved below the article on mobile.
- Related service, practitioner and booking pathways remain visible so the page does not become a read-and-leave dead end.

**Accessibility Problems Found**
- Final responsive check found no horizontal page overflow at 320/375/390/414px.

**Recommended Fixes**
- Retain the current common footer/header/action system; avoid page-specific overrides unless clinically necessary.
- Keep desktop navigation sticky/scrollable and mobile navigation after content.

**Priority: MEDIUM**

## Preventive Women's Healthcare
**File:** `knowledge/articles/preventive-womens-healthcare.html`  
**Page family:** Knowledge article

**Visual Problems Found**
- Shared footer previously consumed too much vertical space on mobile and varied between legacy templates. **Resolved:** compact common footer treatment applied.
- The related-page/left navigation was visually too dominant before the article at mobile widths. **Resolved:** content now comes first; related navigation follows.
- Knowledge pages have a deliberately quieter editorial hierarchy; the trust/byline layer remains visually subordinate to the article/category title.

**UI Problems Found**
- Primary navigation, persistent Book/Call tray and footer navigation were checked against the common site system. **Final state:** consistent.
- Desktop side navigation could exceed a short viewport. **Resolved:** viewport-aware scrolling is applied.

**UX Problems Found**
- Primary appointment path remains visible through the in-page CTA and persistent Book/Call controls.
- “Explore related pages” remains available above the content so the secondary panel is still discoverable after being moved below the article on mobile.
- Related service, practitioner and booking pathways remain visible so the page does not become a read-and-leave dead end.

**Accessibility Problems Found**
- Final responsive check found no horizontal page overflow at 320/375/390/414px.

**Recommended Fixes**
- Retain the current common footer/header/action system; avoid page-specific overrides unless clinically necessary.
- Keep desktop navigation sticky/scrollable and mobile navigation after content.

**Priority: MEDIUM**

## Protecting Your Skin From The Queensland Sun
**File:** `knowledge/articles/protecting-your-skin-from-the-queensland-sun.html`  
**Page family:** Knowledge article

**Visual Problems Found**
- Shared footer previously consumed too much vertical space on mobile and varied between legacy templates. **Resolved:** compact common footer treatment applied.
- The related-page/left navigation was visually too dominant before the article at mobile widths. **Resolved:** content now comes first; related navigation follows.
- Knowledge pages have a deliberately quieter editorial hierarchy; the trust/byline layer remains visually subordinate to the article/category title.

**UI Problems Found**
- Primary navigation, persistent Book/Call tray and footer navigation were checked against the common site system. **Final state:** consistent.
- Desktop side navigation could exceed a short viewport. **Resolved:** viewport-aware scrolling is applied.

**UX Problems Found**
- Primary appointment path remains visible through the in-page CTA and persistent Book/Call controls.
- “Explore related pages” remains available above the content so the secondary panel is still discoverable after being moved below the article on mobile.
- Related service, practitioner and booking pathways remain visible so the page does not become a read-and-leave dead end.

**Accessibility Problems Found**
- Final responsive check found no horizontal page overflow at 320/375/390/414px.

**Recommended Fixes**
- Retain the current common footer/header/action system; avoid page-specific overrides unless clinically necessary.
- Keep desktop navigation sticky/scrollable and mobile navigation after content.

**Priority: MEDIUM**

## Staying Healthy As You Age
**File:** `knowledge/articles/staying-healthy-as-you-age.html`  
**Page family:** Knowledge article

**Visual Problems Found**
- Shared footer previously consumed too much vertical space on mobile and varied between legacy templates. **Resolved:** compact common footer treatment applied.
- The related-page/left navigation was visually too dominant before the article at mobile widths. **Resolved:** content now comes first; related navigation follows.
- Knowledge pages have a deliberately quieter editorial hierarchy; the trust/byline layer remains visually subordinate to the article/category title.

**UI Problems Found**
- Primary navigation, persistent Book/Call tray and footer navigation were checked against the common site system. **Final state:** consistent.
- Desktop side navigation could exceed a short viewport. **Resolved:** viewport-aware scrolling is applied.

**UX Problems Found**
- Primary appointment path remains visible through the in-page CTA and persistent Book/Call controls.
- “Explore related pages” remains available above the content so the secondary panel is still discoverable after being moved below the article on mobile.
- Related service, practitioner and booking pathways remain visible so the page does not become a read-and-leave dead end.

**Accessibility Problems Found**
- Final responsive check found no horizontal page overflow at 320/375/390/414px.

**Recommended Fixes**
- Retain the current common footer/header/action system; avoid page-specific overrides unless clinically necessary.
- Keep desktop navigation sticky/scrollable and mobile navigation after content.

**Priority: MEDIUM**

## Understanding Menopause
**File:** `knowledge/articles/understanding-menopause.html`  
**Page family:** Knowledge article

**Visual Problems Found**
- Shared footer previously consumed too much vertical space on mobile and varied between legacy templates. **Resolved:** compact common footer treatment applied.
- The related-page/left navigation was visually too dominant before the article at mobile widths. **Resolved:** content now comes first; related navigation follows.
- Knowledge pages have a deliberately quieter editorial hierarchy; the trust/byline layer remains visually subordinate to the article/category title.

**UI Problems Found**
- Primary navigation, persistent Book/Call tray and footer navigation were checked against the common site system. **Final state:** consistent.
- Desktop side navigation could exceed a short viewport. **Resolved:** viewport-aware scrolling is applied.

**UX Problems Found**
- Primary appointment path remains visible through the in-page CTA and persistent Book/Call controls.
- “Explore related pages” remains available above the content so the secondary panel is still discoverable after being moved below the article on mobile.
- Related service, practitioner and booking pathways remain visible so the page does not become a read-and-leave dead end.

**Accessibility Problems Found**
- Final responsive check found no horizontal page overflow at 320/375/390/414px.

**Recommended Fixes**
- Retain the current common footer/header/action system; avoid page-specific overrides unless clinically necessary.
- Keep desktop navigation sticky/scrollable and mobile navigation after content.

**Priority: MEDIUM**

## Understanding Perimenopause
**File:** `knowledge/articles/understanding-perimenopause.html`  
**Page family:** Knowledge article

**Visual Problems Found**
- Shared footer previously consumed too much vertical space on mobile and varied between legacy templates. **Resolved:** compact common footer treatment applied.
- The related-page/left navigation was visually too dominant before the article at mobile widths. **Resolved:** content now comes first; related navigation follows.
- Knowledge pages have a deliberately quieter editorial hierarchy; the trust/byline layer remains visually subordinate to the article/category title.

**UI Problems Found**
- Primary navigation, persistent Book/Call tray and footer navigation were checked against the common site system. **Final state:** consistent.
- Desktop side navigation could exceed a short viewport. **Resolved:** viewport-aware scrolling is applied.

**UX Problems Found**
- Primary appointment path remains visible through the in-page CTA and persistent Book/Call controls.
- “Explore related pages” remains available above the content so the secondary panel is still discoverable after being moved below the article on mobile.
- Related service, practitioner and booking pathways remain visible so the page does not become a read-and-leave dead end.

**Accessibility Problems Found**
- Final responsive check found no horizontal page overflow at 320/375/390/414px.

**Recommended Fixes**
- Retain the current common footer/header/action system; avoid page-specific overrides unless clinically necessary.
- Keep desktop navigation sticky/scrollable and mobile navigation after content.

**Priority: MEDIUM**

## Understanding Prostate Health
**File:** `knowledge/articles/understanding-prostate-health.html`  
**Page family:** Knowledge article

**Visual Problems Found**
- Shared footer previously consumed too much vertical space on mobile and varied between legacy templates. **Resolved:** compact common footer treatment applied.
- The related-page/left navigation was visually too dominant before the article at mobile widths. **Resolved:** content now comes first; related navigation follows.
- Knowledge pages have a deliberately quieter editorial hierarchy; the trust/byline layer remains visually subordinate to the article/category title.

**UI Problems Found**
- Primary navigation, persistent Book/Call tray and footer navigation were checked against the common site system. **Final state:** consistent.
- Desktop side navigation could exceed a short viewport. **Resolved:** viewport-aware scrolling is applied.

**UX Problems Found**
- Primary appointment path remains visible through the in-page CTA and persistent Book/Call controls.
- “Explore related pages” remains available above the content so the secondary panel is still discoverable after being moved below the article on mobile.
- Related service, practitioner and booking pathways remain visible so the page does not become a read-and-leave dead end.

**Accessibility Problems Found**
- Final responsive check found no horizontal page overflow at 320/375/390/414px.

**Recommended Fixes**
- Retain the current common footer/header/action system; avoid page-specific overrides unless clinically necessary.
- Keep desktop navigation sticky/scrollable and mobile navigation after content.

**Priority: MEDIUM**

## Understanding Skin Cancer Risks
**File:** `knowledge/articles/understanding-skin-cancer-risks.html`  
**Page family:** Knowledge article

**Visual Problems Found**
- Shared footer previously consumed too much vertical space on mobile and varied between legacy templates. **Resolved:** compact common footer treatment applied.
- The related-page/left navigation was visually too dominant before the article at mobile widths. **Resolved:** content now comes first; related navigation follows.
- Knowledge pages have a deliberately quieter editorial hierarchy; the trust/byline layer remains visually subordinate to the article/category title.

**UI Problems Found**
- Primary navigation, persistent Book/Call tray and footer navigation were checked against the common site system. **Final state:** consistent.
- Desktop side navigation could exceed a short viewport. **Resolved:** viewport-aware scrolling is applied.

**UX Problems Found**
- Primary appointment path remains visible through the in-page CTA and persistent Book/Call controls.
- “Explore related pages” remains available above the content so the secondary panel is still discoverable after being moved below the article on mobile.
- Related service, practitioner and booking pathways remain visible so the page does not become a read-and-leave dead end.

**Accessibility Problems Found**
- Final responsive check found no horizontal page overflow at 320/375/390/414px.

**Recommended Fixes**
- Retain the current common footer/header/action system; avoid page-specific overrides unless clinically necessary.
- Keep desktop navigation sticky/scrollable and mobile navigation after content.

**Priority: MEDIUM**

## Vaccinations For Adults
**File:** `knowledge/articles/vaccinations-for-adults.html`  
**Page family:** Knowledge article

**Visual Problems Found**
- Shared footer previously consumed too much vertical space on mobile and varied between legacy templates. **Resolved:** compact common footer treatment applied.
- The related-page/left navigation was visually too dominant before the article at mobile widths. **Resolved:** content now comes first; related navigation follows.
- Knowledge pages have a deliberately quieter editorial hierarchy; the trust/byline layer remains visually subordinate to the article/category title.

**UI Problems Found**
- Primary navigation, persistent Book/Call tray and footer navigation were checked against the common site system. **Final state:** consistent.
- Desktop side navigation could exceed a short viewport. **Resolved:** viewport-aware scrolling is applied.

**UX Problems Found**
- Primary appointment path remains visible through the in-page CTA and persistent Book/Call controls.
- “Explore related pages” remains available above the content so the secondary panel is still discoverable after being moved below the article on mobile.
- Related service, practitioner and booking pathways remain visible so the page does not become a read-and-leave dead end.

**Accessibility Problems Found**
- Final responsive check found no horizontal page overflow at 320/375/390/414px.

**Recommended Fixes**
- Retain the current common footer/header/action system; avoid page-specific overrides unless clinically necessary.
- Keep desktop navigation sticky/scrollable and mobile navigation after content.

**Priority: MEDIUM**

## What Happens During A Mental Health Care Plan?
**File:** `knowledge/articles/what-happens-during-a-mental-health-care-plan.html`  
**Page family:** Knowledge article

**Visual Problems Found**
- Shared footer previously consumed too much vertical space on mobile and varied between legacy templates. **Resolved:** compact common footer treatment applied.
- The related-page/left navigation was visually too dominant before the article at mobile widths. **Resolved:** content now comes first; related navigation follows.
- Knowledge pages have a deliberately quieter editorial hierarchy; the trust/byline layer remains visually subordinate to the article/category title.

**UI Problems Found**
- Primary navigation, persistent Book/Call tray and footer navigation were checked against the common site system. **Final state:** consistent.
- Desktop side navigation could exceed a short viewport. **Resolved:** viewport-aware scrolling is applied.

**UX Problems Found**
- Primary appointment path remains visible through the in-page CTA and persistent Book/Call controls.
- “Explore related pages” remains available above the content so the secondary panel is still discoverable after being moved below the article on mobile.
- Related service, practitioner and booking pathways remain visible so the page does not become a read-and-leave dead end.

**Accessibility Problems Found**
- Final responsive check found no horizontal page overflow at 320/375/390/414px.

**Recommended Fixes**
- Retain the current common footer/header/action system; avoid page-specific overrides unless clinically necessary.
- Keep desktop navigation sticky/scrollable and mobile navigation after content.

**Priority: MEDIUM**

## What Is Preventive Healthcare?
**File:** `knowledge/articles/what-is-preventive-healthcare.html`  
**Page family:** Knowledge article

**Visual Problems Found**
- Shared footer previously consumed too much vertical space on mobile and varied between legacy templates. **Resolved:** compact common footer treatment applied.
- The related-page/left navigation was visually too dominant before the article at mobile widths. **Resolved:** content now comes first; related navigation follows.
- Knowledge pages have a deliberately quieter editorial hierarchy; the trust/byline layer remains visually subordinate to the article/category title.

**UI Problems Found**
- Primary navigation, persistent Book/Call tray and footer navigation were checked against the common site system. **Final state:** consistent.
- Desktop side navigation could exceed a short viewport. **Resolved:** viewport-aware scrolling is applied.

**UX Problems Found**
- Primary appointment path remains visible through the in-page CTA and persistent Book/Call controls.
- “Explore related pages” remains available above the content so the secondary panel is still discoverable after being moved below the article on mobile.
- Related service, practitioner and booking pathways remain visible so the page does not become a read-and-leave dead end.

**Accessibility Problems Found**
- Final responsive check found no horizontal page overflow at 320/375/390/414px.

**Recommended Fixes**
- Retain the current common footer/header/action system; avoid page-specific overrides unless clinically necessary.
- Keep desktop navigation sticky/scrollable and mobile navigation after content.

**Priority: MEDIUM**

## When Should I Be Concerned About A Fever?
**File:** `knowledge/articles/when-should-i-be-concerned-about-a-fever.html`  
**Page family:** Knowledge article

**Visual Problems Found**
- Shared footer previously consumed too much vertical space on mobile and varied between legacy templates. **Resolved:** compact common footer treatment applied.
- The related-page/left navigation was visually too dominant before the article at mobile widths. **Resolved:** content now comes first; related navigation follows.
- Knowledge pages have a deliberately quieter editorial hierarchy; the trust/byline layer remains visually subordinate to the article/category title.

**UI Problems Found**
- Primary navigation, persistent Book/Call tray and footer navigation were checked against the common site system. **Final state:** consistent.
- Desktop side navigation could exceed a short viewport. **Resolved:** viewport-aware scrolling is applied.

**UX Problems Found**
- Primary appointment path remains visible through the in-page CTA and persistent Book/Call controls.
- “Explore related pages” remains available above the content so the secondary panel is still discoverable after being moved below the article on mobile.
- Related service, practitioner and booking pathways remain visible so the page does not become a read-and-leave dead end.

**Accessibility Problems Found**
- Final responsive check found no horizontal page overflow at 320/375/390/414px.

**Recommended Fixes**
- Retain the current common footer/header/action system; avoid page-specific overrides unless clinically necessary.
- Keep desktop navigation sticky/scrollable and mobile navigation after content.

**Priority: MEDIUM**

## When Should I Book A Skin Check?
**File:** `knowledge/articles/when-should-i-book-a-skin-check.html`  
**Page family:** Knowledge article

**Visual Problems Found**
- Shared footer previously consumed too much vertical space on mobile and varied between legacy templates. **Resolved:** compact common footer treatment applied.
- The related-page/left navigation was visually too dominant before the article at mobile widths. **Resolved:** content now comes first; related navigation follows.
- Knowledge pages have a deliberately quieter editorial hierarchy; the trust/byline layer remains visually subordinate to the article/category title.

**UI Problems Found**
- Primary navigation, persistent Book/Call tray and footer navigation were checked against the common site system. **Final state:** consistent.
- Desktop side navigation could exceed a short viewport. **Resolved:** viewport-aware scrolling is applied.

**UX Problems Found**
- Primary appointment path remains visible through the in-page CTA and persistent Book/Call controls.
- “Explore related pages” remains available above the content so the secondary panel is still discoverable after being moved below the article on mobile.
- Related service, practitioner and booking pathways remain visible so the page does not become a read-and-leave dead end.

**Accessibility Problems Found**
- Final responsive check found no horizontal page overflow at 320/375/390/414px.

**Recommended Fixes**
- Retain the current common footer/header/action system; avoid page-specific overrides unless clinically necessary.
- Keep desktop navigation sticky/scrollable and mobile navigation after content.

**Priority: MEDIUM**

## When Should I Have A Cervical Screening Test?
**File:** `knowledge/articles/when-should-i-have-a-cervical-screening-test.html`  
**Page family:** Knowledge article

**Visual Problems Found**
- Shared footer previously consumed too much vertical space on mobile and varied between legacy templates. **Resolved:** compact common footer treatment applied.
- The related-page/left navigation was visually too dominant before the article at mobile widths. **Resolved:** content now comes first; related navigation follows.
- Knowledge pages have a deliberately quieter editorial hierarchy; the trust/byline layer remains visually subordinate to the article/category title.

**UI Problems Found**
- Primary navigation, persistent Book/Call tray and footer navigation were checked against the common site system. **Final state:** consistent.
- Desktop side navigation could exceed a short viewport. **Resolved:** viewport-aware scrolling is applied.

**UX Problems Found**
- Primary appointment path remains visible through the in-page CTA and persistent Book/Call controls.
- “Explore related pages” remains available above the content so the secondary panel is still discoverable after being moved below the article on mobile.
- Related service, practitioner and booking pathways remain visible so the page does not become a read-and-leave dead end.

**Accessibility Problems Found**
- Final responsive check found no horizontal page overflow at 320/375/390/414px.

**Recommended Fixes**
- Retain the current common footer/header/action system; avoid page-specific overrides unless clinically necessary.
- Keep desktop navigation sticky/scrollable and mobile navigation after content.

**Priority: MEDIUM**

## When Should I Seek Help For Burnout?
**File:** `knowledge/articles/when-should-i-seek-help-for-burnout.html`  
**Page family:** Knowledge article

**Visual Problems Found**
- Shared footer previously consumed too much vertical space on mobile and varied between legacy templates. **Resolved:** compact common footer treatment applied.
- The related-page/left navigation was visually too dominant before the article at mobile widths. **Resolved:** content now comes first; related navigation follows.
- Knowledge pages have a deliberately quieter editorial hierarchy; the trust/byline layer remains visually subordinate to the article/category title.

**UI Problems Found**
- Primary navigation, persistent Book/Call tray and footer navigation were checked against the common site system. **Final state:** consistent.
- Desktop side navigation could exceed a short viewport. **Resolved:** viewport-aware scrolling is applied.

**UX Problems Found**
- Primary appointment path remains visible through the in-page CTA and persistent Book/Call controls.
- “Explore related pages” remains available above the content so the secondary panel is still discoverable after being moved below the article on mobile.
- Related service, practitioner and booking pathways remain visible so the page does not become a read-and-leave dead end.

**Accessibility Problems Found**
- Final responsive check found no horizontal page overflow at 320/375/390/414px.

**Recommended Fixes**
- Retain the current common footer/header/action system; avoid page-specific overrides unless clinically necessary.
- Keep desktop navigation sticky/scrollable and mobile navigation after content.

**Priority: MEDIUM**

## When Should I Speak To A GP About Anxiety?
**File:** `knowledge/articles/when-should-i-speak-to-a-gp-about-anxiety.html`  
**Page family:** Knowledge article

**Visual Problems Found**
- Shared footer previously consumed too much vertical space on mobile and varied between legacy templates. **Resolved:** compact common footer treatment applied.
- The related-page/left navigation was visually too dominant before the article at mobile widths. **Resolved:** content now comes first; related navigation follows.
- Knowledge pages have a deliberately quieter editorial hierarchy; the trust/byline layer remains visually subordinate to the article/category title.

**UI Problems Found**
- Primary navigation, persistent Book/Call tray and footer navigation were checked against the common site system. **Final state:** consistent.
- Desktop side navigation could exceed a short viewport. **Resolved:** viewport-aware scrolling is applied.

**UX Problems Found**
- Primary appointment path remains visible through the in-page CTA and persistent Book/Call controls.
- “Explore related pages” remains available above the content so the secondary panel is still discoverable after being moved below the article on mobile.
- Related service, practitioner and booking pathways remain visible so the page does not become a read-and-leave dead end.

**Accessibility Problems Found**
- Final responsive check found no horizontal page overflow at 320/375/390/414px.

**Recommended Fixes**
- Retain the current common footer/header/action system; avoid page-specific overrides unless clinically necessary.
- Keep desktop navigation sticky/scrollable and mobile navigation after content.

**Priority: MEDIUM**

## Why Preventive Healthcare Matters
**File:** `knowledge/articles/why-preventive-healthcare-matters.html`  
**Page family:** Knowledge article

**Visual Problems Found**
- Shared footer previously consumed too much vertical space on mobile and varied between legacy templates. **Resolved:** compact common footer treatment applied.
- The related-page/left navigation was visually too dominant before the article at mobile widths. **Resolved:** content now comes first; related navigation follows.
- Knowledge pages have a deliberately quieter editorial hierarchy; the trust/byline layer remains visually subordinate to the article/category title.

**UI Problems Found**
- Primary navigation, persistent Book/Call tray and footer navigation were checked against the common site system. **Final state:** consistent.
- Desktop side navigation could exceed a short viewport. **Resolved:** viewport-aware scrolling is applied.

**UX Problems Found**
- Primary appointment path remains visible through the in-page CTA and persistent Book/Call controls.
- “Explore related pages” remains available above the content so the secondary panel is still discoverable after being moved below the article on mobile.
- Related service, practitioner and booking pathways remain visible so the page does not become a read-and-leave dead end.

**Accessibility Problems Found**
- Final responsive check found no horizontal page overflow at 320/375/390/414px.

**Recommended Fixes**
- Retain the current common footer/header/action system; avoid page-specific overrides unless clinically necessary.
- Keep desktop navigation sticky/scrollable and mobile navigation after content.

**Priority: MEDIUM**

## Why Regular Check-Ups Matter
**File:** `knowledge/articles/why-regular-check-ups-matter.html`  
**Page family:** Knowledge article

**Visual Problems Found**
- Shared footer previously consumed too much vertical space on mobile and varied between legacy templates. **Resolved:** compact common footer treatment applied.
- The related-page/left navigation was visually too dominant before the article at mobile widths. **Resolved:** content now comes first; related navigation follows.
- Knowledge pages have a deliberately quieter editorial hierarchy; the trust/byline layer remains visually subordinate to the article/category title.

**UI Problems Found**
- Primary navigation, persistent Book/Call tray and footer navigation were checked against the common site system. **Final state:** consistent.
- Desktop side navigation could exceed a short viewport. **Resolved:** viewport-aware scrolling is applied.

**UX Problems Found**
- Primary appointment path remains visible through the in-page CTA and persistent Book/Call controls.
- “Explore related pages” remains available above the content so the secondary panel is still discoverable after being moved below the article on mobile.
- Related service, practitioner and booking pathways remain visible so the page does not become a read-and-leave dead end.

**Accessibility Problems Found**
- Final responsive check found no horizontal page overflow at 320/375/390/414px.

**Recommended Fixes**
- Retain the current common footer/header/action system; avoid page-specific overrides unless clinically necessary.
- Keep desktop navigation sticky/scrollable and mobile navigation after content.

**Priority: MEDIUM**

## Why Skin Checks Matter In Australia
**File:** `knowledge/articles/why-skin-checks-matter-in-australia.html`  
**Page family:** Knowledge article

**Visual Problems Found**
- Shared footer previously consumed too much vertical space on mobile and varied between legacy templates. **Resolved:** compact common footer treatment applied.
- The related-page/left navigation was visually too dominant before the article at mobile widths. **Resolved:** content now comes first; related navigation follows.
- Knowledge pages have a deliberately quieter editorial hierarchy; the trust/byline layer remains visually subordinate to the article/category title.

**UI Problems Found**
- Primary navigation, persistent Book/Call tray and footer navigation were checked against the common site system. **Final state:** consistent.
- Desktop side navigation could exceed a short viewport. **Resolved:** viewport-aware scrolling is applied.

**UX Problems Found**
- Primary appointment path remains visible through the in-page CTA and persistent Book/Call controls.
- “Explore related pages” remains available above the content so the secondary panel is still discoverable after being moved below the article on mobile.
- Related service, practitioner and booking pathways remain visible so the page does not become a read-and-leave dead end.

**Accessibility Problems Found**
- Final responsive check found no horizontal page overflow at 320/375/390/414px.

**Recommended Fixes**
- Retain the current common footer/header/action system; avoid page-specific overrides unless clinically necessary.
- Keep desktop navigation sticky/scrollable and mobile navigation after content.

**Priority: MEDIUM**

## Women's Health Checks At Different Stages Of Life
**File:** `knowledge/articles/womens-health-checks-at-different-stages-of-life.html`  
**Page family:** Knowledge article

**Visual Problems Found**
- Shared footer previously consumed too much vertical space on mobile and varied between legacy templates. **Resolved:** compact common footer treatment applied.
- The related-page/left navigation was visually too dominant before the article at mobile widths. **Resolved:** content now comes first; related navigation follows.
- Knowledge pages have a deliberately quieter editorial hierarchy; the trust/byline layer remains visually subordinate to the article/category title.

**UI Problems Found**
- Primary navigation, persistent Book/Call tray and footer navigation were checked against the common site system. **Final state:** consistent.
- Desktop side navigation could exceed a short viewport. **Resolved:** viewport-aware scrolling is applied.

**UX Problems Found**
- Primary appointment path remains visible through the in-page CTA and persistent Book/Call controls.
- “Explore related pages” remains available above the content so the secondary panel is still discoverable after being moved below the article on mobile.
- Related service, practitioner and booking pathways remain visible so the page does not become a read-and-leave dead end.

**Accessibility Problems Found**
- Final responsive check found no horizontal page overflow at 320/375/390/414px.

**Recommended Fixes**
- Retain the current common footer/header/action system; avoid page-specific overrides unless clinically necessary.
- Keep desktop navigation sticky/scrollable and mobile navigation after content.

**Priority: MEDIUM**

## Children's Health
**File:** `knowledge/childrens-health.html`  
**Page family:** Knowledge Centre

**Visual Problems Found**
- Shared footer previously consumed too much vertical space on mobile and varied between legacy templates. **Resolved:** compact common footer treatment applied.
- The related-page/left navigation was visually too dominant before the article at mobile widths. **Resolved:** content now comes first; related navigation follows.
- Knowledge pages have a deliberately quieter editorial hierarchy; the trust/byline layer remains visually subordinate to the article/category title.

**UI Problems Found**
- Primary navigation, persistent Book/Call tray and footer navigation were checked against the common site system. **Final state:** consistent.
- Desktop side navigation could exceed a short viewport. **Resolved:** viewport-aware scrolling is applied.

**UX Problems Found**
- Primary appointment path remains visible through the in-page CTA and persistent Book/Call controls.
- “Explore related pages” remains available above the content so the secondary panel is still discoverable after being moved below the article on mobile.
- Related service, practitioner and booking pathways remain visible so the page does not become a read-and-leave dead end.

**Accessibility Problems Found**
- Final responsive check found no horizontal page overflow at 320/375/390/414px.

**Recommended Fixes**
- Retain the current common footer/header/action system; avoid page-specific overrides unless clinically necessary.
- Keep desktop navigation sticky/scrollable and mobile navigation after content.

**Priority: MEDIUM**

## Chronic Disease Management
**File:** `knowledge/chronic-disease-management.html`  
**Page family:** Knowledge Centre

**Visual Problems Found**
- Shared footer previously consumed too much vertical space on mobile and varied between legacy templates. **Resolved:** compact common footer treatment applied.
- The related-page/left navigation was visually too dominant before the article at mobile widths. **Resolved:** content now comes first; related navigation follows.
- Knowledge pages have a deliberately quieter editorial hierarchy; the trust/byline layer remains visually subordinate to the article/category title.

**UI Problems Found**
- Primary navigation, persistent Book/Call tray and footer navigation were checked against the common site system. **Final state:** consistent.
- Desktop side navigation could exceed a short viewport. **Resolved:** viewport-aware scrolling is applied.

**UX Problems Found**
- Primary appointment path remains visible through the in-page CTA and persistent Book/Call controls.
- “Explore related pages” remains available above the content so the secondary panel is still discoverable after being moved below the article on mobile.
- Related service, practitioner and booking pathways remain visible so the page does not become a read-and-leave dead end.

**Accessibility Problems Found**
- Final responsive check found no horizontal page overflow at 320/375/390/414px.

**Recommended Fixes**
- Retain the current common footer/header/action system; avoid page-specific overrides unless clinically necessary.
- Keep desktop navigation sticky/scrollable and mobile navigation after content.

**Priority: MEDIUM**

## Healthy Ageing
**File:** `knowledge/healthy-ageing.html`  
**Page family:** Knowledge Centre

**Visual Problems Found**
- Shared footer previously consumed too much vertical space on mobile and varied between legacy templates. **Resolved:** compact common footer treatment applied.
- The related-page/left navigation was visually too dominant before the article at mobile widths. **Resolved:** content now comes first; related navigation follows.
- Knowledge pages have a deliberately quieter editorial hierarchy; the trust/byline layer remains visually subordinate to the article/category title.

**UI Problems Found**
- Primary navigation, persistent Book/Call tray and footer navigation were checked against the common site system. **Final state:** consistent.
- Desktop side navigation could exceed a short viewport. **Resolved:** viewport-aware scrolling is applied.

**UX Problems Found**
- Primary appointment path remains visible through the in-page CTA and persistent Book/Call controls.
- “Explore related pages” remains available above the content so the secondary panel is still discoverable after being moved below the article on mobile.
- Related service, practitioner and booking pathways remain visible so the page does not become a read-and-leave dead end.

**Accessibility Problems Found**
- Final responsive check found no horizontal page overflow at 320/375/390/414px.

**Recommended Fixes**
- Retain the current common footer/header/action system; avoid page-specific overrides unless clinically necessary.
- Keep desktop navigation sticky/scrollable and mobile navigation after content.

**Priority: MEDIUM**

## Understand your health. Know what to do next.
**File:** `knowledge/index.html`  
**Page family:** Knowledge Centre

**Visual Problems Found**
- Shared footer previously consumed too much vertical space on mobile and varied between legacy templates. **Resolved:** compact common footer treatment applied.
- The related-page/left navigation was visually too dominant before the article at mobile widths. **Resolved:** content now comes first; related navigation follows.
- Knowledge pages have a deliberately quieter editorial hierarchy; the trust/byline layer remains visually subordinate to the article/category title.

**UI Problems Found**
- Primary navigation, persistent Book/Call tray and footer navigation were checked against the common site system. **Final state:** consistent.
- Desktop side navigation could exceed a short viewport. **Resolved:** viewport-aware scrolling is applied.

**UX Problems Found**
- Primary appointment path remains visible through the in-page CTA and persistent Book/Call controls.
- “Explore related pages” remains available above the content so the secondary panel is still discoverable after being moved below the article on mobile.
- Related service, practitioner and booking pathways remain visible so the page does not become a read-and-leave dead end.

**Accessibility Problems Found**
- Final responsive check found no horizontal page overflow at 320/375/390/414px.

**Recommended Fixes**
- Retain the current common footer/header/action system; avoid page-specific overrides unless clinically necessary.
- Keep desktop navigation sticky/scrollable and mobile navigation after content.

**Priority: MEDIUM**

## Men's Health
**File:** `knowledge/mens-health.html`  
**Page family:** Knowledge Centre

**Visual Problems Found**
- Shared footer previously consumed too much vertical space on mobile and varied between legacy templates. **Resolved:** compact common footer treatment applied.
- The related-page/left navigation was visually too dominant before the article at mobile widths. **Resolved:** content now comes first; related navigation follows.
- Knowledge pages have a deliberately quieter editorial hierarchy; the trust/byline layer remains visually subordinate to the article/category title.

**UI Problems Found**
- Primary navigation, persistent Book/Call tray and footer navigation were checked against the common site system. **Final state:** consistent.
- Desktop side navigation could exceed a short viewport. **Resolved:** viewport-aware scrolling is applied.

**UX Problems Found**
- Primary appointment path remains visible through the in-page CTA and persistent Book/Call controls.
- “Explore related pages” remains available above the content so the secondary panel is still discoverable after being moved below the article on mobile.
- Related service, practitioner and booking pathways remain visible so the page does not become a read-and-leave dead end.

**Accessibility Problems Found**
- Final responsive check found no horizontal page overflow at 320/375/390/414px.

**Recommended Fixes**
- Retain the current common footer/header/action system; avoid page-specific overrides unless clinically necessary.
- Keep desktop navigation sticky/scrollable and mobile navigation after content.

**Priority: MEDIUM**

## Mental Health
**File:** `knowledge/mental-health.html`  
**Page family:** Knowledge Centre

**Visual Problems Found**
- Shared footer previously consumed too much vertical space on mobile and varied between legacy templates. **Resolved:** compact common footer treatment applied.
- The related-page/left navigation was visually too dominant before the article at mobile widths. **Resolved:** content now comes first; related navigation follows.
- Knowledge pages have a deliberately quieter editorial hierarchy; the trust/byline layer remains visually subordinate to the article/category title.

**UI Problems Found**
- Primary navigation, persistent Book/Call tray and footer navigation were checked against the common site system. **Final state:** consistent.
- Desktop side navigation could exceed a short viewport. **Resolved:** viewport-aware scrolling is applied.

**UX Problems Found**
- Primary appointment path remains visible through the in-page CTA and persistent Book/Call controls.
- “Explore related pages” remains available above the content so the secondary panel is still discoverable after being moved below the article on mobile.
- Related service, practitioner and booking pathways remain visible so the page does not become a read-and-leave dead end.

**Accessibility Problems Found**
- Final responsive check found no horizontal page overflow at 320/375/390/414px.

**Recommended Fixes**
- Retain the current common footer/header/action system; avoid page-specific overrides unless clinically necessary.
- Keep desktop navigation sticky/scrollable and mobile navigation after content.

**Priority: MEDIUM**

## Preventive Healthcare
**File:** `knowledge/preventive-healthcare.html`  
**Page family:** Knowledge Centre

**Visual Problems Found**
- Shared footer previously consumed too much vertical space on mobile and varied between legacy templates. **Resolved:** compact common footer treatment applied.
- The related-page/left navigation was visually too dominant before the article at mobile widths. **Resolved:** content now comes first; related navigation follows.
- Knowledge pages have a deliberately quieter editorial hierarchy; the trust/byline layer remains visually subordinate to the article/category title.

**UI Problems Found**
- Primary navigation, persistent Book/Call tray and footer navigation were checked against the common site system. **Final state:** consistent.
- Desktop side navigation could exceed a short viewport. **Resolved:** viewport-aware scrolling is applied.

**UX Problems Found**
- Primary appointment path remains visible through the in-page CTA and persistent Book/Call controls.
- “Explore related pages” remains available above the content so the secondary panel is still discoverable after being moved below the article on mobile.
- Related service, practitioner and booking pathways remain visible so the page does not become a read-and-leave dead end.

**Accessibility Problems Found**
- Final responsive check found no horizontal page overflow at 320/375/390/414px.

**Recommended Fixes**
- Retain the current common footer/header/action system; avoid page-specific overrides unless clinically necessary.
- Keep desktop navigation sticky/scrollable and mobile navigation after content.

**Priority: MEDIUM**

## Skin Health & Skin Cancer
**File:** `knowledge/skin-health-skin-cancer.html`  
**Page family:** Knowledge Centre

**Visual Problems Found**
- Shared footer previously consumed too much vertical space on mobile and varied between legacy templates. **Resolved:** compact common footer treatment applied.
- The related-page/left navigation was visually too dominant before the article at mobile widths. **Resolved:** content now comes first; related navigation follows.
- Knowledge pages have a deliberately quieter editorial hierarchy; the trust/byline layer remains visually subordinate to the article/category title.

**UI Problems Found**
- Primary navigation, persistent Book/Call tray and footer navigation were checked against the common site system. **Final state:** consistent.
- Desktop side navigation could exceed a short viewport. **Resolved:** viewport-aware scrolling is applied.

**UX Problems Found**
- Primary appointment path remains visible through the in-page CTA and persistent Book/Call controls.
- “Explore related pages” remains available above the content so the secondary panel is still discoverable after being moved below the article on mobile.
- Related service, practitioner and booking pathways remain visible so the page does not become a read-and-leave dead end.

**Accessibility Problems Found**
- Final responsive check found no horizontal page overflow at 320/375/390/414px.

**Recommended Fixes**
- Retain the current common footer/header/action system; avoid page-specific overrides unless clinically necessary.
- Keep desktop navigation sticky/scrollable and mobile navigation after content.

**Priority: MEDIUM**

## Telehealth & Access To Care
**File:** `knowledge/telehealth-access-to-care.html`  
**Page family:** Knowledge Centre

**Visual Problems Found**
- Shared footer previously consumed too much vertical space on mobile and varied between legacy templates. **Resolved:** compact common footer treatment applied.
- The related-page/left navigation was visually too dominant before the article at mobile widths. **Resolved:** content now comes first; related navigation follows.
- Knowledge pages have a deliberately quieter editorial hierarchy; the trust/byline layer remains visually subordinate to the article/category title.

**UI Problems Found**
- Primary navigation, persistent Book/Call tray and footer navigation were checked against the common site system. **Final state:** consistent.
- Desktop side navigation could exceed a short viewport. **Resolved:** viewport-aware scrolling is applied.

**UX Problems Found**
- Primary appointment path remains visible through the in-page CTA and persistent Book/Call controls.
- “Explore related pages” remains available above the content so the secondary panel is still discoverable after being moved below the article on mobile.
- Related service, practitioner and booking pathways remain visible so the page does not become a read-and-leave dead end.

**Accessibility Problems Found**
- Final responsive check found no horizontal page overflow at 320/375/390/414px.

**Recommended Fixes**
- Retain the current common footer/header/action system; avoid page-specific overrides unless clinically necessary.
- Keep desktop navigation sticky/scrollable and mobile navigation after content.

**Priority: MEDIUM**

## Vaccinations
**File:** `knowledge/vaccinations.html`  
**Page family:** Knowledge Centre

**Visual Problems Found**
- Shared footer previously consumed too much vertical space on mobile and varied between legacy templates. **Resolved:** compact common footer treatment applied.
- The related-page/left navigation was visually too dominant before the article at mobile widths. **Resolved:** content now comes first; related navigation follows.
- Knowledge pages have a deliberately quieter editorial hierarchy; the trust/byline layer remains visually subordinate to the article/category title.

**UI Problems Found**
- Primary navigation, persistent Book/Call tray and footer navigation were checked against the common site system. **Final state:** consistent.
- Desktop side navigation could exceed a short viewport. **Resolved:** viewport-aware scrolling is applied.

**UX Problems Found**
- Primary appointment path remains visible through the in-page CTA and persistent Book/Call controls.
- “Explore related pages” remains available above the content so the secondary panel is still discoverable after being moved below the article on mobile.
- Related service, practitioner and booking pathways remain visible so the page does not become a read-and-leave dead end.

**Accessibility Problems Found**
- Final responsive check found no horizontal page overflow at 320/375/390/414px.

**Recommended Fixes**
- Retain the current common footer/header/action system; avoid page-specific overrides unless clinically necessary.
- Keep desktop navigation sticky/scrollable and mobile navigation after content.

**Priority: MEDIUM**

## Women's Health
**File:** `knowledge/womens-health.html`  
**Page family:** Knowledge Centre

**Visual Problems Found**
- Shared footer previously consumed too much vertical space on mobile and varied between legacy templates. **Resolved:** compact common footer treatment applied.
- The related-page/left navigation was visually too dominant before the article at mobile widths. **Resolved:** content now comes first; related navigation follows.
- Knowledge pages have a deliberately quieter editorial hierarchy; the trust/byline layer remains visually subordinate to the article/category title.

**UI Problems Found**
- Primary navigation, persistent Book/Call tray and footer navigation were checked against the common site system. **Final state:** consistent.
- Desktop side navigation could exceed a short viewport. **Resolved:** viewport-aware scrolling is applied.

**UX Problems Found**
- Primary appointment path remains visible through the in-page CTA and persistent Book/Call controls.
- “Explore related pages” remains available above the content so the secondary panel is still discoverable after being moved below the article on mobile.
- Related service, practitioner and booking pathways remain visible so the page does not become a read-and-leave dead end.

**Accessibility Problems Found**
- Final responsive check found no horizontal page overflow at 320/375/390/414px.

**Recommended Fixes**
- Retain the current common footer/header/action system; avoid page-specific overrides unless clinically necessary.
- Keep desktop navigation sticky/scrollable and mobile navigation after content.

**Priority: MEDIUM**

## Healthcare connected to Brisbane’s inner south.
**File:** `local-healthcare-access.html`  
**Page family:** Institution / patient information

**Visual Problems Found**
- Shared footer previously consumed too much vertical space on mobile and varied between legacy templates. **Resolved:** compact common footer treatment applied.
- The related-page/left navigation was visually too dominant before the article at mobile widths. **Resolved:** content now comes first; related navigation follows.

**UI Problems Found**
- Primary navigation, persistent Book/Call tray and footer navigation were checked against the common site system. **Final state:** consistent.
- Desktop side navigation could exceed a short viewport. **Resolved:** viewport-aware scrolling is applied.

**UX Problems Found**
- Primary appointment path remains visible through the in-page CTA and persistent Book/Call controls.
- “Explore related pages” remains available above the content so the secondary panel is still discoverable after being moved below the article on mobile.

**Accessibility Problems Found**
- Final responsive check found no horizontal page overflow at 320/375/390/414px.

**Recommended Fixes**
- Retain the current common footer/header/action system; avoid page-specific overrides unless clinically necessary.
- Keep desktop navigation sticky/scrollable and mobile navigation after content.

**Priority: MEDIUM**

## Community healthcare across Brisbane.
**File:** `medical-centre-network.html`  
**Page family:** Medical Centre Network

**Visual Problems Found**
- Shared footer previously consumed too much vertical space on mobile and varied between legacy templates. **Resolved:** compact common footer treatment applied.
- The related-page/left navigation was visually too dominant before the article at mobile widths. **Resolved:** content now comes first; related navigation follows.

**UI Problems Found**
- Primary navigation, persistent Book/Call tray and footer navigation were checked against the common site system. **Final state:** consistent.
- Desktop side navigation could exceed a short viewport. **Resolved:** viewport-aware scrolling is applied.
- Location action pills were previously undersized. **Resolved:** minimum target height is now 44px.

**UX Problems Found**
- Primary appointment path remains visible through the in-page CTA and persistent Book/Call controls.
- “Explore related pages” remains available above the content so the secondary panel is still discoverable after being moved below the article on mobile.
- Clinic cards remain one-column on mobile to protect scanability and prevent cramped booking/website actions.

**Accessibility Problems Found**
- Final responsive check found no horizontal page overflow at 320/375/390/414px.

**Recommended Fixes**
- Retain the current common footer/header/action system; avoid page-specific overrides unless clinically necessary.
- Keep desktop navigation sticky/scrollable and mobile navigation after content.

**Priority: MEDIUM**

## Learning should never come before patient choice.
**File:** `medical-students.html`  
**Page family:** Institution / patient information

**Visual Problems Found**
- Shared footer previously consumed too much vertical space on mobile and varied between legacy templates. **Resolved:** compact common footer treatment applied.
- The related-page/left navigation was visually too dominant before the article at mobile widths. **Resolved:** content now comes first; related navigation follows.

**UI Problems Found**
- Primary navigation, persistent Book/Call tray and footer navigation were checked against the common site system. **Final state:** consistent.
- Desktop side navigation could exceed a short viewport. **Resolved:** viewport-aware scrolling is applied.

**UX Problems Found**
- Primary appointment path remains visible through the in-page CTA and persistent Book/Call controls.
- “Explore related pages” remains available above the content so the secondary panel is still discoverable after being moved below the article on mobile.

**Accessibility Problems Found**
- Final responsive check found no horizontal page overflow at 320/375/390/414px.

**Recommended Fixes**
- Retain the current common footer/header/action system; avoid page-specific overrides unless clinically necessary.
- Keep desktop navigation sticky/scrollable and mobile navigation after content.

**Priority: MEDIUM**

## Medicare Exclusions
**File:** `medicare-exclusions.html`  
**Page family:** Institution / patient information

**Visual Problems Found**
- Shared footer previously consumed too much vertical space on mobile and varied between legacy templates. **Resolved:** compact common footer treatment applied.
- The related-page/left navigation was visually too dominant before the article at mobile widths. **Resolved:** content now comes first; related navigation follows.

**UI Problems Found**
- Primary navigation, persistent Book/Call tray and footer navigation were checked against the common site system. **Final state:** consistent.
- Desktop side navigation could exceed a short viewport. **Resolved:** viewport-aware scrolling is applied.

**UX Problems Found**
- Primary appointment path remains visible through the in-page CTA and persistent Book/Call controls.
- “Explore related pages” remains available above the content so the secondary panel is still discoverable after being moved below the article on mobile.

**Accessibility Problems Found**
- Final responsive check found no horizontal page overflow at 320/375/390/414px.

**Recommended Fixes**
- Retain the current common footer/header/action system; avoid page-specific overrides unless clinically necessary.
- Keep desktop navigation sticky/scrollable and mobile navigation after content.

**Priority: MEDIUM**

## Medicare
**File:** `medicare.html`  
**Page family:** Institution / patient information

**Visual Problems Found**
- Shared footer previously consumed too much vertical space on mobile and varied between legacy templates. **Resolved:** compact common footer treatment applied.
- The related-page/left navigation was visually too dominant before the article at mobile widths. **Resolved:** content now comes first; related navigation follows.

**UI Problems Found**
- Primary navigation, persistent Book/Call tray and footer navigation were checked against the common site system. **Final state:** consistent.
- Desktop side navigation could exceed a short viewport. **Resolved:** viewport-aware scrolling is applied.

**UX Problems Found**
- Primary appointment path remains visible through the in-page CTA and persistent Book/Call controls.
- “Explore related pages” remains available above the content so the secondary panel is still discoverable after being moved below the article on mobile.

**Accessibility Problems Found**
- Final responsive check found no horizontal page overflow at 320/375/390/414px.

**Recommended Fixes**
- Retain the current common footer/header/action system; avoid page-specific overrides unless clinically necessary.
- Keep desktop navigation sticky/scrollable and mobile navigation after content.

**Priority: MEDIUM**

## New Patient Prescribing Policy
**File:** `new-patient-prescribing-policy.html`  
**Page family:** Institution / patient information

**Visual Problems Found**
- Shared footer previously consumed too much vertical space on mobile and varied between legacy templates. **Resolved:** compact common footer treatment applied.
- The related-page/left navigation was visually too dominant before the article at mobile widths. **Resolved:** content now comes first; related navigation follows.

**UI Problems Found**
- Primary navigation, persistent Book/Call tray and footer navigation were checked against the common site system. **Final state:** consistent.
- Desktop side navigation could exceed a short viewport. **Resolved:** viewport-aware scrolling is applied.

**UX Problems Found**
- Primary appointment path remains visible through the in-page CTA and persistent Book/Call controls.
- “Explore related pages” remains available above the content so the secondary panel is still discoverable after being moved below the article on mobile.

**Accessibility Problems Found**
- Final responsive check found no horizontal page overflow at 320/375/390/414px.

**Recommended Fixes**
- Retain the current common footer/header/action system; avoid page-specific overrides unless clinically necessary.
- Keep desktop navigation sticky/scrollable and mobile navigation after content.

**Priority: MEDIUM**

## New Patients
**File:** `new-patients.html`  
**Page family:** Institution / patient information

**Visual Problems Found**
- Shared footer previously consumed too much vertical space on mobile and varied between legacy templates. **Resolved:** compact common footer treatment applied.
- The related-page/left navigation was visually too dominant before the article at mobile widths. **Resolved:** content now comes first; related navigation follows.

**UI Problems Found**
- Primary navigation, persistent Book/Call tray and footer navigation were checked against the common site system. **Final state:** consistent.
- Desktop side navigation could exceed a short viewport. **Resolved:** viewport-aware scrolling is applied.

**UX Problems Found**
- Primary appointment path remains visible through the in-page CTA and persistent Book/Call controls.
- “Explore related pages” remains available above the content so the secondary panel is still discoverable after being moved below the article on mobile.

**Accessibility Problems Found**
- Final responsive check found no horizontal page overflow at 320/375/390/414px.

**Recommended Fixes**
- Retain the current common footer/header/action system; avoid page-specific overrides unless clinically necessary.
- Keep desktop navigation sticky/scrollable and mobile navigation after content.

**Priority: MEDIUM**

## Patient Forms
**File:** `patient-forms.html`  
**Page family:** Institution / patient information

**Visual Problems Found**
- Shared footer previously consumed too much vertical space on mobile and varied between legacy templates. **Resolved:** compact common footer treatment applied.
- The related-page/left navigation was visually too dominant before the article at mobile widths. **Resolved:** content now comes first; related navigation follows.

**UI Problems Found**
- Primary navigation, persistent Book/Call tray and footer navigation were checked against the common site system. **Final state:** consistent.
- Desktop side navigation could exceed a short viewport. **Resolved:** viewport-aware scrolling is applied.

**UX Problems Found**
- Primary appointment path remains visible through the in-page CTA and persistent Book/Call controls.
- “Explore related pages” remains available above the content so the secondary panel is still discoverable after being moved below the article on mobile.

**Accessibility Problems Found**
- Final responsive check found no horizontal page overflow at 320/375/390/414px.

**Recommended Fixes**
- Retain the current common footer/header/action system; avoid page-specific overrides unless clinically necessary.
- Keep desktop navigation sticky/scrollable and mobile navigation after content.

**Priority: MEDIUM**

## Clear information, when you need it.
**File:** `patient-information.html`  
**Page family:** Institution / patient information

**Visual Problems Found**
- Shared footer previously consumed too much vertical space on mobile and varied between legacy templates. **Resolved:** compact common footer treatment applied.
- The related-page/left navigation was visually too dominant before the article at mobile widths. **Resolved:** content now comes first; related navigation follows.

**UI Problems Found**
- Primary navigation, persistent Book/Call tray and footer navigation were checked against the common site system. **Final state:** consistent.
- Desktop side navigation could exceed a short viewport. **Resolved:** viewport-aware scrolling is applied.

**UX Problems Found**
- Primary appointment path remains visible through the in-page CTA and persistent Book/Call controls.
- “Explore related pages” remains available above the content so the secondary panel is still discoverable after being moved below the article on mobile.

**Accessibility Problems Found**
- Final responsive check found no horizontal page overflow at 320/375/390/414px.

**Recommended Fixes**
- Retain the current common footer/header/action system; avoid page-specific overrides unless clinically necessary.
- Keep desktop navigation sticky/scrollable and mobile navigation after content.

**Priority: HIGH**

## Respect, information and partnership matter.
**File:** `patient-rights-responsibilities.html`  
**Page family:** Institution / patient information

**Visual Problems Found**
- Shared footer previously consumed too much vertical space on mobile and varied between legacy templates. **Resolved:** compact common footer treatment applied.
- The related-page/left navigation was visually too dominant before the article at mobile widths. **Resolved:** content now comes first; related navigation follows.

**UI Problems Found**
- Primary navigation, persistent Book/Call tray and footer navigation were checked against the common site system. **Final state:** consistent.
- Desktop side navigation could exceed a short viewport. **Resolved:** viewport-aware scrolling is applied.

**UX Problems Found**
- Primary appointment path remains visible through the in-page CTA and persistent Book/Call controls.
- “Explore related pages” remains available above the content so the secondary panel is still discoverable after being moved below the article on mobile.

**Accessibility Problems Found**
- Final responsive check found no horizontal page overflow at 320/375/390/414px.

**Recommended Fixes**
- Retain the current common footer/header/action system; avoid page-specific overrides unless clinically necessary.
- Keep desktop navigation sticky/scrollable and mobile navigation after content.

**Priority: MEDIUM**

## A long view of healthcare.
**File:** `philosophy-of-care.html`  
**Page family:** Institution / patient information

**Visual Problems Found**
- Shared footer previously consumed too much vertical space on mobile and varied between legacy templates. **Resolved:** compact common footer treatment applied.
- The related-page/left navigation was visually too dominant before the article at mobile widths. **Resolved:** content now comes first; related navigation follows.

**UI Problems Found**
- Primary navigation, persistent Book/Call tray and footer navigation were checked against the common site system. **Final state:** consistent.
- Desktop side navigation could exceed a short viewport. **Resolved:** viewport-aware scrolling is applied.

**UX Problems Found**
- Primary appointment path remains visible through the in-page CTA and persistent Book/Call controls.
- “Explore related pages” remains available above the content so the secondary panel is still discoverable after being moved below the article on mobile.

**Accessibility Problems Found**
- Final responsive check found no horizontal page overflow at 320/375/390/414px.

**Recommended Fixes**
- Retain the current common footer/header/action system; avoid page-specific overrides unless clinically necessary.
- Keep desktop navigation sticky/scrollable and mobile navigation after content.

**Priority: MEDIUM**

## Clear information builds confident care.
**File:** `practice-information.html`  
**Page family:** Institution / patient information

**Visual Problems Found**
- Shared footer previously consumed too much vertical space on mobile and varied between legacy templates. **Resolved:** compact common footer treatment applied.
- The related-page/left navigation was visually too dominant before the article at mobile widths. **Resolved:** content now comes first; related navigation follows.

**UI Problems Found**
- Primary navigation, persistent Book/Call tray and footer navigation were checked against the common site system. **Final state:** consistent.
- Desktop side navigation could exceed a short viewport. **Resolved:** viewport-aware scrolling is applied.

**UX Problems Found**
- Primary appointment path remains visible through the in-page CTA and persistent Book/Call controls.
- “Explore related pages” remains available above the content so the secondary panel is still discoverable after being moved below the article on mobile.

**Accessibility Problems Found**
- Final responsive check found no horizontal page overflow at 320/375/390/414px.

**Recommended Fixes**
- Retain the current common footer/header/action system; avoid page-specific overrides unless clinically necessary.
- Keep desktop navigation sticky/scrollable and mobile navigation after content.

**Priority: MEDIUM**

## Clear expectations make care easier to navigate.
**File:** `practice-policies.html`  
**Page family:** Institution / patient information

**Visual Problems Found**
- Shared footer previously consumed too much vertical space on mobile and varied between legacy templates. **Resolved:** compact common footer treatment applied.
- The related-page/left navigation was visually too dominant before the article at mobile widths. **Resolved:** content now comes first; related navigation follows.

**UI Problems Found**
- Primary navigation, persistent Book/Call tray and footer navigation were checked against the common site system. **Final state:** consistent.
- Desktop side navigation could exceed a short viewport. **Resolved:** viewport-aware scrolling is applied.

**UX Problems Found**
- Primary appointment path remains visible through the in-page CTA and persistent Book/Call controls.
- “Explore related pages” remains available above the content so the secondary panel is still discoverable after being moved below the article on mobile.

**Accessibility Problems Found**
- Final responsive check found no horizontal page overflow at 320/375/390/414px.

**Recommended Fixes**
- Retain the current common footer/header/action system; avoid page-specific overrides unless clinically necessary.
- Keep desktop navigation sticky/scrollable and mobile navigation after content.

**Priority: MEDIUM**

## Your information deserves careful protection.
**File:** `privacy-confidentiality.html`  
**Page family:** Institution / patient information

**Visual Problems Found**
- Shared footer previously consumed too much vertical space on mobile and varied between legacy templates. **Resolved:** compact common footer treatment applied.
- The related-page/left navigation was visually too dominant before the article at mobile widths. **Resolved:** content now comes first; related navigation follows.

**UI Problems Found**
- Primary navigation, persistent Book/Call tray and footer navigation were checked against the common site system. **Final state:** consistent.
- Desktop side navigation could exceed a short viewport. **Resolved:** viewport-aware scrolling is applied.

**UX Problems Found**
- Primary appointment path remains visible through the in-page CTA and persistent Book/Call controls.
- “Explore related pages” remains available above the content so the secondary panel is still discoverable after being moved below the article on mobile.

**Accessibility Problems Found**
- Final responsive check found no horizontal page overflow at 320/375/390/414px.

**Recommended Fixes**
- Retain the current common footer/header/action system; avoid page-specific overrides unless clinically necessary.
- Keep desktop navigation sticky/scrollable and mobile navigation after content.

**Priority: MEDIUM**

## Quality is built through systems, people and continuous improvement.
**File:** `quality-safety.html`  
**Page family:** Institution / patient information

**Visual Problems Found**
- Shared footer previously consumed too much vertical space on mobile and varied between legacy templates. **Resolved:** compact common footer treatment applied.
- The related-page/left navigation was visually too dominant before the article at mobile widths. **Resolved:** content now comes first; related navigation follows.

**UI Problems Found**
- Primary navigation, persistent Book/Call tray and footer navigation were checked against the common site system. **Final state:** consistent.
- Desktop side navigation could exceed a short viewport. **Resolved:** viewport-aware scrolling is applied.

**UX Problems Found**
- Primary appointment path remains visible through the in-page CTA and persistent Book/Call controls.
- “Explore related pages” remains available above the content so the secondary panel is still discoverable after being moved below the article on mobile.

**Accessibility Problems Found**
- Final responsive check found no horizontal page overflow at 320/375/390/414px.

**Recommended Fixes**
- Retain the current common footer/header/action system; avoid page-specific overrides unless clinically necessary.
- Keep desktop navigation sticky/scrollable and mobile navigation after content.

**Priority: MEDIUM**

## Referrals
**File:** `referrals.html`  
**Page family:** Institution / patient information

**Visual Problems Found**
- Shared footer previously consumed too much vertical space on mobile and varied between legacy templates. **Resolved:** compact common footer treatment applied.
- The related-page/left navigation was visually too dominant before the article at mobile widths. **Resolved:** content now comes first; related navigation follows.

**UI Problems Found**
- Primary navigation, persistent Book/Call tray and footer navigation were checked against the common site system. **Final state:** consistent.
- Desktop side navigation could exceed a short viewport. **Resolved:** viewport-aware scrolling is applied.

**UX Problems Found**
- Primary appointment path remains visible through the in-page CTA and persistent Book/Call controls.
- “Explore related pages” remains available above the content so the secondary panel is still discoverable after being moved below the article on mobile.

**Accessibility Problems Found**
- Final responsive check found no horizontal page overflow at 320/375/390/414px.

**Recommended Fixes**
- Retain the current common footer/header/action system; avoid page-specific overrides unless clinically necessary.
- Keep desktop navigation sticky/scrollable and mobile navigation after content.

**Priority: MEDIUM**

## Continuity includes knowing what comes next.
**File:** `reminder-recall.html`  
**Page family:** Institution / patient information

**Visual Problems Found**
- Shared footer previously consumed too much vertical space on mobile and varied between legacy templates. **Resolved:** compact common footer treatment applied.
- The related-page/left navigation was visually too dominant before the article at mobile widths. **Resolved:** content now comes first; related navigation follows.

**UI Problems Found**
- Primary navigation, persistent Book/Call tray and footer navigation were checked against the common site system. **Final state:** consistent.
- Desktop side navigation could exceed a short viewport. **Resolved:** viewport-aware scrolling is applied.

**UX Problems Found**
- Primary appointment path remains visible through the in-page CTA and persistent Book/Call controls.
- “Explore related pages” remains available above the content so the secondary panel is still discoverable after being moved below the article on mobile.

**Accessibility Problems Found**
- Final responsive check found no horizontal page overflow at 320/375/390/414px.

**Recommended Fixes**
- Retain the current common footer/header/action system; avoid page-specific overrides unless clinically necessary.
- Keep desktop navigation sticky/scrollable and mobile navigation after content.

**Priority: MEDIUM**

## Repeat Scripts
**File:** `repeat-scripts.html`  
**Page family:** Institution / patient information

**Visual Problems Found**
- Shared footer previously consumed too much vertical space on mobile and varied between legacy templates. **Resolved:** compact common footer treatment applied.
- The related-page/left navigation was visually too dominant before the article at mobile widths. **Resolved:** content now comes first; related navigation follows.

**UI Problems Found**
- Primary navigation, persistent Book/Call tray and footer navigation were checked against the common site system. **Final state:** consistent.
- Desktop side navigation could exceed a short viewport. **Resolved:** viewport-aware scrolling is applied.

**UX Problems Found**
- Primary appointment path remains visible through the in-page CTA and persistent Book/Call controls.
- “Explore related pages” remains available above the content so the secondary panel is still discoverable after being moved below the article on mobile.

**Accessibility Problems Found**
- Final responsive check found no horizontal page overflow at 320/375/390/414px.

**Recommended Fixes**
- Retain the current common footer/header/action system; avoid page-specific overrides unless clinically necessary.
- Keep desktop navigation sticky/scrollable and mobile navigation after content.

**Priority: MEDIUM**

## Healthcare For Every Stage Of Life
**File:** `services.html`  
**Page family:** Institution / patient information

**Visual Problems Found**
- Shared footer previously consumed too much vertical space on mobile and varied between legacy templates. **Resolved:** compact common footer treatment applied.

**UI Problems Found**
- Primary navigation, persistent Book/Call tray and footer navigation were checked against the common site system. **Final state:** consistent.

**UX Problems Found**
- Primary appointment path remains visible through the in-page CTA and persistent Book/Call controls.

**Accessibility Problems Found**
- Final responsive check found no horizontal page overflow at 320/375/390/414px.

**Recommended Fixes**
- Retain the current common footer/header/action system; avoid page-specific overrides unless clinically necessary.

**Priority: LOW**

## Allied Health
**File:** `services/allied-health.html`  
**Page family:** Healthcare service

**Visual Problems Found**
- Shared footer previously consumed too much vertical space on mobile and varied between legacy templates. **Resolved:** compact common footer treatment applied.
- The related-page/left navigation was visually too dominant before the article at mobile widths. **Resolved:** content now comes first; related navigation follows.

**UI Problems Found**
- Primary navigation, persistent Book/Call tray and footer navigation were checked against the common site system. **Final state:** consistent.
- Desktop side navigation could exceed a short viewport. **Resolved:** viewport-aware scrolling is applied.

**UX Problems Found**
- Primary appointment path remains visible through the in-page CTA and persistent Book/Call controls.
- “Explore related pages” remains available above the content so the secondary panel is still discoverable after being moved below the article on mobile.

**Accessibility Problems Found**
- Final responsive check found no horizontal page overflow at 320/375/390/414px.

**Recommended Fixes**
- Retain the current common footer/header/action system; avoid page-specific overrides unless clinically necessary.
- Keep desktop navigation sticky/scrollable and mobile navigation after content.

**Priority: MEDIUM**

## Antenatal & Postnatal Care
**File:** `services/antenatal-postnatal-care.html`  
**Page family:** Healthcare service

**Visual Problems Found**
- Shared footer previously consumed too much vertical space on mobile and varied between legacy templates. **Resolved:** compact common footer treatment applied.
- The related-page/left navigation was visually too dominant before the article at mobile widths. **Resolved:** content now comes first; related navigation follows.
- Breadcrumb trail previously stacked into separate lines/chevrons on mobile. **Resolved:** it now wraps as one continuous trail.

**UI Problems Found**
- Primary navigation, persistent Book/Call tray and footer navigation were checked against the common site system. **Final state:** consistent.
- Desktop side navigation could exceed a short viewport. **Resolved:** viewport-aware scrolling is applied.

**UX Problems Found**
- Primary appointment path remains visible through the in-page CTA and persistent Book/Call controls.
- “Explore related pages” remains available above the content so the secondary panel is still discoverable after being moved below the article on mobile.

**Accessibility Problems Found**
- Final responsive check found no horizontal page overflow at 320/375/390/414px.
- Breadcrumb links remain readable/tappable without creating horizontal overflow.

**Recommended Fixes**
- Retain the current common footer/header/action system; avoid page-specific overrides unless clinically necessary.
- Keep desktop navigation sticky/scrollable and mobile navigation after content.
- Keep the normalized breadcrumb flex treatment for legacy procedure pages.

**Priority: HIGH**

## Breast Check
**File:** `services/breast-check.html`  
**Page family:** Healthcare service

**Visual Problems Found**
- Shared footer previously consumed too much vertical space on mobile and varied between legacy templates. **Resolved:** compact common footer treatment applied.
- The related-page/left navigation was visually too dominant before the article at mobile widths. **Resolved:** content now comes first; related navigation follows.
- Breadcrumb trail previously stacked into separate lines/chevrons on mobile. **Resolved:** it now wraps as one continuous trail.

**UI Problems Found**
- Primary navigation, persistent Book/Call tray and footer navigation were checked against the common site system. **Final state:** consistent.
- Desktop side navigation could exceed a short viewport. **Resolved:** viewport-aware scrolling is applied.

**UX Problems Found**
- Primary appointment path remains visible through the in-page CTA and persistent Book/Call controls.
- “Explore related pages” remains available above the content so the secondary panel is still discoverable after being moved below the article on mobile.

**Accessibility Problems Found**
- Final responsive check found no horizontal page overflow at 320/375/390/414px.
- Breadcrumb links remain readable/tappable without creating horizontal overflow.

**Recommended Fixes**
- Retain the current common footer/header/action system; avoid page-specific overrides unless clinically necessary.
- Keep desktop navigation sticky/scrollable and mobile navigation after content.
- Keep the normalized breadcrumb flex treatment for legacy procedure pages.

**Priority: HIGH**

## Children's Health In Woolloongabba
**File:** `services/childrens-health.html`  
**Page family:** Healthcare service

**Visual Problems Found**
- Shared footer previously consumed too much vertical space on mobile and varied between legacy templates. **Resolved:** compact common footer treatment applied.
- The related-page/left navigation was visually too dominant before the article at mobile widths. **Resolved:** content now comes first; related navigation follows.

**UI Problems Found**
- Primary navigation, persistent Book/Call tray and footer navigation were checked against the common site system. **Final state:** consistent.
- Desktop side navigation could exceed a short viewport. **Resolved:** viewport-aware scrolling is applied.

**UX Problems Found**
- Primary appointment path remains visible through the in-page CTA and persistent Book/Call controls.
- “Explore related pages” remains available above the content so the secondary panel is still discoverable after being moved below the article on mobile.

**Accessibility Problems Found**
- Final responsive check found no horizontal page overflow at 320/375/390/414px.

**Recommended Fixes**
- Retain the current common footer/header/action system; avoid page-specific overrides unless clinically necessary.
- Keep desktop navigation sticky/scrollable and mobile navigation after content.

**Priority: MEDIUM**

## Chronic Disease Care In Woolloongabba
**File:** `services/chronic-disease-care.html`  
**Page family:** Healthcare service

**Visual Problems Found**
- Shared footer previously consumed too much vertical space on mobile and varied between legacy templates. **Resolved:** compact common footer treatment applied.
- The related-page/left navigation was visually too dominant before the article at mobile widths. **Resolved:** content now comes first; related navigation follows.

**UI Problems Found**
- Primary navigation, persistent Book/Call tray and footer navigation were checked against the common site system. **Final state:** consistent.
- Desktop side navigation could exceed a short viewport. **Resolved:** viewport-aware scrolling is applied.

**UX Problems Found**
- Primary appointment path remains visible through the in-page CTA and persistent Book/Call controls.
- “Explore related pages” remains available above the content so the secondary panel is still discoverable after being moved below the article on mobile.

**Accessibility Problems Found**
- Final responsive check found no horizontal page overflow at 320/375/390/414px.

**Recommended Fixes**
- Retain the current common footer/header/action system; avoid page-specific overrides unless clinically necessary.
- Keep desktop navigation sticky/scrollable and mobile navigation after content.

**Priority: MEDIUM**

## Ear Care & Ear Syringing
**File:** `services/ear-care-ear-syringing.html`  
**Page family:** Healthcare service

**Visual Problems Found**
- Shared footer previously consumed too much vertical space on mobile and varied between legacy templates. **Resolved:** compact common footer treatment applied.
- The related-page/left navigation was visually too dominant before the article at mobile widths. **Resolved:** content now comes first; related navigation follows.
- Breadcrumb trail previously stacked into separate lines/chevrons on mobile. **Resolved:** it now wraps as one continuous trail.

**UI Problems Found**
- Primary navigation, persistent Book/Call tray and footer navigation were checked against the common site system. **Final state:** consistent.
- Desktop side navigation could exceed a short viewport. **Resolved:** viewport-aware scrolling is applied.

**UX Problems Found**
- Primary appointment path remains visible through the in-page CTA and persistent Book/Call controls.
- “Explore related pages” remains available above the content so the secondary panel is still discoverable after being moved below the article on mobile.

**Accessibility Problems Found**
- Final responsive check found no horizontal page overflow at 320/375/390/414px.
- Breadcrumb links remain readable/tappable without creating horizontal overflow.

**Recommended Fixes**
- Retain the current common footer/header/action system; avoid page-specific overrides unless clinically necessary.
- Keep desktop navigation sticky/scrollable and mobile navigation after content.
- Keep the normalized breadcrumb flex treatment for legacy procedure pages.

**Priority: HIGH**

## ECG (Electrocardiogram)
**File:** `services/ecg.html`  
**Page family:** Healthcare service

**Visual Problems Found**
- Shared footer previously consumed too much vertical space on mobile and varied between legacy templates. **Resolved:** compact common footer treatment applied.
- The related-page/left navigation was visually too dominant before the article at mobile widths. **Resolved:** content now comes first; related navigation follows.
- Breadcrumb trail previously stacked into separate lines/chevrons on mobile. **Resolved:** it now wraps as one continuous trail.

**UI Problems Found**
- Primary navigation, persistent Book/Call tray and footer navigation were checked against the common site system. **Final state:** consistent.
- Desktop side navigation could exceed a short viewport. **Resolved:** viewport-aware scrolling is applied.

**UX Problems Found**
- Primary appointment path remains visible through the in-page CTA and persistent Book/Call controls.
- “Explore related pages” remains available above the content so the secondary panel is still discoverable after being moved below the article on mobile.

**Accessibility Problems Found**
- Final responsive check found no horizontal page overflow at 320/375/390/414px.
- Breadcrumb links remain readable/tappable without creating horizontal overflow.

**Recommended Fixes**
- Retain the current common footer/header/action system; avoid page-specific overrides unless clinically necessary.
- Keep desktop navigation sticky/scrollable and mobile navigation after content.
- Keep the normalized breadcrumb flex treatment for legacy procedure pages.

**Priority: HIGH**

## Family Healthcare In Woolloongabba
**File:** `services/family-health.html`  
**Page family:** Healthcare service

**Visual Problems Found**
- Shared footer previously consumed too much vertical space on mobile and varied between legacy templates. **Resolved:** compact common footer treatment applied.
- The related-page/left navigation was visually too dominant before the article at mobile widths. **Resolved:** content now comes first; related navigation follows.

**UI Problems Found**
- Primary navigation, persistent Book/Call tray and footer navigation were checked against the common site system. **Final state:** consistent.
- Desktop side navigation could exceed a short viewport. **Resolved:** viewport-aware scrolling is applied.

**UX Problems Found**
- Primary appointment path remains visible through the in-page CTA and persistent Book/Call controls.
- “Explore related pages” remains available above the content so the secondary panel is still discoverable after being moved below the article on mobile.

**Accessibility Problems Found**
- Final responsive check found no horizontal page overflow at 320/375/390/414px.

**Recommended Fixes**
- Retain the current common footer/header/action system; avoid page-specific overrides unless clinically necessary.
- Keep desktop navigation sticky/scrollable and mobile navigation after content.

**Priority: MEDIUM**

## Implanon Insertion & Removal
**File:** `services/implanon-insertion-removal.html`  
**Page family:** Healthcare service

**Visual Problems Found**
- Shared footer previously consumed too much vertical space on mobile and varied between legacy templates. **Resolved:** compact common footer treatment applied.
- The related-page/left navigation was visually too dominant before the article at mobile widths. **Resolved:** content now comes first; related navigation follows.
- Breadcrumb trail previously stacked into separate lines/chevrons on mobile. **Resolved:** it now wraps as one continuous trail.

**UI Problems Found**
- Primary navigation, persistent Book/Call tray and footer navigation were checked against the common site system. **Final state:** consistent.
- Desktop side navigation could exceed a short viewport. **Resolved:** viewport-aware scrolling is applied.

**UX Problems Found**
- Primary appointment path remains visible through the in-page CTA and persistent Book/Call controls.
- “Explore related pages” remains available above the content so the secondary panel is still discoverable after being moved below the article on mobile.

**Accessibility Problems Found**
- Final responsive check found no horizontal page overflow at 320/375/390/414px.
- Breadcrumb links remain readable/tappable without creating horizontal overflow.

**Recommended Fixes**
- Retain the current common footer/header/action system; avoid page-specific overrides unless clinically necessary.
- Keep desktop navigation sticky/scrollable and mobile navigation after content.
- Keep the normalized breadcrumb flex treatment for legacy procedure pages.

**Priority: HIGH**

## Iron Infusions
**File:** `services/iron-infusions.html`  
**Page family:** Healthcare service

**Visual Problems Found**
- Shared footer previously consumed too much vertical space on mobile and varied between legacy templates. **Resolved:** compact common footer treatment applied.
- The related-page/left navigation was visually too dominant before the article at mobile widths. **Resolved:** content now comes first; related navigation follows.
- Breadcrumb trail previously stacked into separate lines/chevrons on mobile. **Resolved:** it now wraps as one continuous trail.

**UI Problems Found**
- Primary navigation, persistent Book/Call tray and footer navigation were checked against the common site system. **Final state:** consistent.
- Desktop side navigation could exceed a short viewport. **Resolved:** viewport-aware scrolling is applied.

**UX Problems Found**
- Primary appointment path remains visible through the in-page CTA and persistent Book/Call controls.
- “Explore related pages” remains available above the content so the secondary panel is still discoverable after being moved below the article on mobile.

**Accessibility Problems Found**
- Final responsive check found no horizontal page overflow at 320/375/390/414px.
- Breadcrumb links remain readable/tappable without creating horizontal overflow.

**Recommended Fixes**
- Retain the current common footer/header/action system; avoid page-specific overrides unless clinically necessary.
- Keep desktop navigation sticky/scrollable and mobile navigation after content.
- Keep the normalized breadcrumb flex treatment for legacy procedure pages.

**Priority: HIGH**

## IUD Insertion & Removal
**File:** `services/iud-insertion-removal.html`  
**Page family:** Healthcare service

**Visual Problems Found**
- Shared footer previously consumed too much vertical space on mobile and varied between legacy templates. **Resolved:** compact common footer treatment applied.
- The related-page/left navigation was visually too dominant before the article at mobile widths. **Resolved:** content now comes first; related navigation follows.
- Breadcrumb trail previously stacked into separate lines/chevrons on mobile. **Resolved:** it now wraps as one continuous trail.

**UI Problems Found**
- Primary navigation, persistent Book/Call tray and footer navigation were checked against the common site system. **Final state:** consistent.
- Desktop side navigation could exceed a short viewport. **Resolved:** viewport-aware scrolling is applied.

**UX Problems Found**
- Primary appointment path remains visible through the in-page CTA and persistent Book/Call controls.
- “Explore related pages” remains available above the content so the secondary panel is still discoverable after being moved below the article on mobile.

**Accessibility Problems Found**
- Final responsive check found no horizontal page overflow at 320/375/390/414px.
- Breadcrumb links remain readable/tappable without creating horizontal overflow.

**Recommended Fixes**
- Retain the current common footer/header/action system; avoid page-specific overrides unless clinically necessary.
- Keep desktop navigation sticky/scrollable and mobile navigation after content.
- Keep the normalized breadcrumb flex treatment for legacy procedure pages.

**Priority: HIGH**

## Medical Procedures
**File:** `services/medical-procedures.html`  
**Page family:** Healthcare service

**Visual Problems Found**
- Shared footer previously consumed too much vertical space on mobile and varied between legacy templates. **Resolved:** compact common footer treatment applied.
- The related-page/left navigation was visually too dominant before the article at mobile widths. **Resolved:** content now comes first; related navigation follows.

**UI Problems Found**
- Primary navigation, persistent Book/Call tray and footer navigation were checked against the common site system. **Final state:** consistent.
- Desktop side navigation could exceed a short viewport. **Resolved:** viewport-aware scrolling is applied.

**UX Problems Found**
- Primary appointment path remains visible through the in-page CTA and persistent Book/Call controls.
- “Explore related pages” remains available above the content so the secondary panel is still discoverable after being moved below the article on mobile.

**Accessibility Problems Found**
- Final responsive check found no horizontal page overflow at 320/375/390/414px.

**Recommended Fixes**
- Retain the current common footer/header/action system; avoid page-specific overrides unless clinically necessary.
- Keep desktop navigation sticky/scrollable and mobile navigation after content.

**Priority: MEDIUM**

## Men's Health In Woolloongabba
**File:** `services/mens-health.html`  
**Page family:** Healthcare service

**Visual Problems Found**
- Shared footer previously consumed too much vertical space on mobile and varied between legacy templates. **Resolved:** compact common footer treatment applied.
- The related-page/left navigation was visually too dominant before the article at mobile widths. **Resolved:** content now comes first; related navigation follows.

**UI Problems Found**
- Primary navigation, persistent Book/Call tray and footer navigation were checked against the common site system. **Final state:** consistent.
- Desktop side navigation could exceed a short viewport. **Resolved:** viewport-aware scrolling is applied.

**UX Problems Found**
- Primary appointment path remains visible through the in-page CTA and persistent Book/Call controls.
- “Explore related pages” remains available above the content so the secondary panel is still discoverable after being moved below the article on mobile.

**Accessibility Problems Found**
- Final responsive check found no horizontal page overflow at 320/375/390/414px.

**Recommended Fixes**
- Retain the current common footer/header/action system; avoid page-specific overrides unless clinically necessary.
- Keep desktop navigation sticky/scrollable and mobile navigation after content.

**Priority: MEDIUM**

## Mental Health Care In Woolloongabba
**File:** `services/mental-health.html`  
**Page family:** Healthcare service

**Visual Problems Found**
- Shared footer previously consumed too much vertical space on mobile and varied between legacy templates. **Resolved:** compact common footer treatment applied.
- The related-page/left navigation was visually too dominant before the article at mobile widths. **Resolved:** content now comes first; related navigation follows.

**UI Problems Found**
- Primary navigation, persistent Book/Call tray and footer navigation were checked against the common site system. **Final state:** consistent.
- Desktop side navigation could exceed a short viewport. **Resolved:** viewport-aware scrolling is applied.

**UX Problems Found**
- Primary appointment path remains visible through the in-page CTA and persistent Book/Call controls.
- “Explore related pages” remains available above the content so the secondary panel is still discoverable after being moved below the article on mobile.

**Accessibility Problems Found**
- Final responsive check found no horizontal page overflow at 320/375/390/414px.

**Recommended Fixes**
- Retain the current common footer/header/action system; avoid page-specific overrides unless clinically necessary.
- Keep desktop navigation sticky/scrollable and mobile navigation after content.

**Priority: MEDIUM**

## Nebulising
**File:** `services/nebulising.html`  
**Page family:** Healthcare service

**Visual Problems Found**
- Shared footer previously consumed too much vertical space on mobile and varied between legacy templates. **Resolved:** compact common footer treatment applied.
- The related-page/left navigation was visually too dominant before the article at mobile widths. **Resolved:** content now comes first; related navigation follows.
- Breadcrumb trail previously stacked into separate lines/chevrons on mobile. **Resolved:** it now wraps as one continuous trail.

**UI Problems Found**
- Primary navigation, persistent Book/Call tray and footer navigation were checked against the common site system. **Final state:** consistent.
- Desktop side navigation could exceed a short viewport. **Resolved:** viewport-aware scrolling is applied.

**UX Problems Found**
- Primary appointment path remains visible through the in-page CTA and persistent Book/Call controls.
- “Explore related pages” remains available above the content so the secondary panel is still discoverable after being moved below the article on mobile.

**Accessibility Problems Found**
- Final responsive check found no horizontal page overflow at 320/375/390/414px.
- Breadcrumb links remain readable/tappable without creating horizontal overflow.

**Recommended Fixes**
- Retain the current common footer/header/action system; avoid page-specific overrides unless clinically necessary.
- Keep desktop navigation sticky/scrollable and mobile navigation after content.
- Keep the normalized breadcrumb flex treatment for legacy procedure pages.

**Priority: HIGH**

## Pap Smear & Cervical Screening
**File:** `services/pap-smear-cervical-screening.html`  
**Page family:** Healthcare service

**Visual Problems Found**
- Shared footer previously consumed too much vertical space on mobile and varied between legacy templates. **Resolved:** compact common footer treatment applied.
- The related-page/left navigation was visually too dominant before the article at mobile widths. **Resolved:** content now comes first; related navigation follows.
- Breadcrumb trail previously stacked into separate lines/chevrons on mobile. **Resolved:** it now wraps as one continuous trail.

**UI Problems Found**
- Primary navigation, persistent Book/Call tray and footer navigation were checked against the common site system. **Final state:** consistent.
- Desktop side navigation could exceed a short viewport. **Resolved:** viewport-aware scrolling is applied.

**UX Problems Found**
- Primary appointment path remains visible through the in-page CTA and persistent Book/Call controls.
- “Explore related pages” remains available above the content so the secondary panel is still discoverable after being moved below the article on mobile.

**Accessibility Problems Found**
- Final responsive check found no horizontal page overflow at 320/375/390/414px.
- Breadcrumb links remain readable/tappable without creating horizontal overflow.

**Recommended Fixes**
- Retain the current common footer/header/action system; avoid page-specific overrides unless clinically necessary.
- Keep desktop navigation sticky/scrollable and mobile navigation after content.
- Keep the normalized breadcrumb flex treatment for legacy procedure pages.

**Priority: HIGH**

## Pathology
**File:** `services/pathology.html`  
**Page family:** Healthcare service

**Visual Problems Found**
- Shared footer previously consumed too much vertical space on mobile and varied between legacy templates. **Resolved:** compact common footer treatment applied.
- The related-page/left navigation was visually too dominant before the article at mobile widths. **Resolved:** content now comes first; related navigation follows.
- Breadcrumb trail previously stacked into separate lines/chevrons on mobile. **Resolved:** it now wraps as one continuous trail.

**UI Problems Found**
- Primary navigation, persistent Book/Call tray and footer navigation were checked against the common site system. **Final state:** consistent.
- Desktop side navigation could exceed a short viewport. **Resolved:** viewport-aware scrolling is applied.

**UX Problems Found**
- Primary appointment path remains visible through the in-page CTA and persistent Book/Call controls.
- “Explore related pages” remains available above the content so the secondary panel is still discoverable after being moved below the article on mobile.

**Accessibility Problems Found**
- Final responsive check found no horizontal page overflow at 320/375/390/414px.
- Breadcrumb links remain readable/tappable without creating horizontal overflow.

**Recommended Fixes**
- Retain the current common footer/header/action system; avoid page-specific overrides unless clinically necessary.
- Keep desktop navigation sticky/scrollable and mobile navigation after content.
- Keep the normalized breadcrumb flex treatment for legacy procedure pages.

**Priority: HIGH**

## Pharmacy
**File:** `services/pharmacy.html`  
**Page family:** Healthcare service

**Visual Problems Found**
- Shared footer previously consumed too much vertical space on mobile and varied between legacy templates. **Resolved:** compact common footer treatment applied.
- The related-page/left navigation was visually too dominant before the article at mobile widths. **Resolved:** content now comes first; related navigation follows.
- Breadcrumb trail previously stacked into separate lines/chevrons on mobile. **Resolved:** it now wraps as one continuous trail.

**UI Problems Found**
- Primary navigation, persistent Book/Call tray and footer navigation were checked against the common site system. **Final state:** consistent.
- Desktop side navigation could exceed a short viewport. **Resolved:** viewport-aware scrolling is applied.

**UX Problems Found**
- Primary appointment path remains visible through the in-page CTA and persistent Book/Call controls.
- “Explore related pages” remains available above the content so the secondary panel is still discoverable after being moved below the article on mobile.

**Accessibility Problems Found**
- Final responsive check found no horizontal page overflow at 320/375/390/414px.
- Breadcrumb links remain readable/tappable without creating horizontal overflow.

**Recommended Fixes**
- Retain the current common footer/header/action system; avoid page-specific overrides unless clinically necessary.
- Keep desktop navigation sticky/scrollable and mobile navigation after content.
- Keep the normalized breadcrumb flex treatment for legacy procedure pages.

**Priority: HIGH**

## Pre-Pregnancy Care
**File:** `services/pre-pregnancy-care.html`  
**Page family:** Healthcare service

**Visual Problems Found**
- Shared footer previously consumed too much vertical space on mobile and varied between legacy templates. **Resolved:** compact common footer treatment applied.
- The related-page/left navigation was visually too dominant before the article at mobile widths. **Resolved:** content now comes first; related navigation follows.
- Breadcrumb trail previously stacked into separate lines/chevrons on mobile. **Resolved:** it now wraps as one continuous trail.

**UI Problems Found**
- Primary navigation, persistent Book/Call tray and footer navigation were checked against the common site system. **Final state:** consistent.
- Desktop side navigation could exceed a short viewport. **Resolved:** viewport-aware scrolling is applied.

**UX Problems Found**
- Primary appointment path remains visible through the in-page CTA and persistent Book/Call controls.
- “Explore related pages” remains available above the content so the secondary panel is still discoverable after being moved below the article on mobile.

**Accessibility Problems Found**
- Final responsive check found no horizontal page overflow at 320/375/390/414px.
- Breadcrumb links remain readable/tappable without creating horizontal overflow.

**Recommended Fixes**
- Retain the current common footer/header/action system; avoid page-specific overrides unless clinically necessary.
- Keep desktop navigation sticky/scrollable and mobile navigation after content.
- Keep the normalized breadcrumb flex treatment for legacy procedure pages.

**Priority: HIGH**

## Preventive Healthcare In Woolloongabba
**File:** `services/preventive-healthcare.html`  
**Page family:** Healthcare service

**Visual Problems Found**
- Shared footer previously consumed too much vertical space on mobile and varied between legacy templates. **Resolved:** compact common footer treatment applied.
- The related-page/left navigation was visually too dominant before the article at mobile widths. **Resolved:** content now comes first; related navigation follows.

**UI Problems Found**
- Primary navigation, persistent Book/Call tray and footer navigation were checked against the common site system. **Final state:** consistent.
- Desktop side navigation could exceed a short viewport. **Resolved:** viewport-aware scrolling is applied.

**UX Problems Found**
- Primary appointment path remains visible through the in-page CTA and persistent Book/Call controls.
- “Explore related pages” remains available above the content so the secondary panel is still discoverable after being moved below the article on mobile.

**Accessibility Problems Found**
- Final responsive check found no horizontal page overflow at 320/375/390/414px.

**Recommended Fixes**
- Retain the current common footer/header/action system; avoid page-specific overrides unless clinically necessary.
- Keep desktop navigation sticky/scrollable and mobile navigation after content.

**Priority: MEDIUM**

## Prostate Care
**File:** `services/prostate-care.html`  
**Page family:** Healthcare service

**Visual Problems Found**
- Shared footer previously consumed too much vertical space on mobile and varied between legacy templates. **Resolved:** compact common footer treatment applied.
- The related-page/left navigation was visually too dominant before the article at mobile widths. **Resolved:** content now comes first; related navigation follows.
- Breadcrumb trail previously stacked into separate lines/chevrons on mobile. **Resolved:** it now wraps as one continuous trail.

**UI Problems Found**
- Primary navigation, persistent Book/Call tray and footer navigation were checked against the common site system. **Final state:** consistent.
- Desktop side navigation could exceed a short viewport. **Resolved:** viewport-aware scrolling is applied.

**UX Problems Found**
- Primary appointment path remains visible through the in-page CTA and persistent Book/Call controls.
- “Explore related pages” remains available above the content so the secondary panel is still discoverable after being moved below the article on mobile.

**Accessibility Problems Found**
- Final responsive check found no horizontal page overflow at 320/375/390/414px.
- Breadcrumb links remain readable/tappable without creating horizontal overflow.

**Recommended Fixes**
- Retain the current common footer/header/action system; avoid page-specific overrides unless clinically necessary.
- Keep desktop navigation sticky/scrollable and mobile navigation after content.
- Keep the normalized breadcrumb flex treatment for legacy procedure pages.

**Priority: HIGH**

## Radiology
**File:** `services/radiology.html`  
**Page family:** Healthcare service

**Visual Problems Found**
- Shared footer previously consumed too much vertical space on mobile and varied between legacy templates. **Resolved:** compact common footer treatment applied.
- The related-page/left navigation was visually too dominant before the article at mobile widths. **Resolved:** content now comes first; related navigation follows.
- Breadcrumb trail previously stacked into separate lines/chevrons on mobile. **Resolved:** it now wraps as one continuous trail.

**UI Problems Found**
- Primary navigation, persistent Book/Call tray and footer navigation were checked against the common site system. **Final state:** consistent.
- Desktop side navigation could exceed a short viewport. **Resolved:** viewport-aware scrolling is applied.

**UX Problems Found**
- Primary appointment path remains visible through the in-page CTA and persistent Book/Call controls.
- “Explore related pages” remains available above the content so the secondary panel is still discoverable after being moved below the article on mobile.

**Accessibility Problems Found**
- Final responsive check found no horizontal page overflow at 320/375/390/414px.
- Breadcrumb links remain readable/tappable without creating horizontal overflow.

**Recommended Fixes**
- Retain the current common footer/header/action system; avoid page-specific overrides unless clinically necessary.
- Keep desktop navigation sticky/scrollable and mobile navigation after content.
- Keep the normalized breadcrumb flex treatment for legacy procedure pages.

**Priority: HIGH**

## Skin Cancer Care in Woolloongabba
**File:** `services/skin-cancer-care.html`  
**Page family:** Healthcare service

**Visual Problems Found**
- Shared footer previously consumed too much vertical space on mobile and varied between legacy templates. **Resolved:** compact common footer treatment applied.
- The related-page/left navigation was visually too dominant before the article at mobile widths. **Resolved:** content now comes first; related navigation follows.

**UI Problems Found**
- Primary navigation, persistent Book/Call tray and footer navigation were checked against the common site system. **Final state:** consistent.
- Desktop side navigation could exceed a short viewport. **Resolved:** viewport-aware scrolling is applied.

**UX Problems Found**
- Primary appointment path remains visible through the in-page CTA and persistent Book/Call controls.
- “Explore related pages” remains available above the content so the secondary panel is still discoverable after being moved below the article on mobile.

**Accessibility Problems Found**
- Final responsive check found no horizontal page overflow at 320/375/390/414px.

**Recommended Fixes**
- Retain the current common footer/header/action system; avoid page-specific overrides unless clinically necessary.
- Keep desktop navigation sticky/scrollable and mobile navigation after content.

**Priority: MEDIUM**

## Skin Checks in Woolloongabba
**File:** `services/skin-checks.html`  
**Page family:** Healthcare service

**Visual Problems Found**
- Shared footer previously consumed too much vertical space on mobile and varied between legacy templates. **Resolved:** compact common footer treatment applied.
- The related-page/left navigation was visually too dominant before the article at mobile widths. **Resolved:** content now comes first; related navigation follows.

**UI Problems Found**
- Primary navigation, persistent Book/Call tray and footer navigation were checked against the common site system. **Final state:** consistent.
- Desktop side navigation could exceed a short viewport. **Resolved:** viewport-aware scrolling is applied.

**UX Problems Found**
- Primary appointment path remains visible through the in-page CTA and persistent Book/Call controls.
- “Explore related pages” remains available above the content so the secondary panel is still discoverable after being moved below the article on mobile.

**Accessibility Problems Found**
- Final responsive check found no horizontal page overflow at 320/375/390/414px.

**Recommended Fixes**
- Retain the current common footer/header/action system; avoid page-specific overrides unless clinically necessary.
- Keep desktop navigation sticky/scrollable and mobile navigation after content.

**Priority: MEDIUM**

## Spirometry
**File:** `services/spirometry.html`  
**Page family:** Healthcare service

**Visual Problems Found**
- Shared footer previously consumed too much vertical space on mobile and varied between legacy templates. **Resolved:** compact common footer treatment applied.
- The related-page/left navigation was visually too dominant before the article at mobile widths. **Resolved:** content now comes first; related navigation follows.
- Breadcrumb trail previously stacked into separate lines/chevrons on mobile. **Resolved:** it now wraps as one continuous trail.

**UI Problems Found**
- Primary navigation, persistent Book/Call tray and footer navigation were checked against the common site system. **Final state:** consistent.
- Desktop side navigation could exceed a short viewport. **Resolved:** viewport-aware scrolling is applied.

**UX Problems Found**
- Primary appointment path remains visible through the in-page CTA and persistent Book/Call controls.
- “Explore related pages” remains available above the content so the secondary panel is still discoverable after being moved below the article on mobile.

**Accessibility Problems Found**
- Final responsive check found no horizontal page overflow at 320/375/390/414px.
- Breadcrumb links remain readable/tappable without creating horizontal overflow.

**Recommended Fixes**
- Retain the current common footer/header/action system; avoid page-specific overrides unless clinically necessary.
- Keep desktop navigation sticky/scrollable and mobile navigation after content.
- Keep the normalized breadcrumb flex treatment for legacy procedure pages.

**Priority: HIGH**

## Telehealth With Woolloongabba Medical Centre
**File:** `services/telehealth.html`  
**Page family:** Healthcare service

**Visual Problems Found**
- Shared footer previously consumed too much vertical space on mobile and varied between legacy templates. **Resolved:** compact common footer treatment applied.
- The related-page/left navigation was visually too dominant before the article at mobile widths. **Resolved:** content now comes first; related navigation follows.

**UI Problems Found**
- Primary navigation, persistent Book/Call tray and footer navigation were checked against the common site system. **Final state:** consistent.
- Desktop side navigation could exceed a short viewport. **Resolved:** viewport-aware scrolling is applied.

**UX Problems Found**
- Primary appointment path remains visible through the in-page CTA and persistent Book/Call controls.
- “Explore related pages” remains available above the content so the secondary panel is still discoverable after being moved below the article on mobile.

**Accessibility Problems Found**
- Final responsive check found no horizontal page overflow at 320/375/390/414px.

**Recommended Fixes**
- Retain the current common footer/header/action system; avoid page-specific overrides unless clinically necessary.
- Keep desktop navigation sticky/scrollable and mobile navigation after content.

**Priority: MEDIUM**

## Vaccinations in Woolloongabba
**File:** `services/vaccinations.html`  
**Page family:** Healthcare service

**Visual Problems Found**
- Shared footer previously consumed too much vertical space on mobile and varied between legacy templates. **Resolved:** compact common footer treatment applied.
- The related-page/left navigation was visually too dominant before the article at mobile widths. **Resolved:** content now comes first; related navigation follows.

**UI Problems Found**
- Primary navigation, persistent Book/Call tray and footer navigation were checked against the common site system. **Final state:** consistent.
- Desktop side navigation could exceed a short viewport. **Resolved:** viewport-aware scrolling is applied.

**UX Problems Found**
- Primary appointment path remains visible through the in-page CTA and persistent Book/Call controls.
- “Explore related pages” remains available above the content so the secondary panel is still discoverable after being moved below the article on mobile.

**Accessibility Problems Found**
- Final responsive check found no horizontal page overflow at 320/375/390/414px.

**Recommended Fixes**
- Retain the current common footer/header/action system; avoid page-specific overrides unless clinically necessary.
- Keep desktop navigation sticky/scrollable and mobile navigation after content.

**Priority: MEDIUM**

## Women's Health In Woolloongabba
**File:** `services/womens-health.html`  
**Page family:** Healthcare service

**Visual Problems Found**
- Shared footer previously consumed too much vertical space on mobile and varied between legacy templates. **Resolved:** compact common footer treatment applied.
- The related-page/left navigation was visually too dominant before the article at mobile widths. **Resolved:** content now comes first; related navigation follows.

**UI Problems Found**
- Primary navigation, persistent Book/Call tray and footer navigation were checked against the common site system. **Final state:** consistent.
- Desktop side navigation could exceed a short viewport. **Resolved:** viewport-aware scrolling is applied.

**UX Problems Found**
- Primary appointment path remains visible through the in-page CTA and persistent Book/Call controls.
- “Explore related pages” remains available above the content so the secondary panel is still discoverable after being moved below the article on mobile.

**Accessibility Problems Found**
- Final responsive check found no horizontal page overflow at 320/375/390/414px.

**Recommended Fixes**
- Retain the current common footer/header/action system; avoid page-specific overrides unless clinically necessary.
- Keep desktop navigation sticky/scrollable and mobile navigation after content.

**Priority: MEDIUM**

## Wound Dressings
**File:** `services/wound-dressings.html`  
**Page family:** Healthcare service

**Visual Problems Found**
- Shared footer previously consumed too much vertical space on mobile and varied between legacy templates. **Resolved:** compact common footer treatment applied.
- The related-page/left navigation was visually too dominant before the article at mobile widths. **Resolved:** content now comes first; related navigation follows.
- Breadcrumb trail previously stacked into separate lines/chevrons on mobile. **Resolved:** it now wraps as one continuous trail.

**UI Problems Found**
- Primary navigation, persistent Book/Call tray and footer navigation were checked against the common site system. **Final state:** consistent.
- Desktop side navigation could exceed a short viewport. **Resolved:** viewport-aware scrolling is applied.

**UX Problems Found**
- Primary appointment path remains visible through the in-page CTA and persistent Book/Call controls.
- “Explore related pages” remains available above the content so the secondary panel is still discoverable after being moved below the article on mobile.

**Accessibility Problems Found**
- Final responsive check found no horizontal page overflow at 320/375/390/414px.
- Breadcrumb links remain readable/tappable without creating horizontal overflow.

**Recommended Fixes**
- Retain the current common footer/header/action system; avoid page-specific overrides unless clinically necessary.
- Keep desktop navigation sticky/scrollable and mobile navigation after content.
- Keep the normalized breadcrumb flex treatment for legacy procedure pages.

**Priority: HIGH**

## A local practice with a long view of care.
**File:** `story.html`  
**Page family:** Institution / patient information

**Visual Problems Found**
- Shared footer previously consumed too much vertical space on mobile and varied between legacy templates. **Resolved:** compact common footer treatment applied.
- The related-page/left navigation was visually too dominant before the article at mobile widths. **Resolved:** content now comes first; related navigation follows.

**UI Problems Found**
- Primary navigation, persistent Book/Call tray and footer navigation were checked against the common site system. **Final state:** consistent.
- Desktop side navigation could exceed a short viewport. **Resolved:** viewport-aware scrolling is applied.

**UX Problems Found**
- Primary appointment path remains visible through the in-page CTA and persistent Book/Call controls.
- “Explore related pages” remains available above the content so the secondary panel is still discoverable after being moved below the article on mobile.

**Accessibility Problems Found**
- Final responsive check found no horizontal page overflow at 320/375/390/414px.

**Recommended Fixes**
- Retain the current common footer/header/action system; avoid page-specific overrides unless clinically necessary.
- Keep desktop navigation sticky/scrollable and mobile navigation after content.

**Priority: MEDIUM**

## Allied Health
**File:** `team-allied-health.html`  
**Page family:** Team / care model

**Visual Problems Found**
- Shared footer previously consumed too much vertical space on mobile and varied between legacy templates. **Resolved:** compact common footer treatment applied.
- The related-page/left navigation was visually too dominant before the article at mobile widths. **Resolved:** content now comes first; related navigation follows.
- Practitioner interest summaries were visually small. **Resolved:** supporting team-directory type has been increased.

**UI Problems Found**
- Primary navigation, persistent Book/Call tray and footer navigation were checked against the common site system. **Final state:** consistent.
- Desktop side navigation could exceed a short viewport. **Resolved:** viewport-aware scrolling is applied.

**UX Problems Found**
- Primary appointment path remains visible through the in-page CTA and persistent Book/Call controls.
- “Explore related pages” remains available above the content so the secondary panel is still discoverable after being moved below the article on mobile.

**Accessibility Problems Found**
- Final responsive check found no horizontal page overflow at 320/375/390/414px.

**Recommended Fixes**
- Retain the current common footer/header/action system; avoid page-specific overrides unless clinically necessary.
- Keep desktop navigation sticky/scrollable and mobile navigation after content.
- Keep unavailable-photo states explicit; do not replace them with invented portraits.

**Priority: MEDIUM**

## General Practitioners
**File:** `team-general-practitioners.html`  
**Page family:** Team / care model

**Visual Problems Found**
- Shared footer previously consumed too much vertical space on mobile and varied between legacy templates. **Resolved:** compact common footer treatment applied.
- The related-page/left navigation was visually too dominant before the article at mobile widths. **Resolved:** content now comes first; related navigation follows.
- Practitioner interest summaries were visually small. **Resolved:** supporting team-directory type has been increased.
- Automated geometry detects image-container cropping; manual review confirms the crop is intentional image presentation, not page overflow.

**UI Problems Found**
- Primary navigation, persistent Book/Call tray and footer navigation were checked against the common site system. **Final state:** consistent.
- Desktop side navigation could exceed a short viewport. **Resolved:** viewport-aware scrolling is applied.

**UX Problems Found**
- Primary appointment path remains visible through the in-page CTA and persistent Book/Call controls.
- “Explore related pages” remains available above the content so the secondary panel is still discoverable after being moved below the article on mobile.

**Accessibility Problems Found**
- Final responsive check found no horizontal page overflow at 320/375/390/414px.

**Recommended Fixes**
- Retain the current common footer/header/action system; avoid page-specific overrides unless clinically necessary.
- Keep desktop navigation sticky/scrollable and mobile navigation after content.
- Keep unavailable-photo states explicit; do not replace them with invented portraits.

**Priority: MEDIUM**

## Nursing Team
**File:** `team-nursing.html`  
**Page family:** Team / care model

**Visual Problems Found**
- Shared footer previously consumed too much vertical space on mobile and varied between legacy templates. **Resolved:** compact common footer treatment applied.
- The related-page/left navigation was visually too dominant before the article at mobile widths. **Resolved:** content now comes first; related navigation follows.

**UI Problems Found**
- Primary navigation, persistent Book/Call tray and footer navigation were checked against the common site system. **Final state:** consistent.
- Desktop side navigation could exceed a short viewport. **Resolved:** viewport-aware scrolling is applied.

**UX Problems Found**
- Primary appointment path remains visible through the in-page CTA and persistent Book/Call controls.
- “Explore related pages” remains available above the content so the secondary panel is still discoverable after being moved below the article on mobile.

**Accessibility Problems Found**
- Final responsive check found no horizontal page overflow at 320/375/390/414px.

**Recommended Fixes**
- Retain the current common footer/header/action system; avoid page-specific overrides unless clinically necessary.
- Keep desktop navigation sticky/scrollable and mobile navigation after content.

**Priority: MEDIUM**

## Practice Management
**File:** `team-practice-management.html`  
**Page family:** Team / care model

**Visual Problems Found**
- Shared footer previously consumed too much vertical space on mobile and varied between legacy templates. **Resolved:** compact common footer treatment applied.
- The related-page/left navigation was visually too dominant before the article at mobile widths. **Resolved:** content now comes first; related navigation follows.

**UI Problems Found**
- Primary navigation, persistent Book/Call tray and footer navigation were checked against the common site system. **Final state:** consistent.
- Desktop side navigation could exceed a short viewport. **Resolved:** viewport-aware scrolling is applied.

**UX Problems Found**
- Primary appointment path remains visible through the in-page CTA and persistent Book/Call controls.
- “Explore related pages” remains available above the content so the secondary panel is still discoverable after being moved below the article on mobile.

**Accessibility Problems Found**
- Final responsive check found no horizontal page overflow at 320/375/390/414px.

**Recommended Fixes**
- Retain the current common footer/header/action system; avoid page-specific overrides unless clinically necessary.
- Keep desktop navigation sticky/scrollable and mobile navigation after content.

**Priority: MEDIUM**

## Reception Team
**File:** `team-reception.html`  
**Page family:** Team / care model

**Visual Problems Found**
- Shared footer previously consumed too much vertical space on mobile and varied between legacy templates. **Resolved:** compact common footer treatment applied.
- The related-page/left navigation was visually too dominant before the article at mobile widths. **Resolved:** content now comes first; related navigation follows.

**UI Problems Found**
- Primary navigation, persistent Book/Call tray and footer navigation were checked against the common site system. **Final state:** consistent.
- Desktop side navigation could exceed a short viewport. **Resolved:** viewport-aware scrolling is applied.

**UX Problems Found**
- Primary appointment path remains visible through the in-page CTA and persistent Book/Call controls.
- “Explore related pages” remains available above the content so the secondary panel is still discoverable after being moved below the article on mobile.

**Accessibility Problems Found**
- Final responsive check found no horizontal page overflow at 320/375/390/414px.

**Recommended Fixes**
- Retain the current common footer/header/action system; avoid page-specific overrides unless clinically necessary.
- Keep desktop navigation sticky/scrollable and mobile navigation after content.

**Priority: MEDIUM**

## Healthcare is strongest when people work together.
**File:** `team.html`  
**Page family:** Team / care model

**Visual Problems Found**
- Shared footer previously consumed too much vertical space on mobile and varied between legacy templates. **Resolved:** compact common footer treatment applied.

**UI Problems Found**
- Primary navigation, persistent Book/Call tray and footer navigation were checked against the common site system. **Final state:** consistent.

**UX Problems Found**
- Primary appointment path remains visible through the in-page CTA and persistent Book/Call controls.

**Accessibility Problems Found**
- Final responsive check found no horizontal page overflow at 320/375/390/414px.

**Recommended Fixes**
- Retain the current common footer/header/action system; avoid page-specific overrides unless clinically necessary.

**Priority: LOW**

## Telehealth
**File:** `telehealth.html`  
**Page family:** Institution / patient information

**Visual Problems Found**
- Shared footer previously consumed too much vertical space on mobile and varied between legacy templates. **Resolved:** compact common footer treatment applied.
- The related-page/left navigation was visually too dominant before the article at mobile widths. **Resolved:** content now comes first; related navigation follows.

**UI Problems Found**
- Primary navigation, persistent Book/Call tray and footer navigation were checked against the common site system. **Final state:** consistent.
- Desktop side navigation could exceed a short viewport. **Resolved:** viewport-aware scrolling is applied.

**UX Problems Found**
- Primary appointment path remains visible through the in-page CTA and persistent Book/Call controls.
- “Explore related pages” remains available above the content so the secondary panel is still discoverable after being moved below the article on mobile.

**Accessibility Problems Found**
- Final responsive check found no horizontal page overflow at 320/375/390/414px.

**Recommended Fixes**
- Retain the current common footer/header/action system; avoid page-specific overrides unless clinically necessary.
- Keep desktop navigation sticky/scrollable and mobile navigation after content.

**Priority: MEDIUM**

## Test Results
**File:** `test-results.html`  
**Page family:** Institution / patient information

**Visual Problems Found**
- Shared footer previously consumed too much vertical space on mobile and varied between legacy templates. **Resolved:** compact common footer treatment applied.
- The related-page/left navigation was visually too dominant before the article at mobile widths. **Resolved:** content now comes first; related navigation follows.

**UI Problems Found**
- Primary navigation, persistent Book/Call tray and footer navigation were checked against the common site system. **Final state:** consistent.
- Desktop side navigation could exceed a short viewport. **Resolved:** viewport-aware scrolling is applied.

**UX Problems Found**
- Primary appointment path remains visible through the in-page CTA and persistent Book/Call controls.
- “Explore related pages” remains available above the content so the secondary panel is still discoverable after being moved below the article on mobile.

**Accessibility Problems Found**
- Final responsive check found no horizontal page overflow at 320/375/390/414px.

**Recommended Fixes**
- Retain the current common footer/header/action system; avoid page-specific overrides unless clinically necessary.
- Keep desktop navigation sticky/scrollable and mobile navigation after content.

**Priority: MEDIUM**

## After-hours care when we are closed
**File:** `updates/after-hours-care-options.html`  
**Page family:** Updates

**Visual Problems Found**
- Shared footer previously consumed too much vertical space on mobile and varied between legacy templates. **Resolved:** compact common footer treatment applied.
- Updates retain a more editorial/image-led treatment than authority pages; common header/footer/booking systems preserve continuity.

**UI Problems Found**
- Primary navigation, persistent Book/Call tray and footer navigation were checked against the common site system. **Final state:** consistent.

**UX Problems Found**
- Primary appointment path remains visible through the in-page CTA and persistent Book/Call controls.

**Accessibility Problems Found**
- Final responsive check found no horizontal page overflow at 320/375/390/414px.

**Recommended Fixes**
- Retain the current common footer/header/action system; avoid page-specific overrides unless clinically necessary.

**Priority: LOW**

## Practice update
**File:** `updates/article.html`  
**Page family:** Updates

**Visual Problems Found**
- Shared footer previously consumed too much vertical space on mobile and varied between legacy templates. **Resolved:** compact common footer treatment applied.
- Updates retain a more editorial/image-led treatment than authority pages; common header/footer/booking systems preserve continuity.

**UI Problems Found**
- Primary navigation, persistent Book/Call tray and footer navigation were checked against the common site system. **Final state:** consistent.

**UX Problems Found**
- Primary appointment path remains visible through the in-page CTA and persistent Book/Call controls.

**Accessibility Problems Found**
- Final responsive check found no horizontal page overflow at 320/375/390/414px.

**Recommended Fixes**
- Retain the current common footer/header/action system; avoid page-specific overrides unless clinically necessary.

**Priority: LOW**

## Current billing information
**File:** `updates/current-billing-information.html`  
**Page family:** Updates

**Visual Problems Found**
- Shared footer previously consumed too much vertical space on mobile and varied between legacy templates. **Resolved:** compact common footer treatment applied.
- Updates retain a more editorial/image-led treatment than authority pages; common header/footer/booking systems preserve continuity.

**UI Problems Found**
- Primary navigation, persistent Book/Call tray and footer navigation were checked against the common site system. **Final state:** consistent.

**UX Problems Found**
- Primary appointment path remains visible through the in-page CTA and persistent Book/Call controls.

**Accessibility Problems Found**
- Final responsive check found no horizontal page overflow at 320/375/390/414px.

**Recommended Fixes**
- Retain the current common footer/header/action system; avoid page-specific overrides unless clinically necessary.

**Priority: LOW**

## Healthcare updates and practical information from our team.
**File:** `updates/index.html`  
**Page family:** Updates

**Visual Problems Found**
- Shared footer previously consumed too much vertical space on mobile and varied between legacy templates. **Resolved:** compact common footer treatment applied.
- Updates retain a more editorial/image-led treatment than authority pages; common header/footer/booking systems preserve continuity.

**UI Problems Found**
- Primary navigation, persistent Book/Call tray and footer navigation were checked against the common site system. **Final state:** consistent.

**UX Problems Found**
- Primary appointment path remains visible through the in-page CTA and persistent Book/Call controls.

**Accessibility Problems Found**
- Final responsive check found no horizontal page overflow at 320/375/390/414px.

**Recommended Fixes**
- Retain the current common footer/header/action system; avoid page-specific overrides unless clinically necessary.

**Priority: LOW**

## New patients are welcome
**File:** `updates/new-patients-welcome.html`  
**Page family:** Updates

**Visual Problems Found**
- Shared footer previously consumed too much vertical space on mobile and varied between legacy templates. **Resolved:** compact common footer treatment applied.
- Updates retain a more editorial/image-led treatment than authority pages; common header/footer/booking systems preserve continuity.

**UI Problems Found**
- Primary navigation, persistent Book/Call tray and footer navigation were checked against the common site system. **Final state:** consistent.

**UX Problems Found**
- Primary appointment path remains visible through the in-page CTA and persistent Book/Call controls.

**Accessibility Problems Found**
- Final responsive check found no horizontal page overflow at 320/375/390/414px.

**Recommended Fixes**
- Retain the current common footer/header/action system; avoid page-specific overrides unless clinically necessary.

**Priority: LOW**

## Appointments available seven days a week
**File:** `updates/open-seven-days.html`  
**Page family:** Updates

**Visual Problems Found**
- Shared footer previously consumed too much vertical space on mobile and varied between legacy templates. **Resolved:** compact common footer treatment applied.
- Updates retain a more editorial/image-led treatment than authority pages; common header/footer/booking systems preserve continuity.

**UI Problems Found**
- Primary navigation, persistent Book/Call tray and footer navigation were checked against the common site system. **Final state:** consistent.

**UX Problems Found**
- Primary appointment path remains visible through the in-page CTA and persistent Book/Call controls.

**Accessibility Problems Found**
- Final responsive check found no horizontal page overflow at 320/375/390/414px.

**Recommended Fixes**
- Retain the current common footer/header/action system; avoid page-specific overrides unless clinically necessary.

**Priority: LOW**

## Telehealth appointments
**File:** `updates/telehealth-appointments.html`  
**Page family:** Updates

**Visual Problems Found**
- Shared footer previously consumed too much vertical space on mobile and varied between legacy templates. **Resolved:** compact common footer treatment applied.
- Updates retain a more editorial/image-led treatment than authority pages; common header/footer/booking systems preserve continuity.

**UI Problems Found**
- Primary navigation, persistent Book/Call tray and footer navigation were checked against the common site system. **Final state:** consistent.

**UX Problems Found**
- Primary appointment path remains visible through the in-page CTA and persistent Book/Call controls.

**Accessibility Problems Found**
- Final responsive check found no horizontal page overflow at 320/375/390/414px.

**Recommended Fixes**
- Retain the current common footer/header/action system; avoid page-specific overrides unless clinically necessary.

**Priority: LOW**

## Why team-based care matters.
**File:** `why-team-based-care-matters.html`  
**Page family:** Team / care model

**Visual Problems Found**
- Shared footer previously consumed too much vertical space on mobile and varied between legacy templates. **Resolved:** compact common footer treatment applied.
- The related-page/left navigation was visually too dominant before the article at mobile widths. **Resolved:** content now comes first; related navigation follows.

**UI Problems Found**
- Primary navigation, persistent Book/Call tray and footer navigation were checked against the common site system. **Final state:** consistent.
- Desktop side navigation could exceed a short viewport. **Resolved:** viewport-aware scrolling is applied.

**UX Problems Found**
- Primary appointment path remains visible through the in-page CTA and persistent Book/Call controls.
- “Explore related pages” remains available above the content so the secondary panel is still discoverable after being moved below the article on mobile.

**Accessibility Problems Found**
- Final responsive check found no horizontal page overflow at 320/375/390/414px.

**Recommended Fixes**
- Retain the current common footer/header/action system; avoid page-specific overrides unless clinically necessary.
- Keep desktop navigation sticky/scrollable and mobile navigation after content.

**Priority: MEDIUM**

# Final design verdict
The website is visually coherent and institutionally mature after the repair pass. The largest patient-facing inconsistency was the mobile secondary-navigation order, not the underlying brand system. That has been corrected. The remaining meaningful visual dependencies are clinician photography and Dr Mary Abadir’s individual HotDoc destination; these should be resolved only with verified real source material. No homepage redesign, new homepage section, clinician face alteration or content deletion was required.