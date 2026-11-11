# WMC — Unified corrective release (local finalisation)

**Prepared:** 2026-11-11  
**Worktree:** `WMC-p0-doctor-profiles-incident` / branch `incident/p0-doctor-profiles-restore`  
**Hostinger staging baseline (unchanged):** `a8309db` / build `01a1c862-5c31-71eb-9f64-9a014901a683`  
**Deploy / push:** **NO** — blocked by incomplete off-server staging DB backup

## Ancestry (preserved)

```
a8309db  feat(wmc): integrate patient PWA and 12-page layout recovery
a8a3cb8  feat(wmc): Golnar HotDoc online booking + post-PWA sitemap hardening
a7ff4b0  docs(wmc): record post-PWA HotDoc release archive checksum
18f1f86  feat(wmc): refresh favicon and PWA icons from HD lockup with tagline
4eb991a  test(wmc): add published practitioner route inventory regressions
<TIP>   fix(wmc): align Golnar online booking prose + unified corrective release notes
```

All of `a8309db`, `a8a3cb8`, and `18f1f86` are ancestors of the tip. Icon-refresh commit was not rewritten.

## Commits in this finalisation

1. `4eb991a` — practitioner route inventory + default/`test:p0` wiring (separate, as required)
2. Tip commit — Golnar phone-only prose correction + release documentation

## Changed files (tip)

- `apps/web/src/documents/practitioner-booking.ts` — `alignGolnarOnlineBookingProse`
- `apps/web/src/documents/practitioner-booking.test.ts` — prose regressions
- `docs/WMC-P0-DOCTOR-PROFILES-INCIDENT-REPORT.md` — incident evidence
- `docs/WMC-UNIFIED-CORRECTIVE-RELEASE.md` — this record

## Branding

- Owner lockup present: `apps/web/public/assets/brand/healthcare-doctors-lockup-tm-caring.png`
- Icon generators still source that lockup (`brand-icon-source.mjs`)
- Site header logo unchanged: `healthcare-doctors-woolloongabba-logo.png`

## Local verification

- 15/15 published practitioner profiles HTTP 200 + correct identity
- Golnar FAQ/appointment copy no longer claims telephone-only; HotDoc CTA intact
- Mary remains PHONE_ONLY
- Gemunu remains 301 → GP directory
- `test:practitioner-routes` PASS; production `next build` PASS

## Outstanding blocker

Off-server staging database backup credentials remain unavailable → **no Hostinger deploy, no GitHub push**.
