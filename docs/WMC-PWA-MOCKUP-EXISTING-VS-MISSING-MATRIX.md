# WMC — Existing vs missing feature matrix (mockup concepts)

Baseline: Hostinger staging **`f6bba5c`**; C1 lab tip **`1a12bf9`**; Journey branch builds on C1 without mutating C1 lab routes.

| Concept | Existing source of truth | Gap | Action this cycle |
| --- | --- | --- | --- |
| Patient Hub dashboard | `patient-hub-mobile-dashboard.ts`, `public-ux.ts` | None for layout | Preserve |
| Preferred GP | `patient-preferred-gp.js`, `wmc.preferredGp.v1` | Discovery shortcut only | Add Care Hub link to `#preferred-gp-panel` |
| Practitioner directory | `team.html` + Preferred GP picker | Mockup polish only | Link `team.html`; no portrait invent |
| Digital Reception | `digital-reception.ts` + dock | None | Preserve |
| HotDoc booking | Lightbox / HotDoc SoT (B0) | No alternate book | Preserve |
| PWA install | B1 QR + cooldown + hub install card | Closed | Preserve |
| Phase C0 architecture | `docs/WMC-PHASE-C0-*.md` | Implementation not authorised | Keep notifications in C phases |
| Phase C1 Engagement UI | `engagement-c1/*`, `/dev/…`, `/admin/engagement-lab/…` | Dummy only | Do not disrupt |
| CMS / Trust Facts patient content | `docs/WMC-TRUST-FACTS-REGISTER.md`, seeded pages | Discovery from hub weak | Care Hub deep-links |
| Notification prefs / categories | C1 demo + C0 design | Live categories DB | C1+ only |
| Announcement / Updates feed | C1 demo | Live CMS/campaign feed | C5/D |
| Care Hub shortcuts | 4 primary tiles only | More approved destinations | **Code: Care strip** |
| Visit prep checklist | Absent | Non-clinical prep | **Code: checklist** |
| New-patient guidance | `new-patients.html` | Hub discovery | Care strip link |
| Bulk-billing | TF-BILL pages | Hub discovery | Care strip link |
| Visit / after-hours | Existing pages | Hub discovery | Care strip link |
| Telehealth prep | `telehealth.html` | Hub discovery + tips | Care strip + checklist |
| Health education | `knowledge/index.html` | Already a tile | Keep; no fake articles |
| HotDoc routine requests | Unverified | Capability unknown | Plan only |
| Household GP | Deferred roadmap | Privacy | Plan only |
| Open-now indicator | Hours in profile/footer | Unverified clock logic | Plan only |
| Clinical results | N/A | Unsafe | Reject |

**Verdict:** Useful concepts map to (a) already shipped hub/DR/GP/HotDoc/PWA, (b) C0–E notifications, or (c) Journey code-only discovery + non-clinical prep. No duplication of completed features.
