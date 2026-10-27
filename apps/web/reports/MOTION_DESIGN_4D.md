# Prompt 4D — Restrained healthcare motion

## Standard

Motion exists to clarify affordance or next step — not to decorate.

| Token | Value | Use |
|-------|-------|-----|
| `--motion-fast` | 160ms | Colour / chip feedback |
| `--motion-base` | 220ms | Hover lift, journey fade |
| `--motion-enter` | 280ms | One-shot band enter |
| `--motion-ease` | `cubic-bezier(.22,1,.36,1)` | All patterned motion |
| `--motion-lift` | `-2px` | Max vertical lift |
| `--motion-shadow` | soft navy shadow | Hover elevation only |

**Hard rules:** no bounce, spin, pulse, or looping animation; faces stay still (no portrait zoom); Knowledge Centre reading cards stay flat; `prefers-reduced-motion: reduce` disables animation and transitions.

## Patterns shipped (3)

1. **Practitioner card interactions** — 2px lift + portrait shadow on team grids; profile link colour transition; portrait scale suppressed.
2. **CTA emphasis** — Book / critical / conversion CTAs transition transform + colour + shadow; mid conversion and critical bands get a one-shot enter when scrolled into view (`.wmc-inview` via `IntersectionObserver`).
3. **Journey-card transitions** — Digital Reception journey steps fade in with short stagger; journey cards and Find Information chips get calm hover feedback.

**Removed as decorative:** whole-home `main > section` rise on load (was firing every section at once).

## Files

- `old-html/styles.css` / `apps/web/public/styles.css` — tokens + 4D pattern block
- `old-html/site.js` / `apps/web/public/site.js` — viewport marker for conversion/critical bands

## Verification (UAT `:3100`)

| Check | Result |
|-------|--------|
| Motion tokens on `:root` | `--motion-fast` 160ms, `--motion-base` 220ms |
| Home practitioner transition | `transform` active |
| Find Information chip transition | colour / border / transform |
| Home section load animation | `none` |
| Mid conversion band `.wmc-inview` | set on scroll |
| DR journey after search | `animation-name: wmc-journey-step` |
| `prefers-reduced-motion: reduce` | animations `none`, transitions `0s` |

FAQ height transition (existing) remains; it already respects reduced motion.
