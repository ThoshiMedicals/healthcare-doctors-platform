# WMC — Phase 3 Controlled Pre-Launch Remediation

**Date:** 2026-11-07  
**Roles:** Principal Release Manager / Next.js Architect / SEO Migration / Healthcare QA  
**Baseline rollback tip:** **`ae202f2`**  
**Stage A evidence commit:** **`af2f53e`** (docs only)  
**Authority NEXT:** https://next.gabbamedicalcentre.com.au — **unchanged content** (UAT process rebuilt only)  
**Hostinger staging:** https://mediumslateblue-eagle-960503.hostingersite.com  
**Production DNS / WordPress:** **untouched — NO-GO**

Source backlog: [`docs/WMC-PHASE1-PHASE2-CONSOLIDATED-BACKLOG.md`](./WMC-PHASE1-PHASE2-CONSOLIDATED-BACKLOG.md)  
Ops guide reconciled: [`deployment/LAUNCH.md`](../deployment/LAUNCH.md)

---

## Final decisions (Phase 3)

| Gate | Decision |
|------|----------|
| **PATIENT WEBSITE** | **CONDITIONAL GO** |
| **GP RECRUITMENT** | **HOLD** |
| **SEO** | **CONDITIONAL GO** |
| **PRODUCTION DNS** | **NO-GO** |

---

## Stage A — Release evidence preserved

| Item | Value |
|------|-------|
| Local HEAD before Phase 3 code/docs work | `ae202f2` |
| Remote `origin/release/wmc-hostinger-rc1` at start | `ae202f2` |
| Rollback point | **`ae202f2`** — restore code tip; Stage A docs are additive at `af2f53e` |
| Backlog + RC evidence in git | Committed in `af2f53e` (no secrets, no tmp probes, no `.env`) |
| NEXT public content | Not edited |

---

## Results table

