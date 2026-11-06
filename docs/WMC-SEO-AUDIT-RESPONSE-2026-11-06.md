# SEO audit response — Woolloongabba Medical Centre (new platform)

Date: 2026-11-06  
Scope: Independent SEO audit findings against the pre-launch review host (`next.gabbamedicalcentre.com.au`) and production cutover plan.

## 1. HTTPS encryption (HTTP → HTTPS)

**Status: Fixed in application middleware (defence in depth).**

- Public hosts now issue a **301** from HTTP → HTTPS (preserving path + query).
- Local UAT (`127.0.0.1` / `localhost`) is intentionally left on HTTP so laptop review keeps working.
- Production cutover still uses Nginx TLS (`deployment/nginx/gabbamedicalcentre.tls.conf.example`), which also 301s HTTP → `https://gabbamedicalcentre.com.au`.
- Homepage HTML uses HTTPS canonicals (`https://gabbamedicalcentre.com.au/…`) and does not emit `http://` asset URLs (no mixed-content asset refs on the homepage).

**Note:** `next.` remains a **pre-launch review** hostname and continues to send `X-Robots-Tag: noindex, nofollow` until go-live.

## 2. LCP (target ≤ 2.5s)

**Status: Improved without removing content.**

- Hero LCP WebPs recompressed in place (same dimensions / art direction):
  - desktop ≈ 506 KB → ≈ 259 KB
  - tablet ≈ 399 KB → ≈ 216 KB
  - mobile ≈ 183 KB → ≈ 158 KB
- Existing responsive hero `picture` + `fetchpriority="high"` + media-specific preloads retained.
- Homepage Google Fonts stylesheet deferred (`rel=preload` → stylesheet on load) so font CSS is not render-blocking; `display=swap` kept.
- Hero photo carries explicit `sizes` for correct responsive selection.

Re-measure on the review host after cache purge / hard refresh.

## 3. CLS (target ≤ 0.10)

**Status: Hardened; keep measuring.**

Already in place / reinforced:

- Critical images carry width/height (hero, logos, trust marks, optimised below-fold variants).
- Sticky care bar reserves bottom padding (`.has-persistent-care-actions`).
- Serve-time delivery continues to inject missing dimensions for known asset paths.

Do not remove sticky booking/call UI for CLS alone — padding reservation is the intended fix.

## 4. WWW redirect

**Status: Configured for production preferred hostname (apex).**

- Preferred host: **`https://gabbamedicalcentre.com.au`** (no `www`).
- Application middleware 301s `www.gabbamedicalcentre.com.au` → apex over HTTPS.
- Nginx TLS example also 301s `www` → apex.
- `www.next.…` is not a configured review hostname (expected NXDOMAIN).

Canonical tags on approved pages already point at the apex HTTPS origin.

## 5. Indexing restrictions — keep until launch

**Status: Retained as requested.**

Pre-launch review (`UAT_QUICK_TUNNEL` / `next.`) continues to send:

- `X-Robots-Tag: noindex, nofollow`

Do **not** remove these until cutover GO. After launch approval:

1. Ship without the UAT quick-tunnel robots header.
2. Confirm production pages are indexable where intended.
3. Verify `robots.txt`, canonicals, and `sitemap.xml`.
4. Only then submit the apex property in Search Console.

## 6. Blog / articles CMS — confirmation

**Status: Already available (not WordPress).**

| Need | Where |
| --- | --- |
| Public articles / health content | `/knowledge/` (Knowledge hub + articles) |
| Practice updates / news | `/updates/` |
| Admin publishing UI | `/admin/knowledge` and `/admin/updates` |
| Workflow | Draft → Under Review → Approved → Published |
| Legacy `/blog/` URLs | 301 → `/knowledge/index.html` (Nginx `redirects.conf`) |

Marketing can publish and update SEO content through the admin CMS without a developer deploy for each article. Access is staff login (NextAuth); request accounts from the practice operator.

## 7. Additional pre-launch checks (spot evidence)

| Check | Result on review host |
| --- | --- |
| Mobile responsiveness | Join Our Team section audited/fixed at 390×844; homepage hero authority layout preserved |
| Navigation / internal links | Primary nav + Join Our Team present; attraction side-nav intact |
| Doctor profiles | `/doctors/dr-tanya-goodwill.html` → 200 |
| Services | `/services.html` → 200 |
| Booking | HotDoc lightbox URLs retained (`wp=w_lightbox`) |
| Knowledge hub | `/knowledge/index.html` → 200 |
| Updates hub | `/updates/index.html` → 200 |
| Sitemap / robots | `/sitemap.xml` + `/robots.txt` → 200 |
| Indexing on `next.` | Still blocked (`noindex`) — intentional |

## Next steps for cutover (ops, not code)

1. Keep `next.` noindex until GO.
2. After VPS + Cloudflare Full (strict) cutover, confirm HTTP/`www` → apex HTTPS with a clean 301 chain.
3. Re-run Lighthouse / SE Ranking on the **apex** (not `next.`).
4. Remove UAT robots restrictions only on the production artifact.
5. Provide marketing staff CMS logins for Knowledge + Updates.
