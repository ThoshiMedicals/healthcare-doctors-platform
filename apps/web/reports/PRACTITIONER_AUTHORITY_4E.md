# Prompt 4E — Practitioner authority visibility

## Goal

Patients can discover relevant practitioners through published authority pathways — without unverified clinical claims.

## Authority graph

Built from shared **service** links in `search-index/doctors.json` + titles from `services.json`.

- Generator: `.tmp-pdf-convert/build-practitioner-peers.mjs`
- Artifact: `apps/web/public/search-index/practitioner-peers.json` (and `old-html/search-index/`)
- Runtime: peer graph embedded in `site.js` (UAT `next start` only serves public files present at build; embed keeps peers live)

Peers are ranked by count of shared published related services. Copy states this is not availability, suitability, or a ranking recommendation.

## What shipped

1. **Peer recommendations on practitioner profiles** — “Other practitioners in related care areas” band after Related Services, with shared care-area labels.
2. **Clearer expertise on profiles** — hero care highlights styled as chips + “Published areas of care from this profile”.
3. **Related practitioners on services / articles** — existing `#related-practitioners` blocks get `authority-related-practitioners` styling; provenance paragraphs kept (no duplicate disclaimer when already present).
4. **Digital Reception journeys** — practitioner cards show `Authority signal: …` plus published interest chips from profile leads.

## Verification (UAT `:3100`)

| Surface | Result |
|---------|--------|
| `/doctors/dr-tanya-goodwill.html` | Peer band with Wasantha, Anand, Gemunu, Karimi + shared care areas; expertise caption present |
| `/services/skin-checks.html` | Related practitioners marked `authority-related-practitioners`; verified-profile provenance intact |
| Digital Reception `diabetes doctor` | Wasantha (lead: diabetes management) + Tanya with published interest chips |

## Guardrails

- No gender inference, no availability claims, no “best doctor” language.
- Empty article matches remain honest (“No practitioner profile is matched…”).
- Regenerate peers after doctor/service related-link changes: `node .tmp-pdf-convert/build-practitioner-peers.mjs` then `node .tmp-pdf-convert/embed-peers-4e.mjs`.
