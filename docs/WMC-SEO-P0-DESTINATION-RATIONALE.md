# SEO P0 destination rationale (2026-11-06)

Intent: preserve WordPress equity with single-hop 301s. No homepage dumps.

| Live path | Destination | Rationale |
| --- | --- | --- |
| `/doctor/dr-golnar-mortezaei-gp-fracgp/` | `/doctors/dr-golnar-mortezaei.html` | Same practitioner; folder `doctor` → `doctors`. |
| `/doctor/dr-james-general-practitioner/` | `/doctors/dr-james.html` | Same practitioner (James Chanaka CMS slug). |
| `/bulk-billing-doctors-woolloongabba/` | `/bulk-billing.html` | Exact billing intent; approved review promote. |
| `/family-doctors-woolloongabba/` | `/services/family-health.html` | Family GP care service page. |
| `/skin-cancer-clinic-doctors-brisbane/` | `/services/skin-checks.html` | Skin check / clinic intent. |
| `/your-complete-guide-to-a-skin-check-at-gabba-medical-centre/` | `/knowledge/articles/when-should-i-book-a-skin-check.html` | Guide → knowledge article. |
| `/free-flu-vaccine-woolloongabba-2026/` | `/services/vaccinations.html` | Flu / vaccine offer → vaccinations service. |
| `/diabetes-doctor-woolloongabba/` | `/services/chronic-disease-care.html` | “Diabetes doctor / GP support” → chronic disease GP service (not homepage). |
| `/local-gp-woolloongabba/` | `/team-general-practitioners.html` | Local GP finder → GP directory. |
| `/find-the-best-doctor-near-me-in-brisbane/` | `/team-general-practitioners.html` | Doctor near me → GP directory. |
| `/services/sexual-health-doctors/` | `/services/family-health.html` | Confidential sexual health GP care; no dedicated page; family health is non-gendered care landing. |
| `/services/travel-health-doctors/` | `/services/vaccinations.html` | Travel health / vaccines → vaccinations. |

Config surfaces kept in sync: `apps/web/src/seo/wordpress-legacy-redirects.ts` (middleware), `deployment/nginx/redirects.conf`, `deployment/migration/cloudflare-bulk-redirects.csv`, `redirect-import.csv`, `redirect-map.csv`.
