# Practitioner Growth & Availability Platform

Date: 2026-11-06  
Goal: Directory → Discovery → Service matching → Conversion → Booking  
Constraints: no practitioner page redesign, no recruitment architecture changes, homepage hero strip frozen (audit only).

## Shipped

| Capability | Mechanism |
| --- | --- |
| New to WMC badge (60-day auto-expire) | `newToPracticeAt` + CMS checkbox to clear; public inject |
| Accepting new patients | `acceptingNewPatients` flag → badges on directory/team/profile + search keywords |
| Availability intelligence | `availabilityStatus` admin select (not HotDoc) |
| Care filters | Injected toolbar on `team.html` / `team-general-practitioners.html` + `site.js` |
| Practitioner → services | `relatedServices` CMS field or care-area map → Services Provided links |
| Service → practitioners | Prior sprint inject + growth badges on cards |
| CMS admin | Practitioner edit form patient-acquisition fieldset |

## Seeded (Golnar / James / Yamesha)

`node apps/web/scripts/seed-practitioner-growth.mjs`

- Accepting new patients = true  
- New badge start = seed time (expires +60 days)  
- Related services derived from **published** care areas (Golnar is not mapped to Women’s Health)

## Phase 7 — Homepage practitioner strip (frozen)

Current strip (authority v6) already includes Golnar; James/Yamesha are not in the face strip.

**Recommendation (do not implement until freeze lifted):**
1. Prefer practitioners with `acceptingNewPatients` + active new badge in the first 3–4 faces.
2. Cap strip at ~9 faces; rotate weekly among accepting GPs rather than full roster.
3. Keep “View full team” as the completeness path — strip is acquisition, not HR representation.

## Phase 8 — SEO enhancement (Golnar / James / Yamesha)

| Doctor | Bio depth | Interests | Quals | Languages | Meta | Internal links |
| --- | --- | --- | --- | --- | --- | --- |
| Golnar | Adequate onboard copy | Present (veterans/CDM/diabetes) | Present | Present (EN/Farsi) | Generic template | Services + welcome linked |
| James | Adequate | Present (children/mental/family) | Present | Present (EN/Shona) | Generic template | Services + welcome linked |
| Yamesha | Adequate | Present (women’s/youth/CDM) | Present | Check body vs schema | Generic template | Services linked; no welcome article |

**Priorities:** rewrite meta from published care highlights; confirm Yamesha languages in visible body; optional deeper bio only from clinical source.

## Phase 9 — Patient conversion audit

| Question | Golnar | James | Yamesha |
| --- | --- | --- | --- |
| Who is this? | H1 + role + photo | Same | Same |
| What do they treat? | Care highlights + Services Provided | Same | Same |
| Accepting new patients? | Badge after seed | Badge after seed | Badge after seed |
| How to book? | Phone CTA (no HotDoc URL) | HotDoc | HotDoc |

**Friction:** Golnar phone-only is intentional; ensure CTA label stays “Call reception to book”. Availability badge should not contradict HotDoc when status is limited/waitlist.

## Phase 10 — Growth dashboard (internal)

See `docs/WMC-PRACTITIONER-GROWTH-DASHBOARD.json` (generated) and canvas.

Future-ready fields: most booked (HotDoc analytics later), pageview join from analytics when available.

## Admin publish note

Growth columns save as draft with the practitioner form. Public badges/filters read **publishedPayload** (and row fallbacks). After editing growth fields, **publish** the practitioner — or re-run the seed script to merge into `publishedPayload` for the three new GPs.
