import fs from "fs";
import path from "path";

const ROOT = "C:/Users/RoshanSamarawickrema/Desktop/WMC-Master-Project/old-html";
const WEB_PUBLIC = "C:/Users/RoshanSamarawickrema/Desktop/WMC-Master-Project/apps/web/public";
const WEB_SRC = "C:/Users/RoshanSamarawickrema/Desktop/WMC-Master-Project/apps/web/src";

const NEW_PAGES = [
  {
    file: "identifying-hotdoc-scam-messages.html",
    label: "HotDoc Message Safety",
    shard: "appointments",
    keywords: [
      "hotdoc",
      "scam",
      "phishing",
      "sms",
      "email",
      "htd.io",
      "message safety",
      "appointment reminder",
      "consent",
      "legitimate message",
    ],
  },
  {
    file: "recalls-and-reminders.html",
    label: "Recalls & Reminders",
    shard: "appointments",
    keywords: [
      "recall",
      "reminder",
      "follow up",
      "test results",
      "correspondence",
      "preventive care",
      "hotdoc",
      "contact details",
    ],
  },
  {
    file: "assignment-of-benefit.html",
    label: "Assignment of Benefit",
    shard: "billing",
    keywords: [
      "assignment of benefit",
      "aob",
      "bulk billing consent",
      "medicare consent",
      "hotdoc",
      "bulk bill",
      "medicare claim",
    ],
  },
];

function buildNav(activeHref, nested = false) {
  const items = [
    ["patient-information.html", "Patient Information"],
    ["book-appointment.html", "Booking &amp; HotDoc"],
    ["identifying-hotdoc-scam-messages.html", "HotDoc Message Safety"],
    ["new-patients.html", "New Patients"],
    ["new-patient-prescribing-policy.html", "New Patient Prescribing"],
    ["fees-billing.html", "Fees &amp; Billing"],
    ["bulk-billing.html", "Bulk Billing"],
    ["assignment-of-benefit.html", "Assignment of Benefit"],
    ["medicare.html", "Medicare"],
    ["medicare-exclusions.html", "Medicare Exclusions"],
    ["test-results.html", "Test Results"],
    ["recalls-and-reminders.html", "Recalls &amp; Reminders"],
    ["repeat-scripts.html", "Repeat Scripts"],
    ["telehealth.html", "Telehealth"],
    ["referrals.html", "Referrals"],
    ["patient-forms.html", "Patient Forms"],
    ["practice-information.html", "Practice Information"],
    ["patient-code-of-conduct.html", "Patient Code of Conduct"],
    ["faqs.html", "FAQs"],
    ["after-hours-care.html", "After Hours Care"],
  ];
  const links = items
    .map(([href, label]) => {
      const full = nested ? `../${href}` : href;
      if (href === activeHref) {
        return `<a aria-current="page" class="active" href="${full}">${label}</a>`;
      }
      return `<a href="${full}">${label}</a>`;
    })
    .join("");
  return `<aside aria-label="Patient information" class="page-nav" id="related-pages"><div class="nav-title">Patient Information</div>${links}</aside>`;
}

const NAV_RE =
  /<aside aria-label="Patient information" class="page-nav" id="related-pages">[\s\S]*?<\/aside>/g;

function walkHtml(dir, fn) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) {
      if (["node_modules", ".git", "qa", "cms", "assets", "search-index"].includes(name)) continue;
      walkHtml(p, fn);
    } else if (name.endsWith(".html")) {
      fn(p);
    }
  }
}

let navUpdated = 0;
walkHtml(ROOT, (p) => {
  let html = fs.readFileSync(p, "utf8");
  if (!html.includes('aria-label="Patient information" class="page-nav"')) return;
  const nested = html.includes('href="../patient-information.html"');
  const file = path.basename(p);
  // Doctor pages reuse patient nav but should not mark a patient page active
  const isDoctor = p.replace(/\\/g, "/").includes("/doctors/");
  const active = isDoctor ? null : file;
  const next = html.replace(NAV_RE, buildNav(active, nested));
  if (next !== html) {
    fs.writeFileSync(p, next);
    navUpdated++;
  }
});
console.log("nav updated", navUpdated);

// Hub information-list links
const hubPath = path.join(ROOT, "patient-information.html");
let hub = fs.readFileSync(hubPath, "utf8");
const inserts = [
  ['book-appointment.html', "Booking &amp; HotDoc", "identifying-hotdoc-scam-messages.html", "HotDoc Message Safety"],
  ['bulk-billing.html', "Bulk Billing", "assignment-of-benefit.html", "Assignment of Benefit"],
  ['test-results.html', "Test Results", "recalls-and-reminders.html", "Recalls &amp; Reminders"],
];
for (const [afterHref, , newHref, newLabel] of inserts) {
  if (hub.includes(`href="${newHref}"`)) continue;
  const needle = `<a href="${afterHref}"><span>`;
  const idx = hub.indexOf(needle);
  if (idx === -1) continue;
  const end = hub.indexOf("</a>", idx) + 4;
  const add = `<a href="${newHref}"><span>${newLabel}</span><span aria-hidden="true">→</span></a>`;
  hub = hub.slice(0, end) + add + hub.slice(end);
}
fs.writeFileSync(hubPath, hub);
console.log("hub updated");

