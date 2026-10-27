import fs from "fs";
import path from "path";

const root = "C:/Users/RoshanSamarawickrema/Desktop/WMC-Master-Project/old-html";
const log = [];

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

function write(rel, html) {
  fs.writeFileSync(path.join(root, rel), html);
  log.push("updated " + rel);
}

function resourceLink(href, label, arrow = "→") {
  return `<a class="resource-link" href="${href}"><span>${label}</span><span aria-hidden="true">${arrow}</span></a>`;
}

function relatedSectionStart(html) {
  const markers = [
    'class="article-section patient-related-links"',
    'id="related-information"',
    'id="more-information"',
  ];
  for (const marker of markers) {
    const at = html.indexOf(marker);
    if (at >= 0) return at;
  }
  return -1;
}

function ensureResourceLink(html, href, label, { beforeHref = null, afterHref = null } = {}) {
  const escaped = href.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  if (new RegExp(`class="resource-link"[^>]*href="${escaped}"`).test(html)) {
    return html;
  }
  const link = resourceLink(href, label);
  const sec = relatedSectionStart(html);
  if (sec < 0) throw new Error("No related section for " + href);
  const div = html.indexOf('class="resource-links"', sec);
  const end = html.indexOf("</div>", div);
  const block = html.slice(div, end);

  if (beforeHref) {
    const rel = block.indexOf(`href="${beforeHref}"`);
    if (rel < 0) throw new Error("beforeHref missing in related block: " + beforeHref);
    const abs = div + rel;
    const open = html.lastIndexOf("<a ", abs);
    return html.slice(0, open) + link + html.slice(open);
  }
  if (afterHref) {
    const rel = block.indexOf(`href="${afterHref}"`);
    if (rel < 0) throw new Error("afterHref missing in related block: " + afterHref);
    const abs = div + rel;
    const close = html.indexOf("</a>", abs) + 4;
    return html.slice(0, close) + link + html.slice(close);
  }
  return html.slice(0, end) + link + html.slice(end);
}

function insertIntoPatientGuides(html, links) {
  const idAt = html.indexOf('id="patient-guides"');
  if (idAt < 0) throw new Error("No patient-guides");
  const sectionEnd = html.indexOf("</section>", idAt);
  const section = html.slice(idAt, sectionEnd);
  const div = html.indexOf('class="resource-links"', idAt);
  const afterOpen = html.indexOf(">", div) + 1;
  let insert = "";
  for (const [href, label] of links) {
    if (section.includes(`href="${href}"`)) continue;
    insert += resourceLink(href, label);
  }
  if (!insert) return html;
  return html.slice(0, afterOpen) + insert + html.slice(afterOpen);
}

function ensurePractitionerCard(html, href, name, blurb) {
  if (html.includes(`href="${href}"`)) return html;
  const block = `<a class="practitioner-knowledge-link" href="${href}"><strong>${name}</strong><span>${blurb}</span><em>View practitioner profile →</em></a>`;
  const wrap = html.indexOf('class="practitioner-knowledge-links"');
  if (wrap < 0) throw new Error("No practitioner-knowledge-links in file");
  const afterOpen = html.indexOf(">", wrap) + 1;
  return html.slice(0, afterOpen) + block + html.slice(afterOpen);
}

function ensureWayfinding(html, links) {
  if (html.includes('class="topic-wayfinding"')) {
    // Append any missing anchors inside existing wayfinding
    const start = html.indexOf('class="topic-wayfinding"');
    const shellOpen = html.indexOf("<div class=\"shell\">", start);
    const shellClose = html.indexOf("</div>", shellOpen);
    let inner = html.slice(shellOpen + '<div class="shell">'.length, shellClose);
    for (const [label, href] of links) {
      if (inner.includes(`href="${href}"`)) continue;
      inner += `<a href="${href}">${label}</a>`;
    }
    return html.slice(0, shellOpen + '<div class="shell">'.length) + inner + html.slice(shellClose);
  }
  const anchors = links.map(([label, href]) => `<a href="${href}">${label}</a>`).join("");
  const nav = `<nav class="topic-wayfinding" aria-label="Related topic"><div class="shell">${anchors}</div></nav>`;
  const marker = '<div class="breadcrumb-bar">';
  const at = html.indexOf(marker);
  if (at < 0) throw new Error("No breadcrumb-bar");
  return html.slice(0, at) + nav + html.slice(at);
}

