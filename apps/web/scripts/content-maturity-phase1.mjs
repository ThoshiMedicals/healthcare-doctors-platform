/**
 * WMC Content Maturity Phase 1 — CM-01 … CM-06
 * Edits existing old-html pages only. No new pages / diagrams / layout redesign.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../../..");
const oldHtml = path.join(repoRoot, "old-html");
const changed = [];

function read(rel) {
  return fs.readFileSync(path.join(oldHtml, rel), "utf8");
}
function write(rel, html) {
  fs.writeFileSync(path.join(oldHtml, rel), html, "utf8");
  changed.push(rel.replace(/\\/g, "/"));
}
function mustInclude(html, needle, rel) {
  if (!html.includes(needle)) throw new Error(`Anchor missing in ${rel}: ${needle.slice(0, 80)}`);
}

const BYLINE =
  `<div class="knowledge-byline"><span>Patient education</span><span>Clinical education lead · Woolloongabba Medical Centre</span><span>Updated 2026-11-03</span></div>`;

const PRACT = {
  tanya: `<a class="practitioner-knowledge-link" href="../doctors/dr-tanya-goodwill.html"><strong>Dr Tanya Goodwill</strong><span>Women’s health, children’s health, chronic care</span><em>View practitioner profile →</em></a>`,
  wasantha: `<a class="practitioner-knowledge-link" href="../doctors/dr-wasantha-hettiarchchi.html"><strong>Dr Wasantha Hettiarchchi</strong><span>Diabetes management, men’s health, pregnancy care</span><em>View practitioner profile →</em></a>`,
  sumita: `<a class="practitioner-knowledge-link" href="../doctors/dr-sumita-singh.html"><strong>Dr Sumita Singh</strong><span>Women’s health, mental health</span><em>View practitioner profile →</em></a>`,
  anand: `<a class="practitioner-knowledge-link" href="../doctors/dr-anand-singh.html"><strong>Dr Anand Singh</strong><span>General practice, women’s health, skin checks</span><em>View practitioner profile →</em></a>`,
  kooshyar: `<a class="practitioner-knowledge-link" href="../doctors/dr-kooshyar-karimi.html"><strong>Dr Kooshyar Karimi</strong><span>Internal medicine, chronic medical conditions</span><em>View practitioner profile →</em></a>`,
  debra: `<a class="practitioner-knowledge-link" href="../doctors/dr-debra-larkins.html"><strong>Dr Debra Larkins</strong><span>Shared antenatal care, family health</span><em>View practitioner profile →</em></a>`,
};

function practSection(intro, cards, teamExtra = "") {
  return `<section class="article-section service-team-cta service-doctors-can-help authority-related-practitioners" id="related-practitioners"><p class="eyebrow">Our doctors can help</p><h2>Our doctors can help.</h2><p>${intro}</p><div class="practitioner-knowledge-links">${cards.join("")}</div>${teamExtra}<p class="service-inline-action"><a class="text-link" href="../team-general-practitioners.html">View all General Practitioners →</a></p><p class="service-inline-action"><a class="text-link" href="../team.html">Meet Our Team →</a></p></section>`;
}

function faqBlock(items) {
  const body = items
    .map(
      ([q, a]) =>
        `<details><summary>${q}</summary><p>${a}</p></details>`,
    )
    .join("");
  return `<section class="article-section faq" id="faqs"><p class="eyebrow">Patient questions</p><h2>Frequently Asked Questions</h2>${body}</section>`;
}

function hubFaqBlock(items) {
  const body = items
    .map(
      ([q, a]) =>
        `<details><summary>${q}</summary><p>${a}</p></details>`,
    )
    .join("");
  return `<section class="article-section faq" id="faqs"><h2>Frequently asked questions</h2>${body}</section>`;
}

function insertBefore(html, anchor, insert, rel) {
  mustInclude(html, anchor, rel);
  if (html.includes(insert.slice(0, 40))) return html; // idempotent-ish
  return html.replace(anchor, `${insert}${anchor}`);
}

function ensureByline(html, rel) {
  if (html.includes("knowledge-byline")) {
    return html.replace(
      /<div class="knowledge-byline">[\s\S]*?<\/div>/,
      BYLINE,
    );
  }
  // After hero lede / before breadcrumb, or after guide search form
  if (html.includes('class="article knowledge-article') || html.includes("kc-ux-article")) {
    return html.replace(
      /(<article class="article knowledge-article[^"]*"[^>]*>)/,
      `$1${BYLINE}`,
    );
  }
  if (html.includes("kc-ux-hub")) {
    return html.replace(
      /(<article class="article kc-ux-page kc-ux-hub"[^>]*>)/,
      `$1${BYLINE}`,
    );
  }
  // fallback: after page-hero section
  return html.replace(
    /(<\/section>\s*<div class="breadcrumb-bar">)/,
    `</section>${BYLINE}<div class="breadcrumb-bar">`,
  );
}

function addOtpFaqLink(html) {
  if (html.includes('href="#faqs"')) return html;
  return html.replace(
    /(class="on-this-page-links">)/,
    `$1<a href="#faqs">FAQs</a>`,
  );
}

/** ---------- CM-01 governance published registry (Phase1 educational ownership) ---------- */
const phase1GovernancePages = [
  "knowledge/diabetes.html",
  "knowledge/heart.html",
  "knowledge/chronic-disease-management.html",
  "knowledge/childrens-health.html",
  "knowledge/vaccinations.html",
  "knowledge/womens-health.html",
  "knowledge/mental-health.html",
  "knowledge/skin-health-skin-cancer.html",
  "knowledge/menopause.html",
  "knowledge/headache.html",
  "knowledge/pain.html",
  "knowledge/cough.html",
  "knowledge/sleep.html",
  "knowledge/weight.html",
  "services/womens-health.html",
  "services/mental-health.html",
  "services/skin-checks.html",
  "services/pap-smear-cervical-screening.html",
  "services/pre-pregnancy-care.html",
  "services/antenatal-postnatal-care.html",
  "services/telehealth.html",
  "services/iron-infusions.html",
  "services/ear-care-ear-syringing.html",
  "services/wound-dressings.html",
  "services/implanon-insertion-removal.html",
  "services/iud-insertion-removal.html",
];

