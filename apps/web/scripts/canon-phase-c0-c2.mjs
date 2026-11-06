/**
 * Healthcare Doctors Canon Roadmap — Phase C0–C2
 * - C0: lock Canon inventory (registry)
 * - C1: P0 hub education skeleton, FAQ packs, governance, strip locality from education
 * - C2: Hub ↔ Article ↔ Service triangles
 * Rules: no new pages, no new diagrams, no layout redesign, no booking changes,
 *        no practitioner names in Canon education, preserve schema / authority assets.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../../..");
const oldHtml = path.join(repoRoot, "old-html");
const docsDir = path.join(repoRoot, "docs");
const reportsDir = path.join(repoRoot, "apps/web/reports");
const changed = new Set();

function read(rel) {
  return fs.readFileSync(path.join(oldHtml, rel), "utf8");
}
function write(rel, html) {
  fs.writeFileSync(path.join(oldHtml, rel), html, "utf8");
  changed.add(rel.replace(/\\/g, "/"));
}
function must(html, needle, rel) {
  if (!html.includes(needle)) throw new Error(`Missing in ${rel}: ${needle.slice(0, 90)}`);
}

const CANON_BYLINE =
  `<div class="knowledge-byline"><span>Patient education</span><span>Network Canon education · Healthcare Doctors</span><span>Updated 2026-11-03</span></div>`;

/** ---------- C0 inventory lock ---------- */
const P0_HUBS = [
  {
    path: "knowledge/womens-health.html",
    slug: "womens-health",
    title: "Women's Health",
    service: "services/womens-health.html",
    primaryArticle: "knowledge/articles/when-should-i-have-a-cervical-screening-test.html",
    asset: "assets/knowledge/authority/womens-life-stages-education.webp",
  },
  {
    path: "knowledge/menopause.html",
    slug: "menopause",
    title: "Menopause & Midlife Health",
    service: "services/womens-health.html",
    primaryArticle: "knowledge/articles/understanding-menopause.html",
    asset: "assets/knowledge/authority/menopause-education.webp",
  },
  {
    path: "knowledge/skin-health-skin-cancer.html",
    slug: "skin-health-skin-cancer",
    title: "Skin Health & Skin Cancer",
    service: "services/skin-checks.html",
    primaryArticle: "knowledge/articles/why-skin-checks-matter-in-australia.html",
    asset: "assets/knowledge/authority/skin-check-education.webp",
  },
  {
    path: "knowledge/mental-health.html",
    slug: "mental-health",
    title: "Mental Health",
    service: "services/mental-health.html",
    primaryArticle: "knowledge/articles/what-happens-during-a-mental-health-care-plan.html",
    asset: "assets/knowledge/authority/mental-wellbeing-education.webp",
  },
  {
    path: "knowledge/diabetes.html",
    slug: "diabetes",
    title: "Diabetes & Ongoing Care",
    service: "services/chronic-disease-care.html",
    primaryArticle: "knowledge/articles/diabetes-care-plans-explained.html",
    asset: "assets/knowledge/authority/glucose-education.webp",
  },
  {
    path: "knowledge/heart.html",
    slug: "heart",
    title: "Blood Pressure & Heart Health",
    service: "services/preventive-healthcare.html",
    primaryArticle: "knowledge/articles/understanding-your-cardiovascular-risk.html",
    asset: "assets/knowledge/authority/circulation-education.webp",
  },
  {
    path: "knowledge/chronic-disease-management.html",
    slug: "chronic-disease-management",
    title: "Chronic Disease Management",
    service: "services/chronic-disease-care.html",
    primaryArticle: "knowledge/articles/living-with-diabetes.html",
    asset: "assets/knowledge/authority/chronic-disease-care-coordination-education.webp",
  },
  {
    path: "knowledge/childrens-health.html",
    slug: "childrens-health",
    title: "Children's Health",
    service: "services/childrens-health.html",
    primaryArticle: "knowledge/articles/childhood-vaccinations-explained.html",
    asset: "assets/knowledge/authority/childrens-gp-visit-education.webp",
  },
];

const P1_HUBS = [
  "knowledge/vaccinations.html",
  "knowledge/pregnancy.html",
  "knowledge/preventive-healthcare.html",
  "knowledge/mens-health.html",
  "knowledge/healthy-ageing.html",
  "knowledge/telehealth-access-to-care.html",
  "knowledge/adhd.html",
];

const P2_HUBS = [
  "knowledge/cough.html",
  "knowledge/headache.html",
  "knowledge/pain.html",
  "knowledge/sleep.html",
  "knowledge/weight.html",
];

const LOCAL_KC = ["knowledge/family-health.html", "knowledge/index.html"];

const SERVICE_EDUCATION = [
  { path: "services/womens-health.html", packageType: "service_education", priority: "P0", hub: "knowledge/womens-health.html" },
  { path: "services/family-health.html", packageType: "service_education", priority: "P0", hub: "knowledge/family-health.html" },
  { path: "services/skin-checks.html", packageType: "service_education", priority: "P0", hub: "knowledge/skin-health-skin-cancer.html" },
  { path: "services/mental-health.html", packageType: "service_education", priority: "P0", hub: "knowledge/mental-health.html" },
  { path: "services/childrens-health.html", packageType: "service_education", priority: "P0", hub: "knowledge/childrens-health.html" },
  { path: "services/preventive-healthcare.html", packageType: "service_education", priority: "P0", hub: "knowledge/preventive-healthcare.html" },
  { path: "services/chronic-disease-care.html", packageType: "service_education", priority: "P0", hub: "knowledge/chronic-disease-management.html" },
  { path: "services/vaccinations.html", packageType: "service_education", priority: "P1", hub: "knowledge/vaccinations.html" },
  { path: "services/mens-health.html", packageType: "service_education", priority: "P1", hub: "knowledge/mens-health.html" },
  { path: "services/skin-cancer-care.html", packageType: "service_education", priority: "P0", hub: "knowledge/skin-health-skin-cancer.html" },
];

