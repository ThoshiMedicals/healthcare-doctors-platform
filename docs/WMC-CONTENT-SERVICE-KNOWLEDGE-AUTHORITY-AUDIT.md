# Content, Service & Knowledge Authority Audit

Date: 2026-11-06  
Evidence: `docs/WMC-CONTENT-AUTHORITY-AUDIT-EVIDENCE.json` (UAT live HTML + sitemap)  
Constraints: no redesign, no recruitment changes, no new platform features — audit and roadmap only.

## Authority scores (out of 100)

| Dimension | Score | Band |
| --- | --- | --- |
| Service Authority | **81** | Strong major intents; Travel/Sexual missing; some procedural pages thinner |
| Practitioner Authority | **76** | Profiles + service links solid; new GPs thinner; a few care areas without matching services |
| Knowledge Authority | **86** | 87 articles + 22 hubs; sample journeys mostly complete |
| **Overall Content Maturity** | **81** | Ready to outperform a typical WP brochure clinic; not yet “network flagship” depth |

**Verdict:** After SEO preservation, the next growth engine is **filling two missing service intents**, tightening article→doctor links, and deepening thin procedure/men’s/antenatal clusters — not redesigning pages.

---

## Phase 1 — Service inventory

| Layer | Count (sitemap / live) |
| --- | --- |
| Service pages | **29** |
| Knowledge hubs | **22** |
| Knowledge articles | **87** |
| Updates on index | **7** (2 welcome CMS + 5 practice) |

### Practitioner → Service → Knowledge (core map)

| Practitioner | Published care focus | Primary services | Knowledge anchors |
| --- | --- | --- | --- |
| Tanya | Women’s, Mental, Children’s | womens-health, mental-health, childrens-health (+ skin) | women’s / mental / children’s hubs + guides |
| Debra | GP, Shared antenatal | family-health, antenatal-postnatal | pregnancy hub |
| Anand | Child, Women’s, Dermatology | childrens, womens, skin-checks | skin + children’s articles |
| Sumita | Women’s, Mental, GP | womens, mental, family | women’s + mental hubs |
| Golnar | Veterans’, CDM, Diabetes | chronic-disease, family, preventive | diabetes + CDM hubs |
| James | Children’s, Mental, Family | childrens, mental, family | children’s + mental articles |
| Yamesha | Women’s, Adolescent/youth, CDM | womens, family, chronic-disease | women’s + CDM (no youth hub) |

---

## Phase 2 — Missing / thin / underdeveloped services

### Missing (intent without dedicated service page)
| Intent | Current proxy | Recommendation |
| --- | --- | --- |
| Travel Medicine | Vaccinations + travel-vaccinations article + P0 redirect | Dedicated `/services/travel-health.html` (or keep vaccinations as permanent hub with stronger travel module) |
| Sexual Health | Family health + P0 redirect | Dedicated page **or** explicit family-health section — do not leave as silent redirect forever |

### Thin / underdeveloped (live word count ~837–900; fewer knowledge links)
- allied-health, prostate-care, breast-check, implanon, IUD  
Still bookable and doctor-linked, but weaker than flagship service pages (skin 2040w, children’s 1820w, women’s 1719w).

### Strong (flagship)
Family, Women’s, Men’s, Mental, CDM, Skin checks, Vaccinations, Children’s, Preventive — all **strong** depth with doctors + knowledge + booking CTAs.

### Specialty care without service page
- Veterans’ health (Golnar) — no dedicated service  
- Adolescent / youth health (Yamesha) — no dedicated service  

Do **not** invent services; either map to family/CDM/women’s or plan pages in the 90-day roadmap.

---

## Phase 3 — Practitioner expertise audit

