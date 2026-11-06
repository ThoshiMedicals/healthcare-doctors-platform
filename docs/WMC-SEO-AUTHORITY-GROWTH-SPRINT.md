# SEO Authority Recovery & Growth Sprint

Date: 2026-11-06  
Evidence: `docs/WMC-SEO-GROWTH-AUDIT-EVIDENCE.json` · UAT `127.0.0.1:3100`  
Constraint: no redesign, no recruitment changes, no practitioner architecture changes, no invented clinical content.

## Score posture

| Layer | Status |
| --- | --- |
| Preservation (P0 redirects / sitemap) | 82/100 Almost Ready (prior sprint) |
| Growth linking gaps closed (this sprint) | Service↔CMS GP inject + welcome asset links + updates index listing |
| Remaining growth work | Content depth, Travel/Sexual service pages, Physician `@type`, suburb copy, GSC post-cutover |

---

## Phase 1 — Practitioner SEO audit (recommendations only)

Reviewed live profiles for Tanya, Debra, Anand, Sumita, Golnar, James, Yamesha.

| Doctor | Title pattern | Meta | Care highlights (published) | Quals / languages present | Doctor→service links | Notes (do not invent) |
| --- | --- | --- | --- | --- | --- | --- |
| Tanya | `Dr … \| GP \| Woolloongabba Medical Centre` | Present (~120–140 chars) | Women’s, Mental, Children’s | Yes | Yes (`#related-services`) | Strongest depth; FAQ interests richer than hero chips |
| Debra | Same | Present | General practice, Shared antenatal | Yes | Yes | Thin hero care set (2) — expand only from approved clinical copy |
| Anand | Same | Present | Child, Women’s, Dermatology | Yes | Yes | Dermatology → skin-checks already linked |
| Sumita | Same | Present | Women’s, Mental, General practice | Yes | Yes | Meta generic (“areas of care”) — tighten from published interests only |
| Golnar | Same | Present | Veterans’, CDM, Diabetes | Yes | Yes (family/CDM/preventive/mental) | No Women’s Health claim — ignore example that invented it |
| James | Same | Present | Children’s, Mental, Family | Yes | Yes | Good topical fit |
| Yamesha | Same | Present | Women’s, Adolescent/youth, CDM | Yes | Yes | Adolescent has no dedicated service — keep family/women’s/CDM only |

**Recommendations (content owners, not code):**
1. Replace generic meta descriptions with one sentence using **already published** care highlights + suburb.
2. Align hero “Helping patients with” chips to FAQ/professional-interest lists where they diverge (Tanya).
3. Add language labels in visible body where schema already has `knowsLanguage` but body is thin — only from HR/clinical source of truth.
4. Do **not** add Physician marketing titles that are not clinically approved.

---

## Phase 2 — Service coverage

| Intent | Page | Status | Doctor links | Knowledge hub links in related |
| --- | --- | --- | --- | --- |
| Women’s Health | `/services/womens-health.html` | Strong | Yes (golden + CMS inject) | Yes (hubs) |
| Men’s Health | `/services/mens-health.html` | OK / thinner GP list | Limited golden list | Related services |
| Family Medicine | `/services/family-health.html` | Strong | Yes | Yes |
| Skin Checks | `/services/skin-checks.html` | Strong | Yes | Guides present |
| Vaccinations | `/services/vaccinations.html` | Strong | Yes | — |
| Mental Health | `/services/mental-health.html` | Strong | Yes | — |
| Chronic Disease | `/services/chronic-disease-care.html` | Strong | Yes + Golnar/Yamesha inject | — |
| Children’s Health | `/services/childrens-health.html` | Strong | Yes + James inject | — |
| Preventive | `/services/preventive-healthcare.html` | Strong | Yes | — |
| Travel Health | — | **Missing page** | Use vaccinations (P0 redirect already) | Optional dedicated page later |
| Sexual Health | — | **Missing page** | Use family-health (P0 redirect) | Optional dedicated page later |

**Weak internal linking (pre-fix):** CMS GPs absent from golden `#related-practitioners` lists — **fixed** via serve-time inject keyed to published `areasOfCare`.

---

## Phases 3–5 — Linking

### Doctor → service
Already present on profiles via `#related-services` (relative `../services/…`). Audit false-negative earlier was absolute-path only.

### Service → doctor
Golden lists omitted Golnar / James / Yamesha.  
**Implemented:** `inject-cms-service-practitioners.ts` appends matching CMS GPs into `.practitioner-knowledge-links` without editing `old-html/`.

### Knowledge ↔ service ↔ practitioner
- Service pages already link knowledge hubs/guides.
- Sample knowledge index is `/knowledge/index.html` (not `/knowledge/`).
- Growth backlog: ensure high-traffic articles include one service + one booking CTA (content edit, not redesign).

