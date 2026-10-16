# Healthcare Knowledge Centre, Medical Centre Network & Authority Ecosystem

Implementation baseline: 8 October 2026

## Institutional objective

This layer is designed around **Search → Trust → Service → Doctor → Booking**. It is healthcare authority and patient education, not a blog, news feed or SEO content farm. The approved homepage body, visual identity, hero, services, team architecture and patient-information hub remain structurally intact.

## Public architecture

- `medical-centre-network.html` — Medical Centre Network authority page
- `knowledge/index.html` — Healthcare Knowledge Centre hub
- `knowledge/mental-health.html` — Mental Health
- `knowledge/womens-health.html` — Women's Health
- `knowledge/mens-health.html` — Men's Health
- `knowledge/childrens-health.html` — Children's Health
- `knowledge/preventive-healthcare.html` — Preventive Healthcare
- `knowledge/vaccinations.html` — Vaccinations
- `knowledge/healthy-ageing.html` — Healthy Ageing
- `knowledge/chronic-disease-management.html` — Chronic Disease Management
- `knowledge/skin-health-skin-cancer.html` — Skin Health & Skin Cancer
- `knowledge/telehealth-access-to-care.html` — Telehealth & Access To Care

## Patient guides (29)

### Mental Health

- `When Should I Speak To A GP About Anxiety?` — `knowledge/articles/when-should-i-speak-to-a-gp-about-anxiety.html`
- `Anxiety vs Stress: What Is The Difference?` — `knowledge/articles/anxiety-vs-stress-what-is-the-difference.html`
- `What Happens During A Mental Health Care Plan?` — `knowledge/articles/what-happens-during-a-mental-health-care-plan.html`
- `How Can A GP Support Depression?` — `knowledge/articles/how-can-a-gp-support-depression.html`
- `When Should I Seek Help For Burnout?` — `knowledge/articles/when-should-i-seek-help-for-burnout.html`

### Women's Health

- `Understanding Menopause` — `knowledge/articles/understanding-menopause.html`
- `When Should I Have A Cervical Screening Test?` — `knowledge/articles/when-should-i-have-a-cervical-screening-test.html`
- `Women's Health Checks At Different Stages Of Life` — `knowledge/articles/womens-health-checks-at-different-stages-of-life.html`
- `Understanding Perimenopause` — `knowledge/articles/understanding-perimenopause.html`
- `Preventive Women's Healthcare` — `knowledge/articles/preventive-womens-healthcare.html`

### Men's Health

- `Health Checks Every Man Should Consider` — `knowledge/articles/health-checks-every-man-should-consider.html`
- `Understanding Prostate Health` — `knowledge/articles/understanding-prostate-health.html`
- `Why Preventive Healthcare Matters` — `knowledge/articles/why-preventive-healthcare-matters.html`
- `Heart Health For Men` — `knowledge/articles/heart-health-for-men.html`
- `Healthy Ageing For Men` — `knowledge/articles/healthy-ageing-for-men.html`

### Children's Health

- `Childhood Vaccinations Explained` — `knowledge/articles/childhood-vaccinations-explained.html`
- `When Should I Be Concerned About A Fever?` — `knowledge/articles/when-should-i-be-concerned-about-a-fever.html`
- `Preparing For Your Child's First GP Appointment` — `knowledge/articles/preparing-for-your-childs-first-gp-appointment.html`
- `Common Childhood Illnesses` — `knowledge/articles/common-childhood-illnesses.html`
- `Children's Preventive Healthcare` — `knowledge/articles/childrens-preventive-healthcare.html`

### Preventive Healthcare

- `What Is Preventive Healthcare?` — `knowledge/articles/what-is-preventive-healthcare.html`
- `Health Assessments Explained` — `knowledge/articles/health-assessments-explained.html`
- `Why Regular Check-Ups Matter` — `knowledge/articles/why-regular-check-ups-matter.html`
- `Vaccinations For Adults` — `knowledge/articles/vaccinations-for-adults.html`
- `Staying Healthy As You Age` — `knowledge/articles/staying-healthy-as-you-age.html`

### Skin Health & Skin Cancer

- `Why Skin Checks Matter In Australia` — `knowledge/articles/why-skin-checks-matter-in-australia.html`
- `Understanding Skin Cancer Risks` — `knowledge/articles/understanding-skin-cancer-risks.html`
- `When Should I Book A Skin Check?` — `knowledge/articles/when-should-i-book-a-skin-check.html`
- `Protecting Your Skin From The Queensland Sun` — `knowledge/articles/protecting-your-skin-from-the-queensland-sun.html`

## Article content standard

Every patient guide includes:

1. Introduction
2. Main educational content
3. When should I seek medical advice?
4. How can a GP help?
5. Related Services
6. Related Practitioners
7. Frequently Asked Questions
8. Trusted Australian information
9. Related Knowledge Centre guides
10. Book Appointment CTA

Articles use organisation-level authorship/schema and do not claim a named clinician reviewed content unless such review has actually occurred.

## Internal linking structure

- Primary navigation: Services → Our Team → Patient Information → Healthcare Knowledge Centre → Updates → Contact
- Knowledge Centre article → relevant clinical service
- Article → practitioner profile selected from publicly listed relevant interests/areas of care
- Article → in-site HotDoc Lightbox Book Appointment action
- Article → related Knowledge Centre guides
- Network page → Services, Patient Information, Team and Join Our Team
- Medical Centre Network has contextual inbound links from footer, Join Our Team, Our Story, Patient Information, Contact and Community.

## Yearly editorial calendar

- **January:** Back To School Health Checks — Children's Health
- **February:** Men's Preventive Health — Men's Health
- **March:** Skin Cancer Awareness — Skin Health & Skin Cancer
- **April:** Flu Vaccination Season — Vaccinations
- **May:** Women's Health Awareness — Women's Health
- **June:** Managing Winter Illness — Children's Health / Family Health
- **July:** Mental Health & Stress — Mental Health
- **August:** Healthy Ageing — Healthy Ageing
- **September:** Childhood Vaccinations — Vaccinations / Children's Health
- **October:** Breast Health Awareness — Women's Health
- **November:** Travel Health & Vaccinations — Vaccinations
- **December:** Summer Health & Sun Safety — Skin Health & Skin Cancer

## SEO structure

- Unique page title and meta description
- Canonical URL
- Open Graph and Twitter metadata
- Visible breadcrumbs
- BreadcrumbList structured data
- Article + MedicalWebPage structured data for patient guides
- FAQPage structured data for article FAQs
- MedicalClinic/MedicalOrganization site schema retained
- Natural local references to Woolloongabba and surrounding inner-south communities
- No keyword or suburb stuffing

## CMS / governance support files

- `cms/knowledge-centre-content-architecture.json`
- `cms/knowledge-centre-articles.json`
- `cms/knowledge-centre-internal-linking.json`
- `cms/knowledge-centre-seo-structure.json`
- `cms/editorial-calendar.json`

## QA baseline

- 134 HTML pages total
- 40 Knowledge Centre pages
- 29 patient guides
- 0 broken internal links
- 0 broken internal fragments
- 0 orphan/hidden public content pages
- 0 missing linked local assets
- 0 horizontal overflow in representative 1440px and 390px visual QA
- Homepage `<main>` content hash unchanged from the approved baseline
- Core brand assets preserved byte-for-byte
