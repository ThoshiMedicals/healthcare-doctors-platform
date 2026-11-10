# WMC — Sprint 1 staging acceptance (formal close)

**Status:** STAGING ACCEPTED  
**Closed:** 2026-11-09  
**Production cutover:** NO-GO (unchanged)

## Accepted identities

| Item | Value |
|------|--------|
| Repository | `ThoshiMedicals/healthcare-doctors-platform` |
| Release branch | `release/wmc-hostinger-rc1` |
| Accepted Git commit | `ec71759e0df9f27393f94e83b740f34754955ed9` |
| Parent | `aec510d0be29671611dac9b57bcdc1f702884518` |
| Hostinger staging host | `https://mediumslateblue-eagle-960503.hostingersite.com` |
| Hostinger build UUID | `01a1bfd6-8cb4-71cf-9679-6f43d75480fd` |
| Deploy artifact | Archive `wmc-ec71759.zip` (git archive of accepted SHA) |
| `gitAutoDeployment` | `null` (unchanged; auto-deploy not enabled) |
| Staging database | Supabase `wmc-hostinger-staging` (`thwcxuhrzgkufvdrvzzt`) |

## Scope accepted

| ID | Outcome on staging |
|----|--------------------|
| UX-001 | Recruitment HOLD fail-closed for ten Attraction children (GET/HEAD 404); hub 200 + noindex; EOI/readiness APIs 403 |
| UX-003 | Phone-only practitioner profiles (Golnar, Mary): reception CTAs; HotDoc chrome suppressed on profile |
| UX-002 (core) | Profile booking mode consistent; welcome presentation partially corrected |

Sprint 1 did **not** rewrite published CMS revisions (B1F preserved).

## Validated release gates (staging)

| Gate | Result |
|------|--------|
| Production build (pre-deploy) | PASS |
| Automated tests | PASS (400/400) |
| Targeted HOLD + booking tests | PASS |
| Hostinger deploy completed | PASS |
| Runtime health `/api/health` | PASS (`database: up`) |
| Ten recruitment children blocked | PASS |
| Recruitment APIs HOLD | PASS |
| Phone-only / online booking matrix | PASS (profiles) |
| Cache-bust tokens `site.js` / `updates-data.js` | PASS |
| Homepage hero authority v6 | PASS |
| Staging HTML `X-Robots-Tag` noindex | PASS |

**Overall staging verdict:** PASS WITH CONDITIONS (non-blocking residuals below).

## Non-blocking residuals → Sprint 2 backlog

| ID | Item | Notes |
|----|------|--------|
| S1-R1 | Golnar welcome **meta** still mentions online booking | Presentation regex missed `content` before `name` |
| S1-R2 | Golnar welcome **summary grammar** | Partial phrase replace left awkward wording |
| S1-R3 | Welcome-page **clinic HotDoc chrome** | Profile pages clean; welcome article still shows clinic Book |
| S1-R4 | Keyboard / focus accessibility smoke | Not instrumented in Sprint 1 staging pass |
| S1-R5 | Git-connected Hostinger deploy | Still archive-based; `gitAutoDeployment` null |
| S1-R6 | Staging robots/noindex protection review | HTML headers OK; CDN/`robots.txt` `*` Allow discrepancy remains |

## Rollback procedure

1. Redeploy prior Hostinger archive `wmc-131c499.zip` (build `01a1b7c6-…`) **or** archive of `aec510d`.
2. Call authorised staging public-cache-bust after rollback.
3. Re-verify ten recruitment children remain blocked (do not assume pre-HOLD archives are safe).
4. Git: revert or reset release tip only with explicit operator authorisation (no force-push to shared history without approval).

## Production deployment restrictions

- Do **not** deploy this SHA to production apex.
- Do **not** change DNS, Cloudflare, or live WordPress.
- Do **not** lift `RECRUITMENT_HOLD_LIFTED`.
- Do **not** rewrite B1F clinical approvals or published CMS revisions for residual welcome copy without content governance.
- Keep staging non-indexable for patient discovery purposes (prefer HTML/`X-Robots-Tag` + app robots; treat CDN robots alone as insufficient).

## Authority sources

- Enterprise pre-launch audit pack (agent store): UX-001 / UX-002 / UX-003 authorised for Sprint 1.
- Staging release evidence: controlled Hostinger deploy of `ec71759` / build `01a1bfd6-…`.
