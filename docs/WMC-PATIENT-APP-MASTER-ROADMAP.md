# WMC Patient App - Master Roadmap

**Version:** 1.2 (repo-canonical) | **Originally recorded:** 12 November 2026 | **Status updated:** 13 November 2026 | **Programme:** Woolloongabba Medical Centre website and PWA

> **Canonical Patient App programme plan** for this repository. Do not create a competing roadmap. Platform architecture remains `docs/WMC-MASTER-BRAIN.md`; practice facts remain `docs/WMC-TRUST-FACTS-REGISTER.md`; live tip/hosting remains `.cursor/rules/wmc-working-memory.mdc`.

## Status and scope

This document consolidates the current Patient Hub and website work with all approved *roadmap ideas* discussed for HotDoc integration, WMC patient communications, push notifications, patient inbox, verified messaging, adoption, measurement and SMS-cost reduction. **Roadmap entry does not mean engineering, database, deployment or clinical approval.** New phases remain future work unless separately authorised.

**Latest verified Hostinger staging release:** `2634ca2b50a8d7a3d0caa1af206402f62401eaec` (Hostinger build `01a1d1f7-c5c2-736a-9772-1449b28a20e8`). Branch `release/wmc-patient-app-visual-excellence` (backed up on GitHub). Phase A Patient Hub mobile dashboard **and** targeted UI polish are **STAGING VERIFIED** at this SHA. Evidence: `docs/WMC-PATIENT-HUB-MOBILE-DASHBOARD-STAGING-REPORT.md`, `docs/WMC-PATIENT-HUB-UI-POLISH-STAGING-REPORT.md`, `docs/phase4a-evidence/patient-hub-dashboard-20261112/`, `docs/phase4a-evidence/patient-hub-ui-polish-20261113/`. Recheck the live SHA before future work.

**Production:** `gabbamedicalcentre.com.au` is not authorised for cutover. **Primary staging:** `staging.gabbamedicalcentre.com.au`. **Secondary staging:** `mediumslateblue-eagle-960503.hostingersite.com`.

## 1. Non-negotiable architecture and clinical boundaries

- **HotDoc remains the source of truth for appointment creation, availability, confirmations, cancellations, rescheduling and related integration with clinical practice software.** Keep current approved HotDoc booking URLs and doctor-specific booking policies; never create an independent booking database or a shadow booking workflow.
- Explore an **official HotDoc website booking widget** in the WMC PWA, subject to verifying the specific HotDoc account's available embed options, supported provider/doctor configuration, device behaviour, authentication, cookie policy, CSP, and supplier conditions. If safe embedding is not supported, retain reliable HotDoc external booking links. Do not scrape HotDoc, reverse engineer private APIs or claim HotDoc exposes patient/appointment data to WMC.
- HotDoc remains responsible for its existing **clinical appointment messaging, reminders, recalls, results and booking-related communication** until a separate clinically governed integration is explicitly approved. An app announcement is not equivalent to an appointment reminder or clinical recall.
- WMC PWA continues to use **Next.js 15, custom CMS, Auth.js for staff where applicable, Prisma/PostgreSQL (Supabase as database host), HotDoc, Digital Reception, service worker/PWA**. Do not assume Supabase Auth, Supabase Storage or supabase-js exist in the architecture.
- Preserve WMC/Healthcare Doctors branding, the Trust Facts Register, SEO, approved URLs, seven-item primary navigation, practitioner authority, service relationships, all 15 published profiles, booking rules, recruitment HOLD, and existing accessibility/PWA fixes.
- **A locally saved Preferred GP is a convenience preference, not proof of patient identity.** LocalStorage is host-specific and does not authorize private patient messaging.
- No production deployment/DNS changes under this roadmap. The prior one-off staging database backup waiver covered only the completed three-page publication. **All future database changes require separate approval, transactional controls and a tested backup/recovery plan.**

## 2. Programme goals and success measures

**Patient value:** one accessible WMC hub for HotDoc appointments, favourite GP access, Digital Reception, practice details, trusted medical education and opted-in notices. Make the app useful enough that patients choose to add it to their Home Screen.

