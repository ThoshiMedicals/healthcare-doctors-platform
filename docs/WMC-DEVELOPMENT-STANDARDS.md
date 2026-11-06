# WMC Development Standards

**Authority:** Derived from [`WMC-MASTER-BRAIN.md`](./WMC-MASTER-BRAIN.md).  
**Audience:** Developers and AI agents implementing product changes.  
**Companion ops:** [`WMC-OPERATIONS-RUNBOOK.md`](./WMC-OPERATIONS-RUNBOOK.md) · Production: `deployment/LAUNCH.md`.

If this file conflicts with Master Brain on product intent, **Master Brain wins**. If it conflicts with `LAUNCH.md` on production procedure, **LAUNCH.md wins**.

---

## 1. Coding standards

### Language and runtime

- TypeScript / Next.js App Router under `apps/web`.
- Prefer absolute imports (`@/…`) consistent with the existing app.
- PowerShell on the Windows operator workstation — do not assume bash `&&` / heredocs in scripts or agent instructions for that machine.
- Do not commit `.env`, secrets, patient data, or laptop-only deploy state.

### Git and shipping

- Ship from a **known git SHA**. Do not treat dirty local UAT as production.
- Commit style in practice often uses `fix(wmc): …` / `merge(wmc): …`.
- Long-lived branches: `development` / `staging` / `main` per `deployment/SOURCE-CONTROL.md`. No content/per-doctor feature branches for public HTML.
- After `npm run uat:build`, restore `apps/web/next-env.d.ts` to `.next/types` before commit if it was rewritten to `.next-uat/types`.

### Dependencies and security

- Safe patch upgrades OK (e.g. Next security patches within the approved major).
- **Do not** run `npm audit fix --force` on cutover day (pulls Next 16 / zod 4 class breaks).
- Prisma migrations live under `apps/web/prisma/migrations/`. Generate client after schema changes; stop UAT/dev if Windows locks the Prisma DLL.

### Testing

- Add or extend unit tests next to modules (`*.test.ts`) for filters, gates, permissions, and pure assemblers.
- Admin nav changes **must** update `apps/web/src/security/admin-hardening.test.ts` (`APPROVED_MODULES`).
- Prefer evidence-based QA against live `next.` / UAT + tip SHA — do not claim GO without ops evidence.

### Shared public runtime

- Keep `apps/web/public/site.js` and `old-html/site.js` in sync when changing shared client behaviour.
- Prefer versioned cache busts (`?v=wmc-…`) in `public-ux.ts` over relying on edge purge alone.

---

## 2. CMS standards

### Golden HTML and overlays

- Golden master is `old-html/`. **Do not edit** unless a written exception names the file.
- `GOLDEN_HTML_FROZEN = true` (`apps/web/src/platform.ts`). Public HTML is served from **immutable** `PageRevision` rows.
- CMS changes go through overlays / `publishedPayload` (`apps/web/src/cms/overlay.ts`) into approved slots — do not rewrite page chrome.
- Presentation-only refinements use `apps/web/src/documents/public-ux.ts` (and related document modules), not ad-hoc page HTML rewrites.

### Publish and revision

- Workflow: draft → submit → clinical sign-off → practice approve → publish (`release.ts`).
- Publish is **fail-closed** (`publish-gates.ts` / `evaluateContentPublication`).
- Entity edits record `ContentRevision` (`previous` / `next`). Use `AuditLog` for operational actions (e.g. form request updates, media upload).
- Clinic Admin and Super Admin publish/rollback content; Content Editors edit and submit only.

### Schema and modules

- New admin modules: add to `CMS_MODULES` (`modules.ts`) with correct `CmsAction` + nav group, then update hardening tests.
- Permissions matrix: `apps/web/src/auth/permissions.ts`.
- Clinic scoping: every operational entity (`Vacancy`, `FormRequest`, `MediaAsset`, etc.) is `clinicId`-scoped unless a future multi-tenant design explicitly says otherwise.

### Insights and authority growth

