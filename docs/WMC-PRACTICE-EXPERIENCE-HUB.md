# Practice Experience Hub — live implementation

Implements the approved **Practice Experience Hub** using:

- Practice Experience Content Pack (`docs/proposals/practice-experience-content-pack/`)
- Visual Asset Plan references (shot IDs / asset refs in content pack)
- Testimonial Framework quote shape (12–22 words, operational detail, consent levels)

No new marketing concepts. No JobPosting schema. MedicalClinic + WebPage + BreadcrumbList only.

---

## 1. Information architecture

```
About Us
└── Practice Experience Hub          about-us/practice-experience.html
    ├── Typical Day                  #typical-day
    ├── Nursing                      #nursing
    ├── Reception                    #reception
    ├── Team Interactions            #team-interactions
    ├── Community                    #community
    ├── Continuity                   #continuity
    └── Flexible Sessions            #flexible-sessions
```

**Audience:** Prospective GPs judging practice fit (employer-brand decision aid).

**Voice:** Consulting day, session pattern, continuity, handoffs — not hiring slogans.

**Honesty line (required):** “These accounts describe practice experience. They are not job advertisements.”

**Related surfaces:** Philosophy of Care · Our Community · Our Team · Join Our Team (EOI only; vacancy JobPosting stays on Join Our Team).

---

## 2. Route structure

| Surface | Storage / public path | Notes |
| --- | --- | --- |
| Hub | `about-us/practice-experience.html` | Catch-all public route via published `PageRevision` |
| Module anchors | `#typical-day` … `#flexible-sessions` | One page, seven modules |
| Admin | `/admin/practice-experience` | CMS preview / publishing status |
| Publish CLI | `npx tsx scripts/publish-practice-experience.ts` | Creates immutable revision (does **not** write `old-html/`) |

About Us hub card + side-nav link are injected at render time by `public-ux` → `injectPracticeExperienceAboutLinks` (golden master untouched).

---

## 3. React component structure

Public site remains HTML revisions (WMC platform rule). React is the **CMS / admin** tree:

```
PracticeExperienceAdminPage          apps/web/src/app/admin/(dashboard)/practice-experience/page.tsx
└── PracticeExperienceModuleEditor   .../module-editor.tsx
    ├── ModuleHeader (id, anchor, order)
    ├── MediaPreview (placeholder badge)
    ├── BlockList (timeline | bullets | callout | vignette | example)
    └── PullQuotePreview (testimonial framework fields)
```

Server render helpers (not React pages):

```
hub-content.ts          → typed CMS payload (placeholder → replaceable)
render-hub-html.ts      → public HTML shell + modules
schema-guards.ts        → MedicalClinic only; forbid JobPosting
inject-about.ts         → About Us card + nav link
```

---

## 4. CMS content models

### `PracticeExperienceHubContent`

| Field | Type | Purpose |
| --- | --- | --- |
| `id` | `"wmc-practice-experience-hub"` | Stable hub id |
| `version` | string | Content version (`1.0.0-placeholder`) |
| `path` | `about-us/practice-experience.html` | Public path |
| `title` / `metaDescription` / `h1` / `lede` | string | SEO + hero |
| `honestyLine` | string | Required trust note |
| `modules[]` | `PracticeExperienceModule` | Seven approved modules |

### `PracticeExperienceModule`

| Field | Type | Purpose |
| --- | --- | --- |
| `id` | enum | `typical_day` … `flexible_sessions` |
| `label` / `hubTitle` / `order` / `anchor` | string/number | IA + TOC |
| `lede` | string | 120–180 word brief (placeholder OK) |
| `blocks[]` | `{ id, type, heading, points[] }` | Content pack section outlines |
| `media` | `{ src, alt, kind, assetRef?, caption? }` | Visual asset plan slot |
| `pullQuote` | `{ id, text, attribution, voice }` | Testimonial framework |
| `internalLinks[]` | `{ href, label }` | Related practice pages |

### Persistence

| Store | Role |
| --- | --- |
| `Page` + `PageRevision` | Live public HTML (immutable) |
| `PracticePage` (`slug=practice-experience`) | `sections` + `publishedPayload` JSON = hub content |
| `NavigationOwnership` | `sectionKey=about` |

---

## 5. Placeholder content strategy

| Layer | Now | Later (replace) |
| --- | --- | --- |
| Module ledes / blocks | Derived from content-pack outlines | Story-capture interviews + editorial |
| Pull-quotes | Composite placeholders matching quote shape | Consented quotes (`voice: consented`) |
| Visuals | AI placeholders in `public/assets/practice-experience/*.jpg` | Consented stills per shot IDs (`PE-TD-01`, `TR-01`, …) |
| Captions | Activity + place; badge marks placeholder | Visual asset plan caption rules |
| Schema | MedicalClinic + WebPage + BreadcrumbList | Unchanged — still **no** JobPosting |

Replacement workflow: edit `hub-content.ts` (or future admin write API) → re-run publish script → verify schema guards → UAT.

---

## 6. Publishing checklist

- [ ] `npx tsx scripts/publish-practice-experience.ts` succeeds for clinic
- [ ] `GET /about-us/practice-experience.html` returns 200 on UAT (`:3100` / `next.`)
- [ ] All seven anchors present; on-this-page nav keyboard operable; touch targets ≥44px
- [ ] JSON-LD includes MedicalClinic + WebPage; **no** JobPosting / JobBoard / EmploymentAgency
- [ ] Honesty line visible in hero
- [ ] About Us hub shows Practice Experience card (via `public-ux` inject)
- [ ] AI placeholder badges visible until consented media lands
- [ ] Hiring-tone scan clean (no “we’re hiring / apply now / talent pipeline”)
- [ ] Composite vignettes labelled; no PHI / patient faces
- [ ] Link to Join Our Team does not invent vacancies
- [ ] `npm test` includes `src/practice-experience/schema-guards.test.ts`
- [ ] Golden master `old-html/` unchanged

---

## File map

| Path | Role |
| --- | --- |
| `apps/web/src/practice-experience/*` | Types, content, render, guards, inject |
| `apps/web/scripts/publish-practice-experience.ts` | Publish revision |
| `apps/web/src/app/admin/(dashboard)/practice-experience/*` | Admin React |
| `apps/web/public/assets/practice-experience/*` | Placeholder visuals |
| `apps/web/public/styles.css` | `.pe-*` presentation |
| `apps/web/src/documents/public-ux.ts` | About inject |