const governanceEntry = {
  status: "approved",
  reviewedBy: "Woolloongabba Medical Centre Clinical Team",
  lastReviewed: "2026-11-03",
  nextReview: "2027-11-03",
  contentOwner: "Clinical education lead",
};

const bundle = Object.fromEntries(
  phase1GovernancePages.sort().map((p) => [p, { ...governanceEntry }]),
);
const govJs =
  "/* Generated for Content Maturity Phase 1 (CM-01).\n" +
  "   Practice-level educational ownership for listed pages.\n" +
  "   Supersede via CMS ClinicalReview approvals when named clinician reviews are filed.\n" +
  "   Do not include private evidence fields. */\n" +
  `window.WMC_APPROVED_GOVERNANCE = Object.freeze(${JSON.stringify(bundle)});\n`;

fs.writeFileSync(path.join(oldHtml, "governance-published.js"), govJs, "utf8");
fs.writeFileSync(
  path.join(repoRoot, "apps/web/public/governance-published.js"),
  govJs,
  "utf8",
);
changed.push("governance-published.js", "apps/web/public/governance-published.js");

/** ---------- CM-01 bylines on Phase1 knowledge hubs ---------- */
for (const rel of [
  "knowledge/diabetes.html",
  "knowledge/heart.html",
  "knowledge/chronic-disease-management.html",
  "knowledge/childrens-health.html",
  "knowledge/vaccinations.html",
  "knowledge/womens-health.html",
  "knowledge/mental-health.html",
  "knowledge/skin-health-skin-cancer.html",
  "knowledge/menopause.html",
  "knowledge/headache.html",
  "knowledge/pain.html",
  "knowledge/cough.html",
  "knowledge/sleep.html",
  "knowledge/weight.html",
]) {
  let html = read(rel);
  html = ensureByline(html, rel);
  write(rel, html);
}

