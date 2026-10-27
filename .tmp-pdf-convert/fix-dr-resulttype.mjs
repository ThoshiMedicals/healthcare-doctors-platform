import fs from 'node:fs';
const p = new URL('../old-html/digital-reception.js', import.meta.url);
let s = fs.readFileSync(p, 'utf8');
const from = `    const resultType=activeIntent==='clinical'?'care_journey':(directEntry?'direct_page':'direct_page');
    recordSearch(q,resultType,shownResults.length);`;
const to = `    recordSearch(q,activeIntent==='clinical'?'care_journey':'direct_page',shownResults.length);`;
if (!s.includes(from)) {
  console.error('pattern missing');
  process.exit(1);
}
fs.writeFileSync(p, s.replace(from, to));
console.log('fixed');
