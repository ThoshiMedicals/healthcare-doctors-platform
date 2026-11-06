# Multi-Tenant Foundation — Phase 1 Report

**Date:** 2026-11-03  
**Scope:** Platform preparation only. No second clinic. No second golden import. No public-site redesign.  
**Parent audit:** [`WMC-SECOND-CLINIC-READINESS.md`](./WMC-SECOND-CLINIC-READINESS.md)

---

## Readiness score

| | Before (audit) | After Phase 1 |
| --- | --- | --- |
| **Overall** | **42 / 100** | **58 / 100** |

| Layer | Before | After | Notes |
| --- | --- | --- | --- |
| Prisma / clinicId data model | ~70+ | ~78 | `Clinic.goldenHtmlRoot`; softened `Vacancy.location` default |
| Host → ClinicDomain resolve | ~80 | ~80 | Unchanged (still one live tenant) |
| Admin multi-tenant UX | Low | ~70 | Active-clinic cookie + switcher for Network/Super Admin |
| Branding / presentation | ~35 | ~55 | Profile-driven inject + handoffs; JS HotDoc/tel fallbacks from `data-*` |
| Golden import multi-tenant | Hardcoded | ~75 | `--clinic`, `--dry-run`, `validate:golden` |
| Measurement clinic keying | Missing | ~60 | `clinic_slug` / `clinic_id` on events + filter helper |
| Second golden HTML corpus | Not started | Not started | Explicitly out of scope |

---

## What shipped

### Active Clinic Session

- Cookie `wmc_active_clinic` persists selected slug for Network Admin / Super Admin (`switch_clinic`).
- `editorContext()` resolves clinic from cookie (or membership clinic for clinic-scoped roles).
- All existing admin modules that call `editorContext` / `requireAction` inherit the active clinic.

### Clinic switcher UI

- Header select in admin dashboard layout.
- Visible only when `roleAllows(role, "switch_clinic")` (Network Admin / Super Admin).
- Uses `listLiveClinics()`; chrome title uses `clinic.practiceName`.

### ClinicProfile-driven branding

- Shared `ClinicBranding` helper (`apps/web/src/clinics/branding.ts`).
- `public-ux` injects `data-clinic-slug`, practice name/phone/email, HotDoc, logo attrs from profile.
- Patient form + talent community handoffs use `practiceName`.
- `site.js` measurement payloads include `clinic_slug`; HotDoc/tel conversion bands prefer DOM/`WMCMeasurement` profile attrs (WMC literals remain last-resort fallbacks).
- Settings page surfaces practice name, slug, and logo path from clinic/profile.

### Multi-tenant imports

```text
npm run import:golden -- --clinic=woolloongabba
npm run import:golden -- --clinic=woolloongabba --dry-run
npm run validate:golden -- --clinic=woolloongabba
```

Optional `--golden-root=<path>` or `Clinic.goldenHtmlRoot`. Dry-run counts pages/runtime files without DB writes or copies.

### Measurement clinic identifiers

- `clinic_id` / `clinic_slug` on raw + sanitized events.
- `filterEventsForClinic` + optional `clinicSlug` on `loadMeasurementEvents`.
- Browser `site.js` stamps `clinic_slug` from `data-clinic-slug`.

---

## Schema changes

| Change | Migration |
| --- | --- |
| `Clinic.goldenHtmlRoot` (`golden_html_root` TEXT, nullable) | `20261103210000_multi_tenant_foundation` |
| `Vacancy.location` default `""` (was `"Woolloongabba, Brisbane"`) | same |

Apply with `npm run db:migrate` from `apps/web` when Postgres is available.  
`prisma generate` may need a quiet moment if UAT holds the query-engine DLL on Windows.

---

## Files changed (primary)

| Area | Paths |
| --- | --- |
| Active clinic | `src/cms/active-clinic.ts`, `src/cms/context.ts`, `src/cms/actions.ts` (`switchActiveClinic`) |
| Switcher UI | `src/app/admin/(dashboard)/clinic-switcher.tsx`, `layout.tsx` |
| Branding | `src/clinics/branding.ts`, `src/documents/public-ux.ts`, `src/documents/render-published-document.ts`, `src/cms/careers-applications.ts`, `src/cms/careers-vacancies.ts`, settings page |
| Runtime JS | `apps/web/public/site.js`, `old-html/site.js` (synced) |
| Imports | `src/importer/{golden-root,import-golden-html,validate-golden-html}.ts`, `scripts/import-golden-html.ts`, `scripts/validate-golden-html.ts`, `package.json` |
| Measurement | `src/measurement/{types,sanitize,clinic-filter,event-source}.ts` |
| Schema | `prisma/schema.prisma`, migration `20261103210000_multi_tenant_foundation` |
| Tests | `active-clinic.test.ts`, `golden-root.test.ts`, `clinic-filter.test.ts`, `public-ux.test.ts` updates |

---

## Remaining blockers (not Phase 1)

1. **Second clinic golden HTML corpus** — largest cost; required before a second *live* public site.
2. **Per-clinic media/storage root** — library still catalogs shared `public/assets`.
3. **Per-clinic governance artifact path** — `governance-published.js` still shared.
4. **Clinic #2 provisioning UI** — profile/domains/memberships without Gabba-only seed (draft/external dry-run only).
5. **UAT multi-host** — local/tunnel still resolve to `DEFAULT_CLINIC_SLUG`.
6. **Dashboards / SearchDemandSignal UI** — clinic filter helpers ready; Insights chrome not yet wired to active clinic end-to-end.
7. **Accessibility / overlay WMC string replacements** — still match Gabba golden literals; profile-driven once a second corpus exists.
8. **Production cutover ops** — unchanged; see `deployment/LAUNCH.md` / DNS checklist (NO-GO until evidenced).

---

## Explicit non-goals (honoured)

- No clinic #2 created or imported.
- No second golden corpus.
- No public website redesign / golden HTML edits beyond shared runtime sync for `site.js`.
- DNS / HotDoc / AGPAL for a second tenant not started.

---

## Document history

| Date | Change |
| --- | --- |
| 2026-11-03 | Phase 1 platform foundation implemented; score 42 → 58. |