/** ---------- CM-02 practitioner visibility ---------- */
function injectPractBeforeBook(rel, sectionHtml) {
  let html = read(rel);
  if (html.includes('id="related-practitioners"') && html.includes("practitioner-knowledge-link")) {
    // already has cards — skip unless empty
    const m = html.match(/id="related-practitioners"[\s\S]*?<\/section>/);
    if (m && m[0].includes("practitioner-knowledge-link")) {
      console.log("skip pract (already present)", rel);
      return;
    }
  }
  if (html.includes('id="book"')) {
    html = html.replace(
      /<section class="article-section service-booking-cta" id="book">/,
      `${sectionHtml}<section class="article-section service-booking-cta" id="book">`,
    );
  } else if (html.includes('id="more-information"')) {
    html = insertBefore(
      html,
      `<section class="article-section" id="more-information">`,
      sectionHtml,
      rel,
    );
  } else {
    throw new Error(`No insert point for pract on ${rel}`);
  }
  if (!html.includes('href="#related-practitioners"')) {
    html = html.replace(
      /(class="on-this-page-links">)/,
      `$1<a href="#related-practitioners">Our doctors can help</a>`,
    );
  }
  write(rel, html);
}

injectPractBeforeBook(
  "services/telehealth.html",
  practSection(
    "Telehealth appointments are provided by the practice’s GPs when clinically suitable. Availability varies by practitioner and appointment type. Listing here is not a ranking or guarantee of telehealth availability.",
    [PRACT.tanya, PRACT.sumita, PRACT.anand, PRACT.wasantha],
  ),
);

injectPractBeforeBook(
  "services/iron-infusions.html",
  practSection(
    "Iron infusions are arranged after clinical assessment. These practitioners’ verified interests include chronic care pathways commonly linked to iron deficiency review. Nursing staff may support the infusion when arranged by the practice.",
    [PRACT.tanya, PRACT.wasantha, PRACT.kooshyar],
    `<div class="resource-links"><a class="resource-link" href="../team-nursing.html"><span>Nursing Team</span><span>Practical clinical support for arranged infusions →</span></a></div>`,
  ),
);

injectPractBeforeBook(
  "services/ear-care-ear-syringing.html",
  practSection(
    "Ear care and syringing are arranged through a GP assessment. These profiles are listed because verified interests include general family and procedural primary care. Availability varies.",
    [PRACT.anand, PRACT.tanya, PRACT.debra],
  ),
);

injectPractBeforeBook(
  "services/wound-dressings.html",
  practSection(
    "Wound review is GP-led; nursing support may assist with dressings when arranged by the practice. These practitioners’ verified interests include general and chronic care relevant to wound pathways.",
    [PRACT.tanya, PRACT.wasantha, PRACT.anand],
    `<div class="resource-links"><a class="resource-link" href="../team-nursing.html"><span>Nursing Team</span><span>Dressing support when arranged →</span></a></div>`,
  ),
);

injectPractBeforeBook(
  "services/implanon-insertion-removal.html",
  practSection(
    "Implanon pathways usually need a consultation first. These practitioners’ verified interests include women’s health and family planning. Confirm procedure availability with reception when booking.",
    [PRACT.tanya, PRACT.sumita, PRACT.debra],
  ),
);

injectPractBeforeBook(
  "services/iud-insertion-removal.html",
  practSection(
    "IUD pathways usually need a consultation first. These practitioners’ verified interests include women’s health. Confirm procedure availability with reception when booking.",
    [PRACT.tanya, PRACT.sumita, PRACT.debra],
  ),
);

/** ---------- CM-03 Flagship FAQ polish (append if missing) ---------- */
function appendFaqDetails(rel, details) {
  let html = read(rel);
  const faqEnd = html.indexOf("</section>", html.indexOf('id="faqs"'));
  if (faqEnd < 0) throw new Error(`No faqs section in ${rel}`);
  let inject = "";
  for (const [q, a] of details) {
    if (html.includes(`<summary>${q}</summary>`)) continue;
    inject += `<details><summary>${q}</summary><p>${a}</p></details>`;
  }
  if (!inject) {
    console.log("skip faq (already present)", rel);
    return;
  }
  html = html.slice(0, faqEnd) + inject + html.slice(faqEnd);
  write(rel, html);
}

