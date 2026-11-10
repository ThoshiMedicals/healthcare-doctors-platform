# WMC CMS P0 — Final Acceptance Report

**Worktree:** `C:\Users\RoshanSamarawickrema\Desktop\WMC-p0-full-admin-cms`  
**Branch:** `p0/full-admin-cms-foundation`  
**Baseline:** `89907135e492255eb1a8e2007ef3d5313a327cd1`  
**Disposable DB:** `wmc_p0_test` (local only)  
**Credentials:** stored only in gitignored `.data/p0-acceptance-credentials.json` (not printed)

---

## A. Authenticated Admin browser test results

Playwright Chromium against `http://127.0.0.1:3200` (production `next start` build).

| Role | Sign-in | Result |
|---|---|---|
| Clinic administrator | Yes | PASS — Admin + Pages hub + page detail |
| Clinical reviewer | Yes | PASS — governance reachable; no unpublish |
| Practice approver | Yes | PASS — governance reachable |
| Publisher | Yes | PASS — lifecycle controls visible |
| Restricted staff (`content_editor`) | Yes | PASS — no Unpublish / Publish SEO |

**Aggregate:** **44 / 44 PASS** (see `.data/p0-acceptance-results.json`).

---

## B. Page lifecycle verification

| Step | Result |
|---|---|
| Open Admin → select test page | PASS |
| Unpublish | PASS → status `draft` |
| Public URL | PASS → HTTP **404** |
| Sitemap eligibility (`listIndexableUrls`) | PASS → excluded |
| Archive | PASS → status `archived` |
| Restore & publish (authorised) | PASS → status `published`, public **200** |
| Governance SoD on restore path | PASS — restore requires `publish` |
| Revisions preserved | PASS (count ≥ 1) |
| Audit history | PASS (`page.unpublish`, `page.archive`, `page.restore_publish`) |

---

## C. SEO publication verification

| Check | Result |
|---|---|
| SEO draft save does not change live Page title | PASS |
| Public metadata unchanged before SEO publish | PASS |
| After publish, title/description/OG in rendered HTML head | PASS |
| Single canonical | PASS |
| No conflicting robots | PASS |
| Unrelated page (404.html) unchanged | PASS |
| Cache invalidation via publish SEO | PASS (live head updated immediately) |

---

## D. Preview security verification

| Check | Result |
|---|---|
| Authorised draft preview opens | PASS |
| `Cache-Control: private, no-store` | PASS |
| noindex (`X-Robots-Tag` / meta) | PASS |
| Draft banner present | PASS |
| Public page unchanged by preview | PASS |
| Token clinic-scoped | PASS |
| Revoked token unusable | PASS |
| Expired token unusable | PASS |
| Unauthorised roles lack unpublish (proxy for elevated ops) | PASS |

**Defect fixed during acceptance:** `createPageDraftPreview` caught Next.js `redirect()` as an error (try/catch). Redirects moved outside try/catch.

---

## E. Role-based access results

| Operation | clinic_admin | clinical_reviewer | practice_approver | publisher | restricted |
|---|---|---|---|---|---|
| Sign in | PASS | PASS | PASS | PASS | PASS |
| Unpublish UI | allowed | denied | denied* | allowed | denied |
| Publish SEO UI | allowed | denied* | denied* | allowed | denied |
| Governance nav | yes | yes | yes | yes | no |
| Practice approve w/o clinical sign-off | — | — | **blocked** | — | — |
| Practice approve after clinical sign-off | — | sign-off PASS | **allowed** | — | — |

\*Via UI absence / Pages access rules; server actions also gated by `requireAction`.

---

## F. Database migration safety

Migration `20261111090000_p0_page_lifecycle_seo_preview`:

- Applied successfully to disposable `wmc_p0_test` via `scripts/p0-prepare-test-db.mjs`
- Additive only: `public_cache_epoch`, `seo_draft`, `draft_preview_tokens` (+ unique/index/FKs)
- No DROP of page/revision tables; existing rows preserved
- Rollback SQL documented in `docs/P0-MIGRATION-ROLLBACK.md`
- **Not** applied to Hostinger staging or production Supabase

**Deploy ordering (documented):** backup → migrate disposable/staging when approved → verify → app deploy. Never migrate production from this worktree without a separate ops gate.

---

## G. Performance results

Local production server, 8 samples of `GET /p0-acceptance.html` after SEO/lifecycle paths:

- **p50 = 15 ms**, **p95 = 17 ms** (warm local)
- Immutable `PageRevision` HTML architecture preserved (serve-time SEO inject + status gate only)
- No significant latency regression vs Sprint 2 local expectations (sub-second public HTML)

---

## H. Automated test and build results

| Gate | Result |
|---|---|
| `npm run test:p0` | PASS |
| `user-lifecycle.test.ts` | PASS |
| Playwright acceptance (44) | PASS |
| `npm run build` (generate + lint/types + production) | PASS |

---

## I. Local Git commit SHA

`427ca679398b163487648d31e605eb2e9b9935a2`

Message: `feat(wmc): add governed CMS page lifecycle SEO preview and role permissions`  
Local only — not pushed. Worktree preserved on `p0/full-admin-cms-foundation`.  
Confirm with `git rev-parse HEAD` if this document is ever amended after recording.

---

## J. Outstanding defects

1. Static `/sitemap.xml` route still serves approved static XML (DB eligibility helper is correct; dynamic swap is P1).
2. Internal nav links to unpublished pages are not auto-pruned (destination 404 is correct; inventory UX is P1).
3. Full matrix of every governance page for every role not exhaustively click-tested beyond hub/governance/pages (critical SoD paths covered).

None are P0 commit blockers.

---

## K. Final verdict

# **P0 LOCALLY ACCEPTED**
