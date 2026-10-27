# Visual, UX & Brand Maturity Audit (PROMPT 4H)

**Assessment date:** 2026-10-26 (Australia/Brisbane)  
**Environment:** UAT `http://127.0.0.1:3100` (post 3A–3I and 4C–4G)  
**Method:** Live review — homepage, practitioner profile (Dr Tanya Goodwill), service hub (Family Health), Health Advice index, Digital Reception dialog, mobile (384×832) + desktop (1366×768); CSS/JS capability signals; comparison to 3I scorecard  
**Companion scorecard:** `old-html/qa/VISUAL_UX_BRAND_MATURITY_SCORECARD_4H.json`

---

## Maturity scores (0–100)

| Score | **4H** | 3I | Δ | 3I “next stage” target |
| --- | ---: | ---: | ---: | ---: |
| **Visual Maturity** | **85** | 78 | +7 | ≥ 85 ✓ |
| **Brand Maturity** | **81** | 76 | +5 | ≥ 84 ✗ (short) |
| **UX Maturity** | **88** | 82 | +6 | — |
| **Conversion Maturity** | **90** | 84 | +6 | — |
| **Overall Website Maturity** | **87** | 80 | +7 | ≥ 88 ✗ (1 pt short) |

Weights unchanged: Visual 20% · Brand 20% · UX 30% · Conversion 30%.

### Have visual excellence objectives been achieved?

**Partially — conversion and UX excellence yes; full visual/brand excellence not yet.**

| Objective (from 3I roadmap) | Status |
| --- | --- |
| Stage A — Find Information on desktop | **Met** |
| Stage A — Mid-page Book bands | **Met** |
| Stage A — Quieter mobile dock | **Mostly met** (Call/DR icon-sized; header Call/Book still compete) |
| Stage B — 2–3 intentional motions | **Met** (4D) |
| Stage B — Typography refinement | **Scaffold only** (4G tokens present; not migrated) |
| Stage C — Clinical-review visibility | **Not met** (empty governance publish) |
| 3I exit: Overall ≥ 88, Brand ≥ 84 | **Not met** (87 / 81) |

**Launch stance:** **Conditional go** for patient-facing visual/UX. The site is a strong, shippable institutional Australian GP presence — not yet at the calm premium-clinic ceiling on brand type, trust reuse, and clinical currency.

---

## Benchmarks

| Benchmark | Relative position (4H) |
| --- | --- |
| **WMC maturity goals** (authority ecosystem, continuity, DR, measurable booking) | **Met / exceeded** on content ops, hubs, peers, conversion bands |
| **Hawthorne Clinic** (utility-first: book, hours, team, services, HotDoc) | WMC still **ahead** on storytelling, Digital Reception, authority graph, hub destinations; Hawthorne remains **quieter** on chrome (fewer simultaneous CTAs) |
| **Premium Australian healthcare** (distinct type, restrained motion, short mid-page conversion, visible clinical currency) | WMC now **competitive** on motion + mid-page conversion + hub pathways; still **trails** on distinctive UI type, sitewide trust-strip discipline, and visible clinical-review stamps |

---

## Area assessments

### 1. Homepage — Strong (86, was 82)

- Hero slogan, dual CTAs, hours, AGPAL / bulk billing / Open 7 days remain the trust ladder.
- Narrative arc intact; HotDoc education still home-weighted.
- **Residual:** Early team carousel can feel directory-like; CTA density still high; mobile first screen may push AGPAL chips below fold.

### 2. Practitioner Profiles — Excellent (90, was 84)

- Care highlights + “Published areas of care”; mid conversion band (“Ready to book with…”); peer band with shared care areas and honest disclaimer (4E).
- Find Information visible on desktop chrome.
- **Residual:** Aside remains Patient Information ops list; clinical-review strip absent.

### 3. Service Pages — Excellent (90, was 80)

- Family Health: Service hub chip, topic wayfinding, pathways rail (guides · practitioners · book), mid “Next step” band, destination section markers (4F).
- Tier vocabulary (Service hub / Connected / Focused) readable on hubs and directory.
- **Residual:** Inner heroes still warmer/mint vs home navy; pathway vs knowledge card dialects differ slightly.

### 4. Health Advice — Strong (85, was 83)

- Knowledge centre positioning clear; category grid + guide search + Book/Call; authority links to services/team.
- **Residual:** No clinical-review stamps; trust pills unused without governance publish.

### 5. Digital Reception — Strong (88, was 85)

- Dialog: disclosure, search, quick chips, Book + Call Reception; information-first posture intact.
- Journey motion (4D) present when searching.
- **Residual:** Shares persistent dock with Book/Call — still three conversion surfaces on mobile.

### 6. Mobile Experience — Good+ (84, was 80)

- Dock: Book ~full-width primary; Call + DR ~48px icons (3I H2 largely addressed).
- Content-first layouts retained from Oct Visual QA.
- **Residual:** Header Call + Book pills + Menu + dock = still busier than premium peers.

### 7. Trust Signals — Good (78)