// --- 1. Reciprocal patient/service pairs ---
{
  let html = read("new-patients.html");
  html = ensureResourceLink(html, "patient-forms.html", "Patient Forms", {
    beforeHref: "new-patient-prescribing-policy.html",
  });
  write("new-patients.html", html);
}

{
  let html = read("repeat-scripts.html");
  html = ensureResourceLink(html, "new-patient-prescribing-policy.html", "New Patient Prescribing", {
    beforeHref: "services.html",
  });
  write("repeat-scripts.html", html);
}

{
  let html = read("test-results.html");
  html = ensureResourceLink(html, "services/pathology.html", "Pathology", {
    beforeHref: "services.html",
  });
  write("test-results.html", html);
}

{
  let html = read("services/pathology.html");
  // Add Test Results into Related services resource-links block
  const relatedServicesHeading = "<h3>Related services</h3>";
  const hAt = html.indexOf(relatedServicesHeading);
  if (hAt < 0) throw new Error("pathology related services missing");
  const div = html.indexOf('class="resource-links"', hAt);
  if (!html.includes('href="../test-results.html"')) {
    const afterOpen = html.indexOf(">", div) + 1;
    html =
      html.slice(0, afterOpen) +
      resourceLink("../test-results.html", "Test Results") +
      html.slice(afterOpen);
  }
  write("services/pathology.html", html);
}

{
  let html = read("telehealth.html");
  html = ensureResourceLink(html, "knowledge/articles/when-can-i-use-telehealth.html", "When Can I Use Telehealth?", {
    afterHref: "services/telehealth.html",
  });
  write("telehealth.html", html);
}

{
  let html = read("knowledge/articles/when-can-i-use-telehealth.html");
  if (!html.includes('href="../../telehealth.html"')) {
    const needle = 'href="../../services/telehealth.html"';
    const hrefAt = html.indexOf(needle);
    if (hrefAt < 0) throw new Error("telehealth service link missing on article");
    const close = html.indexOf("</a>", hrefAt) + 4;
    const link = `<a class="resource-link" href="../../telehealth.html"><strong>Telehealth Information</strong><span>View patient information →</span></a>`;
    html = html.slice(0, close) + link + html.slice(close);
  }
  write("knowledge/articles/when-can-i-use-telehealth.html", html);
}

// --- 2. Practitioner → content ---
{
  let html = read("doctors/dr-mary-abadir.html");
  html = insertIntoPatientGuides(html, [
    ["../knowledge/articles/planning-a-pregnancy.html", "Planning A Pregnancy"],
    ["../knowledge/articles/what-happens-during-antenatal-care.html", "What Happens During Antenatal Care?"],
    ["../knowledge/articles/your-first-pregnancy-gp-appointment.html", "Your First Pregnancy GP Appointment"],
    ["../knowledge/pregnancy.html", "Pregnancy &amp; Antenatal Care"],
    ["../services/pre-pregnancy-care.html", "Pre-Pregnancy Care"],
  ]);
  // cervical already present; ensure service link remains in related services (already there)
  write("doctors/dr-mary-abadir.html", html);
}

{
  let html = read("doctors/dr-tanya-goodwill.html");
  html = insertIntoPatientGuides(html, [
    ["../knowledge/articles/when-should-i-book-a-skin-check.html", "When to Book a Skin Check"],
    ["../knowledge/articles/why-skin-checks-matter-in-australia.html", "Why Skin Checks Matter"],
    ["../knowledge/articles/understanding-skin-cancer-risks.html", "Understanding Skin Cancer Risks"],
    ["../knowledge/articles/when-should-i-speak-to-a-gp-about-weight.html", "When Should I Speak To A GP About Weight?"],
    ["../knowledge/articles/healthy-weight-management.html", "Healthy Weight Management"],
    ["../knowledge/articles/understanding-healthy-lifestyle-changes.html", "Understanding Healthy Lifestyle Changes"],
    ["../knowledge/weight.html", "Weight &amp; Healthy Lifestyle"],
  ]);
  write("doctors/dr-tanya-goodwill.html", html);
}