appendFaqDetails("services/womens-health.html", [
  [
    "When should I book a longer women’s health appointment?",
    "Ask reception for a longer appointment if you have several concerns, need a procedure discussion, pregnancy planning, menopause review, or a complex history. This helps the clinician cover what matters without rushing.",
  ],
  [
    "What should I bring to a women’s health visit?",
    "Bring a medicines list, relevant screening or specialist letters, and notes on symptoms or questions. If you are due for cervical screening or want contraception options discussed, mention this when booking so enough time can be planned.",
  ],
]);

appendFaqDetails("services/skin-checks.html", [
  [
    "How is a skin check different from skin cancer care?",
    "A skin check focuses on assessment of spots or a broader skin review. Skin cancer care covers follow-up when a lesion needs monitoring, a procedure, or referral after assessment. Start with a skin check unless your clinician has already planned a treatment pathway — see also our <a class=\"text-link\" href=\"skin-cancer-care.html\">Skin Cancer Care</a> page.",
  ],
  [
    "When should I book sooner rather than waiting?",
    "Book promptly for a new or changing spot, bleeding or non-healing lesion, or a mole that looks different from others. Queensland’s high UV environment makes timely review important, but urgent or rapidly worsening symptoms may need same-day or emergency care rather than a routine skin-check slot.",
  ],
]);

appendFaqDetails("services/mental-health.html", [
  [
    "Should I book a longer appointment for a Mental Health Treatment Plan?",
    "Often yes. Mental Health Treatment Plans and first detailed discussions usually need more time. Tell reception you want a mental health review or plan discussion so an appropriate appointment length can be offered.",
  ],
  [
    "What is the difference between routine mental health support and a crisis?",
    "Routine GP mental health care helps with assessment, ongoing support, plans and referral. If you or someone else is in immediate danger, call Triple Zero (000). For urgent mental health crisis support in Australia you can also contact local crisis lines; reception can point you to after-hours options when the clinic is closed.",
  ],
]);

