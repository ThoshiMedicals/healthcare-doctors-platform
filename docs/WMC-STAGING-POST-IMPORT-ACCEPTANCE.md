# WMC — Staging Post-Import Acceptance Report

**Date:** 2026-11-06  
**Staging:** `https://mediumslateblue-eagle-960503.hostingersite.com`  
**Supabase:** `wmc-hostinger-staging` / `thwcxuhrzgkufvdrvzzt`  
**Deployed SHA:** `a545991fe40f6dffed15702e6a2a7c3fb0bc0a24`  
**Recommendation:** **GO WITH CONDITIONS**

---

## 1. Security verification

| Check | Result | Evidence |
| --- | --- | --- |
| `_wmc_import_stage` removed | **PASS** | `to_regclass(...)` → `null` |
| Temporary SECURITY DEFINER / `_wmc_execute_batches` removed | **PASS** | 0 public `wmc*` / DEFINER functions |
| Temporary RPC / executable leftovers | **PASS** | 0 public routines; 0 routine grants to anon/auth |
| RLS enabled on public tables | **PASS** | 76/76 tables RLS on; 0 RLS-disabled |
| anon/authenticated Data API access to CMS/private tables | **PASS** | REST GET → **404** for `users`, `career_applications`, `gp_readiness_packages`, `pages`, `page_revisions`, `practitioners`, `_wmc_import_stage` (schema not exposed / grants revoked) |
| Unintended PUBLIC/anon/authenticated table grants | **PASS** | 0 SELECT/INSERT/UPDATE/DELETE grants |
| Supabase security advisors | **PASS** (INFO only) | 76 × `rls_enabled_no_policy` INFO — intentional default-deny for Data API; Prisma owner bypass retained |
| Import endpoint access after cleanup | **PASS** | Logs show PowerShell POSTs to `/rest/v1/_wmc_import_stage` during import only; **0** hits after cleanup `2026-11-06T11:51:34Z` |

**Remediation performed this phase:** none required — import artefacts already dropped.

---

## 2. Import / revision integrity

| Check | Result |
| --- | --- |
| Prisma migrations 27/27 + SHA-256 checksums vs repo | **PASS** (0 mismatches) |
| Published pages | **207** |
| Published revision pointers resolve | **PASS** (orphan_published=0) |
| Revision belongs to correct page | **PASS** (revision_wrong_page=0) |
| Duplicate paths | **PASS** (0) |
| Practitioner/service page associations | **PASS** (0 null `page_id`) |
| Content SHA vs golden HTML (10 critical samples) | **PASS** (10/10 raw SHA-256 match) |
| Immutable flags | **PASS** (207/207 immutable) |

### Why exactly 207 revisions for 207 pages?

**Intentional flattened published snapshot.**  
Golden import creates one immutable published revision per page (content fingerprint = source HTML). Multi-revision CMS history and prior governance draft chains were **not** copied from local UAT. This matches approved `import-golden-html` semantics. Do **not** invent historical revisions.

---

## 3. Practitioner reconciliation

### Counts

| Source | Count | Notes |
| --- | --- | --- |
| Golden `old-html/doctors/*.html` | **12** | Frozen approved profiles |
| Staging `practitioners` | **12** published | Matches golden |
| Local UAT | **16** total / **15** published | 12 golden + 3 post-golden onboardings + Gemunu `on_hold` |

### Staging roster (all present)

| Name | Slug | Page | Booking |
| --- | --- | --- | --- |
| Dr Anand Singh | `dr-anand-singh` | `doctors/dr-anand-singh.html` | HotDoc URL |
| Dr Debra Larkins | `dr-debra-larkins` | … | HotDoc |
| Dr Kooshyar Karimi | `dr-kooshyar-karimi` | … | HotDoc |
| Dr Mary Abadir | `dr-mary-abadir` | … | **Phone-only** (no `booking_url`) — intentional |
| Dr Nirupa Sivathasan | `dr-nirupa-sivathasan` | … | HotDoc |
| Dr Sambo Luon | `dr-sambo-luon` | … | HotDoc |
| Dr Steven Chang | `dr-steven-chang` | … | HotDoc |
| Dr Sumita Singh | `dr-sumita-singh` | … | HotDoc |
| Dr Tanya Goodwill | `dr-tanya-goodwill` | … | HotDoc |
| Dr Usman Gul | `dr-usman-gul` | … | HotDoc |
| Dr Wasantha Hettiarchchi | `dr-wasantha-hettiarchchi` | … | HotDoc |
| Mr Samuel Stafford | `mr-samuel-stafford` | … | HotDoc |

### Missing from staging vs local published (not in golden — not restored)

| Name | Slug | Status locally | Action |
| --- | --- | --- | --- |
| Dr Golnar Mortezaei | `dr-golnar-mortezaei` | published | **Do not invent** — restore only via approved onboard/publish scripts |
| Dr James Chanaka | `dr-james` | published | Same |
| Dr Yamesha Ranatunga | `dr-yamesha-ranatunga` | published | Same |
| Dr Gemunu Suresh Ranawake | `dr-gemunu-suresh-ranawake` | **on_hold** | Intentionally unpublished |

**Verdict:** Staging **12** is correct for golden SoT. Earlier “15 published” equals local UAT post-onboarding, not golden.