| ID | Issue | Change | Verification | Status | Remaining approval |
|----|-------|--------|--------------|--------|-------------------|
| P3-A1 | Backlog not in source control | Committed Phase 1–2 backlog + RC evidence docs | `git show af2f53e --stat` | **DONE** | Push to origin when operator ready |
| P3-A2 | Rollback undocumented | Documented tip `ae202f2` in LAUNCH + this report | Docs | **DONE** | — |
| P3-B1 | LAUNCH.md VPS-only / outdated | Rewrote for Hostinger Web App + Supabase Postgres; VPS → Appendix H | File review | **DONE** | Operator follow LAUNCH Hostinger path |
| P3-B2 | Prod/staging DB isolation | Evidence checklist in LAUNCH (E1–E2) | No prod Supabase project filed | **BLOCKED** | Ops create dedicated prod DB |
| P3-B3 | Backup + recovery drill | Checklist E3 | No off-box restore log | **BLOCKED** | Ops |
| P3-B4 | Auth.js production config | Checklist E4; staging keys present (masked) | Prod host not configured | **BLOCKED** | Ops |
| P3-B5 | Persistent private files | Staging has `PRIVATE_OBJECT_STORE` key | Restart survival drill not re-run this pass | **PARTIAL** | Ops synthetic drill |
| P3-B6 | Build reproducibility | Archive deploy previously proven; Git auto-deploy null | `gitAutoDeployment: null` | **PARTIAL** | Reconnect Git in hPanel |
| P3-B7 | Cloudflare Full (strict) + custom domain | Checklist E8 | No dashboard evidence | **BLOCKED** | Ops |
| P3-B8 | DNS rollback values | Checklist E10 | Not recorded | **BLOCKED** | Ops record A/AAAA |
| P3-B9 | WordPress still live | No DNS change | Apex unchanged | **PASS (protect)** | Keep until Go |
| P3-B10 | Email + booking prod config | HotDoc staging probes only | Prod mailbox/HotDoc sign-off open | **BLOCKED** | Practice + ops |
| P3-C1 | UAT `.next-uat` missing robots/sitemap → HTTP 400 | `npm run uat:build`; restart `:3100` | `:3100` + `next.` robots/sitemap **200**, `text/plain` / `application/xml`, `no-store`, staging `X-Robots-Tag`, Disallow/empty urlset | **DONE** | Keep UAT process on rebuilt dist |
| P3-C2 | Hostinger CDN shadows `/robots.txt` | App middleware correct; CDN still returns platform `Allow: /` without `X-Robots-Tag` | Sitemap hits app (`X-Robots-Tag` + empty urlset); robots CDN body unchanged | **BLOCKED** | hPanel/Hostinger support: disable platform robots or route `/robots.txt` to Node |
| P3-C3 | Production sitemap/canonical readiness | Approved assets in `seo-approved/*`; LAUNCH updated | Dev `:3000` production robots/sitemap **200** with apex locs | **READY (code)** | Cutover host attestation |
| P3-C4 | Staging noindex vs prod indexability | Hostname rule + docs; warn against `STAGING_NOINDEX` on apex | Staging HTML `X-Robots-Tag` present; Hostinger env lacks `STAGING_NOINDEX`/`UAT_QUICK_TUNNEL` (hostname lock still applies) | **DONE (staging)** / **BLOCKED (prod env proof)** | Prod env attestation |
| P3-C5 | WP legacy redirects | No code change; probed Hostinger | `/doctor/dr-james-…` → 301 `/doctors/dr-james.html`; bulk-billing P0 301; `/locations/…` 404 expected residual | **PASS (P0 map)** | Expand inventory acceptance |
| P3-D1 | Usman notice clarity | Preview only — **not published** | `docs/previews/usman-booking-notice-preview.html` | **PREVIEW READY** | **Clinical Principal sign-off** |
| P3-E1 | GP recruitment HOLD isolation | Documented approved vs incomplete (below) | Live probes: join/EOI/gp-opportunities 200 + noindex header | **DOCUMENTED HOLD** | Attraction authenticity + Index Gate |
| P3-F1 | `site.js` golden hash drift | Synced `old-html/site.js` ← `public/site.js` (UTF-8 comment only) | Byte-identical SHA | **DONE** | — |
| P3-F2 | Regression suite | `npm test` / `tsc` | After site.js sync: re-run expected; vitest-only tsc errors remain known P3 | **PARTIAL** | Optional vitest types exclude |

---

## Completed technical repairs

1. **Stage A git evidence** at `af2f53e`.  
2. **`deployment/LAUNCH.md`** reconciled to Hostinger Web App + Supabase (VPS superseded to Appendix H).  
3. **UAT rebuild** — robots.txt + sitemap.xml **200** on `:3100` and `next.` (was 400). Staging Disallow + empty sitemap retained. Homepage still `hero--authority-v6`.  
4. **Usman clinical preview** prepared under `docs/previews/` — **not** applied to golden/CMS/NEXT/Hostinger.  
5. **`site.js` ↔ golden** byte sync (encoding-only drift).  

**Not done (by design):** DNS cutover, WordPress mutation, Usman live publish, Attraction photography/testimonials invention, Hostinger CDN robots (platform BLOCKED).

---

## Missing operational evidence (BLOCKED)

| ID | Evidence |
|----|----------|
| E1–E2 | Dedicated production Supabase project isolated from staging |
| E3 | Off-box backup + tested restore log |
| E4 | Production Auth.js env on production Hostinger site (not staging) |
| E7 | Git auto-deploy reconnect (`gitAutoDeployment` currently null) |
| E8 | Cloudflare Full (strict) + Hostinger custom-domain TLS evidence |
| E10 | Recorded DNS A/AAAA rollback values for apex + www |
| E11 | Production email + HotDoc production sign-off |
| P3-C2 | Hostinger hCDN `/robots.txt` routed to Node app |

Staging HTML remains noindex via `X-Robots-Tag` even while CDN robots say `Allow: /` for `*` — do not treat CDN robots alone as “indexable staging.”

---

## Clinical approvals required