**Practice value:** improve patient communication reach and timely access to general practice updates, measure inbox engagement, and reduce appropriate SMS campaign spend without weakening clinical safety or patient choice.

**Measured outcomes, not promises:** eligible visits, install-guide visits, installation starts/completions where technically observable, active installed clients (estimated, privacy-preserving), notification permission opt-ins, active subscriptions, announcement audience size, push-service acceptance, in-app opens, explicit acknowledgements, unsubscribe rates, delivery errors, SMS avoided when demonstrable, and estimated dollar savings against a documented cost baseline.

Never claim guaranteed push delivery, reading, understanding, identified-patient reach, or SMS savings without data. Push-provider acceptance does not establish delivery to a device; message open does not establish comprehension.

## 3. Current acceptance baseline / preserve all completed work

### Already reported functional staging acceptance (verify again after changes)
- Patient Hub `/patient-hub.html`, Practice Information Hub `/practice-information-hub.html`, Install WMC App `/install-wmc-app.html` published and returning 200 on both staging aliases.
- Preferred GP selection/persistence verified; Digital Reception working; 15 practitioner pages working.
- Mobile-only **page-level** Share control below 768px; hidden and not keyboard-focusable from 768px upwards. The share correction was deployed in `fdd9bf2` and preserved through the subsequently reported `6f08dde` QA.
- iPhone install overlay D2 reported resolved in the latest re-audit; verify against real devices before final acceptance.
- PWA assets/install flows, noindex on both staging hosts and known Auth.js custom-hostname callback defect documented separately.
- Completed Strategic Recovery phases, practitioner authority, Trust Facts, Phase 3A-3D / 4A / 4A-B accessibility and Master QA must not regress.

### Latest Patient Hub implementation status (Phase A — STAGING VERIFIED)

**Status:** **STAGING VERIFIED** at SHA `2634ca2` (dashboard baseline `c08e91e` / `42121c3` lineage; polish tip `2634ca2`).

Approved mobile Patient Hub design: compact WMC header; “Your care, made easier”; prominent My Preferred GP card with saved doctor; four quick action cards (Book Appointment, Digital Reception, Find a Doctor, Health Information); state-aware Install WMC App card; expandable practice/contact/hours/after-hours details; accessible bottom dock (Book, Call, Digital Reception); no duplicate buttons, blank space, obscured content or unnecessarily full desktop footer. Verified polish: Preferred GP heading/picker rows/full-width select, quick-action icons, safe-area dock, solid install-card border, reduced post-footer dock padding. Screenshots at 320, 390, 430, 768, 1024, 1440px; staging hosts checked; no unrelated CMS or production writes. Retain the exact rollback package. Physical-device / production acceptance remain separate gates (not Phase A blockers for starting Phase B planning).

## 4. Sequenced development roadmap

### Phase A - Patient Hub mobile dashboard — **STAGING VERIFIED** (`2634ca2`)

**Status:** **STAGING VERIFIED** — 13 November 2026. Hostinger staging SHA `2634ca2b50a8d7a3d0caa1af206402f62401eaec`; build `01a1d1f7-c5c2-736a-9772-1449b28a20e8`. GitHub backup on `release/wmc-patient-app-visual-excellence`.

**Deliverables (complete on staging):** Approved mobile-first dashboard, code-only public-ux refinements (Class B CMS HTML preserved), installation overlays/non-overlap, responsive screenshots, keyboard and device-safe-area handling, booking policies, noindex, sharing, Preferred GP, Digital Reception and full site features preserved. Targeted UI polish included in the same verified tip.

**Gate (met for staging):** Requirement-by-requirement visual acceptance; build and unit tests; Hostinger staging release SHA + rollback retained. Production cutover remains **NO-GO**.

### Phase B - HotDoc compatibility and install/adoption funnel (next design phase)

**HotDoc workstream:**
1. Audit existing doctor-specific HotDoc URLs and current website integration; confirm supported official embed/widget options from HotDoc documentation/provider support, including doctor/location filtering and handling of phone-only bookings.
2. Compare official widget, browser redirect and deep-link approaches for mobile browser and installed PWA; retain current links as fallback.
3. Test real booking journey without creating actual appointments; check mobile dimensions, focus, cross-origin restrictions, external redirects, cookies, errors, return-to-app behaviour, and accessible loading/empty states.
4. Maintain HotDoc-owned booking, cancellation, rescheduling, reminders and integration with clinical software. **Do not imply WMC can access HotDoc patient IDs, appointments or message status without separately confirmed contractual API access.**