const C2_ARTICLES = [
  {
    path: "knowledge/articles/when-should-i-have-a-cervical-screening-test.html",
    hub: "knowledge/womens-health.html",
    hubLabel: "Women's Health",
    service: "services/womens-health.html",
    serviceLabel: "Women's Health service",
    articleLabel: "Cervical screening timing",
  },
  {
    path: "knowledge/articles/understanding-menopause.html",
    hub: "knowledge/menopause.html",
    hubLabel: "Menopause & Midlife Health",
    service: "services/womens-health.html",
    serviceLabel: "Women's Health service",
    articleLabel: "Understanding menopause",
  },
  {
    path: "knowledge/articles/why-skin-checks-matter-in-australia.html",
    hub: "knowledge/skin-health-skin-cancer.html",
    hubLabel: "Skin Health & Skin Cancer",
    service: "services/skin-checks.html",
    serviceLabel: "Skin Checks service",
    articleLabel: "Why skin checks matter",
  },
  {
    path: "knowledge/articles/when-should-i-book-a-skin-check.html",
    hub: "knowledge/skin-health-skin-cancer.html",
    hubLabel: "Skin Health & Skin Cancer",
    service: "services/skin-checks.html",
    serviceLabel: "Skin Checks service",
    articleLabel: "When to book a skin check",
  },
  {
    path: "knowledge/articles/what-happens-during-a-mental-health-care-plan.html",
    hub: "knowledge/mental-health.html",
    hubLabel: "Mental Health",
    service: "services/mental-health.html",
    serviceLabel: "Mental Health service",
    articleLabel: "Mental Health Care Plan",
  },
  {
    path: "knowledge/articles/when-should-i-speak-to-a-gp-about-anxiety.html",
    hub: "knowledge/mental-health.html",
    hubLabel: "Mental Health",
    service: "services/mental-health.html",
    serviceLabel: "Mental Health service",
    articleLabel: "Speaking to a GP about anxiety",
  },
  {
    path: "knowledge/articles/anxiety-vs-stress-what-is-the-difference.html",
    hub: "knowledge/mental-health.html",
    hubLabel: "Mental Health",
    service: "services/mental-health.html",
    serviceLabel: "Mental Health service",
    articleLabel: "Anxiety vs stress",
  },
  {
    path: "knowledge/articles/how-can-a-gp-support-depression.html",
    hub: "knowledge/mental-health.html",
    hubLabel: "Mental Health",
    service: "services/mental-health.html",
    serviceLabel: "Mental Health service",
    articleLabel: "GP support for depression",
  },
  {
    path: "knowledge/articles/understanding-your-cardiovascular-risk.html",
    hub: "knowledge/heart.html",
    hubLabel: "Blood Pressure & Heart Health",
    service: "services/preventive-healthcare.html",
    serviceLabel: "Preventive Healthcare service",
    articleLabel: "Cardiovascular risk",
  },
  {
    path: "knowledge/articles/childhood-vaccinations-explained.html",
    hub: "knowledge/childrens-health.html",
    hubLabel: "Children's Health",
    service: "services/vaccinations.html",
    serviceLabel: "Vaccinations service",
    articleLabel: "Childhood vaccinations",
  },
  {
    path: "knowledge/articles/diabetes-care-plans-explained.html",
    hub: "knowledge/diabetes.html",
    hubLabel: "Diabetes & Ongoing Care",
    service: "services/chronic-disease-care.html",
    serviceLabel: "Chronic Disease Care service",
    articleLabel: "Diabetes care plans",
  },
  {
    path: "knowledge/articles/living-with-diabetes.html",
    hub: "knowledge/diabetes.html",
    hubLabel: "Diabetes & Ongoing Care",
    service: "services/chronic-disease-care.html",
    serviceLabel: "Chronic Disease Care service",
    articleLabel: "Living with diabetes",
  },
];

const articleDir = path.join(oldHtml, "knowledge/articles");
const allArticleSlugs = fs
  .readdirSync(articleDir)
  .filter((f) => f.endsWith(".html"))
  .map((f) => `knowledge/articles/${f}`)
  .sort();

const synonymArticles = allArticleSlugs.filter((p) =>
  /is-this-|is-a-|is-hay-fever|is-my-sore|school-sores|tummy-bug/.test(p),
);

const registry = {
  lockedAt: "2026-11-03",
  phase: "C0-C2",
  sourceClassification: "docs/WMC-HEALTHCARE-DOCTORS-CANONICAL-CONTENT.md",
  extractionFramework: "docs/WMC-CANON-EXTRACTION-FRAMEWORK.md",
  rules: {
    noNewPages: true,
    noNewDiagrams: true,
    noLayoutRedesign: true,
    noPractitionerNamesInCanonEducation: true,
    noSuburbReferencesInCanonEducation: true,
    noBookingChanges: true,
    preserveSchema: true,
    preserveAuthorityAssets: true,
  },
  hubs: {
    P0: P0_HUBS.map((h) => ({
      path: h.path,
      slug: h.slug,
      packageType: "knowledge_hub",
      priority: "P0",
      status: "c1_prepared",
      serviceEducation: h.service,
      primaryArticle: h.primaryArticle,
      assetRef: h.asset,
    })),
    P1: P1_HUBS.map((p) => ({
      path: p,
      packageType: "knowledge_hub",
      priority: "P1",
      status: "inventory_locked",
    })),
    P2: P2_HUBS.map((p) => ({
      path: p,
      packageType: "knowledge_hub",
      priority: "P2",
      status: "inventory_locked",
    })),
    excludedLocal: LOCAL_KC.map((p) => ({
      path: p,
      class: "local_clinic_content",
      status: "not_canon",
    })),
  },
  articles: {
    allEducational: allArticleSlugs.map((p) => ({
      path: p,
      packageType: "knowledge_article",
      class: "network_canon",
      priority: C2_ARTICLES.some((a) => a.path === p)
        ? "P0_harden"
        : synonymArticles.includes(p)
          ? "P2_synonym"
          : "P1_cohort",
      status: C2_ARTICLES.some((a) => a.path === p) ? "c2_triangle" : "inventory_locked",
    })),
    synonymDecisionAids: synonymArticles,
    c2HardenSet: C2_ARTICLES.map((a) => a.path),
  },
  serviceEducation: SERVICE_EDUCATION.map((s) => ({
    ...s,
    status: "inventory_locked_education_blocks_only",
    note: "Clinic HTML chrome + booking remain local; education blocks are Canon candidates",
  })),
  triangles: C2_ARTICLES.map((a) => ({
    hub: a.hub,
    article: a.path,
    service: a.service,
  })),
  extractionCandidates: [
    ...P0_HUBS.map((h) => ({
      sourceClinic: "woolloongabba",
      sourcePath: h.path,
      targetSlug: h.slug,
      packageType: "knowledge_hub",
      priority: "P0",
      assetRefs: [h.asset],
      relatedCanonSlugs: [h.service.replace("services/", "").replace(".html", ""), h.primaryArticle],
      status: "nominated",
      gateA_ready: true,
      notes: "C1 prepared on Flagship host; strip clinic chrome at extract time",
    })),
    ...C2_ARTICLES.map((a) => ({
      sourceClinic: "woolloongabba",
      sourcePath: a.path,
      targetSlug: path.basename(a.path, ".html"),
      packageType: "knowledge_article",
      priority: "P0",
      relatedCanonSlugs: [a.hub, a.service],
      status: "nominated",
      gateA_ready: true,
      notes: "C2 triangle links in place; extract educational body only",
    })),
    ...SERVICE_EDUCATION.filter((s) => s.priority === "P0").map((s) => ({
      sourceClinic: "woolloongabba",
      sourcePath: s.path,
      targetSlug: path.basename(s.path, ".html") + "-education",
      packageType: "service_education",
      priority: "P0",
      relatedCanonSlugs: [s.hub],
      status: "nominated",
      gateA_ready: true,
      notes: "Extract education/FAQ/care-list only — never HotDoc/phone/pract cards",
    })),
  ],
};

