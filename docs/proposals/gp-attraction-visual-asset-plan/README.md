# GP Attraction Visual Asset Plan — launch placeholders

Canonical inventory: [`asset-inventory.json`](./asset-inventory.json)

## Sources

- Visual Asset Plan canvas (`wmc-gp-attraction-visual-asset-plan`)
- Practice Experience Content Pack shot / video IDs
- Asset Library taxonomy (`scene` / `surface` / `module`)

## Deliverables

| Output | Location |
| --- | --- |
| Inventory (prompts, alt, captions, video beats) | `asset-inventory.json` |
| AI still placeholders | `apps/web/public/assets/attraction/placeholders/` |
| Video posters | `…/placeholders/posters/` |
| PE hub module heroes | `apps/web/public/assets/practice-experience/*.jpg` |

## AI policy (enforced)

| Plan AI | Launch behaviour |
| --- | --- |
| Photo-only | AI **bridge** stills allowed; labelled `ai_placeholder`; swap to real WMC masters |
| AI-assist | AI bridge OK; prefer real base later |
| AI-ok | Generative OK if not claimed as documentary staff/spaces |
| AI-ban (`NC-01`, `DC-01`, `TD-01`) | **No synthetic clinician faces as WMC staff** — environment bridges only until consented shoot |

## Hub primary map

| Module | Still ID | Plan ref | Video |
| --- | --- | --- | --- |
| Typical Day | PE-TD-01 | CR-01 | VID-TD-01 |
| Nursing | PE-NU-01 | TR-01 | VID-NU-01 |
| Reception | PE-RX-01 | RX-01 | VID-RX-01 |
| Team | PE-TM-01* | TD-01 | VID-TM-01 |
| Community | PE-CM-01 | CC-01 | VID-CM-01 |
| Continuity | PE-CO-01 | WA-01 | VID-CO-01 |
| Flexible Sessions | PE-FS-01 | CR-01 | VID-FS-01 |

\*Team hub hero uses corridor bridge (`PE-TD-04` visual language) until consented `TD-01` people shoot.

## Categories covered

- Consulting rooms — `PE-TD-*`, `CR-*`
- Nursing collaboration — `PE-NU-*`, `TR-*`, `NC-02`
- Reception workflows — `PE-RX-*`
- Community environments — `PE-CM-*`, `LS-03`
- Continuity imagery — `PE-CO-*`, `CC-03`
- Flexible-session imagery — `PE-FS-*`, `LS-02`
- GP lifestyle imagery — `LS-01`–`LS-03`, desk/corridor bridges for AI-ban IDs
