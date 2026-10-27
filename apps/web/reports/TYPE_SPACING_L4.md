# L4 — Typography & spacing consistency

**Date:** 2026-10-26  
**Objective:** Reduce type/spacing drift by rolling out 4G tokens and standardising hero, eyebrow, lede, and cards.  
**Success:** Shared surfaces read from one token scale; fewer competing `!important` type/space overrides.

---

## Tokens rolled out

| Token | Role |
|---|---|
| `--font-display` / `--font-ui` | Baskerville display · Inter UI |
| `--fs-eyebrow` … `--fs-display` | Type scale |
| `--fs-card-title` / `--fs-card-meta` | Card title (18) · meta (12) |
| `--lh-tight` / `--lh-body` / `--lh-lede` / `--lh-display` | Line heights |
| `--ls-eyebrow` | `.14em` tracking |
| `--space-1` … `--space-9` | 4–96px rhythm |
| `--radius-md` / `--shadow-card` | Card chrome |

---

## Standardised surfaces

| Surface | Contract |
|---|---|
| **Page hero** | `padding-block: space-8 / space-7`; H1 → `--fs-h1` / `--lh-tight`; lede → `--fs-lede` / `--lh-lede` |
| **Eyebrow** | `--fs-eyebrow`, `--ls-eyebrow`, UI font; no more 10px vs 11px vs 12px fight |
| **Lede** | Shared `.page-hero .lede` / `.lede` token size + line-height |
| **Article H2/H3** | H2 → `--fs-h2`; H3 → `--fs-h3` Inter 700 |
| **Article body** | `--fs-body` / `--lh-body` (tightened from ~1.85–1.9 essay default) |
| **Practitioner cards** | Title `--fs-card-title`; credentials/focus `--fs-card-meta`; portrait `--radius-md`; meta padding `--space-5` |
| **Service / knowledge cards** | Shared `--radius-md`, `--space-5` padding, display title type |
| **Conversion band / trust strip / hub pathways** | Spacing from `--space-*` scale |

Cascade-last contract lives at the end of `styles.css` under **L4 — Type & spacing contracts**.

---

## `!important` reduction (targeted)

Removed or tokenised `!important` on:

- `.page-hero h1` / `.page-hero .lede` size rules  
- `.eyebrow` size/letter-spacing overrides (incl. 10px “luxury” layer)  
- Mobile `.page-hero` / `.article-section` padding overrides  
- Multiple stacked `.practitioner h3` / `.credentials` / `.focus` size layers  
- Institutional page-hero **colour** no longer needs `!important` for type

Portrait filters, header chrome, and motion/forced-colors still use `!important` where behavioural — out of L4 scope.

**`!important` count:** ~4150 → **4089** (−61) focused on type/space for L4 surfaces.  
`--radius-surface` now aliases `--radius-md` (16px) so team/service cards share one radius.

Synced: `apps/web/public/styles.css` → `old-html/styles.css`.

### Live check (`/services/skin-checks.html`)

| Element | Computed |
|---|---|
| Eyebrow | 12px / tracking 0.14em |
| Hero H1 | ~55px Baskerville (within `--fs-h1` clamp) |
| Lede | 17.5px / lh 1.85 |
| Service hub card | padding 24px, radius 16px |
| Short viewport hero pad | `--space-6` / `--space-5` (tokenised; was hard-coded 44/32 `!important`) |

---

## Verify

1. Inner page hero (e.g. `/services/skin-checks.html`) — H1/lede/eyebrow share desktop + mobile scale.  
2. Practitioner directory / home team cards — titles align at 18px; meta at 12px.  
3. Knowledge category cards — radius 16px, padding 24px.  
4. No return of 10px eyebrows or 15.1–15.5px practitioner title stack.