| Doctor | Expertise clear? | Service connections | Knowledge connections | Gap |
| --- | --- | --- | --- | --- |
| Tanya | Strong | 10 service links | 21 knowledge links | Meta still generic |
| Debra | OK (2 chips) | 4 | 7 | Thin hero interests vs antenatal strength |
| Anand | Strong | 6 | 10 | — |
| Sumita | OK | 3 | 8 | Fewer outbound services than peers |
| Golnar | Strong for CDM/diabetes | 4 | 4 | Veterans’ unmatched; thinner knowledge set |
| James | Strong | 4 | 5 + welcome | Continue child/mental article links |
| Yamesha | Strong | 4 | 4 | Adolescent unmatched; no welcome article |

---

## Phase 4 — Knowledge hub gaps

### Already covered (strong)
Women’s / menopause / pregnancy · Skin / skin cancer · Mental health · Diabetes / CDM / heart · Children’s · Vaccinations · Preventive · Men’s · Sleep / weight / pain / cough / headache · ADHD · Telehealth · Healthy ageing

### Missing or weak relative to clinic + demand
| Topic | Why it matters | Suggested home |
| --- | --- | --- |
| Travel health guide cluster | High seasonal search; service page missing | Expand vaccinations hub + optional travel service |
| Sexual / reproductive STI care (discreet) | WP had URL equity | Family or new service + 1–2 guides |
| Veterans’ / DVA GP care | Golnar expertise | Knowledge article + CDM/family links |
| Adolescent / youth GP care | Yamesha expertise | Children’s or family hub section + guide |
| Iron infusion patient prep | Service exists, thin educational depth | Article under procedures/women’s |
| Local “how to choose a GP in Woolloongabba” | Local + family intent | Knowledge or Updates (careful — not doorway) |

### Worth expanding
- Men’s health article set (hub exists; fewer than women’s)  
- Skin check → booking journey CTAs on every skin article (mostly present)  
- Diabetes care plans ↔ Golnar profile (ensure reciprocal links)

---

## Phase 5 — Recommended authority clusters

### Women’s Health
Service `womens-health` → Tanya, Sumita, Yamesha, Anand, Debra (antenatal) → hubs `knowledge/womens-health`, menopause, pregnancy + cervical/breast articles → Book / HotDoc

### Skin Checks
Service `skin-checks` (+ skin-cancer-care) → Tanya, Anand, others listed → `knowledge/skin-health-skin-cancer` + when-to-book / risks articles → Book

### Chronic Disease / Diabetes
Service `chronic-disease-care` → Golnar, Yamesha, Tanya → `knowledge/diabetes`, CDM hub, living-with-diabetes articles → Book

### Mental Health
Service `mental-health` → Tanya, Sumita, James → `knowledge/mental-health` + care-plan / anxiety articles → Book

### Family / Local GP
Service `family-health` → James + broad GP roster → family hub + new-patient update → Book

### Vaccinations / Travel (split later)
Service `vaccinations` → listed GPs → vaccinations hub + travel-vaccinations article → Book; **Travel Medicine** cluster incomplete until service decision

---

## Phase 6 — Local content (no doorway pages)

| Suburb | Presence today | Guidance |
| --- | --- | --- |
| Woolloongabba | Strong (H1s, body, schema) | Keep natural |
| South Brisbane, Kangaroo Point, East Brisbane, Dutton Park | Common on major service pages | Keep in catchment paragraphs |
| Highgate Hill | Under-represented | One natural mention on contact + 1–2 hubs only |

**Do not** build `/location/*` doorway clones. Prefer single catchment blocks + contact NAP consistency.

---

## Phase 7 — Booking journey audit (major intents)

| Journey | Knowledge → Service | Service → Doctor | Doctor → Book | Friction |
| --- | --- | --- | --- | --- |
| Women’s Health | PASS | PASS | PASS | Low |
| Skin Checks | PASS | PASS | PASS | Low |
| Mental Health | PASS | PASS | PASS | Low |
| Family Doctor | PASS | PASS | PASS | Low |
| Diabetes / CDM | PASS | PASS (Golnar included) | Golnar phone-only | Medium (intentional) |
| Vaccinations | PASS | PASS | PASS | Low |
| Travel | Partial (article) | Weak (no service) | Via vaccinations | **High** |
| Sexual Health | Weak | Proxy only | Via family | **High** |

