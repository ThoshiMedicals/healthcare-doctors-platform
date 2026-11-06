# GP Attraction — SEO & security launch readiness

**Date:** 2026-11-04  
**Source report:** `Downloads/issues_overview_report_3.csv` (Screaming Frog overview, 18:35)  
**Live verify:** `https://next.gabbamedicalcentre.com.au` + `http://127.0.0.1:3100`  
**Assumptions:** `next.` remains UAT · production launch has not occurred · no IA / copy / navigation changes in this review  

Interactive matrix: canvas `attraction-seo-security-launch-readiness`.

---

## Verdict

| Gate | Status |
| --- | --- |
| UAT / next. crawler isolation | **PASS** (`X-Robots-Tag` + meta `noindex,nofollow`) |
| Attraction production indexability | **HOLD** (still EV noindex; sitemap incomplete for Attraction) |
| Image SEO on live Attraction HTML | **WARN** (7 PE JPGs >100 KB; alts/dimensions currently pass) |
| CSP enforce | **WARN** (Report-Only only) |
| HSTS / Referrer-Policy on HTML | **PASS*** (SF shows 1 outlier URL each) |
| DNS / VPS cutover | **NO-GO** (ops — see `deployment/LAUNCH.md`) |

Screaming Frog **High** “Noindex / Nofollow” on next. are **expected isolation controls**, not production defects.

---

## 1. Production SEO checklist

| # | Check | Priority | Status |
| --- | --- | --- | --- |
| S1 | Keep `next.` `X-Robots-Tag: noindex, nofollow` for entire UAT life (`UAT_QUICK_TUNNEL`) | Must | Open (operator confirm) |
| S2 | Do not submit `next.` / tunnel URLs to GSC or Bing Webmaster | Must | Open |
| S3 | Decide Attraction Index Gate: Soft (all noindex) vs Selective index | Must | Open |
| S4 | At Selective index: flip `Page.robots` + HTML meta only for approved hub/story/FAQ/conversion paths | Must | Blocked |
| S5 | At Selective index: controlled `sitemap.xml` add for those paths only (approved-file change, not ad-hoc) | Must | Blocked |
| S6 | Tools + EOI remain `noindex` forever and stay out of sitemap | Must | Policy |
| S7 | Production self-canonical on apex host (no `next.` in canonical / og:url) | Must | Open |
| S8 | Post-flip Screaming Frog / GSC crawl: zero unexpected Attraction noindex | Must | Blocked |
| S9 | Compress PE chapter images ≤100 KB or ship WebP; keep `width`/`height` | Should | Open |
| S10 | Re-validate alt text after approved photography replaces concept crops | Should | Open |

---

## 2. Production security checklist

| # | Check | Priority | Status |
| --- | --- | --- | --- |
| H1 | CSP-Report-Only present on public HTML | Must | **PASS** on next. / :3100 |
| H2 | ≥7 days clean CSP violation reports before enforce | Must | Open |
| H3 | Production: set `CSP_REPORT_ONLY=false` to emit enforcing `Content-Security-Policy` | Must | Blocked |
| H4 | HSTS `max-age=31536000; includeSubDomains` on apex + www (CF + origin) | Must | **PASS** on sampled HTML |
| H5 | Do **not** enable HSTS preload until every subdomain is HTTPS-only | Must | Policy |
| H6 | `Referrer-Policy: strict-origin-when-cross-origin` on all URL classes (close SF outlier) | Must | Open |
| H7 | Keep `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`, Permissions-Policy | Must | **PASS** |
| H8 | `/admin` + `/api/*` keep middleware `X-Robots-Tag: noindex, nofollow` | Must | **PASS** |
| H9 | Cloudflare Full (strict) + origin cert before public DNS | Must | **NO-GO** (ops) |

**SF false positive note:** “Missing Content-Security-Policy Header” fires because the app sends `Content-Security-Policy-Report-Only`. That is intentional until report noise is clean.