---

## 4. Public URL crawl (Hostinger)

Re-crawl after path-separator fix, concurrency 3:

| Metric | Value | Result |
| --- | --- | --- |
| Total published paths | 207 | — |
| HTTP 200 | **207** | **PASS** |
| 404 / 5xx | **0** | **PASS** |
| Missing H1 | **0** | **PASS** |
| Expected soft 404 page (`404.html` H1 “couldn't find…”) | 1 published page | **PASS** (content, not failure) |

Critical assets: `/styles.min.css`, `/site.js`, brand logo, hero image → **200**.

**Homepage visual (browser):** authority hero, nav, booking CTAs, practitioner strip, HotDoc cards, footer — renders correctly.  
**Gap:** homepage `public-ux` surfaces **Dr Golnar Mortezaei** and welcome updates for Golnar/James; those URLs **404** on staging (not in golden import).

| Extra homepage-linked URL | HTTP |
| --- | --- |
| `/doctors/dr-golnar-mortezaei.html` | **404** |
| `/doctors/dr-james.html` | **404** |
| `/updates/welcome-dr-golnar-mortezaei.html` | **404** |
| `/updates/welcome-dr-james-chanaka.html` | **404** |

Golden-master page parity for imported corpus: **PASS**. Functional parity with local UAT homepage injections: **FAIL** until Attraction onboard pages are published via approved scripts (or homepage inject is scoped for staging).

---

## 5. SEO safety

| Check | Result |
| --- | --- |
| Public `X-Robots-Tag: noindex` on patient HTML | **FAIL** (live SHA) — absent on `/`, `/services.html` |
| Admin/API noindex header | **PASS** |
| HTML `<meta robots>` | **FAIL for staging** — `index,follow,max-image-preview:large` |
| `robots.txt` | **FAIL for staging** — `User-agent: *` / `Allow: /` (Googlebot Disallow only) |
| Sitemap host | Points at **production** `gabbamedicalcentre.com.au` (208 locs) — does not list hostingersite; still undesirable to advertise from staging |
| Staging → unrelated production redirect | **PASS** — homepage stays on staging host (200) |
| Local middleware noindex for `*.hostingersite.com` | Prepared locally; **not deployed** on `a545991` |

---

## 6. CMS / recruitment / booking (synthetic)

| Check | Result |
| --- | --- |
| Admin login (synthetic `wmc.staging.admin`) | **PASS** → `/admin` Practice briefing; role Staging Super Admin |
| Admin practitioners list | **PASS** — 12 published |
| Admin logout control present | **PASS** (Sign out) |
| CMS edit + publish round-trip | **NOT VERIFIED** (surface only) |
| Knowledge publishing | **NOT VERIFIED** |
| Recruitment application submit (no real notify) | **NOT VERIFIED** |
| GP readiness workflows | **NOT VERIFIED** (nav present) |
| Booking CTA present on critical pages | **PASS** (HotDoc / tel / Book Appointment) |
| Full HotDoc lightbox journey | **NOT VERIFIED** |

No real applicant notifications sent.

---

## 7. Persistent storage

| Store | Config | Staging proof | Result |
| --- | --- | --- | --- |
| CMS images | `IMAGE_STORE_DIR` / managed-image routes | Public brand/hero **200** from deploy `public` | Public assets **PASS**; private CMS store **NOT VERIFIED** |
| Career CVs | `CAREER_RESUME_DIR` → default `storage/career-resumes` | No redeploy persistence test | **NOT VERIFIED** — Hostinger `hbuilds` likely ephemeral |
| GP readiness docs | `GP_READINESS_STORAGE_DIR` | Same | **NOT VERIFIED** |

**Recommendation:** smallest compatible durable private store = **private Supabase Storage buckets** on `thwcxuhrzgkufvdrvzzt`, wired to existing env vars. Do not accept real CVs until persistence after redeploy is proven.

---

## 8. Remaining P0 blockers

1. **Staging SEO leak** — public pages indexable (`robots.txt` Allow, meta index,follow, no host-wide `X-Robots-Tag`). Redeploy validated noindex fix + tighten `robots.txt` for hostingersite.  
2. **Homepage → missing Attraction pages** — Golnar/James (and related updates) linked from live homepage inject but **404** on staging.  
3. **Private upload durability** unproven.

P1: full CMS publish/recruitment AT; optional import of 3 local-only published practitioners + Attraction pages if UAT parity required; `practice_updates` collection rows still 0.

---

## 9. Decision

### **GO WITH CONDITIONS**

Staging is **secure at the Data API layer**, migrations intact, and **all 207 golden published pages** return 200 with content SHA parity. It is **not** yet safe for broad external sharing or cutover prep as an “index-safe” mirror of production, and it is **not** functionally equivalent to local UAT homepage/Attraction content.

**Conditions before next cutover-prep phase:**

1. Deploy + verify host-wide noindex / staging `robots.txt`.  
2. Either publish approved Golnar/James/Yamesha (+ updates) via onboard scripts, or suppress homepage injects that point at missing paths.  
3. Prove private storage persistence (or adopt Supabase Storage).

Production WordPress, DNS, Cloudflare production, and local UAT were **not** modified.
