# Dashboard Deployment Status Report

**Date:** 2026-10-26  
**Runtime:** Next.js app on `http://127.0.0.1:3000` (`npm run dev`, health `ok`)  
**Auth probe:** Seed Super Admin session via `/api/auth/callback/credentials`  
**Note:** `/ admin/conversion-intelligence` (space) is a typo; audited as `/admin/conversion-intelligence`.

## Verdict

All six audited dashboards are **deployed, routed, navigation-wired, and reachable after authentication** for roles with the required CMS actions (`manage_settings` or `clinical_signoff`).

| Route | Route file | In running app | Auth-accessible | Nav exposed | Status |
|---|---|---|---|---|---|
| `/admin/executive` | Yes | Yes | Yes (200) | Yes | **AVAILABLE** |
| `/admin/digital-reception` | Yes | Yes | Yes (200) | Yes | **AVAILABLE** |
| `/admin/practitioner-authority` | Yes | Yes | Yes (200) | Yes | **AVAILABLE** |
| `/admin/service-authority` | Yes | Yes | Yes (200) | Yes | **AVAILABLE** |
| `/admin/conversion-intelligence` | Yes | Yes | Yes (200) | Yes | **AVAILABLE** |
| `/admin/governance/management` | Yes | Yes | Yes (200) | Yes | **AVAILABLE** |

Unauthenticated requests to all six return `307 → /admin/login`. A non-existent control route (`/admin/this-dashboard-does-not-exist-xyz`) returns `404` after auth, confirming these six are real App Router pages—not middleware-only stubs.

---

## Per-route detail

### 1. `/admin/executive`

| Check | Result |
|---|---|
| 1. Route file | `apps/web/src/app/admin/(dashboard)/executive/page.tsx` |
| 2. Running app | Compiled and served by Next on :3000 |
| 3. After auth | `200`, `<h1>Executive Dashboard</h1>`; `requireAction("manage_settings")` |
| 4. Navigation | `CMS_MODULES` → “Executive Dashboard”; shown for `super_admin` / `network_admin` / `clinic_admin` |
| 5. Gaps | **Runtime defect found and fixed during audit:** `executiveRangeOptions()` referenced `EXECUTIVE_RANGES` without importing it from `@/measurement/ranges` (`ReferenceError` → HTTP 500). Import restored in `src/measurement/executive-report.ts`. Re-probe: 200. |

### 2. `/admin/digital-reception`

| Check | Result |
|---|---|
| 1. Route file | `apps/web/src/app/admin/(dashboard)/digital-reception/page.tsx` |
| 2. Running app | Yes |
| 3. After auth | `200`, `<h1>Digital Reception Dashboard</h1>`; `requireAction("manage_settings")` |
| 4. Navigation | “Digital Reception Dashboard” in sidebar for admin roles with `manage_settings` |
| 5. Gaps | None |

### 3. `/admin/practitioner-authority`

| Check | Result |
|---|---|
| 1. Route file | `apps/web/src/app/admin/(dashboard)/practitioner-authority/page.tsx` |
| 2. Running app | Yes |
| 3. After auth | `200`, `<h1>Practitioner Authority Dashboard</h1>`; `requireAction("manage_settings")` |
| 4. Navigation | “Practitioner Authority Dashboard” in sidebar |
| 5. Gaps | None |

### 4. `/admin/service-authority`

| Check | Result |
|---|---|
| 1. Route file | `apps/web/src/app/admin/(dashboard)/service-authority/page.tsx` |
| 2. Running app | Yes |
| 3. After auth | `200`, `<h1>Service Authority Dashboard</h1>`; `requireAction("manage_settings")` |
| 4. Navigation | “Service Authority Dashboard” in sidebar |
| 5. Gaps | None |

### 5. `/admin/conversion-intelligence`

| Check | Result |
|---|---|
| 1. Route file | `apps/web/src/app/admin/(dashboard)/conversion-intelligence/page.tsx` |
| 2. Running app | Yes |
| 3. After auth | `200`, `<h1>Conversion Intelligence</h1>`; `requireAction("manage_settings")` |
| 4. Navigation | “Conversion Intelligence” in sidebar |
| 5. Gaps | None |

### 6. `/admin/governance/management`

| Check | Result |
|---|---|
| 1. Route file | `apps/web/src/app/admin/(dashboard)/governance/management/page.tsx` |
| 2. Running app | Yes |
| 3. After auth | `200`, `<h1>Governance Management</h1>`; `requireAction("clinical_signoff")` |
| 4. Navigation | “Governance Management” in sidebar for roles with `clinical_signoff` (`super_admin` / `network_admin` / `clinic_admin`) |
| 5. Gaps | None for deployment. Editors (`content_editor` / `editor`) and `clinical_reviewer` do **not** see this link and are redirected to `/admin` if they hit the URL—by design in `permissions.ts` (`clinical_signoff` = clinic admin tier). |

---

## Wiring map (all six)

| Layer | Mechanism | Status |
|---|---|---|
| App Router pages | `src/app/admin/(dashboard)/…/page.tsx` | Present |
| Auth gate | `middleware.ts` → unauthenticated `/admin/*` → `/admin/login` | Working |
| Role gate | `requireAction(...)` in each page | Working |
| Nav registry | `CMS_MODULES` in `src/cms/modules.ts` | All six registered |
| Nav render | `(dashboard)/layout.tsx` → `visibleModules(role)` | Working (authenticated HTML includes all six labels for Super Admin) |

**Roles that see measure dashboards (5):** `super_admin`, `network_admin`, `clinic_admin` (`manage_settings`).  
**Roles that see Governance Management:** same three (`clinical_signoff`).  
**Roles that see none of the six:** `content_editor`, `editor`, `clinical_reviewer`.

---

## Missing steps (if any)

| Item | Needed? |
|---|---|
| Create route files | No — already present |
| Register in `CMS_MODULES` | No — already present |
| Restart / redeploy for new routes | No — live on :3000 |
| Fix executive runtime import | **Done during audit** — was the only blocker making `/admin/executive` unavailable |
| Expose to content editors | Not required by current permission model |

---

## Related (out of audit scope)

- `/admin/governance/expiry` exists as a page and is auth-gated, but is **not** listed in `CMS_MODULES` (no sidebar link). Not one of the six requested routes.