**Install/adoption workstream:**
1. Homepage Patient App benefits + visible CTA; Patient Hub, Preferred GP, Digital Reception and Practice Information shortcuts through existing navigation, footer, utilities and mobile areas.
2. Compact installation information at the right moment with **Android** prompt/instructions, **iPhone Safari -> Add to Home Screen -> Open as Web App where supported**, and **desktop QR code** to existing WMC install route.
3. Preserve installation-state detection, existing 14-day cooldown, explicit dismissal and a non-obstructive overlay. Offer installation; never gate essential services behind it.
4. Patient-facing benefits: HotDoc booking, preferred GP, quick access to Digital Reception/practice information, health education, content sharing, and *only once launched* opted-in practice notifications. Do not promote unfinished notification functionality.
5. In-practice onboarding assets: reception counter QR, waiting-room poster, new-patient info, permitted existing communication invitation, suitable approved HotDoc touchpoints, practitioner profile/appointment journey prompts and staff briefing. No intrusive forced install.

**Gate:** Tested official HotDoc integration or retained links; accessibility; iOS/Android/desktop walkthrough; no false feature claims.

### Phase C - Consent, push foundation and notification preferences (future engineering)

Build a **general-announcement-only** web push foundation initially. Before implementing database schema or third-party messaging services, secure written implementation/security/privacy approval and verified backup/recovery.

- Service-worker compatible Web Push support with appropriately secured application server keys; avoid breaking existing PWA caching, security headers and deployments.
- Explicit, contextual user activation before requesting browser notification permission; never request permission on page load. Explain why patients should opt in and how to disable it.
- Detect browser/install eligibility: iOS requires supported Home Screen web app and explicit permission; other browsers vary. Fall back to the in-app inbox and public WMC pages.
- Per-installation subscriptions scoped to the WMC clinic, minimal data, token lifecycle, unsubscribe, expired-subscription cleanup, duplicate suppression, opt-in history, preference categories and audit log.
- Initially avoid identifying devices as named patients. Protect keys, endpoint records, staff operations and rate limits; no secrets in browser or Git.
- Public general announcements vs optional promotional/educational campaigns must have distinct consent and opt-out treatment.

**Gate:** Security, privacy/legal/clinical governance sign-off, operational rollback, tested subscription lifecycle, physical Android/iPhone tests before public launch.

### Phase D - WMC announcements, in-app inbox and Patient Engagement Admin Panel (future engineering)

**Patient experience:**
- In-app Notification Inbox with latest and archived notices, unread count, read/open state tied to an appropriate scope, message history, categories, clear title/body/action, expiry and accessible detail view.
- Push alerts for subscribed devices that open the corresponding announcement in the WMC inbox; public general notices only in initial release, with no patient medical details on lock screen.
- Topics may include public holiday hours, closures, parking/access disruptions, welcoming a new GP, approved service updates, health education and clinic events; classify any promotions and obtain appropriate consent.
- Provide notification preferences, unsubscribe controls and a fallback to seeing notices on the WMC website without installing the app.

