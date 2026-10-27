import fs from "fs";
import path from "path";
import vm from "vm";

const root = "C:/Users/RoshanSamarawickrema/Desktop/WMC-Master-Project";
const htmlRoot = path.join(root, "old-html");
const publicRoot = path.join(root, "apps/web/public");

const ks = fs.readFileSync(path.join(htmlRoot, "knowledge-search.js"), "utf8");
const ksSandbox = { window: undefined, document: undefined, globalThis: {} };
ksSandbox.globalThis = ksSandbox;
vm.createContext(ksSandbox);
vm.runInContext(ks, ksSandbox);
const matchGuides = ksSandbox.WMCKnowledgeGuideSearch.matchGuides;
const guides = ksSandbox.WMCKnowledgeGuideSearch.guides;

const drCode = fs.readFileSync(path.join(htmlRoot, "digital-reception.js"), "utf8");
function sliceBetween(code, startMark, endMark) {
  const a = code.indexOf(startMark);
  const b = code.indexOf(endMark, a + startMark.length);
  if (a < 0 || b < 0) throw new Error("missing " + startMark);
  return code.slice(a, b);
}
const prelude = `
const norm = s => String(s || '').toLowerCase().normalize('NFKD').replace(/[^a-z0-9\\s]/g,' ').replace(/\\s+/g,' ').trim();
${sliceBetween(drCode, "const synonyms = {", "const stopwords")}
${sliceBetween(drCode, "const stopwords", "const expand")}
const expand = q => { const raw=norm(q).split(' ').filter(w=>w&&!stopwords.has(w));const terms=new Set(raw); for(const w of raw){for(const extra of (synonyms[w]||[])){for(const t of norm(extra).split(' ')){if(t&&!stopwords.has(t))terms.add(t)}}}return [...terms]; };
const GENERIC_QUESTION_WORDS=new Set(['concerned','worried','doctor','gp','should','could','would','see','speak','help','causes','cause','frequent','often','regular','understanding','understand','explained','explain','during','happens','happen','seek','care','health','issue','issues','problem','problems','symptom','symptoms','about','much','been','long','away','always','be','being','was','were','has','had','will','would','am','it','its','why','vs','versus','won','difference','between','s','their','health']);
${sliceBetween(drCode, "const TOPIC_SIGNALS = [", "const RESULTS_PER_PAGE")}
${sliceBetween(drCode, "const DIRECT_PAGES=[", "const blockedDestinations")}
${sliceBetween(drCode, "const blockedDestinations=query=>{", "const unpublishedPatientLanguage")}
${sliceBetween(drCode, "const score = (record, tokens, query) => {", "const esc")}
const canonical=text=>norm(text).replace(/\\bheadaches\\b/g,'headache').replace(/\\bcoughs\\b/g,'cough').replace(/\\bpains\\b/g,'pain').replace(/\\bvaccinations\\b/g,'vaccination');
const hasWord=(field,word)=>(' '+canonical(field)+' ').includes(' '+canonical(word)+' ');
Object.assign(globalThis, {norm, synonyms, stopwords, expand, GENERIC_QUESTION_WORDS, TOPIC_SIGNALS, DIRECT_PAGES, blockedDestinations, score, canonical, hasWord});
`;
const sandbox = {};
vm.createContext(sandbox);
vm.runInContext(prelude, sandbox);

const manifest = JSON.parse(fs.readFileSync(path.join(publicRoot, "search-index/manifest.json"), "utf8"));
const shards = {};
for (const name of manifest.shards) {
  shards[name] = JSON.parse(fs.readFileSync(path.join(publicRoot, "search-index", name + ".json"), "utf8"));
}
const catalogByUrl = new Map(manifest.catalog.map(e => [e.url, e]));
const allRecords = manifest.shards.flatMap(name => shards[name].map(x => ({
  entry: x,
  title: sandbox.norm(x.title + " " + x.h1),
  head: sandbox.norm((x.headings || []).join(" ")),
  keywords: sandbox.norm((x.keywords || []).join(" ")),
  description: sandbox.norm(x.description),
  content: sandbox.norm(x.text),
  relationships: sandbox.norm((x.related || []).join(" ")),
  category: x.category,
})));

