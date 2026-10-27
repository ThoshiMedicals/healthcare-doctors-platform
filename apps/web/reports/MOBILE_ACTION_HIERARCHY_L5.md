# L5 — Mobile action hierarchy (header vs dock)

**Date:** 2026-10-26  
**Objective:** Resolve competition between header actions and the mobile care dock.  
**Success:** Mobile action hierarchy is immediately clear — dock owns Book / Call / Ask; header is Menu-only.

---

## Audit findings

| Surface | Before L5 | Issue |
|---|---|---|
| `.mobile-header-actions` (Call + Book) | Shown ≤1024 via `display:flex!important` | Duplicated dock Book/Call |
| Header Book only | Hidden ≤1024 when `has-action-dock` | Call still competed in header |
| Hide scope | `mobile-header-actions` only ≤767 with dock | Tablet 768–1024 still doubled CTAs |
| Dock (4B) | Book labelled · Call/Ask icon | Correct hierarchy — kept |

---

## Changes

When a persistent care dock is present (`has-action-dock` or `has-persistent-care-actions`):

1. **Hide** `.mobile-header-actions`, `.mobile-header-call`, `.mobile-header-book` for all viewports ≤1024.
2. **Hide** desktop-compact `.header-cta` / `.header-phone` in the same band so phone/book chrome does not reappear beside the dock.
3. **Keep** dock hierarchy from 4B: Book = labelled primary; Call + Digital Reception = 48px icon assists with `aria-label`.
4. Cascade-final block appended to `styles.css` under **L5 — Mobile action hierarchy**.

Synced: `apps/web/public/styles.css` → `old-html/styles.css`.

---

## Resulting hierarchy (≤767)

| Layer | Role |
|---|---|
| **Header** | Brand + Menu only |
| **Dock** | Primary action area — Book · Call · Ask |
| **In-page hero** | Contextual Book/Call (content, not chrome) |

---

## Tests (`http://127.0.0.1:3100/?l5=1`)

### 390×844

| Check | Result |
|---|---|
| Header Call/Book | `display:none` (0×0) |
| Menu toggle | Visible |
| Dock Book | ~254×48 labelled primary |
| Dock Call | 48×48 icon · `tel:+61732173344` |
| Dock Ask | 48×48 · opens Digital Reception dialog |
| Booking (dock Book click) | HotDoc path engaged (`data-hotdoc-button` + lightbox/fallback present) |
| Calling | `href=tel:+61732173344` · aria-label intact |
| Digital Reception | Opens/closes from dock; search focused |

### 820×1024 (tablet)

| Check | Result |
|---|---|
| Header Call/Book | Still `display:none` |
| Dock Book/Call/Ask | All visible — sole chrome CTAs |

---

## Success criteria

**Met.** On mobile, the bottom dock is the only persistent Book/Call/Ask chrome; the header no longer competes with duplicate Call/Book emphasis.
