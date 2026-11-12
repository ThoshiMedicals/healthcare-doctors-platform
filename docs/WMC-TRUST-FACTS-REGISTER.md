# WMC Trust Facts Register

| Field | Value |
| --- | --- |
| Document | `docs/WMC-TRUST-FACTS-REGISTER.md` |
| Machine index | [`WMC-TRUST-FACTS-REGISTER.json`](./WMC-TRUST-FACTS-REGISTER.json) |
| Audit date | 2026-11-11 |
| Scope | Public-facing Woolloongabba Medical Centre trust facts |
| Method | Repo audit of golden master (`old-html/`), ClinicProfile seed, presentation overlays, updates, recruitment surfaces |
| Rule | **Do not invent.** Values below are quoted or tightly paraphrased from verified sources only. |
| Status | Authority register — patient prose remains in golden HTML / DB-imported revisions |

**Related (not substitutes):** `docs/WMC-CANON-REGISTRY.md` = knowledge-hub inventory rules only (no contact/hours literals). Clinic structured profile = `apps/web/prisma/seed.ts`.

---

## Authority hierarchy (source owners)

| Code | Owner | Role |
| --- | --- | --- |
| **GM** | `old-html/` golden master HTML (imported CMS page revisions) | Patient-facing prose, schema on pages, footers |
| **SEED** | `apps/web/prisma/seed.ts` → `ClinicProfile` / `OpeningHours` | Structured contact, hours, after-hours, HotDoc URL |
| **SSR** | `apps/web/src/documents/public-ux.ts` (+ related document modules) | Presentation overlays; must not invent policies |
| **RT** | `apps/web/public/site.js`, `digital-reception.js` (keep `old-html/` mirrors in sync) | Client booking chrome / notice injection |
| **UPD** | `old-html/updates-data.js` (+ `apps/web/public/updates-data.js`) | Published updates articles |
| **FALLBACK** | `apps/web/src/clinics/branding.ts` `DEFAULT_CLINIC_BRANDING` | Used only when profile missing — must match SEED/GM |
| **RECRUIT** | `apps/web/src/recruitment/contact.ts`, `offer-config.ts` | GP attraction only — not patient reception facts |

**Pages using each fact** are listed under column **D**. Prefer fixing SEED + FALLBACK + SSR before rewriting GM, unless GM itself is wrong.

---

## A. Trust Facts Register

### A1. Identity & contact

| ID | Fact | Canonical value | Confidence | Owner | D — Pages / surfaces using this fact |
| --- | --- | --- | --- | --- | --- |
| TF-NAME-01 | Practice name | `Woolloongabba Medical Centre` | High | SEED + GM | Sitewide titles, schema `name`, footers, contact, hero eyebrow |
| TF-NAME-02 | Brand lockup (logo alt) | `Healthcare Doctors — Woolloongabba Medical Centre` | High | GM | Logo `alt` sitewide |
| TF-NAME-03 | Network name | `Healthcare Doctors` | High | SEED | Network entity; not a clinic rename |
| TF-PHONE-01 | Patient phone (display) | `(07) 3217 3344` | High | SEED + GM | Headers, footers, contact, sticky call, digital reception |
| TF-PHONE-02 | Patient phone (`tel:`) | `+61732173344` | High | SEED + GM + RT | `tel:` hrefs; `site.js` `CLINIC_TEL` |
| TF-PHONE-03 | Schema telephone | `+61 7 3217 3344` | High | GM | JSON-LD on public pages (same line, spaced format) |
| TF-FAX-01 | Fax (display) | `(07) 3189 4808` | High | SEED + GM | `contact.html`, footers |
| TF-EMAIL-01 | Patient email | `reception@gabbamedicalcentre.com.au` | High | SEED + GM | Contact, footers, schema `email` |
| TF-ADDR-01 | Street | `468 Vulture Street` | High | SEED + GM | Contact, schema, maps, access-parking, footers |
| TF-ADDR-02 | Locality | `Woolloongabba` | High | SEED + GM | Schema `addressLocality`, prose |
| TF-ADDR-03 | State / postcode / country | `QLD` / `4102` / `AU` | High | SEED + GM | Schema + contact prose |
| TF-ADDR-04 | Full address line | `468 Vulture Street, Woolloongabba QLD 4102` | High | GM | Contact lede, footers, parking page |
| TF-URL-01 | Canonical base | `https://gabbamedicalcentre.com.au` | High | SEED + GM | Canonical/OG URLs |
| TF-HOTDOC-01 | Clinic HotDoc booking URL | `https://www.hotdoc.com.au/medical-centres/woolloongabba-QLD-4102/t-medicals-woolloongabba-medical-centre/doctors?wp=w_lightbox` | High | SEED + GM + RT | Book CTAs, sticky bar, book-appointment |