---

## 3. Launch readiness matrix

| Gate | Domain | Status | Evidence |
| --- | --- | --- | --- |
| UAT / next. isolation | SEO | PASS | Tunnel headers + EV meta `noindex,nofollow` on all 15 pages |
| Attraction production index flip | SEO | BLOCKED | EV promote hard-codes `robots: noindex,nofollow`, `indexable: false` |
| Canonical host integrity | SEO | PASS (UAT) | Canonicals → `https://gabbamedicalcentre.com.au/…` |
| Sitemap parity (indexable Attraction) | SEO | NOT READY | Only `join-our-team.html` in approved sitemap |
| Image weight (live Attraction) | Perf | WARN | 7 PE JPGs 122–146 KB; journey features 65–89 KB OK |
| Alt + dimensions (live Attraction) | A11y/SEO | PASS | 0 empty alt / 0 missing width×height on current HTML |
| CSP enforce | Security | WARN | Report-Only only (`security-headers.ts`) |
| HSTS | Security | PASS* | Present on HTML; SF 1 URL missing |
| Referrer-Policy | Security | PASS* | `strict-origin-when-cross-origin` on HTML; SF 1 URL missing |
| XFO / nosniff / Permissions-Policy | Security | PASS | Observed on next. and :3100 |
| DNS cutover / VPS ops | Ops | NO-GO | Separate from Attraction SEO flip |

---

## 4. Noindex / Nofollow decision table (every Attraction page)

**Current** = live Experience Validation / `next.`  
**Production target** = recommended at **Selective Index Gate**  
**Soft-launch alternative** = leave every row as `noindex,nofollow` until photography + stakeholder sign-off

| Path | Class | Current (UAT) | Production target | Sitemap | Rationale |
| --- | --- | --- | --- | --- | --- |
| `join-our-team.html` | Hub | noindex,nofollow | **index,follow** | Yes (already) | Primary GP entry |
| `about-us/practice-experience.html` | Story | noindex,nofollow | **index,follow** | Add at index GO | Flagship practice narrative |
| `about-us/community-catchment.html` | Story | noindex,nofollow | **index,follow** | Add at index GO | Place + patients |
| `about-us/continuity-in-practice.html` | Story | noindex,nofollow | **index,follow** | Add at index GO | Continuity evidence |
| `about-us/clinical-interests.html` | Story | noindex,nofollow | **index,follow** | Add at index GO | Clinical fit |
| `join-our-team/gp-opportunities.html` | Conversion | noindex,nofollow | **index,follow** | Add at index GO | Roles + fit |
| `join-our-team/practice-support.html` | Story | noindex,nofollow | **index,follow** | Add at index GO | Support around consult |
| `join-our-team/registrar-pathway.html` | Story | noindex,nofollow | **index,follow** | Add at index GO | Early-career path |
| `join-our-team/gp-faq.html` | FAQ | noindex,nofollow | **index,follow** | Add at index GO | Pre-contact answers |
| `join-our-team/opportunity-pack.html` | Utility | noindex,nofollow | **index,follow** (optional) | Optional | Bookmark pack — thin-content risk |
| `join-our-team/doctor-readiness.html` | Tool | noindex,nofollow | **noindex,follow** | Never | Private sense-check |
| `join-our-team/provider-number-readiness.html` | Tool | noindex,nofollow | **noindex,follow** | Never | Optional paperwork aid |
| `join-our-team/dpa-navigator.html` | Tool | noindex,nofollow | **noindex,follow** | Never | DPA / 19AB aid |
| `join-our-team/session-planner.html` | Tool | noindex,nofollow | **noindex,follow** | Never | Preferred-days aid |
| `join-our-team/express-interest.html` | Form | noindex,nofollow | **noindex,follow** | Never | EOI form; allow equity to land |

### Strategy summary