**Staff experience — Patient Engagement Admin Panel (extend the existing WMC CMS and Auth.js, not a standalone admin product):**
- Dashboard for authorised staff with real, clearly labelled metrics: app adoption, active push subscriptions, announcement reach, in-app opens/acknowledgements, failed subscriptions and SMS-saving estimates. Do not fabricate metrics or imply anonymous devices are identified patients.
- **Notifications & Campaigns:** create/edit drafts, preview, approve, schedule, publish, expire, retract, categorise and target general announcements to the appropriate opted-in clinic audience; maintain clear operational versus promotional consent rules.
- **Patient Inbox management:** review the public announcement feed, message history, corrections, expirations and visible patient-facing links; do not access private clinical messages in the initial release.
- **Subscribers & Consent:** administer topic preferences, subscription lifecycle, opt-in/opt-out evidence and retention policies with least-privilege access; avoid unnecessary named-patient records.
- **Delivery & Engagement:** separate queued/attempted, push-service accepted/rejected, in-app opened and authenticated acknowledged statuses; show failures/retries and duplicate suppression.
- **App Adoption & Costs:** monitor install-guide usage, active installed clients where measurable, push opt-ins, message engagement and transparent estimated avoided SMS with documented baseline and operational costs.
- **HotDoc Integration settings:** manage approved official booking URLs/widget configuration and phone-only exceptions without controlling or duplicating the clinical appointment database.
- **Governance:** clinic-scoped role-based access (administrator, practice manager, authorised communications editor/approver), two-step approval where appropriate, audit logs, least-privilege permissions, security review and existing CMS publishing standards. Fix the known staging custom-hostname Auth.js callback defect through its separate authorised workstream before authenticated staff acceptance.

**Detailed implementation controls (preserve the original Phase D list):**
- Draft, preview, clinical/legal review where required, approve, schedule, publish, expire, archive and (if needed) correct/retract notices.
- Clinic-scoped roles and permissions; separation between composer and approver for sensitive campaigns; version and audit history.
- Audience options: all opted-in WMC devices / opted-in topic groups, with conservative targeting and no inferred health-condition audiences.
- Delivery queue with retries, duplicate suppression, throttling, outage visibility and error handling. No unnecessary external marketing dependencies.
- Clear safeguard preventing accidental broadcasts to the wrong clinic or unintended audience.

**Gate:** E2E publishing, permission, messaging, error/rollback and accessibility tests; consent and governance review; staging test with dummy subscribers only.

### Phase E - Delivery, read, engagement and SMS-economics dashboard (future)

Expose honest, clearly named stages:
1. **Created/published** by staff; 2. **Queued/attempted** by WMC; 3. **Accepted/rejected by push service** (not delivery confirmation); 4. **Opened in WMC inbox** (observed app event, not identity verification); 5. **Explicitly acknowledged** where implemented and appropriately authenticated.

Distinguish device-level from named-patient-level counts; do not claim read receipts per patient in the anonymous PWA. Track invalid/expired subscriptions, opt-outs and notification-permission failures. Protect detailed event data, retention and access.

Measure installation funnel and opt-in rates using privacy-aware analytics. Maintain campaign inventory and SMS baseline: estimated **avoidable general-announcement SMS** = comparable consented audience reached by the WMC channel, adjusted for campaign policy; estimated savings = validated avoided sends x documented per-SMS cost minus incremental messaging/operations costs. Do not count clinical reminders or assert avoided SMS on the basis of a push-service acceptance alone.

Run staff -> consenting-patient pilot, measure uptake, correct accessibility, notification frequency, false opt-ins and support burden before general release.

### Phase F - Secure patient accounts and personalised notifications (conditional, later)

**Not part of the anonymous broadcast MVP.** Evaluate only after a security architecture, consent, verified identity and privacy impact assessment exist.

- Proven patient identity, secure session, authenticated inbox, patient-to-device association, recovery/revocation, multi-device handling, access auditing and appropriate data minimisation.
- Meaningful patient-level *opened/acknowledged* records only if the identified user viewed or acknowledged a message in an authenticated context; even then no guarantee of comprehension.
- Carefully governed one-to-one administrative communications and follow-ups; private clinical messages, results, prescriptions and recalls remain within HotDoc/clinical systems unless explicitly integrated with appropriate legal, privacy and clinical approvals.
- Suitable fallback for undelivered, urgent, important or legally required notices (including SMS, phone or another permitted channel); define escalation times and ownership per message type.
- No private health information in a notification preview, personal medical condition-based segmentation without proper basis, or mass campaigns to patients without lawful communications permissions.

### Phase G - Adoption operations and ongoing quality (ongoing)