### A2. Opening hours

| ID | Fact | Canonical value | Confidence | Owner | D — Pages / surfaces |
| --- | --- | --- | --- | --- | --- |
| TF-HOURS-01 | Mon–Thu | Opens `07:00` / closes `19:00` (display: 7am–7pm / 7:00 AM–7:00 PM) | High | SEED + GM | Seed `OpeningHours`; hero; contact; footer; schema |
| TF-HOURS-02 | Friday | `08:00`–`17:00` | High | SEED + GM | Same |
| TF-HOURS-03 | Saturday | `09:00`–`17:00` | High | SEED + GM | Same |
| TF-HOURS-04 | Sunday | `09:00`–`15:00` | High | SEED + GM | Same |
| TF-HOURS-05 | Seven-day claim | Open seven days / Open 7 Days | High | GM + SSR | Contact strip; hero trust badge |

**Display variants (same times):** hero `7am–7pm`; contact detail `7:00am–7:00pm`; footer `7:00 AM–7:00 PM`. SSR meridian normalization applies to `.contact-hours-detail` / `.footer-hours` only.

### A3. After-hours

| ID | Fact | Canonical value | Confidence | Owner | D — Pages / surfaces |
| --- | --- | --- | --- | --- | --- |
| TF-AH-01 | After-hours provider | `Hello Home Doctor` | High | SEED + GM | `after-hours-care.html`, seed, updates, digital reception |
| TF-AH-02 | After-hours phone | `134 100` (`tel:134100`) | High | SEED + GM | Same |
| TF-AH-03 | Page path | `after-hours-care.html` | High | SEED + GM | Nav, seed `afterHoursPagePath` |
| TF-AH-04 | 13 HEALTH | `13 HEALTH` / `13 43 25 84` | High | GM | After-hours page + updates article |
| TF-AH-05 | Emergency | Triple Zero `000` | High | GM + RT | After-hours; telehealth disclaimer; digital reception |
| TF-AH-06 | Nearby ED (published) | Princess Alexandra Hospital; Mater Adult ED (`07 3163 8111`) | High | GM | `after-hours-care.html` only |

### A4. Parking & accessibility

| ID | Fact | Canonical value | Confidence | Owner | D — Pages / surfaces |
| --- | --- | --- | --- | --- | --- |
| TF-PARK-01 | Patient parking | Patient parking available near the centre, including disability parking | High | GM | `access-parking.html` |
| TF-PARK-02 | Driveway detail | Exact driveway/entrance **not published**; use 468 Vulture Street + on-site signage / call reception | High | GM | `access-parking.html` |
| TF-PARK-03 | Public transport | Brisbane / Translink to 468 Vulture Street | High | GM | `access-parking.html` `#public-transport` |
| TF-A11Y-01 | Wheelchair access | Wheelchair access available; disability parking available | High | GM | `accessibility.html`, `access-parking.html` |
| TF-A11Y-02 | Communication needs | Tell reception when booking about hearing/vision/language/other access needs | High | GM | `accessibility.html` |

### A5. Billing & fees

