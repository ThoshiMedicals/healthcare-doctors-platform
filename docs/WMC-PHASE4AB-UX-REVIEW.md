# WMC Patient App Phase 4A-B — UX Review

| Field | Value |
| --- | --- |
| Agent | 2 — Patient App UX Review |
| Branch | `feat/wmc-phase4ab-ux` |
| Worktree | `C:\Users\RoshanSamarawickrema\Desktop\WMC-phase4ab-ux` |
| Base tip | `269df5a` |
| Scope | Dashboard, Preferred GP, Practice Information Hub, Digital Reception, Install Experience, Share Actions |
| Constraint | **Low-risk only** (copy / aria / micro-CSS). No redesign, no new features, no notifications/analytics |
| A11Y ownership | A11Y-001 / 002 / 003 owned by Agent 1 — this agent does **not** edit `patient-share-practitioner.ts`, preferred-share mount in `patient-hub-digital-reception.ts`, or Preferred GP touch-target CSS in `public-ux` `PATIENT_DASHBOARD_STYLE` |
| Authority defects | `docs/WMC-PHASE4A-ACCESSIBILITY-UX.md` |

**Verdict:** Workflows are coherent for Phase 3A–3D contracts. Friction is concentrated in **dead-end preferred-GP share**, **small PWA labels**, **overlapping “Patient / Practice Information” naming**, and **install copy that overclaims Digital Reception**. No product blockers beyond Agent 1’s major A11Y/UX defects. This deliverable is **documentation only**.

---

## A. UX findings

Evidence: fixture HTML (`patient-hub.html`, `practice-information-hub.html`, `install-wmc-app.html`), injectors (`public-ux.ts`, `patient-hub-digital-reception.ts`, `patient-practice-info-hub.ts`, `patient-install-prompt.ts`, share modules), and prior audit `WMC-PHASE4A-ACCESSIBILITY-UX.md`.

### A.1 Patient Hub (dashboard)

| ID | Finding | Severity | Notes |
| --- | --- | --- | --- |
| UX-001 | **Share my preferred GP** is offered before a GP is saved → activate yields “Sharing unavailable” | **Major** | Same as authority UX-001 / A11Y-001. Confusing empty-state workflow; Agent 1 owns hide-until-set. |
| UX-003 | Three Digital Reception entries on one scroll (task-grid primary card, reception-row button, sticky dock “Ask us”) | **Minor** | Good discoverability; crowded on small phones. Accept as intentional triple-entry unless T3 shows confusion. |
| UX-008 | Secondary grid places **Patient Information** and **Practice Information** side by side with overlapping mental models | **Minor** | Card teasers differ (“Forms, billing…” vs “Contact, hours…”) but titles rhyme; first-time users may open the wrong hub. |
| — | Quick actions hierarchy (Book → DR + Call → Preferred GP) is scannable; empty GP copy (“on this device”) is clear | **PASS** | |
| — | Practice strip below fold duplicates contact/hours already reachable via Practice Information / footer | **Acceptable** | Trust-facts SSOT strip; not a workflow dead-end. |

### A.2 My Preferred GP

| ID | Finding | Severity | Notes |
| --- | --- | --- | --- |
| UX-004 | Change / Remove use low-emphasis `.text-link` controls | **Major** | Pairs with A11Y-003; motor/discoverability friction. Agent 1 owns 44px CSS. |
| — | Empty → picker → “Save on this device” is a clear single-purpose flow | **PASS** | Device-local framing reduces “account” expectation. |
| UX-001 | Share control not co-located with Change/Remove action row; SSR mount can appear while panel empty | **Major** | Agent 1 share sync / visibility. |

### A.3 Practice Information Hub

| ID | Finding | Severity | Notes |
| --- | --- | --- | --- |
| UX-005 | **Contact** and **Directions** both target `contact.html` (Directions lacks `#` deep-link; Contact has no map-only destination) | **Minor** | Teaser copy differs; still feels like two cards for one page. Optional: point Directions at maps deep-link or `contact.html` map section if one exists — IA polish only. |
| — | Nine-topic grid maps to Trust Facts routes; reception row returns to Patient Hub | **PASS** | Low navigation friction back to dashboard. |
| A11Y-002 | Reception-row Digital Reception button lacks dock-equivalent `aria-label` | **Major** | Agent 1; visible label alone is OK for sighted users. |

### A.4 Digital Reception

| ID | Finding | Severity | Notes |
| --- | --- | --- | --- |
| UX-003 | Dock compact label **Ask us** vs full **Digital Reception** elsewhere | **Minor** | Compact dock is useful; first-time users may not equate “Ask us” with the hub DR card. |
| UX-007 | Install landing benefit copy says Digital Reception lets you “**Message our team** without waiting on hold when supported” | **Major** (copy) | DR is information/search routing, not a messaging channel. Overclaim risks trust and wrong expectations. |
| — | Hub primary card span (“Search the site or ask for the next step”) matches product intent better than install landing | **PASS** (hub) | Prefer this framing everywhere. |
| — | Hash `#digital-reception` opens via launcher; dialog pattern (focus trap, Escape) intact per prior A11Y | **PASS** | |

### A.5 Install experience

| ID | Finding | Severity | Notes |
| --- | --- | --- | --- |
| UX-006 | Floating install tip competes with Book/Call care dock on first visit | **Minor** | 14-day dismiss + delayed show mitigate; leave layout alone in 4A-B. |
| UX-007 | Install tip + landing overstate / soft-brand DR and tip uses “**Gabba Medical**” while pages say Woolloongabba Medical Centre | **Minor–Major** | Tip strings in `patient-install-prompt.ts`; landing fixture benefit list. Brand + capability clarity only — no new install UI. |
| A11Y-005 | Tip Install / Not now padding below 44px convention | **Minor** | Agent 1 / shared polish; not claimed here. |
| — | Dedicated `install-wmc-app.html` with desktop QR → phone handoff is clear | **PASS** | Path to Patient Hub after install is explicit. |