/** ---------- CM-04 hub FAQ coverage ---------- */
const hubFaqs = {
  "knowledge/diabetes.html": [
    [
      "When should I see a GP about diabetes or blood sugar concerns?",
      "Book a review for new symptoms such as thirst, frequent urination, unexplained weight change, or if home readings are outside the range your clinician advised. Bring recent results and a medicines list when you attend.",
    ],
    [
      "What happens in a diabetes care plan review?",
      "Your GP reviews control, medicines, complications screening and supports such as nursing or allied health. Plans are individual — see our diabetes guides and <a class=\"text-link\" href=\"../services/chronic-disease-care.html\">Chronic Disease Care</a> service page.",
    ],
    [
      "Is diabetes education a substitute for personal medical advice?",
      "No. These pages explain common concepts only. Your clinician interprets results and treatment for your circumstances.",
    ],
    [
      "When is blood sugar an urgent problem?",
      "Seek urgent care for severe symptoms such as confusion, vomiting with high readings, or suspected very low blood sugar that does not respond to usual treatment. Call 000 for a life-threatening emergency.",
    ],
  ],
  "knowledge/heart.html": [
    [
      "When should I see a GP about blood pressure or heart risk?",
      "Book if readings are repeatedly high, you have new chest discomfort, breathlessness, palpitations, or you need a planned heart health check. Bring home readings if you have them.",
    ],
    [
      "Can a normal ECG rule out every heart problem?",
      "No. An ECG is one test at one point in time. Your GP interprets it with symptoms and history — see also our <a class=\"text-link\" href=\"../services/ecg.html\">ECG</a> service page.",
    ],
    [
      "What should I do for severe chest pain now?",
      "Do not wait for a routine appointment. Call Triple Zero (000) for severe or life-threatening symptoms.",
    ],
    [
      "How are heart checks linked to chronic disease care?",
      "Blood pressure, cholesterol and lifestyle risks are often reviewed within ongoing chronic care. Related service: <a class=\"text-link\" href=\"../services/chronic-disease-care.html\">Chronic Disease Care</a>.",
    ],
  ],
  "knowledge/chronic-disease-management.html": [
    [
      "What is a GP chronic disease care plan?",
      "A care plan helps organise goals, reviews and team supports for long-term conditions. Eligibility and content depend on your clinical situation — discuss with your GP.",
    ],
    [
      "When should I book a longer chronic care appointment?",
      "Ask reception for a longer appointment when several conditions, medicines, or results need review in one visit.",
    ],
    [
      "How do diabetes and heart guides relate to this hub?",
      "Use the diabetes and heart hubs for condition-specific education, then book via <a class=\"text-link\" href=\"../services/chronic-disease-care.html\">Chronic Disease Care</a> when you need practice support.",
    ],
    [
      "When should chronic symptoms be treated as urgent?",
      "Sudden severe symptoms (chest pain, severe breathlessness, collapse, stroke signs) need emergency care — call 000. Do not wait for a routine plan appointment.",
    ],
  ],
  "knowledge/childrens-health.html": [
    [
      "When should I take my child to a GP versus urgent care?",
      "Book a GP review for ongoing concerns, rashes, mild fever with otherwise well appearance, or developmental questions. Seek urgent/emergency care for severe breathing difficulty, unresponsiveness, stiff neck with fever, or rapidly worsening illness — call 000 if life-threatening.",
    ],
    [
      "How do I prepare for my child’s first GP visit?",
      "Bring the child’s health record, immunisation history, medicines and a brief symptom timeline. See our patient guide on preparing for a first visit.",
    ],
    [
      "Can I request a longer appointment for several child health issues?",
      "Yes — tell reception if you need developmental, behavioural, or multi-issue discussion so enough time can be allocated.",
    ],
    [
      "Where do childhood vaccinations fit?",
      "Vaccination schedules are covered in our vaccinations hub and children’s guides. Book via <a class=\"text-link\" href=\"../services/childrens-health.html\">Children’s Health</a> or <a class=\"text-link\" href=\"../services/vaccinations.html\">Vaccinations</a>.",
    ],
  ],
  "knowledge/vaccinations.html": [
    [
      "How do childhood and adult vaccinations differ on this site?",
      "Childhood schedules follow the national immunisation program; adult vaccines (flu, travel, catch-up) depend on age, health conditions and travel plans. Ask reception which appointment type you need.",
    ],
    [
      "Who should consider influenza vaccination?",
      "Many adults and children benefit; some groups are higher priority. Confirm eligibility and timing with your GP — see our influenza vaccination guide.",
    ],
    [
      "Do I need a travel vaccine appointment before overseas travel?",
      "Often yes, and ideally weeks before departure. Book early and bring your itinerary and vaccine history.",
    ],
    [
      "Can vaccines be given in a standard GP appointment?",
      "Sometimes. Tell reception you need vaccination so cold-chain and nurse/GP sequencing can be planned.",
    ],
  ],
};

for (const [rel, items] of Object.entries(hubFaqs)) {
  let html = read(rel);
  if (html.includes('id="faqs"')) {
    const faqSectionEnd = html.indexOf("</section>", html.indexOf('id="faqs"'));
    let inject = "";
    for (const [q, a] of items) {
      if (!html.includes(`<summary>${q}</summary>`)) {
        inject += `<details><summary>${q}</summary><p>${a}</p></details>`;
      }
    }
    if (inject) {
      html = html.slice(0, faqSectionEnd) + inject + html.slice(faqSectionEnd);
      html = addOtpFaqLink(html);
      write(rel, html);
    } else console.log("skip hub faq", rel);
    continue;
  }
  const block = hubFaqBlock(items);
  const related = html.match(/<section[^>]*id="related-care"[^>]*>/);
  const relatedLocal = html.match(
    /<section[^>]*id="related-care-at-woolloongabba-medical-centre"[^>]*>/,
  );
  const finalCta = html.match(/<section class="knowledge-final-cta"/);
  if (related) {
    html = html.replace(related[0], `${block}${related[0]}`);
  } else if (relatedLocal) {
    html = html.replace(relatedLocal[0], `${block}${relatedLocal[0]}`);
  } else if (finalCta) {
    html = html.replace(finalCta[0], `${block}${finalCta[0]}`);
  } else {
    throw new Error(`No FAQ insert point for ${rel}`);
  }
  html = addOtpFaqLink(html);
  write(rel, html);
}