// Sitemap
function upsertSitemap(sitemapPath) {
  let xml = fs.readFileSync(sitemapPath, "utf8");
  const today = "2026-10-23";
  for (const page of NEW_PAGES) {
    const loc = `https://gabbamedicalcentre.com.au/${page.file}`;
    if (xml.includes(loc)) continue;
    const entry = `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${today}</lastmod>\n  </url>\n`;
    // Insert before closing urlset, alphabetically near related pages
    xml = xml.replace("</urlset>", entry + "</urlset>");
  }
  fs.writeFileSync(sitemapPath, xml);
}
upsertSitemap(path.join(ROOT, "sitemap.xml"));
const publicSitemap = path.join(WEB_PUBLIC, "sitemap.xml");
if (fs.existsSync(publicSitemap)) upsertSitemap(publicSitemap);
console.log("sitemap updated");

// Navigation ownership
const ownershipPath = path.join(ROOT, "navigation-ownership.json");
const ownership = JSON.parse(fs.readFileSync(ownershipPath, "utf8"));
for (const page of NEW_PAGES) {
  ownership.pages = ownership.pages || ownership;
  const target = ownership.pages ? ownership.pages : ownership;
  // file structure uses top-level pages map
}
const pagesMap = ownership.pages || ownership;
// Detect structure
const hasPagesKey = Boolean(ownership.pages);
const map = hasPagesKey ? ownership.pages : ownership;
for (const page of NEW_PAGES) {
  map[page.file] = {
    section: "patient-info",
    breadcrumbs: [
      { label: "Home", path: "index.html" },
      { label: "Patient Information", path: "patient-information.html" },
      { label: page.label, path: page.file },
    ],
  };
}
fs.writeFileSync(ownershipPath, JSON.stringify(ownership, null, 2) + "\n");
console.log("ownership updated");

// EXPECTED_PAGES
const validatePath = path.join(WEB_SRC, "importer/validate-golden-html.ts");
let validate = fs.readFileSync(validatePath, "utf8");
validate = validate.replace(/const EXPECTED_PAGES = 199;/, "const EXPECTED_PAGES = 202;");
fs.writeFileSync(validatePath, validate);
console.log("EXPECTED_PAGES -> 202");

// Digital Reception DIRECT_PAGES
function patchDrJs(filePath) {
  let js = fs.readFileSync(filePath, "utf8");
  if (!js.includes("identifying-hotdoc-scam-messages.html")) {
    js = js.replace(
      "[/\\b(results?|test results?|blood test|pathology report|scan result)\\b/,'test-results.html'],",
      `[/\\b(results?|test results?|blood test|pathology report|scan result)\\b/,'test-results.html'],
    [/\\b(recall|recalls|reminder|reminders)\\b/,'recalls-and-reminders.html'],
    [/\\b(scam|phishing|hotdoc message|fake (?:sms|text|email)|suspicious message)\\b/,'identifying-hotdoc-scam-messages.html'],
    [/\\b(assignment of benefit|\\baob\\b|bulk billing consent|medicare consent)\\b/,'assignment-of-benefit.html'],`
    );
    fs.writeFileSync(filePath, js);
    return true;
  }
  return false;
}
patchDrJs(path.join(ROOT, "digital-reception.js"));
patchDrJs(path.join(WEB_PUBLIC, "digital-reception.js"));
console.log("DR routing patched");

