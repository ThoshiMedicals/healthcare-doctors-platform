# WMC Patient App — Phase 4A-B Architecture Lock

**Date:** 2026-11-12  
**Base tip:** `269df5a` (Phase 4A-A UAT recovery)  
**Integration branch:** `feat/wmc-patient-app-phase4ab`  
**Scope:** Accessibility remediation (A11Y-001/002/003) + acceptance closure prep only.

## In scope

- A11Y-001 — hide Preferred GP share until a GP is saved
- A11Y-002 — hub/practice Digital Reception controls get dock-equivalent `aria-label`
- A11Y-003 — Preferred GP Change/Remove ≥44px touch targets
- Low-risk UX friction notes / optional micro-fixes (no redesign)
- Device-validation checklists + acceptance test script
- Regression / PWA / a11y / build verification for acceptance readiness

## Out of scope

- Push notifications, analytics, routine requests, recruitment
- New dashboard features or layout redesign
- Staging/production deploy, DNS cutover, Cloudflare purge

## Preserve

Strategic Recovery 1–2 · Trust Facts Register · Phase 3A–3D (hub, Preferred GP, install, practice info, share)

## Release safety

No push. No Hostinger deploy. Stop after local RC tip + reports.