| ID | Fact | Canonical value | Confidence | Owner | D — Pages / surfaces |
| --- | --- | --- | --- | --- | --- |
| TF-BILL-01 | Bulk billing (standard) | 100% Medicare bulk billing for **standard Medicare-eligible general practice consultations** with a **valid Medicare card** | High | GM + UPD | `bulk-billing.html`, `fees-billing.html`, `practice-policies.html`, `assignment-of-benefit.html`, `medicare-exclusions.html`, updates |
| TF-BILL-02 | Fees may apply | Procedures, reports, employment/occupational medicals, other non-Medicare services | High | GM + UPD | Billing pages + updates |
| TF-BILL-03 | Fee advice | Where a fee applies, patients are advised in advance wherever practical | High | GM | Billing pages |
| TF-BILL-04 | Bulk billing meaning | Medicare benefit accepted as full payment for eligible service (no consultation fee for that service) | High | GM | `bulk-billing.html` |
| TF-BILL-05 | Hero marketing badge | `Bulk Billing Available` | High | SSR | Homepage hero trust badge → `bulk-billing.html` (softer than TF-BILL-01) |
| TF-FEE-01 | Telehealth private fees (published $) | Weekday telehealth **$65** (rebate **$42.85**); weekend telehealth **$80** (rebate **$42.85**); video items on current fee schedule | High | GM | **`telehealth.html` only** |
| TF-FEE-02 | Procedure / private pricing | Contact reception for pricing; no procedure price table in HTML | High | GM | `medicare-exclusions.html`, `services/medical-procedures.html`, `fees-billing.html` |
| TF-FEE-03 | HotDoc payment requests | Payment requests may be sent through HotDoc | High | GM | `fees-billing.html` |
| TF-FEE-04 | Cancellation / DNA fee amount | **Not published** — ask reception about any current fee | High | GM | `practice-policies.html` only |

### A6. Telehealth & appointments

| ID | Fact | Canonical value | Confidence | Owner | D — Pages / surfaces |
| --- | --- | --- | --- | --- | --- |
| TF-TH-01 | Availability | May be available when clinically suitable; GP may require in-person | High | GM + UPD | `telehealth.html`, updates |
| TF-TH-02 | Booking | HotDoc options or call reception | High | GM + UPD | `telehealth.html`, `book-appointment.html` |
| TF-TH-03 | Medicare eligibility | Depends on practice relationship / current Medicare rules; reception can clarify | High | GM | `telehealth.html` |
| TF-TH-04 | Not for emergencies | Use 000 for emergencies | High | GM | `telehealth.html` |
| TF-APPT-01 | Default booking | HotDoc when times published; otherwise call reception | High | GM | `book-appointment.html`, `new-patients.html` |
| TF-APPT-02 | Longer needs | Tell reception if multiple concerns / complex paperwork / longer time needed | High | GM | `practice-policies.html` |
| TF-APPT-03 | Cancel / change | Contact as early as possible | High | GM | `practice-policies.html` |
| TF-APPT-04 | New patients | Book HotDoc or call; bring Medicare card | High | GM + UPD | `new-patients.html`, updates |

### A7. Practitioner booking methods (verified)

| ID | Practitioner | Booking method | HotDoc / restriction signal | Owner | D — Pages |
| --- | --- | --- | --- | --- | --- |
| TF-BOOK-MARY | Dr Mary Abadir | **Phone only** (`tel:+61732173344`) | No HotDoc on profile; “Online booking is not available” | GM + RT + SSR | `doctors/dr-mary-abadir.html`; `services/womens-health.html`; phone-only chrome |
| TF-BOOK-USMAN | Dr Usman Gul | HotDoc + published restrictions | Slug `…strictly-seeing-male-patients-only`; male patients listing; female contact telehealth-only per OHO copy | GM | `doctors/dr-usman-gul.html` |
| TF-BOOK-INS-01 | Dr Anand Singh | HotDoc | Slug `does-not-bulk-bill-for-insurance-patients` + booking note | GM + SSR + RT | Profile + notice inject |
| TF-BOOK-INS-02 | Dr Debra Larkins | HotDoc | Same insurance slug + note | GM + SSR + RT | Profile |
| TF-BOOK-INS-03 | Dr Sambo Luon | HotDoc | Same | GM + SSR + RT | Profile |
| TF-BOOK-INS-04 | Dr Sumita Singh | HotDoc | Same; also on `services/mental-health.html` | GM + SSR + RT | Profile + service |
| TF-BOOK-INS-05 | Dr Tanya Goodwill | HotDoc | Same | GM + SSR + RT | Profile |
| TF-BOOK-STD | Other published profiles (Karimi, Wasantha, Nirupa, Steven Chang, Samuel Stafford) | HotDoc | Practitioner-specific HotDoc paths; no insurance-slug notice rule | GM | `old-html/doctors/*.html` |
| TF-BOOK-NOTE | Insurance notice text | `Booking note: {Name} does not bulk bill for insurance patients.` | High | SSR + RT | Injected when HotDoc URL contains insurance slug |

**Do not invent** insurance notices for practitioners without the HotDoc slug. **Do not** add HotDoc to Mary.

### A8. Recruitment-only contacts (not patient facts)

