# Institutional Image Library — photography, provenance and publication control

**Woolloongabba Medical Centre | Source:** approved production website, 9 October 2026.

**Status:** Governance framework implemented; **no photographs have received new authentic-original approval in this package**. This is an operational catalogue and publication gate, not a claim that all historical photographs were captured on site. The current approved page layouts, image selections, logo bytes, patient paths and branding remain unchanged.

## 1. Principles and non-negotiables

1. Use authentic, identifiable Woolloongabba Medical Centre photographs for anything described as a **real practice location, room, procedure, staff member or access feature**. Never use AI or stock imagery as proof of an actual clinic, interior, professional, service, accessible entrance or accreditation.
2. Where genuine source photography is absent, **omit the optional new image slot**. A page must remain readable, accessible and attractive without it. Do not fill missing interiors with pictures from another centre.
3. Preserve every source master **without alterations**. Colour/crop versions are separate derivatives linked back to the untouched original's SHA-256. Retouching must not change factual aspects of premises, clinicians, equipment, signs, street environments, parking, entrances or compliance.
4. Existing production images are **legacy design references**, not automatically verified originals. Their current use remains frozen so this governance-only deliverable does not redesign or unexpectedly break existing pages. They are **not licensed for new CMS placements or network rollout** until approved.
5. The five `/assets/brand/` files are controlled graphic artwork, **not photographs**. AGPAL usage also requires a verified accreditation status; reuse original logo files without redraw.
6. Named practitioner photos require authentic originals, verified identity and appropriate publication authorisation. Existing 11 first-party portrait URLs remain pending local original import; two other practitioners have no photo. No screenshot extraction, face recreation or synthetic portraits.

## 2. Six controlled image categories

| Category | Folder | Crop / framing | Authenticity rules | Current state |
|---|---|---|---|---|
| Hero Images | `/assets/hero/` | Approved 1672×941 desktop (~16:9), 1380×941 tablet (~3:2), 820×941 mobile (~7:8); preserve building signage and overlay-safe zone | Verified actual premises with truthful architectural detail | Existing production variants catalogued, **original provenance pending** |
| Community Images | `/assets/community/` | 16:9 or 3:2, recognisable genuine neighbourhood, real streets | Show the actual Gabba/community; document rights and attribution | Existing references include exterior repeats; Wikimedia source not imported or rights verified |
| Clinic Exterior | `/assets/clinic-exterior/` | 3:2 documentary or 16:9 contextual; capture actual entrance, access, signage | Must match current premises; don't infer on-site parking or accessible entrances | Existing exterior derivatives catalogued; source/master provenance pending |
| Team Photography | `/assets/team/` | 4:5 portraits; eyes 38–42% from top, natural headroom 7–10%; 3:2 real group | Real clinician, verified identity, rights and consent. No synthetic human | 11 originals missing; no substitutes added |
| Service Images | `/assets/services/` | 4:3, 3:2 or 16:9 when justified by existing component | Show only genuine equipment, environment and services; label generic editorial separately and never as clinic-specific proof | Existing HotDoc collateral catalogued but **not approved as clinical photography** |
| Governance Images | `/assets/governance/` | 4:3 or 3:2 factual process documentation | Actual quality/safety process with no readable patient information; genuine legal/accreditation claims only | **Intentionally empty** until authentic governance photographs exist |

**Clinic interiors:** Reception, waiting room, consultation room and treatment room are **not populated with invented photographs**. A first-party reception image URL exists in current production, but its actual original file was not included and cannot be elevated to a verified interior without sourcing and approval. An extra interior image category may be introduced only when genuine materials exist; do not misleadingly file a reception interior as a clinic exterior.

## 3. Consistent editorial photography style