- Clinic operations: patient education, reception QR/posters, staff explanation script, visible app benefits, relevant journey prompts, campaign content calendar, feedback and help centre.
- A/B-test only low-risk wording and opt-in placement; avoid manipulative prompts; respect iOS/Android standards and accessibility.
- Monitor PWA install and prompt lifecycle, service-worker upgrades, browser support, inactive devices, subscriptions, messaging abuse, clinical/marketing consent and emergency notices.
- Periodic functional/visual regression across homepage, Patient Hub, booking, Digital Reception, Preferred GP, practitioner/knowledge pages, share, install and notifications.

## 5. Consent, privacy and clinical communications policy gates

**Before notification deployment**, review Australian Privacy Principles including APP 7, applicable Spam Act rules, opt-in and unsubscribe requirements, health-information sensitivity, retention, cross-border processors, privacy notices, breach response and contract terms with the practice's legal/privacy advisers. Browser push permission **alone may not establish consent for promotional direct marketing**.

Classify content:

| Classification | Examples | Initial WMC PWA | Safeguard |
| --- | --- | --- | --- |
| General operational | Hours, closures, parking, disruptions | Proposed | Minimal, public info only |
| Optional promotional/educational | New services, screening campaigns, welcome GP, health articles | Proposed with appropriate consent | Clear opt-in/preferences/opt-out and approved wording |
| Personal clinical | Individual results, recalls, sensitive follow-up, appointment-specific reminders | **Not in initial scope** | Remains in HotDoc/clinical platform; future secure review only |
| Urgent or safety-critical | Time-critical individual follow-up | **Never push-only** | Clinically approved multi-channel escalation |

Push success is not guaranteed; no false claims of messages being read or successfully delivered. Keep transparent channel preferences. Patients without the PWA must remain able to book and reach the practice.

## 6. Detailed scope retention checklist (do not drop features)

### Existing WMC/PWA protection
- [ ] Original WMC/Healthcare Doctors branding, site architecture, URLs, SEO, seven-item navigation and Trust Facts remain intact.
- [ ] 15 practitioners, qualifications, languages, interests, related services, practitioner discovery and approved HotDoc booking rules remain intact.
- [ ] Preferred GP persistent device preference and safe profile/booking shortcuts.
- [ ] Digital Reception, practice information, health education, contact, call and after-hours options.
- [ ] Share page mobile-only; app install page; Android and iPhone guidance; desktop QR; 14-day install cooldown, dismissal and installed-state detection.
- [ ] Premium mobile-first dashboard and accessible bottom dock; no content overlap or gratuitous whitespace.
- [ ] Recruitment HOLD; staged noindex; Auth.js callback issue tracked separately; no production changes.

### Planned HotDoc scope
- [ ] Official widget availability and provider/doctor mapping verified; no unsupported API claims.
- [ ] Existing HotDoc booking fallback links always function; Mary PHONE_ONLY and all existing rules preserved.
- [ ] HotDoc clinical-software integration remains unchanged; no duplicate scheduling/payment/clinical messaging.

### Planned patient communications scope
- [ ] General-announcement push; browser support and explicit permission onboarding.
- [ ] In-app inbox, read/unread, history, categories, expiry, deep links and action paths.
- [ ] Opt-in/preferences/unsubscribe, subscription lifecycle, delivery errors, throttling and duplicate suppression.
- [ ] CMS drafting, approval, publishing, scheduling, expiration, retract/audit, role permissions and clinic-scoped safeguards.
- [ ] Transparent sent/accepted/opened/acknowledged statuses, honest device-vs-patient interpretation.
- [ ] Adoption funnel, permission/active-device analytics, cost baseline and SMS savings estimate.
- [ ] Reception/waiting room QR, posters, new-patient material, permitted appointment/HotDoc invitations, homepage and navigation discovery.
- [ ] Clinical/marketing classification, APP/Spam Act review, no sensitive lock-screen text, opt-out and fallback.
- [ ] Future identity-verified private inbox and patient-level acknowledgment only with separate approval.

## 7. Quality, deployment and change-control gates

For each phase: design brief and scope -> approved change set -> code + unit/integration tests -> build -> accessibility/Playwright/screenshots -> reviewed data/security impacts -> explicit authorisation for DB migrations -> deploy to Hostinger staging -> verify actual build SHA and both hosts -> functional smoke -> physical-device testing where needed -> documented rollback -> final stage verdict.

