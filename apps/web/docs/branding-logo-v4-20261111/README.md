# WMC logo v4 — global public branding (2026-11-11)

## Verdict

**WMC GLOBAL BRANDING COMPLETE — READY FOR CONTROLLED STAGING UPDATE**

Branch: `branding/wmc-logo-compact-v4`  
Baseline: `9c928de5fc1d0138a1f699a994db1b03d94a21c6`  
Worktree: `Desktop/WMC-branding-logo-v4`  
Hostinger staging tip (untouched): build `01a1c90b-d814-7061-bd0e-3eab3d5f93ea`

No GitHub push. No Hostinger deploy.

## Canonical asset

| Item | Value |
| --- | --- |
| Canonical lockup | `apps/web/public/assets/brand/healthcare-doctors-woolloongabba-logo-v4.png` |
| Dimensions | **972 × 152** PNG |
| Bytes / SHA-256 | 219390 / `db4714327b74ca119ad08ec3bc6b6ff4b59ce16491f76a9d7da58b03b203c130` |
| Source retained | `owner-compact-healthcare-doctors-medical-centre-logo-source.jpg` |
| Transform | Trim external whitespace only; no stretch/recolour/retype |
| Rollback | `…-logo-v3.png` + `…-logo-v2.png` retained |

Aliases synced to v4 bytes: `public/assets/brand/…logo.png`, `public/assets/…logo.png`, `public/assets/…logo-v4.png`.  
Golden `old-html` unversioned logo binaries restored; `old-html/assets/brand/…-logo-v4.png` added for parity.

## Inventory (old → new)

| Old path | New path | Component / placement | Status |
| --- | --- | --- | --- |
| `…logo.png` / `-v2` / `-v3` | `…logo-v4.png` | `public-ux.ts` relative rewrite (header + footer) | Updated |
| absolute schema `logo` URL | `…logo-v4.png` | `public-ux.ts` absolute rewrite | Updated |
| `PUBLIC_SYNC_PATHS` | includes v4 | `image-store.ts` | Updated |
| cache headers | v4 `max-age=60` | `next.config.ts` | Updated |
| seed `logoPath` | `/assets/brand/…logo-v4.png` | `prisma/seed.ts` | Updated |
| package-b assert | expects v4 | test | Updated |
| Attraction / PE shells | unversioned in source | covered by public-ux at serve | Covered |
| `og:image` / Twitter | hero / portraits | unchanged | Keep |
| Favicon / PWA / apple-touch | HD short lockup `healthcare-doctors-lockup-tm-caring.png` | unchanged | Keep |

## Visual acceptance (CSS px)

| Viewport | Logo W×H | Header H | Clipped |
| --- | --- | --- | --- |
| 320 | ~200×31 (target) | ~73 | No |
| 390 | ~228×36 | ~73 | No |
| 430 | 248×39 | 73 | No |
| 768 | 390×61 | 145 | No |
| 1024 | 403×63 | 145 | No |
| 1440 | 400×63 | 153 | No |

Screenshots: this folder (`wmc-logo-v4-*.png`).

## Tests

- `package-b-practitioner-directory.test.ts` + `public-ux.test.ts`: **PASS**
- Next.js production `npm run build`: **PASS**
- Favicons / PWA icons: **unchanged** (HD short lockup)
- Golden `styles.css` bytes: **unchanged** (mobile logo sizing via public-ux polish inject)

## Hostinger readiness

Ship as archive from this branch tip after local commit. Staging-only; do not cut over DNS. Reconnect Git auto-deploy only with separate authorisation.