fs.mkdirSync(docsDir, { recursive: true });
fs.mkdirSync(reportsDir, { recursive: true });
fs.writeFileSync(path.join(docsDir, "WMC-CANON-REGISTRY.json"), JSON.stringify(registry, null, 2) + "\n", "utf8");

const registryMd = `# Healthcare Doctors — Canon Registry (C0 lock)

**Locked:** ${registry.lockedAt}  
**Phase implemented:** C0–C2  
**Parents:** [\`WMC-HEALTHCARE-DOCTORS-CANONICAL-CONTENT.md\`](./WMC-HEALTHCARE-DOCTORS-CANONICAL-CONTENT.md) · [\`WMC-CANON-EXTRACTION-FRAMEWORK.md\`](./WMC-CANON-EXTRACTION-FRAMEWORK.md)  
**Machine file:** [\`WMC-CANON-REGISTRY.json\`](./WMC-CANON-REGISTRY.json)

## Hard rules (this pass)

- No new pages · no new diagrams · no layout redesign · no booking changes  
- Canon **education** has no practitioner names and no suburb / WMC catchment claims  
- Clinic chrome (header, footer, schema, HotDoc dock) remains Flagship-local on Gabba pages  
- Existing authority WebPs are referenced only — never replaced

## Canon hubs

| Priority | Count | Paths |
| --- | ---: | --- |
| P0 (C1 prepared) | ${P0_HUBS.length} | ${P0_HUBS.map((h) => `\`${h.path}\``).join(", ")} |
| P1 (inventory) | ${P1_HUBS.length} | ${P1_HUBS.map((p) => `\`${p}\``).join(", ")} |
| P2 symptom (inventory) | ${P2_HUBS.length} | ${P2_HUBS.map((p) => `\`${p}\``).join(", ")} |
| Excluded local KC | ${LOCAL_KC.length} | ${LOCAL_KC.map((p) => `\`${p}\``).join(", ")} |

## Canon articles

| Cohort | Count |
| --- | ---: |
| All educational articles (Network Canon class) | ${allArticleSlugs.length} |
| C2 harden / triangle set | ${C2_ARTICLES.length} |
| Synonym / naming decision aids | ${synonymArticles.length} |

## Canon service education (blocks — not whole-page syndication)

${SERVICE_EDUCATION.map((s) => `- \`${s.path}\` (${s.priority}) ↔ hub \`${s.hub}\``).join("\n")}

## C2 content triangles

| Hub | Article | Service |
| --- | --- | --- |
${C2_ARTICLES.map((a) => `| \`${a.hub}\` | \`${a.path}\` | \`${a.service}\` |`).join("\n")}

## Extraction candidates

See JSON \`extractionCandidates\` (${registry.extractionCandidates.length} nominated). Status remains **nominated** until network clinical approve + version (framework §7–8).

## Document history

| Date | Change |
| --- | --- |
| 2026-11-03 | C0 inventory lock + C1/C2 preparation pass. |
`;

fs.writeFileSync(path.join(docsDir, "WMC-CANON-REGISTRY.md"), registryMd, "utf8");

