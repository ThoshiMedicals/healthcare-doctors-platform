import fs from "fs";
import path from "path";
import vm from "vm";

const root = "C:/Users/RoshanSamarawickrema/Desktop/WMC-Master-Project/apps/web/public";
const jsPath = "C:/Users/RoshanSamarawickrema/Desktop/WMC-Master-Project/old-html/digital-reception.js";
const code = fs.readFileSync(jsPath, "utf8");

function sliceBetween(startMark, endMark) {
  const a = code.indexOf(startMark);
  const b = code.indexOf(endMark, a + startMark.length);
  if (a < 0 || b < 0) throw new Error("missing " + startMark);
  return code.slice(a, b);
}

const prelude = `
const norm = s => String(s || '').toLowerCase().normalize('NFKD').replace(/[^a-z0-9\\s]/g,' ').replace(/\\s+/g,' ').trim();
${sliceBetween("const synonyms = {", "const stopwords")}
${sliceBetween("const stopwords", "const expand")}
${sliceBetween("const expand = q =>", "const emergency")}
const GENERIC_QUESTION_WORDS=new Set(['concerned','worried','doctor','gp','should','could','would','see','speak','help','causes','cause','frequent','often','regular','understanding','understand','explained','explain','during','happens','happen','seek','care','health','issue','issues','problem','problems','symptom','symptoms','about','much','been','long','away','always','be','being','was','were','has','had','will','would','am','it','its','why','vs','versus','won','difference','between','s','their','health']);
${sliceBetween("const TOPIC_SIGNALS = [", "const RESULTS_PER_PAGE")}
${sliceBetween("const DIRECT_PAGES=[", "const blockedDestinations")}
${sliceBetween("const blockedDestinations=query=>{", "const unpublishedPatientLanguage")}
${sliceBetween("const score = (record, tokens, query) => {", "const esc")}
${sliceBetween("const canonical=text=>", "const hasWord")}
const hasWord=(field,word)=>(' '+canonical(field)+' ').includes(' '+canonical(word)+' ');
Object.assign(globalThis, {norm, synonyms, stopwords, expand, GENERIC_QUESTION_WORDS, TOPIC_SIGNALS, DIRECT_PAGES, blockedDestinations, score, canonical, hasWord});
`;

const sandbox = {};
vm.createContext(sandbox);
vm.runInContext(prelude, sandbox);

const manifest = JSON.parse(fs.readFileSync(path.join(root, "search-index/manifest.json"), "utf8"));
const shards = {};
for (const name of manifest.shards) {
  shards[name] = JSON.parse(fs.readFileSync(path.join(root, "search-index", name + ".json"), "utf8"));
}
const catalogByUrl = new Map(manifest.catalog.map(e => [e.url, e]));
const normalizedEntry = x => ({
  entry: x,
  title: sandbox.norm(x.title + " " + x.h1),
  head: sandbox.norm((x.headings || []).join(" ")),
  keywords: sandbox.norm((x.keywords || []).join(" ")),
  description: sandbox.norm(x.description),
  content: sandbox.norm(x.text),
  relationships: sandbox.norm((x.related || []).join(" ")),
  category: x.category,
});
const allRecords = manifest.shards.flatMap(name => shards[name].map(normalizedEntry));

function shardMask(query, hints, direct) {
  if (direct) return { directOnly: true, names: [] };
  const words = sandbox.norm(query).split(" ").filter(w => w && !sandbox.stopwords.has(w) && !sandbox.GENERIC_QUESTION_WORDS.has(w));
  let mask = 0;
  for (const term of words) {
    mask |= (manifest.strong[term] || 0);
    if (term.endsWith("s") && term.length > 4) mask |= (manifest.strong[term.slice(0, -1)] || 0);
  }
  const targets = [...(hints || []), ...(direct ? [direct[1]] : [])];
  for (const url of targets) {
    const name = manifest.routes[url];
    const idx = manifest.shards.indexOf(name);
    if (idx >= 0) mask |= (1 << idx);
  }
  if (!mask) mask = (1 << manifest.shards.length) - 1;
  const names = manifest.shards.filter((_, i) => (mask & (1 << i)) !== 0);
  return { directOnly: false, names };
}

