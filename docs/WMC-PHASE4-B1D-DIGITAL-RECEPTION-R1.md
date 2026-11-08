# Phase 4 B1D — Digital Reception R1 exception

## Decision

`apps/web/public/digital-reception.js` is the **approved Phase 5C patient runtime**.
`old-html/digital-reception.js` remains frozen golden-master history and must **not** be edited to force byte-equality with the public runtime.

## Why

The public runtime preserves sticky booking-dock CLS by reusing the SSR-injected launcher, skipping 404 dock bootstrap, and retaining Escape/focus/booking-hold behaviour. Requiring golden byte-equality reintroduced a false regression against that approved runtime.

## Regression protection (replaces byte-equality for this file only)

- Documented exception: `apps/web/src/regression/approved-runtime.ts`
- SHA256 integrity of the public runtime file
- Functional contracts: SSR exactly-one launcher, 404 handling, Escape/focus, booking-dock hold
- Unrelated golden-master runtime checks (for example `digital-reception-index.js`, search indexes, `site.js`, `styles.css`) remain byte-equal

## Out of scope

- Do not modify `old-html/`
- Do not weaken unrelated golden-master tests