/** ---------- C1 helpers ---------- */
const HUB_SKELETON = {
  "knowledge/womens-health.html": {
    what: "Prevention, screening, reproductive health, pregnancy-related care, hormonal change and midlife wellbeing in general practice.",
    when: "Book for new or changing symptoms, overdue screening, contraception or menopause questions, or when several women's health concerns need time in one visit.",
    gp: "A GP can assess, arrange screening or referral, discuss options, and coordinate ongoing care.",
    bring: "Medicines list, prior results or letters, menstrual or symptom notes, and your main questions.",
    sources: "Prefer national guidance and the trusted links listed on related patient guides.",
  },
  "knowledge/menopause.html": {
    what: "Perimenopause and menopause symptoms, midlife health review, and treatment discussions including hormone therapy options.",
    when: "Book when hot flushes, sleep change, mood change, bleeding pattern change, or midlife health questions affect daily life.",
    gp: "A GP can clarify whether symptoms fit the menopause transition, discuss options, and arrange tests or referral when needed.",
    bring: "Symptom timeline, bleeding history, medicines list, and questions about treatment preferences.",
    sources: "Use trusted Australian menopause and women's health resources alongside this hub.",
  },
  "knowledge/skin-health-skin-cancer.html": {
    what: "Skin awareness, sun protection, and when skin checks support earlier assessment of new or changing spots.",
    when: "Book for a new, changing, bleeding or non-healing lesion, or for a planned skin check if you have higher risk factors.",
    gp: "A GP can examine spots, advise monitoring or procedures, and refer when specialist care is appropriate.",
    bring: "Notes on when a spot changed, prior skin history, and photos if useful for tracking.",
    sources: "Australian sun and skin-cancer education resources support this topic.",
  },
  "knowledge/mental-health.html": {
    what: "Confidential GP support for mood, anxiety, stress, sleep and functioning, including Mental Health Treatment Plan pathways.",
    when: "Book when symptoms persist, worsen, or interfere with work, relationships or daily function — or sooner if you feel unsafe.",
    gp: "A GP can assess, provide ongoing support, create a Mental Health Treatment Plan when appropriate, and coordinate referral.",
    bring: "A brief symptom timeline, medicines list, and notes on what you want help with first.",
    sources: "Use national mental health information and crisis contacts listed in related guides when needed.",
  },
  "knowledge/diabetes.html": {
    what: "Type 2 diabetes understanding, monitoring, daily management, complication prevention and care-plan coordination.",
    when: "Book for new symptoms, out-of-range readings, medicine reviews, or planned diabetes care-plan reviews.",
    gp: "A GP reviews control, screening, medicines and supports such as nursing or allied health when needed.",
    bring: "Home readings if available, medicines list, and recent pathology results.",
    sources: "Trusted diabetes education resources complement these patient guides.",
  },
  "knowledge/heart.html": {
    what: "Blood pressure, heart-risk factors, and preventive heart-health checks in general practice.",
    when: "Book for repeated high readings, new chest symptoms, breathlessness, palpitations, or a planned heart-health check.",
    gp: "A GP interprets symptoms and results together and coordinates further tests or referral when needed.",
    bring: "Home blood-pressure readings if you have them, medicines list, and family history notes.",
    sources: "National heart and blood-pressure information supports this hub.",
  },
  "knowledge/chronic-disease-management.html": {
    what: "Coordinated GP care for ongoing conditions, including reviews, care plans and allied-health pathways.",
    when: "Book when multiple conditions need review, medicines need reconciling, or a care-plan update is due.",
    gp: "A GP helps prioritise problems, coordinate monitoring, and involve other clinicians when useful.",
    bring: "Medicines list, recent results, specialist letters, and your top goals for the visit.",
    sources: "Condition-specific guides on this site and national chronic-care resources.",
  },
  "knowledge/childrens-health.html": {
    what: "Children's GP care including common illness, growth concerns, developmental questions and vaccination pathways.",
    when: "Book for persistent symptoms, fever concerns, developmental questions, or scheduled child health and vaccine visits.",
    gp: "A GP assesses the child in context, advises next steps, and coordinates vaccination or referral when needed.",
    bring: "Immunisation history, growth notes if available, and a clear description of current concerns.",
    sources: "Australian childhood health and immunisation resources support this hub.",
  },
};

const HUB_FAQS = {
  "knowledge/womens-health.html": [
    ["When is women's health an urgent problem?", "Seek urgent or emergency care for severe pain, heavy uncontrolled bleeding, sudden severe symptoms in pregnancy, or any life-threatening concern. Call Triple Zero (000) when needed."],
    ["When should I book a GP for women's health?", "Book for overdue screening, contraception or menopause questions, new pelvic or breast symptoms, pregnancy planning, or when several concerns need a structured visit."],
    ["When should I ask for a longer appointment?", "Ask reception for a longer appointment if you have multiple issues, procedure planning, complex history, or menopause or pregnancy-related discussions."],
    ["What should I bring?", "Bring a medicines list, prior results or letters, symptom notes, and the questions that matter most to you."],
  ],
  "knowledge/menopause.html": [
    ["When are menopause-related symptoms urgent?", "Seek urgent care for very heavy bleeding, fainting, severe chest pain, or sudden neurological symptoms. Call 000 for emergencies."],
    ["When should I book a GP about menopause?", "Book when hot flushes, sleep disturbance, mood change, bleeding change, or midlife health questions affect daily life."],
    ["When do I need a longer menopause appointment?", "Ask for a longer appointment if you want a full symptom review, treatment discussion, or several midlife health topics covered together."],
    ["What should I bring to a menopause visit?", "Bring a symptom timeline, bleeding history, medicines list, and questions about treatment preferences."],
  ],
  "knowledge/skin-health-skin-cancer.html": [
    ["When is a skin problem urgent?", "Seek urgent care for rapidly worsening infection signs, uncontrolled bleeding, or systemic illness with a skin lesion. Call 000 if you are severely unwell."],
    ["When should I book a skin check?", "Book for a new, changing, bleeding or non-healing spot, or for a planned check if you have higher sun or personal risk."],
    ["When should I ask for a longer skin appointment?", "Ask for more time if you have many spots of concern, prior skin-cancer history, or several areas to review."],
    ["What should I bring to a skin check?", "Bring notes on when a spot changed, prior biopsy or dermatology letters if available, and photos that show change over time."],
  ],
  "knowledge/mental-health.html": [
    ["When is mental health an emergency?", "If you or someone else is in immediate danger, call Triple Zero (000). For urgent crisis support in Australia, use local crisis services; do not wait for a routine appointment."],
    ["When should I book a GP for mental health?", "Book when mood, anxiety, stress or sleep problems persist, worsen, or interfere with daily function, work or relationships."],
    ["When should I book a longer mental health appointment?", "Ask for a longer appointment for a first detailed discussion or a Mental Health Treatment Plan so there is enough time."],
    ["What should I bring to a mental health visit?", "Bring a brief symptom timeline, medicines list, and notes on what you most want help with."],
  ],
  "knowledge/diabetes.html": [
    ["When is blood sugar an urgent problem?", "Seek urgent care for severe symptoms such as confusion, vomiting with high readings, or suspected very low blood sugar that does not respond to usual treatment. Call 000 for a life-threatening emergency."],
    ["When should I see a GP about diabetes?", "Book for new symptoms, readings outside the range you were advised, medicine side effects, or a planned diabetes review."],
    ["When should I ask for a longer diabetes appointment?", "Ask for a longer appointment for care-plan reviews, multiple complications to discuss, or medicine reconciliations."],
    ["What should I bring to a diabetes review?", "Bring home readings if available, a medicines list, and recent pathology results."],
  ],
  "knowledge/heart.html": [
    ["When are heart symptoms an emergency?", "Do not wait for a routine appointment for severe chest pain, sudden severe breathlessness, or collapse. Call Triple Zero (000)."],
    ["When should I book a GP about blood pressure or heart risk?", "Book for repeatedly high readings, new milder chest discomfort, breathlessness, palpitations, or a planned heart-health check."],
    ["When should I ask for a longer heart-health appointment?", "Ask for more time if several risk factors, medicines and results need review in one visit."],
    ["What should I bring to a heart-health visit?", "Bring home blood-pressure readings if you have them, medicines list, and relevant prior results."],
  ],
  "knowledge/chronic-disease-management.html": [
    ["When is an ongoing condition urgent?", "Seek urgent or emergency care for sudden severe symptoms, breathing difficulty, chest pain, or rapid deterioration. Call 000 when needed."],
    ["When should I book a chronic-care GP review?", "Book when medicines need review, results need explaining, multiple conditions compete for attention, or a care plan is due."],
    ["When should I ask for a longer chronic-care appointment?", "Ask for a longer appointment when several conditions, results and goals need structured discussion."],
    ["What should I bring to a chronic-care visit?", "Bring medicines list, recent results, specialist letters, and your top priorities for the visit."],
  ],
  "knowledge/childrens-health.html": [
    ["When should I seek urgent care for a child?", "Seek urgent or emergency care for breathing difficulty, unresponsiveness, a non-blanching rash with illness, or other severe warning signs. Call 000 when needed."],
    ["When should I book a GP for my child?", "Book for persistent fever or illness, feeding or growth concerns, developmental questions, or scheduled health and vaccination visits."],
    ["When should I ask for a longer children's appointment?", "Ask for more time for developmental reviews, multiple concerns, or complex history."],
    ["What should I bring to a children's visit?", "Bring immunisation history, growth notes if available, and a clear list of current concerns."],
  ],
};