| ID | Fact | Value | Owner | D — Surfaces |
| --- | --- | --- | --- | --- |
| TF-REC-01 | Recruitment mobile | `0481 706 474` | RECRUIT | Join Our Team / GP portal / recruitment sticky (when recruit contact used) |
| TF-REC-02 | Recruitment email | `roshan@tmedicals.com.au` | RECRUIT | Same |
| TF-REC-03 | Careers sticky call (some paths) | Clinic `(07) 3217 3344` | GM RT / CMS careers | Mixed with TF-REC-01 — audience-specific |

---

## B. Contradictions Register

| ID | Severity | Topic | Conflicting values | Evidence | Patient impact |
| --- | --- | --- | --- | --- | --- |
| CX-01 | **Critical** (mitigated 2026-11-11 in FALLBACK code) | Street address fallback | Canonical `468 Vulture Street` vs FALLBACK was `31 Annerley Road` | `branding.ts` vs SEED/GM | Wrong address if ClinicProfile missing |
| CX-02 | **Critical** (mitigated 2026-11-11 in FALLBACK code) | Email fallback | Canonical `reception@…` vs FALLBACK was `admin@…` | `branding.ts` vs SEED/GM | Wrong email if profile missing |
| CX-03 | Medium | Phone `tel` storage format | SEED `+61732173344` vs prior FALLBACK `0732173344` | `branding.ts`, `public-ux.ts` | Usually normalized; risk if normalization skipped |
| CX-04 | Low (cosmetic) | Hours meridian / casing | `7am–7pm` vs `7:00am` vs `7:00 AM` vs schema `07:00` | Hero / contact / footer / SEED | Same times; presentation variance |
| CX-05 | Low (wording tier) | Bulk billing strength | Hero `Bulk Billing Available` vs prose **100% Medicare bulk billing for standard…** | SSR hero vs GM billing pages | Soft vs precise; not a false address/phone |
| CX-06 | Medium (discoverability) | Fee schedule location | Dollar fees only on `telehealth.html`; `fees-billing.html` has no $ table but is cross-linked from telehealth | GM | Patients on Fees & Billing may miss published telehealth $ |
| CX-07 | Info (audience) | Patient vs recruitment phone | `(07) 3217 3344` vs `0481 706 474` | GM vs RECRUIT | Correct if audience-scoped; confusing if mixed on same CTA |
| CX-08 | Low | Careers “call about joining” | Some careers sticky uses clinic reception; recruitment card uses Roshan mobile | `site.js` / careers vs `recruitment/contact.ts` | Mixed GP attraction CTAs |
| CX-09 | Info (duplicate paths) | Insurance notices | Baked in some GM HTML + SSR ensure + RT ensure | Triple maintenance | Drift risk if slug/text change |
| CX-10 | Info | After-hours Hello Home Doctor hours punctuation | Semicolons vs commas across after-hours page vs updates article | GM + UPD | Same meaning |

**Not contradictions (documented gaps):**

| ID | Gap | Status |
| --- | --- | --- |
| GAP-01 | Cancellation / non-attendance **fee amount** | Intentionally deferred to reception (TF-FEE-04) — do not invent |
| GAP-02 | Procedure price list | Not in HTML — reception (TF-FEE-02) |
| GAP-03 | Exact parking driveway | Explicitly not published (TF-PARK-02) |
| GAP-04 | UPD welcome articles for doctors without `old-html/doctors/` profile (e.g. Chanaka, Golnar in updates) | Content exists in UPD; profile HTML may be separate import concern |

---

## C. Recommended Corrections

### C1. Implemented this audit (safe consistency — no deploy)

| ID | Change | Rationale |
| --- | --- | --- |
| FIX-01 | `DEFAULT_CLINIC_BRANDING` aligned to SEED/GM: street `468 Vulture Street`, email `reception@…`, `phoneTel` `+61732173344`, logo path from seed | Removes CX-01 / CX-02 / CX-03 fallback risk |
| FIX-02 | `public-ux.ts` hero tel fallback uses `DEFAULT_CLINIC_BRANDING.phoneTel` | Single fallback source |

### C2. Recommended — operator / content (do not invent; no auto-policy)