- **Noindex:** UAT always. Production indexes only hub/story/FAQ/conversion after Index Gate. Tools + EOI never index.
- **Nofollow:** UAT pairs with noindex. Production indexed pages use **follow**. Production noindex tools/forms use **follow** so CTAs into EOI can pass equity.
- **Admin / API:** always `noindex,nofollow` via middleware (unchanged).

---

## 5. Image optimisation action list

Live Attraction HTML references (sizes on disk):

| Asset | KB | Markup today | Action |
| --- | --- | --- | --- |
| `assets/practice-experience/community.jpg` | 145.8 | width/height + alt | Priority compress / WebP ≤100 KB |
| `assets/practice-experience/reception.jpg` | 136.4 | width/height + alt | Compress / WebP |
| `assets/practice-experience/team-interactions.jpg` | 127.6 | width/height + alt | Compress / WebP |
| `assets/practice-experience/feature-atmosphere.jpg` | 127.1 | width/height + alt | Compress / WebP |
| `assets/practice-experience/continuity.jpg` | 125.8 | width/height + alt | Compress / WebP |
| `assets/practice-experience/nursing.jpg` | 123.8 | width/height + alt | Compress / WebP |
| `assets/practice-experience/typical-day.jpg` | 122.3 | width/height + alt | Compress / WebP |
| `assets/attraction/journey/community-catchment-feature.jpg` | 89.3 | width/height + alt | OK until approved photography |
| `assets/attraction/journey/join-our-team-feature.jpg` | 69.1 | width/height + alt | OK |
| `assets/attraction/journey/gp-opportunities-feature.jpg` | 64.7 | width/height + alt | OK |
| Brand logo + AGPAL mark | ≤24 | width/height + alt | OK |
| `renderStoryFigure()` helper | — | **omits** width/height | Add dimensions before reuse |
| `assets/attraction/placeholders/*` | 129–497 | Suppressed in EV render | Never ship placeholders to indexed production |

**Alt quality (current live HTML):** descriptive, practice-first; no empty alts found. Re-audit after photography swap. Trim any alt >100 characters if SF opportunity reappears.

---

## Screaming Frog report mapping

| SF issue | Priority | URLs | Interpretation | Launch action |
| --- | --- | --- | --- | --- |
| Directives: Noindex | High | 28 | Expected on next. | Keep until Index Gate |
| Directives: Nofollow | High | 28 | Expected on next. | Split follow policy at flip |
| Canonicals: Canonicalised | High | 1 | next. HTML → apex canonical | Correct for UAT; verify self-canonical on apex |
| Images: Over 100 kB | Medium | 5 | PE chapter JPGs | Compress before index |
| Missing CSP header | Low | 29 | SF ignores Report-Only | Enforce after clean reports |
| Missing HSTS | Low | 1 | Outlier vs HTML PASS | Confirm CF/origin on all classes |
| Missing Referrer-Policy | Low | 1 | Outlier vs HTML PASS | Same |
| Missing size attributes | Low | 6 | Stale vs current HTML PASS | Harden `renderStoryFigure` |
| Missing alt text | Low | 2 | Stale vs current HTML PASS | Re-crawl after asset swap |
| Alt text >100 characters | Low | 1 | Opportunity | Trim at photography pass |

---

## Code / config anchors (read-only reference)

| Concern | Location |
| --- | --- |
| UAT `X-Robots-Tag` | `apps/web/next.config.ts` (`UAT_QUICK_TUNNEL`) |
| Admin/API robots | `apps/web/src/middleware.ts` |
| CSP / HSTS / Referrer | `apps/web/security-headers.ts` |
| EV page robots meta + promote | `apps/web/src/attraction-cms/ev-shell.ts`, `promote-page.ts` |
| Approved robots/sitemap | `apps/web/public/robots.txt`, `sitemap.xml` (+ golden master parity) |

---

## Explicit non-goals (this review)

- No content, IA, or navigation changes  
- No production robots flip executed  
- No sitemap rewrite executed  
- No CSP enforce flip executed  