Viewport snapshots: 320 / 390 / 430 / 768 / 1024 / 1440px, with real Android/iPhone physical acceptance for installation and web push before public rollout. Verify app installed/standalone vs browser, permission denied/allowed, offline/poor signal, duplicate notices, expired subscriptions, and service worker upgrades. Verify all 15 practitioners, Digital Reception, Preferred GP, HotDoc booking routes, noindex and recruitment HOLD.

Production release remains **NO-GO** pending independent database backup/restore and environmental isolation, authenticated CMS/Auth.js custom hostname resolution, clinical/security approval, real-device acceptance and separate production/DNS sign-off. No database write permission is conveyed by this roadmap.

## 8. Open decisions / third-party dependencies

1. **HotDoc:** Which official booking widget/embedding methods are enabled for WMC? How do provider profiles and phone-only exceptions behave? Is a PWA embedded context supported? Any explicit API/notification integration agreement? Do not guess.
2. **Consent/legal:** Which notices are operational vs marketing; what opt-ins are needed; what processor, retention and privacy disclosures are required?
3. **Identity:** Is there a business case for authenticated patient messaging given complexity and clinical risk? How will identity link to a patient's clinical record, if ever?
4. **Cost:** Confirm HotDoc/SMS volume and rates, consented device adoption, push infrastructure and admin costs before forecasting savings.
5. **Infrastructure:** Choose Web Push implementation compatible with the existing WMC service worker and hosting without losing present PWA features; account for notification endpoint/key governance.
6. **Operations:** Who can write, approve, retract or respond to a message? Who monitors failures? What is the clinical escalation path?
7. **Release:** Verify latest Hostinger source SHA (`2634ca2` Phase A tip as of governance integration) and actual existing notification capabilities before coding any new module.

## 9. Roadmap ownership and update discipline

- This file is the **canonical Patient App programme roadmap** in-repo. It does not by itself authorise database writes, Hostinger deploys or production cutover.
- Record each deliverable as `Planned -> In design -> Approved -> In development -> Staging verified -> Production approved`, with owner, commit, test artefacts, screenshots and release reference.
- Preserve all phase history. Append decisions/change logs; never overwrite completed work or silently drop backlog items. Keep future notification and HotDoc work separate from completed Phase A UI work.
- Phase B modular prompts live in `docs/WMC-PHASE-B-MODULAR-TASKS.md`. Do not start Phase B implementation until an owner prompt explicitly authorises a B-task.

**Current immediate next step (13 November 2026):** Hostinger staging tip **`fdcb9c4`** — **Patient Journey M1 + M2 STAGING VERIFIED** (Care Hub + directory Preferred GP; build `01a1d286-…`; branch `feat/wmc-patient-journey-m1-m2` on GitHub). Phase B1 remains closed in ancestry (`f6bba5c`). Phase C0 architecture remains **READY — IMPLEMENTATION APPROVAL REQUIRED**. Phase C2 readiness checklist is **BLOCKED** on specific prerequisites (`docs/WMC-PHASE-C2-IMPLEMENTATION-READINESS.md`) — verified staging DB backup/restore, privacy/clinical/security sign-offs, Auth.js staging hostname fix, and written implementation approval. Do **not** start live push coding, Prisma migrations, messaging vendors, DNS or production changes without that approval. M3–M5 journey items and the 17-concept decision register remain deferred/conditional as recorded. Production QR promo pack remains **NOT FOR DISTRIBUTION** until apex cutover + live QR verification.


## 10. Status and decision log (added 13 November 2026; updated same day for Phase A gate; updated again for B1 closeout + C0 architecture)

