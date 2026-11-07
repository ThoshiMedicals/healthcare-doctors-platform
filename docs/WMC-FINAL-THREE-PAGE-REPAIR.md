# WMC — Final Three-Page Parity Repair

Generated: 2026-11-07  
Approved reference: https://next.gabbamedicalcentre.com.au  
Target repaired: https://mediumslateblue-eagle-960503.hostingersite.com  
**Do not authorise DNS cutover from this note alone.**

## Final verdict

**MATCH WITH DOCUMENTED EXCEPTIONS**

| Item | Result |
|------|--------|
| Homepage layout (320/390/1440 heights) | **PASS** (identical scroll heights at all five widths) |
| Dr Tanya heading + layout | **PASS** (`Services Provided`; all five widths ≤0.18%) |
| Dr Debra heading + layout | **PASS** (`Services Provided`; all five widths ≤0.21%) |
| Page-count reconciliation | **226 published = 224 crawled public + 2 published specials** |
| Deployed Hostinger SHA | **`fedafac`** (`release/wmc-hostinger-rc1`) |
| Prior tip before repair | `aee8284` |

---

## Baselines (before change)

| | NEXT | Hostinger |
|--|------|-----------|
| Health | `golden-import` / DB up | same |
| Deployed SHA | local UAT (tunnel) | `aee8284` |
| Homepage CSS served | minified `styles.css?v=…06d` (433,502 B via rewrite) | **unminified** `styles.css?v=…06c` (533,295 B static short-circuit) |
| Tanya/Debra H2 | Services Provided | Related Services |
| Tanya `areas_of_care` | populated (curly apostrophes) | **empty** |

Rollback: redeploy `aee8284`; restore Tanya/Debra `areas_of_care` to `{}` if required.

---

## Exact root causes

### 1. Homepage height drift

**Cause:** Hostinger’s static file layer served `public/styles.css` (unminified) and **bypassed** `next.config.ts` rewrite to `styles.min.css`. NEXT UAT applied the rewrite, so the two sites painted different CSS payloads (~100 KB ruleset delta after minify), producing mobile/desktop scroll-height drift.

Secondary contributors (now fixed or accepted):
- Missing NEXT-approved public-ux inject CSS (digital-reception scrim; homepage welcome-banner square crop).
- Contact-hours meridian formatting (`7:00am` vs `7:00 AM`) adding 63 px at 1440 via `.contact-hours-detail`.

**Not caused by:** CMS HTML revision mismatch for `index.html`, image asset bytes, or hero token (`wmc-hero-authority-v6` already matched).

### 2. Tanya / Debra “Related Services”

**Cause:** Growth inject renames `Related Services` → `Services Provided` only when `resolvePractitionerServices(...)` returns a non-empty list. Hostinger staging had **empty** `practitioners.areas_of_care` for Tanya/Debra while NEXT/local DB retained care areas → rename skipped on Hostinger only. Service link bodies were already present in published HTML.

Follow-on bug after syncing straight-apostrophe `Women's health`: `/men'?s\s+health/i` also matched inside “Women’s”, injecting an extra Men’s Health link and re-breaking Tanya mobile height. Fixed by anchoring the men’s regex.

### 3. 226 vs 224 inventory

Published CMS pages: **226**.  
Audit crawl inventory: **224**.

The exact two published paths omitted from the nav/footer crawl (but HTTP 200 on both sites):

| Path | Role |
|------|------|
| `404.html` | Published not-found document |
| `updates/article.html` | Published generic update template |

Neither is missing from Hostinger. Both re-verified **PASS** visually after repair. Inventory parity remains **PASS** with this reconciliation (not silent).

---

## Changes applied

### Code (Hostinger RC branch only; NEXT UAT not modified)

1. **`fedafac`** — `fix(wmc): stop Women's care areas injecting Men's Health links`
   - Care-area regex harden + typographic apostrophes
   - Contact/footer clock meridian normalisation in `public-ux.ts`
2. **`633bbff`** — `fix(wmc): align Hostinger public CSS and DR inject with NEXT`
   - Link `styles.min.css?v=wmc-updates-dr-mobile-20261106d` (Hostinger-safe)
   - Digital-reception scrim CSS + `digital-reception.js?v=wmc-dr-scrim-20261106`
   - Homepage welcome-dr square crop inject rules

### Staging data

- Restored Tanya/Debra `areas_of_care` on `wmc-hostinger-staging` to match NEXT/local (curly apostrophes for Tanya).

### Not changed

- NEXT environment / DNS / Cloudflare / production Supabase
- Vacancies, CMS workflows, staging noindex, private storage, HTML cache design (restart clears in-memory cache)

---

## Post-repair verification (`fedafac`)

Evidence: `apps/web/.tmp-next-hostinger-audit/repair-verify/`

| Page | 320 | 390 | 768 | 1024 | 1440 | Content |
|------|-----|-----|-----|------|------|---------|
| `/` | 2.39%* same H | PASS | PASS | PASS | PASS | — |
| Tanya | PASS | PASS | PASS | PASS | PASS | Services Provided |
| Debra | PASS | PASS | PASS | PASS | PASS | Services Provided |
| Sumita (control) | PASS | PASS | PASS | PASS | PASS | Related Services (unchanged, matches NEXT) |
| about-us | PASS | PASS | PASS | PASS | PASS | — |
| 404.html | PASS | PASS | PASS | PASS | PASS | — |
| updates/article.html | PASS | PASS | PASS | PASS | PASS | — |

\*Home @320: **identical scroll height** (13446); residual pixel delta from intentional environment differences (Cloudflare email obfuscation on NEXT; staging `noindex`; `styles.css` vs `styles.min.css` href with **byte-identical** CSS). Classified **INTENTIONAL**, not a layout defect.

CSS byte parity: Hostinger `styles.min.css` SHA matches NEXT served CSS (433,502 B).

---

## Remaining differences (documented exceptions)

| Difference | Severity | Notes |
|------------|----------|-------|
| Staging robots `noindex` vs NEXT `index,follow` | INTENTIONAL | Staging policy |
| NEXT Cloudflare email rewrite vs plain `mailto:` | INTENTIONAL | Tunnel/CF only |
| HTML `styles.css` vs `styles.min.css` href | INTENTIONAL | Same bytes; Hostinger-safe |
| Home @320 ~2.4% pixel noise, same height | INTENTIONAL / P2 noise | No height or section miss |

---

## Regression / ops

- `public-ux.test.ts` + `care-area-service-map.test.ts`: PASS
- Hostinger production build on deploy: PASS
- Public HTML cache: cleared by Node restart on publish
- Warm homepage after deploy: HTTP 200 (cold first hit expected)

---

## Reconciled page count

| Count | Meaning |
|------:|---------|
| 226 | Published CMS pages (local authority DB) |
| 224 | Discoverable public inventory used in full audit |
| +2 | `404.html`, `updates/article.html` — published, live, not linked from primary crawl |
| 0 | Missing on Hostinger |

---

## Verdict

**MATCH WITH DOCUMENTED EXCEPTIONS**

Material P0/P1 gaps from the prior NOT MATCHED audit are closed. Remaining deltas are intentional environment/presentation noise without content or layout height failure.