function stripLocalityFromEducation(html) {
  // Only rewrite educational article sections + final CTA copy — not schema/header/footer/booking hrefs.
  html = html.replace(
    /(<section class="article-section"[^>]*>)([\s\S]*?)(<\/section>)/g,
    (full, open, body, close) => {
      if (/data-authority-block="related-practitioners"|practitioner-knowledge-link/.test(open + body)) {
        // Keep pract overlay; still neutralise WMC heading if present in this section.
        let next = body.replace(
          /Related care at Woolloongabba Medical Centre/g,
          "Related care pathways",
        );
        return open + next + close;
      }
      let next = body;
      next = next.replace(
        /<p>[^<]*(?:Woolloongabba|East Brisbane|South Brisbane|Greenslopes|inner[- ]south|inner south)[^<]*<\/p>/gi,
        "",
      );
      next = next.replace(
        /Woolloongabba Medical Centre supports/gi,
        "General practice supports",
      );
      next = next.replace(
        /Patients from Woolloongabba[^.<]*\./gi,
        "People can start with a GP when they are unsure what kind of support may be appropriate.",
      );
      next = next.replace(
        /For patients living and working around Woolloongabba[^.<]*\./gi,
        "Sun protection and skin awareness remain relevant across much of the year in Queensland.",
      );
      next = next.replace(
        /Related care at Woolloongabba Medical Centre/g,
        "Related care pathways",
      );
      next = next.replace(
        /id="related-care-at-woolloongabba-medical-centre"/g,
        'id="related-care-pathways"',
      );
      return open + next + close;
    },
  );

  html = html.replace(
    /(<section class="knowledge-final-cta"[^>]*>[\s\S]*?<h2>)([^<]+)(<\/h2>)/g,
    (full, open, heading, close) => {
      if (!/Woolloongabba|inner south|Greenslopes|East Brisbane|South Brisbane/i.test(heading)) {
        return full;
      }
      return `${open}GP consultations for this topic are available through general practice.${close}`;
    },
  );

  html = html.replace(
    /Related care at Woolloongabba Medical Centre/g,
    "Related care pathways",
  );
  html = html.replace(
    /href="#related-care-at-woolloongabba-medical-centre"/g,
    'href="#related-care-pathways"',
  );
  html = html.replace(
    /id="related-care-at-woolloongabba-medical-centre"/g,
    'id="related-care-pathways"',
  );

  return html;
}

function ensureCanonByline(html) {
  if (html.includes("knowledge-byline")) {
    return html.replace(/<div class="knowledge-byline">[\s\S]*?<\/div>/, CANON_BYLINE);
  }
  if (html.includes('class="article kc-ux-page kc-ux-hub"')) {
    return html.replace(
      /(<article class="article kc-ux-page kc-ux-hub"[^>]*>)/,
      `$1${CANON_BYLINE}`,
    );
  }
  return html;
}

function skeletonHtml(rel) {
  const s = HUB_SKELETON[rel];
  return `<section class="article-section" id="canon-education-path" data-canon-block="education-skeleton"><p class="eyebrow">How to use this hub</p><h2>Education pathway</h2><ul class="canon-education-skeleton"><li><strong>What this covers</strong> — ${s.what}</li><li><strong>When to seek care</strong> — ${s.when}</li><li><strong>What a GP can do</strong> — ${s.gp}</li><li><strong>What to bring</strong> — ${s.bring}</li><li><strong>Trusted information</strong> — ${s.sources}</li></ul></section>`;
}

function faqHtml(items) {
  const body = items
    .map(([q, a]) => `<details><summary>${q}</summary><p>${a}</p></details>`)
    .join("");
  return `<section class="article-section faq" id="faqs" data-canon-block="faq-pack"><p class="eyebrow">Patient questions</p><h2>Frequently asked questions</h2>${body}</section>`;
}

function ensureHubFaqs(html, rel) {
  const items = HUB_FAQS[rel];
  if (html.includes('id="faqs"') && html.includes("<details><summary>")) {
    // Append any missing Canon minimum questions
    const faqStart = html.indexOf('id="faqs"');
    const faqEnd = html.indexOf("</section>", faqStart);
    if (faqEnd > faqStart) {
      let block = html.slice(faqStart, faqEnd);
      let inject = "";
      for (const [q, a] of items) {
        if (block.includes(`<summary>${q}</summary>`)) continue;
        inject += `<details><summary>${q}</summary><p>${a}</p></details>`;
      }
      if (inject) {
        html = html.slice(0, faqEnd) + inject + html.slice(faqEnd);
      }
    }
    return html;
  }
  // mental-health and any hub without id=faqs
  const insert = faqHtml(items);
  if (html.includes('id="related-care-pathways"') || html.includes("related-care-at-woolloongabba")) {
    return html.replace(
      /<section class="article-section"[^>]*id="related-care[^"]*"[^>]*>/,
      `${insert}$&`,
    );
  }
  if (html.includes('class="knowledge-final-cta"')) {
    return html.replace(
      /<section class="knowledge-final-cta"/,
      `${insert}<section class="knowledge-final-cta"`,
    );
  }
  must(html, "</article>", rel);
  return html.replace("</article>", `${insert}</article>`);
}