- Authority optimisation follows [`WMC-AUTHORITY-GROWTH-ENGINE.md`](./WMC-AUTHORITY-GROWTH-ENGINE.md) ([DEC-2026-13](./WMC-DECISION-REGISTER.md#dec-2026-13)).
- Prefer composing existing measurement builders (SCO, PA, SA, Digital Reception, Briefing) over new Insights nav modules or Prisma “queue” tables.
- Growth Queue deep links must stay actionable (focus / intent / queue / hash) — same posture as Recommended Actions.
- Do not AI-draft public articles from search gaps; do not rewrite golden HTML for link sprints — overlays and publish gates only.

### Image replacement

- Pixel- and format-matched replacement only for approved targets (logo, hero, exterior, verified portraits) via `image-replacement.ts` / Image reviews.
- Knowledge/service locked regions are not free-form replaceable from the Media Library.

---

## 3. Public UX standards

### Preserve always

- SEO titles/meta, schema.org JSON-LD, HotDoc lightbox booking grammar.
- Approved public layout and navigation structure.
- Governance/trust strips when published registry data exists.
- Brand: no testimonials, no star ratings, no invented accreditation dates, no “best doctor” claims.

### Booking grammar

- HotDoc URLs stay on `hotdoc.com.au` with lightbox workflow.
- Insurance notices: only the data-driven slug `does-not-bulk-bill-for-insurance-patients` (`booking-restriction-notice.ts`).
- Mary: phone-only (`tel:`) — no HotDoc book CTA; do not invent insurance notices.
- Do not invent restriction paths for other practitioners (e.g. Usman leave alone; Gemunu 404 expected where removed).

### Cache and assets

- Bust `styles.css` / `site.js` / `digital-reception.js` via `public-ux.ts` when behaviour or CSS changes.
- Managed images may serve through `/api/managed-image/…`.
- Prefer factual, rights-cleared photography per `IMAGE_LIBRARY.json` policy — no AI face generation for portraits.

### Phase discipline

- No Phase 1B public redesign unless explicitly requested.
- Do not add pages, redirects, or CMS behaviour that change approved layout as part of “ops” work (`LAUNCH.md` posture).

---

## 4. Deployment standards

### Paths

| Environment | Standard |
| --- | --- |
| Local dev | `npm run dev` → `:3000`, distDir `.next` |
| Local UAT | `npm run uat:build` then `npm run uat` → `:3100`, distDir `.next-uat` |
| `next.` (operator) | UAT `:3100` + Cloudflare tunnel — **not** a remote VPS app |
| Production | VPS per `deployment/LAUNCH.md` only |

### Forbidden production paths

- Hostinger
- Cloudflare Pages
- Deploying by copying laptop `.env` to VPS
- DNS cutover without GO on `deployment/DNS-CUTOVER-CHECKLIST.md`

### Release hygiene

- Tip SHA documented in Master Brain §16 + `deployment/RELEASE-ARTIFACT-MANIFEST.md`.
- Production: `docker compose -f deployment/docker-compose.production.yml …` on the VPS only.
- Migrate → seed (first time) → `import:golden` as documented in LAUNCH.md.
- Postgres must not be public; only 80/443 published behind Cloudflare.

### After public-ux / site.js / next.config changes

1. Rebuild UAT.
2. Verify `127.0.0.1:3100` and `https://next.gabbamedicalcentre.com.au` (when tunnel is up).
3. Confirm health: `database: up`.

Detailed steps: [`WMC-OPERATIONS-RUNBOOK.md`](./WMC-OPERATIONS-RUNBOOK.md).

---

## 5. Governance standards

### Clinical content

- Knowledge Centre is healthcare authority content — not a blog.
- Reviews use `ClinicalReview` and governance admin (`clinical_signoff`).
- Expiry / due-date queues are BAU — do not publish without next-review discipline where gates require it.
- Populate published governance registry so public review strips are truthful.

### Media and rights

- Media Library (`edit`) = catalogue and metadata.
- Image reviews (`clinical_signoff`) = rights, expiry, replacement publish.
- Alt text and usage detection are operational hygiene, not optional polish.

### Measurement and privacy

- Search demand signals are privacy-scoped; retention ~90 days — do not surface raw query PII on dashboards.
- Measurement events follow the 2G contract in `apps/web/src/measurement/types.ts`.
- Demo vs live data modes are for QA — do not confuse demo with production evidence.
- Authority Growth Queue exports and UI follow the same privacy rules as SCO ([`WMC-AUTHORITY-GROWTH-ENGINE.md`](./WMC-AUTHORITY-GROWTH-ENGINE.md) §11).

### Brand and clinical claims

- AGPAL and accreditation pages are governed assets.
- Do not invent HotDoc restrictions, review dates, or clinical superiority claims.

### Audits

- Audits are evidence-based against live tip + environment.
- Do not claim production GO from laptop UAT alone.

---

## Document history

| Date | Change |
| --- | --- |
| 2026-11-03 | Initial extraction from Master Brain + LAUNCH / SOURCE-CONTROL posture. |
| 2026-11-03 | Linked Authority Growth Engine (DEC-2026-13) under Insights/authority standards. |
