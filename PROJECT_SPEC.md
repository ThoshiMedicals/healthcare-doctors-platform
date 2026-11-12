# Woolloongabba Medical Centre - Project Specification (Cursor Context Anchor)

**Version:** 1.2 (repo-integrated) | **Updated:** 13 November 2026 | **Purpose:** Ground Cursor changes in WMC's actual architecture and approved roadmap.

> **Authority hierarchy (merge, do not compete):**  
> 1. Clinical/practice facts → `docs/WMC-TRUST-FACTS-REGISTER.md` (+ `.json`) and published CMS.  
> 2. Platform product/architecture SSOT → `docs/WMC-MASTER-BRAIN.md` and `docs/WMC-DEVELOPMENT-STANDARDS.md`.  
> 3. Production/ops procedure → `deployment/LAUNCH.md`, `deployment/SOURCE-CONTROL.md`.  
> 4. Live tip / hosting state → `.cursor/rules/wmc-working-memory.mdc`.  
> 5. Patient App programme plan → `docs/WMC-PATIENT-APP-MASTER-ROADMAP.md`.  
> This file is the **Cursor session anchor** for Patient App and website work. It does not replace the sources above.

## Current system

- Repository: `ThoshiMedicals/healthcare-doctors-platform` (verify exact checked-out repository and worktree).
- Stack: Next.js 15 / TypeScript / Prisma / PostgreSQL hosted on Supabase / Auth.js / custom CMS / HotDoc / Digital Reception / PWA service worker.
- App root for Hostinger: `apps/web`; Hostinger Web App on Node.js 22. **Not a plain static website.**
- Supabase hosts PostgreSQL. Do not introduce Supabase Auth, Storage or supabase-js without a separately approved architecture change.
- Public clinic page and Patient App coexist; do not globally constrain all desktop pages to a 480px mobile shell.

## Source of truth: do not duplicate or guess

1. Approved practice/clinical facts: `docs/WMC-TRUST-FACTS-REGISTER.md` and `.json`; check existing canonical files and published CMS before editing.
2. Practitioner directory, names, interests, qualifications, languages, photos, visibility and bookings: **existing CMS/approved repository sources**, not a new static `doctors.json` or `clinic-config.json`.
3. Most recent reported published practitioners: **15**, not the 10-person example in a generic guide. Reverify actual records.
4. Address, phone, email and opening/after-hours arrangements: **verify via Trust Facts/CMS**; do not copy unverified sample values or create a second store. Special/holiday hours may differ.
5. Booking rules and HotDoc URLs: read existing approved practitioner booking configuration; preserve call-only and other exceptions. Do not use placeholder or invented HotDoc links.
6. Relevant brand tokens: navy `#123B5D`, teal `#1E8C8C`, soft teal `#6EC6C4`, pale aqua `#DDF4F3`, white `#FFFFFF`, charcoal `#243746`. Reuse existing design tokens/components where defined; do not recolour everything.
7. Main navigation is the existing approved seven-item structure; Patient Hub gets a mobile-specific dashboard without breaking global navigation.

## Deployment / version control

- Latest verified Hostinger **staging** release: `2634ca2b50a8d7a3d0caa1af206402f62401eaec`; build `01a1d1f7-c5c2-736a-9772-1449b28a20e8` (Patient Hub dashboard + final UI polish). Branch: `release/wmc-patient-app-visual-excellence` (also on GitHub). Verify against Hostinger and Git before any change.
- Staging primary: `https://staging.gabbamedicalcentre.com.au`; temporary: `https://mediumslateblue-eagle-960503.hostingersite.com`.
- Production `https://gabbamedicalcentre.com.au` **remains unchanged / NO-GO for cutover** without separate sign-off.
- All code-only changes: inspect latest Git ancestry and concurrent agents, isolate worktree, test, build, create reproducible ZIP/checksum, verify deployed SHA and screenshots on both staging hosts, maintain rollback.
- Do not alter Hostinger env secrets, Auth.js callbacks, DNS, production settings, staging noindex, clinical records, booking policy or database schema without a separately authorised scoped change.
- Prior one-time staging database-backup waiver does **not** cover future writes. Database changes require written scope approval, verified backup/recovery, rollback and schema governance.

## Patient Hub / PWA (preserve)

