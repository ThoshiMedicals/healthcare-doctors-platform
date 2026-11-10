# WMC Full Admin CMS — P0 Commit Candidate Report

**Branch:** `p0/full-admin-cms-foundation`  
**Baseline:** `89907135e492255eb1a8e2007ef3d5313a327cd1`  
**Worktree:** `C:\Users\RoshanSamarawickrema\Desktop\WMC-p0-full-admin-cms`  
**Status:** **P0 COMMIT CANDIDATE READY**  
**Do not commit/push from this report** — operator decides when to commit.

---

## A. Implementation completed

| ID | Capability | Status |
|---|---|---|
| P0-A | Safe page unpublish / archive / restore | Done |
| P0-B | Governed SEO editor + SSR head injection | Done |
| P0-C | Authenticated clinic-scoped draft preview | Done |
| P0-D | Clinical reviewer / practice approver / publisher RBAC | Done |

Preserved: immutable `PageRevision` HTML, recruitment HOLD, phone-only/insurance booking rules, Sprint 2 public overlay architecture.

---

## B. Files changed

### Modified
- `apps/web/package.json`
- `apps/web/prisma/schema.prisma`
- `apps/web/src/app/(public)/[[...path]]/route.ts`
- `apps/web/src/app/admin/(dashboard)/pages/page.tsx`
- `apps/web/src/app/admin/(dashboard)/workflow-controls.tsx`
- `apps/web/src/auth/permissions.ts`
- `apps/web/src/cms/actions.ts`
- `apps/web/src/cms/modules.ts`
- `apps/web/src/cms/release.ts`
- `apps/web/src/cms/staff-create.ts`
- `apps/web/src/cms/staff-create.test.ts`
- `apps/web/src/cms/user-lifecycle.ts`
- `apps/web/src/cms/user-lifecycle.test.ts`
- `apps/web/src/documents/public-html-cache.ts`
- `apps/web/src/documents/render-published-document.ts`
- `apps/web/src/security/admin-hardening.test.ts`

### Added
- `apps/web/prisma/migrations/20261111090000_p0_page_lifecycle_seo_preview/migration.sql`
- `apps/web/src/cms/page-lifecycle.ts`
- `apps/web/src/cms/page-lifecycle.logic.test.ts`
- `apps/web/src/cms/page-lifecycle.db.test.ts`
- `apps/web/src/cms/draft-preview.ts`
- `apps/web/src/cms/draft-preview.test.ts`
- `apps/web/src/documents/page-seo.ts`
- `apps/web/src/documents/page-seo.test.ts`
- `apps/web/src/app/admin/(dashboard)/pages/[pageId]/page.tsx`
- `apps/web/src/app/admin/(dashboard)/preview/[token]/route.ts`
- `apps/web/scripts/p0-prepare-test-db.mjs`
- `apps/web/docs/P0-MIGRATION-ROLLBACK.md`
- `apps/web/docs/P0-FULL-ADMIN-CMS-COMMIT-CANDIDATE-REPORT.md`

---

## C. Database / schema implications

Migration `20261111090000_p0_page_lifecycle_seo_preview`:

- `clinics.public_cache_epoch` — multi-instance cache invalidation alignment
- `pages.seo_draft` — unpublished SEO draft JSON
- `draft_preview_tokens` — expiring/revocable preview tokens

Applied only to disposable local DB `wmc_p0_test`. **Not** applied to staging/production Supabase. Rollback SQL documented in `P0-MIGRATION-ROLLBACK.md`.

---

## D. Admin workflows implemented

1. **Pages hub** lists public pages → `/admin/pages/[pageId]`
2. **Unpublish** (`publish`/`unpublish_page` roles) → `Page.status=draft`, cache invalidate, public 404
3. **Archive** → `status=archived`, cache invalidate
4. **Restore & publish** (`publish`) → republish existing immutable revision only
5. **SEO draft save** (`manage_seo`) → `seoDraft` only
6. **SEO publish** (`publish`) → copies draft into live Page columns + cache bust; serve-time head rewrite
7. **Draft preview** (`preview_draft`) → mint token → `/admin/preview/[token]` (`private, no-store`, noindex)
8. **Workflow** split: Clinical sign-off → Practice approve → Publish

---

## E. Publishing and governance verification

- `clinical_reviewer`: `clinical_signoff`, `preview_draft` only (no practice approve / publish)
- `practice_approver`: `practice_approve`, `preview_draft` only
- `publisher`: `publish`, `unpublish_page`, `preview_draft` (+ Pages hub)
- `clinic_admin` retains combined authority (ops continuity)
- Practice approve fail-closed without prior clinical sign-off when a page exists
- Audit actions: `page.unpublish`, `page.archive`, `page.restore_publish`, `page.seo_*`, `preview.token_*`, `content.clinical_signoff`

---

## F. SEO rendering verification

- Live SEO from published Page columns injected in `getPublishedDocument` via `applyPageSeoToHtml`
- Draft `seoDraft` ignored until `publishPageSeo`
- Canonical absolute URLs rejected; index+noindex contradiction rejected
- Unit tests assert title/description/canonical/robots/OG injection

---

## G. Performance and cache implications

- Public path still uses generation-gated HTML cache
- Take-down/SEO publish call `bumpPublicCacheEpoch` + `invalidatePublicHtmlCache`
- Public route syncs memory generation from `Clinic.publicCacheEpoch` before HIT (multi-instance without Redis/CF changes)
- Draft preview never writes public cache (`Cache-Control: private, no-store`)

---

## H. Automated and browser test results

| Suite | Result |
|---|---|
| `npm run test:p0` (43 tests incl. disposable DB lifecycle) | **PASS** |
| `user-lifecycle.test.ts` | **PASS** |
| Recruitment HOLD + phone-only + insurance regression (in test:p0) | **PASS** |
| `npm run build` (prisma generate + Next production build + lint/types) | **PASS** |
| Browser: `GET /api/health` on `:3200` | Executed after start |
| Browser: full authenticated admin click-through | **Not PASS** — disposable DB has no seeded staff login; login route present in build (`/admin/login`, `/admin/pages/[pageId]`, `/admin/preview/[token]`) |

DB lifecycle proof (executed): published document → unpublish → `getPublishedDocument` null + sitemap exclusion → restore → published HTML with SEO title.

---

## I. Remaining defects and risks

1. **Static `/sitemap.xml`** still serves approved static file; DB `listIndexableUrls` is correct for helpers but production route not switched (URL architecture preserved by design).
2. **Internal nav links** to unpublished pages are not auto-rewritten (safe 404 on destination; link inventory cleanup is P1).
3. **Clinic admin two-step** clinical→practice approval is stricter than previous one-click Approve (intentional SoD).
4. **Authenticated browser E2E** needs seeded staff on disposable DB (P1 polish).
5. **Entity draft preview** currently page-centric; entity-type tokens supported in schema but UI mint is page-based.

---

## J. P1/P2 dependencies

- P1: dynamic sitemap from `listIndexableUrls`, nav dependency warnings on unpublish, seeded disposable admin E2E
- P1: section/block composition still out of scope (overlay architecture remains)
- P2: full page/section CRUD editor beyond SEO + lifecycle

---

## K. Final status

# **P0 COMMIT CANDIDATE READY**

Ready for operator review and an explicit commit when requested. No commit/push/merge/deploy performed by this agent run.
