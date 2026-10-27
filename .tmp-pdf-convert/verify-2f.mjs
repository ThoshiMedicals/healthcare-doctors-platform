import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const oldHtml = path.join(root, 'old-html');

function loadScript(file, sandbox) {
  const code = fs.readFileSync(path.join(oldHtml, file), 'utf8');
  vm.runInNewContext(code, sandbox, { filename: file });
}

const sandbox = { window: {}, globalThis: {}, console };
sandbox.window = sandbox;
sandbox.globalThis = sandbox;
loadScript('search-alias-inventory.js', sandbox);
loadScript('knowledge-search.js', sandbox);

const match = sandbox.WMCKnowledgeGuideSearch.matchGuides;
const inv = sandbox.WMCSearchAliasInventory;

const diabetes = match('diabetes');
const telehealth = match('telehealth');
const tasks = ['fees', 'referral', 'repeat script', 'new patient', 'hotdoc message'].map((q) => ({
  q,
  state: match(q).state,
  query: match(q).task && match(q).task.query
}));

const dr = fs.readFileSync(path.join(oldHtml, 'digital-reception.js'), 'utf8');
const diabetesLead = [...dr.matchAll(/\[\\b\(diabetes\|diabetic\)\\b\/,\s*'([^']+)'/g)].map((m) => m[1]);
const telehealthLead = [...dr.matchAll(/telehealth\|video appointments[\s\S]*?,\s*'([^']+)'/g)].map((m) => m[1]);

const site = fs.readFileSync(path.join(oldHtml, 'site.js'), 'utf8');
const indexHtml = fs.readFileSync(path.join(oldHtml, 'knowledge', 'index.html'), 'utf8');

const report = {
  inventoryLeads: {
    diabetes: inv.leads.diabetes.guideUrl,
    telehealth: inv.leads.telehealth.guideUrl
  },
  guideLeads: {
    diabetes: diabetes.results[0] && diabetes.results[0].url,
    telehealth: telehealth.results[0] && telehealth.results[0].url
  },
  diabetesAgree: diabetes.results[0] && diabetes.results[0].url === inv.leads.diabetes.guideUrl,
  telehealthAgree: telehealth.results[0] && telehealth.results[0].url === inv.leads.telehealth.guideUrl,
  receptionDiabetesSignals: diabetesLead,
  receptionTelehealthSignals: telehealthLead,
  tasks,
  labels: {
    siteTaskShortcuts: /Task shortcuts/.test(site),
    guideSearchLabel: /<label for="knowledge-guide-query">Search<\/label>/.test(indexHtml),
    receptionSearchButton: /digital-reception-search" type="button">Search</.test(dr),
    receptionCompactSearch: /digital-reception-launcher-compact">Search</.test(dr),
    inventoryScript: /search-alias-inventory\.js/.test(indexHtml)
  },
  openApi: /WMCDigitalReception=\{[\s\S]*open\(query\)/.test(dr)
};

console.log(JSON.stringify(report, null, 2));
const ok =
  report.diabetesAgree &&
  report.telehealthAgree &&
  report.receptionDiabetesSignals[0] === inv.leads.diabetes.receptionUrl &&
  report.tasks.every((t) => t.state === 'task') &&
  report.labels.siteTaskShortcuts &&
  report.labels.guideSearchLabel &&
  report.labels.receptionSearchButton &&
  report.labels.receptionCompactSearch &&
  report.openApi;

if (!ok) {
  console.error('VERIFY_2F_FAILED');
  process.exit(1);
}
console.log('VERIFY_2F_OK');