- Routes: `/patient-hub.html`, `/practice-information-hub.html`, `/install-wmc-app.html`; distinguish code-side refinements from CMS-published content.
- Approved compact mobile dashboard (Phase A — **STAGING VERIFIED** at `2634ca2`): WMC header, welcome, prominent My Preferred GP, four actions (Book / Digital Reception / Find Doctor / Health Information), state-sensitive install card, expandable practice details, and compact Book/Call/Digital Reception dock.
- UI polish verified on staging: GP card heading/rows/full-width select, quick-action icons, safe-area dock, solid install-card border, reduced post-footer dock padding.
- Preferred GP currently uses **device-local** preference (`wmc.preferredGp.v1`); do not silently replace storage format or turn it into an authenticated patient identity.
- Existing PWA manifest/service worker, Android/iOS install experience, 14-day dismiss cooldown, accessibility and noindex checks have already been built; inspect and extend, **do not recreate or overwrite**.
- Page-level Share control is mobile-only (`<768px`), hidden and not keyboard-focusable at 768px+; preserve existing sharing destinations and fallback.
- D2 iPhone install overlay was reported fixed, but physical mobile tests remain necessary for launch acceptance.
- Keep Digital Reception, approved HotDoc booking routes/doctor-specific rules, all 15 practitioner profiles, recruitment HOLD, SEO and accessibility fixes.

## HotDoc integration - next phase

- **HotDoc is the source of truth** for availability, appointment booking, confirmations, cancellation/rescheduling and existing clinical-software integration. No parallel appointment book or DIY Best Practice API integration.
- First inventory actual booking URLs, current lightbox/booking modal, call-only exceptions, account/widget access, and mobile/installed PWA behavior.
- Evaluate only HotDoc's *official* supported website widget and documented integration choices; verify account-specific configuration and external links as fallback. Do **not** force every HotDoc action to `target=_blank` if the existing approved lightbox works.
- Never assume a booking widget grants WMC access to HotDoc patient IDs, bookings, reminder status or patient messages. No scraping/reverse-engineering.

## Patient engagement - approved roadmap, not implementation authorization

- Phase B: HotDoc widget feasibility + adoption/instruction funnels (`docs/WMC-PHASE-B-MODULAR-TASKS.md`).
- Phase C: consent, topic preferences and general-announcement Web Push foundation (subject to privacy/security/database approvals).
- Phase D: patient notification inbox + staff-facing **Patient Engagement Admin Panel integrated in existing CMS** (draft, approval, schedule, publish, retract, roles/audit).
- Phase E: honest push acceptance vs in-app opens vs acknowledgements, adoption analytics and evidenced SMS savings.
- Phase F: *later/conditional* verified patient identity and private messaging, clinical/privacy/legal approval and fallback to HotDoc/SMS/phone.
- Phase G: ongoing adoption and accessibility/quality operations.
- Keep marketing consent separate from notification browser permission. No patient-specific clinical details in device notifications. No guarantee that delivered/read status equals patient understanding.

## Coding workflow

- Read `docs/WMC-PATIENT-APP-MASTER-ROADMAP.md`, `docs/WMC-CURSOR-WORKFLOW.md`, and canonical source files before proposing implementation.
- Use a **small, reviewed change manifest** per task. Audit/verify first; code only when scope allows. Prefer existing modules and tests.
- For each task: inventory -> scoped plan -> implementation -> focused tests -> full relevant regression/build -> visual QA -> safe staging promotion (only if explicitly authorised) -> report/rollback.
- Do not invent features or convert planning goals to code approval. Save report paths, test results, SHA, screenshots, observed limitations and owner approvals.

## Clinical/privacy guardrails

- No health records, test results, Medicare numbers, symptoms, patient identities, or identifiable family medical details in localStorage or analytics.
- Household/profile nicknames may reveal relationships: **do not implement a five-person household manager** without a separate privacy/UI approval; keep the existing Preferred GP feature.
- Do not claim a local device preference proves patient identity or permits personalised clinical communications.
- Avoid caching potentially stale clinical, emergency or hours information offline as authoritative; confirm policy and fallback before changing offline behavior.
- No SMS replacement for clinical recalls, urgent care or safety-critical communication without clinically governed fallback.

## Truthfulness

- Treat Cursor execution reports as reported results until verified from Git/build/live browser evidence. Never mark production READY based solely on staging tests.
- Do not state that installation, delivery, display, reading and comprehension are interchangeable metrics.