function rank(raw) {
  const q = String(raw || "").trim();
  const query = sandbox.norm(q);
  const blocked = sandbox.blockedDestinations(query);
  const hints = sandbox.TOPIC_SIGNALS.filter(([pattern, url]) => pattern.test(query) && !blocked.has(url)).map(([, url]) => url);
  const directListed = sandbox.DIRECT_PAGES.find(([pattern]) => pattern.test(query));
  const direct = directListed || null;
  const loaded = shardMask(q, hints, direct);
  const records = loaded.directOnly ? [] : allRecords.filter(r => loaded.names.includes(manifest.routes[r.entry.url]));
  const tokens = sandbox.expand(q);
  const contentTerms = query.split(" ").filter(w => w.length > 2 && !sandbox.stopwords.has(w) && !sandbox.GENERIC_QUESTION_WORDS.has(w));
  const matched = records.map(record => {
    const entry = record.entry;
    const isGuide = entry.category === "Knowledge Centre" && entry.url.startsWith("knowledge/articles/");
    const text = sandbox.canonical(entry.title + " " + entry.h1);
    const titleHits = contentTerms.filter(t => sandbox.hasWord(text, t)).length;
    const keywordHits = contentTerms.filter(t => sandbox.hasWord(record.keywords, t)).length;
    const hintIndex = hints.indexOf(entry.url);
    const hinted = hintIndex !== -1;
    const base = sandbox.score(record, tokens, query);
    const strongGuide = isGuide && (hinted || titleHits > 0 || (keywordHits >= 2 && base >= 25));
    const suitableOther = !isGuide && entry.category !== "Doctor" && entry.category !== "Team" && base >= 18 &&
      (titleHits > 0 || keywordHits > 0 || record.title.includes(query));
    const rankScore = base + titleHits * 34 + (hinted ? 190 - hintIndex : 0) + (isGuide ? 25 : 0);
    return { entry, isGuide, strongGuide, suitableOther, rank: rankScore, base, hinted, titleHits, keywordHits };
  });
  const guideMatches = matched.filter(item => item.strongGuide && !blocked.has(item.entry.url))
    .sort((a, b) => b.rank - a.rank || a.entry.title.localeCompare(b.entry.title));
  const otherMatches = matched.filter(item => item.suitableOther && !blocked.has(item.entry.url))
    .sort((a, b) => b.rank - a.rank || a.entry.title.localeCompare(b.entry.title));
  const directEntry = direct && !blocked.has(direct[1]) ? (catalogByUrl.get(direct[1]) || null) : null;
  const mode = directEntry ? "direct" : (guideMatches.length ? "clinical" : (otherMatches.length ? "task-fallback" : "none"));
  const shown = directEntry ? [directEntry] : (guideMatches.length ? guideMatches.map(i => i.entry) : otherMatches.map(i => i.entry));
  const top = (rows, n = 6) => rows.slice(0, n).map(item => ({
    url: item.entry.url,
    title: item.entry.title,
    category: item.entry.category,
    rank: item.rank,
    base: item.base,
    hinted: item.hinted,
  }));
  const firstRelatedService = shown[0] && (shown[0].related || []).map(u => catalogByUrl.get(u)).find(e => e && e.category === "Service" && e.url.startsWith("services/"));
  return {
    query: raw,
    mode,
    directUrl: directEntry ? directEntry.url : null,
    hints,
    shards: loaded.names,
    shown: shown.slice(0, 6).map(e => ({ url: e.url, title: e.title, category: e.category })),
    guides: top(guideMatches),
    others: top(otherMatches),
    journeyService: firstRelatedService ? { url: firstRelatedService.url, title: firstRelatedService.title } : null,
    tokens,
  };
}

const queries = [
  ["Appointment", ["appointment", "book appointment", "book", "booking", "make an appointment", "see a doctor", "gp appointment", "gp visit"]],
  ["New Patient", ["new patient", "new patients", "i am new", "first visit", "register", "new to the clinic", "join the practice", "new here", "enrol"]],
  ["Repeat Script", ["repeat script", "script", "prescription", "repeat prescription", "refill", "renew medication", "need a script"]],
  ["Referral", ["referral", "referrals", "specialist referral", "refer me", "need a referral", "specialist"]],
  ["Test Results", ["test results", "results", "my results", "blood test", "pathology", "pathology report", "scan result"]],
  ["Telehealth", ["telehealth", "video appointment", "phone appointment", "phone consult", "video call", "online appointment", "book telehealth", "virtual appointment"]],
  ["Skin Check", ["skin check", "skin checks", "mole check", "skin cancer check", "check a mole", "full skin check", "book a skin check"]],
  ["Vaccination", ["vaccination", "vaccine", "immunisation", "flu shot", "flu vaccine", "travel vaccine", "childhood vaccination", "needles", "book a vaccination", "jab", "shot", "booster"]],
  ["Diabetes", ["diabetes", "diabetic", "type 2 diabetes", "blood sugar", "hba1c", "diabetes care plan", "glucose"]],
  ["Women's Health", ["womens health", "women's health", "female health", "pap smear", "cervical screening", "contraception"]],
  ["Mental Health", ["mental health", "anxiety", "depression", "stress", "mental health care plan", "burnout"]],
  ["HotDoc Messages", ["hotdoc messages", "hotdoc message", "hotdoc", "scam", "fake sms", "suspicious message", "phishing", "hotdoc sms"]],
  ["Fees", ["fees", "cost", "pricing", "how much", "consultation fee", "gap fee"]],
  ["Bulk Billing", ["bulk billing", "bulk bill", "bulk billed", "do you bulk bill", "medicare bulk bill"]],
  ["Results", ["results", "my results are in", "when will my results", "lab results"]],
  ["Chronic Disease Care", ["chronic disease", "chronic disease care", "care plan", "chronic condition", "ongoing care", "management plan"]],
];

const out = {};
for (const [intent, list] of queries) {
  out[intent] = list.map(rank);
}
fs.writeFileSync("C:/Users/RoshanSamarawickrema/Desktop/WMC-Master-Project/.tmp-pdf-convert/phase1-after.json", JSON.stringify(out, null, 2));
console.log("wrote", Object.keys(out).length, "intents");
for (const [intent, rows] of Object.entries(out)) {
  const head = rows[0];
  console.log("\n## " + intent + " [" + head.mode + "] " + (head.shown[0] ? head.shown[0].url : "NONE"));
  console.log("  hints:", head.hints.slice(0, 3).join(" | ") || "-");
  console.log("  shown:", head.shown.slice(0, 4).map(s => s.title).join(" > ") || "-");
}