Sample of 25 articles: **25/25** link services + booking; **19/25** link a doctor — close the remaining 6 with one relevant GP where clinically appropriate.

---

## Phase 8 — Updates strategy (avoid duplication)

| Type | Belongs in Updates | Belongs in Knowledge | Belongs on Practitioner / Service |
| --- | --- | --- | --- |
| Clinic hours, billing, telehealth ops | Yes | No | Link from patient info |
| New GP welcome | Yes (practitioner news) | No | Profile + service injects |
| Evergreen “what is diabetes / when to book skin check” | No | Yes | Link from service/doctor |
| Seasonal flu campaign | Short Update + point to vaccinations service | Expand only if educational depth needed | Service CTA |
| Clinical how-to / care plans | No | Yes | Service + CDM doctors |

**Rule:** Updates = time-bound practice news. Knowledge = evergreen patient education. Never publish the same long clinical explainer in both.

---

## Phase 9 — 12-month content roadmap

### High priority — 30 days
1. Decide Travel + Sexual Health: dedicated pages vs permanent proxy sections.  
2. Reciprocal links: diabetes articles ↔ Golnar; children’s articles ↔ James; women’s ↔ Yamesha.  
3. Fix remaining article→doctor gaps in top-impression URLs.  
4. One Highgate Hill catchment sentence (contact + family or preventive).  
5. Meta descriptions for Golnar / James / Yamesha from published care highlights only.  
6. Deepen men’s health doctor list if clinically accurate.

### Medium priority — 90 days
1. Veterans’ GP care guide (Golnar).  
2. Adolescent / youth GP guide (Yamesha).  
3. Expand thin procedure pages (IUD, Implanon, iron infusion) with patient-prep articles.  
4. Travel cluster: service page **or** vaccinations “Travel health” module + 2 guides.  
5. Sexual health discreet guide under family/women’s with clear booking path.  
6. Quarterly cluster QA: Women’s, Skin, CDM, Mental, Family.

### Strategic — 12 months
1. Become the Healthcare Doctors network reference for **skin**, **women’s**, **CDM/diabetes**, **children’s**.  
2. Maintain article cadence (1–2/month) tied to services + named GPs — no orphan posts.  
3. Measure cluster completeness via related_services / related_practitioners authority signals.  
4. Optional suburb FAQs inside contact/about — still no doorway farms.  
5. Retire WP-era duplicate topics; one canonical URL per intent.

---

## Phase 10 — Score rationale (summary)

- **Service 81:** 9/11 audited intents strong with doctors + knowledge + book; − for Travel/Sexual missing; − thin procedures.  
- **Practitioner 76:** Clear expertise + outbound links; − new GP depth; − unmatched veterans/adolescent services.  
- **Knowledge 86:** Volume and hubs outperform typical WP GP sites; − incomplete doctor links on ~24% of sampled articles.  
- **Overall 81:** Coherent architecture already supports Knowledge → Service → Doctor → Booking for core commercial intents; closing Travel/Sexual and unmatched expertise topics unlocks “strongest in network” status.

---

## Success criteria check

| Search intent | Knowledge | Service | Practitioner | Booking |
| --- | --- | --- | --- | --- |
| Women’s Health | Yes | Yes | Yes | Yes |
| Skin Checks | Yes | Yes | Yes | Yes |
| Mental Health | Yes | Yes | Yes | Yes |
| Family Doctor | Yes | Yes | Yes | Yes |
| Diabetes Care | Yes | Yes | Yes (Golnar) | Phone/HotDoc peers |
| Vaccinations | Yes | Yes | Yes | Yes |

**Not yet coherent:** Travel Medicine, Sexual Health — proxies only.