// Pregnancy guides ← Abadir (authority completion for pregnancy content)
for (const file of [
  "knowledge/articles/planning-a-pregnancy.html",
  "knowledge/articles/what-happens-during-antenatal-care.html",
  "knowledge/articles/your-first-pregnancy-gp-appointment.html",
]) {
  let html = read(file);
  html = ensurePractitionerCard(
    html,
    "../../doctors/dr-mary-abadir.html",
    "Dr Mary Abadir",
    "Obstetrician and gynaecologist; pregnancy care, pre-pregnancy assessment and cervical screening"
  );
  write(file, html);
}

// Back pain articles ← Chang and Stafford
for (const file of [
  "knowledge/articles/back-pain-when-should-i-see-a-gp.html",
  "knowledge/articles/understanding-neck-pain.html",
  "knowledge/articles/understanding-muscle-and-joint-pain.html",
]) {
  let html = read(file);
  html = ensurePractitionerCard(
    html,
    "../../doctors/dr-steven-chang.html",
    "Dr Steven Chang",
    "Chiropractor; chiropractic care for musculoskeletal concerns including back and neck pain"
  );
  html = ensurePractitionerCard(
    html,
    "../../doctors/mr-samuel-stafford.html",
    "Mr Samuel Stafford",
    "Physiotherapist; physiotherapy for musculoskeletal concerns including back and neck pain"
  );
  write(file, html);
}

// --- 3. Hub wayfinding ---
const hubs = [
  {
    file: "knowledge/womens-health.html",
    links: [["Need women’s health care?", "../services/womens-health.html"]],
  },
  {
    file: "services/womens-health.html",
    links: [["Read about women’s health.", "../knowledge/womens-health.html"]],
  },
  {
    file: "knowledge/mens-health.html",
    links: [["Need men’s health care?", "../services/mens-health.html"]],
  },
  {
    file: "services/mens-health.html",
    links: [["Read about men’s health.", "../knowledge/mens-health.html"]],
  },
  {
    file: "knowledge/childrens-health.html",
    links: [["Need children’s health care?", "../services/childrens-health.html"]],
  },
  {
    file: "services/childrens-health.html",
    links: [["Read about children’s health.", "../knowledge/childrens-health.html"]],
  },
  {
    file: "knowledge/mental-health.html",
    links: [["Need mental health care?", "../services/mental-health.html"]],
  },
  {
    file: "services/mental-health.html",
    links: [["Read about mental health.", "../knowledge/mental-health.html"]],
  },
  {
    file: "knowledge/pregnancy.html",
    links: [
      ["Need antenatal or postnatal care?", "../services/antenatal-postnatal-care.html"],
      ["Need pre-pregnancy care?", "../services/pre-pregnancy-care.html"],
    ],
  },
  {
    file: "services/antenatal-postnatal-care.html",
    links: [["Read about pregnancy and antenatal care.", "../knowledge/pregnancy.html"]],
  },
  {
    file: "services/pre-pregnancy-care.html",
    links: [["Read about pregnancy and antenatal care.", "../knowledge/pregnancy.html"]],
  },
  {
    file: "services/skin-cancer-care.html",
    links: [
      ["Read about skin health and skin cancer.", "../knowledge/skin-health-skin-cancer.html"],
      ["Want to book a skin check?", "skin-checks.html"],
    ],
  },
  {
    file: "knowledge/skin-health-skin-cancer.html",
    links: [["Need skin cancer care?", "../services/skin-cancer-care.html"]],
  },
];

for (const page of hubs) {
  let html = read(page.file);
  html = ensureWayfinding(html, page.links);
  write(page.file, html);
}

console.log(log.join("\n"));
console.log("TOTAL", log.length);