- **Tone:** established local healthcare institution — calm, credible, human and community-rooted, not polished commercial SaaS advertising.
- **Light / white balance:** retain believable Brisbane daylight, neutral clinical whites and natural skin tones. No forced colour temperature or single LUT across dissimilar locations.
- **Exposure / contrast:** moderate, with visible interior details; retain readable original signage. No artificial sunbursts, synthetic window views, glowing equipment, HDR halos, crushed shadows or excessive warmth.
- **Saturation:** natural and restrained. Avoid fluorescent blues/greens and high-contrast orange/teal grading.
- **Composition:** camera near eye level, real human interaction when consented, correct perspective; no fabricated people in a facility image. Leave readable negative space in approved hero crops.
- **Portrait retouch:** restrict to exposure, colour and modest clean-up. Never reshape, replace, de-age or synthesize faces. Preserve identity in source-master pixels.
- **Derivatives:** create from approved masters with `parentSourceSha256`, crop ratio, output dimension, colour-correction recipe, approver and export format. Do not alter the archive master. Any future derivative must be visually reviewed in desktop/tablet/mobile components before use.

## 4. Required register for each photograph

For any **new or replaced** placement, capture: stable ID, category, clinic, exact real subject, capture date or signed source attestation, source master pathname and SHA-256, photographer/source, ownership and permitted scope, patient/staff consent or documented not-applicable rationale, face/room authenticity review, licence/credit obligations, editing/derivative trail, alt text, crop approval, brand approval, clinical owner where relevant, approval date/reference, allowed placements and revision history. Store signed evidence and identifiable consent **outside the web root**, in access-controlled records. A public manifest contains only safe references to those records.

An asset may progress through **discovered → pending original → pending authenticity → pending rights → pending consent → ready for approval → approved → published → archived**. A filename, current website publication, CMS editor selection or automated detector **never counts as human approval**.

## 5. Image selection / CMS rules

1. The CMS picker exposes only `approved` or `published` records for **new** placements.
2. Each component has an `image_optional` variant: without an approved image, omit the image container and use text-first layout. **Never auto-select the next available exterior or generate a placeholder photo.**
3. Preserve approved mobile crop focal positions and alt text. Accessibility: decorative images use empty alt; clinical/exterior informative photos describe real content without promotional claims.
4. Media from another practice is not eligible for Woolloongabba Clinic/Team/Governance categories. Network reuse is allowed only where the image is generic, accurately labelled and licensed for the other clinics.
5. Photographer release, team identity approval, patient consent, licensed commercial usage and governance claims must be rechecked before an image is put in new context.
6. Retire an image immediately if the clinician leaves, premises change materially, legal permission is withdrawn or an external licence expires; avoid stale doctor images and incorrect exterior access information.

## 6. Operational files and import procedure

- `assets/IMAGE_LIBRARY.json` — consolidated historical image audit, six-category definitions, source hashes/dimensions, publication states and outstanding gaps.
- `assets/{hero,community,clinic-exterior,team,services,governance}/MANIFEST.json` or `INSTITUTIONAL-CATEGORY.json` — category inventory. Empty of newly approved image bytes by design.
- `cms/asset-register.json` — points future CMS implementation to this register.
- `cms/institutional-photo-approval-template.json` — empty evidence/approval template. **Copy OUTSIDE the website root and fill only after actual review.**
- `tools/check_institutional_image_library.py` — verifies original archive hashes, image dimensions, expected folders and manifests; reports unverified/remote dependencies.
- `tools/import_approved_institutional_image.py` — gated future import of an original photo with externally held, completed approval. Does not modify website HTML or CSS; linking it in the CMS remains a separate authorised release. Existing 11 named practitioner photos should continue through `tools/import_verified_practitioner_photos.py` so all existing card/profile references stay in sync.

Suggested future workflow: receive originals directly from photographer/clinic → preserve source checksum → obtain consent and photographic/licence records → human review for authenticity and claim accuracy → create web crop/grade derivative (master remains untouched) → approve exact derivative hash and focal crop → import with signed approval → preview every relevant breakpoint → update CMS only after sign-off → rebuild site-index/caches if captions or alt descriptions change.

## 7. Rollout and release gates

**Release gates:** untouched legacy homepage and CSS, unchanged logo hashes, no broken local image paths, no published unapproved photos, verified crop quality, approved rights/identity, accurate source/alt text, mobile responsive review, and no credentials or private evidence in the deployed ZIP.

**Current unresolved inputs:** 11 practitioner originals; actual interior captures; original source/permission evidence for polished existing exteriors and hero; documentary governance scenes; separately licensed genuine community imagery; original reception photo if it is to be approved as a real clinic interior. **No generated images have been added.**
