/**
 * C0 only — generate Healthcare Doctors Canon Registry v1 (docs only).
 * No HTML / page implementation.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const docs = path.join(root, "docs");
const articlesAudit = JSON.parse(
  fs.readFileSync(path.join(root, ".tmp-pdf-convert/canon-c0-articles.json"), "utf8"),
);
const pageAudit = JSON.parse(
  fs.readFileSync(path.join(root, ".tmp-pdf-convert/canon-c0-audit.json"), "utf8"),
);
const hubFaq = Object.fromEntries(pageAudit.hubs.map((h) => [h.rel, h]));
const svcFaq = Object.fromEntries(pageAudit.services.map((s) => [s.rel, s]));

const GOV = {
  owner: "Network Canon education lead",
  clinicalOwner: "Healthcare Doctors Network Clinical Review",
  reviewCycleMonths: 12,
  publicStrip: ["reviewedBy", "contentOwner", "lastReviewed", "nextReview"],
  privateEvidence: "Approver / approval reference / fingerprint — never in public Canon package",
  note: "Approving Canon ≠ clinic publish. Clinic ClinicalReview required on adopt.",
};

const hubDefs = [
  {
    slug: "womens-health",
    priority: "P0",
    title: "Women's Health",
    reason: "Core life-stage education demanded across HD clinics; deepest women's pathways.",
    edu: "Screening, contraception, reproductive and midlife framing for GP care.",
    multi: "Shared clinical narrative; local overlays for practs/booking only.",
    diagram: "womens-life-stages-education.webp",
    relatedHubs: ["menopause", "pregnancy", "preventive-healthcare", "mental-health"],
    services: ["womens-health", "pap-smear-cervical-screening", "pre-pregnancy-care", "antenatal-postnatal-care"],
  },
  {
    slug: "menopause",
    priority: "P0",
    title: "Menopause & Midlife Health",
    reason: "High Flagship exemplar; distinct midlife Canon body.",
    edu: "Symptoms, HRT discussions, midlife preventive framing.",
    multi: "Clinically generalisable Australia-wide; no suburb dependency.",
    diagram: "menopause-education.webp",
    relatedHubs: ["womens-health", "mental-health", "healthy-ageing", "preventive-healthcare"],
    services: ["womens-health", "preventive-healthcare", "mental-health"],
  },
  {
    slug: "skin-health-skin-cancer",
    priority: "P0",
    title: "Skin Health & Skin Cancer",
    reason: "QLD/AU sun risk education with existing authority diagrams.",
    edu: "Skin awareness, checks, sun protection decision support.",
    multi: "High multi-clinic value in sun-exposed regions; education travels intact.",
    diagram: "skin-check-education.webp",
    secondaryDiagrams: ["queensland-sun-education.webp"],
    relatedHubs: ["preventive-healthcare"],
    services: ["skin-checks", "skin-cancer-care", "medical-procedures"],
  },
  {
    slug: "mental-health",
    priority: "P0",
    title: "Mental Health",
    reason: "High patient impact; MHCP journey is network-standard GP education.",
    edu: "When to seek help, MHCP pathway, anxiety/depression framing.",
    multi: "Every HD clinic needs this education; crisis pathways national.",
    diagram: "mental-wellbeing-education.webp",
    secondaryDiagrams: ["mental-health-conversation-education.webp"],
    relatedHubs: ["sleep", "womens-health", "mens-health", "adhd"],
    services: ["mental-health", "telehealth", "family-health"],
  },
  {
    slug: "diabetes",
    priority: "P0",
    title: "Diabetes & Ongoing Care",
    reason: "Chronic condition education with glucose/review assets.",
    edu: "Monitoring, living with diabetes, care-plan concepts.",
    multi: "Universal GP chronic-care education; care delivery local.",
    diagram: "glucose-education.webp",
    secondaryDiagrams: ["diabetes-review-education.webp"],
    relatedHubs: ["chronic-disease-management", "heart", "weight", "preventive-healthcare"],
    services: ["chronic-disease-care", "preventive-healthcare"],
  },
  {
    slug: "heart",
    priority: "P0",
    title: "Blood Pressure & Heart Health",
    reason: "Preventive CV risk education with circulation/BP assets.",
    edu: "BP meaning, CV risk, when urgent vs routine.",
    multi: "National heart-health messaging; ECG/booking remain local.",
    diagram: "circulation-education.webp",
    secondaryDiagrams: ["blood-pressure-numbers-education.webp", "heart-check-education.webp"],
    relatedHubs: ["chronic-disease-management", "diabetes", "preventive-healthcare", "mens-health"],
    services: ["preventive-healthcare", "chronic-disease-care", "ecg"],
  },
  {
    slug: "chronic-disease-management",
    priority: "P0",
    title: "Chronic Disease Management",
    reason: "Coordination hub linking diabetes/heart and care plans.",
    edu: "Care-plan purpose, multi-condition review grammar.",
    multi: "Network standard for ongoing-care education.",
    diagram: "chronic-disease-care-coordination-education.webp",
    relatedHubs: ["diabetes", "heart", "healthy-ageing", "preventive-healthcare"],
    services: ["chronic-disease-care", "preventive-healthcare"],
  },
  {
    slug: "childrens-health",
    priority: "P0",
    title: "Children's Health",
    reason: "Family demand hub; vaccination adjacency; GP-visit asset.",
    edu: "Child illness, first visits, vaccine pathways overview.",
    multi: "Shared parenting/GP education; immunisation schedule national.",
    diagram: "childrens-gp-visit-education.webp",
    relatedHubs: ["vaccinations", "cough", "pregnancy"],
    services: ["childrens-health", "vaccinations", "family-health"],
  },
  {
    slug: "vaccinations",
    priority: "P1",
    title: "Vaccinations",
    reason: "Life-stage vaccine education; asset ready; deepen after P0.",
    edu: "Who needs which vaccines; childhood vs adult framing.",
    multi: "Schedule education is network-shared; stock/booking local.",
    diagram: "vaccination-life-stages-education.webp",
    relatedHubs: ["childrens-health", "preventive-healthcare", "healthy-ageing", "pregnancy"],
    services: ["vaccinations", "childrens-health", "preventive-healthcare"],
  },
  {
    slug: "pregnancy",
    priority: "P1",
    title: "Pregnancy & Antenatal Care",
    reason: "Strong education candidate; shared-care delivery is local.",
    edu: "Planning, antenatal visits, when to seek help.",
    multi: "Clinical education travels; shared-care practs are clinic overlay.",
    diagram: "pregnancy-care-education.webp",
    relatedHubs: ["womens-health", "childrens-health"],
    services: ["antenatal-postnatal-care", "pre-pregnancy-care", "womens-health"],
  },
  {
    slug: "preventive-healthcare",
    priority: "P1",
    title: "Preventive Healthcare",
    reason: "Cross-cutting prevention hub with cycle diagram.",
    edu: "Checks, risk reviews, prevention grammar.",
    multi: "Reusable across clinics as prevention Canon.",
    diagram: "preventive-cycle-education.webp",
    relatedHubs: ["heart", "diabetes", "vaccinations", "healthy-ageing", "mens-health", "womens-health"],
    services: ["preventive-healthcare", "chronic-disease-care"],
  },
  {
    slug: "mens-health",
    priority: "P1",
    title: "Men's Health",
    reason: "Life-stage pair to women's; currently thinner asset coverage.",
    edu: "Checks men often delay; prostate/heart adjacency.",
    multi: "Network education value; procedure pages stay local.",
    diagram: null,
    relatedHubs: ["heart", "preventive-healthcare", "mental-health", "healthy-ageing"],
    services: ["mens-health", "prostate-care", "preventive-healthcare"],
  },
  {
    slug: "healthy-ageing",
    priority: "P1",
    title: "Healthy Ageing",
    reason: "Ageing/prevention education with existing asset.",
    edu: "Falls, vaccines, reviews for older adults.",
    multi: "Shared ageing narrative; local geriatric supports vary.",
    diagram: "healthy-ageing-education.webp",
    relatedHubs: ["preventive-healthcare", "vaccinations", "chronic-disease-management", "mens-health"],
    services: ["preventive-healthcare", "vaccinations", "chronic-disease-care"],
  },
  {
    slug: "telehealth-access-to-care",
    priority: "P1",
    title: "Telehealth & Access To Care",
    reason: "Education on how/when telehealth helps; eligibility is local.",
    edu: "Suitability concepts, vs face-to-face, how visits work.",
    multi: "Education Canon yes; clinic eligibility/rules overlay mandatory.",
    diagram: "telehealth-education.webp",
    relatedHubs: ["mental-health", "cough", "preventive-healthcare"],
    services: ["telehealth"],
  },
  {
    slug: "adhd",
    priority: "P1",
    title: "ADHD & Neurodiversity",
    reason: "Referral-pathway education asset exists; growing demand.",
    edu: "Assessment pathways and GP role framing.",
    multi: "Pathway education shared; waitlists/specialists local.",
    diagram: "adhd-referral-pathway-education.webp",
    relatedHubs: ["mental-health", "childrens-health"],
    services: ["mental-health", "childrens-health"],
  },
  {
    slug: "cough",
    priority: "P2",
    title: "Cough & Sore Throat",
    reason: "Symptom decision aid; urgent vs routine grammar.",
    edu: "When viral vs concerning; when to book.",
    multi: "Reusable symptom Canon; links up to vaccinations/chronic.",
    diagram: null,
    relatedHubs: ["vaccinations", "chronic-disease-management", "telehealth-access-to-care"],
    services: ["telehealth", "family-health"],
  },
  {
    slug: "headache",
    priority: "P2",
    title: "Headache & Migraine",
    reason: "Common decision-support symptom hub.",
    edu: "Migraine vs headache; red flags.",
    multi: "Network symptom education; imaging pathways local.",
    diagram: null,
    relatedHubs: ["pain", "mental-health", "sleep"],
    services: ["family-health", "telehealth"],
  },
  {
    slug: "pain",
    priority: "P2",
    title: "Pain & Musculoskeletal Health",
    reason: "High volume symptom decision aid.",
    edu: "When to seek help; chronic pain framing.",
    multi: "Shared education; allied health/radiology local.",
    diagram: null,
    relatedHubs: ["healthy-ageing", "weight", "chronic-disease-management"],
    services: ["allied-health", "family-health", "radiology"],
  },
  {
    slug: "sleep",
    priority: "P2",
    title: "Sleep & Fatigue",
    reason: "Cross-links mental health and lifestyle Canon.",
    edu: "When fatigue needs GP review.",
    multi: "Education reusable; sleep studies local.",
    diagram: null,
    relatedHubs: ["mental-health", "weight", "healthy-ageing"],
    services: ["mental-health", "preventive-healthcare"],
  },
  {
    slug: "weight",
    priority: "P2",
    title: "Weight & Healthy Lifestyle",
    reason: "Lifestyle decision aid feeding chronic/preventive Canon.",
    edu: "Healthy weight discussions with GP.",
    multi: "Shared education; programs/fees local.",
    diagram: null,
    relatedHubs: ["diabetes", "preventive-healthcare", "heart", "sleep"],
    services: ["preventive-healthcare", "chronic-disease-care"],
  },
];

const notCanonHubs = [
  {
    slug: "family-health",
    priority: "Not Canon",
    title: "Family Health",
    reason: "Thin local aggregator of other hubs — not a strong standalone Canon education body.",
    edu: "Directory-like; rebuild as network template later.",
    multi: "Low as-is; would confuse multi-clinic adopt.",
    diagram: null,
    relatedHubs: ["childrens-health", "womens-health", "mens-health"],
    services: ["family-health"],
    class: "local_clinic_content",
  },
  {
    slug: "index",
    priority: "Not Canon",
    title: "Healthcare Knowledge Centre home",
    reason: "Clinic IA chrome / KC landing — not extractable clinical Canon.",
    edu: "Navigation shell.",
    multi: "Each clinic keeps own KC home.",
    diagram: null,
    relatedHubs: [],
    services: [],
    class: "local_clinic_content",
  },
];

const serviceDefs = [
  {
    slug: "womens-health",
    priority: "P0",
    title: "Women's Health (service education)",
    hub: "womens-health",
    reason: "Flagship service hub; education/FAQ/care-list are Canon candidates.",
    edu: "Life-stage women's care education blocks.",
    multi: "Education adopt + local pract/booking overlay.",
    diagram: "womens-life-stages-education.webp",
  },
  {
    slug: "family-health",
    priority: "P0",
    title: "Family Health (service education)",
    hub: null,
    reason: "Flagship family entry hub; education blocks reusable even if KC family hub is Not Canon.",
    edu: "Family care overview education.",
    multi: "Shared overview; local team graph.",
    diagram: null,
  },
  {
    slug: "skin-checks",
    priority: "P0",
    title: "Skin Checks (service education)",
    hub: "skin-health-skin-cancer",
    reason: "Flagship skin assessment education pairs to KC skin Canon.",
    edu: "What a check covers; when sooner.",
    multi: "High AU multi-clinic value.",
    diagram: "skin-check-education.webp",
  },
  {
    slug: "mental-health",
    priority: "P0",
    title: "Mental Health (service education)",
    hub: "mental-health",
    reason: "Flagship MH service education/MHCP framing.",
    edu: "Service-side pathway education.",
    multi: "Standard GP mental health narrative.",
    diagram: "mental-wellbeing-education.webp",
  },
  {
    slug: "childrens-health",
    priority: "P0",
    title: "Children's Health (service education)",
    hub: "childrens-health",
    reason: "Flagship children's service education.",
    edu: "Child GP visit education.",
    multi: "Shared; vaccines/booking local.",
    diagram: "childrens-gp-visit-education.webp",
  },
  {
    slug: "preventive-healthcare",
    priority: "P0",
    title: "Preventive Healthcare (service education)",
    hub: "preventive-healthcare",
    reason: "Cross-cutting Flagship prevention service education.",
    edu: "Prevention cycle / checks.",
    multi: "Reusable prevention blocks.",
    diagram: "preventive-cycle-education.webp",
  },
  {
    slug: "chronic-disease-care",
    priority: "P0",
    title: "Chronic Disease Care (service education)",
    hub: "chronic-disease-management",
    reason: "Coordination service education for chronic conditions.",
    edu: "Care coordination grammar.",
    multi: "Network chronic-care education.",
    diagram: "chronic-disease-care-coordination-education.webp",
  },
  {
    slug: "skin-cancer-care",
    priority: "P0",
    title: "Skin Cancer Care (service education)",
    hub: "skin-health-skin-cancer",
    reason: "Clinical pair to skin checks; education extractable.",
    edu: "Follow-up / treatment pathway education.",
    multi: "Education shared; procedures local.",
    diagram: "skin-check-education.webp",
  },
  {
    slug: "vaccinations",
    priority: "P1",
    title: "Vaccinations (service education)",
    hub: "vaccinations",
    reason: "Life-stage vaccine service education.",
    edu: "Vaccine education blocks.",
    multi: "Shared; stock/eligibility local.",
    diagram: "vaccination-life-stages-education.webp",
  },
  {
    slug: "mens-health",
    priority: "P1",
    title: "Men's Health (service education)",
    hub: "mens-health",
    reason: "Flagship men's service education to deepen with P1 hubs.",
    edu: "Men's checks education.",
    multi: "Shared education; prostate pathway local nuance.",
    diagram: null,
  },
];

const P0_ARTICLES = new Set([
  "when-should-i-have-a-cervical-screening-test",
  "understanding-menopause",
  "why-skin-checks-matter-in-australia",
  "when-should-i-book-a-skin-check",
  "what-happens-during-a-mental-health-care-plan",
  "when-should-i-speak-to-a-gp-about-anxiety",
  "anxiety-vs-stress-what-is-the-difference",
  "how-can-a-gp-support-depression",
  "understanding-your-cardiovascular-risk",
  "childhood-vaccinations-explained",
  "diabetes-care-plans-explained",
  "living-with-diabetes",
]);

const hubPriority = Object.fromEntries([...hubDefs, ...notCanonHubs].map((h) => [h.slug, h.priority]));

function isSynonym(slug) {
  return /^(is-this-|is-a-|is-hay-fever|is-my-sore)/.test(slug) ||
    /school-sores|tummy-bug|is-this-thrush|is-this-sinus|is-hay-fever|is-a-water|is-a-tummy|is-my-sore/.test(slug);
}

function artPriority(slug, hub) {
  if (P0_ARTICLES.has(slug)) return "P0";
  if (isSynonym(slug)) return "P2";
  if (hub === "telehealth-access-to-care" || /telehealth/.test(slug)) return "P1";
  const hubPri = hubPriority[hub];
  if (hubPri === "P2") return "P2";
  return "P1";
}

function faqCoverage(count) {
  if (count >= 4) return { status: "present", detail: `${count} FAQ items on page (≥4 Canon minimum)` };
  if (count > 0) return { status: "partial", detail: `${count} FAQ items — below Canon minimum of 4` };
  return { status: "missing", detail: "No FAQ details detected" };
}

function hubRecord(def) {
  const rel = `knowledge/${def.slug}.html`;
  const audit = hubFaq[rel] || { faqs: 0, assets: [] };
  const onPageAssets = audit.assets || [];
  return {
    canonicalSlug: def.slug,
    path: rel,
    packageType: "knowledge_hub",
    class: def.class || "network_canon",
    priority: def.priority,
    title: def.title,
    owner: GOV.owner,
    clinicalOwner: GOV.clinicalOwner,
    reviewCycleMonths: GOV.reviewCycleMonths,
    reasonForInclusion: def.reason,
    educationalValue: def.edu,
    multiClinicValue: def.multi,
    governanceRequirements: GOV,
    diagramAsset: def.diagram,
    secondaryDiagramAssets: def.secondaryDiagrams || [],
    existingAuthorityAssetsObserved: onPageAssets,
    existingFaqCoverage: faqCoverage(audit.faqs || 0),
    knowledgeHubRelationships: def.relatedHubs,
    serviceRelationships: def.services,
    status: def.priority === "Not Canon" ? "excluded" : "inventory_locked",
  };
}

function serviceRecord(def) {
  const rel = `services/${def.slug}.html`;
  const audit = svcFaq[rel] || { faqs: 0, assets: [] };
  return {
    canonicalSlug: `${def.slug}-education`,
    path: rel,
    packageType: "service_education",
    class: "network_canon_education_blocks",
    priority: def.priority,
    title: def.title,
    owner: GOV.owner,
    clinicalOwner: GOV.clinicalOwner,
    reviewCycleMonths: GOV.reviewCycleMonths,
    reasonForInclusion: def.reason,
    educationalValue: def.edu,
    multiClinicValue: def.multi,
    governanceRequirements: {
      ...GOV,
      extractRule:
        "Extract education / FAQ / care-list / why-it-matters only — never HotDoc, phone, fees, or practitioner cards",
    },
    diagramAsset: def.diagram,
    existingAuthorityAssetsObserved: audit.assets || [],
    existingFaqCoverage: faqCoverage(audit.faqs || 0),
    knowledgeHubRelationships: def.hub ? [def.hub] : [],
    serviceRelationships: [def.slug],
    status: "inventory_locked",
    note: "Whole HTML page remains clinic-hosted Flagship; Canon candidate is educational layer only",
  };
}

const articleRecords = articlesAudit.map((a) => {
  const priority = artPriority(a.slug, a.hub);
  const syn = isSynonym(a.slug);
  const record = {
    canonicalSlug: a.slug,
    path: `knowledge/articles/${a.slug}.html`,
    packageType: "knowledge_article",
    class: "network_canon",
    priority,
    owner: GOV.owner,
    clinicalOwner: GOV.clinicalOwner,
    reviewCycleMonths: GOV.reviewCycleMonths,
    reasonForInclusion: syn
      ? "Thin naming/decision aid — Canon class but prefer hub FAQ merge later"
      : priority === "P0"
        ? "Flagship deep guide selected for first Canon harden / triangle set"
        : "Educational patient guide suitable for network adopt after locality strip",
    educationalValue: syn
      ? "Naming clarity / quick decision support"
      : "Decision or condition education for GP patients",
    multiClinicValue:
      "Clinic-agnostic clinical education; strip Gabba locality/pract/CTAs at extract",
    governanceRequirements: GOV,
    diagramAsset: (a.assets && a.assets[0]) || null,
    existingAuthorityAssetsObserved: a.assets || [],
    existingFaqCoverage: faqCoverage(a.faqs || 0),
    knowledgeHubRelationships: a.hub ? [a.hub] : [],
    serviceRelationships: a.svcs || [],
    status: "inventory_locked",
    cohort: syn ? "synonym_decision_aid" : priority === "P0" ? "p0_harden" : "educational_cohort",
  };
  if (!record.knowledgeHubRelationships.length) {
    record.reasonForInclusion =
      "Educational article present in golden corpus; parent hub breadcrumb not detected — confirm hub link before extract";
    record.priority = "P1";
    record.cohort = "educational_cohort_unmapped_hub";
  }
  return record;
});

const registry = {
  title: "Healthcare Doctors Canon Registry",
  version: "1.0",
  lockedAt: "2026-11-03",
  phase: "C0",
  scope: "Registry only — no page implementation in this artifact",
  parents: [
    "docs/WMC-HEALTHCARE-DOCTORS-CANONICAL-CONTENT.md",
    "docs/WMC-CANON-EXTRACTION-FRAMEWORK.md",
  ],
  governanceDefaults: GOV,
  counts: {
    knowledgeHubsCanon: hubDefs.length,
    knowledgeHubsNotCanon: notCanonHubs.length,
    flagshipServiceEducation: serviceDefs.length,
    articlesCanon: articleRecords.length,
    articlesByPriority: {
      P0: articleRecords.filter((a) => a.priority === "P0").length,
      P1: articleRecords.filter((a) => a.priority === "P1").length,
      P2: articleRecords.filter((a) => a.priority === "P2").length,
    },
  },
  knowledgeHubs: [...hubDefs.map(hubRecord), ...notCanonHubs.map(hubRecord)],
  flagshipServiceEducation: serviceDefs.map(serviceRecord),
  articles: articleRecords,
};

fs.mkdirSync(docs, { recursive: true });
fs.writeFileSync(path.join(docs, "WMC-CANON-REGISTRY-V1.json"), JSON.stringify(registry, null, 2) + "\n");

const rowHub = (h) =>
  `| \`${h.canonicalSlug}\` | ${h.priority} | ${h.owner} | ${h.reviewCycleMonths} mo | \`${h.diagramAsset || "—"}\` | ${(h.knowledgeHubRelationships || []).map((x) => "`" + x + "`").join(", ") || "—"} | ${(h.serviceRelationships || []).map((x) => "`" + x + "`").join(", ") || "—"} | ${h.existingFaqCoverage.status} (${h.existingFaqCoverage.detail}) |`;

const md = `# Healthcare Doctors Canon Registry v1

**Version:** 1.0  
**Locked:** ${registry.lockedAt}  
**Phase:** C0 — inventory lock only (**no implementation**)  
**Machine file:** [\`WMC-CANON-REGISTRY-V1.json\`](./WMC-CANON-REGISTRY-V1.json)  
**Parents:** [\`WMC-HEALTHCARE-DOCTORS-CANONICAL-CONTENT.md\`](./WMC-HEALTHCARE-DOCTORS-CANONICAL-CONTENT.md) · [\`WMC-CANON-EXTRACTION-FRAMEWORK.md\`](./WMC-CANON-EXTRACTION-FRAMEWORK.md)

This registry is the **authoritative C0 lock** of what may become Network Canon. It does not extract packages, change pages, create diagrams, or alter booking.

---

## Classification model

| Class | Meaning |
| --- | --- |
| **Canon P0** | First extraction / harden priority — high educational + multi-clinic value |
| **Canon P1** | Network Canon after P0 — strong education, deferred deepen |
| **Canon P2** | Symptom / thin decision aids — Canon class, later pack |
| **Not Canon** | Must not syndicate as Network Canon education |

**Package types:** \`knowledge_hub\` · \`knowledge_article\` · \`service_education\` (educational layer only)

### Default governance (all Canon candidates)

| Field | Value |
| --- | --- |
| Owner | ${GOV.owner} |
| Clinical owner | ${GOV.clinicalOwner} |
| Review cycle | ${GOV.reviewCycleMonths} months |
| Public strip | ${GOV.publicStrip.join(", ")} |
| Private evidence | ${GOV.privateEvidence} |

---

## Counts

| Surface | P0 | P1 | P2 | Not Canon |
| --- | ---: | ---: | ---: | ---: |
| Knowledge hubs | ${hubDefs.filter((h) => h.priority === "P0").length} | ${hubDefs.filter((h) => h.priority === "P1").length} | ${hubDefs.filter((h) => h.priority === "P2").length} | ${notCanonHubs.length} |
| Flagship service education | ${serviceDefs.filter((s) => s.priority === "P0").length} | ${serviceDefs.filter((s) => s.priority === "P1").length} | 0 | 0 |
| Articles | ${articleRecords.filter((a) => a.priority === "P0").length} | ${articleRecords.filter((a) => a.priority === "P1").length} | ${articleRecords.filter((a) => a.priority === "P2").length} | 0 |

**Canon-class candidates:** ${hubDefs.length + serviceDefs.length + articleRecords.length} · **Excluded hubs:** ${notCanonHubs.length}

---

## 1. Knowledge hubs

### 1.1 Summary index

| Canonical slug | Priority | Owner | Review cycle | Diagram asset | Related hubs | Related services | FAQ coverage |
| --- | --- | --- | --- | --- | --- | --- | --- |
${registry.knowledgeHubs.map(rowHub).join("\n")}

### 1.2 Full candidate records (hubs)

${registry.knowledgeHubs
  .map((h) => `#### \`${h.canonicalSlug}\` — ${h.title} (${h.priority})

| Field | Value |
| --- | --- |
| Path | \`${h.path}\` |
| Package type | \`${h.packageType}\` |
| Owner | ${h.owner} |
| Clinical owner | ${h.clinicalOwner} |
| Review cycle | ${h.reviewCycleMonths} months |
| Reason for inclusion | ${h.reasonForInclusion} |
| Educational value | ${h.educationalValue} |
| Multi-clinic value | ${h.multiClinicValue} |
| Governance requirements | Network clinical + content owners; public strip fields fail-closed; private evidence never in Canon package; clinic ClinicalReview on adopt |
| Diagram asset (primary) | \`${h.diagramAsset || "none assigned"}\` |
| Secondary diagram assets | ${(h.secondaryDiagramAssets || []).map((x) => "`" + x + "`").join(", ") || "—"} |
| Observed on page now | ${(h.existingAuthorityAssetsObserved || []).map((x) => "`" + x + "`").join(", ") || "none detected"} |
| Existing FAQ coverage | **${h.existingFaqCoverage.status}** — ${h.existingFaqCoverage.detail} |
| Knowledge hub relationships | ${(h.knowledgeHubRelationships || []).map((x) => "`" + x + "`").join(", ") || "—"} |
| Service relationships | ${(h.serviceRelationships || []).map((x) => "`" + x + "`").join(", ") || "—"} |
| Status | \`${h.status}\` |
`)
  .join("\n")}

---

## 2. Flagship service hubs (education layer only)

Whole service HTML stays clinic Flagship. **Canon candidate = education / FAQ / care-list blocks**, not booking or practitioners.

### 2.1 Summary index

| Canonical slug | Priority | Owner | Review cycle | Diagram asset | Knowledge hub | Service | FAQ coverage |
| --- | --- | --- | --- | --- | --- | --- | --- |
${registry.flagshipServiceEducation
  .map(
    (s) =>
      `| \`${s.canonicalSlug}\` | ${s.priority} | ${s.owner} | ${s.reviewCycleMonths} mo | \`${s.diagramAsset || "—"}\` | ${(s.knowledgeHubRelationships || []).map((x) => "`" + x + "`").join(", ") || "—"} | \`${s.serviceRelationships[0]}\` | ${s.existingFaqCoverage.status} |`,
  )
  .join("\n")}

### 2.2 Full candidate records (service education)

${registry.flagshipServiceEducation
  .map((s) => `#### \`${s.canonicalSlug}\` — ${s.title} (${s.priority})

| Field | Value |
| --- | --- |
| Source path | \`${s.path}\` |
| Package type | \`${s.packageType}\` |
| Owner | ${s.owner} |
| Review cycle | ${s.reviewCycleMonths} months |
| Reason for inclusion | ${s.reasonForInclusion} |
| Educational value | ${s.educationalValue} |
| Multi-clinic value | ${s.multiClinicValue} |
| Governance requirements | Extract education only; strip HotDoc/phone/fees/practitioners; network approve version before clinic adopt |
| Diagram asset | \`${s.diagramAsset || "none assigned"}\` |
| Observed on page now | ${(s.existingAuthorityAssetsObserved || []).map((x) => "`" + x + "`").join(", ") || "none detected"} |
| Existing FAQ coverage | **${s.existingFaqCoverage.status}** — ${s.existingFaqCoverage.detail} |
| Knowledge hub relationships | ${(s.knowledgeHubRelationships || []).map((x) => "`" + x + "`").join(", ") || "—"} |
| Service relationships | \`${s.serviceRelationships[0]}\` |
| Status | \`${s.status}\` |
`)
  .join("\n")}

---

## 3. Educational articles (87)

All educational articles in \`knowledge/articles/\` are **Network Canon class**. Priority:

- **P0** — first harden / triangle exemplars  
- **P1** — main educational cohort  
- **P2** — synonym / naming decision aids (prefer hub FAQ merge later)

### 3.1 P0 harden set (full records)

${articleRecords
  .filter((a) => a.priority === "P0")
  .map((a) => `#### \`${a.canonicalSlug}\` (P0)

| Field | Value |
| --- | --- |
| Path | \`${a.path}\` |
| Owner | ${a.owner} |
| Review cycle | ${a.reviewCycleMonths} months |
| Reason for inclusion | ${a.reasonForInclusion} |
| Educational value | ${a.educationalValue} |
| Multi-clinic value | ${a.multiClinicValue} |
| Governance requirements | Strip locality/pract/CTA at extract; network clinical sign-off; version pin |
| Diagram asset | \`${a.diagramAsset || "none on page"}\` |
| Existing FAQ coverage | **${a.existingFaqCoverage.status}** — ${a.existingFaqCoverage.detail} |
| Knowledge hub relationships | ${(a.knowledgeHubRelationships || []).map((x) => "`" + x + "`").join(", ") || "—"} |
| Service relationships | ${(a.serviceRelationships || []).map((x) => "`" + x + "`").join(", ") || "—"} |
`)
  .join("\n")}

### 3.2 All articles — registry index

| Canonical slug | Priority | Cohort | Hub | Services | FAQs | Diagram on page |
| --- | --- | --- | --- | --- | --- | --- |
${articleRecords
  .map(
    (a) =>
      `| \`${a.canonicalSlug}\` | ${a.priority} | ${a.cohort} | ${(a.knowledgeHubRelationships || []).map((x) => "`" + x + "`").join(", ") || "—"} | ${(a.serviceRelationships || []).slice(0, 4).map((x) => "`" + x + "`").join(", ") || "—"} | ${a.existingFaqCoverage.status} | \`${a.diagramAsset || "—"}\` |`,
  )
  .join("\n")}

> Full per-article field objects (reason, educational value, multi-clinic value, governance) are in JSON \`articles[]\`.

---

## 4. Not Canon (locked exclusions)

| Slug | Type | Why excluded |
| --- | --- | --- |
| \`family-health\` (KC hub) | Knowledge hub | Local aggregator — not strong Canon education |
| \`index\` (KC home) | Knowledge hub | Clinic IA chrome |
| Independent providers (\`pathology\`, \`radiology\`, \`pharmacy\`) | Local clinic content | Site-specific — never Canon |
| Fees / new-patients / HotDoc centre URL / named practitioners | Clinic overlay | Never enter Canon body |

---

## 5. Explicit non-goals (C0)

- No HTML edits, no new pages, no new diagrams  
- No CMS extractors, no second-clinic import  
- No booking changes  

---

## Document history

| Date | Change |
| --- | --- |
| 2026-11-03 | **v1.0** C0 inventory lock — hubs, Flagship service education, 87 articles classified with registry fields. |
`;

fs.writeFileSync(path.join(docs, "WMC-CANON-REGISTRY-V1.md"), md);
fs.writeFileSync(
  path.join(docs, "WMC-CANON-REGISTRY.md"),
  `# Healthcare Doctors — Canon Registry

**Current lock:** [\`WMC-CANON-REGISTRY-V1.md\`](./WMC-CANON-REGISTRY-V1.md) · [\`WMC-CANON-REGISTRY-V1.json\`](./WMC-CANON-REGISTRY-V1.json)

C0 authority for inventory is **Registry v1** (registry only — no implementation).
`,
);

// Point Master Brain at v1
const brain = path.join(docs, "WMC-MASTER-BRAIN.md");
let brainMd = fs.readFileSync(brain, "utf8");
if (!brainMd.includes("WMC-CANON-REGISTRY-V1.md")) {
  brainMd = brainMd.replace(
    "| `docs/WMC-CANON-REGISTRY.md` | C0 locked Canon inventory (hubs / articles / service education) |",
    "| `docs/WMC-CANON-REGISTRY-V1.md` | **Canon Registry v1** — C0 inventory lock (hubs / articles / Flagship service education) |\n| `docs/WMC-CANON-REGISTRY.md` | Pointer to current Canon registry lock |",
  );
  fs.writeFileSync(brain, brainMd);
}

console.log(
  JSON.stringify(
    {
      version: registry.version,
      hubs: registry.knowledgeHubs.length,
      services: registry.flagshipServiceEducation.length,
      articles: registry.articles.length,
      articlesByPriority: registry.counts.articlesByPriority,
      outputs: ["docs/WMC-CANON-REGISTRY-V1.md", "docs/WMC-CANON-REGISTRY-V1.json"],
    },
    null,
    2,
  ),
);