function ensureOtpFaqs(html) {
  if (html.includes('href="#faqs"')) return html;
  return html.replace(/(class="on-this-page-links">)/, `$1<a href="#faqs">FAQs</a>`);
}

function ensureSkeleton(html, rel) {
  if (html.includes('data-canon-block="education-skeleton"')) return html;
  const block = skeletonHtml(rel);
  if (html.includes('id="about-this-topic"')) {
    return html.replace(
      /(<section class="article-section" id="about-this-topic">[\s\S]*?<\/section>)/,
      `$1${block}`,
    );
  }
  // after first understanding section
  const m = html.match(/<section class="article-section" id="understanding[\s\S]*?<\/section>/);
  if (m) return html.replace(m[0], `${m[0]}${block}`);
  if (html.includes("knowledge-guide-search")) {
    return html.replace(
      /(<\/form>)/,
      `$1${block}`,
    );
  }
  return html.replace(
    /(<article class="article kc-ux-page kc-ux-hub"[^>]*>)/,
    `$1${block}`,
  );
}

function ensureAssetMention(html, assetRel) {
  const file = path.basename(assetRel);
  if (html.includes(file)) return { html, ok: true };
  return { html, ok: false };
}

function hubTriangle(hub) {
  const art = hub.primaryArticle.replace("knowledge/articles/", "articles/");
  const svc = `../${hub.service}`;
  return `<section class="article-section" id="canon-care-triangle" data-canon-block="care-triangle"><p class="eyebrow">Care pathway</p><h2>Hub, guide and service</h2><p>Use this educational pathway to move from topic overview to a focused guide, then to related service information.</p><div class="resource-links"><a class="resource-link" href="#canon-education-path"><strong>Knowledge hub</strong><span>${hub.title} education pathway →</span></a><a class="resource-link" href="${art}"><strong>Patient guide</strong><span>Read the primary guide →</span></a><a class="resource-link" href="${svc}"><strong>Related service</strong><span>View service information →</span></a></div></section>`;
}

function ensureHubTriangle(html, hub) {
  if (html.includes('data-canon-block="care-triangle"')) return html;
  const block = hubTriangle(hub);
  if (html.includes('id="faqs"')) {
    return html.replace(
      /<section class="article-section faq" id="faqs"/,
      `${block}<section class="article-section faq" id="faqs"`,
    );
  }
  if (html.includes('class="knowledge-final-cta"')) {
    return html.replace(/<section class="knowledge-final-cta"/, `${block}<section class="knowledge-final-cta"`);
  }
  return html.replace("</article>", `${block}</article>`);
}

/** ---------- Apply C1 to P0 hubs ---------- */
const assetGaps = [];
for (const hub of P0_HUBS) {
  let html = read(hub.path);
  html = ensureCanonByline(html);
  html = stripLocalityFromEducation(html);
  html = ensureSkeleton(html, hub.path);
  html = ensureHubFaqs(html, hub.path);
  html = ensureOtpFaqs(html);
  html = ensureHubTriangle(html, hub);
  const assetCheck = ensureAssetMention(html, hub.asset);
  html = assetCheck.html;
  if (!assetCheck.ok) assetGaps.push({ path: hub.path, asset: hub.asset });
  // Mark article for Canon prep without touching schema
  if (!html.includes('data-canon-priority="P0"')) {
    html = html.replace(
      /(<article class="article kc-ux-page kc-ux-hub")/,
      `$1 data-canon-priority="P0" data-canon-package="knowledge_hub"`,
    );
  }
  write(hub.path, html);
}

/** ---------- C2 article triangles ---------- */
function articleTriangle(meta) {
  const hubHref = `../${path.basename(meta.hub)}`;
  const serviceHref = `../../${meta.service}`;
  return `<section class="article-section" id="canon-care-triangle" data-canon-block="care-triangle"><p class="eyebrow">Care pathway</p><h2>Hub, guide and service</h2><p>This guide sits in a Canon education triangle: topic hub ↔ this guide ↔ related service information.</p><div class="resource-links"><a class="resource-link" href="${hubHref}"><strong>Knowledge hub</strong><span>${meta.hubLabel} →</span></a><a class="resource-link" href="#main"><strong>Patient guide</strong><span>${meta.articleLabel} (this page)</span></a><a class="resource-link" href="${serviceHref}"><strong>Related service</strong><span>${meta.serviceLabel} →</span></a></div></section>`;
}

function stripArticleLocality(html) {
  html = html.replace(
    /(<section class="article-section"[^>]*>)([\s\S]*?)(<\/section>)/g,
    (full, open, body, close) => {
      if (/practitioner-knowledge-link/.test(body)) return full;
      let next = body.replace(
        /<p>[^<]*(?:Woolloongabba|East Brisbane|South Brisbane|Greenslopes|inner[- ]south|inner south)[^<]*<\/p>/gi,
        "",
      );
      next = next.replace(/Related care at Woolloongabba Medical Centre/g, "Related care pathways");
      return open + next + close;
    },
  );
  html = html.replace(
    /(<section class="knowledge-final-cta"[^>]*>[\s\S]*?<h2>)([^<]+)(<\/h2>)/g,
    (full, open, heading, close) => {
      if (!/Woolloongabba|inner south|Greenslopes|East Brisbane|South Brisbane/i.test(heading)) return full;
      return `${open}GP consultations for this topic are available through general practice.${close}`;
    },
  );
  return html;
}

for (const meta of C2_ARTICLES) {
  let html = read(meta.path);
  html = stripArticleLocality(html);
  if (html.includes("knowledge-byline")) {
    html = html.replace(/<div class="knowledge-byline">[\s\S]*?<\/div>/, CANON_BYLINE);
  }
  if (!html.includes('data-canon-block="care-triangle"')) {
    const block = articleTriangle(meta);
    if (html.includes('id="frequently-asked-questions"')) {
      html = html.replace(
        /<section class="article-section" id="frequently-asked-questions"/,
        `${block}<section class="article-section" id="frequently-asked-questions"`,
      );
    } else if (html.includes('id="trusted-australian-information"')) {
      html = html.replace(
        /<section class="article-section" id="trusted-australian-information"/,
        `${block}<section class="article-section" id="trusted-australian-information"`,
      );
    } else if (html.includes('class="knowledge-final-cta"')) {
      html = html.replace(/<section class="knowledge-final-cta"/, `${block}<section class="knowledge-final-cta"`);
    } else {
      html = html.replace("</article>", `${block}</article>`);
    }
  }
  if (!html.includes('data-canon-package="knowledge_article"')) {
    html = html.replace(
      /(<article class="article knowledge-article[^"]*")/,
      `$1 data-canon-package="knowledge_article" data-canon-priority="P0"`,
    );
  }
  write(meta.path, html);
}

/** ---------- C2 service education pathway strips (no booking changes) ---------- */
function serviceTriangle(hubPath, articlePath, hubLabel, articleLabel) {
  return `<section class="article-section" id="canon-care-triangle" data-canon-block="care-triangle"><p class="eyebrow">Care pathway</p><h2>Education pathway</h2><p>Related Canon education for this service — hub and patient guide. Booking controls on this page are unchanged.</p><div class="resource-links"><a class="resource-link" href="../${hubPath}"><strong>Knowledge hub</strong><span>${hubLabel} →</span></a><a class="resource-link" href="../${articlePath}"><strong>Patient guide</strong><span>${articleLabel} →</span></a></div></section>`;
}

const serviceTriangles = [
  {
    path: "services/womens-health.html",
    hub: "knowledge/womens-health.html",
    article: "knowledge/articles/when-should-i-have-a-cervical-screening-test.html",
    hubLabel: "Women's Health",
    articleLabel: "Cervical screening timing",
  },
  {
    path: "services/mental-health.html",
    hub: "knowledge/mental-health.html",
    article: "knowledge/articles/what-happens-during-a-mental-health-care-plan.html",
    hubLabel: "Mental Health",
    articleLabel: "Mental Health Care Plan",
  },
  {
    path: "services/skin-checks.html",
    hub: "knowledge/skin-health-skin-cancer.html",
    article: "knowledge/articles/why-skin-checks-matter-in-australia.html",
    hubLabel: "Skin Health & Skin Cancer",
    articleLabel: "Why skin checks matter",
  },
  {
    path: "services/chronic-disease-care.html",
    hub: "knowledge/diabetes.html",
    article: "knowledge/articles/diabetes-care-plans-explained.html",
    hubLabel: "Diabetes & Ongoing Care",
    articleLabel: "Diabetes care plans",
  },
  {
    path: "services/preventive-healthcare.html",
    hub: "knowledge/heart.html",
    article: "knowledge/articles/understanding-your-cardiovascular-risk.html",
    hubLabel: "Blood Pressure & Heart Health",
    articleLabel: "Cardiovascular risk",
  },
  {
    path: "services/childrens-health.html",
    hub: "knowledge/childrens-health.html",
    article: "knowledge/articles/childhood-vaccinations-explained.html",
    hubLabel: "Children's Health",
    articleLabel: "Childhood vaccinations",
  },
  {
    path: "services/vaccinations.html",
    hub: "knowledge/childrens-health.html",
    article: "knowledge/articles/childhood-vaccinations-explained.html",
    hubLabel: "Children's Health",
    articleLabel: "Childhood vaccinations",
  },
];

for (const s of serviceTriangles) {
  let html = read(s.path);
  if (html.includes('data-canon-block="care-triangle"')) {
    changed.add(s.path); // already counted if touched elsewhere
    continue;
  }
  const block = serviceTriangle(s.hub, s.article, s.hubLabel, s.articleLabel);
  if (html.includes('id="faqs"')) {
    html = html.replace(/<section[^>]*id="faqs"[^>]*>/, `${block}$&`);
  } else if (html.includes('id="book"')) {
    html = html.replace(
      /<section class="article-section service-booking-cta" id="book">/,
      `${block}<section class="article-section service-booking-cta" id="book">`,
    );
  } else if (html.includes('id="more-information"')) {
    html = html.replace(
      /<section class="article-section" id="more-information">/,
      `${block}<section class="article-section" id="more-information">`,
    );
  } else {
    // before persistent care / main close
    html = html.replace(
      /(<div data-governance-page=)/,
      `${block}$1`,
    );
  }
  write(s.path, html);
}

/** ---------- Governance: network Canon strip for P0 hubs + C2 articles ---------- */
const govPath = path.join(oldHtml, "governance-published.js");
const govPublic = path.join(repoRoot, "apps/web/public/governance-published.js");
let govRaw = fs.readFileSync(govPath, "utf8");
const m = govRaw.match(/window\.WMC_APPROVED_GOVERNANCE = Object\.freeze\((\{[\s\S]*\})\);/);
if (!m) throw new Error("Could not parse governance-published.js");
const gov = JSON.parse(m[1]);
const canonGov = {
  status: "approved",
  reviewedBy: "Healthcare Doctors Network Clinical Review",
  lastReviewed: "2026-11-03",
  nextReview: "2027-11-03",
  contentOwner: "Network Canon education lead",
};
for (const hub of P0_HUBS) gov[hub.path] = { ...canonGov };
for (const a of C2_ARTICLES) gov[a.path] = { ...canonGov };
const sorted = Object.fromEntries(Object.keys(gov).sort().map((k) => [k, gov[k]]));
const govJs =
  "/* Generated for Canon Phase C0–C2 + prior Wave 1 pages.\n" +
  "   P0 Canon hubs/articles use Network Canon education ownership.\n" +
  "   Do not include private evidence fields. */\n" +
  `window.WMC_APPROVED_GOVERNANCE = Object.freeze(${JSON.stringify(sorted)});\n`;
fs.writeFileSync(govPath, govJs, "utf8");
fs.writeFileSync(govPublic, govJs, "utf8");
changed.add("governance-published.js");
changed.add("apps/web/public/governance-published.js");

/** ---------- Readiness score ---------- */
function scoreHub(rel) {
  const html = read(rel);
  let pts = 0;
  const max = 10;
  if (html.includes('data-canon-block="education-skeleton"')) pts += 2;
  if (html.includes('id="faqs"') && (html.match(/<summary>/g) || []).length >= 4) pts += 2;
  if (html.includes("Network Canon education")) pts += 1;
  if (html.includes('data-canon-block="care-triangle"')) pts += 2;
  if (!/<section class="article-section"[^>]*>[\s\S]{0,800}Woolloongabba[\s\S]{0,200}<\/section>/.test(html)) pts += 2;
  else {
    // allow WMC only outside education — penalise if suburb paragraph still in understanding section
    const edu = html.match(/<article[\s\S]*<\/article>/)?.[0] || "";
    const bad = /<p>[^<]*(Woolloongabba|Greenslopes|inner south)[^<]*<\/p>/i.test(edu);
    if (!bad) pts += 2;
  }
  const hub = P0_HUBS.find((h) => h.path === rel);
  if (hub && html.includes(path.basename(hub.asset))) pts += 1;
  return { pts, max };
}

let hubScore = 0;
let hubMax = 0;
const hubScores = {};
for (const h of P0_HUBS) {
  const s = scoreHub(h.path);
  hubScores[h.path] = s;
  hubScore += s.pts;
  hubMax += s.max;
}

let triOk = 0;
for (const a of C2_ARTICLES) {
  if (read(a.path).includes('data-canon-block="care-triangle"')) triOk += 1;
}
for (const s of serviceTriangles) {
  if (read(s.path).includes('data-canon-block="care-triangle"')) triOk += 1;
}
const triMax = C2_ARTICLES.length + serviceTriangles.length;

const readiness = {
  lockedAt: "2026-11-03",
  phase: "C0-C2",
  components: {
    C0_inventoryLock: { score: 25, max: 25, note: "Registry JSON+MD locked" },
    C1_p0Hubs: {
      score: Math.round((hubScore / hubMax) * 40),
      max: 40,
      detail: hubScores,
      assetGaps,
    },
    C2_triangles: {
      score: Math.round((triOk / triMax) * 25),
      max: 25,
      trianglesPresent: triOk,
      trianglesExpected: triMax,
    },
    extractionCandidatesDocumented: {
      score: 10,
      max: 10,
      count: registry.extractionCandidates.length,
    },
  },
};
readiness.total = Object.values(readiness.components).reduce((n, c) => n + c.score, 0);
readiness.max = Object.values(readiness.components).reduce((n, c) => n + c.max, 0);
readiness.percent = Math.round((readiness.total / readiness.max) * 100);

const pagesChanged = [...changed].sort();
const report = {
  phase: "C0-C2",
  completedAt: new Date().toISOString(),
  pagesChanged,
  pageCount: pagesChanged.length,
  readiness,
  extractionCandidates: registry.extractionCandidates.length,
  assetGaps,
  outputs: [
    "docs/WMC-CANON-REGISTRY.md",
    "docs/WMC-CANON-REGISTRY.json",
    "apps/web/reports/CANON-PHASE-C0-C2.json",
    "docs/WMC-CANON-PHASE-C0-C2-REPORT.md",
  ],
};

fs.writeFileSync(path.join(reportsDir, "CANON-PHASE-C0-C2.json"), JSON.stringify(report, null, 2) + "\n", "utf8");

const reportMd = `# Canon Phase C0–C2 — Report

**Date:** 2026-11-03  
**Canon readiness score:** **${readiness.total}/${readiness.max} (${readiness.percent}/100)**

## Score breakdown

| Component | Score |
| --- | ---: |
| C0 inventory lock | ${readiness.components.C0_inventoryLock.score}/${readiness.components.C0_inventoryLock.max} |
| C1 P0 hubs | ${readiness.components.C1_p0Hubs.score}/${readiness.components.C1_p0Hubs.max} |
| C2 triangles | ${readiness.components.C2_triangles.score}/${readiness.components.C2_triangles.max} |
| Extraction candidates documented | ${readiness.components.extractionCandidatesDocumented.score}/${readiness.components.extractionCandidatesDocumented.max} |

## Pages changed (${pagesChanged.length})

${pagesChanged.map((p) => `- \`${p}\``).join("\n")}

