# WMC Patient App — Phase 4A-B Accessibility Remediation

**Date:** 2026-11-12  
**Base tip:** `269df5a`  
**Branch:** `feat/wmc-phase4ab-a11y`  
**Scope:** A11Y-001, A11Y-002, A11Y-003 only (safe corrections; design system preserved).

---

## A. Accessibility fixes implemented

| ID | Fix | Files |
| --- | --- | --- |
| **A11Y-001** | Preferred GP share mount starts `hidden` + `aria-hidden="true"`; button `disabled` + `tabindex="-1"` until `wmc.preferredGp.v1` has `profilePath`. Sync script reveals/enables on save and re-hides on remove. | `patient-share-practitioner.ts` (+ test) |
| **A11Y-002** | Dock-equivalent `aria-label="Open Digital Reception — ask for information"` on hub/practice DR controls via fixtures + SSR `ensureDigitalReceptionOpenAriaLabels` **scoped to `patient-hub.html` / `practice-information-hub.html`** (preserves golden homepage hero) + primary DR card. | `patient-hub-digital-reception.ts`, `patient-practice-info-hub.ts`, fixtures |
| **A11Y-003** | `.patient-preferred-gp-actions` Change/Remove/View profile links get `min-height/min-width: 44px` + inline-flex centering in dashboard style block. | `public-ux.ts` `PATIENT_DASHBOARD_STYLE` |

No new features. No redesign. Booking policies / Trust Facts / share surfaces unchanged except empty Preferred GP share no longer focusable.

---

## B. Before / after evidence

### A11Y-001

| Before | After |
| --- | --- |
| `.wmc-preferred-gp-share-mount` always in DOM and tab order with empty `data-share-url` → SR/keyboard hit “Sharing unavailable” | Mount `hidden` until Preferred GP saved; button disabled / out of tab order; sync reveals on `wmc:preferred-gp-changed` |

**Unit:** `patient-share-practitioner.test.ts` asserts `hidden`, `aria-hidden`, `disabled`, and sync `setMountVisible`.

### A11Y-002

| Before | After |
| --- | --- |
| Hub/practice `[data-open-digital-reception]` buttons relied on visible text only; dock/quicknav already had richer `aria-label` | Same dock string applied to fixtures + SSR normalizer for any missing label |

**Unit:** hub + practice-info tests assert dock aria-label; aria-label helper idempotent.

### A11Y-003

| Before | After |
| --- | --- |
| `.text-link` Change/Remove ~line-height only (&lt;44px) | `min-height:44px; min-width:44px; display:inline-flex; align-items:center` under `.patient-preferred-gp-actions` |

---

## C. WCAG observations

| Criterion | Observation |
| --- | --- |
| **2.1.1 Keyboard** | Empty Preferred GP share removed from tab order (A11Y-001). |
| **2.4.3 Focus order** | Share control appears only when a GP exists — no dead-end control. |
| **4.1.2 Name, Role, Value** | DR open controls share dock accessible name (A11Y-002). Visible “Digital Reception” remains; `aria-label` provides consistent purpose phrasing with dock/quicknav. |
| **2.5.5 Target Size (AAA) / 2.5.8 (AA ~24px)** | Preferred GP secondary actions meet 44×44 CSS minimum (A11Y-003). |
| **1.4.3 Contrast** | No colour changes; existing design tokens retained. |
| **1.3.1 Info and relationships** | Heading hierarchy untouched; Preferred GP region still `role="region"` + `aria-live="polite"`. |
| **Residual minors** | A11Y-004–006 / UX-002 install tip sizing remain **minor** — not closed in 4A-B majors pass. |

**Physical T3:** keyboard tab-order + VoiceOver/TalkBack still required on device checklists (Agent 3) before production cutover; this pack closes **code** majors for A11Y-001–003.