| Workstream | Latest known status | Next checkpoint |
| --- | --- | --- |
| Three Patient App CMS pages | Deployed to staging in earlier authorised release | Preserve routes, record IDs and rollback |
| Mobile-only page-level Share | Deployed, verified in `fdd9bf2`, retained through later releases | Keep mobile-only under 768px |
| Patient App adoption/visual excellence | Staging verified in `6f08dde` (retained through `f6bba5c`) | Preserve homepage discovery, iPhone-overlay fix and regression acceptance |
| Phase A — Patient Hub mobile dashboard + UI polish | **STAGING VERIFIED** at `2634ca2` (retained through `f6bba5c`) | Preserve hub/polish |
| Phase B0 HotDoc compatibility strategy | **READY** (`dffcae6`) — lightbox retained | Preserve HotDoc SoT |
| Phase B1 install QR / cooldown / guidance | **STAGING VERIFIED & CLOSED** at `f6bba5c` / build `01a1d23c-…` | Preserve; promo QR pack pre-cutover only |
| HotDoc widget and PWA booking | B0 strategy complete; no parallel book | Keep lightbox + phone-only exceptions |
| Phase C0 notification architecture | **ARCHITECTURE READY** — implementation approval required | Sign-off packs in `docs/WMC-PHASE-C0-*.md` |
| Phase C1 Patient Engagement UI (dummy) | **READY FOR REVIEW** (+ present in staging ancestry via C1+PJ / M1+M2 tips) | Privacy/security before live C2 |
| Phase C2 live announcements readiness | **BLOCKED — SPECIFIC PREREQUISITES** | `docs/WMC-PHASE-C2-IMPLEMENTATION-READINESS.md` |
| Notifications, general announcement inbox and consent | Designed (C0); C1 lab demo only; **not authorised for database deployment** | Clear C2 checklist then C2+ modules |
| Patient Engagement Admin Panel | Spec’d in C0; C1 lab shell; Phase D build later | Auth.js roles, campaigns, inbox, consents, reports |
| Anonymous delivery/read/adoption analytics and estimated SMS savings | Spec’d in C0/E | Honest device-level metrics + SMS baseline |
| Verified patient identity and personalised messaging | **Conditional future phase** | Separate verified identity, clinical/legal/security approval and safe fallback |
| Patient Journey M1 Care Hub | **STAGING VERIFIED** at `fdcb9c4` / `01a1d286-…` | Preserve; see M1+M2 report |
| Patient Journey M2 GP directory Preferred GP | **STAGING VERIFIED** at `fdcb9c4` | Preserve `wmc.preferredGp.v1` |
| Patient Journey M3–M5 (open-now, HotDoc routines, household, etc.) | **Deferred / conditional** — register intact | No implementation without separate approval |
| Mockup concept integration (17) | **REGISTERED**; M1/M2 staging verified; remainder deferred — see §12 | Keep decision register; do not reopen rejected items |
| HotDoc routine-request shortcuts | **Conditional future** | HotDoc account verification + clinical |
| Household GP preferences | **Deferred** (privacy / UX) | No anonymous named family health storage |
| Clinic open-now indicator | **Conditional future** | Verified hours engine only — no hard-coded open/closed |
| Personal clinical results in PWA | **Rejected** | Clinical systems / HotDoc only |
| Production cutover | **NO-GO** | Independent backups/restore, Auth.js fix, security/clinical sign-off, real-device evidence, owner DNS approval |
| Cursor Project Pack v1.2 governance | **Integrated** (see `docs/WMC-PROJECT-GOVERNANCE-INTEGRATION.md`) | Follow modular approval gates |

**Continuity rule:** All existing Phase A-G requirements and checklists above remain in force. Additive updates must not delete earlier requirements.


## 12. Mockup concept integration (added 13 November 2026)

Owner-reviewed conceptual PWA screens were mapped into this roadmap **without** a second competing plan. Authority artefacts:

| Artefact | Path |
| --- | --- |
| 17-image decision register | `docs/WMC-PWA-MOCKUP-CONCEPT-DECISION-REGISTER.md` |
| Existing vs missing matrix | `docs/WMC-PWA-MOCKUP-EXISTING-VS-MISSING-MATRIX.md` |
| Modular Journey plan | `docs/WMC-PATIENT-JOURNEY-ENHANCEMENT-PLAN.md` |
| Code (Care Hub + visit prep) | `apps/web/src/documents/patient-journey-enhancements.ts` (wired from `public-ux.ts`) |
| Directory Preferred GP (M2) | `apps/web/src/documents/patient-directory-preferred-gp.ts` |
| M1+M2 staging report | `docs/WMC-PATIENT-JOURNEY-M1-M2-STAGING-REPORT.md` |
| Named audit file | `WMC_PWA_Mockup_Concept_Audit_2026-11-13.md` — **not found on disk** this session; reconcile when supplied |