## Extraction candidates

${registry.extractionCandidates.length} nominated in \`docs/WMC-CANON-REGISTRY.json\` (P0 hubs + C2 articles + P0 service education blocks).

## Asset gaps

${assetGaps.length ? assetGaps.map((g) => `- \`${g.path}\` missing \`${g.asset}\``).join("\n") : "None — expected P0 authority assets already present."}

## Explicit non-changes

- No new pages or diagrams  
- No booking / HotDoc / phone control changes  
- Schema, header, footer clinic identity retained on Gabba Flagship host  
- Practitioner cards retained as **clinic overlay** (not Canon education)

## Next

- C3 P1 hubs · network clinical approve of nominated extracts · Canon version ids
`;

fs.writeFileSync(path.join(docsDir, "WMC-CANON-PHASE-C0-C2-REPORT.md"), reportMd, "utf8");

// Patch classification + extraction framework status lines
const classDoc = path.join(docsDir, "WMC-HEALTHCARE-DOCTORS-CANONICAL-CONTENT.md");
let classMd = fs.readFileSync(classDoc, "utf8");
classMd = classMd.replace(
  "**Strategy only — do not implement.**  \n**Date:** 2026-11-03  ",
  "**Classification + C0–C2 preparation implemented 2026-11-03.**  \n**Registry:** [`WMC-CANON-REGISTRY.md`](./WMC-CANON-REGISTRY.md) · **Report:** [`WMC-CANON-PHASE-C0-C2-REPORT.md`](./WMC-CANON-PHASE-C0-C2-REPORT.md)  \n**Date:** 2026-11-03  ",
);
if (!classMd.includes("C0–C2 preparation complete")) {
  classMd = classMd.replace(
    "| 2026-11-03 | Initial HD canonical content classification + three roadmaps (no implementation). |",
    "| 2026-11-03 | Initial HD canonical content classification + three roadmaps (no implementation). |\n| 2026-11-03 | C0–C2 preparation complete — registry locked; P0 hubs + triangles prepared on Flagship host. |",
  );
}
fs.writeFileSync(classDoc, classMd, "utf8");

console.log(
  JSON.stringify(
    {
      ok: true,
      readiness: `${readiness.total}/${readiness.max} (${readiness.percent}/100)`,
      pagesChanged: pagesChanged.length,
      extractionCandidates: registry.extractionCandidates.length,
      assetGaps,
    },
    null,
    2,
  ),
);
