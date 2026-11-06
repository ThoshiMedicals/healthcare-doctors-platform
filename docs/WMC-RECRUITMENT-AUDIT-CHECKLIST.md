# WMC Recruitment — Final Conversion Audit Checklist

Use this before an independent ChatGPT / CRO audit. Source of truth: `apps/web/src/recruitment/offer-config.ts` + `apps/web/src/recruitment/contact.ts` + Admin → Careers → Vacancies.

## Offer consistency

Confirm these facts match **everywhere** (Join Our Team, vacancy cards, GP Opportunities honesty/lede, GP FAQ billing answers):

| Fact | Canonical value |
| --- | --- |
| Billings | 70% (70/30), negotiable |
| Hourly guarantee | *(empty — do not claim)* |
| Active patient files | 70,000+ |
| Consult rooms | 11 |
| GPs | 10 |
| Nurses | 3 |
| AGPAL | Yes |
| Location | Woolloongabba, Brisbane |

- [ ] Join Our Team commercial + metrics match the table
- [ ] Featured vacancy bullets match `offerFeaturedHighlights()` (CMS commercial overrides are sanitised)
- [ ] GP FAQ billing / percentage answers match offer config *(re-promote FAQ pack if DB still has older copy)*
- [ ] GP Opportunities honesty line / commercial section match offer config *(re-promote if needed)*
- [ ] No conflicting `$250/hr` or alternate % / guarantee claims on public recruitment surfaces
- [ ] Consistency report reviewed: `docs/WMC-RECRUITMENT-CONSISTENCY-REPORT.md`
- [ ] Credibility sprint report reviewed: `docs/WMC-RECRUITMENT-CREDIBILITY-SPRINT.md`
- [ ] Express Interest is contact → confidentiality → form → submit only
- [ ] Join photography captions match verified WMC assets only
- [ ] Soft mentoring/CPD/philosophy claims replaced with operational facts

## Vacancy management

- [ ] Featured vacancy appears first with elevated navy card + **View Opportunity**
- [ ] Standard cards show title, location, type, badges, summary, CTA
- [ ] Empty state shows **Expressions of Interest Welcome** + **Register Interest**
- [ ] Inactive / closed / expired vacancies do not appear
- [ ] Admin can publish, feature, archive without page redesign

## Contact journey

- [ ] Named contact **Roshan Samarawickrema · Practice Operations** on Join Our Team hero + final CTA
- [ ] Phone / email / request callback present
- [ ] Same contact card injected on GP Opportunities, GP FAQ, Express Interest, Opportunity Pack, Practice Support
- [ ] Sticky bar: Request a Confidential Discussion + Call Roshan Samarawickrema
- [ ] EOI first contact remains name, mobile, email, preferred contact, optional message only

## Conversion readiness (30-second GP test)

An experienced Brisbane VR GP should answer without hunting:

1. Is there a role available? → Current Opportunities / empty EOI path  
2. What is the opportunity? → Differentiator + Why Demand Exists  
3. What are the commercial terms? → Commercial card (70%)  
4. Is there patient demand? → Why Demand Exists (once)  
5. Who do I contact? → Roshan Samarawickrema  
6. Can I enquire confidentially? → Confidential Means Confidential + EOI  

- [ ] Pass on `127.0.0.1:3100/join-our-team.html`
- [ ] Pass on `https://next.gabbamedicalcentre.com.au/join-our-team.html`

## Notes for operators

- Change commercial/scale facts only in `offer-config.ts`, then rebuild UAT.
- Change contact identity only in `contact.ts`.
- Change live roles only in Admin → Careers → Vacancies.
- After editing FAQ / GP Opportunities content modules, re-promote EV packs so DB HTML picks up SSoT copy.
