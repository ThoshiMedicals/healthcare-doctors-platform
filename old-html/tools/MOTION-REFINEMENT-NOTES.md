# Motion Refinement | 2026-10-09

Scope: existing production build only. No HTML, layout, content, brand or imagery changes.

1. Native smooth fragment navigation; reduced motion is instantaneous. Existing scroll offsets remain.
2. Button hover colour, border, shadow and slight movement transitions (pointer devices only).
3. Card hover: subtle 2px elevation for existing cards (pointer devices only).
4. FAQ opening and closing: 230ms height transition, native `<details>` keyboard and semantic behaviour preserved; no interception with reduced motion.
5. Digital Reception opening and closing: 200ms opacity/7px positional feedback; existing focus management, ARIA modal attributes, escape closing, and inert state stay in place.
6. Booking confirmation: one-shot, 280ms entrance animation via `window.WMCBookingResilience.showVerifiedConfirmation()` **only after a real, provider-verified booking completion event**. This static site integrates the HotDoc lightbox but does not receive booking confirmation callbacks. It **does not** claim success when the visitor opens, starts, or attempts a booking. Provider integration is needed to activate the confirmation in production. Reduced-motion users see an immediate static notice.

All motion stops for `prefers-reduced-motion: reduce`. No loop, icons, urgency effects, auto-opening panels or decorative transitions were added.