### A.6 Share actions

| ID | Finding | Severity | Notes |
| --- | --- | --- | --- |
| UX-001 | Preferred GP share dead-end (see A.1) | **Major** | Agent 1. |
| UX-010 | Failure string is generic **“Sharing unavailable”** for empty preferred-GP URL and true clipboard/share failure | **Minor** | Same live-region message; users cannot tell “choose a GP first” vs “browser blocked share”. Prefer Agent 1 hide control; optional distinct message only if still shown. |
| — | Doctor / practice / team labels (“Share profile”, “Share this page”) are secondary and context-aware | **PASS** | Matches Phase 3D intent. |
| — | Practice surfaces may offer **Share phone** secondary — useful but easy to miss vs primary page share | **Acceptable** | No layout change. |

### A.7 PWA standalone quicknav

| ID | Finding | Severity | Notes |
| --- | --- | --- | --- |
| UX-002 | Visible labels at **~10.5px** (Doctors / Services / Reception / Contact) | **Major** | Authority UX-002 / A11Y-005; hard for older adults. `aria-label` helps SR only. |
| UX-009 | Quicknav has Book / Doctors / Services / Reception / Contact — **no Patient Hub / dashboard** return | **Minor** | From deep pages in standalone, returning to Preferred GP / hub tasks requires browser chrome or primary nav (menu). Discoverability gap for the “app home”. |
| — | Quicknav only in `display-mode: standalone` avoids browser clutter | **PASS** | |

---

## B. Improvements implemented

**None — deferred to A11Y agent / recommendations only.**

Rationale:

- Majors UX-001 / UX-004 / A11Y-002 collide with Agent 1’s owned files and touch-target CSS.
- Remaining items are copy/IA notes or evidence (T2/T3) that should not fork the integration tip without Agent 1 coordination.
- Per Phase 4A-B brief: docs-only is preferred when overlap risk is material.

---

## C. Remaining recommendations

Limited to existing Phase 3A–3D contracts. Ordered by patient impact.

| Priority | ID | Recommendation | Owner |
| --- | --- | --- | --- |
| P0 | UX-001 / A11Y-001 | Hide preferred-GP share until a valid stored GP exists; sync with client action row | Agent 1 (A11Y) |
| P0 | UX-004 / A11Y-003 | 44px min-height for Preferred GP Change/Remove (and related action buttons) | Agent 1 (A11Y) |
| P0 | A11Y-002 | Match dock `aria-label` on hub/practice `[data-open-digital-reception]` buttons | Agent 1 (A11Y) |
| P1 | UX-007 | Rewrite install landing DR benefit + tip copy to information/search framing (align with hub: “Search the site or ask for the next step”); prefer full practice name over “Gabba Medical” in tip | Content / follow-up micro-copy (not Agent 1 collision if limited to `install-wmc-app.html` + `patient-install-prompt.ts`) |
| P1 | UX-002 / A11Y-005 | Raise PWA quicknav visible label size (≥12px) and install tip control height (≥44px) | A11Y / public-ux style blocks |
| P2 | UX-008 | Differentiate hub card titles or teasers further (e.g. “Patient forms & policies” vs “Hours, parking & access”) without new routes | Content polish |
| P2 | UX-005 | Differentiate Directions destination (maps deep-link or hash) or soften card to avoid twin Contact cards | Practice hub IA |
| P2 | UX-009 | Optional sixth quicknav item or replace Contact with **Hub** / **Home** linking `patient-hub.html` — only after standalone UX test (layout risk) | PWA nav (later; not 4A-B low-risk) |
| P2 | UX-003 / UX-006 | Keep triple DR + install tip as **accepted** unless T3 physical shows confusion | Release notes / QA |
| P2 | UX-010 | If share remains visible empty, announce “Choose a preferred GP first” instead of generic unavailable | Agent 1 share sync (only if hide-until-set slips) |
| Evidence | T2 / T3 | Emulated keyboard tab order + physical AT on install tip, DR, Preferred GP, share | Agents 1–2 / QA |

**Product blockers from this UX pass:** none beyond Agent 1 majors already on the defect register.  
**Do not ship layout redesigns or new features in 4A-B.**

---

## D. Surfaces ↔ artifacts

| Surface | Primary artifacts |
| --- | --- |
| Patient Hub | `fixtures/patient-hub.html`, `public-ux.ts` (`refinePatientHubDashboard`), `patient-hub-digital-reception.ts` |
| Preferred GP | `public/patient-preferred-gp.js`, hub `#preferred-gp-panel` |
| Practice Information Hub | `fixtures/practice-information-hub.html`, `patient-practice-info-hub.ts` |
| Digital Reception | `public/digital-reception.js`, dock + `[data-open-digital-reception]` |
| Install | `fixtures/install-wmc-app.html`, `patient-install-prompt.ts`, Android/iOS injectors |
| Share | `patient-share-core.ts`, `patient-share.js`, practitioner/practice/services injectors |
| PWA quicknav | `public-ux.ts` (`injectPatientPwaStandaloneNav`) |

---

## E. References

- `docs/WMC-PHASE4A-ACCESSIBILITY-UX.md` — authority defect IDs
- `docs/WMC-PHASE3D-UX-ACCESSIBILITY.md` — share placement / label baseline
- `docs/WMC-PHASE4A-PATIENT-APP-ACCEPTANCE.md` — acceptance posture

---

*Agent 2 (Phase 4A-B) — UX review. Docs only. No push / no deploy.*
