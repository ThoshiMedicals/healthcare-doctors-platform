# GP Attraction CMS — Phase 1

Implements Attraction CMS core from the planned architecture, Story Capture human-gate model, and Asset Library registry — **without production publish**.

Sources:

- Cursor plan `gp_attraction_cms_433fc66c` (AttractionDocument / Revision / ApprovalEvent)
- Cursor plan `gp_attraction_asset_library_e331ddb9` (AttractionAsset registry)
- [`docs/proposals/gp-story-capture-system/schema.prisma`](../docs/proposals/gp-story-capture-system/schema.prisma)
- [`docs/proposals/gp-attraction-content-governance/governance.json`](../docs/proposals/gp-attraction-content-governance/governance.json)

---

## Prisma schema (Phase 1)

| Model | Role |
| --- | --- |
| `AttractionDocument` | Clinic-scoped unit (`kind` + `slug`); mutable `draftBody`; `publishState`; optional `publishedRevisionId` (unused for live HTML in Phase 1) |
| `AttractionRevision` | Append-only; `immutable=true`; `contentSha256`; `versionNumber` |
| `AttractionApprovalEvent` | Immutable human gate; `reviewerId` required; forbids system/auto |
| `AttractionSchemaValidation` | Hook result per revision |
| `AttractionAsset` | Asset Library metadata registry (no binary pipeline yet) |

**Kinds:** `opportunities` · `faq` · `practice_experience` · `registrar_pathway` · `story`

**Publish states:** `drafting → in_review → approved → scheduled → published → review_due → on_hold → archived`  
Phase 1 services **refuse** transitions to `scheduled` / `published`.

**Change classes:** `A_minor` · `B_substantive_copy` · `C_clinical_or_capacity` · `D_schema_or_vacancy`

Migration: `apps/web/prisma/migrations/20261104130000_gp_attraction_cms_phase1/`

---

## Services

| Module | Responsibility |
| --- | --- |
| `src/attraction-cms/documents.ts` | Create document + v1 revision; draft update; new immutable revision; fingerprint |
| `src/attraction-cms/approvals.ts` | Human-only decisions; schema gate on approve; `publishAttractionDocumentToProduction()` always throws |
| `src/attraction-cms/validate-schema.ts` | Schema hooks (JobPosting forbid, FAQ sync, consent, hiring tone) |
| `src/attraction-cms/schema-rules.ts` | Per-kind allow/deny matrix |
| `src/attraction-cms/assets.ts` | Asset Library upsert/list |
| `src/attraction-cms/seed-defaults.ts` | Idempotent seed for five domains |

---

## API routes

| Method | Path | Notes |
| --- | --- | --- |
| GET/POST | `/api/admin/attraction/documents` | List / create / `action:seed_defaults` |
| GET/PATCH | `/api/admin/attraction/documents/[id]` | Detail / draft patch |
| POST | `/api/admin/attraction/documents/[id]/revisions` | Immutable revision + validation |
| POST | `/api/admin/attraction/documents/[id]/approvals` | Human decisions; `publish_production` → **403** |
| GET/POST | `/api/admin/attraction/assets` | Asset registry |

Auth: `requireAction("edit")` for documents/assets; approvals require `clinical_signoff`.

---

## Admin UI architecture

```
/admin/attraction                 Inventory + seed + asset summary
/admin/attraction/architecture    In-app architecture note
/admin/attraction/[id]            Revision JSON, schema results, approval actions
```

Nav: Content → **Attraction CMS** (`modules.ts`).

Detail actions: submit_for_review · approve · request_changes · pause · approve_publish_intent (records intent, keeps `approved`, never sets live pointer).

---

## Schema validation hooks

On every revision create and before approve:

1. Forbidden `@type` (JobPosting, JobBoard, EmploymentAgency, …) per kind
2. FAQ visible text === FAQPage `acceptedAnswer` when FAQs present
3. Named people require `consentOnFile` (Story Capture / Asset Library)
4. Hiring-tone scan
5. Fingerprint match: `contentSha256 === reviewedContentSha256` on approval

---

## Migration strategy

1. **Apply migration** on local/UAT Postgres only:
   ```bash
   cd apps/web
   npx prisma migrate deploy
   npx prisma generate
   ```
2. **Seed defaults** via Admin → Attraction CMS → “Seed Phase 1 defaults” (or POST `seed_defaults`).
3. **Do not** point public catch-all at `AttractionDocument.publishedRevisionId` yet.
4. **Keep** Practice Experience / Join Our Team live HTML on existing `Page` / `PageRevision` paths.
5. **Story Capture** remains proposal workflow; `storyCaptureRef` is a string pointer until `GpStory` migrates.
6. **Asset Library** rows may reference PE shot IDs; binaries stay out of git.
7. **Phase 2 (future):** promote approved revision → render HTML → set `publishedRevisionId` + public Page sync behind full publish gates; still human-only.
8. **Rollback:** drop Phase 1 tables via reverse migration if needed — no public dependency in Phase 1.

---

## Explicit non-goals (Phase 1)

- No production / UAT public HTML publish from Attraction CMS
- No auto-publish from content-intelligence
- No golden-master (`old-html/`) edits
- No Opportunity Pack composition pins (later)
- No full Story Capture Prisma merge (ref only)