| Item | Status |
|------|--------|
| Usman `.practitioner-booking-notice` proposed wording | **Awaiting Clinical Principal / practice owner** |
| Publish path after approval | Update published revision from golden `old-html/doctors/dr-usman-gul.html` on **NEXT and Hostinger together**; HotDoc slug unchanged |
| Preview | `docs/previews/usman-booking-notice-preview.html` |

**Proposed notice (from approved `#booking-conditions` only):**

> Dr Gul currently sees male patients in person. Female patients may be seen by telehealth only, under Queensland Office of the Health Ombudsman conditions. [Read full booking conditions.](#booking-conditions)

---

## Recruitment HOLD conditions

### Approved / working (chrome)

| Surface | Status | Notes |
|---------|--------|-------|
| `/join-our-team.html` | 200 + staging noindex | Sticky GP Portal / Discuss / Call |
| `/join-our-team/express-interest.html` | 200 + noindex | Live EOI form present |
| `/join-our-team/gp-opportunities.html` | 200 + noindex | Opportunities hub |
| Nav “Join Our Team” | Present via `public-ux.ts` | Patient nav exposure exists |

### Incomplete / not production-ready

| Item | Status |
|------|--------|
| Authentic WMC photography (concept imagery) | HOLD — gap P0-1 |
| Consented GP/nurse/reception voices | HOLD — gap P0-2 |
| Flexible Sessions visual completeness | HOLD — gap P0-3 |
| Attraction Index Gate (soft-launch vs selective index) | HOLD — gap P0-4; EV shell hard `noindex,nofollow` |
| EOI operational ownership / SLA | HOLD — gap P0-5 |
| Deeper Attraction sitemap expansion | HOLD until Index Gate |
| `/practice-experience.html` | 404 on Hostinger probe this pass — do not market as live |

### Safe patient-site launch strategy

1. Cut over **patient** public site only when ops P0 evidence PASS.  
2. Keep Attraction/EV surfaces **noindex** until authenticity + Index Gate PASS.  
3. Join hub may remain reachable for soft interest, but **do not** claim production recruitment marketing, expand sitemap for Attraction, or invent photography/testimonials.  
4. Document EOI mailbox owner before any paid/campaign traffic.  
5. Do not treat join sticky CTAs as proof of Attraction go-live.

---

## Production cutover blockers (unchanged NO-GO)

1. Ops evidence E1–E4, E7–E8, E10–E11 **BLOCKED**.  
2. Hostinger CDN robots attestation for **production hostname** not yet possible (custom domain not attached).  
3. Clinical Usman notice optional for DNS but recommended before patient Go marketing.  
4. Recruitment HOLD must not be silently flipped to indexable.

---

## Stage F — Regression verification summary

| Check | Result |
|-------|--------|
| UAT robots/sitemap | **PASS** (200, correct bodies, no-store, noindex headers) |
| NEXT tunnel robots/sitemap | **PASS** (same as UAT) |
| Hostinger sitemap | **PASS** (empty + noindex) |
| Hostinger robots | **FAIL / BLOCKED** (CDN shadow) |
| Homepage hero v6 | **PASS** on UAT + Hostinger |
| Tanya profile | **PASS** 200 |
| Legacy WP redirects (sample) | **PASS** 301 |
| Staging noindex HTML | **PASS** |
| CMS content mutated | **No** (except docs preview file) |
| Performance remediation reopened | **No** |
| Production DNS | **No change** |
| `tsc --noEmit` | Known vitest-only failures (**PARTIAL**) |
| Golden `site.js` | Synced (**PASS** after P3-F1) |

---

## Recommended next actions (operator)

1. Push `af2f53e` (+ follow-up Phase 3 commit) to `origin/release/wmc-hostinger-rc1` when ready.  
2. Reconnect Hostinger Git auto-deploy.  
3. File BLOCKED ops evidence per LAUNCH E-table.  
4. Disable Hostinger platform `/robots.txt` override or confirm Node routing on custom domain.  
5. Clinical sign-off on Usman preview → then dual publish.  
6. Keep recruitment HOLD until Attraction P0 authenticity closes.
