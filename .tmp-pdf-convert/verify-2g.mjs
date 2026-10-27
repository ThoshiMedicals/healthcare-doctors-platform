import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const oldHtml = path.join(root, 'old-html');

const localStorage = (() => {
  const map = new Map();
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k)
  };
})();

const sessionStorage = (() => {
  const map = new Map();
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k)
  };
})();

const documentElement = { dataset: {} };
const sandbox = {
  console,
  window: {},
  globalThis: {},
  location: { pathname: '/knowledge/articles/living-with-diabetes.html', href: 'http://127.0.0.1:3100/knowledge/articles/living-with-diabetes.html' },
  sessionStorage,
  localStorage,
  dataLayer: [],
  document: {
    documentElement,
    readyState: 'complete',
    scripts: [],
    addEventListener() {},
    querySelectorAll() { return []; }
  },
  CustomEvent: class CustomEvent {
    constructor(type, init) { this.type = type; this.detail = init && init.detail; }
  },
  dispatchEvent() {}
};
sandbox.window = sandbox;
sandbox.globalThis = sandbox;
sandbox.root = sandbox;

vm.runInNewContext(fs.readFileSync(path.join(oldHtml, 'measurement.js'), 'utf8'), sandbox, { filename: 'measurement.js' });

const M = sandbox.WMCMeasurement;
const events = [];
sandbox.dataLayer = events;
sandbox.window.dataLayer = events;

const pageView = M.record('page_view', { page_group: M.pageGroup() });
const book = M.record('book_appointment_click', { placement: 'header', destination: 'clinic_list' });
const call = M.record('call_clinic_click', { placement: 'header' });
const task = M.record('task_shortcut_click', { task: 'fees', surface: 'header' });
const open = M.record('digital_reception_open', {});
const search = M.record('digital_reception_search', {
  intent_bucket: M.intentBucket('diabetes'),
  result_type: 'care_journey',
  result_count: 3,
  query: 'diabetes must not remain'
});
M.retainDebugQuery('diabetes', {
  intent_bucket: M.intentBucket('diabetes'),
  result_type: 'care_journey',
  result_count: 3
});
const result = M.record('digital_reception_result_click', {
  step: 'article',
  intent_bucket: M.intentBucket('diabetes')
});

const indexHtml = fs.readFileSync(path.join(oldHtml, 'index.html'), 'utf8');
const knowledgeHtml = fs.readFileSync(path.join(oldHtml, 'knowledge', 'index.html'), 'utf8');
const dr = fs.readFileSync(path.join(oldHtml, 'digital-reception.js'), 'utf8');
const docs = fs.readFileSync(path.join(oldHtml, 'qa', 'MEASUREMENT_VALIDATION.md'), 'utf8');

const report = {
  pageGroupAdviceArticle: M.pageGroup('knowledge/articles/living-with-diabetes.html'),
  pageGroupHome: M.pageGroup('index.html'),
  pageGroupService: M.pageGroup('services/skin-checks.html'),
  intentDiabetes: M.intentBucket('diabetes'),
  intentFees: M.intentBucket('fees'),
  intentDigitsStripped: M.intentBucket('call 0732173344 fees'),
  searchHasNoQuery: !Object.prototype.hasOwnProperty.call(search, 'query'),
  debugRows: M.readDebugStore().length,
  debugHasQuery: Boolean(M.readDebugStore()[0] && M.readDebugStore()[0].query),
  coreEventsPresent: ['page_view', 'book_appointment_click', 'call_clinic_click', 'task_shortcut_click', 'digital_reception_open', 'digital_reception_search', 'digital_reception_result_click']
    .every((name) => events.some((row) => row.event === name)),
  htmlWired: /measurement\.js/.test(indexHtml) && /measurement\.js/.test(knowledgeHtml),
  drHooks: /digital_reception_open/.test(dr) && /digital_reception_search/.test(dr) && /digital_reception_result_click/.test(dr),
  docsPresent: /PROMPT 2G/.test(docs) && /14-day/.test(docs),
  recorded: { pageView, book, call, task, open, search, result }
};

console.log(JSON.stringify(report, null, 2));
const ok =
  report.pageGroupAdviceArticle === 'advice_article' &&
  report.pageGroupHome === 'home' &&
  report.pageGroupService === 'service' &&
  report.intentDiabetes === 'diabetes' &&
  report.intentFees === 'fees_billing' &&
  report.searchHasNoQuery &&
  report.debugRows === 1 &&
  report.debugHasQuery &&
  report.coreEventsPresent &&
  report.htmlWired &&
  report.drHooks &&
  report.docsPresent;

if (!ok) {
  console.error('VERIFY_2G_FAILED');
  process.exit(1);
}
console.log('VERIFY_2G_OK');
