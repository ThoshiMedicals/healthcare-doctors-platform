/**
 * PROMPT 2C — practitioner routing from published leads; directory fallback otherwise.
 * Extracts routing helpers from digital-reception.js without a browser.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = fs.readFileSync(path.join(root, 'old-html', 'digital-reception.js'), 'utf8');

const extract = (startRe, endRe) => {
  const start = src.search(startRe);
  if (start < 0) throw new Error('missing start ' + startRe);
  const end = src.slice(start).search(endRe);
  if (end < 0) throw new Error('missing end ' + endRe);
  return src.slice(start, start + end);
};

const practitionersBlock = extract(
  /const PRACTITIONER_HOTDOC=/,
  /\n  const PRACTITIONER_TOPICS=/
);
const topicsBlock = extract(
  /const PRACTITIONER_TOPICS=\[/,
  /\n  const PRACTITIONER_LANGS=/
);
const routesBlock = extract(
  /const LEAD_ROUTES=\[/,
  /\n  const DIRECTORY_FALLBACK_RE=/
);
const directoryBlock = extract(
  /const DIRECTORY_FALLBACK_RE=/,
  /\n  const usesDirectoryFallback=/
);

const norm = s => String(s || '').toLowerCase().normalize('NFKD').replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
const foldPractitionerQuery = raw => norm(raw).replace(/\bmen s\b/g, 'mens').replace(/\bwomen s\b/g, 'womens');

const env = {};
new Function(
  'env',
  `${practitionersBlock}\n${topicsBlock}\n${routesBlock}\n${directoryBlock}\nenv.PRACTITIONERS=PRACTITIONERS;env.PRACTITIONER_TOPICS=PRACTITIONER_TOPICS;env.LEAD_ROUTES=LEAD_ROUTES;env.DIRECTORY_FALLBACK_RE=DIRECTORY_FALLBACK_RE;`
)(env);

const { PRACTITIONERS, LEAD_ROUTES, DIRECTORY_FALLBACK_RE } = env;
const usesDirectoryFallback = q => DIRECTORY_FALLBACK_RE.test(q) && !LEAD_ROUTES.some(item => item.re.test(q));
const practitionerBlocked = (person, q) => {
  const male = /\bmale\b/.test(q) || /\bprostate\b/.test(q) || /\bmens health\b/.test(q);
  const female = /\bfemale\b/.test(q) || /\b(woman|womens|menopause|cervical)\b/.test(q) || /\bpregnan/.test(q) || /\bantenatal\b/.test(q) || /\bmaternity\b/.test(q);
  if (person.id === 'ranawake' && male) return true;
  if (person.id === 'gul' && female && !male) return true;
  return false;
};
const routedLeads = q => {
  const route = LEAD_ROUTES.find(item => item.re.test(q));
  if (!route) return null;
  const people = [];
  for (const id of route.ids) {
    const person = PRACTITIONERS.find(item => item.id === id);
    if (!person || practitionerBlocked(person, q)) continue;
    const lead = (person.leads || []).find(item => route.tags.includes(item.tag));
    const also = !lead && (person.also || []).some(tag => route.tags.includes(tag));
    if (!lead && !also) continue;
    people.push(person.id);
  }
  return people;
};
const suggest = raw => {
  const q = foldPractitionerQuery(raw || '');
  if (!q || usesDirectoryFallback(q)) return [];
  const routed = routedLeads(q);
  if (routed !== null) return routed;
  return null; // non-lead clinical — not asserted here
};

const expect = (label, got, want) => {
  const a = JSON.stringify(got);
  const b = JSON.stringify(want);
  if (a !== b) throw new Error(`${label}: got ${a} want ${b}`);
};

expect('mental health', suggest('mental health'), ['sumita', 'tanya']);
expect('anxiety', suggest('anxiety'), ['sumita', 'tanya']);
expect('skin checks', suggest('skin checks'), ['anand', 'tanya', 'karimi']);
expect('diabetes', suggest('diabetes'), ['wasantha', 'tanya']);
expect("women's health", suggest("women's health"), ['sumita', 'anand', 'tanya']);
expect('cervical', suggest('cervical screening'), ['sumita', 'anand', 'tanya']);

for (const q of ['vaccination', 'telehealth', 'new patient', 'referral', 'repeat script', 'test results']) {
  expect(q + ' directory', suggest(q), []);
  if (!usesDirectoryFallback(foldPractitionerQuery(q))) throw new Error(q + ' should use directory');
}

// Ranawake has a mental-health lead on profile but is not a published route lead.
const mh = suggest('mental health');
if (mh.includes('ranawake')) throw new Error('mental health must not use page-order / Ranawake');

// No journey helper may derive doctors from related-page order.
if (/related\.map\(getEntry\).*Doctor|category===['"]Doctor['"].*related|first doctor listed/i.test(src)) {
  throw new Error('page-order doctor derivation detected');
}
if (!/team-general-practitioners\.html/.test(src) || !/GP directory/.test(src)) {
  throw new Error('GP directory fallback markup missing');
}

console.log('VERIFY_2C_OK');
console.log(JSON.stringify({
  mental_health: suggest('mental health'),
  skin: suggest('skin checks'),
  diabetes: suggest('diabetes'),
  womens: suggest("women's health"),
  directory: ['vaccination', 'telehealth', 'new patient', 'referral', 'repeat script', 'test results'].map(q => [q, suggest(q)])
}, null, 2));