### Already implemented (preserve)

Patient Hub mobile dashboard; Preferred GP (`wmc.preferredGp.v1`); practitioner directory (`team.html`); Digital Reception; HotDoc booking lightbox pathway; PWA install (B1); Practice Information Hub; Trust Facts–backed public pages (billing, telehealth, after-hours, new patients, knowledge index); **M1 Care Hub** (single Prepare for Your Visit entry + grid + Clear checklist); **M2 Save Preferred GP** on directory/profiles.

### Approved enhancements — staging verified (M1/M2)

- **M1 / PJ-01–02 Care Hub** — single entry, mobile grid, visit-prep Clear/Reset (`wmc.visitPrep.v1`).  
- **M2 / PJ-03 Preferred GP from directory** — Save on `team.html` / GP listing / profiles via existing preference API.

### Remain deferred (M3–M5 / register — do not implement without approval)

Open-now indicator; HotDoc routine request shortcuts; household GP preferences; any further mockup IA beyond M1/M2.

### Remain in notification phases (do not implement outside C0–E)

Notification preferences/categories; Patient Updates feed; Inbox; Engagement Admin; push delivery — see Phase C2 readiness (blocked until prerequisites).

### Future conditional (plan only)

HotDoc routine requests; household GP preferences; open-now indicator; CMS publication of new announcement content.

### Rejected / unsafe

Personal clinical results; medical notes / named family health in anonymous browser storage; unverified mockup clinical copy or portraits; global five-tab nav without UX approval.

**Implementation status:** M1+M2 **STAGING VERIFIED** on Hostinger at `fdcb9c4` (GitHub branch `feat/wmc-patient-journey-m1-m2`). C1 lab routes undisturbed. 17-concept decision register decisions unchanged.


## 11. Version 1.2 - AI-assisted development guide adoption (13 November 2026)

The user provided an external ChatGPT-to-Cursor/PWA guide. Its **workflow** is useful, but the sample **project facts and implementation instructions must not be applied blindly**. The approved WMC adaptation is documented in `PROJECT_SPEC.md`, `.cursor/rules/wmc-core.mdc`, `docs/WMC-CURSOR-WORKFLOW.md`, and `docs/WMC-PHASE-B-MODULAR-TASKS.md`.

### Keep / change / defer decisions

- **Keep:** ChatGPT product-architecture role, Cursor implementation role, persistent project context, smaller modular prompts, real build/regression/device checks, safe-area mobile standards, patient-data privacy, HotDoc as the booking system.
- **Change:** Use current Cursor `.cursor/rules/*.mdc` rather than legacy `.cursorrules` for a new rule; Next.js/Node Hostinger Web App rather than static hosting; existing WMC palette rather than sample colours; 15 published practitioners rather than 10 example names; canonical CMS/Trust Facts rather than a duplicate `doctors.json`; approved current HotDoc lightbox and links instead of blindly forcing all new tabs.
- **Do not recreate:** Existing manifest, service worker, mobile dashboard, three-action bottom dock, Preferred GP storage and PWA install logic. Audit/extend incrementally only.
- **Deferred pending separate design/privacy approval:** Five-household-profile LocalStorage manager (`wmc_family_gps`), five-tab global bottom bar, open-now indicator with unverified hard-coded hours, and new offline caching that could show stale medical/after-hours advice. These are *not authorised features*. Confirmed again in the 2026-11-13 mockup decision register (§12).
- **Current next work:** M1+M2 closed at staging `fdcb9c4`. Clear Phase C2 readiness blockers (`docs/WMC-PHASE-C2-IMPLEMENTATION-READINESS.md`) before any schema/push work; keep HotDoc as clinical SoT; do not distribute production QR materials until apex cutover verification.

### Record preservation

Version 1.2 is additive and does not delete any of the Phase A-G roadmap goals, notification/consent/admin/analytics requirements, SMS economics, clinical boundaries, or staging/production release safeguards. Always preserve historical roadmap and review updates in Git rather than creating competing canonical plans.
