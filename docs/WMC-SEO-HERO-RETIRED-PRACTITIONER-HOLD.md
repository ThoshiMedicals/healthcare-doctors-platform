# Hero Authority v6 — Retired Practitioner HOLD (report only)

Date: 2026-11-10  
Policy: **Homepage Hero Authority v6 remains frozen.** No automatic change.

## Finding

Live homepage hero practitioner strip still links a retired doctor face.

| Field | Value |
| --- | --- |
| Source component | `apps/web/src/documents/public-ux.ts` — homepage hero authority-v6 practitioner strip (`hero-practitioner-face` / `hero-practitioner-avatar`) |
| Source image | `assets/team/dr-golnar-mortezaei-96.webp` (+ `192.webp` srcset) |
| Visible label | Dr Golnar Mortezaei |
| Destination link | `doctors/dr-golnar-mortezaei.html` |
| Live destination status (app) | **301 → `/team-general-practitioners.html`** after 2026-11-10 SEO hardening (was 404) |
| Related welcome content | `updates/welcome-dr-golnar-mortezaei.html` (and James welcome) still exist as updates content — separate from frozen hero |

## Why HOLD

Hero layout/copy hierarchy is frozen (`hero--authority-v6`). Replacing faces or removing the strip is an operator product decision, not an SEO agent auto-fix.

## Operator options (await decision)

1. **Keep face, accept redirect** — hero still shows Golnar; click lands on GP directory via 301 (equity preserved; UX slightly surprising).
2. **Swap face to an active GP** — replace image + link + label with an approved active practitioner (requires explicit exception to hero freeze).
3. **Remove the face slot** — reduce strip count; requires explicit exception to hero freeze.
4. **Retire welcome update cards later** — separate content decision; not required for hero HOLD.

## Recommendation

Prefer **option 2** (swap to an active GP already in the strip set, e.g. keep Tanya/Wasantha/Sumita/Mary balance) once operator signs a written hero-freeze exception. Until then, leave hero markup unchanged.

## Non-actions taken by SEO hardening

- Did **not** edit hero Authority v6 markup or imagery.
- Did add 301 from retired profile URLs → GP directory so ranking/internal equity is not stranded on 404.
