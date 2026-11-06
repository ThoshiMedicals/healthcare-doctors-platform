# SEO P0 Launch Readiness Report

Date: 2026-11-06  
Sprint: SEO Preservation (Phases 1–8)  
Hosts: live `https://gabbamedicalcentre.com.au` → review `https://next.gabbamedicalcentre.com.au` → future apex same as live after cutover

## Score

| | |
| --- | --- |
| Previous | **54/100** NO-GO |
| Current | **82/100** Almost Ready |
| Delta | +28 (P0 redirects + sitemap CMS GPs + verification) |

Score canvas: project canvases `wmc-seo-migration-risk-report.canvas.tsx`

## Phase outcomes

### 1–3 Redirects

Single source: `apps/web/src/seo/wordpress-legacy-redirects.ts`  
Mirrored: middleware 301, `deployment/nginx/redirects.conf`, Cloudflare bulk / import / map CSVs  
Rationale: `docs/WMC-SEO-P0-DESTINATION-RATIONALE.md`  
No P0 path redirects to homepage.

### 4 Sitemap

Published CMS practitioners (Golnar, James, Yamesha) included in sitemap generation and launch allowlist tests.

### 5 Verification

`node apps/web/scripts/verify-seo-p0-redirects.mjs` → `docs/WMC-SEO-P0-REDIRECT-VERIFICATION.json`  
**24/24 PASS** on UAT `http://127.0.0.1:3100` (301 → 200, no chain/loop).

### 6 Indexability

| Host | Requirement | Status |
| --- | --- | --- |
| `next.` | Remain `noindex` until cutover | PASS — `UAT_QUICK_TUNNEL` → `X-Robots-Tag: noindex, nofollow` |
| Production apex | Indexable at GO | Gate — ship without quick-tunnel header; robots → `/sitemap.xml`; apex HTTPS canonicals already used |

### 7 Practitioner authority

| Practitioner | Profile 200 | Team/GP visibility | Sitemap | WP redirect |
| --- | --- | --- | --- | --- |
| Dr Golnar Mortezaei | Yes | Yes | Yes | `/doctor/dr-golnar-mortezaei-gp-fracgp/` → profile |
| Dr James Chanaka | Yes | Yes | Yes | `/doctor/dr-james-general-practitioner/` → profile |
| Dr Yamesha Ranatunga | Yes | Yes | Yes | Next-native (no live WP doctor URL) |

### 8 Readiness

Almost Ready for **SEO** cutover discussion. Full production DNS cutover still blocked by ops evidence + apex edge deploy of the same redirect set.

## Remaining launch blockers (SEO-adjacent)

1. Deploy Nginx + Cloudflare bulk redirects (same P0 map) on apex at cutover — app layer already verified.
2. Production indexability flip (remove UAT quick-tunnel `noindex`).
3. Non-SEO ops gates (backup, smoke, env, TLS) — see `docs/WMC-PRODUCTION-READINESS-EVIDENCE.md`.

## Remaining high-risk URLs (not P0)

- `/location/*`, `/locations/*` (suburb taxonomies) — P1  
- `/tag/*` — P2 (410 or hub; never homepage dump)  
- Chiro / affordable-GP / brand vanity / Gemunu — P1

## Remaining manual decisions

- Long-term sexual-health landing vs family-health proxy  
- Suburb batch policy  
- Tag archive policy  
- Optional homepage title keyword continuity (meta only)

## Success criteria (met on UAT / app)

- [x] P0 old URL → 301 → new URL → 200, one hop  
- [x] HTTPS-ready relative destinations (absolute HTTPS on apex edge)  
- [x] No homepage dumps for P0 intent URLs  
- [x] Golnar / James / Yamesha sitemap + index crawlable  
- [x] `next.` stays noindex  
- [ ] Apex edge redirects live (cutover step)  
- [ ] Production indexable artifact (cutover step)