| ID | Priority | Recommendation | Owner action | Invent? |
| --- | --- | --- | --- | --- |
| REC-01 | P0 | Confirm live DB `ClinicProfile` matches SEED (seed `update: {}` does not rewrite existing wrong rows) | Ops / Prisma check | No |
| REC-02 | P1 | On `fees-billing.html`, add a **pointer sentence only** to telehealth fee section on `telehealth.html` (or “see Telehealth for published telehealth private fees”) — **after** operator approval; golden-master exception required | Content owner | No new $ amounts |
| REC-03 | P1 | Re-verify telehealth $65 / $80 / $42.85 against current reception fee schedule; update GM only if schedule changed | Practice ops | No invention — verify then sync |
| REC-04 | P2 | Standardize hours display meridian to one human form (prefer footer `7:00 AM–7:00 PM`) via SSR only if changing hero — **hero FROZEN**; leave hero as-is unless operator lifts freeze | SSR / product | Cosmetic |
| REC-05 | P2 | Keep careers recruitment sticky on RECRUIT contact (not clinic reception) for GP paths | RECRUIT / RT | No |
| REC-06 | P2 | Treat insurance notice text + slug list as single source (`booking-restriction-notice.ts` + tests); GM baked copies should match | SSR/RT owner | No new practitioners |
| REC-07 | P3 | Document TF-BILL-05 as marketing shorthand that links to full TF-BILL-01 — no hero copy change under freeze | Product | No |

### C3. Explicitly out of scope (do not do without new brief)

- Invent cancellation fee amounts or new policies
- Add HotDoc to Mary or invent insurance notices
- Change Usman OHO / male-patients HotDoc slug
- Phase 1B redesign / hero authority v6 iteration
- DNS / production deploy

---

## D. Page index by fact family

| Fact family | Primary pages | Also appears |
| --- | --- | --- |
| Name / address / phone / email | `contact.html` | Sitewide header/footer/schema; `index.html` |
| Hours | `contact.html`, footer all GM pages | Hero (`index.html` / SSR), schema, UPD |
| After-hours | `after-hours-care.html` | UPD; digital reception; nav |
| Parking | `access-parking.html` | — |
| Accessibility | `accessibility.html` | Overlap on `access-parking.html` |
| Billing prose | `bulk-billing.html`, `fees-billing.html` | `practice-policies.html`, AOB, medicare-exclusions, UPD |
| Telehealth + $ fees | `telehealth.html` | UPD; link from fees-billing |
| Appointments | `book-appointment.html`, `new-patients.html` | `practice-policies.html` |
| Cancellation | `practice-policies.html` | book-appointment (HotDoc change/cancel mention) |
| Practitioner booking | `old-html/doctors/*.html` | `services/womens-health.html`, `mental-health.html`, SSR/RT |

---

## E. Source owner matrix (summary)

| Fact class | Authoritative write path | Presentation may adjust | Fallback |
| --- | --- | --- | --- |
| Practice identity & contact | SEED `ClinicProfile` + GM HTML | SSR inject from branding | FALLBACK (= SEED) |
| Opening hours (machine) | SEED `OpeningHours` | Schema/GM display | — |
| Opening hours (human) | GM HTML | SSR meridian normalize (contact/footer) | Hero frozen copy |
| After-hours | GM `after-hours-care.html` + SEED provider/phone | — | — |
| Parking / a11y | GM only | — | — |
| Billing / fees prose | GM patient-info pages | Hero badge SSR | — |
| Telehealth $ | GM `telehealth.html` | — | — |
| Policies (cancel, appt) | GM `practice-policies.html` | — | — |
| Booking method / restrictions | GM practitioner HTML + HotDoc URLs | SSR/RT notices + phone-only chrome | — |
| Recruitment contact | RECRUIT module | Attraction shells | Do not use for patient chrome |

---

## Audit evidence notes

- Existing `WMC-CANON-REGISTRY*.json` does **not** store contact/hours/billing literals; do not treat as Trust Facts SSOT.
- Public HTML is served from DB-imported immutable revisions; presentation tweaks go through `public-ux.ts`, not ad-hoc page rewrites — except approved GM edits with written exception.
- This register does not certify live WordPress apex or live HotDoc availability; it certifies **repo / golden-master / seed** consistency as of the audit date.

---

## Change log

| Date | Change |
| --- | --- |
| 2026-11-11 | Initial Trust Facts / Contradictions / Corrections registers; FALLBACK branding aligned to SEED/GM (FIX-01, FIX-02). No deployment. |
