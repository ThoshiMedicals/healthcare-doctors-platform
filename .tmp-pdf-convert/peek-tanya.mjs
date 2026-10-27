import fs from 'fs';
const html = fs.readFileSync('old-html/doctors/dr-tanya-goodwill.html', 'utf8');
for (const id of ['areas-of-care', 'professional-interests', 'related-services', 'related-practitioners', 'patient-guides']) {
  const i = html.indexOf(`id="${id}"`);
  console.log('\n====', id, i);
  if (i >= 0) console.log(html.slice(i, i + 900));
}
const skin = fs.readFileSync('old-html/services/skin-checks.html', 'utf8');
const j = skin.search(/related-practitioners|Related practitioners/i);
console.log('\n==== skin related', j);
if (j >= 0) console.log(skin.slice(j, j + 1200));
const art = fs.readFileSync(
  'old-html/knowledge/articles/understanding-type-2-diabetes.html',
  'utf8'
);
const k = art.search(/related-practitioners/i);
console.log('\n==== article related', k);
if (k >= 0) console.log(art.slice(k, k + 1100));