- Universal footer AGPAL + bulk-billing; strong AGPAL page; home chips dated to Mar 2029; ACSQHC register language.
- **Residual:** Trust not reused near Book on hubs; `WMC_APPROVED_GOVERNANCE = {}`; 0/111 reviews populated.

### 8. Conversion Design — Excellent (90, was 84)

- Mid-page bands on profiles/services; hub pathway Book card; persistent dock; HotDoc resilience copy.
- Language consistent (“Book Appointment”).

### 9. Motion Design — Strong (82, was 62)

- Tokens + three patterns (CTA, journey, card hover); reduced-motion respected; no decorative whole-page rise.
- **Residual:** Presence still subtle vs cinematic premium peers — appropriately restrained for healthcare.

### 10. Accessibility — Good+ (84, was 82)

- Skip link, landmarks, FAQ details, focus-visible, DR expanded/close, reduced-motion.
- **Residual:** Clinical-review never announced; no formal contrast scorecard refresh; long side-nav density remains.

### 11. Brand Consistency — Good (80, was 76)

- Lockup + Baskerville + navy/teal coherent; 4G type/space tokens scaffolded in `:root`.
- **Residual:** Inter + warm cream still template-adjacent; ~4,984 `!important`s; eyebrow/button/radius dialects; tokens not yet driving heroes/articles.

---

## 3I issue disposition

| 3I ID | Issue | 4H status |
| --- | --- | --- |
| H1 | Find Information desktop-hidden | **Closed** — visible (`Find Information` chips on desktop) |
| H2 | Mobile CTA competition | **Partially closed** — dock quieted; header pills remain |
| H3 | Mid-page Book bands | **Closed** — profiles + services |
| H4 | Motion under-developed | **Closed** — 4D system live |
| M2 | Clinical-review invisible | **Open** — still empty publish |
| M4 | Inter + warm cream defaults | **Open** — tokens only |
| M6 | Peer discovery weak | **Closed** — peer band shipped |

---

## Findings by priority

### Critical

*None for visual/UX launch blockers.*

### High

| ID | Finding | Area |
| --- | --- | --- |
| H1 | Clinical governance never visible (empty approved payload) | Trust / Brand / A11y |
| H2 | Brand type/spacing tokens not migrated — Inter + cream still dominate inner pages | Brand / Visual |
| H3 | Mobile header Call/Book still compete with dock | Mobile / Conversion |
| H4 | Trust marks footer-primary; no reusable mid-journey trust strip on hubs | Trust / Brand |

### Medium

| ID | Finding | Area |
| --- | --- | --- |
| M1 | Home vs inner hero art direction split (navy cinematic vs mint essay) | Visual / Brand |
| M2 | HotDoc education still home-heavy | Conversion |
| M3 | Eyebrow / button / card-radius dialects | Consistency |
| M4 | CSS `!important` debt (~5k) blocks clean polish | Consistency |
| M5 | Profile aside is ops nav, not care-area peers | Profiles / UX |
| M6 | Qualification string formatting inconsistent across team | Brand / Trust |

### Low

| ID | Finding | Area |
| --- | --- | --- |
| L1 | Homepage Book CTA count still high | Homepage |
| L2 | Knowledge trust pills dormant | Health Advice |
| L3 | Service pathway cards vs knowledge cards — two dialects | Visual |
| L4 | Formal contrast audit not re-run post 4C–4F | Accessibility |

---

## Launch recommendations

1. **Ship visual/UX to production** as a strong institutional GP site — 3I Stage A conversion/clarity goals are largely met; patients can find tasks, book mid-journey, and navigate Knowledge ↔ Service ↔ Practitioner.
2. **Do not claim “premium brand complete”** until Stage P0–P2 from 4G land (trust strip, token migration, governance publish).
3. **Pre-launch ops:** approve first-wave clinical-review records for priority knowledge + hub pages; regenerate `governance-published.js`.
4. **Pre-launch polish (≤1 week):** migrate `.page-hero` / `.eyebrow` / `.lede` / `.article h2` to 4G tokens; add `.trust-strip` to top 4 hubs + new-patients; demote mobile header Call to icon or menu-only.
5. **Post-launch:** CSS consolidation of high-traffic `!important` type/space rules; optional UI-sans evaluation; HotDoc education beyond home.

### Go / No-go summary

| Question | Answer |
| --- | --- |
| Visual excellence (3I Stage A) achieved? | **Yes** |
| Visual excellence (premium AU ceiling) achieved? | **No — close, not complete** |
| Safe to launch patient site visually? | **Yes, conditional** on governance publish plan |
| Next prompt focus | Execute 4G P0+P1; then re-score Brand ≥ 84 / Overall ≥ 88 |

---

## Document control

| Artefact | Path |
| --- | --- |
| This audit | `old-html/qa/VISUAL_UX_BRAND_MATURITY_AUDIT_4H.md` |
| Scorecard | `old-html/qa/VISUAL_UX_BRAND_MATURITY_SCORECARD_4H.json` |
| Prior 3I | `old-html/qa/VISUAL_UX_BRAND_MATURITY_AUDIT_3I.md` |
| Brand plan 4G | `apps/web/reports/BRAND_POLISH_4G.md` |
