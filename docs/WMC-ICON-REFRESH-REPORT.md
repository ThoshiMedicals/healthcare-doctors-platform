# WMC — Favicon + PWA Icon Refresh (Isolated)

| Field | Value |
| --- | --- |
| Worktree | `C:\Users\RoshanSamarawickrema\Desktop\WMC-icon-refresh` |
| Branch | `branding/wmc-icon-refresh` |
| Base tip | `a7ff4b0` (includes HotDoc feature `a8a3cb8`) |
| Scope | Icon / favicon / PWA icon assets + generators only |
| Push / deploy | **Not performed** |
| Site header logo HTML | **Not changed** (icon-only; no layout branding) |

## Source artwork

Owner-supplied lockup (™ + Caring for you):

`apps/web/public/assets/brand/healthcare-doctors-lockup-tm-caring.png`

Copied from chat asset `woolloongabba_medical_centre-9c63aea1-624b-463c-afd6-7c27976cf3c5.png`.

Square icons use the **left brand block only** (before the red clinic divider). Full horizontal artwork is never squeezed.

## Generated outputs

- `public/favicon.ico` (16+32)
- `public/favicon-16x16.png`
- `public/favicon-32x32.png`
- `public/apple-touch-icon.png` (180)
- `public/icons/icon-96.png`, `icon-192.png`, `icon-512.png`
- `public/icons/maskable-192.png`, `maskable-512.png`

Cache token: `hd-lockup-tm-caring-20261111a` (favicon links + manifest icon query + manifest link version).

## Previews

`apps/web/docs/icon-previews/` — contact sheet, enlarged 16/32, 192/512, maskable, source lockup.

Note: 16×16 / 32×32 wordmark favicons are colour-readable but not fully legible (physics of a wide lockup). 180 / 192 / 512 remain clear with ™ + tagline.

## Tests / build

- Favicon verify script: **PASS**
- Focused PWA + favicon + public-ux: **67/67 PASS**
- `npm run build` (includes `generate-favicons` + `generate-pwa-icons`): **PASS**

## Recommended commit (not created)

```text
feat(wmc): refresh favicon and PWA icons from HD lockup with tagline

Replace symbol-only favicons/PWA icons with contain-fit squares from the
owner Healthcare Doctors™ + Caring for you lockup; version cache-bust tokens.
```

## Staging deploy (after explicit GO)

1. Commit on `branding/wmc-icon-refresh` (or cherry-pick onto HotDoc integration tip).
2. Archive-deploy that SHA; keep Git auto-deploy off.
3. Hard-refresh / purge edge for `/favicon*` `/icons/*` `/manifest.webmanifest`.
4. Smoke: tab favicon, Add to Home Screen icon, PWA quick-nav still works; HotDoc/HOLD unchanged.
5. Rollback: prior archive `wmc-post-pwa-hotdoc-a8a3cb8.zip` or `wmc-pwa-layout-a8309db.zip`.

## Verdict

**ICON REFRESH READY FOR STAGING** (local gates pass; awaiting commit + deploy approval).