/** ---------- CM-05 women's cluster: light why/next + FAQ harden ---------- */
function ensureFocusedWhyNext(rel, whyHtml, nextHtml) {
  let html = read(rel);
  if (!html.includes('id="why-it-matters"')) {
    html = html.replace(
      /(<section class="article-section" id="overview">[\s\S]*?<\/section>)/,
      `$1<section class="article-section service-why-it-matters" id="why-it-matters">${whyHtml}</section>`,
    );
    if (!html.includes('href="#why-it-matters"')) {
      html = html.replace(
        /(class="on-this-page-links">)/,
        `$1<a href="#why-it-matters">Why it matters</a>`,
      );
    }
  }
  if (!html.includes('id="next-steps"')) {
    // insert before planning or book-and-prepare follow-up
    if (html.includes('id="book-and-prepare"')) {
      html = html.replace(
        /(<section class="article-section" id="book-and-prepare">)/,
        `<section class="article-section" id="next-steps">${nextHtml}</section>$1`,
      );
    } else if (html.includes('id="follow-up"')) {
      html = html.replace(
        /(<section class="article-section" id="follow-up">)/,
        `<section class="article-section" id="next-steps">${nextHtml}</section>$1`,
      );
    }
    if (!html.includes('href="#next-steps"')) {
      html = html.replace(
        /(class="on-this-page-links">)/,
        `$1<a href="#next-steps">Next steps</a>`,
      );
    }
  }
  write(rel, html);
}

ensureFocusedWhyNext(
  "services/pap-smear-cervical-screening.html",
  `<p class="eyebrow">Why does it matter?</p><h2>Screening finds risk before cancer develops.</h2><p>Cervical screening looks for HPV and related changes so follow-up can happen early. Keeping screening up to date — and not ignoring abnormal bleeding — supports safer women’s health care across life stages. See also our <a class="text-link" href="womens-health.html">Women’s Health</a> hub.</p>`,
  `<p class="eyebrow">What should I do next?</p><h2>Confirm whether you are due, then book.</h2><ul class="service-care-list"><li>Book a GP appointment for routine screening or questions about self-collection.</li><li>Tell reception about symptoms (bleeding, pain, discharge) so the visit is not treated as routine-only.</li><li>Read the cervical screening patient guide if you want more education before you attend.</li><li>Return to the <a class="text-link" href="womens-health.html">Women’s Health</a> hub for related pathways such as contraception or menopause.</li></ul>`,
);

ensureFocusedWhyNext(
  "services/pre-pregnancy-care.html",
  `<p class="eyebrow">Why does it matter?</p><h2>Planning before pregnancy can reduce avoidable risks.</h2><p>A pre-pregnancy review can cover medicines, vaccinations, chronic conditions and lifestyle factors that affect pregnancy health. It connects to our <a class="text-link" href="womens-health.html">Women’s Health</a> and antenatal pathways when you are ready for the next step.</p>`,
  `<p class="eyebrow">What should I do next?</p><h2>Start with a planning appointment.</h2><ul class="service-care-list"><li>Book a GP visit and mention pregnancy planning so enough time is allowed.</li><li>Bring a medicines list and relevant specialist letters.</li><li>When pregnancy is confirmed, continue via <a class="text-link" href="antenatal-postnatal-care.html">Antenatal &amp; Postnatal Care</a>.</li></ul>`,
);

ensureFocusedWhyNext(
  "services/antenatal-postnatal-care.html",
  `<p class="eyebrow">Why does it matter?</p><h2>Shared antenatal care keeps pregnancy review close to home.</h2><p>Regular antenatal and postnatal reviews help monitor mother and baby wellbeing and coordinate with hospital teams when needed. This pathway sits within our <a class="text-link" href="womens-health.html">Women’s Health</a> hub.</p>`,
  `<p class="eyebrow">What should I do next?</p><h2>Book shared care or postnatal review with reception.</h2><ul class="service-care-list"><li>Tell reception you need antenatal or postnatal care so the right clinician and appointment length can be offered.</li><li>Bring your pregnancy record and hospital correspondence when available.</li><li>For planning before pregnancy, see <a class="text-link" href="pre-pregnancy-care.html">Pre-Pregnancy Care</a>.</li></ul>`,
);