function rank(raw) {
  const q = String(raw || "").trim();
  const query = sandbox.norm(q);
  const blocked = sandbox.blockedDestinations(query);
  const hints = sandbox.TOPIC_SIGNALS.filter(([pattern, url]) => pattern.test(query) && !blocked.has(url)).map(([, url]) => url);
  const directListed = sandbox.DIRECT_PAGES.find(([pattern]) => pattern.test(query));
  const direct = directListed || null;
  const words = query.split(" ").filter(w => w && !sandbox.stopwords.has(w) && !sandbox.GENERIC_QUESTION_WORDS.has(w));
  let mask = 0;
  if (!direct) {
    for (const term of words) {
      mask |= (manifest.strong[term] || 0);
      if (term.endsWith("s") && term.length > 4) mask |= (manifest.strong[term.slice(0, -1)] || 0);
    }
    for (const url of hints) {
      const name = manifest.routes[url];
      const idx = manifest.shards.indexOf(name);
      if (idx >= 0) mask |= (1 << idx);
    }
    if (!mask) mask = (1 << manifest.shards.length) - 1;
  }
  const names = direct ? [] : manifest.shards.filter((_, i) => (mask & (1 << i)) !== 0);
  const records = direct ? [] : allRecords.filter(r => names.includes(manifest.routes[r.entry.url]));
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
    const rankScore = base + titleHits * 34 + (hinted ? 165 - hintIndex : 0) + (isGuide ? 25 : 0);
    return { entry, strongGuide, suitableOther, rank: rankScore };
  });
  const guideMatches = matched.filter(item => item.strongGuide && !blocked.has(item.entry.url))
    .sort((a, b) => b.rank - a.rank || a.entry.title.localeCompare(b.entry.title));
  const otherMatches = matched.filter(item => item.suitableOther && !blocked.has(item.entry.url))
    .sort((a, b) => b.rank - a.rank || a.entry.title.localeCompare(b.entry.title));
  const directEntry = direct && !blocked.has(direct[1]) ? (catalogByUrl.get(direct[1]) || { url: direct[1], title: direct[1], category: "direct" }) : null;
  const mode = directEntry ? "direct" : (guideMatches.length ? "clinical" : (otherMatches.length ? "other" : "none"));
  const shown = directEntry ? [directEntry] : (guideMatches.length ? guideMatches.map(i => i.entry) : otherMatches.map(i => i.entry));
  return {
    mode,
    first: shown[0] ? shown[0].title : "No result",
    url: shown[0] ? shown[0].url : "",
    next: shown.slice(1, 4).map(e => e.title),
    guideCount: guideMatches.length,
  };
}

const queries = [
  "skin check",
  "skin checks",
  "referral",
  "repeat script",
  "diabetes",
  "vaccination",
  "vaccinations",
  "vaccine",
  "fees",
  "telehealth",
  "new patient",
  "new patients",
  "HotDoc message",
  "hotdoc messages",
  "medical certificate",
];

const rows = queries.map(q => {
  const ksResult = matchGuides(q);
  const dr = rank(q);
  const ksShown = (ksResult.results || []).slice(0, 4).map(g => g.title);
  return {
    q,
    ksState: ksResult.state,
    ksCount: (ksResult.results || []).length,
    ksFirst: ksShown[0] || "No matching guide",
    ksNext: ksShown.slice(1),
    drMode: dr.mode,
    drFirst: dr.first,
    drUrl: dr.url,
    drNext: dr.next,
  };
});

const withAlias = guides.filter(g => g.aliases && g.aliases.length).length;
const hubs = new Set(guides.map(g => g.hub));
console.log(JSON.stringify({
  guideCount: guides.length,
  withAlias,
  withoutAlias: guides.length - withAlias,
  hubs: [...hubs],
}, null, 2));
console.log("---");
for (const row of rows) {
  console.log("\n## " + row.q);
  console.log("KC", row.ksState, row.ksCount, "|", row.ksFirst);
  if (row.ksNext.length) console.log("  then:", row.ksNext.join(" | "));
  console.log("DR", row.drMode, "|", row.drFirst, "|", row.drUrl);
  if (row.drNext.length) console.log("  then:", row.drNext.join(" | "));
}

function walk(dir, hits) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      if (name === "node_modules" || name === ".next") continue;
      walk(full, hits);
    } else if (name.endsWith(".html")) {
      const html = fs.readFileSync(full, "utf8");
      hits.push({
        file: path.relative(htmlRoot, full).replace(/\\/g, "/"),
        dr: html.includes("digital-reception.js"),
        ks: html.includes("knowledge-search.js"),
        form: html.includes("data-knowledge-guide-search"),
      });
    }
  }
}
const hits = [];
walk(htmlRoot, hits);
const summary = {
  html: hits.length,
  dr: hits.filter(h => h.dr).length,
  ksScript: hits.filter(h => h.ks).length,
  ksForm: hits.filter(h => h.form).length,
  formNotIndex: hits.filter(h => h.form && h.file !== "knowledge/index.html").map(h => h.file),
  ksScriptNotForm: hits.filter(h => h.ks && !h.form).map(h => h.file),
};
console.log("\nPAGES", JSON.stringify(summary, null, 2));

const panel = drCode.slice(drCode.indexOf("panel.innerHTML"), drCode.indexOf("panel.innerHTML") + 4000);
const quick = [...panel.matchAll(/>([^<]{2,40})<\/button>/g)].map(m => m[1]);
console.log("QUICK", quick);
