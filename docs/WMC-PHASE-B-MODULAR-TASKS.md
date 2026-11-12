# WMC Patient App - Phase B Modular Cursor Task Queue

**Baseline:** Hostinger staging SHA `2634ca2b50a8d7a3d0caa1af206402f62401eaec` (Phase A **STAGING VERIFIED**). Branch `release/wmc-patient-app-visual-excellence`. This queue is a planning aid; **no deployment, database changes or Phase B implementation are authorised by this file alone**. Start only when an owner prompt names a B-task.

**Related:** Canonical programme plan `docs/WMC-PATIENT-APP-MASTER-ROADMAP.md`; session anchor `PROJECT_SPEC.md`; merge record `docs/WMC-PROJECT-GOVERNANCE-INTEGRATION.md`.

## Task B0 - Establish safe project context (READ-ONLY)

Before implementing Phase B:
- Inspect existing repository rules, `AGENTS.md`, worktrees, `PROJECT_SPEC.md`, roadmaps, Trust Facts files, CMS, HotDoc booking modules, PWA manifest and service worker.
- Confirm governance integration is present; do not create competing specs or duplicate clinic data.
- Confirm actual Hostinger live SHA/branch matches Phase A tip `2634ca2`, prior rollback, and known outstanding production gates.
- Output exact source-of-truth files and any remaining inconsistencies.
- No Git push, app code changes, database writes or deployment. This is the first Phase B prompt to run when authorised.

## Task B1 - HotDoc compatibility audit (READ-ONLY)

Inventory current approved practice and doctor-specific booking pathways, including phone-only Mary and other restrictions. Check official HotDoc widget availability for the WMC account (not just generic documentation), provider scoping, mobile/in-app behavior, cookies/CSP/redirects, accessibility, focus and return flow. Produce a decision: existing lightbox vs official widget vs fallback external links. No code/DB/deploy; no live appointment creation. Record unsupported third-party capabilities as unknown, not verified.

## Task B2 - Low-risk adoption journey refinement (DESIGN + PROPOSE)

Audit homepage -> Patient Hub -> install page -> Android/iPhone/desktop QR, digital reception and Preferred GP. Preserve current 14-day cooldown, install-state and non-obstructing iOS overlay. Propose only changes beyond already deployed homepage discovery; include consent-safe copy and screenshots. No implementation until scope is signed off; no database publication without separate approval.

## Task B3 - HotDoc presentation prototype (CONDITIONAL CODE-ONLY)

Proceed **only after owner approves B1 option and B2 scope**. Implement minimal progressive enhancement respecting existing appointment routes and policies; keep old booking path as fallback. Test browser/PWA, doctors, phone-only policies, Digital Reception, all 15 profiles; perform accessibility, build and visual QA. Code-only staging deployment only when the exact change set and staging authority are approved. If DB publication needed, stop and prepare scoped request.

## Task B4 - Notification architecture, consent and admin design (DESIGN ONLY)

Define anonymous general practice announcement vs optional marketing categories, opt-in/unsubscribe, Web Push lifecycle, iOS eligibility, in-app inbox, delivery-vs-read metric definitions, SMS savings model, clinic-scoped roles and an **existing CMS-integrated Patient Engagement Admin Panel** (draft/approve/schedule/send/retract/audit). Provide proposed Prisma tables, API, access control, retention, provider costs and threat model without writing migrations or sending messages. Clinical/private message path must be separately reviewed and must not bypass HotDoc.

## Task B5 - Future release gates (NO AUTO-EXECUTION)

Subject to explicit owner approval and tested backups: implement notification subscriptions, inbox, staff CMS console, analytics, physical Android/iPhone trials, and marketing/privacy compliance. Separate each feature into own approved phase. Patient-specific notifications and identity are later, distinct projects.

## Every task report

List baseline SHA, branch/worktree, inspected paths, changed files (if any), tests, screenshots, route behavior, rollback, actual staging SHA if deployed, deviations, next safe task and owner action required. Never claim completion on assumptions.