appendFaqDetails("services/pap-smear-cervical-screening.html", [
  [
    "How does this page relate to the Women’s Health hub?",
    "This page explains the cervical screening pathway in detail. The <a class=\"text-link\" href=\"womens-health.html\">Women’s Health</a> hub connects screening with contraception, pregnancy and menopause pathways so you can choose the next step that matches your needs.",
  ],
]);

/** ---------- CM-06 urgent-review packs on symptom hubs ---------- */
const symptomFaqs = {
  "knowledge/headache.html": [
    [
      "When is a headache an emergency?",
      "Seek emergency care (call 000) for sudden severe (“worst ever”) headache, headache with stroke signs, seizure, confusion, head injury with worsening symptoms, or headache with fever and stiff neck. See our emergency headache guide for more detail.",
    ],
    [
      "When should I see a GP about headaches?",
      "Book a GP review for headaches that are new, frequent, worsening, or limiting work or sleep — or if over-the-counter care is not enough. Bring a brief symptom diary if you can.",
    ],
    [
      "How do migraine and ordinary headache differ?",
      "Migraine often has distinctive features (for example sensitivity to light/sound, nausea, or disability). Our migraine vs headache guide explains common differences; your GP confirms what applies to you.",
    ],
    [
      "What related care is available at the practice?",
      "Start with a GP appointment via <a class=\"text-link\" href=\"../services/family-health.html\">Family Health</a>. Persistent patterns may also relate to sleep, mental health or chronic care hubs.",
    ],
  ],
  "knowledge/pain.html": [
    [
      "When should pain be treated as urgent?",
      "Seek urgent/emergency care for chest pain, signs of stroke, severe abdominal pain with vomiting, pain after major injury, or loss of bladder/bowel control with back pain. Call 000 if life-threatening.",
    ],
    [
      "When should I see a GP about ongoing pain?",
      "Book if pain lasts beyond a short self-care period, keeps returning, or affects sleep, work or mood. Note what makes it better or worse.",
    ],
    [
      "Can a GP help with muscle and joint pain?",
      "Yes. GPs assess common musculoskeletal pain, discuss simple care, medicines when appropriate, and referral. See our muscle and joint pain guide.",
    ],
    [
      "What practice services relate to pain care?",
      "Most reviews start in <a class=\"text-link\" href=\"../services/family-health.html\">Family Health</a>. Chronic patterns may link to <a class=\"text-link\" href=\"../services/chronic-disease-care.html\">Chronic Disease Care</a> or mental health support when relevant.",
    ],
  ],
  "knowledge/cough.html": [
    [
      "When should a cough need urgent care?",
      "Seek urgent help for severe breathing difficulty, chest pain, coughing blood, blue lips, or confusion — call 000 if life-threatening. Infants with breathing distress need urgent assessment.",
    ],
    [
      "When should I see a GP about a cough?",
      "Book if a cough lasts beyond a couple of weeks, keeps returning, or comes with fever, wheeze, or reduced exercise tolerance. Bring a symptom timeline.",
    ],
    [
      "Could this be more than a simple viral cough?",
      "Sometimes. Persistent cough has several causes. Our persistent cough guides explain common patterns; a GP decides what checks are needed.",
    ],
    [
      "What related care can help?",
      "Book via <a class=\"text-link\" href=\"../services/family-health.html\">Family Health</a>. Breathing tests or nebulising are arranged only when clinically appropriate — see related procedure pages from Medical Procedures.",
    ],
  ],
  "knowledge/sleep.html": [
    [
      "When are sleep problems urgent?",
      "Seek urgent care for severe breathlessness at night, chest pain, or symptoms of a medical emergency. Call 000 if life-threatening. Sudden severe psychiatric distress also needs urgent pathways, not a routine sleep chat alone.",
    ],
    [
      "When should I see a GP about sleep or fatigue?",
      "Book if poor sleep or tiredness persists, affects daytime function, or you snore with pauses in breathing. Bring a short sleep and medicines history.",
    ],
    [
      "Can tiredness have medical causes?",
      "Yes — including sleep disorders, mood, anaemia, thyroid and other issues. Education pages explain possibilities; only your clinician diagnoses.",
    ],
    [
      "What related care is available?",
      "Start with <a class=\"text-link\" href=\"../services/family-health.html\">Family Health</a>. Mental health and chronic disease hubs may also be relevant depending on your situation.",
    ],
  ],
  "knowledge/weight.html": [
    [
      "When should weight or appetite changes be reviewed urgently?",
      "Seek prompt care for rapid unintentional weight loss, inability to keep fluids down, or severe restriction/bingeing with medical instability. Call 000 for a life-threatening emergency.",
    ],
    [
      "When should I speak to a GP about weight?",
      "Book when you want structured support, medicines review, or assessment of risks related to weight. Ask for a longer appointment if several issues need discussion.",
    ],
    [
      "Is weight care only about diet advice?",
      "No. GPs consider medical contributors, mental health, medicines and realistic goals. See our weight patient guides for general education.",
    ],
    [
      "What related services can help?",
      "Book via <a class=\"text-link\" href=\"../services/family-health.html\">Family Health</a> or discuss chronic care supports through <a class=\"text-link\" href=\"../services/chronic-disease-care.html\">Chronic Disease Care</a> when appropriate.",
    ],
  ],
};