// Build DR index entries from HTML
function stripTags(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractEntry(file, keywords) {
  const html = fs.readFileSync(path.join(ROOT, file), "utf8");
  const title = (html.match(/<title>([^<]+)<\/title>/) || [,""])[1].replace(/ \| Woolloongabba Medical Centre$/, "");
  const h1 = (html.match(/<h1>([^<]+)<\/h1>/) || [, title])[1];
  const description = (html.match(/name="description" content="([^"]+)"/) || html.match(/content="([^"]+)" name="description"/) || [,""])[1];
  const headings = [...html.matchAll(/<h2>([^<]+)<\/h2>/g)].map((m) => m[1].replace(/&amp;/g, "&"));
  const main = (html.match(/<main[\s\S]*?<\/main>/) || [""])[0]
    .replace(/<aside[\s\S]*?<\/aside>/g, " ")
    .replace(/<header[\s\S]*?<\/header>/g, " ")
    .replace(/<nav[\s\S]*?<\/nav>/g, " ")
    .replace(/<script[\s\S]*?<\/script>/g, " ");
  const related = [...html.matchAll(/class="resource-link"[^>]*href="([^"]+)"/g)]
    .map((m) => m[1])
    .filter((u) => !u.startsWith("http") && !u.startsWith("tel:"))
    .slice(0, 5);
  return {
    title,
    h1,
    category: "Patient Information",
    description,
    headings,
    keywords: ["patient information", "appointment guidance", "patient help", ...keywords],
    related,
    text: stripTags(main).slice(0, 5000),
    url: file,
  };
}

function upsertIndex(indexPath) {
  let raw = fs.readFileSync(indexPath, "utf8");
  const start = raw.indexOf("[");
  const end = raw.lastIndexOf("]") + 1;
  const arr = JSON.parse(raw.slice(start, end));
  for (const page of NEW_PAGES) {
    const entry = extractEntry(page.file, page.keywords);
    const idx = arr.findIndex((e) => e.url === page.file);
    if (idx >= 0) arr[idx] = entry;
    else arr.push(entry);
  }
  arr.sort((a, b) => a.url.localeCompare(b.url));
  const out = "window.WMC_DIGITAL_RECEPTION_INDEX = " + JSON.stringify(arr) + ";\n";
  fs.writeFileSync(indexPath, out);
  return arr;
}

const entries = upsertIndex(path.join(ROOT, "digital-reception-index.js"));
upsertIndex(path.join(WEB_PUBLIC, "digital-reception-index.js"));
console.log("DR index entries", entries.length);

// Search shards
const SHARDS = [
  "symptoms",
  "conditions",
  "mental-health",
  "life-stages",
  "prevention",
  "services",
  "doctors",
  "billing",
  "appointments",
  "referrals",
  "pathology",
  "imaging",
  "prescriptions",
  "administration",
];

function classify(url, category) {
  if (category === "Doctor" || url.startsWith("doctors/")) return "doctors";
  if (category === "Service" || url.startsWith("services/")) {
    if (url.includes("pathology")) return "pathology";
    if (url.includes("radiology") || url.includes("ecg")) return "imaging";
    return "services";
  }
  if (url.includes("referrals")) return "referrals";
  if (/scripts|prescrib|prescription/.test(url)) return "prescriptions";
  if (/result|pathology/.test(url) && !url.includes("recalls")) return "pathology";
  if (/billing|medicare|fees|bulk-billing|assignment-of-benefit/.test(url)) return "billing";
  if (/appointment|telehealth|after-hours|recalls|identifying-hotdoc/.test(url)) return "appointments";
  if (category === "Knowledge Centre") return "prevention";
  if (category === "Patient Information") {
    if (/billing|medicare|fees|assignment/.test(url)) return "billing";
    if (/appointment|telehealth|after-hours|recall|hotdoc-scam|book-/.test(url)) return "appointments";
  }
  return "administration";
}

const shards = Object.fromEntries(SHARDS.map((n) => [n, []]));
const routing = {};
const STOP = new Set(["a","an","the","i","is","are","in","at","to","for","from","my","me","can","how","do","does","of","with","about","what","where","when","and","or","we","your","you","our","on","please","have","get","find","need"]);
const strong = {};

for (const e of entries) {
  const name = classify(e.url, e.category);
  shards[name].push(e);
  routing[e.url] = name;
  const text = [e.title, e.h1, e.description, ...(e.headings || []), ...(e.keywords || [])].join(" ").toLowerCase();
  for (const term of new Set(text.match(/[a-z0-9]+/g) || [])) {
    if (!STOP.has(term)) {
      strong[term] = (strong[term] || 0) | (1 << SHARDS.indexOf(name));
    }
  }
}

const catalog = entries.map((e) => ({
  url: e.url,
  title: e.title,
  h1: e.h1,
  category: e.category,
  description: e.description,
  related: e.related,
}));

const searchDir = path.join(ROOT, "search-index");
const publicSearchDir = path.join(WEB_PUBLIC, "search-index");
for (const name of SHARDS) {
  const payload = JSON.stringify(shards[name]) + "\n";
  fs.writeFileSync(path.join(searchDir, name + ".json"), payload);
  if (fs.existsSync(publicSearchDir)) fs.writeFileSync(path.join(publicSearchDir, name + ".json"), payload);
}
const manifest = {
  schema: 1,
  count: entries.length,
  shards: SHARDS,
  routes: routing,
  strong,
  catalog,
};
const manPayload = JSON.stringify(manifest) + "\n";
fs.writeFileSync(path.join(searchDir, "manifest.json"), manPayload);
if (fs.existsSync(publicSearchDir)) fs.writeFileSync(path.join(publicSearchDir, "manifest.json"), manPayload);
console.log("search shards rebuilt", manifest.count);

// SPECIAL keywords in build script for future rebuilds
const builder = path.join(ROOT, "cms/tools/build_digital_reception_index.py");
if (fs.existsSync(builder)) {
  let py = fs.readFileSync(builder, "utf8");
  if (!py.includes("identifying-hotdoc-scam-messages.html")) {
    py = py.replace(
      "'test-results.html':['pathology results','test results','blood results','scan result','recall','follow up'],",
      `'test-results.html':['pathology results','test results','blood results','scan result','recall','follow up'],
'identifying-hotdoc-scam-messages.html':['hotdoc','scam','phishing','sms safety','htd.io','legitimate message'],
'recalls-and-reminders.html':['recall','reminder','follow up','correspondence','preventive care','hotdoc'],
'assignment-of-benefit.html':['assignment of benefit','aob','bulk billing consent','medicare consent'],`
    );
    fs.writeFileSync(builder, py);
    console.log("SPECIAL keywords added to builder");
  }
}

console.log("wire complete");
