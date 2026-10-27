import fs from 'fs';

const path = 'old-html/navigation-ownership.json';
const data = JSON.parse(fs.readFileSync(path, 'utf8'));
const files = [
  'knowledge/articles/is-a-tummy-bug-the-same-as-gastro.html',
  'knowledge/articles/is-a-water-infection-the-same-as-a-uti.html',
  'knowledge/articles/is-hay-fever-a-fever.html',
  'knowledge/articles/is-this-sinus.html',
  'knowledge/articles/is-this-thrush.html',
  'knowledge/articles/what-are-school-sores.html',
];

for (const f of files) {
  const entry = data.pages[f];
  if (!entry) continue;
  for (const crumb of entry.breadcrumbs) {
    crumb.label = crumb.label.replace(/&amp;/g, '&').replace(/&#x27;/g, "'");
  }
}

fs.writeFileSync(path, JSON.stringify(data, null, 2) + '\n');
console.log('decoded ampersands for', files.length, 'entries');
