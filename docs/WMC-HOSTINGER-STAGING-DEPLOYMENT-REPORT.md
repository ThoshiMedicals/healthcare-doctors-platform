# WMC — Hostinger Staging Deployment Report

**Date:** 2026-11-06 (Phase 6 — P0 remediation)  
**Mode:** Isolated Hostinger staging + Supabase `wmc-hostinger-staging` only  
**Related:**  
- [`WMC-STAGING-P0-REMEDIATION-REPORT.md`](./WMC-STAGING-P0-REMEDIATION-REPORT.md)  
- [`WMC-STAGING-CONTENT-PARITY-REPORT.md`](./WMC-STAGING-CONTENT-PARITY-REPORT.md)  
- [`WMC-STAGING-POST-IMPORT-ACCEPTANCE.md`](./WMC-STAGING-POST-IMPORT-ACCEPTANCE.md)  

**Verdict:** **PARTIAL PASS** — approved local content parity restored (226 pages / 15 practitioners); live HTML noindex + empty sitemap verified on tip `369cd06`; private-storage durability AT pending `PRIVATE_OBJECT_STORE=postgres` env.

---

## Executive status

| Layer | Result |
| --- | --- |
| Staging hostname | **PASS** — `mediumslateblue-eagle-960503.hostingersite.com` |
| Deployed SHA | **`369cd06`** (`369cd06261dfe5c830a703734fadbd2512e8e6a1`) |
| `/api/health` | **PASS** — `database: up` |
| Migrations | **PASS** — includes `20261106210000_private_objects` on staging |
| Published pages | **226** (207 golden + 19 approved local deltas) |
| Published practitioners | **15** (Golnar, James, Yamesha restored; Gemunu kept unpublished) |
| Attraction destinations | **PASS** — restored paths HTTP 200 |
| Staging HTML noindex | **PASS** — X-Robots + meta |
| Staging sitemap | **PASS** — empty urlset |
| Staging robots.txt | **PARTIAL** — Hostinger CDN platform robots for preview host |
| Persistent private storage | **CODE READY** — needs `PRIVATE_OBJECT_STORE=postgres` + synthetic AT |
| Automated tests | **PASS** — 351/351 |
| Production build | **PASS** |
| Production WordPress / DNS / UAT | **PASS** — untouched |

---

## Operator actions required (non-destructive)

Hostinger env replace is a **full replace**. Do **not** call replace without the real `DATABASE_URL`. In hPanel, **add**:

1. `STAGING_NOINDEX=true`  
2. `PRIVATE_OBJECT_STORE=postgres`  

Preserve existing: `DATABASE_URL`, `AUTH_SECRET`, `AUTH_URL`, `AUTH_TRUST_HOST`, `DEFAULT_CLINIC_SLUG`.

Then confirm auto-deploy of the remediation commit and verify:

- `X-Robots-Tag: noindex, nofollow, noarchive` on HTML  
- `/robots.txt` Disallow all  
- `/sitemap.xml` empty urlset  
- Synthetic CV/GP doc upload survives restart/redeploy via `pg:` keys  

---

## Cutover-prep recommendation

**NO-GO for production cutover preparation** until live staging noindex **PASS** and private storage durability **PASS**. Content parity is no longer a P0 blocker.