for (const [rel, items] of Object.entries(symptomFaqs)) {
  let html = read(rel);
  if (html.includes('id="faqs"')) {
    const end = html.indexOf("</section>", html.indexOf('id="faqs"'));
    let inject = "";
    for (const [q, a] of items) {
      if (!html.includes(`<summary>${q}</summary>`)) {
        inject += `<details><summary>${q}</summary><p>${a}</p></details>`;
      }
    }
    if (inject) {
      html = html.slice(0, end) + inject + html.slice(end);
      html = addOtpFaqLink(html);
      write(rel, html);
    }
    continue;
  }
  const block = hubFaqBlock(items);
  if (html.includes('id="patient-guides"')) {
    // after patient guides section
    html = html.replace(
      /(<section class="article-section" id="patient-guides">[\s\S]*?<\/section>)/,
      `$1${block}`,
    );
  } else if (html.includes('id="related-care-at-woolloongabba-medical-centre"')) {
    html = html.replace(
      /<section[^>]*id="related-care-at-woolloongabba-medical-centre"[^>]*>/,
      (m) => `${block}${m}`,
    );
  } else {
    html = html.replace(
      /<section class="knowledge-final-cta"/,
      `${block}<section class="knowledge-final-cta"`,
    );
  }
  html = addOtpFaqLink(html);
  write(rel, html);
}

/** ---------- telehealth FAQs (CM-02 adjacent booking clarity; still CM-01–06 scope via weak service) ---------- */
appendFaqDetails("services/telehealth.html", [
  [
    "How do I know if telehealth is suitable before I book?",
    "Telehealth suits selected follow-ups, results and medication discussions when a physical examination is not required. If you need procedures, new unexplained chest/abdominal pain, or a full examination, book face-to-face or call reception for advice.",
  ],
  [
    "Who provides telehealth at this clinic?",
    "Telehealth is delivered by the practice’s GPs when they offer remote appointments. Check practitioner availability in HotDoc or ask reception — see the doctors listed on this page and <a class=\"text-link\" href=\"../team.html\">Meet Our Team</a>.",
  ],
]);

appendFaqDetails("services/iron-infusions.html", [
  [
    "Who assesses me and who gives the infusion?",
    "A GP assesses whether an infusion is appropriate and reviews results. When arranged, nursing staff may support the practical infusion steps. Confirm the sequence with reception when booking.",
  ],
]);

// Write report stub data
const reportPath = path.join(repoRoot, "docs/WMC-CONTENT-MATURITY-PHASE1-REPORT.md");
const uniqueChanged = [...new Set(changed)].sort();
fs.writeFileSync(
  path.join(repoRoot, "apps/web/reports/CONTENT_MATURITY_PHASE1_CHANGED.json"),
  JSON.stringify({ changed: uniqueChanged, count: uniqueChanged.length }, null, 2),
  "utf8",
);

console.log("Phase1 complete. Files touched:", uniqueChanged.length);
uniqueChanged.forEach((f) => console.log(" -", f));