---

## Phase 6 — New doctor launch assets

| Asset | Golnar | James |
| --- | --- | --- |
| Practitioner page | PASS | PASS |
| Directory / GP index | PASS | PASS |
| Welcome update page | PASS (`updates/welcome-dr-…`) | PASS |
| Updates index listing | **Was FAIL** → inject | **Was FAIL** → inject |
| Profile ↔ welcome link | **Was FAIL** → inject | **Was FAIL** → inject |
| Welcome → profile / services / book | **Was FAIL** → inject | **Was FAIL** → inject |
| Booking path | Phone (`bookingUrl` null) | HotDoc |

Yamesha: profile + directories PASS; no welcome article required by sprint scope.

---

## Phase 7 — Local SEO

Service H1s already use “in Woolloongabba”; body copy commonly mentions Brisbane, South Brisbane, Kangaroo Point, Dutton Park, East Brisbane.  
**Gap:** Highgate Hill rarely present — add only inside existing catchment paragraphs (no stuffing).  
Contact page is thinner on suburb list than service pages.

---

## Phase 8 — Structured data gaps

| Type | Homepage | Practitioner | Service |
| --- | --- | --- | --- |
| MedicalClinic | Present | Not on profile graph (clinic on other surfaces) | Often absent on service graph |
| Person | — | Present | — |
| Physician | — | **Absent** (Person + credentials used) | — |
| FAQPage | — | Present | Present |
| BreadcrumbList | — | Present | Present |
| Service | — | — | Present |
| Article | — | — | Knowledge articles vary |
| LocalBusiness | Not used (MedicalClinic preferred) | — | — |

**Recommendation:** Optionally add `"@type": ["Person","Physician"]` only if clinical owners approve; do not strip existing Person/FAQ/Breadcrumb.

---

## Phase 9 — Search Console / Bing readiness checklist

Pre-cutover
- [ ] Apex DNS/TLS GO from ops checklist
- [ ] Nginx + CF P0 redirects live (same map as middleware)
- [ ] Production build **without** `UAT_QUICK_TUNNEL` noindex
- [ ] Confirm `robots.txt` → `https://gabbamedicalcentre.com.au/sitemap.xml`
- [ ] Spot-check 10 P0 URLs: 301 → 200 HTTPS single hop

Day 0 (cutover)
- [ ] Google Search Console: verify apex property (HTTPS)
- [ ] Submit `/sitemap.xml` (retire Yoast `sitemap_index` after edge cut)
- [ ] Bing Webmaster Tools: import GSC or verify + submit sitemap
- [ ] Set up email alerts for coverage / removal

Days 1–14
- [ ] Monitor Coverage: 404 spike on unmapped WP URLs
- [ ] Redirect monitoring: sample GSC “Pages with redirect” + server logs
- [ ] Request indexing for Golnar / James / Yamesha profiles + welcome updates
- [ ] Compare top queries vs pre-cutover (impressions, not vanity rankings)

---

## Phase 10 — Growth roadmap

### First 30 days
- Keep P0 redirects green; fix any 404s from GSC quickly.
- Finish CMS GP appearance on all matched service pages (done in code; verify on apex).
- Publish meta rewrites for top 7 GP profiles from existing care copy only.
- Request indexing for new GP URLs + welcome updates.
- Add Highgate Hill once in catchment copy on contact + 2 hub services.

### First 90 days
- Decide Travel Health / Sexual Health: dedicated service pages vs permanent proxies.
- Reciprocal article→service→doctor on top 20 knowledge URLs by impressions.
- Physician schema pilot on 2 profiles if approved.
- Build suburb landing policy (P1 `/location/*`) without homepage dumps.
- Track booking CTR from service “Our doctors can help” modules.

### First 180 days
- Outperform WP on practitioner + service + local packs via continuous content depth (still no redesign).
- Expand knowledge clusters around CDM, women’s, skin, children’s.
- Quarterly authority score using existing `authority-framework` related_services signals.
- Backlink hygiene for any remaining high-DR WP URLs.

---

## Code shipped this sprint

| Module | Purpose |
| --- | --- |
| `apps/web/src/seo/care-area-service-map.ts` | Evidence-based care→service map |
| `apps/web/src/documents/inject-cms-service-practitioners.ts` | Service→CMS doctor links |
| `apps/web/src/documents/inject-cms-updates.ts` | Updates index + welcome/profile cross-links |
| Wired in `render-published-document.ts` | Serve-time only; `old-html/` untouched |

---

## Success criteria mapping

| Goal | State |
| --- | --- |
| Preserve authority | P0 sprint (82/100) |
| Transfer authority | Redirects + doctor↔service + welcome asset graph |
| Increase authority | Roadmap 30/90/180; Travel/Sexual pages + meta depth still open |
